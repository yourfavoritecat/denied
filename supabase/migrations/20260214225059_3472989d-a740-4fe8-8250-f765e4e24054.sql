
-- Creator Profiles table
CREATE TABLE public.creator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  cover_photo_url text,
  social_links jsonb DEFAULT '{}',
  featured_providers text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published profiles
CREATE POLICY "Anyone can read published creator profiles"
  ON public.creator_profiles FOR SELECT
  USING (is_published = true);

-- Creators can read their own profile (even unpublished)
CREATE POLICY "Creators can read own profile"
  ON public.creator_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all creator profiles"
  ON public.creator_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Insert: own user or admin
CREATE POLICY "Users can create own creator profile"
  ON public.creator_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Update: own user or admin
CREATE POLICY "Users can update own creator profile"
  ON public.creator_profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Delete: own user or admin
CREATE POLICY "Users can delete own creator profile"
  ON public.creator_profiles FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Creator Invite Codes table
CREATE TABLE public.creator_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  handle text,
  created_by uuid REFERENCES auth.users(id),
  claimed_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage invite codes"
  ON public.creator_invite_codes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Anyone can read a code by value (for validation)
CREATE POLICY "Anyone can read invite codes"
  ON public.creator_invite_codes FOR SELECT
  USING (true);

-- A user can claim an invite (set claimed_by to themselves)
CREATE POLICY "Users can claim invite codes"
  ON public.creator_invite_codes FOR UPDATE
  USING (claimed_by IS NULL AND is_active = true)
  WITH CHECK (claimed_by = auth.uid());

-- Creator Content table
CREATE TABLE public.creator_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  provider_slug text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  caption text,
  procedure_tags text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read content for published creators
CREATE POLICY "Anyone can read published creator content"
  ON public.creator_content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = creator_content.creator_id AND cp.is_published = true
  ));

-- Creators can read their own content
CREATE POLICY "Creators can read own content"
  ON public.creator_content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = creator_content.creator_id AND cp.user_id = auth.uid()
  ));

-- Admins can read all content
CREATE POLICY "Admins can read all creator content"
  ON public.creator_content FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Creators can insert their own content
CREATE POLICY "Creators can insert own content"
  ON public.creator_content FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = creator_content.creator_id AND cp.user_id = auth.uid()
  ) OR public.is_admin(auth.uid()));

-- Creators can update their own content
CREATE POLICY "Creators can update own content"
  ON public.creator_content FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = creator_content.creator_id AND cp.user_id = auth.uid()
  ) OR public.is_admin(auth.uid()));

-- Creators can delete their own content
CREATE POLICY "Creators can delete own content"
  ON public.creator_content FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.id = creator_content.creator_id AND cp.user_id = auth.uid()
  ) OR public.is_admin(auth.uid()));
