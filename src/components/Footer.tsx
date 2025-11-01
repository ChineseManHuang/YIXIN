/**
 * 网站底部组件
 * 包含备案号信息
 */
import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 py-4 mt-auto">
      <div className="text-center text-sm text-gray-600">
        <a
          href="http://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors"
        >
          鄂ICP备2025097158号
        </a>
      </div>
    </footer>
  )
}

export default Footer
