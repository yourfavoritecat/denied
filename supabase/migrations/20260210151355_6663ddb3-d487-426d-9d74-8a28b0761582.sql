
-- Explicit deny for non-admin SELECT (anon + authenticated non-admins)
CREATE POLICY "Deny non-admin reads on user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- Deny all writes for everyone (roles managed via backend only)
CREATE POLICY "Deny inserts on user_roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Deny updates on user_roles"
ON public.user_roles
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Deny deletes on user_roles"
ON public.user_roles
FOR DELETE
TO public
USING (false);
