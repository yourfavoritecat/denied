
CREATE TABLE public.provider_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  business_type TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  website_url TEXT,
  years_in_practice INTEGER,
  languages TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT,
  why_join TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (public insert)
CREATE POLICY "Anyone can submit a provider application"
ON public.provider_applications
FOR INSERT
WITH CHECK (true);

-- Deny public reads
CREATE POLICY "Deny public reads on provider_applications"
ON public.provider_applications
FOR SELECT
USING (false);

-- Deny public updates
CREATE POLICY "Deny public updates on provider_applications"
ON public.provider_applications
FOR UPDATE
USING (false);

-- Deny public deletes
CREATE POLICY "Deny public deletes on provider_applications"
ON public.provider_applications
FOR DELETE
USING (false);

-- Auto-update updated_at
CREATE TRIGGER update_provider_applications_updated_at
BEFORE UPDATE ON public.provider_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
