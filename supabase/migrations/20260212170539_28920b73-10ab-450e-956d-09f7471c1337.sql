-- Create a view for review author info that's always accessible
-- This exposes only the minimal fields needed for displaying review authors
CREATE OR REPLACE VIEW public.review_author_profiles
WITH (security_invoker = off) AS
SELECT 
  user_id,
  first_name,
  avatar_url,
  city,
  username,
  public_profile,
  social_verifications,
  verification_tier
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.review_author_profiles TO anon, authenticated;