import { io, Socket } from 'socket.io-client'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

type EventCallback = (data: any) => void

class WebSocketService {
  private socket: Socket | null = null
  private eventListeners: Map<string, EventCallback[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 3000

  connect(role?: string, userId?: string, tableId?: string) {
    if (this.socket?.connected) {
      return
    }

    const queryParams: Record<string, string> = {}
    if (role) queryParams.role = role
    if (userId) queryParams.userId = userId
    if (tableId) queryParams.tableId = tableId

    this.socket = io({
      path: '/ws',
      transports: ['websocket', 'polling'],
      query: queryParams,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0
      console.log('WebSocket 连接成功')
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket 连接断开')
    })

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++
      console.error('WebSocket 连接错误:', error)
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        ElMessage.error('WebSocket 连接失败，请刷新页面重试')
      }
    })

    this.socket.on('order:statusChanged', (data) => {
      this.emit('orderStatusChanged', data)
    })

    this.socket.on('order:customerStatusChanged', (data) => {
      this.emit('orderCustomerStatusChanged', data)
    })

    this.socket.on('order:new', (data) => {
      this.emit('newOrder', data)
    })

    this.socket.on('orderItem:statusChanged', (data) => {
      this.emit('orderItemStatusChanged', data)
    })

    this.socket.on('table:statusChanged', (data) => {
      this.emit('tableStatusChanged', data)
    })

    this.socket.on('payment:complete', (data) => {
      this.emit('paymentComplete', data)
    })

    this.socket.on('print:complete', (data) => {
      this.emit('printComplete', data)
    })

    this.socket.on('order:callNumber', (data) => {
      this.emit('callNumber', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const websocketService = new WebSocketService()

export default websocketService
