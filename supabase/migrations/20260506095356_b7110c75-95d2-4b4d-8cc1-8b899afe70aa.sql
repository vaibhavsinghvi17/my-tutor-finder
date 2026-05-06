
-- Extend profiles with subscription info
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Validation: only allowed tiers
CREATE OR REPLACE FUNCTION public.validate_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_tier NOT IN ('starter','growth') THEN
    RAISE EXCEPTION 'Invalid subscription_tier: %', NEW.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_tier ON public.profiles;
CREATE TRIGGER profiles_validate_tier
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_tier();

-- Boosts table
CREATE TABLE IF NOT EXISTS public.boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  provider_user_id uuid NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  city text,
  category text,
  age_group text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boosts_listing ON public.boosts(listing_id);
CREATE INDEX IF NOT EXISTS idx_boosts_active ON public.boosts(status, expires_at);

ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active boosts"
ON public.boosts FOR SELECT
USING (status = 'active' AND expires_at > now());

CREATE POLICY "Tutors can create their own boosts"
ON public.boosts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = provider_user_id);

CREATE POLICY "Tutors can update their own boosts"
ON public.boosts FOR UPDATE
TO authenticated
USING (auth.uid() = provider_user_id);
