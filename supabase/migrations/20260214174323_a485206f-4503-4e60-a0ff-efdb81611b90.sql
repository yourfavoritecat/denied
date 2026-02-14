
-- Table for admin/editorial reviews (Cat's personal reviews)
CREATE TABLE public.provider_admin_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_slug TEXT NOT NULL UNIQUE,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_text TEXT,
  personally_visited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_admin_reviews ENABLE ROW LEVEL SECURITY;

-- Public read access (shown on provider profiles)
CREATE POLICY "Anyone can view admin reviews"
  ON public.provider_admin_reviews FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage admin reviews"
  ON public.provider_admin_reviews FOR ALL
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_provider_admin_reviews_updated_at
  BEFORE UPDATE ON public.provider_admin_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
