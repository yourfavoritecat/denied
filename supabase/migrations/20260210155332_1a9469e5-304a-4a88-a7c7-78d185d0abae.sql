
-- Drop the existing overly-broad provider access policy
DROP POLICY IF EXISTS "Providers can view patient profiles for their bookings" ON public.profiles;

-- Re-create with restriction: only active booking statuses, never completed/cancelled
CREATE POLICY "Providers can view patient profiles for active bookings"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.user_id = profiles.user_id
      AND b.provider_slug = get_my_provider_slug()
      AND b.status IN ('inquiry', 'quoted', 'deposit_paid', 'confirmed')
  )
);
