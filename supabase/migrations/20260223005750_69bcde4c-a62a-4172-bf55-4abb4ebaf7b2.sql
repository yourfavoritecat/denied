
-- Add missing columns to creator_content
ALTER TABLE public.creator_content ADD COLUMN IF NOT EXISTS hashtags jsonb DEFAULT NULL;
ALTER TABLE public.creator_content ADD COLUMN IF NOT EXISTS url text DEFAULT NULL;
ALTER TABLE public.creator_content ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT NULL;
ALTER TABLE public.creator_content ADD COLUMN IF NOT EXISTS title text DEFAULT NULL;

-- Create storage bucket for creator content uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-content', 'creator-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can view
CREATE POLICY "Anyone can view creator content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-content');

-- Storage RLS: authenticated users can upload to their folder
CREATE POLICY "Creators can upload content files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-content' AND auth.role() = 'authenticated');

-- Storage RLS: creators can delete their own files
CREATE POLICY "Creators can delete own content files"
ON storage.objects FOR DELETE
USING (bucket_id = 'creator-content' AND auth.role() = 'authenticated');
