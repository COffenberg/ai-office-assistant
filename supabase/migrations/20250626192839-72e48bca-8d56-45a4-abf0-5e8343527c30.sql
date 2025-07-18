
-- Create invitations table for pending user invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Create index for better performance
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Admins can manage all invitations"
  ON public.invitations
  FOR ALL
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- Update the create_user_invitation function to use invitations table
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  user_email TEXT,
  user_full_name TEXT,
  user_role app_role DEFAULT 'employee'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_id UUID;
BEGIN
  -- Check if user already exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
    RAISE EXCEPTION 'User with email % already exists', user_email;
  END IF;
  
  -- Check if invitation already exists
  IF EXISTS (SELECT 1 FROM public.invitations WHERE email = user_email AND status = 'pending') THEN
    RAISE EXCEPTION 'Invitation for email % already exists', user_email;
  END IF;
  
  -- Insert invitation
  INSERT INTO public.invitations (email, full_name, role, invited_by)
  VALUES (user_email, user_full_name, user_role, auth.uid())
  RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$;

-- Function to accept invitation and create user profile
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token TEXT,
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Create or update profile
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (user_id, invitation_record.email, invitation_record.full_name, invitation_record.role, 'active')
  ON CONFLICT (id) DO UPDATE SET
    email = invitation_record.email,
    full_name = invitation_record.full_name,
    role = invitation_record.role,
    status = 'active';
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET accepted_at = now(), status = 'accepted'
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$;

-- Function to get invitation details by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role app_role,
  expires_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT i.id, i.email, i.full_name, i.role, i.expires_at, i.invited_by
  FROM public.invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > now()
    AND i.accepted_at IS NULL;
$$;
