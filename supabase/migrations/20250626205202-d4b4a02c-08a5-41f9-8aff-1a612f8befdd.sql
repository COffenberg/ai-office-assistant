
-- First, restore the admin profile for casper.offenberg.jensen@gmail.com
INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES (
  'c9767c1f-2e6b-4bc4-a73b-01251a268a5a',
  'casper.offenberg.jensen@gmail.com',
  'Casper Offenberg',
  'admin'::app_role,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = 'casper.offenberg.jensen@gmail.com',
  full_name = 'Casper Offenberg',
  role = 'admin'::app_role,
  status = 'active',
  updated_at = NOW();

-- Fix the accept_invitation function to prevent profile overwrites
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
  existing_profile RECORD;
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
  
  -- Check if a profile already exists for this user_id
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = user_id;
  
  -- If profile exists, do not overwrite it
  IF FOUND THEN
    RAISE EXCEPTION 'User profile already exists. Cannot accept invitation for existing user.';
  END IF;
  
  -- Create new profile only if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (user_id, invitation_record.email, invitation_record.full_name, invitation_record.role, 'active');
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET accepted_at = now(), status = 'accepted'
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$;
