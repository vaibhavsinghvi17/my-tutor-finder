
-- 1. Allow 'save' event_type
DROP POLICY IF EXISTS "Anyone can log a valid listing event" ON public.listing_events;
CREATE POLICY "Anyone can log a valid listing event"
ON public.listing_events
FOR INSERT
TO public
WITH CHECK (
  (event_type = ANY (ARRAY['view'::text, 'contact_click'::text, 'request_click'::text, 'message_click'::text, 'boost_view'::text, 'save'::text]))
  AND ((auth.uid() IS NULL) OR (viewer_user_id IS NULL) OR (viewer_user_id = auth.uid()))
);

-- 2. Function to get interested learners (saves) for caller (provider). 
-- Masks PII unless caller has 'growth' subscription.
CREATE OR REPLACE FUNCTION public.get_interested_learners(_listing text DEFAULT NULL)
RETURNS TABLE (
  listing_id text,
  learner_user_id uuid,
  saved_at timestamptz,
  display_name text,
  city text,
  gender text,
  is_unlocked boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _is_paid boolean := false;
BEGIN
  IF _caller IS NULL THEN
    RETURN;
  END IF;

  SELECT (p.subscription_tier = 'growth' AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > now()))
    INTO _is_paid
    FROM public.profiles p
    WHERE p.user_id = _caller;

  RETURN QUERY
  SELECT DISTINCT ON (e.listing_id, e.viewer_user_id)
    e.listing_id,
    e.viewer_user_id AS learner_user_id,
    e.created_at AS saved_at,
    CASE WHEN _is_paid THEN COALESCE(pr.display_name, 'Learner') ELSE NULL END AS display_name,
    CASE WHEN _is_paid THEN pr.city ELSE NULL END AS city,
    CASE WHEN _is_paid THEN pr.gender ELSE NULL END AS gender,
    COALESCE(_is_paid, false) AS is_unlocked
  FROM public.listing_events e
  LEFT JOIN public.profiles pr ON pr.user_id = e.viewer_user_id
  WHERE e.provider_user_id = _caller
    AND e.event_type = 'save'
    AND e.viewer_user_id IS NOT NULL
    AND (_listing IS NULL OR e.listing_id = _listing)
  ORDER BY e.listing_id, e.viewer_user_id, e.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_interested_learners(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_interested_learners(text) TO authenticated;

-- 3. Trigger: on save event, create notification for the tutor
CREATE OR REPLACE FUNCTION public.notify_provider_on_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'save' AND NEW.provider_user_id IS NOT NULL AND NEW.viewer_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, kind, link, metadata)
    VALUES (
      NEW.provider_user_id,
      'New interested learner',
      'Someone just saved your class. Tap to see who is interested.',
      'save_interest',
      '/provider/interested',
      jsonb_build_object('listing_id', NEW.listing_id, 'learner_user_id', NEW.viewer_user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_provider_on_save ON public.listing_events;
CREATE TRIGGER trg_notify_provider_on_save
AFTER INSERT ON public.listing_events
FOR EACH ROW
EXECUTE FUNCTION public.notify_provider_on_save();
