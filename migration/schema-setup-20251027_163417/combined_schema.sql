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









-- Users RLS




-- User profiles RLS




-- Sessions RLS




-- Messages RLS






-- KB progress RLS




-- Ethics logs RLS (read-only for owners)


-- Resources RLS




-- Resource access RLS




-- Sample data
INSERT INTO resources (title, description, content, resource_type, category, tags, difficulty_level, estimated_duration, is_public)
VALUES
('深呼吸放松练习', '通过深呼吸技巧帮助缓解焦虑和压力', '深呼吸是一种简单而有效的放松技巧...', 'exercise', '放松技巧', ARRAY['呼吸', '放松', '焦虑'], 'beginner', 10, TRUE),
('正念冥想入门', '学习基础的正念冥想技巧', '正念冥想是一种专注于当下的练习...', 'guide', '正念练习', ARRAY['正念', '冥想', '专注'], 'beginner', 15, TRUE),
('压力应对策略', '学习有效的压力应对方法', '压力是现代生活中不可避免的一部分...', 'guide', '压力管理', ARRAY['压力', '应对', '策略'], 'intermediate', 20, TRUE)
ON CONFLICT DO NOTHING;

COMMIT;




-- Schema refinements and indexes

-- Ensure optional columns exist on user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;

-- Add missing columns to kb_progress if migration applied on older schema
ALTER TABLE kb_progress
  ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS stage_progress JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS completed_stages TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add utility columns to ethics_logs when migrating from early versions
ALTER TABLE ethics_logs
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detected_patterns JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT 'monitored' CHECK (action_taken IN ('monitored', 'blocked', 'alerted', 'escalated'));

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_progress_session_id ON kb_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_ethics_logs_session_id ON ethics_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ethics_logs_user_id ON ethics_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ethics_logs_risk_level ON ethics_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_ethics_logs_created_at ON ethics_logs(created_at DESC);

-- Recreate trigger for kb_progress to update updated_at when schema deployed incrementally
DROP TRIGGER IF EXISTS update_kb_progress_updated_at ON kb_progress;
CREATE TRIGGER update_kb_progress_updated_at
  BEFORE UPDATE ON kb_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;


-- 鍒涘缓璇煶鏃ュ織琛?
CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('speech_to_text', 'text_to_speech')),
  
  -- 璇煶杞枃鏈浉鍏冲瓧娈?
  input_size INTEGER, -- 杈撳叆闊抽鏂囦欢澶у皬锛堝瓧鑺傦級
  output_text TEXT, -- 璇嗗埆鍑虹殑鏂囨湰
  confidence DECIMAL(3,2), -- 璇嗗埆缃俊搴?(0.00-1.00)
  
  -- 鏂囨湰杞闊崇浉鍏冲瓧娈?
  input_text TEXT, -- 杈撳叆鏂囨湰
  output_size INTEGER, -- 杈撳嚭闊抽鏂囦欢澶у皬锛堝瓧鑺傦級
  voice_type VARCHAR(10), -- 璇煶绫诲瀷: male, female, neutral
  speed DECIMAL(2,1), -- 璇€?(0.5-2.0)
  
  -- 閫氱敤瀛楁
  duration DECIMAL(8,2), -- 闊抽鏃堕暱锛堢锛?
  language VARCHAR(10) DEFAULT 'zh-CN', -- 璇█浠ｇ爜
  format VARCHAR(10), -- 闊抽鏍煎紡: wav, mp3, webm, ogg
  
  -- 鐘舵€佸拰閿欒淇℃伅
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'processing')),
  error_message TEXT,
  
  -- 鏃堕棿鎴?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 鍒涘缓绱㈠紩
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON voice_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_action_type ON voice_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_logs_status ON voice_logs(status);

-- 鍒涘缓澶嶅悎绱㈠紩
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_action_date ON voice_logs(user_id, action_type, created_at DESC);

-- 娣诲姞updated_at瑙﹀彂鍣?
CREATE TRIGGER update_voice_logs_updated_at
  BEFORE UPDATE ON voice_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 鍚敤琛岀骇瀹夊叏绛栫暐


-- 鍒涘缓RLS绛栫暐
-- 鐢ㄦ埛鍙兘鏌ョ湅鑷繁鐨勮闊虫棩蹇?


-- 鐢ㄦ埛鍙兘鎻掑叆鑷繁鐨勮闊虫棩蹇?


-- 鐢ㄦ埛鍙兘鏇存柊鑷繁鐨勮闊虫棩蹇?


-- 鐢ㄦ埛鍙兘鍒犻櫎鑷繁鐨勮闊虫棩蹇?


-- 鎺堜簣鏉冮檺



-- 鍒涘缓璇煶浣跨敤缁熻瑙嗗浘
CREATE OR REPLACE VIEW voice_usage_stats AS
SELECT 
  user_id,
  action_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_requests,
  AVG(CASE WHEN action_type = 'speech_to_text' THEN confidence END) as avg_confidence,
  SUM(CASE WHEN action_type = 'speech_to_text' THEN input_size ELSE output_size END) as total_bytes,
  SUM(duration) as total_duration,
  DATE_TRUNC('day', created_at) as date
FROM voice_logs
GROUP BY user_id, action_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- 鎺堜簣瑙嗗浘鏉冮檺


-- 鍒涘缓璇煶鏃ュ織娓呯悊鍑芥暟锛堝垹闄?0澶╁墠鐨勬棩蹇楋級
CREATE OR REPLACE FUNCTION cleanup_old_voice_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 娉ㄩ噴
COMMENT ON TABLE voice_logs IS '璇煶澶勭悊鏃ュ織琛紝璁板綍璇煶杞枃鏈拰鏂囨湰杞闊崇殑鎿嶄綔';
COMMENT ON COLUMN voice_logs.action_type IS '鎿嶄綔绫诲瀷锛歴peech_to_text锛堣闊宠浆鏂囨湰锛夋垨 text_to_speech锛堟枃鏈浆璇煶锛?;
COMMENT ON COLUMN voice_logs.confidence IS '璇煶璇嗗埆缃俊搴︼紝鑼冨洿0.00-1.00';
COMMENT ON COLUMN voice_logs.voice_type IS '璇煶绫诲瀷锛歮ale锛堢敺澹帮級銆乫emale锛堝コ澹帮級銆乶eutral锛堜腑鎬э級';
COMMENT ON COLUMN voice_logs.speed IS '璇煶鍚堟垚閫熷害锛岃寖鍥?.5-2.0';
COMMENT ON COLUMN voice_logs.duration IS '闊抽鏃堕暱锛屽崟浣嶇';
COMMENT ON COLUMN voice_logs.language IS '璇█浠ｇ爜锛屽zh-CN銆乪n-US';
COMMENT ON COLUMN voice_logs.format IS '闊抽鏍煎紡锛歸av銆乵p3銆亀ebm銆乷gg';
COMMENT ON VIEW voice_usage_stats IS '璇煶浣跨敤缁熻瑙嗗浘锛屾寜鐢ㄦ埛銆佹搷浣滅被鍨嬪拰鏃ユ湡鑱氬悎';
COMMENT ON FUNCTION cleanup_old_voice_logs() IS '娓呯悊30澶╁墠鐨勮闊虫棩蹇楄褰?;
