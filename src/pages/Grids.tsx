import { useState, useEffect } from 'react'
import { Map, Thermometer, CloudRain, Cloud, Sun, Users, AlertTriangle, Loader2, X, Edit2, Save, type LucideIcon } from 'lucide-react'
import { api } from '@/lib/api'

interface Grid {
  id: number
  grid_code: string
  grid_name: string
  center_lat: number
  center_lng: number
  heat_density: number
  rider_count: number
  active_orders: number
  load_balance_coefficient: number
  weather_factor: number
  weather_description: string
  created_at: string
  updated_at: string
}

interface GridDetail extends Grid {
  live_rider_count: number
  live_active_orders: number
}

interface CapacityGap extends Grid {
  gap_level: 'critical' | 'warning' | 'normal'
  rider_shortage: number
}

const weatherIcons: Record<string, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
}

const weatherLabels: Record<string, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
}

const gapLevelColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  normal: 'bg-green-100 text-green-800 border-green-200',
}

const gapLevelLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  normal: '正常',
}

function getHeatColor(heatDensity: number): string {
  if (heatDensity < 0.25) return 'bg-green-400'
  if (heatDensity < 0.5) return 'bg-yellow-400'
  if (heatDensity < 0.75) return 'bg-orange-400'
  return 'bg-red-500'
}

function getHeatOpacity(heatDensity: number): number {
  return 0.3 + heatDensity * 0.7
}

