
-- Drop the blanket deny-insert policy on user_roles
DROP POLICY IF EXISTS "Deny inserts on user_roles" ON public.user_roles;

-- Allow authenticated users to insert ONLY their own 'creator' role
CREATE POLICY "Users can insert own creator role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'creator'
);
