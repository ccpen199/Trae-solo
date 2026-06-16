import {
  Building2,
  DollarSign,
  Users,
  Star,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Eye,
  PawPrint,
  Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: '今日到店', value: '23', Icon: Users, color: 'from-orange-400 to-amber-600' },
  { label: '服务订单', value: '¥38,680', Icon: DollarSign, color: 'from-forest-400 to-emerald-600' },
  { label: '综合评分', value: '4.8', Icon: Star, color: 'from-warm-300 to-warm-500' },
  { label: '评价数', value: '1,286', Icon: FileText, color: 'from-sky-400 to-cyan-600' },
];

const serviceItems = [
  { name: '常规体检', booked: 12, capacity: 20, price: 80, icon: Stethoscope },
  { name: '疫苗接种', booked: 18, capacity: 30, price: 120, icon: ShieldCheck },
  { name: '驱虫服务', booked: 8, capacity: 25, price: 150, icon: ShieldCheck },
  { name: '血液检查', booked: 6, capacity: 15, price: 380, icon: FileText },
  { name: '外科手术', booked: 2, capacity: 5, price: 1800, icon: Stethoscope },
  { name: '牙科洁牙', booked: 4, capacity: 10, price: 450, icon: PawPrint },
];

const appointments = [
  { time: '09:00', pet: '小白（金毛）', owner: '张小明', service: '常规体检', status: 'confirmed' },
  { time: '10:30', pet: '花花（英短）', owner: '李小红', service: '疫苗接种', status: 'confirmed' },
  { time: '11:00', pet: '旺财（拉布拉多）', owner: '王小刚', service: '驱虫服务', status: 'pending' },
  { time: '14:00', pet: '咪咪（布偶）', owner: '赵小美', service: '血液检查', status: 'confirmed' },
  { time: '15:30', pet: '豆豆（垂耳兔）', owner: '陈小华', service: '牙科洁牙', status: 'pending' },
];

const reviews = [
  { user: '张小明', rating: 5, content: '服务态度很好，医生专业有耐心，狗狗恢复得很快。', verified: true, antiFraud: 0.95 },
  { user: '李小红', rating: 5, content: '环境干净整洁，等候时间短，整体体验非常棒。', verified: true, antiFraud: 0.92 },
  { user: '匿名用户', rating: 3, content: '价格稍贵，服务还行。', verified: false, antiFraud: 0.58, flagged: true },
];

export default function HospitalDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '医院工作台'}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-500" />
              认证医疗机构 · 服务定价 / 医生排班 / 评价管理
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/pets')} className="btn-secondary !py-2 text-sm">
            <Calendar className="w-4 h-4" /> 查看到店排期
          </button>
          <button className="btn-primary !py-2 text-sm">
            <Settings className="w-4 h-4" /> 服务定价管理
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card !p-5">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 服务项目管理 */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" /> 服务项目定价与容量
            </h2>
            <span className="text-xs text-forest-600 hover:underline cursor-pointer flex items-center gap-1">
              全部管理 <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {serviceItems.map((item) => (
              <div key={item.name} className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
                  </div>
                  <span className="text-orange-600 font-bold text-sm">¥{item.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>今日预约 <span className="text-gray-800 font-semibold">{item.booked}</span>/{item.capacity}</span>
                  <span className="text-forest-600">使用率 {Math.round(item.booked / item.capacity * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, item.booked / item.capacity * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 今日预约 */}
        <div className="card space-y-4">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-forest-500" /> 今日预约排期
          </h2>
          <div className="space-y-2.5">
            {appointments.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-forest-50/50 transition-colors cursor-pointer group">
                <div className="text-center shrink-0 w-12">
                  <div className="font-mono font-bold text-gray-800">{a.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{a.pet} · {a.service}</div>
                  <div className="text-xs text-gray-500 truncate">{a.owner}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  a.status === 'confirmed' ? 'bg-forest-100 text-forest-700' : 'bg-warm-100 text-warm-700'
                }`}>
                  {a.status === 'confirmed' ? '已确认' : '待确认'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 评价管理 + 反作弊机制 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" /> 用户评价 · 反作弊复核
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warm-500" /> 待审核评价 2 条</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-forest-500" /> 系统反作弊评分已启用</span>
          </div>
        </div>
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                r.flagged
                  ? 'border-warm-300 bg-warm-50/50'
                  : 'border-gray-100 bg-white hover:border-forest-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{r.user}</span>
                  {r.verified && (
                    <span className="text-[10px] bg-forest-100 text-forest-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 已消费验证
                    </span>
                  )}
                  <div className="flex text-warm-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-3.5 h-3.5 ${j < r.rating ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    r.antiFraud >= 0.9 ? 'bg-forest-100 text-forest-700'
                    : r.antiFraud >= 0.7 ? 'bg-sky-100 text-sky-700'
                    : 'bg-warm-100 text-warm-700'
                  }`}>
                    可信度 {Math.round(r.antiFraud * 100)}%
                  </span>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-forest-600 hover:bg-forest-50 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.content}</p>
              {r.flagged && (
                <div className="mt-3 pt-3 border-t border-warm-200 flex items-center justify-between">
                  <span className="text-xs text-warm-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    反作弊系统标记：账号行为异常，请人工复核
                  </span>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">驳回</button>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-forest-500 text-white hover:bg-forest-600">通过展示</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
