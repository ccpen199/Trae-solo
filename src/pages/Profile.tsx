import { Link } from 'react-router-dom';
import {
  Bell,
  CloudSun,
  Database,
  Heart,
  Key,
  MapPin,
  Settings,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useWeatherStore } from '../stores/weatherStore';

export default function Profile() {
  const { currentCity, favoriteCities } = useWeatherStore();

  const profileStats = [
    { label: '当前城市', value: currentCity?.name || '北京', icon: MapPin },
    { label: '关注城市', value: favoriteCities.length || 3, icon: Heart },
    { label: '订阅预警', value: '强对流 · 暴雨', icon: Bell },
    { label: '接口密钥', value: '已启用', icon: Key },
  ];

  const serviceItems = [
    { title: '我的关注城市', desc: '管理常用城市与天气卡片', path: '/cities', icon: CloudSun },
    { title: '预警订阅', desc: '查看灾害预警、阈值与通知记录', path: '/alerts', icon: Bell },
    { title: '数据权限', desc: '查看 API 密钥、调用额度与审计记录', path: '/admin/api', icon: ShieldCheck },
    { title: '管理后台', desc: '进入数据源、质量规则和接口管理', path: '/admin', icon: Database },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <UserCircle className="w-9 h-9 text-blue-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">我的气象工作台</h1>
            <p className="text-slate-400">个人中心 · 城市关注 · 预警订阅 · 后台管理入口</p>
          </div>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
        >
          <Settings className="w-4 h-4" />
          管理后台
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {profileStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm">{stat.label}</span>
                <Icon className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="text-white text-2xl font-semibold">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {serviceItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.path}
              className="glass-card p-5 flex items-start gap-4 hover:border-blue-400/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-800/70 flex items-center justify-center border border-slate-700/60">
                <Icon className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h2 className="text-white font-semibold mb-1">{item.title}</h2>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
