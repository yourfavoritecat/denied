
-- Add status column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text;
