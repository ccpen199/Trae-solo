import { useState } from 'react'
import { Shield, Save, Send } from 'lucide-react'
import { useStore } from '@/store'
import type { SafetyConfig } from '@/types'

const FIELDS: { key: keyof SafetyConfig; label: string; unit: string; desc: string }[] = [
  { key: 'max_charge_hours', label: '最大充电时长', unit: '小时', desc: '单次充电最大允许时长，超时自动断电' },
  { key: 'max_power_w', label: '最大功率限制', unit: 'W', desc: '充电桩输出功率上限，防止设备过载运行' },
  { key: 'temp_threshold_c', label: '温升阈值', unit: '°C', desc: '充电桩内部温度报警阈值，超温暂停充电' },
  { key: 'overload_threshold_w', label: '过载阈值', unit: 'W', desc: '瞬时功率超过此值触发过载保护' },
  { key: 'disconnect_timeout_s', label: '断连超时', unit: '秒', desc: '通信中断超过此时长判定设备离线' },
]

export default function Safety() {
  const { safetyConfig, updateSafetyConfig } = useStore()
  const [form, setForm] = useState<SafetyConfig>({ ...safetyConfig })
  const [deploying, setDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)

  const handleSave = () => {
    updateSafetyConfig(form)
  }

  const handleDeploy = () => {
    setDeploying(true)
    setDeploySuccess(false)
    setTimeout(() => {
      setDeploying(false)
      setDeploySuccess(true)
      setTimeout(() => setDeploySuccess(false), 3000)
    }, 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-electric" />
          充电安全策略中心
        </h1>
        <p className="text-sm text-slate-400 mt-1">安全阈值远程下发至充电桩设备</p>
      </div>

      <div className="card">
        <div className="section-title">策略配置</div>
        <div className="space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-sm text-slate-300 mb-1 block">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="input-field max-w-xs"
                />
                <span className="text-sm text-slate-400">{f.unit}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="btn-ghost flex items-center gap-2 !text-electric !border !border-electric/30 hover:!bg-electric/10 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {deploying ? '下发中...' : deploySuccess ? '下发成功' : '下发至设备'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title">GB/T 32960 协议状态</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-400">协议版本</div>
            <div className="text-sm text-white font-mono mt-1">GB/T 32960-2016</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">连接状态</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-alert-green animate-pulse" />
              <span className="text-sm text-alert-green">已连接</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">最近心跳时间</div>
            <div className="text-sm text-white font-mono mt-1">{new Date().toLocaleString('zh-CN')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
