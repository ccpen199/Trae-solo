import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initSocket = (token?: string): Socket => {
  if (socket) {
    return socket
  }

  socket = io('/socket.io', {
    transports: ['websocket'],
    auth: token ? { token } : undefined
  })

  socket.on('connect', () => {
    console.log('Socket connected')
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  return socket
}

export const getSocket = (): Socket | null => {
  return socket
}

export const closeSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
