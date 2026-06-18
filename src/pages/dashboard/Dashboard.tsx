import { Users, Activity, MapPin, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

const quickLinks = [
  { to: '/sanxiaxiang/teams', label: '三下乡团队', icon: Users, desc: '查看与管理实践团队' },
  { to: '/activities', label: '实践活动', icon: Activity, desc: '浏览与报名实践活动' },
  { to: '/bases', label: '实践基地', icon: MapPin, desc: '查看实践基地与岗位' },
  { to: '/credits/apply', label: '学分认定', icon: BookOpen, desc: '申请学分认定' },
];

export default function Dashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          欢迎回来{user?.name ? `，${user.name}` : ''}
        </h1>
        <p className="text-surface-500 mt-1">高校社会实践协同管理平台</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card card-hover p-5 flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <link.icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">{link.label}</h3>
              <p className="text-xs text-surface-500 mt-0.5">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
