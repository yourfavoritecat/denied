
-- Storage bucket for provider onboarding media
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-onboarding', 'provider-onboarding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider-onboarding bucket
CREATE POLICY "Authenticated users can upload onboarding media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'provider-onboarding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update their onboarding media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'provider-onboarding' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view onboarding media"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-onboarding');

CREATE POLICY "Users can delete their onboarding media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'provider-onboarding' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add verification_tier and onboarding_complete to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'listed',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- Provider onboarding: business information
CREATE TABLE public.provider_business_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  legal_name text NOT NULL,
  dba_name text,
  street_address text NOT NULL,
  city text NOT NULL,
  state_country text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text NOT NULL,
  tax_id text,
  years_in_operation integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_slug)
);
ALTER TABLE public.provider_business_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their business info"
ON public.provider_business_info FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all business info"
ON public.provider_business_info FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Team members
CREATE TABLE public.provider_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  headshot_url text NOT NULL,
  bio text,
  license_number text,
  is_lead boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their team"
ON public.provider_team_members FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all team members"
ON public.provider_team_members FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view team members"
ON public.provider_team_members FOR SELECT
USING (true);

-- Credentials
CREATE TABLE public.provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  credential_type text NOT NULL,
  label text NOT NULL,
  file_url text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their credentials"
ON public.provider_credentials FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credentials"
ON public.provider_credentials FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Services & Pricing
CREATE TABLE public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  procedure_name text NOT NULL,
  description text,
  base_price_usd numeric NOT NULL,
  estimated_duration text,
  recovery_time text,
  package_deals text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their services"
ON public.provider_services FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all services"
ON public.provider_services FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view services"
ON public.provider_services FOR SELECT
USING (true);

-- Facility media
CREATE TABLE public.provider_facility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  description text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_tour_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_slug)
);
ALTER TABLE public.provider_facility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their facility"
ON public.provider_facility FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all facility data"
ON public.provider_facility FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view facility data"
ON public.provider_facility FOR SELECT
USING (true);

-- External links
CREATE TABLE public.provider_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  website_url text,
  google_business_url text,
  yelp_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_slug)
);
ALTER TABLE public.provider_external_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their links"
ON public.provider_external_links FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all links"
ON public.provider_external_links FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view links"
ON public.provider_external_links FOR SELECT
USING (true);

-- Policies (cancellation, payments, etc.)
CREATE TABLE public.provider_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_slug text NOT NULL,
  cancellation_policy text,
  deposit_requirements text,
  accepted_payments text[] NOT NULL DEFAULT '{}',
  languages_spoken text[] NOT NULL DEFAULT '{}',
  hours_of_operation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_slug)
);
ALTER TABLE public.provider_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their policies"
ON public.provider_policies FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all policies"
ON public.provider_policies FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can view policies"
ON public.provider_policies FOR SELECT
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_provider_business_info_updated_at BEFORE UPDATE ON public.provider_business_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_team_members_updated_at BEFORE UPDATE ON public.provider_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_credentials_updated_at BEFORE UPDATE ON public.provider_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_services_updated_at BEFORE UPDATE ON public.provider_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_facility_updated_at BEFORE UPDATE ON public.provider_facility FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_external_links_updated_at BEFORE UPDATE ON public.provider_external_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_policies_updated_at BEFORE UPDATE ON public.provider_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
