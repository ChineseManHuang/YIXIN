-- 百炼智能体集成 - 数据库迁移脚本
-- 添加 bailian_session_id 字段用于存储百炼多轮对话session_id

-- 1. 添加bailian_session_id字段到sessions表
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS bailian_session_id VARCHAR(255);

-- 2. 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_sessions_bailian_session ON sessions(bailian_session_id);

-- 3. 添加注释
COMMENT ON COLUMN sessions.bailian_session_id IS '百炼智能体session_id，用于多轮对话上下文管理';

-- 4. 验证迁移
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'bailian_session_id';
