import {
  BarChart3, BookOpen, CheckCircle2, Database, FileCheck2, Landmark,
  MapPin, Network, ShieldCheck, Sparkles, Users,
} from 'lucide-react';

const metrics = [
  { label: '当日办件', value: '18,642', desc: '四大域实时汇总', icon: BarChart3 },
  { label: '免申即享匹配', value: '25,214', desc: '本月自动匹配', icon: Sparkles },
  { label: '三网核验成功率', value: '99.2%', desc: '医保/税务/市监', icon: Network },
  { label: '个人信息加密覆盖', value: '100%', desc: 'SM4 字段级加密', icon: ShieldCheck },
];

const dataSources = [
  { name: '省医保局', status: '已连接', latency: '38ms', scope: '参保连续性、医保缴费状态' },
  { name: '省税务局', status: '已连接', latency: '42ms', scope: '失业保险缴费额、纳税信用' },
  { name: '市场监管局', status: '已连接', latency: '51ms', scope: '企业登记、经营异常名录' },
];

const queues = [
  { name: '稳岗返还自动测算', count: 386, status: '规则运行中' },
  { name: '12333 智能问答知识库', count: 1280, status: '待复核 12 条' },
  { name: 'VR 网点排队数据', count: 62, status: '5 分钟内已同步' },
  { name: '个人中心办件留痕', count: 9412, status: '可追溯' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-gov">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">后台管理驾驶舱</h1>
            <p className="text-sm text-gray-500">省级三网数据接入、政策引擎、知识库与网点服务统一监管</p>
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-medium inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          后端 API 与 SQLite 正常
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <Icon className="w-6 h-6 text-gov-500 mb-4" />
              <div className="text-2xl font-bold text-gray-800">{item.value}</div>
              <div className="text-sm font-medium text-gray-600 mt-1">{item.label}</div>
              <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-gov-500" />
            <h2 className="font-bold text-gray-800">三网数据接入状态</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dataSources.map((item) => (
              <div key={item.name} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{item.scope}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-emerald-600 text-sm font-semibold">{item.status}</div>
                  <div className="text-xs text-gray-400 mt-1">平均延迟 {item.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-gov-500" />
            <h2 className="font-bold text-gray-800">运营待办</h2>
          </div>
          <div className="p-5 space-y-3">
            {queues.map((item) => (
              <div key={item.name} className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                  <span className="font-bold text-gov-600">{item.count}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <BookOpen className="w-6 h-6 text-gold-500 mb-3" />
          <h3 className="font-bold text-gray-800">12333 知识库</h3>
          <p className="text-sm text-gray-500 mt-2">按政策分类维护问答、方言语音识别意图与命中率。</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <MapPin className="w-6 h-6 text-gov-500 mb-3" />
          <h3 className="font-bold text-gray-800">网点 VR 管理</h3>
          <p className="text-sm text-gray-500 mt-2">同步排队人数、VR 漫游状态、预约办理容量。</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <Users className="w-6 h-6 text-emerald-500 mb-3" />
          <h3 className="font-bold text-gray-800">个人中心监管</h3>
          <p className="text-sm text-gray-500 mt-2">办件流程、电子证照、登录设备与实名认证等级可复查。</p>
        </div>
      </div>
    </div>
  );
}
