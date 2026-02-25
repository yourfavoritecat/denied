
CREATE TABLE public.procedure_pricing_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name text NOT NULL,
  category text NOT NULL,
  est_low integer NOT NULL,
  est_high integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT procedure_pricing_reference_procedure_name_key UNIQUE (procedure_name)
);

ALTER TABLE public.procedure_pricing_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read procedure pricing"
  ON public.procedure_pricing_reference
  FOR SELECT
  USING (true);
