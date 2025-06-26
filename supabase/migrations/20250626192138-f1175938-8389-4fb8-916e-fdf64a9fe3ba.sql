
-- Add user status and invitation tracking to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create helper function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = _role
  );
$$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can insert profiles for user creation" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Add RLS policies for admin user management
CREATE POLICY "Admins can insert profiles for user creation"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.has_role('admin'));

-- Note: The create_user_invitation function is now defined in the new invitations migration
-- This migration has been updated to remove the problematic function that was causing the FK constraint error
