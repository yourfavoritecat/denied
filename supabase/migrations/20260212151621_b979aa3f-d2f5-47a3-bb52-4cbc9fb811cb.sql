
-- Add vibe_tags column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS vibe_tags jsonb DEFAULT '[]'::jsonb;
