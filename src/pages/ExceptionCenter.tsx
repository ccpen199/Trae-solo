import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Phone,
  UserCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  Search,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Package,
  Eye,
  Shield,
  X,
  MessageSquare,
  FileText,
  ExternalLink,
  Activity,
  PhoneCall,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { ExceptionOrder } from '../../api/types'

const levelConfig: Record<number, { label: string; color: string; bgColor: string; icon: any }> = {
  1: { label: '一级响应', color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10', icon: Bell },
  2: { label: '二级响应', color: 'text-sf-orange', bgColor: 'bg-sf-orange/10', icon: Phone },
  3: { label: '三级响应', color: 'text-sf-red', bgColor: 'bg-sf-red/10', icon: UserCheck },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  alert: { label: '系统告警', color: 'text-sf-yellow' },
  called: { label: '客服外呼', color: 'text-sf-orange' },
  manager_intervened: { label: '经理介入', color: 'text-sf-red' },
  resolved: { label: '已解决', color: 'text-sf-green' },
}

const typeConfig: Record<string, { label: string }> = {
  address_error: { label: '地址错误' },
  phone_error: { label: '联系电话错误' },
  recipient_absent: { label: '收件人不在' },
  weather_delay: { label: '天气延误' },
  traffic_delay: { label: '交通延误' },
  damage: { label: '物品破损' },
  lost: { label: '物品丢失' },
  other: { label: '其他异常' },
}

interface ResponseLevelDetail {
  level: number
  status: 'completed' | 'active' | 'pending'
  triggerTime: string | null
  handler: string | null
  result: string | null
  autoDetectionResult: string | null
  alertNotificationStatus: string | null
  callTime: string | null
  callResult: string | null
  customerFeedback: string | null
  interventionTime: string | null
  actionTaken: string | null
  resolution: string | null
}

interface ResponseLogEntry {
  id: number
  time: string
  action: string
  operator: string
  detail: string
  level: number
}

function buildResponseLevels(exception: ExceptionOrder): ResponseLevelDetail[] {
  const currentLevel = exception.level || 1
  const isResolved = exception.response_status === 'resolved'

  return [1, 2, 3].map((lvl) => {
    const isActive = currentLevel >= lvl
    const isCompleted = isActive && (currentLevel > lvl || isResolved)

    let triggerTime: string | null = null
    let handler: string | null = null
    let result: string | null = null
    let autoDetectionResult: string | null = null
    let alertNotificationStatus: string | null = null
    let callTime: string | null = null
    let callResult: string | null = null
    let customerFeedback: string | null = null
    let interventionTime: string | null = null
    let actionTaken: string | null = null
    let resolution: string | null = null

    if (lvl === 1 && isActive) {
      triggerTime = exception.detected_at || exception.created_at || null
      autoDetectionResult = `系统检测到${typeConfig[exception.exception_type || exception.type]?.label || '异常'}，自动触发一级告警`
      alertNotificationStatus = isCompleted ? '已通知相关人员' : currentLevel === 1 ? '告警通知已发送，等待人工确认' : '已确认，已升级至二级'
      handler = '系统自动'
      result = isCompleted ? '告警已确认' : '等待确认'
    }

    if (lvl === 2 && isActive) {
      triggerTime = exception.responded_at || null
      callTime = exception.responded_at || null
      handler = exception.operator || '客服专员'
      callResult = isCompleted ? '已联系客户' : '正在联系客户'
      customerFeedback = exception.response_note || null
      result = isCompleted ? '外呼完成' : '处理中'
    }

    if (lvl === 3 && isActive) {
      interventionTime = exception.responded_at || null
      handler = exception.operator || '片区经理'
      actionTaken = exception.response_note || '介入处理中'
      resolution = isResolved ? (exception.response_note || '问题已解决') : null
      triggerTime = exception.responded_at || null
      result = isResolved ? '已解决' : '处理中'
    }

    return {
      level: lvl,
      status: isCompleted ? 'completed' : isActive ? 'active' : 'pending',
      triggerTime,
      handler,
      result,
      autoDetectionResult,
      alertNotificationStatus,
      callTime,
      callResult,
      customerFeedback,
      interventionTime,
      actionTaken,
      resolution,
    }
  })
}

function buildResponseLog(exception: ExceptionOrder): ResponseLogEntry[] {
  const logs: ResponseLogEntry[] = []
  const currentLevel = exception.level || 1
  const isResolved = exception.response_status === 'resolved'

  logs.push({
    id: 1,
    time: exception.detected_at || exception.created_at || '',
    action: '异常检测',
    operator: '系统',
    detail: `检测到${typeConfig[exception.exception_type || exception.type]?.label || '异常'}：${exception.description}`,
    level: 1,
  })

  logs.push({
    id: 2,
    time: exception.detected_at || exception.created_at || '',
    action: '发送告警通知',
    operator: '系统',
    detail: `已向相关人员发送告警通知（一级响应）`,
    level: 1,
  })

  if (currentLevel >= 2) {
    logs.push({
      id: 3,
      time: exception.responded_at || '',
      action: '客服外呼',
      operator: exception.operator || '客服专员',
      detail: `客服${exception.operator || '专员'}已外呼收件人${exception.receiver_name || ''}`,
      level: 2,
    })
    if (exception.response_note) {
      logs.push({
        id: 4,
        time: exception.responded_at || '',
        action: '记录处理结果',
        operator: exception.operator || '客服专员',
        detail: exception.response_note,
        level: 2,
      })
    }
  }

  if (currentLevel >= 3) {
    logs.push({
      id: 5,
      time: exception.responded_at || '',
      action: '升级至经理',
      operator: '系统',
      detail: `异常已升级至三级响应，片区经理介入处理`,
      level: 3,
    })
    if (exception.operator) {
      logs.push({
        id: 6,
        time: exception.responded_at || '',
        action: '经理处理',
        operator: exception.operator,
        detail: exception.response_note || '经理正在处理中',
        level: 3,
      })
    }
  }

  if (isResolved) {
    logs.push({
      id: 7,
      time: exception.resolved_at || exception.responded_at || '',
      action: '异常解决',
      operator: exception.operator || '系统',
      detail: `异常已解决${exception.response_note ? '：' + exception.response_note : ''}`,
      level: currentLevel,
    })
  }

  return logs
}

const ExceptionDetailPanel: React.FC<{
  exception: ExceptionOrder
  onClose: () => void
  onRespond: (ex: ExceptionOrder) => void
  onEscalate: (ex: ExceptionOrder) => void
  onReview: (ex: ExceptionOrder) => void
}> = ({ exception, onClose, onRespond, onEscalate, onReview }) => {
  const navigate = useNavigate()
  const levels = buildResponseLevels(exception)
  const responseLog = buildResponseLog(exception)
  const level = levelConfig[exception.level] || levelConfig[1]
  const status = statusConfig[exception.response_status] || statusConfig.alert
  const type = typeConfig[exception.exception_type || exception.type] || typeConfig.other

  const navigateToTrack = () => {
    if (exception.order_id) {
      navigate(`/track/${exception.order_id}`)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[640px] bg-sf-black/95 backdrop-blur-xl border-l border-sf-blue/30 z-50 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-sf-blue/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-sf-blue/30 flex items-center justify-center text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
          >
            <X size={18} />
          </button>
          <div>
            <h2 className="text-lg font-display text-sf-light">异常详情</h2>
            <p className="text-sf-light/50 text-sm">{exception.tracking_no || exception.order_no}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded text-xs ${level.bgColor} ${level.color}`}>
            {level.label}
          </span>
          <span className={`px-3 py-1 rounded text-xs bg-sf-dark ${status.color}`}>
            {status.label}
          </span>
          <span className="px-3 py-1 rounded text-xs bg-sf-dark text-sf-light/70">
            {type.label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-sf-yellow" />
            <span className="text-sf-light text-sm font-medium">异常信息</span>
          </div>
          <p className="text-sf-light/70 text-sm mb-3">{exception.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-sf-light/50">收件人:</span>
              <span className="text-sf-light ml-2">{exception.receiver_name}</span>
            </div>
            <div>
              <span className="text-sf-light/50">联系电话:</span>
              <span className="text-sf-light ml-2">{exception.receiver_phone}</span>
            </div>
            <div>
              <span className="text-sf-light/50">检测时间:</span>
              <span className="text-sf-light ml-2 font-mono text-xs">
                {exception.detected_at ? new Date(exception.detected_at).toLocaleString('zh-CN') : '-'}
              </span>
            </div>
            <div>
              <span className="text-sf-light/50">解决时间:</span>
              <span className="text-sf-light ml-2 font-mono text-xs">
                {exception.resolved_at ? new Date(exception.resolved_at).toLocaleString('zh-CN') : '-'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-sf-blue" />
            <h3 className="text-sm font-medium text-sf-light">三级响应时间线</h3>
          </div>
          <div className="space-y-0">
            {levels.map((lvl, idx) => {
              const lvlCfg = levelConfig[lvl.level]
              const LvlIcon = lvlCfg.icon
              const isLast = idx === levels.length - 1

              return (
                <div key={lvl.level} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      lvl.status === 'completed'
                        ? 'bg-sf-green/20'
                        : lvl.status === 'active'
                        ? `${lvlCfg.bgColor} ring-2 ring-current ${lvlCfg.color} animate-pulse`
                        : 'bg-sf-dark/50 opacity-40'
                    }`}>
                      {lvl.status === 'completed' ? (
                        <CheckCircle size={18} className="text-sf-green" />
                      ) : (
                        <LvlIcon size={18} className={lvl.status === 'active' ? lvlCfg.color : 'text-sf-light/30'} />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[40px] ${
                        lvl.status === 'completed' ? 'bg-sf-green/30' : 'bg-sf-blue/10'
                      }`} />
                    )}
                  </div>
                  <div className={`flex-1 pb-6 ${lvl.status === 'pending' ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium text-sm ${lvl.status === 'pending' ? 'text-sf-light/30' : 'text-sf-light'}`}>
                        L{lvl.level} {lvlCfg.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        lvl.status === 'completed' ? 'bg-sf-green/10 text-sf-green' :
                        lvl.status === 'active' ? `${lvlCfg.bgColor} ${lvlCfg.color}` :
                        'bg-sf-dark/50 text-sf-light/30'
                      }`}>
                        {lvl.status === 'completed' ? '已完成' : lvl.status === 'active' ? '进行中' : '待触发'}
                      </span>
                    </div>

                    {lvl.level === 1 && lvl.status !== 'pending' && (
                      <div className="space-y-2 p-3 bg-sf-dark/30 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-sf-light/50" />
                          <span className="text-sf-light/50">触发时间:</span>
                          <span className="text-sf-light font-mono text-xs">
                            {lvl.triggerTime ? new Date(lvl.triggerTime).toLocaleString('zh-CN') : '-'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Activity size={12} className="text-sf-light/50 mt-0.5" />
                          <span className="text-sf-light/50">自动检测结果:</span>
                          <span className="text-sf-light/70">{lvl.autoDetectionResult || '-'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Bell size={12} className="text-sf-light/50 mt-0.5" />
                          <span className="text-sf-light/50">通知状态:</span>
                          <span className={lvl.status === 'completed' ? 'text-sf-green' : 'text-sf-yellow'}>
                            {lvl.alertNotificationStatus || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sf-light/50">处理人:</span>
                          <span className="text-sf-light">{lvl.handler || '-'}</span>
                        </div>
                      </div>
                    )}

                    {lvl.level === 2 && lvl.status !== 'pending' && (
                      <div className="space-y-2 p-3 bg-sf-dark/30 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck size={12} className="text-sf-light/50" />
                          <span className="text-sf-light/50">操作人:</span>
                          <span className="text-sf-light">{lvl.handler || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneCall size={12} className="text-sf-light/50" />
                          <span className="text-sf-light/50">外呼时间:</span>
                          <span className="text-sf-light font-mono text-xs">
                            {lvl.callTime ? new Date(lvl.callTime).toLocaleString('zh-CN') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sf-light/50">外呼结果:</span>
                          <span className={lvl.status === 'completed' ? 'text-sf-green' : 'text-sf-orange'}>
                            {lvl.callResult || '-'}
                          </span>
                        </div>
                        {lvl.customerFeedback && (
                          <div className="flex items-start gap-2">
                            <MessageSquare size={12} className="text-sf-light/50 mt-0.5" />
                            <span className="text-sf-light/50">客户反馈:</span>
                            <span className="text-sf-light/70">{lvl.customerFeedback}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {lvl.level === 3 && lvl.status !== 'pending' && (
                      <div className="space-y-2 p-3 bg-sf-dark/30 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck size={12} className="text-sf-light/50" />
                          <span className="text-sf-light/50">经理:</span>
                          <span className="text-sf-light">{lvl.handler || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-sf-light/50" />
                          <span className="text-sf-light/50">介入时间:</span>
                          <span className="text-sf-light font-mono text-xs">
                            {lvl.interventionTime ? new Date(lvl.interventionTime).toLocaleString('zh-CN') : '-'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FileText size={12} className="text-sf-light/50 mt-0.5" />
                          <span className="text-sf-light/50">采取措施:</span>
                          <span className="text-sf-light/70">{lvl.actionTaken || '-'}</span>
                        </div>
                        {lvl.resolution && (
                          <div className="flex items-start gap-2">
                            <CheckCircle size={12} className="text-sf-green mt-0.5" />
                            <span className="text-sf-light/50">解决结果:</span>
                            <span className="text-sf-green">{lvl.resolution}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {lvl.status === 'pending' && (
                      <p className="text-sf-light/30 text-sm italic">待上一级响应升级后触发</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-sf-blue" />
            <h3 className="text-sm font-medium text-sf-light">响应历史记录</h3>
          </div>
          <div className="space-y-2">
            {responseLog.map((log) => {
              const lvlCfg = levelConfig[log.level]
              return (
                <div key={log.id} className="p-3 bg-sf-dark/30 rounded-lg border border-sf-blue/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${lvlCfg.bgColor} ${lvlCfg.color}`}>
                        L{log.level}
                      </span>
                      <span className="text-sf-light text-sm font-medium">{log.action}</span>
                    </div>
                    <span className="text-sf-light/40 text-xs font-mono">
                      {log.time ? new Date(log.time).toLocaleString('zh-CN') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-sf-light/50">操作人: {log.operator}</span>
                    <span className="text-sf-light/30">·</span>
                    <span className="text-sf-light/70">{log.detail}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-sf-blue/20 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={navigateToTrack}
          className="flex-1 h-11 rounded-lg border border-sf-blue/30 text-sf-blue hover:bg-sf-blue/10 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          查看运单详情
        </button>
        {exception.response_status !== 'resolved' && (
          <>
            <button
              onClick={() => onReview(exception)}
              className="flex-1 h-11 rounded-lg border border-sf-yellow/30 text-sf-yellow hover:bg-sf-yellow/10 transition-colors flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              复核
            </button>
            {exception.level < 3 && (
              <button
                onClick={() => onEscalate(exception)}
                className="h-11 px-4 rounded-lg bg-sf-orange/10 text-sf-orange hover:bg-sf-orange/20 transition-colors flex items-center gap-2"
              >
                <ArrowUpRight size={16} />
                升级
              </button>
            )}
            <button
              onClick={() => onRespond(exception)}
              className="h-11 px-4 rounded-lg bg-sf-red text-white hover:bg-sf-red/90 transition-colors flex items-center gap-2"
            >
              <FileText size={16} />
              处理
            </button>
          </>
        )}
        {exception.response_status === 'resolved' && (
          <button
            onClick={() => onReview(exception)}
            className="flex-1 h-11 rounded-lg border border-sf-green/30 text-sf-green hover:bg-sf-green/10 transition-colors flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            复核
          </button>
        )}
      </div>
    </div>
  )
}

const ReviewPanel: React.FC<{
  exception: ExceptionOrder
  onClose: () => void
  onConfirm: (ex: ExceptionOrder, note: string) => void
  onEscalate: (ex: ExceptionOrder, note: string) => void
}> = ({ exception, onClose, onConfirm, onEscalate }) => {
  const navigate = useNavigate()
  const [reviewNote, setReviewNote] = useState('')
  const levels = buildResponseLevels(exception)
  const responseLog = buildResponseLog(exception)
  const level = levelConfig[exception.level] || levelConfig[1]
  const status = statusConfig[exception.response_status] || statusConfig.alert
  const type = typeConfig[exception.exception_type || exception.type] || typeConfig.other

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-sf-black border border-sf-blue/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-sf-blue/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sf-yellow/10 rounded-xl flex items-center justify-center">
              <Eye size={20} className="text-sf-yellow" />
            </div>
            <div>
              <h3 className="text-lg font-display text-sf-light">异常复核</h3>
              <p className="text-sf-light/50 text-sm">{exception.tracking_no || exception.order_no}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-sf-blue/30 flex items-center justify-center text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-red/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-sf-red" />
              <span className="text-sf-light text-sm font-medium">原始异常检测</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-sf-light/50">异常类型:</span>
                <span className="text-sf-light ml-2">{type.label}</span>
              </div>
              <div>
                <span className="text-sf-light/50">当前级别:</span>
                <span className={`${level.color} ml-2`}>{level.label}</span>
              </div>
              <div>
                <span className="text-sf-light/50">检测时间:</span>
                <span className="text-sf-light ml-2 font-mono text-xs">
                  {exception.detected_at ? new Date(exception.detected_at).toLocaleString('zh-CN') : '-'}
                </span>
              </div>
              <div>
                <span className="text-sf-light/50">当前状态:</span>
                <span className={`${status.color} ml-2`}>{status.label}</span>
              </div>
            </div>
            <p className="text-sf-light/70 text-sm mt-2">{exception.description}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-sf-blue" />
              <span className="text-sf-light text-sm font-medium">响应动作记录</span>
            </div>
            <div className="space-y-2">
              {responseLog.map((log) => {
                const lvlCfg = levelConfig[log.level]
                return (
                  <div key={log.id} className="flex items-start gap-3 p-2 bg-sf-dark/30 rounded-lg text-sm">
                    <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${lvlCfg.bgColor} ${lvlCfg.color}`}>
                      L{log.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sf-light font-medium">{log.action}</span>
                        <span className="text-sf-light/40 text-xs">{log.operator}</span>
                      </div>
                      <p className="text-sf-light/60 text-xs mt-0.5 truncate">{log.detail}</p>
                    </div>
                    <span className="text-sf-light/30 text-xs flex-shrink-0 font-mono">
                      {log.time ? new Date(log.time).toLocaleTimeString('zh-CN', { hour12: false }) : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/10">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} className="text-sf-green" />
              <span className="text-sf-light text-sm font-medium">当前解决状态</span>
            </div>
            <div className="flex items-center gap-4">
              {levels.map((lvl) => {
                const lvlCfg = levelConfig[lvl.level]
                return (
                  <div key={lvl.level} className="flex-1 p-3 rounded-lg border border-sf-blue/10 bg-sf-dark/30">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        lvl.status === 'completed' ? 'bg-sf-green' :
                        lvl.status === 'active' ? 'bg-sf-yellow animate-pulse' :
                        'bg-sf-light/20'
                      }`} />
                      <span className={`text-xs font-medium ${lvl.status === 'pending' ? 'text-sf-light/30' : lvlCfg.color}`}>
                        L{lvl.level}
                      </span>
                    </div>
                    <div className="text-xs text-sf-light/50">
                      {lvl.status === 'completed' ? '已完成' : lvl.status === 'active' ? '进行中' : '待触发'}
                    </div>
                  </div>
                )
              })}
            </div>
            {exception.response_note && (
              <div className="mt-3 p-2 bg-sf-dark/50 rounded text-sm">
                <span className="text-sf-light/50">处理备注: </span>
                <span className="text-sf-light/70">{exception.response_note}</span>
                {exception.operator && <span className="text-sf-blue ml-2">({exception.operator})</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-sf-light/70 mb-2">复核意见</label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
              placeholder="请填写复核意见..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-sf-blue/20 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              if (exception.order_id) navigate(`/track/${exception.order_id}`)
            }}
            className="h-11 px-4 rounded-lg border border-sf-blue/30 text-sf-blue hover:bg-sf-blue/10 transition-colors flex items-center gap-2"
          >
            <ExternalLink size={16} />
            运单详情
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-11 px-6 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
          >
            取消
          </button>
          {exception.response_status === 'resolved' ? (
            <button
              onClick={() => onConfirm(exception, reviewNote)}
              className="h-11 px-6 rounded-lg bg-sf-green text-white hover:bg-sf-green/90 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              确认解决
            </button>
          ) : (
            <>
              {exception.level < 3 && (
                <button
                  onClick={() => onEscalate(exception, reviewNote)}
                  className="h-11 px-6 rounded-lg bg-sf-orange text-white hover:bg-sf-orange/90 transition-colors flex items-center gap-2"
                >
                  <ArrowUpRight size={16} />
                  继续升级
                </button>
              )}
              <button
                onClick={() => onConfirm(exception, reviewNote)}
                className="h-11 px-6 rounded-lg bg-sf-red text-white hover:bg-sf-red/90 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} />
                确认解决
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const ExceptionCard: React.FC<{
  exception: ExceptionOrder
  onSelect: (ex: ExceptionOrder) => void
  onEscalate: (ex: ExceptionOrder) => void
  onRespond: (ex: ExceptionOrder) => void
  onReview: (ex: ExceptionOrder) => void
  onNavigateToTrack: (ex: ExceptionOrder) => void
}> = ({ exception, onSelect, onEscalate, onRespond, onReview, onNavigateToTrack }) => {
  const level = levelConfig[exception.level] || levelConfig[1]
  const status = statusConfig[exception.response_status] || statusConfig.alert
  const type = typeConfig[exception.exception_type || exception.type] || typeConfig.other
  const LevelIcon = level.icon
  const responseLevels = buildResponseLevels(exception)

  return (
    <div
      className={`glass rounded-xl border ${level.bgColor.replace('/10', '/20')} border-sf-blue/30 overflow-hidden card-hover cursor-pointer`}
      onClick={() => onSelect(exception)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${level.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <LevelIcon size={24} className={level.color} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-sf-light/50" />
                  <span className="text-sf-light font-mono">{exception.tracking_no || exception.order_no}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${level.bgColor} ${level.color}`}>
                  {level.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs bg-sf-dark ${status.color}`}>
                  {status.label}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-sf-dark text-sf-light/70">
                  {type.label}
                </span>
              </div>
              <p className="text-sf-light/70 mt-2">{exception.description}</p>
              <div className="flex items-center gap-6 mt-3 text-sm">
                <div className="flex items-center gap-2 text-sf-light/50">
                  <span>收件人:</span>
                  <span className="text-sf-light">{exception.receiver_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sf-light/50">
                  <span>联系电话:</span>
                  <span className="text-sf-light">{exception.receiver_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sf-light/50">
                  <Clock size={14} />
                  <span>{new Date(exception.created_at || exception.detected_at!).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onNavigateToTrack(exception) }}
              className="px-3 py-2 bg-sf-blue/10 text-sf-blue rounded-lg text-sm hover:bg-sf-blue/20 transition-colors flex items-center gap-1"
            >
              <ExternalLink size={14} />
              运单
            </button>
            {exception.response_status !== 'resolved' && exception.level < 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); onEscalate(exception) }}
                className="px-3 py-2 bg-sf-orange/10 text-sf-orange rounded-lg text-sm hover:bg-sf-orange/20 transition-colors flex items-center gap-1"
              >
                <ArrowUpRight size={14} />
                升级
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onReview(exception) }}
              className="px-3 py-2 bg-sf-yellow/10 text-sf-yellow rounded-lg text-sm hover:bg-sf-yellow/20 transition-colors flex items-center gap-1"
            >
              <Eye size={14} />
              复核
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRespond(exception) }}
              className="px-3 py-2 bg-sf-blue/10 text-sf-blue rounded-lg text-sm hover:bg-sf-blue/20 transition-colors flex items-center gap-1"
            >
              处理
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {responseLevels.map((lvl) => {
            const lvlCfg = levelConfig[lvl.level]
            return (
              <div key={lvl.level} className="flex-1">
                <div className={`p-2 rounded-lg border transition-all ${
                  lvl.status === 'completed'
                    ? 'border-sf-green/30 bg-sf-green/5'
                    : lvl.status === 'active'
                    ? `border-current/30 ${lvlCfg.bgColor}`
                    : 'border-sf-blue/10 bg-sf-dark/30 opacity-50'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      lvl.status === 'completed' ? 'bg-sf-green' :
                      lvl.status === 'active' ? `${lvlCfg.color.replace('text-', 'bg-')}` :
                      'bg-sf-light/20'
                    }`} />
                    <span className={`text-xs ${
                      lvl.status === 'pending' ? 'text-sf-light/30' : lvlCfg.color
                    }`}>
                      L{lvl.level} {lvlCfg.label}
                    </span>
                    {lvl.status === 'completed' && <CheckCircle size={10} className="text-sf-green ml-auto" />}
                    {lvl.status === 'active' && <Clock size={10} className={`${lvlCfg.color} ml-auto animate-pulse`} />}
                  </div>
                  {lvl.status !== 'pending' && (
                    <p className={`text-xs mt-1 ${lvl.status === 'completed' ? 'text-sf-green/70' : 'text-sf-light/50'}`}>
                      {lvl.level === 1 && (lvl.alertNotificationStatus || lvl.result)}
                      {lvl.level === 2 && (lvl.callResult || lvl.result)}
                      {lvl.level === 3 && (lvl.resolution || lvl.actionTaken || lvl.result)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {exception.response_note && (
        <div className="px-6 py-3 bg-sf-dark/50 border-t border-sf-blue/10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-sf-light/50">上次处理:</span>
            <span className="text-sf-light">{exception.response_note}</span>
            {exception.operator && (
              <span className="text-sf-blue">({exception.operator})</span>
            )}
            {exception.responded_at && (
              <span className="text-sf-light/50">
                · {new Date(exception.responded_at).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ExceptionCenter: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [exceptions, setExceptions] = useState<ExceptionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedException, setSelectedException] = useState<ExceptionOrder | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showRespondModal, setShowRespondModal] = useState(false)
  const [respondNote, setRespondNote] = useState('')
  const [reviewException, setReviewException] = useState<ExceptionOrder | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [levelFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (levelFilter) params.level = levelFilter
      if (statusFilter) params.response_status = statusFilter

      const [exceptionsResult, statsResult] = await Promise.all([
        api.exceptions.list(params),
        api.exceptions.stats(),
      ])

      if (exceptionsResult.success && exceptionsResult.data) {
        setExceptions(exceptionsResult.data as ExceptionOrder[])
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExceptions = exceptions.filter(ex => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (ex.tracking_no || ex.order_no)?.toLowerCase().includes(query) ||
      ex.receiver_name?.toLowerCase().includes(query) ||
      ex.description?.toLowerCase().includes(query)
    )
  })

  const handleEscalate = async (exception: ExceptionOrder) => {
    try {
      const result = await api.exceptions.escalate(exception.id)
      if (result.success) {
        addNotification({ type: 'success', message: '已升级异常响应级别' })
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '升级失败' })
    }
  }

  const handleRespond = async () => {
    if (!selectedException || !respondNote.trim()) {
      addNotification({ type: 'error', message: '请填写处理备注' })
      return
    }
    try {
      const result = await api.exceptions.respond(selectedException.id, {
        response_note: respondNote,
        operator: '运营专员',
      })
      if (result.success) {
        addNotification({ type: 'success', message: '处理记录已保存' })
        setShowRespondModal(false)
        setRespondNote('')
        setSelectedException(null)
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '处理失败' })
    }
  }

  const handleOpenDetail = (exception: ExceptionOrder) => {
    setSelectedException(exception)
    setShowDetailPanel(true)
  }

  const handleOpenRespond = (exception: ExceptionOrder) => {
    setSelectedException(exception)
    setShowRespondModal(true)
  }

  const handleOpenReview = (exception: ExceptionOrder) => {
    setReviewException(exception)
  }

  const handleNavigateToTrack = (exception: ExceptionOrder) => {
    if (exception.order_id) {
      navigate(`/track/${exception.order_id}`)
    }
  }

  const handleReviewConfirm = async (exception: ExceptionOrder, note: string) => {
    try {
      const result = await api.exceptions.respond(exception.id, {
        response_note: note || '复核确认解决',
        operator: '复核专员',
      })
      if (result.success) {
        addNotification({ type: 'success', message: '复核确认完成' })
        setReviewException(null)
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '复核确认失败' })
    }
  }

  const handleReviewEscalate = async (exception: ExceptionOrder, note: string) => {
    try {
      const result = await api.exceptions.escalate(exception.id)
      if (result.success) {
        addNotification({ type: 'success', message: '已升级异常响应级别' })
        if (note.trim()) {
          await api.exceptions.respond(exception.id, {
            response_note: note,
            operator: '复核专员',
          })
        }
        setReviewException(null)
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '升级失败' })
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">异常处理中心</h1>
          <p className="text-sf-light/50 text-sm mt-1">三级响应机制：系统告警→客服外呼→片区经理介入</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-sf-red/10 border border-sf-red/30 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-sf-red rounded-full animate-pulse" />
            <span className="text-sf-red text-sm">{exceptions.length} 个待处理</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-sf-yellow/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">一级响应（系统告警）</div>
              <div className="text-3xl font-display text-sf-yellow mt-2">{stats?.level1 || 0}</div>
            </div>
            <div className="w-12 h-12 bg-sf-yellow/10 rounded-xl flex items-center justify-center">
              <Bell size={24} className="text-sf-yellow" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sf-yellow text-xs mt-4">
            <TrendingUp size={12} />
            <span>自动触发，需人工确认</span>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-orange/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">二级响应（客服外呼）</div>
              <div className="text-3xl font-display text-sf-orange mt-2">{stats?.level2 || 0}</div>
            </div>
            <div className="w-12 h-12 bg-sf-orange/10 rounded-xl flex items-center justify-center">
              <Phone size={24} className="text-sf-orange" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sf-orange text-xs mt-4">
            <ArrowUpRight size={12} />
            <span>客服主动联系客户</span>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-red/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">三级响应（经理介入）</div>
              <div className="text-3xl font-display text-sf-red mt-2">{stats?.level3 || 0}</div>
            </div>
            <div className="w-12 h-12 bg-sf-red/10 rounded-xl flex items-center justify-center">
              <UserCheck size={24} className="text-sf-red" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sf-red text-xs mt-4">
            <ArrowUpRight size={12} />
            <span>片区经理专项处理</span>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-green/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">今日已解决</div>
              <div className="text-3xl font-display text-sf-green mt-2">{stats?.resolved || 0}</div>
            </div>
            <div className="w-12 h-12 bg-sf-green/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-sf-green" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sf-green text-xs mt-4">
            <CheckCircle size={12} />
            <span>异常闭环处理</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-sf-blue/30">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入运单号、收件人、异常描述搜索..."
              className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-sf-light/50" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            >
              <option value="">全部级别</option>
              <option value="1">一级响应</option>
              <option value="2">二级响应</option>
              <option value="3">三级响应</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-sf-light/50" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            >
              <option value="">全部状态</option>
              <option value="alert">系统告警</option>
              <option value="called">客服外呼</option>
              <option value="manager_intervened">经理介入</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredExceptions.map((exception) => (
          <ExceptionCard
            key={exception.id}
            exception={exception}
            onSelect={handleOpenDetail}
            onEscalate={handleEscalate}
            onRespond={handleOpenRespond}
            onReview={handleOpenReview}
            onNavigateToTrack={handleNavigateToTrack}
          />
        ))}
        {filteredExceptions.length === 0 && (
          <div className="glass rounded-xl p-12 border border-sf-blue/30 text-center">
            <CheckCircle size={48} className="text-sf-green mx-auto mb-4" />
            <p className="text-sf-light/70">暂无异常运单，系统运行正常</p>
          </div>
        )}
      </div>

      {showDetailPanel && selectedException && (
        <ExceptionDetailPanel
          exception={selectedException}
          onClose={() => { setShowDetailPanel(false); setSelectedException(null) }}
          onRespond={(ex) => { setShowDetailPanel(false); handleOpenRespond(ex) }}
          onEscalate={handleEscalate}
          onReview={(ex) => { setShowDetailPanel(false); handleOpenReview(ex) }}
        />
      )}

      {showRespondModal && selectedException && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-sf-black border border-sf-blue/30 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-xl font-display text-sf-light mb-2">异常处理记录</h3>
            <p className="text-sf-light/50 text-sm mb-6">
              运单号: {selectedException.tracking_no}
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-sf-yellow" />
                  <span className="text-sf-light text-sm">异常描述</span>
                </div>
                <p className="text-sf-light/70 text-sm">{selectedException.description}</p>
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">处理备注</label>
                <textarea
                  value={respondNote}
                  onChange={(e) => setRespondNote(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                  placeholder="请详细说明处理措施和结果..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowRespondModal(false)
                    setRespondNote('')
                    setSelectedException(null)
                  }}
                  className="h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRespond}
                  className="h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
                >
                  提交处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewException && (
        <ReviewPanel
          exception={reviewException}
          onClose={() => setReviewException(null)}
          onConfirm={handleReviewConfirm}
          onEscalate={handleReviewEscalate}
        />
      )}
    </div>
  )
}

export default ExceptionCenter
