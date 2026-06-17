import { useState } from 'react'
import { Shield, CheckCircle, MapPin } from 'lucide-react'

const boundaryPoints = [
  { name: '北端', lng: 121.265, lat: 31.082 },
  { name: '东北', lng: 121.298, lat: 31.075 },
  { name: '东端', lng: 121.315, lat: 31.045 },
  { name: '东南', lng: 121.295, lat: 31.005 },
  { name: '南端', lng: 121.245, lat: 30.985 },
  { name: '西南', lng: 121.195, lat: 31.005 },
  { name: '西端', lng: 121.185, lat: 31.045 },
  { name: '西北', lng: 121.205, lat: 31.075 },
]

const townPositions = [
  { name: '中山街道', x: 200, y: 130 },
  { name: '方松街道', x: 280, y: 160 },
  { name: '永丰街道', x: 160, y: 200 },
  { name: '岳阳街道', x: 240, y: 210 },
  { name: '广富林街道', x: 320, y: 130 },
  { name: '九里亭街道', x: 350, y: 110 },
  { name: '泗泾镇', x: 130, y: 150 },
  { name: '佘山镇', x: 100, y: 120 },
  { name: '车墩镇', x: 200, y: 260 },
  { name: '新桥镇', x: 330, y: 250 },
]

function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng
    const xj = polygon[j].lat, yj = polygon[j].lng
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

const svgPolygon = boundaryPoints.map((_, i) => {
  const points = [
    '200,80', '350,90', '390,160', '380,240', '300,290',
    '170,280', '120,210', '130,130',
  ]
  return points[i]
}).join(' ')

export default function Geofence() {
  const [testLat, setTestLat] = useState('')
  const [testLng, setTestLng] = useState('')
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const handleTest = () => {
    const lat = parseFloat(testLat)
    const lng = parseFloat(testLng)
    if (isNaN(lat) || isNaN(lng)) return
    const result = isPointInPolygon(lat, lng, boundaryPoints.map((p) => ({ lat: p.lat, lng: p.lng })))
    setTestResult(result)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700">松江区</h3>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle className="w-4 h-4 text-secondary" />
            <span className="text-sm text-secondary font-medium">围栏已启用</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">松江区地图轮廓</h3>
        <div className="flex justify-center">
          <svg width="480" height="360" viewBox="0 0 480 360" className="bg-blue-50 rounded-lg">
            <polygon
              points={svgPolygon}
              fill="#165DFF" fillOpacity="0.1"
              stroke="#165DFF" strokeWidth="2"
              className="transition-all duration-300"
            />
            {townPositions.map((town) => (
              <g key={town.name}>
                <circle cx={town.x} cy={town.y} r="3" fill="#165DFF" />
                <text x={town.x} y={town.y - 8} textAnchor="middle" fontSize="10" fill="#4E5969">
                  {town.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">边界坐标</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left px-4 py-3 font-medium">点位</th>
                <th className="text-left px-4 py-3 font-medium">经度 (lng)</th>
                <th className="text-left px-4 py-3 font-medium">纬度 (lat)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boundaryPoints.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.lng}</td>
                  <td className="px-4 py-3">{p.lat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">围栏测试</h3>
        <p className="text-sm text-gray-500 mb-4">输入经纬度测试是否在松江区围栏范围内</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">纬度 (lat)</label>
            <input
              value={testLat}
              onChange={(e) => { setTestLat(e.target.value); setTestResult(null) }}
              placeholder="31.0450"
              className="input-field text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">经度 (lng)</label>
            <input
              value={testLng}
              onChange={(e) => { setTestLng(e.target.value); setTestResult(null) }}
              placeholder="121.2450"
              className="input-field text-sm"
            />
          </div>
          <button onClick={handleTest} className="btn-primary flex items-center gap-2">
            <MapPin className="w-4 h-4" />测试
          </button>
        </div>
        {testResult !== null && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${testResult ? 'bg-secondary-50 text-secondary' : 'bg-danger-50 text-danger'}`}>
            {testResult ? '✓ 该坐标在松江区围栏范围内' : '✗ 该坐标不在松江区围栏范围内'}
          </div>
        )}
      </div>
    </div>
  )
}
