/**
 * 个人中心页面组件
 * 用户个人信息管理和设置界面
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { api } from '../lib/api'
import {
  User,
  Mail,
  Calendar,
  Settings,
  MessageSquare,
  Clock,
  Award,
  Shield,
  Bell,
  Moon,
  Globe,
  LogOut,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface UserStats {
  totalSessions: number
  completedSessions: number
  totalMessages: number
  joinDate: string
}

interface UserSettingsState {
  notifications: boolean
  darkMode: boolean
  language: 'zh-CN' | 'en-US'
}

const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, logout } = useAuthStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: profile?.full_name || '',
    bio: profile?.bio || '',
    preferences: profile?.preferences || {}
  })
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'zh-CN'
  })

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
  }, [isAuthenticated, navigate])

  // 加载用户统计数据
  useEffect(() => {
    if (!isAuthenticated) return
    
    const loadUserStats = async () => {
      try {
        // 获取用户会话统计
        const sessionsResponse = await api.sessions.list()
        if (sessionsResponse.success && sessionsResponse.data) {
          const sessions = sessionsResponse.data.sessions
          const completedSessions = sessions.filter(s => s.status === 'completed').length
          
          // 计算总消息数（这里是模拟数据，实际需要API支持）
          const totalMessages = sessions.length * 10 // 假设每个会话平均10条消息
          
          setUserStats({
            totalSessions: sessions.length,
            completedSessions,
            totalMessages,
            joinDate: user?.created_at || new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('加载用户统计失败:', err)
      }
    }
    
    loadUserStats()
  }, [isAuthenticated, user])

  // 初始化编辑表单
  useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.full_name ?? '',
        bio: profile.bio ?? '',
        preferences: (profile.preferences ?? {}) as Record<string, unknown>
      })
    }
  }, [profile])

  // 处理个人信息保存
  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // TODO: 实现更新用户资料的API
      // const response = await api.updateProfile(editForm)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('个人信息更新成功')
      setIsEditing(false)
      
      // 清除成功消息
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('更新个人信息失败:', err)
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理设置更改
  const handleSettingChange = <K extends keyof UserSettingsState>(key: K, value: UserSettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // TODO: 保存设置到后端
  }

  // 处理退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout()
      navigate('/', { replace: true })
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 如果未认证，不渲染内容
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              返回控制台
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 成功/错误提示 */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? '保存中...' : '保存'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          fullName: profile?.full_name || '',
                          bio: profile?.bio || '',
                          preferences: profile?.preferences || {}
                        })
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>取消</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* 头像和姓名 */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入姓名"
                      />
                    ) : (
                      <h3 className="text-xl font-semibold text-gray-900">
                        {profile?.full_name || '未设置姓名'}
                      </h3>
                    )}
                  </div>
                </div>

                {/* 邮箱 */}
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>

                {/* 注册时间 */}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    加入时间：{formatDate(user.created_at)}
                  </span>
                </div>

                {/* 个人简介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="介绍一下自己..."
                    />
                  ) : (
                    <p className="text-gray-600">
                      {profile?.bio || '暂无个人简介'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 设置卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">偏好设置</h2>
              
              <div className="space-y-4">
                {/* 通知设置 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">消息通知</p>
                      <p className="text-sm text-gray-500">接收新消息和系统通知</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 深色模式 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Moon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">深色模式</p>
                      <p className="text-sm text-gray-500">切换到深色主题</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 语言设置 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">语言</p>
                      <p className="text-sm text-gray-500">选择界面语言</p>
                    </div>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value as UserSettingsState['language'])}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="space-y-6">
            {/* 使用统计 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">使用统计</h2>
              
              {userStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">总会话数</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userStats.totalSessions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">已完成</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userStats.completedSessions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-600">消息总数</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userStats.totalMessages}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p>加载统计数据中...</p>
                </div>
              )}
            </div>

            {/* 成就徽章 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">成就徽章</h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">新手上路</p>
                    <p className="text-xs text-blue-700">完成首次咨询</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-50">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">坚持者</p>
                    <p className="text-xs text-gray-500">连续咨询7天</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">快捷操作</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>开始新咨询</span>
                </button>
                
                <button
                  onClick={() => navigate('/resources')}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>资源库</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
