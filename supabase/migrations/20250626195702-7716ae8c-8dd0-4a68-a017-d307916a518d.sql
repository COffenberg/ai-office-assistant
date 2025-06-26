
-- Restore the admin profile for casper.offenberg.jensen@gmail.com
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
