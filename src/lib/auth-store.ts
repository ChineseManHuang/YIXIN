/**
 * 用户认证状态管理
 * 使用Zustand管理用户登录状态和用户信息
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, type User, type UserProfile } from './api'

interface AuthState {
  // 状态
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 操作
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName?: string) => Promise<boolean>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.auth.login(email, password)
          
          if (response.success) {
            // 登录成功后获取用户信息
            await get().getCurrentUser()
            set({ isAuthenticated: true, isLoading: false })
            return true
          } else {
            set({ 
              error: response.error || '登录失败', 
              isLoading: false 
            })
            return false
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '登录失败'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // 注册
      register: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.auth.register(email, password, fullName)
          
          if (response.success) {
            // 注册成功后自动登录
            const loginSuccess = await get().login(email, password)
            set({ isLoading: false })
            return loginSuccess
          } else {
            set({ 
              error: response.error || '注册失败', 
              isLoading: false 
            })
            return false
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '注册失败'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      // 登出
      logout: async () => {
        set({ isLoading: true })
        
        try {
          await api.auth.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
        }
      },

      // 获取当前用户信息
      getCurrentUser: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await api.auth.getCurrentUser()
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              profile: response.data.profile,
              isAuthenticated: true,
              isLoading: false
            })
          } else {
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: response.error || '获取用户信息失败'
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取用户信息失败'
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
          })
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// 认证守卫Hook
export const useAuthGuard = () => {
  const { isAuthenticated, getCurrentUser } = useAuthStore()
  
  // 检查认证状态
  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    if (token && !isAuthenticated) {
      await getCurrentUser()
    }
  }
  
  return { isAuthenticated, checkAuth }
}

// 自动初始化认证状态
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth_token')
  if (token) {
    useAuthStore.getState().getCurrentUser()
  }
}