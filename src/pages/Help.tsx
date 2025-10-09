/**
 * 帮助中心页面组件
 * 提供常见问题解答、使用指南、联系支持等功能
 */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import {
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Brain,
  User,
  LogOut,
  Settings,
  Grid,
  ExternalLink,
  FileText,
  Shield,
  Zap,
  Users,
  Eye
} from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful: number
  views: number
}

interface Guide {
  id: string
  title: string
  description: string
  category: string
  steps: number
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  thumbnail: string
  url: string
}

interface SupportContact {
  type: 'phone' | 'email' | 'chat'
  title: string
  description: string
  contact: string
  availability: string
  responseTime: string
  icon: React.ReactNode
}

const Help: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, logout } = useAuthStore()
  
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [guides, setGuides] = useState<Guide[]>([])
  const [supportContacts] = useState<SupportContact[]>([
    {
      type: 'chat',
      title: '在线客服',
      description: '与我们的客服团队实时对话',
      contact: '立即开始对话',
      availability: '周一至周日 9:00-21:00',
      responseTime: '通常在5分钟内回复',
      icon: <MessageCircle className="w-6 h-6" />
    },
    {
      type: 'email',
      title: '邮件支持',
      description: '发送详细问题描述给我们',
      contact: 'support@ai-counselor.com',
      availability: '24/7 接收邮件',
      responseTime: '24小时内回复',
      icon: <Mail className="w-6 h-6" />
    },
    {
      type: 'phone',
      title: '电话支持',
      description: '紧急情况下的直接联系方式',
      contact: '400-123-4567',
      availability: '周一至周五 9:00-18:00',
      responseTime: '立即接听',
      icon: <Phone className="w-6 h-6" />
    }
  ])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'contact'>('faq')

  // 模拟数据加载
  useEffect(() => {
    const mockFAQs: FAQ[] = [
      {
        id: '1',
        question: '如何开始我的第一次心理咨询？',
        answer: '开始您的第一次心理咨询非常简单：1. 注册并登录您的账户；2. 在控制台点击"新建会话"；3. 选择您想要讨论的主题；4. 开始与AI心理咨询师对话。我们的AI会引导您完成整个过程，并根据您的需求提供个性化的支持。',
        category: 'getting-started',
        tags: ['新手', '咨询', '开始'],
        helpful: 45,
        views: 230
      },
      {
        id: '2',
        question: 'AI心理咨询师的建议有多可靠？',
        answer: '我们的AI心理咨询师基于最新的心理学研究和临床实践开发，能够提供循证的心理健康建议。但请注意，AI咨询师不能替代专业的心理治疗师。对于严重的心理健康问题，我们强烈建议您寻求专业心理健康服务提供者的帮助。',
        category: 'ai-counselor',
        tags: ['AI', '可靠性', '专业性'],
        helpful: 38,
        views: 180
      },
      {
        id: '3',
        question: '我的个人信息和对话内容安全吗？',
        answer: '我们非常重视您的隐私和数据安全。所有对话内容都经过端到端加密，只有您可以访问。我们遵循严格的数据保护政策，不会与第三方分享您的个人信息。您可以随时删除您的对话记录和账户数据。',
        category: 'privacy',
        tags: ['隐私', '安全', '数据保护'],
        helpful: 52,
        views: 310
      },
      {
        id: '4',
        question: '如何使用KB工作流程？',
        answer: 'KB工作流程是我们独特的五步心理健康评估和干预流程：KB-01（初始评估）→ KB-02（问题识别）→ KB-03（目标设定）→ KB-04（干预策略）→ KB-05（效果评估）。系统会自动引导您完成每个步骤，确保获得最佳的咨询效果。',
        category: 'features',
        tags: ['KB流程', '工作流', '评估'],
        helpful: 29,
        views: 150
      },
      {
        id: '5',
        question: '如何取消或修改我的会话？',
        answer: '您可以在控制台中管理您的所有会话。点击会话旁边的菜单按钮，选择"编辑"来修改会话标题，或选择"删除"来永久删除会话。请注意，删除操作不可撤销，所有相关的对话记录也会被删除。',
        category: 'account',
        tags: ['会话管理', '删除', '修改'],
        helpful: 33,
        views: 120
      },
      {
        id: '6',
        question: '什么情况下应该寻求专业心理治疗师的帮助？',
        answer: '在以下情况下，我们强烈建议您寻求专业心理治疗师的帮助：1. 有自伤或伤害他人的想法；2. 严重的抑郁或焦虑症状；3. 药物滥用问题；4. 创伤后应激障碍；5. 严重的人际关系问题。AI咨询师可以提供支持，但不能替代专业治疗。',
        category: 'emergency',
        tags: ['紧急情况', '专业治疗', '危机干预'],
        helpful: 67,
        views: 280
      }
    ]
    
    const mockGuides: Guide[] = [
      {
        id: '1',
        title: '新用户快速入门指南',
        description: '从注册到开始第一次咨询的完整指南',
        category: 'getting-started',
        steps: 5,
        duration: '10分钟',
        difficulty: 'beginner',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=user%20guide%20tutorial%20interface%20step%20by%20step%20illustration&image_size=landscape_4_3',
        url: '/help/guides/getting-started'
      },
      {
        id: '2',
        title: '如何有效使用AI心理咨询师',
        description: '最大化AI咨询效果的技巧和建议',
        category: 'ai-counselor',
        steps: 8,
        duration: '15分钟',
        difficulty: 'intermediate',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20counselor%20conversation%20effective%20communication%20tips&image_size=landscape_4_3',
        url: '/help/guides/effective-ai-counseling'
      },
      {
        id: '3',
        title: '隐私设置和数据管理',
        description: '保护您的隐私和管理个人数据',
        category: 'privacy',
        steps: 6,
        duration: '12分钟',
        difficulty: 'beginner',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=privacy%20settings%20data%20security%20shield%20protection&image_size=landscape_4_3',
        url: '/help/guides/privacy-settings'
      },
      {
        id: '4',
        title: 'KB工作流程详解',
        description: '深入了解五步KB心理健康评估流程',
        category: 'features',
        steps: 10,
        duration: '20分钟',
        difficulty: 'advanced',
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=workflow%20process%20steps%20psychological%20assessment%20diagram&image_size=landscape_4_3',
        url: '/help/guides/kb-workflow'
      }
    ]
    
    setFaqs(mockFAQs)
    setGuides(mockGuides)
  }, [])

  // 处理退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout()
      navigate('/', { replace: true })
    }
  }

  // 切换FAQ展开状态
  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  // 过滤FAQ
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 过滤指南
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 获取分类名称
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'getting-started':
        return '入门指南'
      case 'ai-counselor':
        return 'AI咨询师'
      case 'privacy':
        return '隐私安全'
      case 'features':
        return '功能特性'
      case 'account':
        return '账户管理'
      case 'emergency':
        return '紧急情况'
      default:
        return '其他'
    }
  }

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取难度文本
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '入门'
      case 'intermediate':
        return '中级'
      case 'advanced':
        return '高级'
      default:
        return '未知'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：返回和标题 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">帮助中心</span>
              </div>
            </div>
            
            {/* 右侧：用户菜单 */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {profile?.full_name || user.email}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Grid className="w-4 h-4" />
                      <span>控制台</span>
                    </Link>
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
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和描述 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">帮助中心</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            找到您需要的答案，学习如何更好地使用我们的服务，或联系我们的支持团队。
          </p>
        </div>

        {/* 快速链接卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">快速开始</h3>
            </div>
            <p className="text-blue-100 mb-4">5分钟内开始您的第一次AI心理咨询</p>
            <Link
              to="/help/guides/getting-started"
              className="inline-flex items-center space-x-1 text-white hover:text-blue-100 transition-colors"
            >
              <span>查看指南</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">隐私安全</h3>
            </div>
            <p className="text-green-100 mb-4">了解我们如何保护您的隐私和数据</p>
            <Link
              to="/help/guides/privacy-settings"
              className="inline-flex items-center space-x-1 text-white hover:text-green-100 transition-colors"
            >
              <span>了解更多</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">联系支持</h3>
            </div>
            <p className="text-purple-100 mb-4">需要帮助？我们的团队随时为您服务</p>
            <button
              onClick={() => setActiveTab('contact')}
              className="inline-flex items-center space-x-1 text-white hover:text-purple-100 transition-colors"
            >
              <span>联系我们</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('faq')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'faq'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>常见问题</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('guides')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'guides'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>使用指南</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>联系支持</span>
                </div>
              </button>
            </nav>
          </div>

          {/* 搜索和筛选 */}
          {(activeTab === 'faq' || activeTab === 'guides') && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* 搜索框 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={activeTab === 'faq' ? '搜索问题...' : '搜索指南...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* 分类筛选 */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部分类</option>
                  <option value="getting-started">入门指南</option>
                  <option value="ai-counselor">AI咨询师</option>
                  <option value="privacy">隐私安全</option>
                  <option value="features">功能特性</option>
                  <option value="account">账户管理</option>
                  <option value="emergency">紧急情况</option>
                </select>
              </div>
            </div>
          )}

          {/* 内容区域 */}
          <div className="p-6">
            {/* 常见问题标签页 */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关问题</h3>
                    <p className="text-gray-500">尝试调整搜索条件或选择不同的分类。</p>
                  </div>
                ) : (
                  filteredFAQs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {getCategoryName(faq.category)}
                              </span>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{faq.helpful} 人觉得有用</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{faq.views} 次查看</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            {expandedFAQ === faq.id ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {expandedFAQ === faq.id && (
                        <div className="px-6 pb-4 border-t border-gray-100">
                          <div className="pt-4">
                            <p className="text-gray-700 leading-relaxed mb-4">{faq.answer}</p>
                            
                            {/* 标签 */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {faq.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            
                            {/* 反馈按钮 */}
                            <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                              <span className="text-sm text-gray-600">这个回答对您有帮助吗？</span>
                              <button className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                <CheckCircle className="w-4 h-4" />
                                <span>有用</span>
                              </button>
                              <button className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <AlertCircle className="w-4 h-4" />
                                <span>没用</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 使用指南标签页 */}
            {activeTab === 'guides' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGuides.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关指南</h3>
                    <p className="text-gray-500">尝试调整搜索条件或选择不同的分类。</p>
                  </div>
                ) : (
                  filteredGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-video">
                        <img
                          src={guide.thumbnail}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {getCategoryName(guide.category)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(guide.difficulty)}`}>
                            {getDifficultyText(guide.difficulty)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{guide.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{guide.steps} 步骤</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{guide.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to={guide.url}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>查看指南</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 联系支持标签页 */}
            {activeTab === 'contact' && (
              <div className="space-y-8">
                {/* 联系方式卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {supportContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                          {contact.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{contact.title}</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{contact.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{contact.availability}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{contact.responseTime}</span>
                        </div>
                      </div>
                      
                      <button className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        {contact.contact}
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* 紧急情况提醒 */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-2">紧急情况</h3>
                      <p className="text-red-800 mb-4">
                        如果您正在经历心理健康危机或有自伤倾向，请立即寻求专业帮助：
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-red-600" />
                          <span className="text-red-800 font-medium">全国心理危机干预热线：400-161-9995</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-red-600" />
                          <span className="text-red-800 font-medium">北京危机干预热线：400-161-9995</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-red-600" />
                          <span className="text-red-800 font-medium">紧急情况请拨打：120 或 110</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help