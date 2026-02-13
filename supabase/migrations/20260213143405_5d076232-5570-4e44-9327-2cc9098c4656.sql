-- Make all profiles public by default and remove the filter from the view
UPDATE public.profiles SET public_profile = true WHERE public_profile = false;

-- Recreate the profiles_public view without the public_profile filter
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT user_id, first_name, last_name, username, avatar_url, city,
         verification_tier, public_profile, social_verifications, created_at
  FROM public.profiles;

-- Set default for new profiles to true
ALTER TABLE public.profiles ALTER COLUMN public_profile SET DEFAULT true;