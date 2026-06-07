import { useRef, useEffect } from 'react'

interface HeatPoint {
  x: number
  y: number
  intensity: number
  label?: string
}

interface HeatMapProps {
  points: HeatPoint[]
  height?: number
  title?: string
}

const chinaOutline = [
  [0.78, 0.08], [0.82, 0.06], [0.85, 0.09], [0.88, 0.07], [0.91, 0.10],
  [0.89, 0.14], [0.92, 0.18], [0.90, 0.22], [0.88, 0.20], [0.86, 0.24],
  [0.88, 0.28], [0.85, 0.30], [0.87, 0.34], [0.84, 0.36], [0.82, 0.34],
  [0.80, 0.38], [0.77, 0.36], [0.75, 0.40], [0.72, 0.38], [0.70, 0.42],
  [0.67, 0.40], [0.65, 0.44], [0.62, 0.42], [0.60, 0.46], [0.57, 0.44],
  [0.55, 0.48], [0.52, 0.46], [0.50, 0.50], [0.47, 0.48], [0.45, 0.52],
  [0.42, 0.50], [0.40, 0.54], [0.37, 0.52], [0.35, 0.56], [0.32, 0.54],
  [0.30, 0.58], [0.27, 0.56], [0.25, 0.60], [0.22, 0.62], [0.20, 0.66],
  [0.18, 0.70], [0.16, 0.74], [0.18, 0.78], [0.20, 0.82], [0.22, 0.80],
  [0.25, 0.84], [0.28, 0.82], [0.30, 0.86], [0.33, 0.84], [0.35, 0.88],
  [0.38, 0.86], [0.40, 0.84], [0.42, 0.86], [0.44, 0.84], [0.46, 0.82],
  [0.48, 0.80], [0.50, 0.82], [0.52, 0.80], [0.54, 0.78], [0.56, 0.80],
  [0.58, 0.78], [0.60, 0.76], [0.62, 0.74], [0.60, 0.72], [0.58, 0.70],
  [0.60, 0.68], [0.62, 0.66], [0.64, 0.64], [0.66, 0.62], [0.68, 0.60],
  [0.70, 0.58], [0.72, 0.56], [0.74, 0.54], [0.76, 0.52], [0.78, 0.50],
  [0.80, 0.48], [0.82, 0.46], [0.84, 0.44], [0.86, 0.42], [0.88, 0.38],
  [0.86, 0.34], [0.88, 0.30], [0.86, 0.26], [0.84, 0.22], [0.82, 0.18],
  [0.80, 0.14], [0.78, 0.10], [0.78, 0.08],
]

export default function HeatMap({ points, height = 360, title }: HeatMapProps) {
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

    ctx.beginPath()
    chinaOutline.forEach(([px, py], i) => {
      const x = px * W
      const y = py * H
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = 'rgba(27, 42, 74, 0.5)'
    ctx.fill()

    points.forEach((p) => {
      const x = p.x * W
      const y = p.y * H
      const radius = 15 + p.intensity * 25

      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
      glow.addColorStop(0, `rgba(245, 158, 11, ${0.3 + p.intensity * 0.4})`)
      glow.addColorStop(0.5, `rgba(245, 158, 11, ${0.1 + p.intensity * 0.15})`)
      glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#F59E0B'
      ctx.fill()
      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 1
      ctx.stroke()

      if (p.label) {
        ctx.fillStyle = '#FFF'
        ctx.font = '10px Noto Sans SC'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, x, y - 10)
      }
    })
  }, [points, height])

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>}
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, borderRadius: '8px' }} />
    </div>
  )
}
