
-- 1) Profiles: restrict SELECT to owner + admins
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper for boost ranking: returns provider IDs with an active Growth subscription.
CREATE OR REPLACE FUNCTION public.get_active_growth_providers(_ids uuid[])
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id
  FROM public.profiles p
  WHERE p.user_id = ANY(_ids)
    AND p.subscription_tier = 'growth'
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.get_active_growth_providers(uuid[]) TO anon, authenticated;

-- 2) Categories: suggestions must be pending and authored by an authenticated user.
DROP POLICY IF EXISTS "Anyone can suggest a category" ON public.categories;

CREATE POLICY "Authenticated users can suggest a pending category"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (status = 'pending');

CREATE POLICY "Admins can insert approved categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Listing events: prevent spoofing viewer_user_id when authenticated.
DROP POLICY IF EXISTS "Anyone can log a valid listing event" ON public.listing_events;

CREATE POLICY "Anyone can log a valid listing event"
ON public.listing_events FOR INSERT
TO public
WITH CHECK (
  event_type = ANY (ARRAY['view','contact_click','request_click','message_click','boost_view'])
  AND (
    auth.uid() IS NULL
    OR viewer_user_id IS NULL
    OR viewer_user_id = auth.uid()
  )
);

-- 4) Realtime: scope channel subscriptions per user.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to their own channels" ON realtime.messages;

CREATE POLICY "Users can subscribe to their own channels"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notifications:' || auth.uid()::text
  OR realtime.topic() LIKE '%-' || auth.uid()::text || '-%'
  OR realtime.topic() LIKE '%-' || auth.uid()::text
);
