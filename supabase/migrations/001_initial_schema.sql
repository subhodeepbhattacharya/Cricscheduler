-- CricScheduler initial schema

-- Custom types
CREATE TYPE membership_role AS ENUM ('HOST', 'CO_HOST', 'PLAYER');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'LEFT', 'BANNED');
CREATE TYPE match_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE participation_status AS ENUM ('CONFIRMED', 'STANDBY', 'DECLINED', 'DROPPED_OUT');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE payment_provider AS ENUM ('UPI_INTENT');

-- Users (profiles linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Groups (cricket_groups avoids reserved-word issues with PostgREST/Supabase)
CREATE TABLE cricket_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_group_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group memberships
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES cricket_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'PLAYER',
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES cricket_groups(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  google_maps_link TEXT,
  max_players INTEGER NOT NULL CHECK (max_players > 0),
  fee_per_player NUMERIC(10, 2) NOT NULL DEFAULT 0,
  prepayment_required BOOLEAN NOT NULL DEFAULT FALSE,
  status match_status NOT NULL DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Match participations
CREATE TABLE match_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status participation_status NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_out_at TIMESTAMPTZ,
  UNIQUE (match_id, user_id)
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  upi_intent_url TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  provider payment_provider NOT NULL DEFAULT 'UPI_INTENT',
  transaction_ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_group_memberships_user ON group_memberships(user_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_group_memberships_group ON group_memberships(group_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_matches_group ON matches(group_id);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_match_participations_match ON match_participations(match_id);
CREATE INDEX idx_payments_match ON payments(match_id);
CREATE INDEX idx_payments_payer ON payments(payer_user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cricket_groups_updated_at BEFORE UPDATE ON cricket_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER group_memberships_updated_at BEFORE UPDATE ON group_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper: check if user is host/co-host of a group
CREATE OR REPLACE FUNCTION is_group_host_or_cohost(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'ACTIVE'
      AND role IN ('HOST', 'CO_HOST')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Helper: check active membership
CREATE OR REPLACE FUNCTION is_active_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cricket_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can read profiles of group members" ON users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships gm1
    JOIN group_memberships gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = users.id
      AND gm1.status = 'ACTIVE' AND gm2.status = 'ACTIVE'
  )
);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Members can read their groups" ON cricket_groups FOR SELECT USING (
  is_active_group_member(id, auth.uid())
);
CREATE POLICY "Creators can read their groups" ON cricket_groups FOR SELECT USING (
  created_by_user_id = auth.uid()
);
CREATE POLICY "Authenticated users can create groups" ON cricket_groups FOR INSERT WITH CHECK (
  auth.uid() = created_by_user_id
);
CREATE POLICY "Hosts can update groups" ON cricket_groups FOR UPDATE USING (
  is_group_host_or_cohost(id, auth.uid())
);

-- Group memberships policies
CREATE POLICY "Members can read group memberships" ON group_memberships FOR SELECT USING (
  is_active_group_member(group_id, auth.uid())
);
CREATE POLICY "Users can read own memberships" ON group_memberships FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can join groups as player" ON group_memberships FOR INSERT WITH CHECK (
  auth.uid() = user_id AND role = 'PLAYER' AND status = 'ACTIVE'
);
CREATE POLICY "Hosts can create memberships" ON group_memberships FOR INSERT WITH CHECK (
  is_group_host_or_cohost(group_id, auth.uid()) OR auth.uid() = user_id
);
CREATE POLICY "Hosts can update memberships" ON group_memberships FOR UPDATE USING (
  is_group_host_or_cohost(group_id, auth.uid())
);

-- Matches policies
CREATE POLICY "Members can read group matches" ON matches FOR SELECT USING (
  is_active_group_member(group_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM match_participations mp
    WHERE mp.match_id = matches.id AND mp.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone authenticated can read matches for RSVP" ON matches FOR SELECT USING (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Creators can read their matches" ON matches FOR SELECT USING (
  created_by_user_id = auth.uid()
);
CREATE POLICY "Hosts can create matches" ON matches FOR INSERT WITH CHECK (
  is_group_host_or_cohost(group_id, auth.uid()) AND auth.uid() = created_by_user_id
);
CREATE POLICY "Hosts can update matches" ON matches FOR UPDATE USING (
  is_group_host_or_cohost(group_id, auth.uid())
);

-- Match participations policies
CREATE POLICY "Users can read participations for accessible matches" ON match_participations FOR SELECT USING (
  EXISTS (SELECT 1 FROM matches m WHERE m.id = match_id AND is_active_group_member(m.group_id, auth.uid()))
  OR user_id = auth.uid()
);
CREATE POLICY "Users can insert own participation" ON match_participations FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can update own participation" ON match_participations FOR UPDATE USING (
  auth.uid() = user_id
);
CREATE POLICY "Hosts can update participations" ON match_participations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_participations.match_id
      AND is_group_host_or_cohost(m.group_id, auth.uid())
  )
);

-- Payments policies
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (
  payer_user_id = auth.uid()
);
CREATE POLICY "Hosts can read match payments" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = payments.match_id
      AND is_group_host_or_cohost(m.group_id, auth.uid())
  )
);
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (
  payer_user_id = auth.uid()
);
CREATE POLICY "Hosts can update payments" ON payments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = payments.match_id
      AND is_group_host_or_cohost(m.group_id, auth.uid())
  )
);
