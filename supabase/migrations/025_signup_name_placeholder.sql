-- Stop defaulting new phone/email OTP users to the placeholder name "Player".
-- The app redirects users without a real name to /auth/profile after sign-in.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(trim(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
      ''
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
