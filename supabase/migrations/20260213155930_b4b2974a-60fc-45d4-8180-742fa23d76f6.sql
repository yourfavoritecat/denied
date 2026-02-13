
-- Beta access codes table
CREATE TABLE public.beta_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer NOT NULL DEFAULT 100,
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage codes
CREATE POLICY "Admins can manage beta codes" ON public.beta_access_codes
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Anyone can check a code exists (for signup validation)
CREATE POLICY "Anyone can validate beta codes" ON public.beta_access_codes
  FOR SELECT USING (true);

-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_url text NOT NULL,
  description text NOT NULL,
  ai_guess text,
  screenshot_url text,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Beta testers can create bug reports
CREATE POLICY "Beta testers can create bug reports" ON public.bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Beta testers can view their own reports
CREATE POLICY "Users can view own bug reports" ON public.bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all bug reports
CREATE POLICY "Admins can manage all bug reports" ON public.bug_reports
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate and consume a beta code
CREATE OR REPLACE FUNCTION public.validate_beta_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _found RECORD;
BEGIN
  SELECT * INTO _found FROM beta_access_codes
  WHERE code = _code AND is_active = true AND times_used < max_uses;
  
  IF _found IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE beta_access_codes SET times_used = times_used + 1 WHERE id = _found.id;
  RETURN true;
END;
$$;

-- Function to assign beta_tester role after signup
CREATE OR REPLACE FUNCTION public.assign_beta_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role) VALUES (_user_id, 'beta_tester')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Insert a default beta code
INSERT INTO public.beta_access_codes (code, max_uses) VALUES ('DENIED-BETA-2026', 50);
