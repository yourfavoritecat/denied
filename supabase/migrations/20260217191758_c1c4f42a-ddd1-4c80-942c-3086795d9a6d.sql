-- Add is_creator column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_creator boolean NOT NULL DEFAULT false;

-- Set is_creator = true for the founder account
UPDATE public.profiles SET is_creator = true WHERE user_id = 'a4239505-93c9-47b1-82c5-0ff8eb076d5c';
