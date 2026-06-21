import { useState } from 'react'
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Settings,
  Play,
  Clock,
  Copy,
  Zap,
  Link2,
  FileJson,
  Code,
  Shield,
} from 'lucide-react'

const erpSystems = [
  { id: 'sap', name: 'SAP S/4HANA', desc: '国际主流大型企业ERP', logo: '🟦', popular: true },
  { id: 'oracle', name: 'Oracle ERP Cloud', desc: '甲骨文企业资源管理', logo: '🟧', popular: true },
  { id: 'ufida', name: '用友U8/U9 Cloud', desc: '国内市场占有率领先', logo: '🟩', popular: true },
  { id: 'kingdee', name: '金蝶云星空', desc: '云端ERP解决方案', logo: '🟨', popular: false },
  { id: 'dingtalk', name: '钉钉宜搭', desc: '低代码业务系统', logo: '🟦', popular: false },
  { id: 'wecom', name: '企业微信应用', desc: '自研小程序对接', logo: '🟢', popular: false },
  { id: 'custom', name: '其他/自定义API', desc: '支持RESTful API对接', logo: '⚙️', popular: false },
]

const fieldMappings = [
  { source: 'VBELN (销售凭证号)', target: 'erpOrderNo (ERP单号)', status: 'matched' },
  { source: 'MATNR (物料编码)', target: 'cargoName (货物名称)', status: 'matched' },
  { source: 'BRGEW (毛重)', target: 'weight (货物重量)', status: 'matched' },
  { source: 'VOLUM (体积)', target: 'volume (货物体积)', status: 'matched' },
  { source: 'MENGE (数量)', target: 'quantity (货物件数)', status: 'matched' },
  { source: 'ZKWERT (申报价值)', target: 'declaredValue (申报价值)', status: 'matched' },
  { source: 'TEMP_LOW (温控下限)', target: 'temperatureRequired.min', status: 'warning' },
  { source: 'TEMP_HIGH (温控上限)', target: 'temperatureRequired.max', status: 'warning' },
  { source: 'WERKS (工厂代码)', target: 'origin (装货地)', status: 'manual' },
  { source: 'LGORT (库存地点)', target: 'destination (卸货地)', status: 'manual' },
]

