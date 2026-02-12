
-- Create content_flags table for flagging reviews and photos
CREATE TABLE public.content_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flagger_user_id UUID NOT NULL,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('review', 'photo')),
  photo_url TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'removed')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- Authenticated users can flag content
CREATE POLICY "Authenticated users can create flags"
  ON public.content_flags FOR INSERT
  WITH CHECK (auth.uid() = flagger_user_id);

-- Users can see their own flags
CREATE POLICY "Users can view their own flags"
  ON public.content_flags FOR SELECT
  USING (auth.uid() = flagger_user_id);

-- Admins can read all flags
CREATE POLICY "Admins can read all flags"
  ON public.content_flags FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update flags
CREATE POLICY "Admins can update flags"
  ON public.content_flags FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete flags
CREATE POLICY "Admins can delete flags"
  ON public.content_flags FOR DELETE
  USING (is_admin(auth.uid()));

-- Prevent duplicate flags from same user on same review
CREATE UNIQUE INDEX idx_unique_review_flag ON public.content_flags (flagger_user_id, review_id) WHERE content_type = 'review' AND status = 'pending';
CREATE UNIQUE INDEX idx_unique_photo_flag ON public.content_flags (flagger_user_id, photo_url) WHERE content_type = 'photo' AND status = 'pending';
