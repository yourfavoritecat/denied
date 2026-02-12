
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'quote_received', 'message_received', 'booking_update', 'admin_message'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- e.g. '/booking/xxx'
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System/triggers insert notifications (service role), but also allow admins to insert for any user
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Allow the system to insert via triggers (using security definer functions)
-- We'll create a security definer function for triggers

-- Function to create a notification (security definer so triggers can insert)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (_user_id, _type, _title, _body, _link, _metadata);
END;
$$;

-- Trigger: notify user when booking status changes (quote, confirmed, etc.)
CREATE OR REPLACE FUNCTION public.notify_on_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the patient when provider updates status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'quoted' THEN
      PERFORM create_notification(
        NEW.user_id,
        'quote_received',
        'You received a quote!',
        'A provider has sent you a quote for your procedure.',
        '/booking/' || NEW.id
      );
    ELSIF NEW.status = 'confirmed' THEN
      PERFORM create_notification(
        NEW.user_id,
        'booking_update',
        'Your booking is confirmed!',
        'Your procedure has been confirmed.',
        '/booking/' || NEW.id
      );
    ELSIF NEW.status = 'deposit_paid' THEN
      PERFORM create_notification(
        NEW.user_id,
        'booking_update',
        'Deposit received',
        'Your deposit payment has been processed.',
        '/booking/' || NEW.id
      );
    END IF;
  END IF;

  -- Notify patient when provider adds a message
  IF OLD.provider_message IS DISTINCT FROM NEW.provider_message AND NEW.provider_message IS NOT NULL THEN
    PERFORM create_notification(
      NEW.user_id,
      'admin_message',
      'New message from provider',
      LEFT(NEW.provider_message, 100),
      '/booking/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_update
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_update();

-- Trigger: notify user when a new booking message is sent (from provider/admin)
CREATE OR REPLACE FUNCTION public.notify_on_booking_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _booking RECORD;
BEGIN
  SELECT user_id, provider_slug INTO _booking FROM public.bookings WHERE id = NEW.booking_id;
  
  -- Only notify the patient if the message is NOT from them
  IF NEW.sender_id != _booking.user_id THEN
    PERFORM create_notification(
      _booking.user_id,
      'message_received',
      'New message on your booking',
      LEFT(NEW.message, 100),
      '/booking/' || NEW.booking_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_message
  AFTER INSERT ON public.booking_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking_message();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
