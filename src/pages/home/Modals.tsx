import { X, Users, TrendingUp, Camera, CheckCircle } from 'lucide-react'

const mockRetirees = [
  { name: '张*华', idCard: '370***********1234', status: '已认证', time: '2026-06-09 09:15', type: '企业退休' },
  { name: '李*明', idCard: '370***********5678', status: '认证失败', time: '2026-06-09 10:30', type: '机关事业退休' },
  { name: '王*英', idCard: '370***********9012', status: '已认证', time: '2026-06-09 10:15', type: '企业退休' },
  { name: '赵*强', idCard: '370***********3456', status: '待认证', time: '2026-06-09 11:00', type: '企业退休' },
  { name: '陈*芳', idCard: '370***********7890', status: '已认证', time: '2026-06-09 09:45', type: '机关事业退休' },
  { name: '刘*伟', idCard: '370***********2345', status: '认证失败', time: '2026-06-09 14:20', type: '企业退休' },
]

const failedRetirees = [
  { name: '赵*强', idCard: '370***********3456', status: '认证失败', time: '2026-06-09 10:30', type: '企业退休' },
  { name: '孙*丽', idCard: '370***********6789', status: '认证失败', time: '2026-06-09 11:15', type: '机关事业退休' },
  { name: '周*军', idCard: '370***********0123', status: '认证失败', time: '2026-06-09 13:45', type: '企业退休' },
  { name: '吴*霞', idCard: '370***********4567', status: '认证失败', time: '2026-06-09 14:20', type: '企业退休' },
  { name: '郑*国', idCard: '370***********8901', status: '认证失败', time: '2026-06-09 15:05', type: '机关事业退休' },
]

export interface DrillDownState {
  type: 'region' | 'time' | 'failure' | null
  data: string
}

function RetireeTable({ data }: { data: typeof mockRetirees }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-helper">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-1 text-gray-400 font-normal">姓名</th>
            <th className="text-left py-2 px-1 text-gray-400 font-normal">证件号</th>
            <th className="text-left py-2 px-1 text-gray-400 font-normal">认证状态</th>
            <th className="text-left py-2 px-1 text-gray-400 font-normal">认证时间</th>
            <th className="text-left py-2 px-1 text-gray-400 font-normal">待遇类型</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-2 px-1 text-gray-700">{r.name}</td>
              <td className="py-2 px-1 text-gray-500 text-sm">{r.idCard}</td>
              <td className="py-2 px-1">
                <span className={`text-sm font-bold px-2 py-0.5 rounded-badge ${
                  r.status === '已认证' ? 'bg-success/10 text-success'
                  : r.status === '认证失败' ? 'bg-error/10 text-error'
                  : 'bg-warning/10 text-warning'
                }`}>{r.status}</span>
              </td>
              <td className="py-2 px-1 text-gray-500 text-sm">{r.time}</td>
              <td className="py-2 px-1 text-gray-500 text-sm">{r.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RegionContent() {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-primary" />
        <h4 className="text-helper font-bold text-gray-700">退休人员清单</h4>
      </div>
      <RetireeTable data={mockRetirees} />
      <p className="text-sm text-gray-400 mt-3">统计口径: 按社保缴费地划分，含企业退休+机关事业单位退休人员</p>
    </>
  )
}

function TimeContent() {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={18} className="text-success" />
        <span className="text-helper font-bold text-success">认证量趋势: 较昨日同期 +12%</span>
      </div>
      <div className="flex items-center gap-2 mb-3 mt-4">
        <Users size={18} className="text-primary" />
        <h4 className="text-helper font-bold text-gray-700">退休人员清单</h4>
      </div>
      <RetireeTable data={mockRetirees.slice(0, 5)} />
    </>
  )
}

function FailureContent() {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Users size={18} className="text-primary" />
        <h4 className="text-helper font-bold text-gray-700">退休人员清单</h4>
      </div>
      <RetireeTable data={failedRetirees} />
      <div className="mt-3 bg-warning/5 rounded-badge p-3">
        <p className="text-helper text-warning font-bold">趋势对比: 本周该原因失败占比 vs 上周: 32% vs 28% (+4%)</p>
      </div>
    </>
  )
}

export function DrillDownModal({ state, onClose }: { state: DrillDownState; onClose: () => void }) {
  if (!state.type) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-card p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body-xl font-bold text-primary">{state.data}</h3>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-badge hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {state.type === 'region' && <RegionContent />}
        {state.type === 'time' && <TimeContent />}
        {state.type === 'failure' && <FailureContent />}
      </div>
    </div>
  )
}

export function CredentialReviewModal({ certData, onClose, open }: {
  certData: { certNo: string; certTime: string; deviceFingerprint: string; validUntil: string; name: string; idCard: string } | null
  onClose: () => void
  open: boolean
}) {
  if (!open || !certData) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-card p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body-xl font-bold text-primary">凭证复查详情</h3>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-badge hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">凭证编号</span>
            <span className="text-body-lg font-bold text-gray-800 font-mono">{certData.certNo}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">认证时间</span>
            <span className="text-body-lg font-bold text-gray-800">{certData.certTime}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">设备指纹</span>
            <span className="text-body-lg font-bold text-gray-800 font-mono">{certData.deviceFingerprint}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">有效期至</span>
            <span className="text-body-lg font-bold text-gray-800">{certData.validUntil}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">认证人</span>
            <span className="text-body-lg font-bold text-gray-800">{certData.name}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-helper text-gray-400">证件号</span>
            <span className="text-body-lg font-bold text-gray-800 font-mono">{certData.idCard}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <CheckCircle size={18} className="text-success" />
          <span className="text-helper font-bold text-success">凭证校验通过</span>
        </div>
      </div>
    </div>
  )
}

export function ScreenshotGalleryModal({ onClose, open }: { onClose: () => void; open: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-card p-5 max-w-lg w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body-xl font-bold text-primary">帧截图存证</h3>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-badge hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['帧 1 - 人脸检测', '帧 2 - 眨眼检测', '帧 3 - 转头检测'].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-full aspect-square bg-gray-100 rounded-badge flex items-center justify-center">
                <Camera size={32} className="text-gray-300" />
              </div>
              <span className="text-sm text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
