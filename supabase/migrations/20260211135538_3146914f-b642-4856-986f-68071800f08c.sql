
-- ============================================
-- 1. Create central providers table
-- ============================================
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT DEFAULT 'Mexico',
  address TEXT,
  phone TEXT,
  description TEXT,
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  hours_of_operation TEXT,
  established_year INTEGER,
  admin_managed BOOLEAN DEFAULT false,
  admin_email TEXT,
  verification_tier TEXT DEFAULT 'listed',
  owner_user_id UUID,
  travel_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view providers" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Admins can manage all providers" ON public.providers FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Owners can update their provider" ON public.providers FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Add review category ratings to reviews
-- ============================================
ALTER TABLE public.reviews
  ADD COLUMN rating_cleanliness INTEGER,
  ADD COLUMN rating_communication INTEGER,
  ADD COLUMN rating_wait_time INTEGER,
  ADD COLUMN rating_outcome INTEGER,
  ADD COLUMN rating_safety INTEGER,
  ADD COLUMN rating_value INTEGER;

-- ============================================
-- 3. Add admin management policies to provider_* tables
-- ============================================

-- provider_services: admin can insert/update/delete
CREATE POLICY "Admins can manage all services" ON public.provider_services FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- provider_team_members: admin can insert/update/delete
CREATE POLICY "Admins can manage all team members" ON public.provider_team_members FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- provider_external_links: admin can manage
CREATE POLICY "Admins can manage all links" ON public.provider_external_links FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- provider_policies: admin can manage
CREATE POLICY "Admins can manage all policies" ON public.provider_policies FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- provider_facility: admin can manage
CREATE POLICY "Admins can manage all facility data" ON public.provider_facility FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- provider_business_info: admin can manage
CREATE POLICY "Admins can manage all business info" ON public.provider_business_info FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- 4. Seed Washington Dental Clinic
-- ============================================
INSERT INTO public.providers (slug, name, city, country, address, phone, description, specialties, languages, hours_of_operation, established_year, admin_managed, admin_email, verification_tier, travel_info)
VALUES (
  'washington-dental-tijuana',
  'Washington Dental Clinic',
  'Tijuana',
  'Mexico',
  'Av. Revolución #1673, Tijuana, Baja California, Mexico',
  '+52 619 308 7098',
  'For over 30 years, Washington Dental Clinic has been providing high-quality dental care to patients from across the US. With 8 licensed dentists — 6 of whom specialize in implants and root canals — we deliver comprehensive dental care at 50-70% less than US prices. Over 90% of our patients travel from the United States. We are a walk-in clinic with no appointment necessary, and most dental work can be completed in one or two visits. All work comes with a 2-year guarantee.',
  ARRAY['Dental Implants', 'Zirconia Crowns', 'Full Mouth Rehabilitation', 'Root Canals', 'Cosmetic Dentistry'],
  ARRAY['English', 'Spanish'],
  'Mon-Fri 8am-3pm (last patients at 2pm), Sat 8am-2pm (last patients at 1pm), Sun closed',
  1976,
  true,
  'cat@denied.care',
  'listed',
  'Walk across at San Ysidro port of entry and take a 5-minute taxi to the clinic. Washington Dental provides taxi coordination for patients. Parking available on the US side near the border crossing.'
);

-- Seed services for Washington Dental (using admin user_id)
INSERT INTO public.provider_services (provider_slug, user_id, procedure_name, base_price_usd, description, estimated_duration) VALUES
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Zirconia Crown', 350, NULL, '2-3 days'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Root Canal', 250, NULL, '1-2 hours'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dental Implant', 1200, NULL, '3-6 months'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Night Guard', 150, NULL, '1-2 days'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Teeth Whitening', 150, NULL, '1 hour'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Veneers', 450, NULL, '2-3 days'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Wisdom Tooth Extraction', 150, NULL, '1 hour'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dentures', 400, NULL, '3-5 days'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Teeth Cleaning', 50, NULL, '1 hour'),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Free Consultation', 0, 'Complimentary consultation for new patients', '30 min');

-- Seed team members
INSERT INTO public.provider_team_members (provider_slug, user_id, name, role, headshot_url, sort_order) VALUES
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Pedro Guerrero', 'Dentist', '', 1),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Jorge Miranda', 'Dentist', '', 2),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Vladimir Pena', 'Dentist', '', 3),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Benjamin Bucio', 'Dentist', '', 4),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Miguel Corona', 'Dentist', '', 5),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Alberto Ramirez', 'Dentist', '', 6),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. David Mendoza', 'Dentist', '', 7),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Dr. Elihu Carrasco', 'Dentist', '', 8),
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'J.P. Duarte', 'Patient Coordinator', '', 9);

-- Seed external links
INSERT INTO public.provider_external_links (provider_slug, user_id, website_url, instagram_url, yelp_url, google_business_url) VALUES
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'https://washingtondentalclinics.com', 'https://www.instagram.com/washingtondentaltj/', 'https://www.yelp.com/biz/washington-dental-clinic-tijuana', 'https://www.google.com/maps/search/Washington+Dental+Clinic+Tijuana');

-- Seed policies
INSERT INTO public.provider_policies (provider_slug, user_id, hours_of_operation, languages_spoken, accepted_payments, cancellation_policy) VALUES
  ('washington-dental-tijuana', 'a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'Mon-Fri 8am-3pm (last patients at 2pm), Sat 8am-2pm (last patients at 1pm), Sun closed', ARRAY['English', 'Spanish'], ARRAY['Cash', 'Credit Card', 'Debit Card'], 'Walk-in clinic — no appointment necessary. 2-year guarantee on all work.');

-- ============================================
-- 5. Seed review from Cat (yourfavoritecat@gmail.com)
-- ============================================
INSERT INTO public.reviews (user_id, provider_slug, rating, title, review_text, procedure_name, recommend, rating_cleanliness, rating_communication, rating_wait_time, rating_outcome, rating_safety, rating_value)
VALUES (
  'a4239505-93c9-47b1-82c5-0ff8eb076d5c',
  'washington-dental-tijuana',
  5,
  'saved me over $8,000 — not exaggerating',
  'i got quoted $11,800 in the US for 7 crowns and a root canal. 3 dentists confirmed i needed the work. blue cross blue shield denied coverage for all but one crown. flew to tijuana and paid $3,400 at washington dental for everything plus a night guard. the clinic is clean, modern, and the staff speaks perfect english. j.p. duarte coordinated everything and made the whole process feel easy. dr. cruz did my work and was incredibly professional. i was in and out in two visits. if you''re on the fence about dental tourism, this is the place to start.',
  '7 Zirconia Crowns, 1 Root Canal, 1 Night Guard',
  true,
  5, 5, 4, 5, 5, 5
);
