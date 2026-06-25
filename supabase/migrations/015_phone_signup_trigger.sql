-- Fix the auth signup trigger for phone-based accounts.
--
-- The original handle_new_user() assumed email signups: it set name from the
-- email local-part and inserted NEW.email. For phone OTP signups email is NULL,
-- which made name NULL (and email NULL), failing the users NOT NULL constraints
-- and surfacing as GoTrue's "Database error saving new user".
--
-- Self-contained: also re-asserts the email/phone schema changes from 014 so
-- this migration fixes signup even if 014 hasn't been applied yet.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
  ON users(phone)
  WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Player'
    ),
    NEW.email,
    CASE
      WHEN NEW.phone IS NULL OR NEW.phone = '' THEN NULL
      WHEN left(NEW.phone, 1) = '+' THEN NEW.phone
      ELSE '+' || NEW.phone
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
