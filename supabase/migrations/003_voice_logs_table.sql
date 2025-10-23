-- 创建语音日志表
CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('speech_to_text', 'text_to_speech')),
  
  -- 语音转文本相关字段
  input_size INTEGER, -- 输入音频文件大小（字节）
  output_text TEXT, -- 识别出的文本
  confidence DECIMAL(3,2), -- 识别置信度 (0.00-1.00)
  
  -- 文本转语音相关字段
  input_text TEXT, -- 输入文本
  output_size INTEGER, -- 输出音频文件大小（字节）
  voice_type VARCHAR(10), -- 语音类型: male, female, neutral
  speed DECIMAL(2,1), -- 语速 (0.5-2.0)
  
  -- 通用字段
  duration DECIMAL(8,2), -- 音频时长（秒）
  language VARCHAR(10) DEFAULT 'zh-CN', -- 语言代码
  format VARCHAR(10), -- 音频格式: wav, mp3, webm, ogg
  
  -- 状态和错误信息
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'processing')),
  error_message TEXT,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_id ON voice_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_action_type ON voice_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created_at ON voice_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_logs_status ON voice_logs(status);

-- 创建复合索引
CREATE INDEX IF NOT EXISTS idx_voice_logs_user_action_date ON voice_logs(user_id, action_type, created_at DESC);

-- 添加updated_at触发器
CREATE TRIGGER update_voice_logs_updated_at
  BEFORE UPDATE ON voice_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看自己的语音日志
CREATE POLICY "Users can view own voice logs" ON voice_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的语音日志
CREATE POLICY "Users can insert own voice logs" ON voice_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的语音日志
CREATE POLICY "Users can update own voice logs" ON voice_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的语音日志
CREATE POLICY "Users can delete own voice logs" ON voice_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 授予权限
GRANT ALL PRIVILEGES ON voice_logs TO authenticated;
GRANT SELECT ON voice_logs TO anon;

-- 创建语音使用统计视图
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

-- 授予视图权限
GRANT SELECT ON voice_usage_stats TO authenticated;

-- 创建语音日志清理函数（删除30天前的日志）
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

-- 注释
COMMENT ON TABLE voice_logs IS '语音处理日志表，记录语音转文本和文本转语音的操作';
COMMENT ON COLUMN voice_logs.action_type IS '操作类型：speech_to_text（语音转文本）或 text_to_speech（文本转语音）';
COMMENT ON COLUMN voice_logs.confidence IS '语音识别置信度，范围0.00-1.00';
COMMENT ON COLUMN voice_logs.voice_type IS '语音类型：male（男声）、female（女声）、neutral（中性）';
COMMENT ON COLUMN voice_logs.speed IS '语音合成速度，范围0.5-2.0';
COMMENT ON COLUMN voice_logs.duration IS '音频时长，单位秒';
COMMENT ON COLUMN voice_logs.language IS '语言代码，如zh-CN、en-US';
COMMENT ON COLUMN voice_logs.format IS '音频格式：wav、mp3、webm、ogg';
COMMENT ON VIEW voice_usage_stats IS '语音使用统计视图，按用户、操作类型和日期聚合';
COMMENT ON FUNCTION cleanup_old_voice_logs() IS '清理30天前的语音日志记录';