export default function Grids() {
  const [grids, setGrids] = useState<Grid[]>([])
  const [capacityGaps, setCapacityGaps] = useState<CapacityGap[]>([])
  const [selectedGrid, setSelectedGrid] = useState<GridDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    heat_density: 0,
    load_balance_coefficient: 0,
    weather_factor: 0,
    weather_description: 'sunny',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [gridsData, gapsData] = await Promise.all([
          api.getGrids(),
          api.getCapacityGaps(),
        ])
        setGrids(gridsData || [])
        setCapacityGaps(gapsData || [])
      } catch (error) {
        console.error('Failed to fetch grids data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGridClick = async (gridId: number) => {
    try {
      setDetailLoading(true)
      setModalOpen(true)
      const data = await api.getGrid(gridId)
      setSelectedGrid(data)
      setEditForm({
        heat_density: data.heat_density,
        load_balance_coefficient: data.load_balance_coefficient,
        weather_factor: data.weather_factor,
        weather_description: data.weather_description,
      })
    } catch (error) {
      console.error('Failed to fetch grid detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedGrid) return
    try {
      setSaving(true)
      await api.updateGrid(selectedGrid.id, editForm)
      const updatedGrid = await api.getGrid(selectedGrid.id)
      setSelectedGrid(updatedGrid)
      setIsEditing(false)
      const [gridsData, gapsData] = await Promise.all([
        api.getGrids(),
        api.getCapacityGaps(),
      ])
      setGrids(gridsData || [])
      setCapacityGaps(gapsData || [])
    } catch (error) {
      console.error('Failed to update grid:', error)
    } finally {
      setSaving(false)
    }
  }

  const totalGrids = grids.length
  const totalActiveOrders = grids.reduce((sum, g) => sum + g.active_orders, 0)
  const avgLoadBalance = grids.length > 0
    ? (grids.reduce((sum, g) => sum + g.load_balance_coefficient, 0) / grids.length).toFixed(2)
    : '0'

  const sortedGrids = [...grids].sort((a, b) => a.grid_code.localeCompare(b.grid_code))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">容量网格管理</h1>
        <span className="text-sm text-gray-500">
          最后更新: {new Date().toLocaleString('zh-CN')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Map className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              网格统计
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总网格数</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalGrids}</p>
            <p className="text-sm text-gray-500 mt-2">覆盖城市主要配送区域</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Thermometer className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              订单热力
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">活跃订单</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalActiveOrders}</p>
            <p className="text-sm text-gray-500 mt-2">全网格正在处理订单</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              负载均衡
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">平均负载系数</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{avgLoadBalance}</p>
            <p className="text-sm text-gray-500 mt-2">
              {Number(avgLoadBalance) > 1 ? '运力过剩' : Number(avgLoadBalance) < 1 ? '运力紧张' : '供需平衡'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">热力图分布</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400"></div>
              <span className="text-gray-600">低密度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400"></div>
              <span className="text-gray-600">中低密度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-400"></div>
              <span className="text-gray-600">中高密度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-gray-600">高密度</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {sortedGrids.map((grid) => {
            const WeatherIcon = weatherIcons[grid.weather_description] || Sun
            const heatColor = getHeatColor(grid.heat_density)
            const opacity = getHeatOpacity(grid.heat_density)
            
            return (
              <div
                key={grid.id}
                onClick={() => handleGridClick(grid.id)}
                className={`relative p-5 rounded-xl border-2 border-gray-200 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden`}
                style={{ backgroundColor: `rgba(var(--${heatColor.replace('bg-', '')}-rgb), ${opacity})` }}
              >
                <div
                  className={`absolute inset-0 ${heatColor} opacity-${Math.round(opacity * 100)}`}
                  style={{ opacity }}
                ></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-700 bg-white/80 px-2 py-1 rounded">
                        {grid.grid_code}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-2">{grid.grid_name}</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded">
                      <WeatherIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">{weatherLabels[grid.weather_description] || grid.weather_description}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">热力密度</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round(grid.heat_density * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Users className="w-4 h-4" /> 骑手
                      </span>
                      <span className="text-sm font-bold text-gray-900">{grid.rider_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Thermometer className="w-4 h-4" /> 订单
                      </span>
                      <span className="text-sm font-bold text-gray-900">{grid.active_orders}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-300/50">
                    <p className="text-xs text-gray-600 text-center">点击查看详情</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">容量缺口告警</h2>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
            {capacityGaps.filter(g => g.rider_shortage > 0).length} 个区域运力紧张
          </span>
        </div>

        <div className="space-y-3">
          {capacityGaps.filter(g => g.rider_shortage > 0).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-sm">所有区域运力充足</p>
            </div>
          ) : (
            capacityGaps
              .filter(g => g.rider_shortage > 0)
              .map((gap) => (
                <div
                  key={gap.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${gapLevelColors[gap.gap_level] || gapLevelColors.normal}`}
                >
                  <div className="flex items-center gap-4">
                    <AlertTriangle className={`w-5 h-5 ${
                      gap.gap_level === 'critical' ? 'text-red-600' : 
                      gap.gap_level === 'warning' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{gap.grid_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                          {gap.grid_code}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mt-1">
                        骑手 {gap.rider_count} 人 / 订单 {gap.active_orders} 单
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">缺口 {gap.rider_shortage} 人</p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          gap.gap_level === 'critical' ? 'bg-red-200 text-red-800' :
                          gap.gap_level === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}
                      >
                        {gapLevelLabels[gap.gap_level]}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : selectedGrid && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {selectedGrid.grid_code}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900">{selectedGrid.grid_name}</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      中心坐标: {selectedGrid.center_lat.toFixed(4)}, {selectedGrid.center_lng.toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setModalOpen(false)
                      setIsEditing(false)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">热力密度</p>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={editForm.heat_density}
                          onChange={(e) => setEditForm({ ...editForm, heat_density: parseFloat(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {Math.round(selectedGrid.heat_density * 100)}%
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">负载平衡系数</p>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.load_balance_coefficient}
                          onChange={(e) => setEditForm({ ...editForm, load_balance_coefficient: parseFloat(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {selectedGrid.load_balance_coefficient.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">天气系数</p>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={editForm.weather_factor}
                          onChange={(e) => setEditForm({ ...editForm, weather_factor: parseFloat(e.target.value) })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {selectedGrid.weather_factor.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">天气状况</p>
                      {isEditing ? (
                        <select
                          value={editForm.weather_description}
                          onChange={(e) => setEditForm({ ...editForm, weather_description: e.target.value })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="sunny">晴天</option>
                          <option value="cloudy">多云</option>
                          <option value="rainy">雨天</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const WeatherIcon = weatherIcons[selectedGrid.weather_description] || Sun
                            return <WeatherIcon className="w-6 h-6 text-gray-600" />
                          })()}
                          <p className="text-2xl font-bold text-gray-900">
                            {weatherLabels[selectedGrid.weather_description] || selectedGrid.weather_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">实时数据</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-700">区域在线骑手</p>
                          <p className="text-xl font-bold text-blue-900">{selectedGrid.live_rider_count} 人</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Thermometer className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-orange-700">区域活跃订单</p>
                          <p className="text-xl font-bold text-orange-900">{selectedGrid.live_active_orders} 单</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setEditForm({
                              heat_density: selectedGrid.heat_density,
                              load_balance_coefficient: selectedGrid.load_balance_coefficient,
                              weather_factor: selectedGrid.weather_factor,
                              weather_description: selectedGrid.weather_description,
                            })
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          保存
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
