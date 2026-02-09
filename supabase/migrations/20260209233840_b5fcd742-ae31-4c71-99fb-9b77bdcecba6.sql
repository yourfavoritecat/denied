
CREATE TABLE public.trip_planner_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  state_key text NOT NULL,
  state_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, booking_id, state_key)
);

ALTER TABLE public.trip_planner_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner state"
ON public.trip_planner_state FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner state"
ON public.trip_planner_state FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planner state"
ON public.trip_planner_state FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planner state"
ON public.trip_planner_state FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_trip_planner_state_updated_at
BEFORE UPDATE ON public.trip_planner_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
