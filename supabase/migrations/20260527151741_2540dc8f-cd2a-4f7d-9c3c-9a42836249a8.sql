
-- Block non-admin users from modifying subscription_tier / subscription_expires_at on profiles.
-- Payment/admin flows run as service_role (which bypasses RLS and this trigger via SECURITY DEFINER context).
CREATE OR REPLACE FUNCTION public.prevent_self_subscription_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier)
     OR (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Subscription changes must go through a verified payment flow';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_sub_change ON public.profiles;
CREATE TRIGGER profiles_prevent_self_sub_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_subscription_change();

REVOKE EXECUTE ON FUNCTION public.prevent_self_subscription_change() FROM PUBLIC, anon, authenticated;
