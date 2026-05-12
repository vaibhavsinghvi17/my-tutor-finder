-- =================== REVIEWS ===================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  provider_user_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  reviewer_name text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reviewer_user_id)
);

CREATE INDEX idx_reviews_listing ON public.reviews (listing_id);
CREATE INDEX idx_reviews_provider ON public.reviews (provider_user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Signed-in users can create their own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_user_id AND auth.uid() <> provider_user_id);

CREATE POLICY "Reviewers can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Reviewers can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Admins can delete any review"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =================== REPORTS ===================
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid NOT NULL,
  reporter_name text,
  target_type text NOT NULL CHECK (target_type IN ('listing','user','review','message')),
  target_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam','inappropriate','fake','harassment','scam','other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON public.reports (status, created_at DESC);
CREATE INDEX idx_reports_target ON public.reports (target_type, target_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Reporters can read their own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can read all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();