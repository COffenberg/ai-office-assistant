-- Insert Q&A pairs for the specific installation questions
INSERT INTO public.qa_pairs (question, answer, category, created_by, is_active) VALUES 
(
  'Why must you contact the customer one day before the installation?',
  'Always call the customer 1 day before installation to confirm the appointment, ensure someone will be present, and to discuss any special requirements or access needs.',
  'Installation Procedures',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'Where should the primary control unit be installed?',
  'Mount the control panel at 1.4 meters height, avoiding metal surfaces or corners. The control unit should be positioned in a central location with good signal coverage.',
  'Installation Procedures', 
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
),
(
  'What should you do in the app before leaving the installation site?',
  'All sensors should be tested via the app before final mounting. Verify that all devices are connected properly and functioning correctly in the system.',
  'Installation Procedures',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), 
  true
),
(
  'What must be done with the customer after installation is complete?',
  'After installation is complete, conduct a full system walkthrough with the customer, demonstrate how to use the app, provide user manual, and ensure they understand all features.',
  'Installation Procedures',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  true
);