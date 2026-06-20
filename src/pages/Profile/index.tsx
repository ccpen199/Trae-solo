import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Home,
  Phone,
  Mail,
  IdCard,
  Building2,
  Calendar,
  Bell,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Edit3,
  LogOut,
  FileText,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/utils/format';

const menuGroups = [
  {
    title: '账户信息',
    items: [
      { key: 'basic', label: '基本资料', icon: User },
      { key: 'house', label: '我的房屋', icon: Home },
      { key: 'family', label: '家庭成员', icon: Building2 },
    ],
  },
  {
    title: '消息通知',
    items: [
      { key: 'notifications', label: '消息通知', icon: Bell },
      { key: 'bills', label: '账单提醒', icon: FileText },
    ],
  },
  {
    title: '安全设置',
    items: [
      { key: 'password', label: '修改密码', icon: Lock },
      { key: 'privacy', label: '隐私设置', icon: Eye },
    ],
  },
];

export default function ProfilePage() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [showPhone, setShowPhone] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="个人中心" subtitle="管理您的账户信息和偏好设置" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
                <User size={36} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                <DesensitizeText value={user.realName} type="name" hasPermission={true} />
              </h3>
              <span className="text-neutral-500 text-sm">
                {user.role === 'RESIDENT' ? '业主' : user.role === 'PROPERTY_STAFF' ? '物业管家' : '管理员'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-neutral-400">
                <Phone size={16} />
                <span className="flex-1">
                  <DesensitizeText value={user.phone} type="phone" hasPermission={showPhone} />
                </span>
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  className="text-neutral-500 hover:text-primary-400 transition-colors"
                >
                  {showPhone ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {user.email && (
                <div className="flex items-center gap-3 text-neutral-400">
                  <Mail size={16} />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-neutral-400">
                <Calendar size={16} />
                <span>注册于 {formatDate(user.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 py-2.5 rounded-lg border border-red-500/30 text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              退出登录
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-medium">{group.title}</h3>
              </div>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${
                        isActive ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                        <Icon size={20} className="text-primary-400" />
                      </div>
                      <span className="text-white flex-1 text-left">{item.label}</span>
                      <ChevronRight size={18} className="text-neutral-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
                <Settings size={20} className="text-accent-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">数据隐私说明</h3>
                <p className="text-neutral-500 text-sm">您的隐私数据受保护，仅授权人员可查看</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm text-neutral-400">
              <p>• 您的手机号、身份证号等敏感信息默认脱敏展示</p>
              <p>• 物业工作人员仅能查看与工作相关的必要信息</p>
              <p>• 业委会可监督数据使用情况</p>
              <p>• 您可以随时申请删除您的个人数据</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
