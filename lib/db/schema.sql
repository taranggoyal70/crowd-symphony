/**
 * Database schema for Crowd Symphony
 * Run this in Supabase SQL editor to create tables
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(12) UNIQUE NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) DEFAULT 'Crowd Symphony',
    selected_track INTEGER DEFAULT 0,
    effect_mode VARCHAR(20) DEFAULT 'symphony' CHECK (effect_mode IN ('symphony', 'bass-drop', 'strobe')),
    conductor_active BOOLEAN DEFAULT FALSE,
    left_volume INTEGER DEFAULT 50 CHECK (left_volume BETWEEN 0 AND 100),
    right_volume INTEGER DEFAULT 50 CHECK (right_volume BETWEEN 0 AND 100),
    volume_sequence BIGINT DEFAULT 0,
    active_moment_id UUID,
    active_moment_label VARCHAR(50),
    active_moment_kind VARCHAR(20),
    active_moment_triggered_at BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    ended_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'host')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audience members (participants in a session)
CREATE TABLE IF NOT EXISTS audience_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    section VARCHAR(10) NOT NULL CHECK (section IN ('left', 'right')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    UNIQUE(session_id, client_id)
);

-- Moments triggered during a session
CREATE TABLE IF NOT EXISTS moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('pulse', 'left-drop', 'right-drop', 'blackout', 'finale')),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_sections VARCHAR(10)[] DEFAULT ARRAY['left', 'right'],
    volume_at_trigger INTEGER CHECK (volume_at_trigger BETWEEN 0 AND 100)
);

-- Session analytics events
CREATE TABLE IF NOT EXISTS session_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    client_id UUID,
    section VARCHAR(10) CHECK (section IN ('left', 'right')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_archived ON sessions(is_archived);
CREATE INDEX IF NOT EXISTS idx_audience_members_session_id ON audience_members(session_id);
CREATE INDEX IF NOT EXISTS idx_audience_members_client_id ON audience_members(client_id);
CREATE INDEX IF NOT EXISTS idx_audience_members_last_seen_at ON audience_members(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_moments_session_id ON moments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_event_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_created_at ON session_events(created_at);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- Sessions: hosts can read/update their own sessions, anyone can read active sessions by room_code
CREATE POLICY "Hosts can manage their sessions" ON sessions
    FOR ALL USING (host_id = auth.uid());

CREATE POLICY "Anyone can read active session by room_code" ON sessions
    FOR SELECT USING (room_code IS NOT NULL AND expires_at > NOW() AND is_archived = FALSE);

-- Users: users can read/update their own profile
CREATE POLICY "Users can manage their profile" ON users
    FOR ALL USING (id = auth.uid());

-- Audience members: session hosts can read, members can insert/update their own
CREATE POLICY "Hosts can read audience members" ON audience_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions WHERE sessions.id = audience_members.session_id AND sessions.host_id = auth.uid()
        )
    );

CREATE POLICY "Members can manage their own record" ON audience_members
    FOR ALL USING (client_id = (current_setting('request.jwt.claims', true)::json->>'client_id')::uuid);

-- Moments: hosts can insert/read, anyone can read for active session
CREATE POLICY "Hosts can manage moments" ON moments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions WHERE sessions.id = moments.session_id AND sessions.host_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can read moments for active session" ON moments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions WHERE sessions.id = moments.session_id AND sessions.expires_at > NOW()
        )
    );

-- Session events: hosts can read, anyone can insert
CREATE POLICY "Hosts can read session events" ON session_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions WHERE sessions.id = session_events.session_id AND sessions.host_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert session events" ON session_events
    FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS VOID AS $$
BEGIN
    UPDATE sessions
    SET is_archived = TRUE, ended_at = NOW()
    WHERE expires_at < NOW() AND is_archived = FALSE;
END;
$$ language 'plpgsql';

-- Function to cleanup stale audience members
CREATE OR REPLACE FUNCTION cleanup_stale_audience_members()
RETURNS VOID AS $$
BEGIN
    UPDATE audience_members
    SET left_at = NOW()
    WHERE last_seen_at < NOW() - INTERVAL '30 seconds' AND left_at IS NULL;
END;
$$ language 'plpgsql';

-- Cron jobs (run via pg_cron or external scheduler)
-- SELECT cleanup_expired_sessions();
-- SELECT cleanup_stale_audience_members();