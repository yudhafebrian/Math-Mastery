-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Children table (no auth dependency)
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '🧒',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Facts table
CREATE TABLE facts (
  id serial PRIMARY KEY,
  domain text NOT NULL CHECK (domain IN ('addition', 'multiplication')),
  skill text NOT NULL,
  question text NOT NULL,
  answer integer NOT NULL,
  strategy text NOT NULL DEFAULT ''
);

-- Attempts table
CREATE TABLE attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  fact_id integer NOT NULL REFERENCES facts(id) ON DELETE CASCADE,
  is_correct boolean NOT NULL,
  response_time_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Policies for children (open access for family use)
CREATE POLICY "allow_select_children" ON children FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_insert_children" ON children FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow_update_children" ON children FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_children" ON children FOR DELETE TO anon, authenticated USING (true);

-- Policies for facts (public read)
CREATE POLICY "allow_read_facts" ON facts FOR SELECT TO anon, authenticated USING (true);

-- Policies for attempts (open access for family use)
CREATE POLICY "allow_select_attempts" ON attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_insert_attempts" ON attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow_update_attempts" ON attempts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_attempts" ON attempts FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX idx_attempts_child_fact ON attempts (child_id, fact_id);
CREATE INDEX idx_attempts_fact ON attempts (fact_id);