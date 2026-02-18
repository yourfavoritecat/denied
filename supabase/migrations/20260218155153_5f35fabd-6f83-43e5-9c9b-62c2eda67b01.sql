-- Allow providers to insert commission invoices for their own clinic (needed for check-in flow)
CREATE POLICY "Providers can insert their own commission invoices"
ON public.commission_invoices
FOR INSERT
WITH CHECK (provider_slug = get_my_provider_slug());