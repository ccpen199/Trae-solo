import { useEffect, useState, useRef } from "react"
import { format } from "date-fns"
import { Clock, MapPin, Shield } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import { getMonitorVessels, getVesselTrack, getFences, getAlerts, handleAlert } from "@/api"
import type { Vessel, TrackPoint, Fence, Alert } from "@/types"

const MAP_BOUNDS = { minLat: 28, maxLat: 33, minLon: 121, maxLon: 127 }

function latLonToXY(lat: number, lon: number, width: number, height: number) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * width
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height
  return { x, y }
}

function severityBadge(severity: string) {
  const map: Record<string, "danger" | "warning" | "info"> = { 严重: "danger", 警告: "warning", 提示: "info" }
  return <Badge variant={map[severity] || "info"}>{severity}</Badge>
}

function statusColor(status: string) {
  const map: Record<string, string> = { 在港: "#3b82f6", 在航: "#10b981", 维修: "#f59e0b" }
  return map[status] || "#64748b"
}

export default function Monitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [track, setTrack] = useState<TrackPoint[]>([])
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [fences, setFences] = useState<Fence[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vRes, fRes, aRes] = await Promise.all([
        getMonitorVessels(),
        getFences(),
        getAlerts({ status: "未处理" }),
      ])
      if (vRes.success && vRes.data) setVessels(vRes.data)
      if (fRes.success && fRes.data) setFences(fRes.data)
      if (aRes.success && aRes.data) setAlerts(aRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const selectVessel = async (v: Vessel) => {
    setSelectedVessel(v)
    const res = await getVesselTrack(v.id)
    if (res.success && res.data) setTrack(res.data)
    else setTrack([])
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = "#0c2d48"
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = "rgba(56, 189, 248, 0.1)"
    ctx.lineWidth = 1
    for (let lat = MAP_BOUNDS.minLat; lat <= MAP_BOUNDS.maxLat; lat++) {
      const { y } = latLonToXY(lat, MAP_BOUNDS.minLon, w, h)
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    for (let lon = MAP_BOUNDS.minLon; lon <= MAP_BOUNDS.maxLon; lon++) {
      const { x } = latLonToXY(MAP_BOUNDS.maxLat, lon, w, h)
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }

    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"
    ctx.lineWidth = 1
    ctx.font = "10px sans-serif"
    ctx.fillStyle = "rgba(148, 163, 184, 0.5)"
    for (let lat = MAP_BOUNDS.minLat; lat <= MAP_BOUNDS.maxLat; lat++) {
      const { y } = latLonToXY(lat, MAP_BOUNDS.minLon, w, h)
      ctx.fillText(`${lat}°N`, 4, y + 12)
    }
    for (let lon = MAP_BOUNDS.minLon; lon <= MAP_BOUNDS.maxLon; lon++) {
      const { x } = latLonToXY(MAP_BOUNDS.maxLat, lon, w, h)
      ctx.fillText(`${lon}°E`, x + 2, h - 4)
    }

    fences.forEach(fence => {
      try {
        const coords = JSON.parse(fence.coordinates)
        if (Array.isArray(coords) && coords.length > 0) {
          ctx.strokeStyle = fence.status === "启用" ? "rgba(245, 158, 11, 0.6)" : "rgba(100, 116, 139, 0.3)"
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          coords.forEach((c: { lat: number; lon: number }, i: number) => {
            const { x, y } = latLonToXY(c.lat, c.lon, w, h)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.closePath()
          ctx.stroke()
          ctx.setLineDash([])
        }
      } catch {}
    })

    if (selectedVessel && track.length > 1) {
      ctx.strokeStyle = "rgba(14, 165, 233, 0.7)"
      ctx.lineWidth = 2
      ctx.beginPath()
      track.forEach((tp, i) => {
        const { x, y } = latLonToXY(tp.latitude, tp.longitude, w, h)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      track.forEach(tp => {
        const { x, y } = latLonToXY(tp.latitude, tp.longitude, w, h)
        ctx.fillStyle = "rgba(14, 165, 233, 0.3)"
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
      })
    }

    vessels.forEach(v => {
      const lat = MAP_BOUNDS.minLat + Math.random() * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)
      const lon = MAP_BOUNDS.minLon + Math.random() * (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)
      const { x, y } = latLonToXY(lat, lon, w, h)
      const color = statusColor(v.status)
      const isSelected = selectedVessel?.id === v.id

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2)
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 9, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = "#e2e8f0"
      ctx.font = "11px sans-serif"
      ctx.fillText(v.name, x + 10, y + 4)
    })
  }, [vessels, track, selectedVessel, fences])

  const onHandleAlert = async (id: number) => {
    await handleAlert(id)
    fetchData()
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col" title="东海海域实时监控">
          <div className="flex-1 relative rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-full cursor-crosshair"
              onClick={(e) => {
                const canvas = canvasRef.current
                if (!canvas) return
                const rect = canvas.getBoundingClientRect()
                const scaleX = canvas.width / rect.width
                const scaleY = canvas.height / rect.height
                const clickX = (e.clientX - rect.left) * scaleX
                const clickY = (e.clientY - rect.top) * scaleY

                vessels.forEach(v => {
                  const lat = MAP_BOUNDS.minLat + (v.id * 0.37 % 1) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)
                  const lon = MAP_BOUNDS.minLon + (v.id * 0.53 % 1) * (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)
                  const { x, y } = latLonToXY(lat, lon, canvas.width, canvas.height)
                  if (Math.abs(clickX - x) < 15 && Math.abs(clickY - y) < 15) {
                    selectVessel(v)
                  }
                })
              }}
            />
          </div>
          {selectedVessel && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg flex items-center gap-6 text-sm">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span className="font-medium text-slate-900">{selectedVessel.name}</span>
              <Badge variant={selectedVessel.status === "在航" ? "success" : "info"}>{selectedVessel.status}</Badge>
              <span className="text-slate-500">船号: {selectedVessel.code}</span>
              {track.length > 0 && (
                <>
                  <span className="text-slate-500">速度: {track[track.length - 1].speed}节</span>
                  <span className="text-slate-500">航向: {track[track.length - 1].heading}°</span>
                  <span className="text-slate-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {format(new Date(track[track.length - 1].recorded_at), "HH:mm:ss")}
                  </span>
                </>
              )}
              <button onClick={() => { setSelectedVessel(null); setTrack([]) }} className="text-slate-400 hover:text-slate-600 ml-auto">清除轨迹</button>
            </div>
          )}
        </Card>
      </div>

      <div className="w-80 space-y-4 overflow-y-auto">
        <Card title="实时告警" action={<Badge variant="danger">{alerts.length}</Badge>}>
          {alerts.length === 0 ? (
            <p className="text-center text-slate-500 py-4">暂无告警</p>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{a.vessel_name || `船${a.vessel_id}`}</span>
                    {severityBadge(a.severity)}
                  </div>
                  <p className="text-xs text-slate-600">{a.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{a.triggered_at ? format(new Date(a.triggered_at), "HH:mm") : ""}</span>
                    <button onClick={() => onHandleAlert(a.id)} className="px-2 py-0.5 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100">处置</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="电子围栏">
          {fences.length === 0 ? (
            <p className="text-center text-slate-500 py-4">暂无围栏</p>
          ) : (
            <div className="space-y-2">
              {fences.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.fence_type}</p>
                  </div>
                  <Badge variant={f.status === "启用" ? "success" : "default"}>{f.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
