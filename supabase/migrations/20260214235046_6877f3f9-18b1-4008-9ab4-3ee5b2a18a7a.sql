
-- Create provider_suggestions table
CREATE TABLE public.provider_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  name text NOT NULL,
  city text,
  country text DEFAULT 'Mexico',
  website_url text,
  description text,
  specialties text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  videos text[] DEFAULT '{}',
  creator_notes text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_suggestions ENABLE ROW LEVEL SECURITY;

-- Creators can insert their own suggestions
CREATE POLICY "Creators can insert own suggestions"
  ON public.provider_suggestions FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    )
  );

-- Creators can view their own suggestions
CREATE POLICY "Creators can view own suggestions"
  ON public.provider_suggestions FOR SELECT
  USING (
    creator_id IN (
      SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Admins can update all suggestions
CREATE POLICY "Admins can update suggestions"
  ON public.provider_suggestions FOR UPDATE
  USING (public.is_admin(auth.uid()));
