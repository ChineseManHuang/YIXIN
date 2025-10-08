-- Initial schema for AI counseling application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  occupation TEXT,
  emergency_contact JSONB,
  preferences JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  bio TEXT,
  age INTEGER,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  occupation TEXT,
  emergency_contact JSONB,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counseling sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  current_kb_step INTEGER NOT NULL DEFAULT 1,
  session_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base progress table (one row per session)
CREATE TABLE IF NOT EXISTS kb_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL DEFAULT 'KB-01' CHECK (current_stage IN ('KB-01', 'KB-02', 'KB-03', 'KB-04', 'KB-05')),
  stage_progress JSONB NOT NULL DEFAULT '{}'::JSONB,
  completion_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  total_messages INTEGER NOT NULL DEFAULT 0,
  stage_messages INTEGER NOT NULL DEFAULT 0,
  completed_stages TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ethics logs table
CREATE TABLE IF NOT EXISTS ethics_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  concerns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  detected_patterns JSONB NOT NULL DEFAULT '[]'::JSONB,
  action_taken TEXT NOT NULL DEFAULT 'monitored' CHECK (action_taken IN ('monitored', 'blocked', 'alerted', 'escalated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  resource_type TEXT CHECK (resource_type IN ('article', 'video', 'audio', 'exercise', 'assessment', 'guide')),
  category TEXT,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER,
  file_url TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource access audit
CREATE TABLE IF NOT EXISTS user_resource_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_progress_updated_at
  BEFORE UPDATE ON kb_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_resource_access_updated_at
  BEFORE UPDATE ON user_resource_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ethics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resource_access ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Users can view own user record" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own user record" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- User profiles RLS
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Sessions RLS
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Messages RLS
CREATE POLICY "Users can view messages from own sessions" ON messages
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM sessions WHERE id = session_id
    )
  );

CREATE POLICY "Users can insert messages into own sessions" ON messages
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT user_id::text FROM sessions WHERE id = session_id
    )
  );

CREATE POLICY "Users can delete messages from own sessions" ON messages
  FOR DELETE USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM sessions WHERE id = session_id
    )
  );

-- KB progress RLS
CREATE POLICY "Users can view kb progress for own sessions" ON kb_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage kb progress for own sessions" ON kb_progress
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Ethics logs RLS (read-only for owners)
CREATE POLICY "Users can view ethics logs for own sessions" ON ethics_logs
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM sessions WHERE id = session_id
    )
  );

-- Resources RLS
CREATE POLICY "Public resources are visible" ON resources
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Authenticated users can view resources" ON resources
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Resource access RLS
CREATE POLICY "Users can view own resource access" ON user_resource_access
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own resource access" ON user_resource_access
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Sample data
INSERT INTO resources (title, description, content, resource_type, category, tags, difficulty_level, estimated_duration, is_public)
VALUES
('深呼吸放松练习', '通过深呼吸技巧帮助缓解焦虑和压力', '深呼吸是一种简单而有效的放松技巧...', 'exercise', '放松技巧', ARRAY['呼吸', '放松', '焦虑'], 'beginner', 10, TRUE),
('正念冥想入门', '学习基础的正念冥想技巧', '正念冥想是一种专注于当下的练习...', 'guide', '正念练习', ARRAY['正念', '冥想', '专注'], 'beginner', 15, TRUE),
('压力应对策略', '学习有效的压力应对方法', '压力是现代生活中不可避免的一部分...', 'guide', '压力管理', ARRAY['压力', '应对', '策略'], 'intermediate', 20, TRUE)
ON CONFLICT DO NOTHING;

COMMIT;


