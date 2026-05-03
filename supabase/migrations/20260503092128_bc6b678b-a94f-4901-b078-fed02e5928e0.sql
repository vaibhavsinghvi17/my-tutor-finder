-- Shared categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_key ON public.categories (slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view approved categories"
  ON public.categories FOR SELECT
  USING (status = 'approved');

-- Public insert (will be tightened once auth is added)
CREATE POLICY "Anyone can suggest a category"
  ON public.categories FOR INSERT
  WITH CHECK (status = 'approved');
