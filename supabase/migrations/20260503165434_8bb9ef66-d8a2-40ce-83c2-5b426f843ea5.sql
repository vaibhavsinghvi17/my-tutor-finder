CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  listing_title TEXT,
  learner_user_id UUID NOT NULL,
  provider_user_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.messages (listing_id, learner_user_id, provider_user_id, created_at);
CREATE INDEX idx_messages_learner ON public.messages (learner_user_id, created_at DESC);
CREATE INDEX idx_messages_provider ON public.messages (provider_user_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = learner_user_id OR auth.uid() = provider_user_id);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_user_id
  AND (auth.uid() = learner_user_id OR auth.uid() = provider_user_id)
  AND learner_user_id <> provider_user_id
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;