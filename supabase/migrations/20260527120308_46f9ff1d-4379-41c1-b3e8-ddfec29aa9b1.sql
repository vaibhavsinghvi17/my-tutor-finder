CREATE TABLE public.whatsapp_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts smallint NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_otps_phone ON public.whatsapp_otps(phone, created_at DESC);

GRANT ALL ON public.whatsapp_otps TO service_role;

ALTER TABLE public.whatsapp_otps ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (edge functions) can access.
