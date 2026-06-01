
-- Add Razorpay subscription tracking fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_razorpay_subscription_id
  ON public.profiles(razorpay_subscription_id);

-- Allow service-role (webhooks) to update subscription fields without admin check.
-- auth.uid() is NULL when invoked via service role from edge functions.
CREATE OR REPLACE FUNCTION public.prevent_self_subscription_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier)
     OR (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) THEN
    -- Allow when called from service role (auth.uid() is null) or by an admin
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Subscription changes must go through a verified payment flow';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
