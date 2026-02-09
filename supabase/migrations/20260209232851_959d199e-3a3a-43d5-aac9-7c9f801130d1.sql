-- Fix infinite recursion: profiles policy references bookings which references profiles
-- Solution: Use a security definer function to get provider_slug without triggering RLS

CREATE OR REPLACE FUNCTION public.get_my_provider_slug()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT provider_slug FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Providers can view patient profiles for their bookings" ON public.profiles;
DROP POLICY IF EXISTS "Providers can view bookings for their clinic" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update bookings for their clinic" ON public.bookings;
DROP POLICY IF EXISTS "Providers can read messages for their bookings" ON public.booking_messages;
DROP POLICY IF EXISTS "Providers can send messages on their bookings" ON public.booking_messages;

-- Recreate bookings policies using the function (no join to profiles)
CREATE POLICY "Providers can view bookings for their clinic"
ON public.bookings FOR SELECT
USING (provider_slug = public.get_my_provider_slug());

CREATE POLICY "Providers can update bookings for their clinic"
ON public.bookings FOR UPDATE
USING (provider_slug = public.get_my_provider_slug());

-- Recreate profiles policy without joining bookings
CREATE POLICY "Providers can view patient profiles for their bookings"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.user_id = profiles.user_id
      AND b.provider_slug = public.get_my_provider_slug()
  )
);

-- Recreate booking_messages policies using the function
CREATE POLICY "Providers can read messages for their bookings"
ON public.booking_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_messages.booking_id
      AND bookings.provider_slug = public.get_my_provider_slug()
  )
);

CREATE POLICY "Providers can send messages on their bookings"
ON public.booking_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_messages.booking_id
      AND bookings.provider_slug = public.get_my_provider_slug()
  )
);