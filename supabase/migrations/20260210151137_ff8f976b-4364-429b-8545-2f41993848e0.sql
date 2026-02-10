
-- Drop the overly permissive policy that exposes all columns for public profiles
DROP POLICY IF EXISTS "Users can view own or public profiles" ON public.profiles;

-- Policy: Users can always view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure view for public profiles that excludes sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT
  user_id,
  first_name,
  last_name,
  username,
  avatar_url,
  city,
  verification_tier,
  public_profile,
  social_verifications,
  created_at
FROM public.profiles
WHERE public_profile = true;

-- Allow anyone to read the public profiles view
GRANT SELECT ON public.profiles_public TO anon, authenticated;
