-- Tighten realtime channel authorization to exact topic match using ':' separator (UUIDs contain '-')
DROP POLICY IF EXISTS "Users can subscribe to their own channels" ON realtime.messages;

CREATE POLICY "Users can subscribe to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('notifications:' || (auth.uid())::text)
  OR (
    -- chat topics: chat:{listingId}:{learnerId}:{providerId}
    split_part(realtime.topic(), ':', 1) = 'chat'
    AND (
      split_part(realtime.topic(), ':', 3) = (auth.uid())::text
      OR split_part(realtime.topic(), ':', 4) = (auth.uid())::text
    )
  )
);

-- Revoke EXECUTE from anon on SECURITY DEFINER functions; keep authenticated access
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_active_growth_providers(uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_interested_learners(text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_growth_providers(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_interested_learners(text) TO authenticated;