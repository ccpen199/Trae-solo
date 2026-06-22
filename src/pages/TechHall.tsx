import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { getCategoryById, getCategoryPath, mockSkillTags } from '../data/mockData'
import { matchTechnicians } from '../utils/matching'
import { formatDistance, formatDateTime } from '../utils/geo'
import {
  MapPin,
  Clock,
  ImageIcon,
  Check,
  X,
  WifiOff,
  Wifi,
  RefreshCw,
  Trash2,
  HardDriveUpload,
  Database,
  FileEdit,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '../components/Modal'
import type { RepairTask } from '../types'

const actionLabels: Record<string, string> = {
  createTask: '创建订单',
  updateTask: '更新订单状态',
  addCheckin: '打卡记录',
  addReview: '提交评价',
  createReport: '生成服务报告',
  uploadPayment: '上传支付凭证',
}

export const TechHall: React.FC = () => {
  const navigate = useNavigate()
  const {
    tasks,
    currentTechnician,
    acceptTask,
    online,
    offlineQueue,
    refreshOfflineQueue,
    syncOfflineQueue,
    removeOfflineItem,
    setOnline,
  } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [bidPrice, setBidPrice] = useState(0)
  const [bidTime, setBidTime] = useState('30分钟内')
  const [bidNote, setBidNote] = useState('')

  useEffect(() => {
    refreshOfflineQueue()
  }, [refreshOfflineQueue])

  const availableTasks = tasks.filter(t => t.status === 'broadcasting')

  const getTaskMatchInfo = (task: RepairTask) => {
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

  const handleToggleOnline = async () => {
    const newOnline = !online
    setOnline(newOnline)
    if (newOnline && offlineQueue.length > 0) {
      await syncOfflineQueue()
    }
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

      <div className={`card border-2 ${
        online ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              online ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {online ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <p className={`font-medium ${online ? 'text-green-700' : 'text-red-700'}`}>
                {online ? '在线模式' : '离线模式'}
              </p>
              <p className="text-xs text-gray-500">
                {online
                  ? '操作将实时同步到本地加密数据库'
                  : '操作将暂存本地队列，恢复在线后自动同步'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleOnline}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              online
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {online ? '切换离线' : '切换在线'}
          </button>
        </div>
      </div>

      {offlineQueue.length > 0 && (
        <div className="card border-2 border-warning-200 bg-warning-50/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2">
              <Database className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">
                  离线缓存队列（{offlineQueue.length} 条待同步）
                </p>
                <p className="text-xs text-warning-700 mt-0.5">
                  切换至在线模式将自动同步以下操作
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshOfflineQueue}
                className="p-2 rounded-lg bg-white border border-warning-200 hover:bg-warning-100 text-warning-700"
                title="刷新队列"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {online && (
                <button
                  onClick={syncOfflineQueue}
                  className="px-3 py-2 rounded-lg bg-success-500 text-white hover:bg-success-600 text-sm font-medium flex items-center gap-1"
                >
                  <HardDriveUpload className="w-4 h-4" /> 立即同步
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {offlineQueue.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-warning-100">
                <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
                  <FileEdit className="w-4 h-4 text-warning-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {actionLabels[item.action] || item.action}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
                {online ? (
                  <span className="badge-info text-xs">待同步</span>
                ) : (
                  <button
                    onClick={() => removeOfflineItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title="删除此条记录"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!online && (
            <div className="mt-3 p-2 bg-white rounded-lg border border-warning-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-warning-700">
                  离线模式下，接单、打卡、生成报告等操作将暂存本地。
                  恢复在线后请及时同步，确保数据一致性。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-700">待接单任务</h3>
        <span className="text-sm text-gray-500">{availableTasks.length} 条可接单</span>
      </div>

      {availableTasks.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium">暂无待接单任务</p>
          <p className="text-sm text-gray-400 mt-1">新订单发布后将在此实时展示</p>
        </div>
      ) : (
        availableTasks.map(task => {
          const cat = getCategoryById(task.categoryId)
          const matchInfo = getTaskMatchInfo(task)
          return (
            <div key={task.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{task.title}</h3>
                    <StatusBadge status={task.status} />
                    {matchInfo && matchInfo.totalScore >= 0.7 && (
                      <span className="badge-success">高度匹配</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cat ? getCategoryPath(cat.id).map(c => c.name).join(' / ') : '未分类'}
                  </p>
                </div>
                {matchInfo && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">匹配度</p>
                    <p className="font-semibold text-primary-600 text-lg">
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
                  {matchInfo ? formatDistance(matchInfo.distanceKm) : task.address.slice(0, 15)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {task.expectedResponseTime}分钟内响应
                </span>
                <span>📅 {formatDateTime(task.createdAt)}</span>
              </div>

              {matchInfo && (
                <div className="flex flex-wrap gap-1">
                  {mockSkillTags.filter(s => currentTechnician?.skillTags.includes(s.id)).slice(0, 4).map(s => (
                    <span key={s.id} className="text-[10px] px-2 py-0.5 rounded bg-primary-50 text-primary-600">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}

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
                  我要接单
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
          {!online && (
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-xs text-warning-700 flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                当前离线，接单操作将暂存本地队列，恢复在线后自动同步
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setSelectedTaskId(null)} className="btn-secondary flex-1">取消</button>
            <button onClick={handleAccept} className="btn-primary flex-1">确认接单</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
