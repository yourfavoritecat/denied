
-- Deny anonymous access to provider business info
CREATE POLICY "Deny anonymous access to provider_business_info"
ON public.provider_business_info
FOR SELECT
TO anon
USING (false);
