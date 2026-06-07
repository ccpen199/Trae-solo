import { useEffect, useRef, useState } from 'react'
import { DanmakuMessage } from '@/store'
import { cn } from '@/lib/utils'

interface DanmakuProps {
  messages: DanmakuMessage[]
  isPlaying: boolean
}

const colors = ['#ffffff', '#ffd700', '#00ff88', '#ff6b6b', '#4ecdc4', '#f7b731', '#5f27cd', '#ee5a24']

export default function Danmaku({ messages, isPlaying }: DanmakuProps) {
  const [activeMessages, setActiveMessages] = useState<(DanmakuMessage & { top: number; color: string; duration: number })[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number>(-1)

  useEffect(() => {
    if (!isPlaying) return

    const newMessages = messages.filter((m) => m.id > lastIdRef.current)
    if (newMessages.length === 0) return

    newMessages.forEach((msg) => {
      const top = Math.random() * 70 + 5
      const color = colors[Math.floor(Math.random() * colors.length)]
      const duration = 8 + Math.random() * 4

      const entry = { ...msg, top, color, duration }
      setActiveMessages((prev) => [...prev.slice(-30), entry])

      setTimeout(() => {
        setActiveMessages((prev) => prev.filter((m) => m.id !== msg.id))
      }, duration * 1000)
    })

    lastIdRef.current = messages[messages.length - 1].id
  }, [messages, isPlaying])

  const danmakuStyle = (msg: typeof activeMessages[0]) => ({
    top: `${msg.top}%`,
    color: msg.color,
    animationDuration: `${msg.duration}s`,
  })

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {activeMessages.map((msg) => (
        <div
          key={msg.id}
          className={cn('danmaku-item text-lg px-2 py-1 rounded')}
          style={danmakuStyle(msg)}
        >
          <span className="text-teal-300 font-medium">{msg.username}:</span> {msg.content}
        </div>
      ))}
    </div>
  )
}
