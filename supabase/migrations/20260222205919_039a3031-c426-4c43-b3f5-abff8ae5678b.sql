ALTER TABLE creator_profiles DROP CONSTRAINT IF EXISTS creator_profiles_profile_theme_check;
ALTER TABLE creator_profiles ADD CONSTRAINT creator_profiles_profile_theme_check CHECK (profile_theme IN ('mint', 'coral', 'lavender', 'gold', 'ice'));
ALTER TABLE creator_profiles ALTER COLUMN profile_theme SET DEFAULT 'mint';