import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Phone, Clock, ChevronRight, X, Navigation, MessageSquare } from 'lucide-react';

const MOCK_APPOINTMENTS = [
  {
    id: 'apt-001',
    companyName: '锦华装饰',
    companyLogo: '',
    address: '北京市朝阳区望京SOHO T1 1208',
    contactName: '张经理',
    contactPhone: '138****6789',
    scheduledTime: '2026-06-15 14:00',
    status: 'pending' as const,
    remark: '三室两厅，约90㎡',
  },
  {
    id: 'apt-002',
    companyName: '东易日盛',
    companyLogo: '',
    address: '北京市海淀区中关村南大街甲18号',
    contactName: '李工长',
    contactPhone: '139****2345',
    scheduledTime: '2026-06-12 10:00',
    status: 'accepted' as const,
    remark: '复式结构，重点关注楼梯区域',
  },
  {
    id: 'apt-003',
    companyName: '业之峰装饰',
    companyLogo: '',
    address: '北京市丰台区丽泽桥西300米',
    contactName: '王设计师',
    contactPhone: '136****8901',
    scheduledTime: '2026-06-08 09:30',
    status: 'completed' as const,
    remark: '',
  },
  {
    id: 'apt-004',
    companyName: '龙发装饰',
    companyLogo: '',
    address: '北京市西城区金融街甲15号',
    contactName: '赵经理',
    contactPhone: '137****5678',
    scheduledTime: '2026-06-05 15:00',
    status: 'cancelled' as const,
    remark: '业主临时有事取消',
  },
];

type StatusKey = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled';

const STATUS_TABS: { key: StatusKey; label: string; color: string }[] = [
  { key: 'all', label: '全部', color: '' },
  { key: 'pending', label: '待确认', color: 'bg-terracotta-500' },
  { key: 'accepted', label: '已接单', color: 'bg-haze-500' },
  { key: 'completed', label: '量房完成', color: 'bg-emerald-500' },
  { key: 'cancelled', label: '已取消', color: 'bg-carbon-400' },
];

const STATUS_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
  pending: { bar: 'bg-terracotta-500', badge: 'badge-terracotta', label: '待确认' },
  accepted: { bar: 'bg-haze-500', badge: 'badge-haze', label: '已接单' },
  completed: { bar: 'bg-emerald-500', badge: 'badge-success', label: '量房完成' },
  cancelled: { bar: 'bg-carbon-400', badge: 'bg-carbon-100 text-carbon-600', label: '已取消' },
};

export default function AppointmentList() {
  const [activeTab, setActiveTab] = useState<StatusKey>('all');

  const filtered = activeTab === 'all'
    ? MOCK_APPOINTMENTS
    : MOCK_APPOINTMENTS.filter((a) => a.status === activeTab);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title">我的预约</h1>
        <p className="section-subtitle">管理您的量房预约记录</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-wood-600 text-white shadow-sm'
                : 'bg-ivory-200 text-carbon-600 hover:bg-ivory-300'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({MOCK_APPOINTMENTS.filter((a) => a.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-base p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-ivory-200 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-ivory-400" />
          </div>
          <p className="text-ivory-600 mb-4">暂无预约记录</p>
          <Link to="/owner/companies" className="btn-primary">
            浏览装修公司
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const style = STATUS_STYLES[apt.status];
            return (
              <div key={apt.id} className="card-base flex overflow-hidden">
                <div className={`w-1.5 shrink-0 ${style.bar}`} />
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-wood-50 flex items-center justify-center text-wood-700 font-serif font-semibold text-sm">
                        {apt.companyName[0]}
                      </div>
                      <div>
                        <h3 className="font-medium text-carbon-800">{apt.companyName}</h3>
                        <span className={`badge ${style.badge}`}>{style.label}</span>
                      </div>
                    </div>
                    <span className="text-xs text-ivory-500 font-mono">{apt.id}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-ivory-600">
                      <MapPin className="w-4 h-4 text-ivory-400" />
                      <span className="truncate">{apt.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ivory-600">
                      <Phone className="w-4 h-4 text-ivory-400" />
                      <span>{apt.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ivory-600">
                      <Clock className="w-4 h-4 text-ivory-400" />
                      <span>{apt.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ivory-600">
                      <Calendar className="w-4 h-4 text-ivory-400" />
                      <span>{apt.contactName}</span>
                    </div>
                  </div>

                  {apt.remark && (
                    <p className="text-sm text-ivory-500 mb-4 bg-ivory-50 rounded-lg px-3 py-2">
                      {apt.remark}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {apt.status === 'pending' && (
                      <button className="btn-ghost text-terracotta-600 hover:bg-terracotta-50">
                        <X className="w-4 h-4" /> 取消预约
                      </button>
                    )}
                    {apt.status === 'accepted' && (
                      <>
                        <button className="btn-ghost text-haze-600 hover:bg-haze-50">
                          <Phone className="w-4 h-4" /> 联系公司
                        </button>
                        <button className="btn-ghost text-haze-600 hover:bg-haze-50">
                          <Navigation className="w-4 h-4" /> 导航到店
                        </button>
                      </>
                    )}
                    {apt.status === 'completed' && (
                      <>
                        <Link to="/owner/compare" className="btn-primary text-sm">
                          查看方案 <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link to="/owner/compare" className="btn-secondary text-sm">
                          去比价
                        </Link>
                      </>
                    )}
                    {apt.status === 'cancelled' && (
                      <button className="btn-ghost text-carbon-400 hover:bg-ivory-100">
                        删除记录
                      </button>
                    )}
                    <button className="btn-ghost ml-auto">
                      <MessageSquare className="w-4 h-4" /> 沟通
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
