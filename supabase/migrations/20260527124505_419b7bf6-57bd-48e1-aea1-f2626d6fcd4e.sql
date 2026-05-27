
-- 1. whatsapp_otps: revoke all client access; only service_role uses it via edge functions
REVOKE ALL ON public.whatsapp_otps FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.whatsapp_otps TO service_role;

-- Explicit deny-by-default documentation policies (no rows visible / writable to clients)
DROP POLICY IF EXISTS "Deny all client access to otps" ON public.whatsapp_otps;
CREATE POLICY "Deny all client access to otps"
ON public.whatsapp_otps
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2. Tighten realtime.messages subscription policy to require exact participant position
DROP POLICY IF EXISTS "Users can subscribe to their own channels" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('notifications:' || (auth.uid())::text)
  OR (
    -- chat-<listingId>-<learnerId>-<providerId>
    -- learnerId is the 2nd-to-last '-' separated segment; providerId is the last
    split_part(realtime.topic(), '-', array_length(string_to_array(realtime.topic(), '-'), 1)) = (auth.uid())::text
    OR split_part(realtime.topic(), '-', array_length(string_to_array(realtime.topic(), '-'), 1) - 1) = (auth.uid())::text
  )
);

-- 3. Revoke EXECUTE on SECURITY DEFINER functions from anon/PUBLIC where not needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_active_growth_providers(uuid[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_subscription_tier() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- Ensure authenticated users (and service_role) can still call the ones needed by RLS/app
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_growth_providers(uuid[]) TO authenticated, service_role;
