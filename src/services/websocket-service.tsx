import { create } from 'zustand'

// WebSocket消息类型定义
interface UnreadCountUpdate {
  userId: string
  unreadCount: number
}

interface WebSocketMessage {
  type: 'unread_count_update' | 'user_ids_registered'
  data: UnreadCountUpdate | { userIds: string[] }
}

// WebSocket服务类（单例模式，内部使用）
class WebSocketService {
  private static instance: WebSocketService
  private ws: WebSocket | null = null
  private reconnectInterval: number = 5000 // 5秒重连
  private maxReconnectAttempts: number = 10
  private reconnectAttempts: number = 0
  private currentUserIds: string[] = []
  private isConnecting: boolean = false
  private wsUrl: string = 'ws://localhost:8080/websocket'

  private constructor() {
    // 私有构造函数，确保单例
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  // 建立WebSocket连接
  public connect(wsUrl?: string): Promise<void> {
    if (wsUrl) this.wsUrl = wsUrl
    
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        // 如果正在连接中，等待连接完成
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve()
          } else if (!this.isConnecting) {
            reject(new Error('连接失败'))
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket连接已建立')
          this.isConnecting = false
          this.reconnectAttempts = 0
          
          // 如果有待发送的用户ID，立即发送
          if (this.currentUserIds.length > 0) {
            this.sendUserIds(this.currentUserIds)
          }
          
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = () => {
          console.log('WebSocket连接已关闭')
          this.isConnecting = false
          this.ws = null
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          this.isConnecting = false
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // 发送用户ID列表到后端
  public sendUserIds(userIds: string[]): void {
    this.currentUserIds = userIds

    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'register_user_ids',
        data: { userIds }
      }
      this.ws.send(JSON.stringify(message))
      console.log('已发送用户ID列表:', userIds)
    } else {
      console.log('WebSocket未连接，用户ID将在连接建立后发送')
      // 自动尝试连接
      this.connect().catch(error => {
        console.error('自动连接失败:', error)
      })
    }
  }

  // 处理接收到的消息
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'unread_count_update':
          const update = message.data as UnreadCountUpdate
          // 直接更新store
          const { updateUnreadCount } = useUnreadCountStore.getState()
          updateUnreadCount(update.userId, update.unreadCount)
          console.log(`用户 ${update.userId} 未读消息数更新为: ${update.unreadCount}`)
          break
          
        case 'user_ids_registered':
          console.log('用户ID注册成功')
          break
          
        default:
          console.log('收到未知类型消息:', message)
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error)
    }
  }

  // 重连逻辑
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连')
      return
    }

    this.reconnectAttempts++
    console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(() => {
      this.connect().catch(() => {
        // 重连失败会自动触发下一次重连
      })
    }, this.reconnectInterval)
  }

  // 获取连接状态
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 内部单例实例
const wsService = WebSocketService.getInstance()

// Zustand store用于管理未读消息数
interface UnreadCountStore {
  unreadCounts: Map<string, number>
  isInitialized: boolean
  updateUnreadCount: (userId: string, count: number) => void
  getUnreadCount: (userId: string) => number
  setInitialCounts: (counts: Map<string, number>) => void
  registerUserIds: (userIds: string[]) => void
  getConnectionStatus: () => boolean
  initialize: () => void
}

const useUnreadCountStore = create<UnreadCountStore>((set, get) => ({
  unreadCounts: new Map(),
  isInitialized: false,
  
  updateUnreadCount: (userId, count) => {
    // 首次使用时自动连接
    if (!get().isInitialized) {
      get().initialize()
    }
    
    set((state) => {
      const newCounts = new Map(state.unreadCounts)
      newCounts.set(userId, count)
      return { unreadCounts: newCounts }
    })
  },
  
  getUnreadCount: (userId) => {
    // 首次使用时自动连接
    if (!get().isInitialized) {
      get().initialize()
    }
    
    return get().unreadCounts.get(userId) ?? -1 // 返回-1表示未获取到数据
  },
  
  setInitialCounts: (counts) => {
    if (!get().isInitialized) {
      get().initialize()
    }
    
    set({ unreadCounts: new Map(counts) })
  },
  
  registerUserIds: (userIds: string[]) => {
    // 首次使用时自动连接
    if (!get().isInitialized) {
      get().initialize()
    }
    
    // 发送用户ID到后端
    wsService.sendUserIds(userIds)
  },
  
  getConnectionStatus: () => {
    return wsService.isConnected()
  },
  
  // 私有方法：初始化连接
  initialize: () => {
    if (get().isInitialized) return
    
    set({ isInitialized: true })
    
    // 自动连接WebSocket
    wsService.connect().catch(error => {
      console.error('自动连接WebSocket失败:', error)
    })
  }
}))

// 自定义Hook，方便在组件中使用
export const useUnreadCountService = () => {
  const store = useUnreadCountStore()

  return {
    unreadCounts: store.unreadCounts,
    getUnreadCount: store.getUnreadCount,
    updateUnreadCount: store.updateUnreadCount,
    registerUserIds: store.registerUserIds,
    getConnectionStatus: store.getConnectionStatus,
  }
}