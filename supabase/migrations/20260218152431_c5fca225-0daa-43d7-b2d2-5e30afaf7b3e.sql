
-- ── 1. Add new columns to bookings ──────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_code          text        UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_type          text        NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS concierge_fee         numeric,
  ADD COLUMN IF NOT EXISTS concierge_fee_paid    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in            boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at         timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by         uuid,
  ADD COLUMN IF NOT EXISTS procedures_confirmed  jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_total       numeric,
  ADD COLUMN IF NOT EXISTS commission_rate       numeric     NOT NULL DEFAULT 0.15;

-- ── 2. Trigger function: auto-generate unique booking_code ───────────────────
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _chars  text    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _code   text;
  _exists boolean;
BEGIN
  IF NEW.booking_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    _code := 'DC-' ||
      substr(_chars, floor(random() * length(_chars) + 1)::int, 1) ||
      substr(_chars, floor(random() * length(_chars) + 1)::int, 1) ||
      substr(_chars, floor(random() * length(_chars) + 1)::int, 1) ||
      substr(_chars, floor(random() * length(_chars) + 1)::int, 1);

    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_code = _code)
      INTO _exists;

    EXIT WHEN NOT _exists;
  END LOOP;

  NEW.booking_code := _code;
  RETURN NEW;
END;
$$;

-- Drop trigger first in case it already exists, then recreate
DROP TRIGGER IF EXISTS trg_generate_booking_code ON public.bookings;

CREATE TRIGGER trg_generate_booking_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_code();

-- ── 3. Create commission_invoices table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commission_invoices (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_slug    text        NOT NULL,
  procedure_total  numeric     NOT NULL,
  commission_rate  numeric     NOT NULL,
  commission_amount numeric    NOT NULL,
  status           text        NOT NULL DEFAULT 'pending',
  created_at       timestamptz NOT NULL DEFAULT now(),
  paid_at          timestamptz
);

-- ── 4. Enable RLS on commission_invoices ─────────────────────────────────────
ALTER TABLE public.commission_invoices ENABLE ROW LEVEL SECURITY;

-- Admins can SELECT all
CREATE POLICY "Admins can read all commission invoices"
  ON public.commission_invoices
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can UPDATE all
CREATE POLICY "Admins can update commission invoices"
  ON public.commission_invoices
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Providers can SELECT their own rows
CREATE POLICY "Providers can read their own commission invoices"
  ON public.commission_invoices
  FOR SELECT
  USING (provider_slug = get_my_provider_slug());

-- Admins can INSERT (e.g. from edge functions with service role, or admin actions)
CREATE POLICY "Admins can insert commission invoices"
  ON public.commission_invoices
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));
