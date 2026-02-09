
-- Add profile fields for public profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS public_profile BOOLEAN NOT NULL DEFAULT false;

-- Update profiles RLS to allow public profile reads
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own or public profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR public_profile = true);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_slug TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  review_text TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  recommend BOOLEAN NOT NULL DEFAULT true,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  verified_trip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Review upvotes table
CREATE TABLE public.review_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read upvotes"
ON public.review_upvotes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote"
ON public.review_upvotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvote"
ON public.review_upvotes FOR DELETE
USING (auth.uid() = user_id);

-- Storage bucket for review media
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true);

CREATE POLICY "Authenticated users can upload review media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view review media"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-media');

CREATE POLICY "Users can delete their own review media"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);
