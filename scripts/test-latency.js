/**
 * 延迟测试脚本
 * 用于测试部署后的实际延迟情况
 *
 * 运行方式: node scripts/test-latency.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://8.148.73.181:3000/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

async function measureLatency(url, name) {
  const results = [];

  console.log(`\n${colorize(`测试: ${name}`, colors.cyan)}`);
  console.log('─'.repeat(50));

  for (let i = 0; i < 5; i++) {
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const latency = Date.now() - start;
      results.push(latency);

      const status = response.ok ? colorize('✓', colors.green) : colorize('✗', colors.red);
      const latencyColor = latency < 200 ? colors.green : latency < 500 ? colors.yellow : colors.red;

      console.log(`  ${status} 请求 ${i + 1}: ${colorize(`${latency}ms`, latencyColor)}`);

      // 等待1秒再发下一个请求
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`  ${colorize('✗', colors.red)} 请求 ${i + 1}: ${colorize('失败', colors.red)} - ${error.message}`);
    }
  }

  if (results.length > 0) {
    const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    const min = Math.min(...results);
    const max = Math.max(...results);

    console.log('─'.repeat(50));
    console.log(`  平均延迟: ${colorize(`${avg}ms`, avg < 200 ? colors.green : avg < 500 ? colors.yellow : colors.red)}`);
    console.log(`  最小延迟: ${colorize(`${min}ms`, colors.green)}`);
    console.log(`  最大延迟: ${colorize(`${max}ms`, max < 500 ? colors.yellow : colors.red)}`);
  }

  return results;
}

async function testFullFlow() {
  console.log(colorize('\n🚀 意心平台 - 延迟性能测试', colors.cyan));
  console.log('='.repeat(50));

  // 1. 测试后端健康检查
  await measureLatency(`${API_URL}/health`, '后端健康检查');

  // 2. 测试 Supabase 连接（如果配置了）
  if (SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co') {
    await measureLatency(`${SUPABASE_URL}/rest/v1/`, 'Supabase 数据库连接');
  }

  console.log('\n' + '='.repeat(50));
  console.log(colorize('\n📊 延迟评估标准:', colors.cyan));
  console.log(`  ${colorize('< 200ms', colors.green)}  - 优秀 🎉`);
  console.log(`  ${colorize('200-500ms', colors.yellow)} - 良好 👍`);
  console.log(`  ${colorize('> 500ms', colors.red)}  - 需要优化 ⚠️`);

  console.log('\n' + colorize('💡 优化建议:', colors.cyan));
  console.log('  如果延迟 > 500ms，建议考虑:');
  console.log('  1. 添加 Redis 缓存层（方案1）');
  console.log('  2. 迁移到阿里云 PolarDB（方案2）');
  console.log('  3. 实施异步消息处理（方案4）\n');
}

// 运行测试
testFullFlow().catch(console.error);
