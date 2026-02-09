
-- Add provider_slug to profiles to link users to their provider account
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_slug text;

-- Add notification preferences as jsonb
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"inquiry_received": true, "quote_received": true, "deposit_paid": true, "trip_confirmed": true, "new_message": true, "marketing": false}'::jsonb;

-- Allow providers to read bookings for their slug
CREATE POLICY "Providers can view bookings for their clinic"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.provider_slug = bookings.provider_slug
  )
);

-- Allow providers to update bookings (submit quotes)
CREATE POLICY "Providers can update bookings for their clinic"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.provider_slug = bookings.provider_slug
  )
);

-- Allow providers to read booking messages for their bookings
CREATE POLICY "Providers can read messages for their bookings"
ON public.booking_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    JOIN profiles ON profiles.user_id = auth.uid()
    WHERE bookings.id = booking_messages.booking_id
    AND bookings.provider_slug = profiles.provider_slug
  )
);

-- Allow providers to send messages on their bookings
CREATE POLICY "Providers can send messages on their bookings"
ON public.booking_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM bookings
    JOIN profiles ON profiles.user_id = auth.uid()
    WHERE bookings.id = booking_messages.booking_id
    AND bookings.provider_slug = profiles.provider_slug
  )
);
