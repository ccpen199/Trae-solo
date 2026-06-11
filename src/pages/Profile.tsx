import { Briefcase, CheckCircle2, Clock, Mail, Shield, Star, UserRound } from 'lucide-react';
import { useAppStore } from '@/store';

const profileStats = [
  { label: '管理岗位', value: 12, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
  { label: '待办事项', value: 4, icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: '信用评分', value: 95, icon: Star, color: 'bg-emerald-50 text-emerald-600' },
  { label: '权限角色', value: '管理员', icon: Shield, color: 'bg-purple-50 text-purple-600' },
];

const auditItems = [
  '发布岗位与人才匹配',
  '面试中心群面协作',
  '考勤结算复核',
  '系统租户与权限维护',
];

export default function Profile() {
  const { currentUser } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="card-base p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-bold">
            {currentUser.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-gray-800">个人中心</h2>
            <p className="text-sm text-gray-500 mt-1">{currentUser.name} · {currentUser.department}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-info flex items-center gap-1"><UserRound size={12} />平台管理员</span>
              <span className="badge-success flex items-center gap-1"><CheckCircle2 size={12} />账号已启用</span>
              <span className="badge-warning flex items-center gap-1"><Mail size={12} />limingyuan@campus.local</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {profileStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${stat.color}`}><Icon size={18} /></div>
                <div>
                  <p className="text-xl font-bold font-heading font-mono">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base p-5">
        <h3 className="font-heading font-semibold text-gray-800 mb-4">我的工作范围</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {auditItems.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
