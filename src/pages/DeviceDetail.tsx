import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play, Square, Sliders, Upload, Activity, Shield, CheckCircle, RefreshCw, Clock, FileText, AlertTriangle } from 'lucide-react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useStore } from '@/store'

echarts.use([LineChart, TooltipComponent, GridComponent, CanvasRenderer])

const statusDot: Record<string, string> = { '充电中': 'bg-alert-green', '空闲': 'bg-slate-400', '故障': 'bg-alert-red', '离线': 'bg-alert-orange' }
const portBorder: Record<string, string> = { '充电中': 'bg-electric/10 border border-electric/30', '空闲': 'bg-slate-400/10 border border-surface-border', '故障': 'bg-alert-red/10 border border-alert-red/30', '已占用': 'bg-slate-400/10 border border-surface-border' }
const portBadge: Record<string, string> = { '充电中': 'badge-success', '空闲': 'badge-info', '故障': 'badge-danger', '已占用': 'badge-warning' }

interface OpLog { time: string; action: string; detail: string; status: '成功' | '下发中' | '失败'; oldVal?: string; newVal?: string }

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const { chargingPiles, chargingPorts, stations, safetyConfig, updatePileStatus, updateSafetyConfig } = useStore()
  const [power, setPower] = useState(800)
  const [toast, setToast] = useState('')
  const [upgradeProgress, setUpgradeProgress] = useState(-1)
  const [maxChargeHours, setMaxChargeHours] = useState(safetyConfig.max_charge_hours)
  const [maxPowerW, setMaxPowerW] = useState(safetyConfig.max_power_w)
  const [tempThresholdC, setTempThresholdC] = useState(safetyConfig.temp_threshold_c)
  const [opLogs, setOpLogs] = useState<OpLog[]>([])
  const [powerDelivered, setPowerDelivered] = useState<number | null>(null)
  const [upgradeReceipt, setUpgradeReceipt] = useState<{ id: string; from: string; to: string; duration: string; result: string } | null>(null)
  const [safetyReviewed, setSafetyReviewed] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const upgradeStartRef = useRef<number>(0)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const addLog = (action: string, detail: string, status: OpLog['status'], oldVal?: string, newVal?: string) => {
    setOpLogs(prev => [{ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), action, detail, status, oldVal, newVal }, ...prev].slice(0, 20))
  }

  const pile = chargingPiles.find((p) => p.pile_id === id)
  const ports = chargingPorts.filter((p) => p.pile_id === id)
  const station = stations.find((s) => s.station_id === pile?.station_id)

  const powerData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 24 }, (_, i) => {
      const h = (now.getHours() - 23 + i + 24) % 24
      const base = h >= 8 && h <= 20 ? 600 : 200
      const v = Math.max(0, base + Math.round((Math.random() - 0.3) * 300))
      return { hour: `${String(h).padStart(2, '0')}:00`, value: v }
    })
  }, [])

  const handleStart = () => {
    if (!pile) return
    const oldStatus = pile.status
    updatePileStatus(pile.pile_id, '充电中')
    addLog('远程启动', `${pile.pile_id} 远程启动充电`, '成功', oldStatus, '充电中')
    setToast('启动指令已下发')
  }

  const handleStop = () => {
    if (!pile) return
    const oldStatus = pile.status
    updatePileStatus(pile.pile_id, '空闲')
    addLog('远程停止', `${pile.pile_id} 远程停止充电`, '成功', oldStatus, '空闲')
    setToast('停止指令已下发')
  }

  const handlePowerDeliver = () => {
    setPowerDelivered(power)
    addLog('功率下发', `功率限制 ${power}W 已下发`, '成功', `${powerDelivered ?? '-'}W`, `${power}W`)
    setToast(`功率限制 ${power}W 已下发`)
  }

  const handleSafetyDeliver = () => {
    const oldH = String(safetyConfig.max_charge_hours)
    const oldP = String(safetyConfig.max_power_w)
    const oldT = String(safetyConfig.temp_threshold_c)
    updateSafetyConfig({ max_charge_hours: maxChargeHours, max_power_w: maxPowerW, temp_threshold_c: tempThresholdC })
    addLog('阈值下发', `充电时长${maxChargeHours}h/功率${maxPowerW}W/温度${tempThresholdC}°C`, '成功', `${oldH}h/${oldP}W/${oldT}°C`, `${maxChargeHours}h/${maxPowerW}W/${tempThresholdC}°C`)
    setSafetyReviewed(false)
    setToast('保护阈值已下发')
  }

  const handleSafetyReview = () => {
    setSafetyReviewed(true)
    addLog('复查确认', `安全策略已复查确认`, '成功')
    setToast('复查确认完成')
  }

  const handleUpgrade = () => {
    if (!pile) return
    setUpgradeProgress(0)
    setUpgradeReceipt(null)
    upgradeStartRef.current = Date.now()
    addLog('固件升级', `${pile.firmware_version} → v2.3.0 升级开始`, '下发中')
    timerRef.current = setInterval(() => {
      setUpgradeProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current)
          const dur = ((Date.now() - upgradeStartRef.current) / 1000).toFixed(1)
          addLog('固件升级', `${pile.firmware_version} → v2.3.0 升级完成`, '成功')
          setUpgradeReceipt({ id: `UPG-${Date.now().toString(36).toUpperCase()}`, from: pile.firmware_version, to: 'v2.3.0', duration: `${dur}s`, result: '成功' })
          setToast('升级成功')
          return 100
        }
        return prev + 2
      })
    }, 60)
  }

  const handleReconnect = (mode: string) => {
    setReconnecting(true)
    addLog('通信恢复', `${mode}重连请求已发送`, '下发中')
    setTimeout(() => {
      setReconnecting(false)
      addLog('通信恢复', `GB/T 32960 连接已恢复`, '成功')
      setToast('通信已恢复')
    }, 1500)
  }

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  if (!pile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <p>设备未找到</p>
        <Link to="/devices" className="text-electric text-sm hover:underline">返回设备列表</Link>
      </div>
    )
  }

  const signalQuality = pile.gbt_connected ? (pile.health_score > 80 ? '良好' : pile.health_score > 50 ? '一般' : '较差') : '-'

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0F1F3A', borderColor: '#243D63', textStyle: { color: '#E2E8F0' } },
    grid: { left: 50, right: 16, top: 16, bottom: 30 },
    xAxis: { type: 'category', data: powerData.map((d) => d.hour), axisLabel: { color: '#94A3B8', fontSize: 10 }, boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { color: '#94A3B8' }, splitLine: { lineStyle: { color: '#1C3254' } } },
    series: [{
      type: 'line', smooth: true, data: powerData.map((d) => d.value),
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,229,160,0.35)' }, { offset: 1, color: 'rgba(0,229,160,0.02)' }] } },
      lineStyle: { color: '#00E5A0', width: 2 }, itemStyle: { color: '#00E5A0' }, symbol: 'none',
    }],
  }

  const logBadge: Record<string, string> = { '成功': 'badge-success', '下发中': 'badge-warning', '失败': 'badge-danger' }
  const safetyLogs = opLogs.filter(l => l.action.includes('阈值') || l.action.includes('复查'))

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-electric/90 text-dark-900 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link to="/devices" className="text-slate-400 hover:text-electric transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="text-slate-400 text-sm">设备管理</span>
        <span className="text-slate-500 text-sm">/</span>
        <span className="text-slate-200 text-sm">{pile.pile_id}</span>
      </div>

      <div className="card">
        <div className="grid grid-cols-4 gap-6">
          <div><div className="text-xs text-slate-400 mb-1">编号</div><div className="text-white font-mono">{pile.pile_id}</div></div>
          <div><div className="text-xs text-slate-400 mb-1">类型 / 型号</div><div className="text-white">{pile.pile_type} · {pile.model}</div></div>
          <div><div className="text-xs text-slate-400 mb-1">固件版本</div><div className="text-white font-mono">{pile.firmware_version}</div></div>
          <div>
            <div className="text-xs text-slate-400 mb-1">状态</div>
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusDot[pile.status]}`} />
              <span className={`text-sm ${pile.status === '充电中' ? 'text-alert-green' : pile.status === '故障' ? 'text-alert-red' : pile.status === '离线' ? 'text-alert-orange' : 'text-slate-300'}`}>{pile.status}</span>
            </span>
          </div>
          <div><div className="text-xs text-slate-400 mb-1">在线率</div><div className="text-white font-mono">{pile.online_rate}%</div></div>
          <div><div className="text-xs text-slate-400 mb-1">健康度</div><div className={`font-mono ${pile.health_score >= 80 ? 'text-alert-green' : pile.health_score >= 60 ? 'text-alert-orange' : 'text-alert-red'}`}>{pile.health_score}</div></div>
          <div><div className="text-xs text-slate-400 mb-1">所属站点</div><div className="text-white">{station?.name ?? '-'}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <div className="section-title"><Activity className="w-4 h-4 text-electric" />充电端口</div>
          <div className="grid grid-cols-2 gap-3">
            {ports.map((port) => (
              <div key={port.port_id} className={`rounded-xl p-3 ${portBorder[port.status]}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300">端口 {port.port_number}</span>
                  <span className={portBadge[port.status]}>{port.status}</span>
                </div>
                <div className="text-xs text-slate-400">最大功率 <span className="text-white font-mono">{port.max_power}W</span></div>
                <div className="text-xs text-slate-400">当前功率 <span className="text-white font-mono">{port.current_power}W</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 card space-y-4">
          <div className="section-title"><Sliders className="w-4 h-4 text-electric" />远程控制</div>
          <div className="flex gap-3">
            <button onClick={handleStart} className="btn-primary flex items-center gap-1.5 flex-1"><Play className="w-4 h-4" />启动</button>
            <button onClick={handleStop} className="btn-danger flex items-center gap-1.5 flex-1"><Square className="w-4 h-4" />停止</button>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>功率限制</span>
              <span className="text-electric font-mono">{power}W</span>
            </div>
            <input type="range" min={100} max={2000} step={50} value={power} onChange={(e) => setPower(+e.target.value)}
              className="w-full h-1.5 bg-dark-500 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-electric [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow" />
            <button onClick={handlePowerDeliver} className="btn-ghost w-full text-center mt-2 border border-surface-border text-xs">下发功率</button>
            {powerDelivered !== null && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-alert-green bg-alert-green/10 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />功率限制 {powerDelivered}W 已下发至设备
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2"><Upload className="w-3.5 h-3.5 inline mr-1" />固件升级</div>
            <div className="bg-dark-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">当前版本</span>
                <span className="text-white font-mono">{pile.firmware_version}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">目标版本</span>
                <span className="text-electric font-mono">v2.3.0</span>
              </div>
              {upgradeProgress >= 0 && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-electric rounded-full transition-all duration-200" style={{ width: `${upgradeProgress}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 text-center">{upgradeProgress}%</div>
                </div>
              )}
              {upgradeReceipt && (
                <div className="mt-2 bg-electric/5 border border-electric/20 rounded-lg p-2 space-y-1">
                  <div className="text-xs text-electric font-medium">升级回执</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="text-slate-400">升级ID</span><span className="text-white font-mono">{upgradeReceipt.id}</span>
                    <span className="text-slate-400">版本</span><span className="text-white">{upgradeReceipt.from} → {upgradeReceipt.to}</span>
                    <span className="text-slate-400">耗时</span><span className="text-white">{upgradeReceipt.duration}</span>
                    <span className="text-slate-400">结果</span><span className="text-alert-green">{upgradeReceipt.result}</span>
                  </div>
                </div>
              )}
              <button onClick={handleUpgrade} disabled={upgradeProgress >= 0 && upgradeProgress < 100}
                className="btn-ghost w-full text-center mt-2 border border-surface-border disabled:opacity-50">
                {upgradeProgress >= 0 && upgradeProgress < 100 ? '升级中...' : upgradeProgress === 100 ? '升级完成' : '开始升级'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="section-title"><Shield className="w-4 h-4 text-electric" />过充保护阈值下发</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">最大充电时长</span>
              <div className="flex items-center gap-2">
                <input type="number" value={maxChargeHours} onChange={(e) => setMaxChargeHours(+e.target.value)} className="input-field w-20 text-center text-xs py-1" />
                <span className="text-xs text-slate-400">小时</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">最大功率限制</span>
              <div className="flex items-center gap-2">
                <input type="number" value={maxPowerW} onChange={(e) => setMaxPowerW(+e.target.value)} className="input-field w-20 text-center text-xs py-1" />
                <span className="text-xs text-slate-400">W</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">温度阈值</span>
              <div className="flex items-center gap-2">
                <input type="number" value={tempThresholdC} onChange={(e) => setTempThresholdC(+e.target.value)} className="input-field w-20 text-center text-xs py-1" />
                <span className="text-xs text-slate-400">°C</span>
              </div>
            </div>
            <button onClick={handleSafetyDeliver} className="btn-primary w-full text-center text-xs">下发阈值</button>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">安全策略复查</span>
              {safetyReviewed ? (
                <span className="badge-success text-[10px]">已复查</span>
              ) : (
                <span className="badge-warning text-[10px]">待复查</span>
              )}
            </div>
            {safetyLogs.length > 0 && (
              <div className="space-y-1 mb-2 max-h-[80px] overflow-y-auto">
                {safetyLogs.slice(0, 4).map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] px-2 py-0.5 rounded bg-dark-700/50">
                    <span className="text-slate-400">{l.detail.slice(0, 20)}</span>
                    <span className={logBadge[l.status]}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
            {!safetyReviewed && opLogs.some(l => l.action === '阈值下发') && (
              <button onClick={handleSafetyReview} className="btn-ghost w-full text-center text-xs border border-electric/30 text-electric">复查确认</button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-title"><Activity className="w-4 h-4 text-electric" />GB/T 32960 通信状态</div>
          {!pile.gbt_connected && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-alert-red/10 border border-alert-red/30">
              <AlertTriangle className="w-4 h-4 text-alert-red" />
              <div className="flex-1">
                <div className="text-xs text-alert-red font-medium">⚠ 通信断连告警</div>
                <div className="text-[10px] text-slate-400">最后断连: {pile.last_heartbeat}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleReconnect('自动')} disabled={reconnecting} className="text-[10px] px-2 py-1 rounded bg-alert-red/20 text-alert-red hover:bg-alert-red/30 disabled:opacity-50">自动重连</button>
                <button onClick={() => handleReconnect('手动')} disabled={reconnecting} className="text-[10px] px-2 py-1 rounded bg-alert-red/20 text-alert-red hover:bg-alert-red/30 disabled:opacity-50">手动重连</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">协议版本</span>
              <span className="text-white font-mono text-xs">GB/T 32960-2016</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">连接状态</span>
              <span className="inline-flex items-center gap-1.5">
                {pile.gbt_connected ? (
                  <><span className="w-2 h-2 rounded-full bg-alert-green animate-pulse" /><span className="text-alert-green text-xs">已连接</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-alert-red" /><span className="text-alert-red text-xs">断开</span></>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">最后心跳</span>
              <span className="text-slate-300 font-mono text-xs">{pile.last_heartbeat}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">信号质量</span>
              <span className={`text-xs ${signalQuality === '良好' ? 'text-alert-green' : signalQuality === '一般' ? 'text-alert-orange' : 'text-alert-red'}`}>{signalQuality}</span>
            </div>
            {pile.gbt_connected && (
              <button onClick={() => handleReconnect('手动')} disabled={reconnecting} className="btn-ghost w-full text-center text-xs border border-surface-border flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3 h-3" />{reconnecting ? '重连中...' : '重新连接'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">功率曲线（24h）</div>
        <ReactEChartsCore echarts={echarts} option={chartOption} style={{ height: 200 }} />
      </div>

      <div className="card">
        <div className="section-title"><FileText className="w-4 h-4 text-electric" />操作回执记录</div>
        {opLogs.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">暂无操作记录</div>
        ) : (
          <div className="space-y-1 max-h-[240px] overflow-y-auto">
            {opLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors">
                <span className="text-slate-500 font-mono shrink-0"><Clock className="w-3 h-3 inline mr-1" />{log.time}</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-electric/10 text-electric">{log.action}</span>
                <span className="text-slate-300 flex-1 truncate">{log.detail}</span>
                {log.oldVal && log.newVal && <span className="text-slate-500 shrink-0">{log.oldVal} → <span className="text-electric">{log.newVal}</span></span>}
                <span className={`shrink-0 ${logBadge[log.status]}`}>{log.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
