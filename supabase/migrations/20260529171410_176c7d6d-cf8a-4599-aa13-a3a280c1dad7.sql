-- Add ban support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS banned_reason text;

-- Admin-only: grant Growth plan to a user (bypasses prevent_self_subscription_change because SECURITY DEFINER + admin check)
CREATE OR REPLACE FUNCTION public.admin_set_subscription(
  _user_id uuid,
  _tier text,
  _expires_at timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change subscriptions';
  END IF;
  IF _tier NOT IN ('starter','growth') THEN
    RAISE EXCEPTION 'Invalid tier';
  END IF;
  UPDATE public.profiles
    SET subscription_tier = _tier,
        subscription_expires_at = _expires_at
    WHERE user_id = _user_id;
END;
$$;

-- Admin-only: ban / unban
CREATE OR REPLACE FUNCTION public.admin_set_ban(
  _user_id uuid,
  _banned boolean,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;
  UPDATE public.profiles
    SET banned_at = CASE WHEN _banned THEN now() ELSE NULL END,
        banned_reason = CASE WHEN _banned THEN _reason ELSE NULL END
    WHERE user_id = _user_id;
END;
$$;

-- Admin-only: grant/revoke admin role
CREATE OR REPLACE FUNCTION public.admin_set_admin_role(
  _user_id uuid,
  _is_admin boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;
  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
      WHERE user_id = _user_id AND role = 'admin'::app_role;
  END IF;
END;
$$;

-- Admin-only: broadcast a notification to many users
CREATE OR REPLACE FUNCTION public.admin_broadcast(
  _title text,
  _body text,
  _link text DEFAULT NULL,
  _user_ids uuid[] DEFAULT NULL  -- NULL = everyone
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can broadcast';
  END IF;
  INSERT INTO public.notifications (user_id, title, body, link, kind, created_by)
  SELECT p.user_id, _title, _body, _link, 'admin', auth.uid()
    FROM public.profiles p
    WHERE _user_ids IS NULL OR p.user_id = ANY(_user_ids);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- Admin stats view function
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS TABLE(
  total_users bigint,
  growth_users bigint,
  banned_users bigint,
  total_saves bigint,
  total_messages bigint,
  open_reports bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'growth' AND (subscription_expires_at IS NULL OR subscription_expires_at > now())),
    (SELECT count(*) FROM public.profiles WHERE banned_at IS NOT NULL),
    (SELECT count(*) FROM public.listing_events WHERE event_type = 'save'),
    (SELECT count(*) FROM public.messages),
    (SELECT count(*) FROM public.reports WHERE status = 'open');
END;
$$;

-- Admin search users
CREATE OR REPLACE FUNCTION public.admin_search_users(_q text DEFAULT NULL, _limit integer DEFAULT 50)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  city text,
  subscription_tier text,
  subscription_expires_at timestamp with time zone,
  banned_at timestamp with time zone,
  is_admin boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.city,
    p.subscription_tier,
    p.subscription_expires_at,
    p.banned_at,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'admin'::app_role) AS is_admin,
    p.created_at
  FROM public.profiles p
  WHERE _q IS NULL OR _q = '' OR p.display_name ILIKE '%' || _q || '%' OR p.city ILIKE '%' || _q || '%'
  ORDER BY p.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 200));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, timestamp with time zone) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_broadcast(text, text, text, uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_broadcast(text, text, text, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(text, integer) TO authenticated;