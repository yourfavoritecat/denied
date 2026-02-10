
-- Remove the public SELECT policy from reviews base table
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;

-- Only authenticated users can read reviews (needed for edit/delete checks)
CREATE POLICY "Authenticated users can read reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Create a public view that anonymizes user_id
CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT
  id,
  provider_slug,
  procedure_name,
  rating,
  title,
  review_text,
  recommend,
  verified_trip,
  photos,
  videos,
  is_edited,
  created_at,
  updated_at
FROM public.reviews;

-- Allow anyone to read the public reviews view
GRANT SELECT ON public.reviews_public TO anon, authenticated;
