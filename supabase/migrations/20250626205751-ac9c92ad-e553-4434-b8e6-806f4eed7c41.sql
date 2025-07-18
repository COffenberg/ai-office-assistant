
-- Update the create_user_invitation function to handle existing accepted invitations
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
  -- Check if user already exists in profiles as an active user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email AND status = 'active') THEN
    RAISE EXCEPTION 'User with email % already exists as an active user', user_email;
  END IF;
  
  -- Clean up any existing accepted invitations for this email
  DELETE FROM public.invitations 
  WHERE email = user_email AND status = 'accepted';
  
  -- Check if there's still a pending invitation
  IF EXISTS (SELECT 1 FROM public.invitations WHERE email = user_email AND status = 'pending') THEN
    RAISE EXCEPTION 'Pending invitation for email % already exists', user_email;
  END IF;
  
  -- Insert new invitation
  INSERT INTO public.invitations (email, full_name, role, invited_by)
  VALUES (user_email, user_full_name, user_role, auth.uid())
  RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$;

-- Clean up the existing accepted invitation for co@optivo.dk
DELETE FROM public.invitations 
WHERE email = 'co@optivo.dk' AND status = 'accepted';
