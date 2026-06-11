import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Car, Zap, CheckCircle, X, Shield, AlertTriangle, RotateCcw, Headphones } from 'lucide-react'

interface Vehicle {
  id: string
  brand: string
  model: string
  vin: string
  plateNumber: string
  batteryCapacity: number
  verified: boolean
}

interface AuthRecord {
  time: string
  vin: string
  plate: string
  result: '成功' | '失败'
  station: string
}

const mockVehicles: Vehicle[] = [
  { id: 'v1', brand: '比亚迪', model: '汉EV', vin: 'LC0C******1234', plateNumber: '京A12345', batteryCapacity: 76.9, verified: true },
  { id: 'v2', brand: '特斯拉', model: 'Model 3', vin: '5YJ3******5678', plateNumber: '沪B67890', batteryCapacity: 60.0, verified: false },
]

const mockAuthRecords: AuthRecord[] = [
  { time: '2026-06-10 14:32:18', vin: 'LC0C******1234', plate: '京A12345', result: '成功', station: '国网北京朝阳站' },
  { time: '2026-06-10 13:15:42', vin: '5YJ3******5678', plate: '沪B67890', result: '成功', station: '特来电上海浦东站' },
  { time: '2026-06-10 11:08:33', vin: 'LC0C******1234', plate: '京A99999', result: '失败', station: '星星充电广州天河站' },
  { time: '2026-06-09 20:45:12', vin: 'LC0C******1234', plate: '京A12345', result: '成功', station: '国网北京海淀站' },
  { time: '2026-06-09 16:22:07', vin: '5YJ3******5678', plate: '沪B00000', result: '失败', station: '特来电上海虹桥站' },
]

const stepMessages = [
  { text: '正在读取VIN码...', icon: 'scan' },
  { text: 'VIN码识别成功: LC0C******1234', icon: 'check' },
  { text: '正在匹配车牌信息...', icon: 'scan' },
  { text: '车牌认证成功: 京A12345', icon: 'check' },
  { text: '双因子认证通过，可启动充电', icon: 'done' },
]

