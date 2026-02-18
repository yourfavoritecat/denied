
-- Update trip_briefs table to support new fields
ALTER TABLE public.trip_briefs
  ADD COLUMN IF NOT EXISTS is_flexible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS travel_window_start date,
  ADD COLUMN IF NOT EXISTS travel_window_end date,
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_members jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS procedure_categories text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS procedures_unsure boolean NOT NULL DEFAULT false;

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trip_brief_id uuid REFERENCES public.trip_briefs(id) ON DELETE SET NULL,
  provider_slug text NOT NULL,
  procedures jsonb DEFAULT '[]'::jsonb,
  is_group boolean NOT NULL DEFAULT false,
  group_members jsonb DEFAULT '[]'::jsonb,
  travel_window_start date,
  travel_window_end date,
  is_flexible boolean NOT NULL DEFAULT false,
  notes text,
  contact_email text,
  contact_phone text,
  comparing_providers boolean NOT NULL DEFAULT false,
  request_type text NOT NULL DEFAULT 'quote',
  status text NOT NULL DEFAULT 'pending',
  provider_response jsonb,
  quoted_price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quote_requests
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for quote_requests
CREATE POLICY "Users can create their own quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quote requests"
  ON public.quote_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quote requests"
  ON public.quote_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can view quote requests for their clinic"
  ON public.quote_requests FOR SELECT
  USING (provider_slug = get_my_provider_slug());

CREATE POLICY "Providers can update quote requests for their clinic"
  ON public.quote_requests FOR UPDATE
  USING (provider_slug = get_my_provider_slug());

CREATE POLICY "Admins can read all quote requests"
  ON public.quote_requests FOR SELECT
  USING (is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
