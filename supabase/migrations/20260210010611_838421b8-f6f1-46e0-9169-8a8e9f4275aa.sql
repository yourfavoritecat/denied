
-- Add is_edited column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false;
