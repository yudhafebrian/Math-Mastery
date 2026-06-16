CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '🧒',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE facts (
  id serial PRIMARY KEY,
  domain text NOT NULL CHECK (domain IN ('addition', 'multiplication')),
  skill text NOT NULL,
  question text NOT NULL,
  answer integer NOT NULL,
  strategy text NOT NULL DEFAULT ''
);

CREATE TABLE attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  fact_id integer NOT NULL REFERENCES facts(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  response_time_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_children" ON children FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_children" ON children FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_children" ON children FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_children" ON children FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "select_own_attempts" ON attempts FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = attempts.child_id AND children.user_id = auth.uid()));
CREATE POLICY "insert_own_attempts" ON attempts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM children WHERE children.id = attempts.child_id AND children.user_id = auth.uid()));
CREATE POLICY "update_own_attempts" ON attempts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = attempts.child_id AND children.user_id = auth.uid()));
CREATE POLICY "delete_own_attempts" ON attempts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = attempts.child_id AND children.user_id = auth.uid()));

CREATE INDEX idx_attempts_child_fact ON attempts (child_id, fact_id);
CREATE INDEX idx_children_user ON children (user_id);