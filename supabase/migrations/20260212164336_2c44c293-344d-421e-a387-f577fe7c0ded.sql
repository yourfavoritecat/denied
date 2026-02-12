
-- User feed posts for the profile media grid
CREATE TABLE public.user_feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo', -- 'photo' or 'video'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view anyone's feed posts"
  ON public.user_feed_posts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own feed posts"
  ON public.user_feed_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed posts"
  ON public.user_feed_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_feed_posts_user_id ON public.user_feed_posts(user_id);

-- Extended profile details
CREATE TABLE public.user_profile_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  hobbies TEXT[],
  fun_facts TEXT[],
  favorite_emoji TEXT,
  skin_type TEXT,
  hair_type TEXT,
  favorite_treatments TEXT[],
  beauty_goals TEXT,
  travel_style TEXT,
  favorite_destinations TEXT[],
  bucket_list_procedures TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile extras"
  ON public.user_profile_extras FOR SELECT USING (true);

CREATE POLICY "Users can insert their own extras"
  ON public.user_profile_extras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extras"
  ON public.user_profile_extras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profile_extras_updated_at
  BEFORE UPDATE ON public.user_profile_extras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for profile media (feed uploads + avatars)
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-media', 'profile-media', true);

CREATE POLICY "Anyone can view profile media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

CREATE POLICY "Authenticated users can upload their own profile media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);
