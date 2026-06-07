import { useRef, useEffect } from 'react'

interface RouteNode {
  x: number
  y: number
  label: string
}

interface RouteLine {
  from: number
  to: number
  price: number
  active?: boolean
}

interface RouteMapProps {
  nodes: RouteNode[]
  routes: RouteLine[]
  height?: number
  title?: string
  onRouteClick?: (route: RouteLine) => void
}

export default function RouteMap({ nodes, routes, height = 320, title, onRouteClick }: RouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    ctx.fillStyle = '#0F1A2E'
    ctx.fillRect(0, 0, W, H)

    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6)
    bgGrad.addColorStop(0, '#1B2A4A')
    bgGrad.addColorStop(1, '#0F1A2E')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    const minPrice = Math.min(...routes.map((r) => r.price))
    const maxPrice = Math.max(...routes.map((r) => r.price))
    const priceRange = maxPrice - minPrice || 1

    routes.forEach((route) => {
      const from = nodes[route.from]
      const to = nodes[route.to]
      if (!from || !to) return

      const x1 = from.x * W
      const y1 = from.y * H
      const x2 = to.x * W
      const y2 = to.y * H

      const t = (route.price - minPrice) / priceRange
      const r = Math.round(27 + t * 218)
      const g = Math.round(42 + (1 - t) * 116)
      const b = Math.round(74 + (1 - t) * 0)
      const color = `rgb(${r}, ${g}, ${b})`

      ctx.beginPath()
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2 - 20
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(mx, my, x2, y2)
      ctx.strokeStyle = route.active ? '#F59E0B' : color
      ctx.lineWidth = route.active ? 3 : 1.5
      ctx.globalAlpha = route.active ? 1 : 0.6
      ctx.stroke()
      ctx.globalAlpha = 1

      if (route.active || priceRange > 0) {
        const labelX = mx
        const labelY = my - 8
        ctx.fillStyle = route.active ? '#F59E0B' : 'rgba(255,255,255,0.7)'
        ctx.font = '10px JetBrains Mono'
        ctx.textAlign = 'center'
        ctx.fillText(`¥${route.price}`, labelX, labelY)
      }
    })

    nodes.forEach((node) => {
      const x = node.x * W
      const y = node.y * H

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#F59E0B'
      ctx.fill()
      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#FFF'
      ctx.font = '11px Noto Sans SC'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, x, y - 12)
    })
  }, [nodes, routes, height])

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px`, borderRadius: '8px', cursor: 'pointer' }}
        onClick={(e) => {
          if (!onRouteClick) return
          const canvas = canvasRef.current
          if (!canvas) return
          const rect = canvas.getBoundingClientRect()
          const cx = (e.clientX - rect.left) / rect.width
          const cy = (e.clientY - rect.top) / rect.height
          routes.forEach((route) => {
            const from = nodes[route.from]
            const to = nodes[route.to]
            if (!from || !to) return
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            if (Math.abs(cx - mx) < 0.05 && Math.abs(cy - my) < 0.05) {
              onRouteClick(route)
            }
          })
        }}
      />
    </div>
  )
}
