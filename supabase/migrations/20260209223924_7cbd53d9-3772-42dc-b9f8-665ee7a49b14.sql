-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin status (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS on user_roles: only admins can read
CREATE POLICY "Admins can read user_roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admin read policies on all tables
CREATE POLICY "Admins can read all waitlist entries"
ON public.waitlist FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read all provider applications"
ON public.provider_applications FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update provider applications"
ON public.provider_applications FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can read all bookings"
ON public.bookings FOR SELECT
USING (public.is_admin(auth.uid()));

-- Function to get user emails for admin dashboard (auth.users not directly queryable)
CREATE OR REPLACE FUNCTION public.get_admin_user_list()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email::text, created_at
  FROM auth.users
  WHERE public.is_admin(auth.uid())
$$;

-- Insert admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a4239505-93c9-47b1-82c5-0ff8eb076d5c', 'admin');