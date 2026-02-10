
-- Add social_verifications JSONB column to profiles
ALTER TABLE public.profiles
ADD COLUMN social_verifications jsonb DEFAULT '{}'::jsonb;

-- Add a computed function for user trust tier
CREATE OR REPLACE FUNCTION public.get_user_trust_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN (
      SELECT count(*)
      FROM jsonb_object_keys(COALESCE(p.social_verifications, '{}'::jsonb)) AS k
      WHERE (p.social_verifications->k->>'connected')::boolean = true
    ) >= 2
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.user_id = _user_id AND b.status = 'completed'
    )
    THEN 'trusted_traveler'
    WHEN (
      SELECT count(*)
      FROM jsonb_object_keys(COALESCE(p.social_verifications, '{}'::jsonb)) AS k
      WHERE (p.social_verifications->k->>'connected')::boolean = true
    ) >= 2
    THEN 'trusted'
    WHEN (
      SELECT count(*)
      FROM jsonb_object_keys(COALESCE(p.social_verifications, '{}'::jsonb)) AS k
      WHERE (p.social_verifications->k->>'connected')::boolean = true
    ) >= 1
    THEN 'verified'
    ELSE 'unverified'
  END
  FROM profiles p
  WHERE p.user_id = _user_id;
$$;
