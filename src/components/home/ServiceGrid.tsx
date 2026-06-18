import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Calculator,
  FileText,
  MapPin,
  ArrowRightLeft,
  CreditCard,
  HardHat,
  Baby,
} from 'lucide-react'

const services = [
  { icon: Shield, name: '参保状态核验', desc: '实时查询参保状态和缴费记录', path: '/insurance/verify' },
  { icon: Calculator, name: '养老金测算', desc: '输入参数自动测算养老金待遇', path: '/pension/calculator' },
  { icon: FileText, name: '失业补贴申领', desc: '线上申领失业保险金', path: '/unemployment/apply' },
  { icon: MapPin, name: '医保机构查询', desc: '查找定点医院和药店', path: '/medical/institutions' },
  { icon: ArrowRightLeft, name: '社保转移', desc: '跨省社保关系转移接续' },
  { icon: CreditCard, name: '社保卡服务', desc: '社保卡申领、挂失、补换' },
  { icon: HardHat, name: '工伤认定', desc: '工伤认定和劳动能力鉴定' },
  { icon: Baby, name: '生育保险', desc: '生育津贴申领和报销' },
]

export default function ServiceGrid() {
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-xl font-semibold text-gray-900">服务事项</h2>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {services.map((s) => (
          <button
            key={s.name}
            onClick={() => s.path && navigate(s.path)}
            className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary text-center"
          >
            <s.icon size={48} className="text-primary" strokeWidth={1.5} />
            <div className="font-medium text-gray-900">{s.name}</div>
            <div className="text-sm text-gray-500">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
