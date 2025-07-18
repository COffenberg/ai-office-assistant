
-- Clean up the accepted invitation for co@optivo.dk since the user already exists in profiles
DELETE FROM public.invitations 
WHERE email = 'co@optivo.dk' AND status = 'accepted';
