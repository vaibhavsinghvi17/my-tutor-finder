
DROP POLICY IF EXISTS "Anyone can log a listing event" ON public.listing_events;
CREATE POLICY "Anyone can log a valid listing event"
  ON public.listing_events FOR INSERT
  TO public
  WITH CHECK (event_type IN ('view','contact_click','request_click','message_click','boost_view'));
