import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { getCategoryById, getCategoryPath } from '../data/mockData'
import { matchTechnicians } from '../utils/matching'
import { formatDistance, formatDateTime } from '../utils/geo'
import { MapPin, Clock, ImageIcon, Check, X } from 'lucide-react'
import { Modal } from '../components/Modal'

export const TechHall: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, currentTechnician, technicians, acceptTask, online } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [bidPrice, setBidPrice] = useState(0)
  const [bidTime, setBidTime] = useState('30分钟内')
  const [bidNote, setBidNote] = useState('')

  const availableTasks = tasks.filter(t => t.status === 'broadcasting')

  const getTaskMatchInfo = (task: ReturnType<typeof useAppStore.getState>['tasks'][0]) => {
    if (!currentTechnician) return null
    const matched = matchTechnicians(task, [currentTechnician], task.location)
    return matched[0] || null
  }

  const handleAccept = async () => {
    if (!selectedTaskId || !currentTechnician) return
    await acceptTask(selectedTaskId, currentTechnician.id)
    setSelectedTaskId(null)
    navigate('/tech/tasks')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">接单大厅</h2>
        {currentTechnician?.frozen && (
          <span className="badge-danger">账号已冻结</span>
        )}
      </div>

      {currentTechnician && (
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
              {currentTechnician.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentTechnician.name}</p>
              <p className="text-sm text-gray-500">
                服务半径{currentTechnician.serviceRadius}公里 · 评分{currentTechnician.rating}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">累计接单</p>
              <p className="font-semibold text-lg">{currentTechnician.reviewCount}</p>
            </div>
          </div>
        </div>
      )}

      {!online && (
        <div className="card bg-warning-50 border-warning-200">
          <p className="text-sm text-warning-700">
            ⚠️ 当前处于离线模式，操作将暂存本地，待恢复在线后自动同步
          </p>
        </div>
      )}

      {availableTasks.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          暂无待接单任务
        </div>
      ) : (
        availableTasks.map(task => {
          const cat = getCategoryById(task.categoryId)
          const matchInfo = getTaskMatchInfo(task)
          return (
            <div key={task.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cat ? getCategoryPath(cat.id).map(c => c.name).join(' / ') : '未分类'}
                  </p>
                </div>
                {matchInfo && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">匹配度</p>
                    <p className="font-semibold text-primary-600">
                      {Math.round(matchInfo.totalScore * 100)}%
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

              {task.images.length > 0 && (
                <div className="flex gap-2">
                  {task.images.slice(0, 3).map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {task.images.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      +{task.images.length - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {matchInfo ? formatDistance(matchInfo.distanceKm) : task.address.slice(0, 10)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {task.expectedResponseTime}分钟内响应
                </span>
                <span>📅 {formatDateTime(task.createdAt)}</span>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button className="btn-secondary flex-1">
                  <X className="w-4 h-4 inline mr-1" />
                  忽略
                </button>
                <button
                  onClick={() => setSelectedTaskId(task.id)}
                  disabled={currentTechnician?.frozen}
                  className="btn-primary flex-1"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  接单
                </button>
              </div>
            </div>
          )
        })
      )}

      <Modal
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title="确认接单"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{tasks.find(t => t.id === selectedTaskId)?.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              {tasks.find(t => t.id === selectedTaskId)?.address}
            </p>
          </div>
          <div>
            <label className="label">预估报价（元）</label>
            <input
              type="number"
              className="input"
              value={bidPrice}
              onChange={e => setBidPrice(parseFloat(e.target.value))}
              placeholder="请输入预估价格"
            />
          </div>
          <div>
            <label className="label">预计上门时间</label>
            <select
              className="input"
              value={bidTime}
              onChange={e => setBidTime(e.target.value)}
            >
              <option>30分钟内</option>
              <option>1小时内</option>
              <option>2小时内</option>
              <option>今天内</option>
              <option>明天</option>
            </select>
          </div>
          <div>
            <label className="label">备注（可选）</label>
            <textarea
              className="input min-h-[80px]"
              value={bidNote}
              onChange={e => setBidNote(e.target.value)}
              placeholder="可补充说明服务方案等"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSelectedTaskId(null)} className="btn-secondary flex-1">取消</button>
            <button onClick={handleAccept} className="btn-primary flex-1">确认接单</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
