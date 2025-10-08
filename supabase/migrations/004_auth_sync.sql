-- Sync auth.users with public.users and relax password hash requirements

BEGIN;

-- Allow password_hash to be nullable since Supabase Auth manages credentials
ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Ensure users table has matching records for existing auth users
INSERT INTO public.users (id, email, password_hash, created_at, updated_at)
SELECT au.id, au.email, NULL, COALESCE(au.created_at, NOW()), COALESCE(au.updated_at, NOW())
FROM auth.users au
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = EXCLUDED.updated_at;

-- Trigger to keep users table in sync with auth.users inserts
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NULL, COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW()))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_auth_user_created_trigger ON auth.users;
CREATE TRIGGER handle_auth_user_created_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_created();

-- Trigger to clean up users table when auth.users entries are deleted
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS handle_auth_user_deleted_trigger ON auth.users;
CREATE TRIGGER handle_auth_user_deleted_trigger
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_deleted();

COMMIT;