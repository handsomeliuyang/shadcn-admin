import Cookies from 'js-cookie'
import { create } from 'zustand'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const USER_INFO = 'user_info'

// 内置账号密码列表
const MOCK_USERS = [
  { email: 'liuyang@ok.com', password: 'asdfg2413', name: '刘阳', accountNo: 'user001', role: ['admin'] },
  { email: 'hexin@ok.com', password: '585858', name: '何鑫', accountNo: 'user002', role: ['user'] }
]

interface AuthUser {
  name: string
  accountNo: string
  email: string
  role: string[]
  exp: number
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    isAuthenticated: boolean
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = Cookies.get(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  
  // 从 localStorage 恢复用户信息
  const userInfoString = localStorage.getItem(USER_INFO)
  let initUser: AuthUser | null = null
  
  if (userInfoString) {
    try {
      const userData = JSON.parse(userInfoString)
      // 检查用户信息是否过期
      if (userData.exp && userData.exp > Date.now()) {
        initUser = userData
      } else {
        // 用户信息过期，清除存储
        localStorage.removeItem(USER_INFO)
        Cookies.remove(ACCESS_TOKEN)
      }
    } catch (error) {
      console.error('Failed to parse user info from localStorage:', error)
      localStorage.removeItem(USER_INFO)
    }
  }
  
  return {
    auth: {
      user: initUser,
      isAuthenticated: !!(initToken && initUser),
      setUser: (user) => {
        if (user) {
          localStorage.setItem(USER_INFO, JSON.stringify(user))
        } else {
          localStorage.removeItem(USER_INFO)
        }
        set((state) => ({ 
          ...state, 
          auth: { 
            ...state.auth, 
            user,
            isAuthenticated: !!(user && state.auth.accessToken)
          } 
        }))
      },
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { 
            ...state, 
            auth: { 
              ...state.auth, 
              accessToken,
              isAuthenticated: !!(accessToken && state.auth.user)
            } 
          }
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          localStorage.removeItem(USER_INFO)
          return { 
            ...state, 
            auth: { 
              ...state.auth, 
              accessToken: '',
              user: null,
              isAuthenticated: false 
            } 
          }
        }),
      login: async (credentials: LoginCredentials) => {
        return new Promise((resolve) => {
          // 模拟异步登录请求
          setTimeout(() => {
            const user = MOCK_USERS.find(
              u => u.email === credentials.email && u.password === credentials.password
            )
            
            if (user) {
              const authUser: AuthUser = {
                name: user.name,
                accountNo: user.accountNo,
                email: user.email,
                role: user.role,
                exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时过期
              }
              
              const token = `token_${Date.now()}_${user.accountNo}`
              
              // 设置用户信息和token
              get().auth.setUser(authUser)
              get().auth.setAccessToken(token)
              
              resolve({ success: true })
            } else {
              resolve({ success: false, error: '邮箱或密码错误' })
            }
          }, 1000) // 模拟网络延迟
        })
      },
      logout: () => {
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          localStorage.removeItem(USER_INFO)
          return {
            ...state,
            auth: { 
              ...state.auth, 
              user: null, 
              accessToken: '',
              isAuthenticated: false 
            },
          }
        })
      },
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          localStorage.removeItem(USER_INFO)
          return {
            ...state,
            auth: { 
              ...state.auth, 
              user: null, 
              accessToken: '',
              isAuthenticated: false 
            },
          }
        }),
    },
  }
})

export const useAuth = () => useAuthStore((state) => state.auth)
