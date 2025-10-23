/**
 * Standalone backend server entry point
 * For deployment on Alibaba Cloud (or any traditional Node.js hosting)
 */

import app from './app.js'
import { env } from './config/env.js'

const PORT = env.PORT || 3000

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(50))
  console.log(`🚀 意心 AI 心理咨询平台 - 后端服务`)
  console.log(`📡 Server running on port: ${PORT}`)
  console.log(`🌍 Environment: ${env.IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📝 Allowed origins: ${env.CLIENT_ORIGINS.join(', ')}`)
  console.log('='.repeat(50))
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})

// Error handling
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason)
  process.exit(1)
})
