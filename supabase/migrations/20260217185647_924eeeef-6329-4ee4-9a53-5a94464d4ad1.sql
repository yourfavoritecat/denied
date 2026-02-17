-- Add specialties array to creator_profiles
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';

-- Update cat's profile with founder specialties (if exists)
UPDATE public.creator_profiles
SET specialties = ARRAY['dental tourism', 'medical travel', 'aesthetics']
WHERE handle = 'cat';