export default function ERPConfig() {
  const [selected, setSelected] = useState('sap')
  const [step, setStep] = useState(2)
  const [connected, setConnected] = useState(true)
  const [syncing, setSyncing] = useState(false)

  return (
    <div className="space-y-6">
      {/* 步骤概览 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate2-800">ERP 系统对接配置</h2>
              <p className="text-xs text-slate2-400 mt-0.5">对接企业ERP系统，实现订单数据自动同步，无需人工重复录入</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-50 border border-success-200">
            <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span className="text-sm font-semibold text-success-700">已连接 · 实时同步</span>
            <Clock className="w-3.5 h-3.5 text-success-500 ml-2" />
            <span className="text-xs text-success-600 font-mono">下次同步: 02:30</span>
          </div>
        </div>

        {/* 连接步骤 */}
        <div className="mt-8 grid grid-cols-5 gap-4">
          {[
            { n: 1, t: '选择ERP系统' },
            { n: 2, t: '配置连接参数' },
            { n: 3, t: '字段映射配置' },
            { n: 4, t: '同步规则设置' },
            { n: 5, t: '测试与启用' },
          ].map((s, idx, arr) => (
            <div key={s.n} className="relative flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step > s.n
                      ? 'bg-success-500 text-white'
                      : step === s.n
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-500/10'
                      : 'bg-slate2-100 text-slate2-400'
                  }`}
                >
                  {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : s.n}
                </div>
                <span className={`mt-2 text-xs font-medium ${step >= s.n ? 'text-slate2-700' : 'text-slate2-400'}`}>{s.t}</span>
              </div>
              {idx < arr.length - 1 && (
                <ArrowRight className={`w-4 h-4 mx-1 absolute -right-3 ${step > s.n ? 'text-success-400' : 'text-slate2-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：ERP 选择 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* ERP系统列表 */}
          <div className="card-base p-5">
            <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary-500" />
              选择ERP系统类型
            </h3>
            <div className="space-y-2.5">
              {erpSystems.map((erp) => (
                <button
                  key={erp.id}
                  onClick={() => setSelected(erp.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${
                    selected === erp.id
                      ? 'border-primary-400 bg-gradient-to-r from-primary-50 to-transparent shadow-sm'
                      : 'border-transparent bg-slate2-50/50 hover:border-slate2-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate2-100 flex items-center justify-center text-2xl">
                      {erp.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate2-800 text-sm">{erp.name}</span>
                        {erp.popular && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-accent-400 to-accent-500 text-white font-bold">推荐</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate2-400 mt-0.5">{erp.desc}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selected === erp.id ? 'border-primary-500 bg-primary-500' : 'border-slate2-300'
                      }`}
                    >
                      {selected === erp.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 连接参数 */}
          <div className="card-base p-5">
            <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary-500" />
              API 连接参数
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate2-600 mb-1.5">API 服务地址</label>
                <div className="flex items-center gap-2">
                  <input
                    defaultValue="https://erp.huawei.com/api/sap/odata/v2"
                    className="flex-1 h-10 px-3.5 rounded-lg bg-slate2-50 border border-slate2-100 text-sm font-mono focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all"
                  />
                  <button className="w-10 h-10 rounded-lg bg-slate2-50 border border-slate2-100 flex items-center justify-center text-slate2-400 hover:text-primary-500 hover:bg-white hover:border-primary-200 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">Client ID</label>
                  <input
                    defaultValue="HUAWEI-LOGI-001"
                    className="w-full h-10 px-3.5 rounded-lg bg-slate2-50 border border-slate2-100 text-sm font-mono focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">Client Secret</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••"
                    className="w-full h-10 px-3.5 rounded-lg bg-slate2-50 border border-slate2-100 text-sm font-mono focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">同步频率</label>
                  <select className="w-full h-10 px-3.5 rounded-lg bg-slate2-50 border border-slate2-100 text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all">
                    <option>每30分钟</option>
                    <option selected>每1小时</option>
                    <option>每4小时</option>
                    <option>每日 02:00</option>
                    <option>实时 (WebSocket)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2-600 mb-1.5">数据范围</label>
                  <select className="w-full h-10 px-3.5 rounded-lg bg-slate2-50 border border-slate2-100 text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all">
                    <option>仅销售订单 (ZOR)</option>
                    <option selected>销售+调拨订单</option>
                    <option>全部可发货单据</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate2-100">
              <button
                onClick={() => {
                  setSyncing(true)
                  setTimeout(() => {
                    setSyncing(false)
                    setConnected(true)
                  }, 2000)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  connected
                    ? 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/20'
                }`}
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    正在测试连接...
                  </>
                ) : connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    连接测试通过
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    测试连接
                  </>
                )}
              </button>
              <button className="px-5 py-2.5 rounded-lg bg-slate2-50 border border-slate2-200 text-slate2-600 text-sm font-medium hover:bg-white transition-colors">
                保存配置
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：字段映射 + 同步状态 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* 字段映射 */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate2-800 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-primary-500" />
                  字段映射规则配置
                </h3>
                <p className="text-xs text-slate2-400 mt-0.5">将 ERP 系统字段与物流平台字段进行智能匹配</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 font-medium hover:bg-primary-100 transition-colors flex items-center gap-1">
                <Code className="w-3.5 h-3.5" />
                自定义转换脚本
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate2-100">
              <div className="grid grid-cols-11 gap-2 px-4 py-2.5 bg-slate2-50 border-b border-slate2-100 text-[11px] font-semibold text-slate2-500 uppercase tracking-wider">
                <div className="col-span-4">ERP 源字段</div>
                <div className="col-span-1 text-center">映射</div>
                <div className="col-span-4">平台目标字段</div>
                <div className="col-span-2 text-right">状态</div>
              </div>
              <div className="divide-y divide-slate2-50 max-h-[320px] overflow-y-auto">
                {fieldMappings.map((fm, i) => (
                  <div key={i} className="grid grid-cols-11 gap-2 px-4 py-3 hover:bg-slate2-50/50 transition-colors items-center">
                    <div className="col-span-4">
                      <div className="text-xs font-mono font-medium text-slate2-700 bg-slate2-50 px-2 py-1 rounded inline-block">
                        {fm.source}
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <ArrowRight className="w-4 h-4 text-primary-400 mx-auto" />
                    </div>
                    <div className="col-span-4">
                      <div className="text-xs font-mono font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded inline-block">
                        {fm.target}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      {fm.status === 'matched' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success-50 text-success-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> 自动匹配
                        </span>
                      )}
                      {fm.status === 'warning' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                          <AlertCircle className="w-3 h-3" /> 需校验
                        </span>
                      )}
                      {fm.status === 'manual' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium">
                          <Settings className="w-3 h-3" /> 手动配置
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 同步统计 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card-base p-5 card-hover">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                </div>
                <span className="text-xs text-slate2-500 font-medium">今日同步</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate2-800">248 <span className="text-sm font-normal text-slate2-400">单</span></div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-success-600">
                <ArrowRight className="w-3 h-3" />
                成功率 99.2%
              </div>
            </div>
            <div className="card-base p-5 card-hover">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary-500" />
                </div>
                <span className="text-xs text-slate2-500 font-medium">待处理订单</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate2-800">16 <span className="text-sm font-normal text-slate2-400">单</span></div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-primary-600">
                <RefreshCw className="w-3 h-3" />
                等待人工确认
              </div>
            </div>
            <div className="card-base p-5 card-hover">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-accent-500" />
                </div>
                <span className="text-xs text-slate2-500 font-medium">同步失败</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate2-800">2 <span className="text-sm font-normal text-slate2-400">单</span></div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-accent-600">
                <AlertCircle className="w-3 h-3" />
                字段映射错误
              </div>
            </div>
          </div>

          {/* 同步历史日志 */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                最近同步日志
              </h3>
              <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">查看全部 →</button>
            </div>
            <div className="space-y-2.5">
              {[
                { t: '16:30:00', s: 'success', msg: '成功同步 SAP 订单 42 条', detail: '含电子类订单 28, 机械类 14' },
                { t: '15:30:00', s: 'success', msg: '成功同步 SAP 订单 38 条', detail: '0 条异常, 耗时 2.3s' },
                { t: '14:30:00', s: 'warning', msg: '同步完成但存在 2 条异常', detail: '字段 ZWERKS 无法映射, 已转人工' },
                { t: '13:30:00', s: 'success', msg: '成功同步 SAP 订单 56 条', detail: '含高价值订单 12 条, 自动关联保险' },
                { t: '12:30:00', s: 'success', msg: '成功同步 SAP 订单 35 条', detail: '0 条异常, 耗时 1.8s' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate2-50 transition-colors">
                  <span className="text-xs font-mono text-slate2-400 pt-0.5 flex-shrink-0 w-16">{log.t}</span>
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    log.s === 'success' ? 'bg-success-500' : log.s === 'warning' ? 'bg-amber-500' : 'bg-accent-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate2-700 font-medium">{log.msg}</div>
                    <div className="text-[11px] text-slate2-400 mt-0.5">{log.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
