
-- Create trip_briefs table
CREATE TABLE public.trip_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination TEXT,
  travel_start DATE,
  travel_end DATE,
  procedures JSONB DEFAULT '[]'::jsonb,
  budget_min INTEGER,
  budget_max INTEGER,
  inquiry_description TEXT,
  medical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trip briefs"
  ON public.trip_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trip briefs"
  ON public.trip_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip briefs"
  ON public.trip_briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip briefs"
  ON public.trip_briefs FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_trip_briefs_updated_at
  BEFORE UPDATE ON public.trip_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
