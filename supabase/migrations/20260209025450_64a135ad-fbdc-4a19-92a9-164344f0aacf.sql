-- Block all public reads on waitlist (fixes critical data leakage vulnerability)
CREATE POLICY "Deny public reads on waitlist"
  ON public.waitlist
  FOR SELECT
  USING (false);

-- Block all updates (emails should not be editable)
CREATE POLICY "Deny updates on waitlist"
  ON public.waitlist
  FOR UPDATE
  USING (false);

-- Block all deletes (preserve waitlist integrity)
CREATE POLICY "Deny deletes on waitlist"
  ON public.waitlist
  FOR DELETE
  USING (false);