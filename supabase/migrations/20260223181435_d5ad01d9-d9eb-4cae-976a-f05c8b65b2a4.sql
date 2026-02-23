DROP TRIGGER IF EXISTS trg_notify_new_inquiry ON public.bookings;
DROP FUNCTION IF EXISTS public.notify_new_inquiry();