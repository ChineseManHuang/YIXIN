/**
 * 首页组件
 * AI咨询师应用的主页面，展示产品介绍和快速开始功能
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth-store'
import { Brain, MessageCircle, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react'

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: '专业AI咨询',
      description: '基于先进的心理学理论和AI技术，提供个性化的心理健康咨询服务'
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-green-600" />,
      title: '多模态交互',
      description: '支持文字、语音等多种交互方式，让沟通更加自然流畅'
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: '隐私保护',
      description: '严格的数据加密和隐私保护机制，确保您的个人信息安全'
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: '专业团队',
      description: '由资深心理学专家和AI技术团队共同打造的专业平台'
    }
  ]

  const kbSteps = [
    { step: 'KB-01', name: 'EMS介绍和规范化', description: '了解情绪管理系统基础' },
    { step: 'KB-02', name: '森林隐喻和河流概念', description: '通过隐喻理解内心世界' },
    { step: 'KB-03', name: 'YSQ-S3森林问题', description: '识别核心认知模式' },
    { step: 'KB-04', name: '分层触发动态树', description: '分析情绪触发机制' },
    { step: 'KB-05', name: 'RNT评估分层触发', description: '制定个性化应对策略' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI心理咨询师</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700">欢迎，{user?.email}</span>
                  <Link
                    to="/chat"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    开始咨询
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    个人中心
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        {/* 英雄区域 */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              您的专业
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                AI心理咨询师
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              基于先进的心理学理论和人工智能技术，为您提供专业、安全、便捷的心理健康咨询服务。
              通过科学的KB工作流程，帮助您更好地了解和管理自己的情绪。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/chat"
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  开始新的咨询
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    免费开始
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    已有账户？登录
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 特色功能 */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们？</h2>
              <p className="text-lg text-gray-600">专业、安全、便捷的AI心理咨询服务</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KB工作流程 */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">科学的咨询流程</h2>
              <p className="text-lg text-gray-600">基于心理学理论的五步式KB工作流程</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {kbSteps.map((step, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.name}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 行动号召 */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">准备好开始您的心理健康之旅了吗？</h2>
            <p className="text-xl text-gray-300 mb-8">
              加入我们，体验专业的AI心理咨询服务，让科技为您的心理健康保驾护航。
            </p>
            
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                立即开始免费咨询
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">AI心理咨询师</span>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link to="/help" className="hover:text-blue-600 transition-colors">帮助中心</Link>
              <Link to="/privacy" className="hover:text-blue-600 transition-colors">隐私政策</Link>
              <Link to="/terms" className="hover:text-blue-600 transition-colors">服务条款</Link>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2024 AI心理咨询师. 保留所有权利.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home