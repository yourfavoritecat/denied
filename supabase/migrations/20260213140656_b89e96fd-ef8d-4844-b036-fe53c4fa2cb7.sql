ALTER TABLE public.user_profile_extras
ADD COLUMN public_fields jsonb NOT NULL DEFAULT '{}'::jsonb;