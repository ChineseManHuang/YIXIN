import { createServer } from 'http'
import app from './app.js'
import { initializeSocket } from './services/socket.js'
import { env } from './config/env.js'

const PORT = env.PORT

// 创建HTTP服务器
const server = createServer(app)

// 初始化Socket.io
const socketService = initializeSocket(server)

// 启动服务器
server.listen(PORT, () => {
  console.log('🚀 Server running on port ' + PORT)
  console.log('📡 Socket.io server initialized')
  console.log('🌐 Environment: ' + (env.NODE_ENV || 'development'))
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
