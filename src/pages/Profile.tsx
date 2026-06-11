import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, ChevronRight, Bell, Lock, Smartphone,
  CheckCircle2, CreditCard, LogOut, Clock, Eye,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useApplicationStore } from '@/stores/applicationStore';
import { certificates, mockUser } from '@/mock/data';
import ProfileWorkbench from '@/pages/ProfileWorkbench';

const tabs = ['市民工作台', '我的办事', '我的证照', '消息通知', '账号安全'];

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: '审核中', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
};

const stepStatusIcons = {
  completed: CheckCircle2,
  active: Clock,
  pending: null,
  rejected: null,
};

const mockNotifications = [
  { id: 'n1', title: '您的身份证补换领申请正在审核中', type: 'progress', read: false, time: '10分钟前', icon: Clock },
  { id: 'n2', title: '营业执照已审批通过，请及时领取', type: 'result', read: false, time: '2小时前', icon: CheckCircle2 },
  { id: 'n3', title: '社保系统将于6月15日升级维护', type: 'system', read: true, time: '1天前', icon: Bell },
  { id: 'n4', title: '您的驾驶证将于8月10日到期，请及时换证', type: 'reminder', read: true, time: '3天前', icon: Eye },
  { id: 'n5', title: '公积金提取申请已提交成功', type: 'progress', read: true, time: '5天前', icon: Clock },
];

