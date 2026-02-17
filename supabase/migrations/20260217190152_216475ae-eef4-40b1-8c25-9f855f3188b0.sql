-- Create favorites table
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  target_id text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('provider', 'creator')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id, target_type)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Add profile_theme to creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'mint' CHECK (profile_theme IN ('mint', 'peach', 'pearl'));
