import { useState } from 'react'
import { X, FileText, Award, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from 'recharts'
import { useStore, type Supplier } from '@/store'

interface CreditBreakdownModalProps {
  open: boolean
  onClose: () => void
  supplierId: string
}

interface CreditEvent {
  date: string
  type: 'audit' | 'award' | 'complaint' | 'rectification' | 'normal'
  title: string
  description: string
}

function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-navy-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

const mockCreditTrend = [
  { month: '01月', score: 88.5 },
  { month: '02月', score: 89.2 },
  { month: '03月', score: 90.1 },
  { month: '04月', score: 90.8 },
  { month: '05月', score: 91.5 },
  { month: '06月', score: 92.0 },
]

const mockCreditEvents: CreditEvent[] = [
  { date: '2026-05-20', type: 'award', title: '获得季度诚信商家表彰', description: '连续3个季度履约率超95%，获评产业诚信示范单位' },
  { date: '2026-04-15', type: 'normal', title: '年度资质审核通过', description: '营业执照、生产许可证等资质年审通过' },
  { date: '2026-03-08', type: 'complaint', title: '客诉处理完成', description: '1起延迟交付投诉，已协商补偿，整改完成' },
  { date: '2026-02-10', type: 'rectification', title: '质检流程优化', description: '增加出厂二次抽检，质检合格率提升至98%' },
  { date: '2026-01-05', type: 'audit', title: '新供应商入驻审核通过', description: '提交完整资质材料，通过平台入驻审核' },
]

const fulfillmentTrend = [
  { month: '07月', rate: 93.2 }, { month: '08月', rate: 94.5 }, { month: '09月', rate: 95.1 },
  { month: '10月', rate: 94.8 }, { month: '11月', rate: 96.0 }, { month: '12月', rate: 95.5 },
  { month: '01月', rate: 96.2 }, { month: '02月', rate: 95.8 }, { month: '03月', rate: 96.5 },
  { month: '04月', rate: 95.9 }, { month: '05月', rate: 96.8 }, { month: '06月', rate: 96.5 },
]

const fulfillmentDetails = [
  { orderId: 'ORD-20260601', orderDate: '2026-06-01', promisedDate: '2026-06-15', actualDate: '2026-06-14', onTime: true, deviation: 0 },
  { orderId: 'ORD-20260518', orderDate: '2026-05-18', promisedDate: '2026-06-01', actualDate: '2026-06-01', onTime: true, deviation: 0 },
  { orderId: 'ORD-20260505', orderDate: '2026-05-05', promisedDate: '2026-05-20', actualDate: '2026-05-22', onTime: false, deviation: 2 },
  { orderId: 'ORD-20260420', orderDate: '2026-04-20', promisedDate: '2026-05-05', actualDate: '2026-05-05', onTime: true, deviation: 0 },
  { orderId: 'ORD-20260410', orderDate: '2026-04-10', promisedDate: '2026-04-25', actualDate: '2026-04-30', onTime: false, deviation: 5 },
]

const qcTrend = [
  { month: '01月', rate: 96.5 }, { month: '02月', rate: 97.2 }, { month: '03月', rate: 97.8 },
  { month: '04月', rate: 98.1 }, { month: '05月', rate: 92.0 }, { month: '06月', rate: 98.3 },
]

const qcDetails = [
  { batchId: 'QC-20260605', date: '2026-06-05', item: '外观检验', pass: 498, fail: 2, rate: 99.6 },
  { batchId: 'QC-20260528', date: '2026-05-28', item: '尺寸测量', pass: 485, fail: 15, rate: 97.0 },
  { batchId: 'QC-20260520', date: '2026-05-20', item: '色牢度测试', pass: 460, fail: 40, rate: 92.0 },
  { batchId: 'QC-20260515', date: '2026-05-15', item: '成分检测', pass: 495, fail: 5, rate: 99.0 },
  { batchId: 'QC-20260508', date: '2026-05-08', item: '强力测试', pass: 492, fail: 8, rate: 98.4 },
]

const complaintTrend = [
  { month: '07月', count: 2 }, { month: '08月', count: 1 }, { month: '09月', count: 0 },
  { month: '10月', count: 1 }, { month: '11月', count: 0 }, { month: '12月', count: 1 },
  { month: '01月', count: 0 }, { month: '02月', count: 1 }, { month: '03月', count: 0 },
  { month: '04月', count: 0 }, { month: '05月', count: 1 }, { month: '06月', count: 0 },
]

const complaintDetails = [
  { id: 'CP-20260520', date: '2026-05-20', customer: '杭州锦衣服饰', type: '延迟交付', status: '已解决' as const, result: '协商补偿5%货款' },
  { id: 'CP-20260415', date: '2026-04-15', customer: '上海盛达贸易', type: '质量问题', status: '处理中' as const, result: '补发替换批次' },
  { id: 'CP-20260308', date: '2026-03-08', customer: '广州恒信制衣', type: '数量短缺', status: '已整改' as const, result: '补发短缺数量，加强出库核对' },
]

const deliveryTrend = [
  { month: '07月', rate: 91.5 }, { month: '08月', rate: 92.3 }, { month: '09月', rate: 93.0 },
  { month: '10月', rate: 92.8 }, { month: '11月', rate: 93.5 }, { month: '12月', rate: 94.0 },
  { month: '01月', rate: 93.8 }, { month: '02月', rate: 94.2 }, { month: '03月', rate: 94.8 },
  { month: '04月', rate: 93.5 }, { month: '05月', rate: 95.0 }, { month: '06月', rate: 94.5 },
]

const deliveryDetails = [
  { orderId: 'ORD-20260601', promised: '2026-06-15', actual: '2026-06-14', onTime: true, delay: 0 },
  { orderId: 'ORD-20260518', promised: '2026-06-01', actual: '2026-06-01', onTime: true, delay: 0 },
  { orderId: 'ORD-20260505', promised: '2026-05-20', actual: '2026-05-22', onTime: false, delay: 2 },
  { orderId: 'ORD-20260420', promised: '2026-05-05', actual: '2026-05-05', onTime: true, delay: 0 },
  { orderId: 'ORD-20260410', promised: '2026-04-25', actual: '2026-04-30', onTime: false, delay: 5 },
]

export default function CreditBreakdownModal({ open, onClose, supplierId }: CreditBreakdownModalProps) {
  const suppliers = useStore((s) => s.suppliers)
  const supplier = suppliers.find((s) => s.id === supplierId) as Supplier | undefined
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null)

  if (!open || !supplier) return null

  const fulfillmentScore = supplier.fulfillmentRate
  const qcScore = supplier.qcPassRate
  const lowComplaintScore = 100 - supplier.complaintRate
  const onTimeDeliveryScore = 100 - supplier.complaintRate

  const radarData = [
    { dimension: '履约率', score: fulfillmentScore, fullMark: 100 },
    { dimension: '质检合格率', score: qcScore, fullMark: 100 },
    { dimension: '低客诉率', score: lowComplaintScore, fullMark: 100 },
    { dimension: '准时交付率', score: onTimeDeliveryScore, fullMark: 100 },
  ]

  const scoringModel = [
    { dimension: '履约率', weight: '30%', score: fulfillmentScore.toFixed(1), description: '近12个月按时交付率' },
    { dimension: '质检合格率', weight: '30%', score: qcScore.toFixed(1), description: '一次质检通过率' },
    { dimension: '低客诉率', weight: '20%', score: lowComplaintScore.toFixed(1), description: '客诉订单占比' },
    { dimension: '准时交付率', weight: '20%', score: onTimeDeliveryScore.toFixed(1), description: '承诺交期遵守率' },
  ]

  const eventIcon = (type: CreditEvent['type']) => {
    switch (type) {
      case 'audit': return <CheckCircle size={14} className="text-blue-500" />
      case 'award': return <Award size={14} className="text-amber-500" />
      case 'complaint': return <AlertTriangle size={14} className="text-red-500" />
      case 'rectification': return <Clock size={14} className="text-teal-500" />
      default: return <CheckCircle size={14} className="text-emerald-500" />
    }
  }

  const eventBg = (type: CreditEvent['type']) => {
    switch (type) {
      case 'audit': return 'bg-blue-50 border-blue-200'
      case 'award': return 'bg-amber-50 border-amber-200'
      case 'complaint': return 'bg-red-50 border-red-200'
      case 'rectification': return 'bg-teal-50 border-teal-200'
      default: return 'bg-emerald-50 border-emerald-200'
    }
  }

  const scoreColor = supplier.creditScore >= 90 ? 'text-emerald-500' : supplier.creditScore >= 80 ? 'text-blue-500' : supplier.creditScore >= 70 ? 'text-amber-500' : 'text-red-500'

  const renderFulfillmentDetail = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-white border border-navy-100 rounded-lg p-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fulfillmentTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <YAxis domain={[90, 100]} tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E8EBF0' }} formatter={(v: number) => [`${v}%`, '履约率']} />
            <Line type="monotone" dataKey="rate" stroke="#2E8B8B" strokeWidth={2} dot={{ r: 3, fill: '#2E8B8B' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="border border-navy-100 rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">订单号</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">下单日</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">承诺交期</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">实际交期</th>
              <th className="px-2 py-1.5 text-center text-navy-500 font-medium">是否准时</th>
              <th className="px-2 py-1.5 text-right text-navy-500 font-medium">偏差</th>
            </tr>
          </thead>
          <tbody>
            {fulfillmentDetails.map((d) => (
              <tr key={d.orderId} className="border-t border-navy-100">
                <td className="px-2 py-1.5 text-navy-700">{d.orderId}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.orderDate}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.promisedDate}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.actualDate}</td>
                <td className="px-2 py-1.5 text-center">
                  {d.onTime ? <span className="text-emerald-600">✓ 准时</span> : d.deviation <= 2 ? <span className="text-amber-600">⚠ 延迟{d.deviation}天</span> : <span className="text-red-600">✗ 延迟{d.deviation}天</span>}
                </td>
                <td className="px-2 py-1.5 text-right text-navy-500">{d.deviation === 0 ? '-' : `${d.deviation}天`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => toast('履约记录复查申请已提交')} className="w-full py-1.5 bg-teal-50 text-teal-600 text-[10px] rounded-lg hover:bg-teal-100 transition-colors">申请复查</button>
    </div>
  )

  const renderQcDetail = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-white border border-navy-100 rounded-lg p-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={qcTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <YAxis domain={[88, 100]} tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E8EBF0' }} formatter={(v: number) => [`${v}%`, '合格率']} />
            <Line type="monotone" dataKey="rate" stroke="#D4A853" strokeWidth={2} dot={{ r: 3, fill: '#D4A853' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="border border-navy-100 rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">批次号</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">检验日期</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">检验项</th>
              <th className="px-2 py-1.5 text-right text-navy-500 font-medium">合格</th>
              <th className="px-2 py-1.5 text-right text-navy-500 font-medium">不合格</th>
              <th className="px-2 py-1.5 text-right text-navy-500 font-medium">合格率</th>
            </tr>
          </thead>
          <tbody>
            {qcDetails.map((d) => (
              <tr key={d.batchId} className="border-t border-navy-100">
                <td className="px-2 py-1.5 text-navy-700">{d.batchId}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.date}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.item}</td>
                <td className="px-2 py-1.5 text-right text-navy-600">{d.pass}</td>
                <td className="px-2 py-1.5 text-right text-navy-600">{d.fail}</td>
                <td className={`px-2 py-1.5 text-right font-medium ${d.rate >= 97 ? 'text-emerald-600' : 'text-red-600'}`}>{d.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-navy-50 rounded-lg p-2">
        <p className="text-[10px] font-medium text-navy-600 mb-1">不合格品处理记录</p>
        <div className="flex gap-2 text-[10px]">
          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">返工 2次</span>
          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">退货 1次</span>
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">让步接收 1次</span>
        </div>
      </div>
      <button onClick={() => toast('质检记录复查申请已提交')} className="w-full py-1.5 bg-teal-50 text-teal-600 text-[10px] rounded-lg hover:bg-teal-100 transition-colors">申请复查</button>
    </div>
  )

  const renderComplaintDetail = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-white border border-navy-100 rounded-lg p-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={complaintTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E8EBF0' }} formatter={(v: number) => [`${v}次`, '客诉数']} />
            <Bar dataKey="count" fill="#E8B84B" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="border border-navy-100 rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">投诉编号</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">日期</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">客户</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">投诉类型</th>
              <th className="px-2 py-1.5 text-center text-navy-500 font-medium">状态</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">处理结果</th>
            </tr>
          </thead>
          <tbody>
            {complaintDetails.map((d) => (
              <tr key={d.id} className="border-t border-navy-100">
                <td className="px-2 py-1.5 text-navy-700">{d.id}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.date}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.customer}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.type}</td>
                <td className="px-2 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                    d.status === '已解决' ? 'bg-emerald-50 text-emerald-700' :
                    d.status === '处理中' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>{d.status}</span>
                </td>
                <td className="px-2 py-1.5 text-navy-500">{d.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-navy-50 rounded-lg p-2">
        <p className="text-[10px] font-medium text-navy-600 mb-1">投诉类型分布</p>
        <div className="flex gap-2 text-[10px] flex-wrap">
          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">延迟交付 1次</span>
          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded">质量问题 1次</span>
          <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded">数量短缺 1次</span>
          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">沟通不畅 0次</span>
        </div>
      </div>
      <button onClick={() => toast('客诉记录复查申请已提交')} className="w-full py-1.5 bg-teal-50 text-teal-600 text-[10px] rounded-lg hover:bg-teal-100 transition-colors">申请复查</button>
    </div>
  )

  const renderDeliveryDetail = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-white border border-navy-100 rounded-lg p-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={deliveryTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <YAxis domain={[88, 100]} tick={{ fontSize: 9, fill: '#59708F' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E8EBF0' }} formatter={(v: number) => [`${v}%`, '准时率']} />
            <Line type="monotone" dataKey="rate" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: '#6366F1' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="border border-navy-100 rounded-lg overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">订单号</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">承诺日期</th>
              <th className="px-2 py-1.5 text-left text-navy-500 font-medium">实际交付</th>
              <th className="px-2 py-1.5 text-center text-navy-500 font-medium">准时</th>
              <th className="px-2 py-1.5 text-right text-navy-500 font-medium">延迟天数</th>
            </tr>
          </thead>
          <tbody>
            {deliveryDetails.map((d) => (
              <tr key={d.orderId} className="border-t border-navy-100">
                <td className="px-2 py-1.5 text-navy-700">{d.orderId}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.promised}</td>
                <td className="px-2 py-1.5 text-navy-500">{d.actual}</td>
                <td className="px-2 py-1.5 text-center">
                  {d.onTime ? <span className="text-emerald-600">✓</span> : <span className="text-red-600">✗</span>}
                </td>
                <td className="px-2 py-1.5 text-right text-navy-500">{d.delay === 0 ? '-' : `${d.delay}天`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => toast('交付记录复查申请已提交')} className="w-full py-1.5 bg-teal-50 text-teal-600 text-[10px] rounded-lg hover:bg-teal-100 transition-colors">申请复查</button>
    </div>
  )

  const detailRenderers: Record<string, () => JSX.Element> = {
    '履约率': renderFulfillmentDetail,
    '质检合格率': renderQcDetail,
    '低客诉率': renderComplaintDetail,
    '准时交付率': renderDeliveryDetail,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-100">
          <div>
            <h2 className="text-lg font-semibold text-navy-700">{supplier.name}</h2>
            <p className="text-xs text-navy-400 mt-0.5">信用评分详细拆解 · 2026Q2 真实产业普查样本</p>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="bg-gradient-to-br from-navy-50 to-teal-50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-500 mb-1">综合信用分</p>
                <p className={`text-5xl font-bold font-serif ${scoreColor}`}>{supplier.creditScore}</p>
                <p className="text-xs text-navy-400 mt-1">基于4个维度加权计算 · 满分100</p>
              </div>
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#E8EBF0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#59708F' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="得分" dataKey="score" stroke="#2E8B8B" fill="#2E8B8B" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy-700 mb-2 flex items-center gap-1.5">
              <FileText size={14} />信用评分计算模型
            </h3>
            <div className="border border-navy-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-navy-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-navy-500 font-medium">维度</th>
                    <th className="px-3 py-2 text-center text-navy-500 font-medium">权重</th>
                    <th className="px-3 py-2 text-right text-navy-500 font-medium">得分</th>
                    <th className="px-3 py-2 text-left text-navy-500 font-medium">说明</th>
                    <th className="px-3 py-2 text-center text-navy-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringModel.map((row) => (
                    <tr key={row.dimension} className="border-t border-navy-100">
                      <td className="px-3 py-2 text-navy-700 font-medium">{row.dimension}</td>
                      <td className="px-3 py-2 text-center text-amber-600 font-medium">{row.weight}</td>
                      <td className="px-3 py-2 text-right text-teal-600 font-bold">{row.score}分</td>
                      <td className="px-3 py-2 text-navy-500">{row.description}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setExpandedDetail(expandedDetail === row.dimension ? null : row.dimension)}
                          className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {expandedDetail === row.dimension ? '收起' : '查看明细'}
                          {expandedDetail === row.dimension ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expandedDetail && detailRenderers[expandedDetail] && (
                <div className="border-t border-navy-200 bg-navy-50/30 p-3">
                  <h4 className="text-[11px] font-semibold text-navy-700 mb-2">{expandedDetail}明细</h4>
                  {detailRenderers[expandedDetail]()}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy-700 mb-2">近6个月信用趋势</h3>
            <div className="bg-white border border-navy-100 rounded-lg p-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockCreditTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#59708F' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[85, 95]} tick={{ fontSize: 10, fill: '#59708F' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E8EBF0' }} formatter={(v: number) => [`${v}分`, '信用分']} />
                  <Line type="monotone" dataKey="score" stroke="#2E8B8B" strokeWidth={2.5} dot={{ r: 4, fill: '#2E8B8B' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-navy-700 mb-2">历史信用事件</h3>
            <div className="space-y-2 pl-1">
              {mockCreditEvents.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${eventBg(event.type)}`}>
                      {eventIcon(event.type)}
                    </div>
                    {i < mockCreditEvents.length - 1 && <div className="w-px flex-1 bg-navy-200 my-1" />}
                  </div>
                  <div className={`flex-1 rounded-lg border ${eventBg(event.type)} px-3 py-2 mb-1`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-navy-700">{event.title}</p>
                      <p className="text-[10px] text-navy-400">{event.date}</p>
                    </div>
                    <p className="text-[10px] text-navy-500 mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-navy-100 bg-navy-50/50">
          <p className="text-[10px] text-navy-400">数据来源：织链产业信用评价体系 · 2026Q2 更新</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-navy-200 rounded-lg text-sm text-navy-500 hover:bg-navy-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={() => toast('报告已生成，可在消息中心查看')}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} />查看完整信用报告
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