function MyApplications() {
  const [subTab, setSubTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const applications = useApplicationStore((s) => s.applications);

  const filtered = applications.filter((app) => {
    if (subTab === 'active') return ['submitted', 'under_review', 'approved'].includes(app.status);
    if (subTab === 'completed') return app.status === 'completed';
    return app.status === 'rejected';
  });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['active', 'completed', 'cancelled'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === key
                ? 'bg-gov-blue text-white'
                : 'bg-gov-bg text-gov-text-secondary hover:bg-gray-200'
            }`}
          >
            {key === 'active' ? '办理中' : key === 'completed' ? '已完成' : '已取消'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((app) => {
          const status = statusMap[app.status];
          const progress = Math.round((app.currentStep / app.steps.length) * 100);
          const isExpanded = expandedApp === app.id;

          return (
            <div key={app.id}>
              <Link to={`/services/${app.serviceId}`} className="block">
                <div className="gov-card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gov-text">{app.serviceName}</h4>
                    <span className={`gov-badge ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gov-text-secondary mb-2">
                    <span>当前步骤: {app.steps[app.currentStep - 1]?.name || '已完成'}</span>
                    <span>·</span>
                    <span>{app.updatedAt}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gov-blue rounded-full h-1.5 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); setExpandedApp(isExpanded ? null : app.id); }}
                className="w-full text-xs text-gov-blue font-medium py-1.5 hover:underline"
              >
                {isExpanded ? '收起详细流程' : '查看全生命周期流程'}
              </button>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gov-bg rounded-lg p-4 mt-1 space-y-0">
                    {app.steps.map((step, i) => {
                      const StepIcon = stepStatusIcons[step.status];
                      return (
                        <div key={i} className="flex items-start gap-3 relative">
                          {i < app.steps.length - 1 && (
                            <div className={`absolute left-[9px] top-5 w-0.5 h-full ${
                              step.status === 'completed' ? 'bg-emerald-300' : 'bg-gov-border'
                            }`} />
                          )}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            step.status === 'completed' ? 'bg-emerald-500' :
                            step.status === 'active' ? 'bg-gov-blue' : 'bg-gray-200'
                          }`}>
                            {StepIcon ? <StepIcon className="w-3 h-3 text-white" /> : (
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className={`text-sm ${
                              step.status === 'active' ? 'font-semibold text-gov-blue' :
                              step.status === 'completed' ? 'text-gov-text' : 'text-gov-text-secondary'
                            }`}>
                              {step.name}
                            </p>
                            {step.completedAt && (
                              <p className="text-xs text-gov-text-secondary">{step.completedAt}</p>
                            )}
                            {step.assignee && (
                              <p className="text-xs text-gov-text-secondary">办理: {step.assignee}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-gov-text-secondary">暂无相关记录</p>
        )}
      </div>
    </div>
  );
}

function MyCertificates() {
  const certStatusConfig = {
    valid: { label: '有效', color: 'text-emerald-600' },
    expiring: { label: '即将过期', color: 'text-amber-600' },
    expired: { label: '已过期', color: 'text-red-600' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gov-text-secondary">共 {certificates.length} 个证照</span>
        <Link to="/certificates" className="text-sm text-gov-blue font-medium flex items-center gap-1">
          查看全部 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {certificates.slice(0, 5).map((cert) => {
          const status = certStatusConfig[cert.status];
          return (
            <div key={cert.id} className="flex items-center justify-between p-3 bg-gov-bg rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gov-blue" />
                <div>
                  <p className="text-sm font-medium text-gov-text">{cert.typeName}</p>
                  <p className="text-xs text-gov-text-secondary">{cert.issuingAuthority}</p>
                </div>
              </div>
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Notifications() {
  return (
    <div className="space-y-3">
      {mockNotifications.map((n) => {
        const Icon = n.icon;
        return (
          <div key={n.id} className={`flex gap-3 p-4 rounded-lg ${n.read ? 'bg-gov-bg' : 'bg-blue-50'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.read ? 'bg-gray-100' : 'bg-gov-blue'
              }`}
            >
              <Icon className={`w-4 h-4 ${n.read ? 'text-gov-text-secondary' : 'text-white'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.read ? 'text-gov-text-secondary' : 'text-gov-text font-medium'}`}>
                {n.title}
              </p>
              <p className="text-xs text-gov-text-secondary mt-1">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-gov-blue shrink-0 mt-1.5" />}
          </div>
        );
      })}
    </div>
  );
}

function AccountSecurity() {
  return (
    <div className="space-y-4">
      <div className="gov-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-gov-text">实名认证</p>
              <p className="text-xs text-emerald-600">已认证</p>
            </div>
          </div>
          <span className="gov-badge bg-emerald-100 text-emerald-700">已认证</span>
        </div>
      </div>

      <div className="gov-card p-4">
        <h4 className="text-sm font-semibold text-gov-text mb-3">登录设备</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gov-blue" />
              <div>
                <p className="text-sm text-gov-text">iPhone 15 Pro</p>
                <p className="text-xs text-gov-text-secondary">当前设备 · 10.0.1.105</p>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-medium">当前</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gov-text-secondary" />
              <div>
                <p className="text-sm text-gov-text">iPad Air</p>
                <p className="text-xs text-gov-text-secondary">3天前 · 10.0.2.88</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gov-card p-4">
        <h4 className="text-sm font-semibold text-gov-text mb-3">安全设置</h4>
        <button className="w-full flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gov-blue" />
            <span className="text-sm text-gov-text">修改密码</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gov-text-secondary" />
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState(0);
  const user = useAuthStore((s) => s.user) || mockUser;
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6"
    >
      {activeTab !== 0 && (
        <div className="gov-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center text-white text-2xl font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gov-text">{user.name}</h2>
                {user.verified && (
                  <span className="inline-flex items-center gap-1 gov-badge bg-emerald-100 text-emerald-700">
                    <Shield className="w-3 h-3" />
                    实名认证
                  </span>
                )}
              </div>
              <p className="text-sm text-gov-text-secondary mt-0.5">{user.phone}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gov-text-secondary hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gov-border overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap px-3 ${
              activeTab === i
                ? 'bg-gov-blue text-white'
                : 'text-gov-text-secondary hover:bg-gov-bg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <ProfileWorkbench />}

      {activeTab !== 0 && (
        <div className="gov-card p-6">
          {activeTab === 1 && <MyApplications />}
          {activeTab === 2 && <MyCertificates />}
          {activeTab === 3 && <Notifications />}
          {activeTab === 4 && <AccountSecurity />}
        </div>
      )}
    </motion.div>
  );
}
