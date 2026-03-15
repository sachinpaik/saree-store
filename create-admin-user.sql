-- Create admin user with bcrypt hashed password
-- Run this in Supabase SQL Editor

INSERT INTO public.app_users (email, password_hash, role)
VALUES (
  'admin@example.com',  -- Change this to your email
  '$2b$10$NkfJlpR3xEjJP46TSJ49B.zzJG7I.W3rgxKhtDpUjXIhMxZ5qgQ.K',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Verify the user was created
SELECT id, email, role, created_at 
FROM public.app_users 
WHERE email = 'admin@example.com';
