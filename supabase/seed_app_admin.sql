-- Seed one admin user for app-owned auth (run after 20250227000002).
-- Default: email admin@example.com, password "admin123"
-- Change the password after first login or replace this hash with your own.
-- Generate a new hash: node -e "const b=require('bcryptjs'); b.hash('yourpassword',10).then(h=>console.log(h))"
INSERT INTO public.app_users (id, email, password_hash, role)
VALUES (
  uuid_generate_v4(),
  'admin@example.com',
  '$2b$10$NkfJlpR3xEjJP46TSJ49B.zzJG7I.W3rgxKhtDpUjXIhMxZ5qgQ.K',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
