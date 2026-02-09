-- Allow providers to view profiles of patients who have bookings with their clinic
CREATE POLICY "Providers can view patient profiles for their bookings"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM bookings b
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE b.user_id = profiles.user_id
      AND b.provider_slug = p.provider_slug
  )
);