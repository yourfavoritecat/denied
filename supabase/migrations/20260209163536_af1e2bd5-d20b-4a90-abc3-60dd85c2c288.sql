
-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_slug TEXT NOT NULL,
  procedures JSONB DEFAULT '[]',
  preferred_dates JSONB DEFAULT '{}',
  inquiry_message TEXT,
  medical_notes TEXT,
  trip_brief_id UUID REFERENCES public.trip_briefs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inquiry',
  quoted_price NUMERIC,
  deposit_amount NUMERIC,
  commission_amount NUMERIC,
  provider_message TEXT,
  provider_estimated_dates TEXT,
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Patients can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Patients can create bookings
CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Booking messages table
CREATE TABLE public.booking_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their bookings
CREATE POLICY "Users can read their booking messages"
ON public.booking_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_messages.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Users can send messages on their bookings
CREATE POLICY "Users can send messages on their bookings"
ON public.booking_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_messages.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_messages;
