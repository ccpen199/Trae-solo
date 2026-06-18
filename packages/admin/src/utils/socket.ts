import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store'

let socket: Socket | null = null

export function createSocket(): Socket {
  const { token } = useAuthStore.getState()
  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      token
    }
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function closeSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function onPileStatus(callback: (data: unknown) => void): void {
  if (socket) {
    socket.on('pile:status', callback)
  }
}

export function offPileStatus(callback: (data: unknown) => void): void {
  if (socket) {
    socket.off('pile:status', callback)
  }
}

export function onOrderUpdate(callback: (data: unknown) => void): void {
  if (socket) {
    socket.on('order:update', callback)
  }
}

export function offOrderUpdate(callback: (data: unknown) => void): void {
  if (socket) {
    socket.off('order:update', callback)
  }
}
