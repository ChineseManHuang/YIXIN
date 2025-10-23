/**
 * 控制台页面组件
 * 用户登录后的主要导航和会话管理界面
 */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  Pause,
  MoreVertical,
  Search,
  Filter,
  User,
  Settings,
  LogOut,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Session {
  id: string
  title: string
  status: 'active' | 'completed' | 'paused'
  created_at: string
  updated_at: string
  message_count?: number
}

interface DashboardStats {
  totalSessions: number
  activeSessions: number
  completedSessions: number
  totalMessages: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, logout } = useAuthStore()
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all')
  const [showUserMenu, setShowUserMenu] = useState(false)

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  // 加载会话数据
  useEffect(() => {
    if (!isAuthenticated) return
    
    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await api.sessions.list()
        if (response.success && response.data) {
          const sessionsData = response.data.sessions
          setSessions(sessionsData)
          
          // 计算统计数据
          const totalSessions = sessionsData.length
          const activeSessions = sessionsData.filter(s => s.status === 'active').length
          const completedSessions = sessionsData.filter(s => s.status === 'completed').length
          const totalMessages = sessionsData.reduce((sum, s) => sum + (s.message_count || 0), 0)
          
          setStats({
            totalSessions,
            activeSessions,
            completedSessions,
            totalMessages
          })
        } else {
          throw new Error(response.error || '加载会话数据失败')
        }
      } catch (err) {
        console.error('加载控制台数据失败:', err)
        setError(err instanceof Error ? err.message : '加载数据失败')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [isAuthenticated])

  // 创建新会话 - 文字模式
  const handleCreateSession = async () => {
    try {
      const response = await api.sessions.create('新的心理咨询会话')
      if (response.success && response.data) {
        navigate(`/chat/${response.data.session.id}`)
      } else {
        throw new Error(response.error || '创建会话失败')
      }
    } catch (err) {
      console.error('创建会话失败:', err)
      setError(err instanceof Error ? err.message : '创建会话失败')
    }
  }

  // 创建新会话 - 语音模式
  const handleCreateVoiceSession = async () => {
    try {
      const response = await api.sessions.create('语音心理咨询会话')
      if (response.success && response.data) {
        navigate(`/consultation/${response.data.session.id}`)
      } else {
        throw new Error(response.error || '创建语音会话失败')
      }
    } catch (err) {
      console.error('创建语音会话失败:', err)
      setError(err instanceof Error ? err.message : '创建语音会话失败')
    }
  }

  // 处理退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout()
      navigate('/', { replace: true })
    }
  }

  // 过滤会话
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return '刚刚'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-3 h-3" />
      case 'completed':
        return <CheckCircle className="w-3 h-3" />
      case 'paused':
        return <Pause className="w-3 h-3" />
      default:
        return <MessageSquare className="w-3 h-3" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'paused':
        return '已暂停'
      default:
        return '未知'
    }
  }

  // 如果未认证，不渲染内容
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：Logo和标题 */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI心理咨询师</span>
              </Link>
            </div>
            
            {/* 右侧：用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">
                  {profile?.full_name || user.email}
                </span>
              </button>
              
              {/* 用户下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>个人中心</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>设置</span>
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-200/50">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-xl">👋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                欢迎回来，{profile?.full_name || user.email.split('@')[0]}！
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">继续您的心理健康之旅，或开始新的咨询会话。</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-200 hover:scale-105 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总会话数</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-200 hover:scale-105 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">进行中</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
                </div>
                <Clock className="w-10 h-10 text-green-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-200 hover:scale-105 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">已完成</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.completedSessions}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-200 hover:scale-105 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">消息总数</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalMessages}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
          </div>
        )}

        {/* 会话管理区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
          {/* 头部：标题和操作 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">我的咨询会话</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateSession}
                  className="flex items-center space-x-2 px-5 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>文字咨询</span>
                </button>
                <button
                  onClick={handleCreateVoiceSession}
                  className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>语音咨询</span>
                </button>
              </div>
            </div>
            
            {/* 搜索和筛选 */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索会话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'paused')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="paused">已暂停</option>
                </select>
              </div>
            </div>
          </div>

          {/* 会话列表 */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>加载会话中...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重新加载
                </button>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {sessions.length === 0 ? '还没有咨询会话' : '没有找到匹配的会话'}
                </h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md mx-auto">
                  {sessions.length === 0 
                    ? '开始您的第一次心理咨询，我们将为您提供专业的支持和指导。'
                    : '尝试调整搜索条件或筛选器。'
                  }
                </p>
                {sessions.length === 0 && (
                  <button
                    onClick={handleCreateSession}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl font-medium"
                  >
                    开始第一次咨询
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => {
                  // 判断是否为语音会话(根据标题判断)
                  const isVoiceSession = session.title.includes('语音')
                  const sessionPath = isVoiceSession ? `/consultation/${session.id}` : `/chat/${session.id}`

                  return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-6 border border-gray-200/50 rounded-2xl hover:bg-gray-50/50 transition-all duration-200 hover:scale-[1.02] cursor-pointer group shadow-sm hover:shadow-md"
                    onClick={() => navigate(sessionPath)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                          {session.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(session.status)}`}>
                            {getStatusIcon(session.status)}
                            <span>{getStatusText(session.status)}</span>
                          </span>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: 实现会话操作菜单
                      }}
                      className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 group-hover:scale-110"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard