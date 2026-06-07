import { useRef, useEffect } from 'react'

interface ChartProps {
  type: 'line' | 'bar' | 'pie'
  data: {
    labels: string[]
    values: number[]
    colors?: string[]
  }
  height?: number
  title?: string
  threshold?: {
    min?: number
    max?: number
  }
  lineColor?: string
}

export default function Chart({ type, data, height = 240, title, threshold, lineColor }: ChartProps) {
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

    ctx.clearRect(0, 0, W, H)

    if (type === 'pie') {
      drawPie(ctx, W, H, data)
    } else if (type === 'bar') {
      drawBar(ctx, W, H, data)
    } else {
      drawLine(ctx, W, H, data, threshold, lineColor)
    }
  }, [type, data, height, threshold, lineColor])

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>}
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  )
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  data: ChartProps['data'],
  threshold?: ChartProps['threshold'],
  lineColor?: string
) {
  const pad = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const allValues = [...data.values]
  if (threshold?.min !== undefined) allValues.push(threshold.min)
  if (threshold?.max !== undefined) allValues.push(threshold.max)
  const maxVal = Math.max(...allValues, 1)
  const minVal = Math.min(...allValues, 0)
  const valRange = maxVal - minVal || 1
  const step = chartW / Math.max(data.values.length - 1, 1)

  const getY = (v: number) => pad.top + chartH - ((v - minVal) / valRange) * chartH

  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(W - pad.right, y)
    ctx.stroke()
    ctx.fillStyle = '#94A3B8'
    ctx.font = '11px Noto Sans SC'
    ctx.textAlign = 'right'
    const val = maxVal - (valRange / 4) * i
    ctx.fillText(val.toFixed(1), pad.left - 8, y + 4)
  }

  if (threshold) {
    ctx.setLineDash([6, 4])
    ctx.lineWidth = 1.5
    if (threshold.max !== undefined) {
      ctx.strokeStyle = '#EF4444'
      ctx.beginPath()
      ctx.moveTo(pad.left, getY(threshold.max))
      ctx.lineTo(W - pad.right, getY(threshold.max))
      ctx.stroke()
      ctx.fillStyle = '#EF4444'
      ctx.font = '10px Noto Sans SC'
      ctx.textAlign = 'left'
      ctx.fillText(`上限 ${threshold.max}`, W - pad.right - 60, getY(threshold.max) - 4)
    }
    if (threshold.min !== undefined) {
      ctx.strokeStyle = '#EF4444'
      ctx.beginPath()
      ctx.moveTo(pad.left, getY(threshold.min))
      ctx.lineTo(W - pad.right, getY(threshold.min))
      ctx.stroke()
      ctx.fillStyle = '#EF4444'
      ctx.font = '10px Noto Sans SC'
      ctx.textAlign = 'left'
      ctx.fillText(`下限 ${threshold.min}`, W - pad.right - 60, getY(threshold.min) + 14)
    }
    ctx.setLineDash([])
  }

  if (threshold && (threshold.min !== undefined || threshold.max !== undefined)) {
    for (let i = 0; i < data.values.length - 1; i++) {
      const v1 = data.values[i]
      const v2 = data.values[i + 1]
      const isOver1 = (threshold.max !== undefined && v1 > threshold.max) || (threshold.min !== undefined && v1 < threshold.min)
      const isOver2 = (threshold.max !== undefined && v2 > threshold.max) || (threshold.min !== undefined && v2 < threshold.min)

      if (isOver1 || isOver2) {
        const x1 = pad.left + step * i
        const y1 = getY(v1)
        const x2 = pad.left + step * (i + 1)
        const y2 = getY(v2)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x2, H - pad.bottom)
        ctx.lineTo(x1, H - pad.bottom)
        ctx.closePath()
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
        ctx.fill()
      }
    }
  }

  const mainColor = lineColor || '#F59E0B'
  const gradient = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom)
  gradient.addColorStop(0, mainColor + '4D')
  gradient.addColorStop(1, mainColor + '03')

  ctx.beginPath()
  data.values.forEach((v, i) => {
    const x = pad.left + step * i
    const y = getY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  const lastX = pad.left + step * (data.values.length - 1)
  ctx.lineTo(lastX, H - pad.bottom)
  ctx.lineTo(pad.left, H - pad.bottom)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  data.values.forEach((v, i) => {
    const x = pad.left + step * i
    const y = getY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = mainColor
  ctx.lineWidth = 2
  ctx.stroke()

  data.values.forEach((v, i) => {
    const x = pad.left + step * i
    const y = getY(v)
    const isOver = (threshold?.max !== undefined && v > threshold.max) || (threshold?.min !== undefined && v < threshold.min)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = isOver ? '#EF4444' : mainColor
    ctx.fill()
    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 1.5
    ctx.stroke()
  })

  ctx.fillStyle = '#64748B'
  ctx.font = '10px Noto Sans SC'
  ctx.textAlign = 'center'
  data.labels.forEach((label, i) => {
    const x = pad.left + step * i
    ctx.fillText(label, x, H - pad.bottom + 16)
  })
}

function drawBar(ctx: CanvasRenderingContext2D, W: number, H: number, data: ChartProps['data']) {
  const pad = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom
  const maxVal = Math.max(...data.values, 1)
  const barW = Math.min(chartW / data.values.length * 0.6, 40)
  const gap = chartW / data.values.length
  const defaultColors = ['#1B2A4A', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6']
  const colors = data.colors || defaultColors

  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(W - pad.right, y)
    ctx.stroke()
    ctx.fillStyle = '#94A3B8'
    ctx.font = '11px Noto Sans SC'
    ctx.textAlign = 'right'
    ctx.fillText(Math.round(maxVal - (maxVal / 4) * i).toString(), pad.left - 8, y + 4)
  }

  data.values.forEach((v, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2
    const barH = (v / maxVal) * chartH
    const y = pad.top + chartH - barH
    const color = colors[i % colors.length]

    const grad = ctx.createLinearGradient(x, y, x, H - pad.bottom)
    grad.addColorStop(0, color)
    grad.addColorStop(1, color + '88')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
    ctx.fill()

    ctx.fillStyle = '#64748B'
    ctx.font = '10px Noto Sans SC'
    ctx.textAlign = 'center'
    ctx.fillText(data.labels[i] || '', x + barW / 2, H - pad.bottom + 16)
  })
}

function drawPie(ctx: CanvasRenderingContext2D, W: number, H: number, data: ChartProps['data']) {
  const cx = W / 2
  const cy = H / 2
  const r = Math.min(W, H) / 2 - 40
  const total = data.values.reduce((a, b) => a + b, 0) || 1
  const defaultColors = ['#1B2A4A', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6']
  const colors = data.colors || defaultColors

  let startAngle = -Math.PI / 2
  data.values.forEach((v, i) => {
    const sliceAngle = (v / total) * Math.PI * 2
    const color = colors[i % colors.length]

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 2
    ctx.stroke()

    const midAngle = startAngle + sliceAngle / 2
    const lx = cx + Math.cos(midAngle) * (r * 0.65)
    const ly = cy + Math.sin(midAngle) * (r * 0.65)
    ctx.fillStyle = '#FFF'
    ctx.font = '11px Noto Sans SC'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const pct = Math.round((v / total) * 100)
    if (pct > 5) {
      ctx.fillText(`${pct}%`, lx, ly)
    }

    startAngle += sliceAngle
  })

  const legendY = H - 16
  const legendStart = W / 2 - (data.labels.length * 60) / 2
  data.labels.forEach((label, i) => {
    const x = legendStart + i * 60
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(x, legendY - 6, 8, 8)
    ctx.fillStyle = '#64748B'
    ctx.font = '10px Noto Sans SC'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x + 12, legendY - 2)
  })
}
