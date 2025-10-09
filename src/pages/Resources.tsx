/**
 * 资源库页面组件
 * 提供心理健康相关的文章、视频、工具等资源
 */
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import {
  Search,
  Filter,
  BookOpen,
  Video,
  Wrench,
  Heart,
  Clock,
  Star,
  Eye,
  Download,
  Share2,
  Bookmark,
  ArrowLeft,
  Grid,
  List,
  Loader2,
  AlertCircle,
  Brain,
  User,
  LogOut,
  Settings
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'article' | 'video' | 'tool' | 'guide'
  category: string
  tags: string[]
  author: string
  duration?: string // 对于视频和音频
  readTime?: string // 对于文章
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  rating: number
  views: number
  downloads?: number
  thumbnail: string
  url: string
  isPremium: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  count: number
}

const Resources: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, logout } = useAuthStore()
  
  const [resources, setResources] = useState<Resource[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())

  // 模拟数据
  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCategories: Category[] = [
        {
          id: 'anxiety',
          name: '焦虑管理',
          description: '学习如何识别和管理焦虑情绪',
          icon: <Heart className="w-5 h-5" />,
          count: 15
        },
        {
          id: 'depression',
          name: '抑郁症支持',
          description: '了解抑郁症并获得支持资源',
          icon: <Brain className="w-5 h-5" />,
          count: 12
        },
        {
          id: 'stress',
          name: '压力缓解',
          description: '有效的压力管理技巧和方法',
          icon: <Clock className="w-5 h-5" />,
          count: 18
        },
        {
          id: 'relationships',
          name: '人际关系',
          description: '改善人际关系和沟通技巧',
          icon: <User className="w-5 h-5" />,
          count: 10
        },
        {
          id: 'mindfulness',
          name: '正念冥想',
          description: '正念练习和冥想指导',
          icon: <Star className="w-5 h-5" />,
          count: 8
        }
      ]
      
      const mockResources: Resource[] = [
        {
          id: '1',
          title: '焦虑症的认知行为疗法指南',
          description: '详细介绍如何使用CBT技术来管理和减少焦虑症状，包括实用的练习和技巧。',
          type: 'article',
          category: 'anxiety',
          tags: ['CBT', '焦虑', '自助'],
          author: '李心理医生',
          readTime: '15分钟',
          difficulty: 'beginner',
          rating: 4.8,
          views: 1250,
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cognitive%20behavioral%20therapy%20guide%20book%20cover%20professional%20medical%20illustration&image_size=landscape_4_3',
          url: '/resources/cbt-anxiety-guide',
          isPremium: false,
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          title: '深度放松冥想练习',
          description: '20分钟的引导式冥想，帮助您释放压力，达到深度放松状态。',
          type: 'video',
          category: 'mindfulness',
          tags: ['冥想', '放松', '音频'],
          author: '王冥想导师',
          duration: '20分钟',
          difficulty: 'beginner',
          rating: 4.9,
          views: 2100,
          downloads: 450,
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=peaceful%20meditation%20scene%20with%20person%20sitting%20cross%20legged%20in%20nature&image_size=landscape_4_3',
          url: '/resources/deep-relaxation-meditation',
          isPremium: true,
          createdAt: '2024-01-10'
        },
        {
          id: '3',
          title: '情绪日记工具',
          description: '数字化情绪追踪工具，帮助您记录和分析日常情绪变化模式。',
          type: 'tool',
          category: 'stress',
          tags: ['情绪追踪', '自我监控', '工具'],
          author: 'AI心理助手',
          difficulty: 'intermediate',
          rating: 4.6,
          views: 890,
          downloads: 320,
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20mood%20tracking%20app%20interface%20colorful%20emotional%20chart&image_size=landscape_4_3',
          url: '/resources/mood-diary-tool',
          isPremium: false,
          createdAt: '2024-01-08'
        },
        {
          id: '4',
          title: '建立健康人际关系的7个步骤',
          description: '学习如何建立和维护健康的人际关系，提高沟通技巧和情感智慧。',
          type: 'guide',
          category: 'relationships',
          tags: ['人际关系', '沟通', '社交技能'],
          author: '张关系专家',
          readTime: '25分钟',
          difficulty: 'intermediate',
          rating: 4.7,
          views: 1680,
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=people%20connecting%20healthy%20relationships%20communication%20illustration&image_size=landscape_4_3',
          url: '/resources/healthy-relationships-guide',
          isPremium: false,
          createdAt: '2024-01-05'
        },
        {
          id: '5',
          title: '抑郁症康复之路：希望与治愈',
          description: '一个关于抑郁症康复过程的深度纪录片，分享真实的康复故事和专业建议。',
          type: 'video',
          category: 'depression',
          tags: ['抑郁症', '康复', '希望'],
          author: '心理健康基金会',
          duration: '45分钟',
          difficulty: 'intermediate',
          rating: 4.9,
          views: 3200,
          downloads: 680,
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=hope%20and%20healing%20from%20depression%20sunrise%20over%20mountains%20inspirational&image_size=landscape_4_3',
          url: '/resources/depression-recovery-documentary',
          isPremium: true,
          createdAt: '2024-01-01'
        }
      ]
      
      setCategories(mockCategories)
      setResources(mockResources)
      setIsLoading(false)
    }
    
    loadResources()
  }, [])

  // 处理退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      await logout()
      navigate('/', { replace: true })
    }
  }

  // 切换收藏状态
  const toggleBookmark = (resourceId: string) => {
    const newBookmarks = new Set(bookmarkedResources)
    if (newBookmarks.has(resourceId)) {
      newBookmarks.delete(resourceId)
    } else {
      newBookmarks.add(resourceId)
    }
    setBookmarkedResources(newBookmarks)
  }

  // 过滤和排序资源
  const filteredAndSortedResources = React.useMemo(() => {
    const filtered = resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
      const matchesType = selectedType === 'all' || resource.type === selectedType
      const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty
      
      return matchesSearch && matchesCategory && matchesType && matchesDifficulty
    })
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.views - a.views
        case 'rating':
          return b.rating - a.rating
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return filtered
  }, [resources, searchTerm, selectedCategory, selectedType, selectedDifficulty, sortBy])

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <BookOpen className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'tool':
          return <Wrench className="w-4 h-4" />
      case 'guide':
        return <BookOpen className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  // 获取类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'article':
        return '文章'
      case 'video':
        return '视频'
      case 'tool':
        return '工具'
      case 'guide':
        return '指南'
      default:
        return '资源'
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
                <span className="text-xl font-bold text-gray-900">资源库</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">心理健康资源库</h1>
          <p className="text-lg text-gray-600">
            探索丰富的心理健康资源，包括专业文章、指导视频、实用工具和康复指南。
          </p>
        </div>

        {/* 分类卡片 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">资源分类</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    selectedCategory === category.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.count} 个资源</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索资源标题、描述或标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 筛选器 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部类型</option>
                  <option value="article">文章</option>
                  <option value="video">视频</option>
                  <option value="tool">工具</option>
                  <option value="guide">指南</option>
                </select>
              </div>
              
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部难度</option>
                <option value="beginner">入门</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'rating')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">最新发布</option>
                <option value="popular">最受欢迎</option>
                <option value="rating">评分最高</option>
              </select>
              
              {/* 视图切换 */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 资源列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>加载资源中...</span>
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
        ) : filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的资源</h3>
            <p className="text-gray-500 mb-6">尝试调整搜索条件或筛选器。</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedType('all')
                setSelectedDifficulty('all')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredAndSortedResources.map((resource) => (
              <div
                key={resource.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* 缩略图 */}
                <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-video'}>
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* 内容区域 */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* 头部：类型和收藏 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {getTypeIcon(resource.type)}
                        <span>{getTypeText(resource.type)}</span>
                      </span>
                      {resource.isPremium && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          高级
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleBookmark(resource.id)}
                      className={`p-1 rounded-full transition-colors ${
                        bookmarkedResources.has(resource.id)
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${
                        bookmarkedResources.has(resource.id) ? 'fill-current' : ''
                      }`} />
                    </button>
                  </div>
                  
                  {/* 标题和描述 */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  {/* 元数据 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span>作者：{resource.author}</span>
                      {resource.readTime && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{resource.readTime}</span>
                        </span>
                      )}
                      {resource.duration && (
                        <span className="flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>{resource.duration}</span>
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
                      {getDifficultyText(resource.difficulty)}
                    </span>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{resource.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{resource.views}</span>
                      </div>
                      {resource.downloads && (
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloads}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{resource.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to={resource.url}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      查看详情
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Resources