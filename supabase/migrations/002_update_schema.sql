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
