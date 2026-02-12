ALTER TABLE public.provider_team_members ALTER COLUMN headshot_url DROP NOT NULL;
ALTER TABLE public.provider_team_members ALTER COLUMN headshot_url SET DEFAULT '';