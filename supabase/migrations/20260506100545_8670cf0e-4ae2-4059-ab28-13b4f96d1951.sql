
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.boosts ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS via_boost_id uuid;

CREATE TABLE IF NOT EXISTS public.listing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  provider_user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'view' | 'contact_click' | 'request_click' | 'message_click'
  viewer_user_id uuid,
  viewer_city text,
  viewer_age_group text,
  viewer_gender text,
  via_boost_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_events_provider ON public.listing_events(provider_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_events_listing ON public.listing_events(listing_id, created_at DESC);

ALTER TABLE public.listing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a listing event"
  ON public.listing_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Tutors can read their own events"
  ON public.listing_events FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_user_id);