export default function PlugCharge() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ vin: '', plateNumber: '', brand: '比亚迪', model: '', batteryCapacity: 60 })
  const [authStep, setAuthStep] = useState(0)
  const [authFailed, setAuthFailed] = useState(false)
  const [authRecords] = useState<AuthRecord[]>(mockAuthRecords)

  const [verifyVehicle, setVerifyVehicle] = useState<Vehicle | null>(null)
  const [verifyStep, setVerifyStep] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifySuccess, setVerifySuccess] = useState(false)

  const [orderCreated, setOrderCreated] = useState(false)
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (authStep >= 1 && authStep <= 4 && !authFailed) {
      const timer = setTimeout(() => setAuthStep(s => s + 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [authStep, authFailed])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleStartAuth = () => {
    setAuthFailed(false)
    setAuthStep(1)
  }

  const handleFailAuth = () => {
    setAuthFailed(true)
    setAuthStep(0)
  }

  const handleRetry = () => {
    setAuthFailed(false)
    setAuthStep(0)
  }

  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
      id: `v${Date.now()}`,
      brand: form.brand,
      model: form.model,
      vin: `${form.vin.slice(0, 3)}******${form.vin.slice(-4)}`,
      plateNumber: form.plateNumber,
      batteryCapacity: form.batteryCapacity,
      verified: false,
    }
    setVehicles([...vehicles, newVehicle])
    setShowAddModal(false)
    setForm({ vin: '', plateNumber: '', brand: '比亚迪', model: '', batteryCapacity: 60 })
  }

  const startVerification = (v: Vehicle) => {
    setVerifyVehicle(v)
    setVerifyStep(1)
    setVerifyCode('')
    setVerifySuccess(false)
  }

  const sendCode = () => {
    setCountdown(3)
    setVerifyStep(2)
  }

  const confirmVerification = () => {
    if (verifyCode.length === 6 && verifyVehicle) {
      setVehicles(prev => prev.map(v => v.id === verifyVehicle.id ? { ...v, verified: true } : v))
      setVerifySuccess(true)
      setVerifyStep(3)
    }
  }

  const closeVerification = () => {
    setVerifyVehicle(null)
    setVerifyStep(0)
    setVerifyCode('')
    setVerifySuccess(false)
  }

  const handleConfirmCharge = () => {
    const id = `ORD${Date.now()}`
    setOrderId(id)
    setOrderCreated(true)
  }

  const handleResetAuth = () => {
    setOrderCreated(false)
    setOrderId('')
    setAuthStep(0)
    setAuthFailed(false)
  }

  const now = new Date()
  const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">我的车辆</h2>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> 添加车辆
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="glass-card p-4 hover:border-electric-green/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-electric-green/10 flex items-center justify-center">
                    <Car className="w-5 h-5 text-electric-green" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-100">{v.brand} {v.model}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.vin}</div>
                  </div>
                </div>
                {v.verified ? (
                  <span className="flex items-center gap-1 text-xs text-electric-green bg-electric-green/10 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> 已认证
                  </span>
                ) : (
                  <button onClick={() => startVerification(v)} className="flex items-center gap-1 text-xs text-amber-orange bg-amber-orange/10 px-2 py-0.5 rounded-full hover:bg-amber-orange/20 cursor-pointer">
                    <Shield className="w-3 h-3" /> 立即认证
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>车牌: <span className="text-gray-200">{v.plateNumber}</span></span>
                <span>电池: <span className="text-gray-200">{v.batteryCapacity}kWh</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Zap className="w-5 h-5 text-electric-green" />
          即插即充 · 双因子认证
        </h2>

        <div className="flex items-start gap-8">
          <div className="flex flex-col items-center gap-4 w-48">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-deep-blue-lighter border-2 border-electric-green/30 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #00E599 0%, transparent 60%, transparent 100%)', opacity: authStep >= 1 && authStep <= 4 ? 0.2 : 0, animation: authStep >= 1 && authStep <= 4 ? 'spin 2s linear infinite' : 'none' }} />
                <Zap className={`w-10 h-10 text-electric-green ${authStep >= 1 && authStep <= 4 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className="text-center text-xs text-gray-400">
              {authStep === 0 && !authFailed && !orderCreated && '点击下方按钮启动认证'}
              {authStep >= 1 && authStep <= 4 && stepMessages[authStep - 1].text}
              {authStep === 5 && !orderCreated && <span className="text-electric-green">认证完成</span>}
              {orderCreated && <span className="text-electric-green">订单已创建</span>}
            </div>
          </div>

          <div className="flex-1">
            {orderCreated ? (
              <div className="glass-card p-4 animate-slide-right">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-electric-green" />
                  <span className="text-sm font-medium text-electric-green">订单已创建</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-gray-400">订单号</span>
                    <div className="text-sm text-gray-100 data-text">{orderId}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">充电站</span>
                    <div className="text-sm text-gray-100">国网北京朝阳站</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">桩号</span>
                    <div className="text-sm text-gray-100">3号桩</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">启动时间</span>
                    <div className="text-sm text-gray-100">{startTime}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/charging-monitor')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> 进入充电监控
                  </button>
                  <button onClick={handleResetAuth} className="btn-secondary flex-1">返回</button>
                </div>
              </div>
            ) : authFailed ? (
              <div className="glass-card p-4 border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-medium text-red-400">VIN码识别成功，但车牌信息不匹配</span>
                </div>
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-300">认证失败 - VIN与车牌不匹配，请确认车辆信息或联系客服</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleRetry} className="btn-secondary flex items-center gap-1.5 text-sm">
                    <RotateCcw className="w-4 h-4" /> 重新认证
                  </button>
                  <button className="btn-primary flex items-center gap-1.5 text-sm">
                    <Headphones className="w-4 h-4" /> 联系客服
                  </button>
                </div>
              </div>
            ) : authStep === 5 ? (
              <div className="glass-card p-4 animate-slide-right">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-electric-green" />
                  <span className="text-sm font-medium text-electric-green">双因子认证通过</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-gray-400">车辆</span>
                    <div className="text-sm text-gray-100">比亚迪 汉EV</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">车牌</span>
                    <div className="text-sm text-gray-100">京A12345</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">VIN</span>
                    <div className="text-sm text-gray-100">LC0C******1234</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">电池容量</span>
                    <div className="text-sm text-gray-100">76.9 kWh</div>
                  </div>
                </div>
                <button onClick={handleConfirmCharge} className="btn-primary w-full flex items-center justify-center gap-2 animate-pulse-glow">
                  <Zap className="w-4 h-4" /> 确认充电
                </button>
              </div>
            ) : authStep >= 1 ? (
              <div className="glass-card p-4 space-y-3">
                {stepMessages.slice(0, authStep).map((msg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {msg.icon === 'check' ? (
                      <CheckCircle className="w-4 h-4 text-electric-green shrink-0" />
                    ) : msg.icon === 'done' ? (
                      <Shield className="w-4 h-4 text-electric-green shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-electric-green/50 border-t-electric-green rounded-full animate-spin shrink-0" />
                    )}
                    <span className={`text-sm ${msg.icon === 'check' || msg.icon === 'done' ? 'text-electric-green' : 'text-gray-300'}`}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                {authStep <= 4 && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-gray-600 rounded-full shrink-0" />
                    <span className="text-sm text-gray-600">{stepMessages[authStep]?.text}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-gray-400 mb-4">将充电枪插入车辆充电口，系统将自动进行VIN+车牌双因子认证</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={handleStartAuth} className="btn-primary flex items-center gap-2">
                    <Zap className="w-4 h-4" /> 模拟插入充电枪
                  </button>
                  <button onClick={handleFailAuth} className="btn-secondary flex items-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <AlertTriangle className="w-4 h-4" /> 模拟认证失败
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="section-title flex items-center gap-2">
          <Shield className="w-5 h-5 text-ice-blue" />
          认证记录
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">时间</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">VIN</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">车牌</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3 pr-4">结果</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-3">充电站</th>
              </tr>
            </thead>
            <tbody>
              {authRecords.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-4 text-gray-300 data-text text-xs">{r.time}</td>
                  <td className="py-2.5 pr-4 text-gray-300 text-xs">{r.vin}</td>
                  <td className="py-2.5 pr-4 text-gray-300 text-xs">{r.plate}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.result === '成功' ? 'bg-electric-green/10 text-electric-green' : 'bg-red-500/10 text-red-400'}`}>
                      {r.result}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-400 text-xs">{r.station}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-[460px] p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">添加车辆</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 mb-1 block">VIN码</label><input type="text" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="input-field w-full" placeholder="17位VIN码" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">车牌号</label><input type="text" value={form.plateNumber} onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))} className="input-field w-full" placeholder="京A12345" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-400 mb-1 block">品牌</label><select className="input-field w-full" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}><option value="比亚迪">比亚迪</option><option value="特斯拉">特斯拉</option><option value="蔚来">蔚来</option><option value="小鹏">小鹏</option><option value="理想">理想</option></select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">型号</label><input type="text" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="input-field w-full" placeholder="汉EV" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">电池(kWh)</label><input type="number" value={form.batteryCapacity} onChange={e => setForm(f => ({ ...f, batteryCapacity: Number(e.target.value) }))} className="input-field w-full" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">取消</button>
                <button onClick={handleAddVehicle} className="btn-primary">确认添加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {verifyVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-[400px] p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">车辆认证</h3>
              <button onClick={closeVerification} className="p-1 rounded hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {verifySuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-electric-green mx-auto mb-3" />
                <p className="text-sm text-electric-green mb-1">认证成功</p>
                <p className="text-xs text-gray-400">{verifyVehicle.brand} {verifyVehicle.model} 已通过认证</p>
              </div>
            ) : verifyStep === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-300">请确认以下信息</p>
                <div className="glass-card p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">VIN</span>
                    <span className="text-gray-200">{verifyVehicle.vin}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">车牌</span>
                    <span className="text-gray-200">{verifyVehicle.plateNumber}</span>
                  </div>
                </div>
                <button onClick={sendCode} className="btn-primary w-full">发送验证码</button>
              </div>
            ) : verifyStep === 2 ? (
              <div className="space-y-4">
                <p className="text-xs text-electric-green">验证码已发送至 138****5678</p>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">6位验证码</label>
                  <input type="text" maxLength={6} value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="input-field w-full text-center tracking-[0.5em] text-lg" placeholder="------" />
                </div>
                <div className="flex gap-3">
                  <button onClick={sendCode} disabled={countdown > 0} className={`btn-secondary flex-1 ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
                  </button>
                  <button onClick={confirmVerification} disabled={verifyCode.length !== 6} className={`btn-primary flex-1 ${verifyCode.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}>确认认证</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
