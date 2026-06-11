import { useState } from 'react';
import {
  User,
  Shield,
  ClipboardList,
  Lock,
  CheckCircle2,
  Minus,
  Phone,
  Mail,
  Building2,
  Save,
  Copy,
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { showToast } from '@/components/ui/Toast';

type TabId = 'profile' | 'permissions' | 'audit' | 'security';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'profile', label: '角色资料', icon: User },
  { id: 'permissions', label: '权限边界', icon: Shield },
  { id: 'audit', label: '审计信息', icon: ClipboardList },
  { id: 'security', label: '安全设置', icon: Lock },
];

const roleBadges = [
  { label: '管理员', variant: 'warning' as const, active: true },
  { label: '商家', variant: 'success' as const, active: false },
  { label: '运营', variant: 'info' as const, active: false },
  { label: '骑手', variant: 'delay' as const, active: false },
];

const permissionModules = [
  { name: '订单', view: true, edit: true, delete: true, approve: true },
  { name: '骑手', view: true, edit: true, delete: true, approve: true },
  { name: '赔付', view: true, edit: true, delete: true, approve: true },
  { name: '运单', view: true, edit: true, delete: false, approve: true },
  { name: '定价', view: true, edit: true, delete: false, approve: false },
  { name: '热力图', view: true, edit: false, delete: false, approve: false },
  { name: 'API', view: true, edit: true, delete: false, approve: false },
  { name: '设置', view: true, edit: true, delete: false, approve: true },
];

const permissionHistory = [
  { id: 'ph1', operator: '超级管理员', time: '2024-06-10 14:23', change: '将「骑手」模块的删除权限开放给管理员角色' },
  { id: 'ph2', operator: '超级管理员', time: '2024-05-28 09:15', change: '收回「热力图」模块的编辑权限' },
  { id: 'ph3', operator: '系统自动', time: '2024-05-01 00:00', change: '季度权限审计：管理员角色权限无变更' },
];

const roleComparison = [
  { role: '管理员', perms: '全部模块 查看/编辑/删除/审批', color: 'text-amber-accent-400' },
  { role: '商家', perms: '订单/运单 查看/编辑，定价 查看', color: 'text-success-400' },
  { role: '运营', perms: '订单/骑手/赔付 查看/编辑，热力图 查看', color: 'text-info-400' },
  { role: '骑手', perms: '运单/订单 仅查看', color: 'text-warning-400' },
];

const operationLogs = [
  { id: 'ol1', time: '2024-06-12 09:32', operator: '张伟', type: '登录', target: '管理后台', ip: '192.168.1.101', result: '成功', sensitive: false },
  { id: 'ol2', time: '2024-06-12 10:15', operator: '张伟', type: '修改价格', target: '朝阳区配送费规则', ip: '192.168.1.101', result: '成功', sensitive: true },
  { id: 'ol3', time: '2024-06-11 16:45', operator: '张伟', type: '删除订单', target: 'DD202406110008', ip: '192.168.1.101', result: '成功', sensitive: true },
  { id: 'ol4', time: '2024-06-11 14:22', operator: '张伟', type: '审批赔付', target: 'CP202406110003', ip: '192.168.1.102', result: '已批准', sensitive: true },
  { id: 'ol5', time: '2024-06-10 11:30', operator: '张伟', type: '修改骑手', target: '骑手赵明信用分', ip: '192.168.1.101', result: '成功', sensitive: false },
  { id: 'ol6', time: '2024-06-10 09:05', operator: '张伟', type: '登录', target: '管理后台', ip: '10.0.0.55', result: '成功', sensitive: false },
  { id: 'ol7', time: '2024-06-09 17:50', operator: '张伟', type: '导出数据', target: '6月运单报表', ip: '192.168.1.101', result: '成功', sensitive: false },
  { id: 'ol8', time: '2024-06-09 08:12', operator: '张伟', type: '修改设置', target: '异常订单阈值 5→10分钟', ip: '10.0.0.55', result: '成功', sensitive: true },
];

const loginLogs = [
  { id: 'll1', time: '2024-06-12 09:32', ip: '192.168.1.101', device: 'Chrome / macOS', result: '成功' },
  { id: 'll2', time: '2024-06-10 09:05', ip: '10.0.0.55', device: 'Safari / iPhone', result: '成功' },
  { id: 'll3', time: '2024-06-08 22:18', ip: '203.45.67.89', device: 'Firefox / Windows', result: '失败（密码错误）' },
];

const deviceList = [
  { id: 'dev1', name: 'MacBook Pro', icon: Monitor, detail: 'Chrome · macOS · 当前设备', lastActive: '刚刚' },
  { id: 'dev2', name: 'iPhone 15', icon: Smartphone, detail: 'Safari · iOS 17', lastActive: '2小时前' },
  { id: 'dev3', name: 'iPad Air', icon: Tablet, detail: 'Safari · iPadOS 17', lastActive: '1天前' },
];

function ProfileTab() {
  const [name, setName] = useState('张伟');
  const [phone, setPhone] = useState('138****6789');
  const [email, setEmail] = useState('zhangwei@logistics.com');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-accent-400 to-amber-accent-600 shadow-glow-amber">
          <User className="h-10 w-10 text-space-blue-900" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-100">{name}</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-500/15 px-2.5 py-1 text-sm text-success-400 border border-success-500/30">
            <span className="h-2 w-2 rounded-full bg-success-400" />
            账号正常
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-gray-300">姓名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-accent-500/70"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-gray-300">手机号</span>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 py-2 pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:border-amber-accent-500/70"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-gray-300">邮箱</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 py-2 pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:border-amber-accent-500/70"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-gray-300">所属商户</span>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value="物流运营中心"
              readOnly
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 py-2 pl-9 pr-3 text-sm text-gray-100 focus:outline-none"
            />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-gray-300">角色徽章</span>
        <div className="flex flex-wrap gap-2">
          {roleBadges.map((badge) => (
            <StatusBadge
              key={badge.label}
              variant={badge.active ? badge.variant : 'default'}
              showDot={badge.active}
              pulse={badge.active}
            >
              {badge.label}
            </StatusBadge>
          ))}
        </div>
      </div>

      <button
        onClick={() => showToast('success', '角色资料已保存')}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-accent-500 px-5 py-2.5 text-sm font-medium text-space-blue-950 hover:bg-amber-accent-400 transition-colors"
      >
        <Save className="h-4 w-4" />
        保存资料
      </button>
    </div>
  );
}

function PermissionsTab() {
  const columns = ['模块', '查看', '编辑', '删除', '审批'] as const;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-space-blue-600">
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-gray-400 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((mod) => (
              <tr key={mod.name} className="border-b border-space-blue-600/50 hover:bg-space-blue-900/50 transition-colors">
                <td className="px-4 py-3 text-gray-100 font-medium">{mod.name}</td>
                <td className="px-4 py-3">
                  {mod.view ? (
                    <CheckCircle2 className="h-5 w-5 text-success-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {mod.edit ? (
                    <CheckCircle2 className="h-5 w-5 text-success-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {mod.delete ? (
                    <CheckCircle2 className="h-5 w-5 text-success-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </td>
                <td className="px-4 py-3">
                  {mod.approve ? (
                    <CheckCircle2 className="h-5 w-5 text-success-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">权限变更历史</h3>
        <div className="space-y-2">
          {permissionHistory.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-3">
              <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-accent-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200">{item.change}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.operator} · {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-space-blue-600 bg-space-blue-900/50 p-4">
        <h3 className="mb-3 text-base font-semibold text-gray-100">角色权限对比</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {roleComparison.map((item) => (
            <div key={item.role} className="rounded-lg border border-space-blue-600 bg-space-blue-800 p-3">
              <div className={cn('text-sm font-semibold', item.color)}>{item.role}</div>
              <div className="mt-1 text-xs text-gray-400">{item.perms}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditTab() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">操作日志</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-space-blue-600">
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">时间</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">操作人</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">操作类型</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">操作对象</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">IP</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {operationLogs.map((log) => (
                <tr
                  key={log.id}
                  className={cn(
                    'border-b border-space-blue-600/50 hover:bg-space-blue-900/50 transition-colors',
                    log.sensitive && 'border-l-2 border-l-danger-500 bg-danger-500/5'
                  )}
                >
                  <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{log.time}</td>
                  <td className="px-3 py-2.5 text-gray-200">{log.operator}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('inline-flex items-center gap-1', log.sensitive ? 'text-danger-400' : 'text-gray-200')}>
                      {log.sensitive && <AlertTriangle className="h-3.5 w-3.5" />}
                      {log.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{log.target}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{log.ip}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      variant={log.result === '成功' || log.result === '已批准' ? 'success' : 'danger'}
                      size="sm"
                      showDot={false}
                    >
                      {log.result}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">登录日志</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-space-blue-600">
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">时间</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">IP</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">设备</th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id} className="border-b border-space-blue-600/50 hover:bg-space-blue-900/50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{log.time}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{log.ip}</td>
                  <td className="px-3 py-2.5 text-gray-200">{log.device}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge
                      variant={log.result.includes('成功') ? 'success' : 'danger'}
                      size="sm"
                      showDot={false}
                    >
                      {log.result}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = 'sk-live-a8f3e2d1c9b7a6f5e4d3c2b1a0';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      showToast('success', 'API密钥已复制到剪贴板');
    });
  };

  const handleRevokeKey = () => {
    showToast('warning', 'API密钥撤销请求已提交，将在24小时后生效');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-100">修改密码</h3>
        <div className="max-w-md space-y-3">
          <label className="block space-y-2">
            <span className="text-sm text-gray-300">当前密码</span>
            <input
              type="password"
              placeholder="请输入当前密码"
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-accent-500/70"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-gray-300">新密码</span>
            <input
              type="password"
              placeholder="请输入新密码"
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-accent-500/70"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-gray-300">确认密码</span>
            <input
              type="password"
              placeholder="请再次输入新密码"
              className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-accent-500/70"
            />
          </label>
          <button
            onClick={() => showToast('success', '密码修改成功')}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-accent-500 px-5 py-2.5 text-sm font-medium text-space-blue-950 hover:bg-amber-accent-400 transition-colors"
          >
            <Lock className="h-4 w-4" />
            更新密码
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">双因素认证</h3>
        <div className="flex items-center justify-between rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4">
          <div>
            <p className="text-sm text-gray-200">启用双因素认证 (2FA)</p>
            <p className="mt-1 text-xs text-gray-500">登录时需要输入手机验证码</p>
          </div>
          <button
            onClick={() => {
              setTwoFactor(!twoFactor);
              showToast('info', twoFactor ? '双因素认证已关闭' : '双因素认证已开启');
            }}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors',
              twoFactor ? 'bg-success-500/80' : 'bg-space-blue-600'
            )}
          >
            <span
              className={cn(
                'h-6 w-6 rounded-full bg-white transition-transform',
                twoFactor ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">API 密钥管理</h3>
        <div className="rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">生产环境密钥</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="rounded-md border border-space-blue-600 px-2.5 py-1 text-xs text-gray-300 hover:bg-space-blue-800 transition-colors"
              >
                {showApiKey ? '隐藏' : '显示'}
              </button>
              <button
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1 rounded-md border border-space-blue-600 px-2.5 py-1 text-xs text-gray-300 hover:bg-space-blue-800 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
              <button
                onClick={handleRevokeKey}
                className="inline-flex items-center gap-1 rounded-md border border-danger-500/50 px-2.5 py-1 text-xs text-danger-400 hover:bg-danger-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                撤销
              </button>
            </div>
          </div>
          <div className="rounded-md bg-space-blue-800 px-3 py-2 font-mono text-xs text-gray-400 break-all">
            {showApiKey ? apiKey : 'sk-live-••••••••••••••••••••••••'}
          </div>
          <p className="text-xs text-gray-500">创建于 2024-03-15 · 上次使用 2024-06-12</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">登录设备</h3>
        <div className="space-y-2">
          {deviceList.map((device) => {
            const Icon = device.icon;
            return (
              <div key={device.id} className="flex items-center gap-4 rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-blue-800">
                  <Icon className="h-5 w-5 text-amber-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{device.lastActive}</p>
                  {device.id === 'dev1' && (
                    <span className="text-xs text-success-400">当前设备</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'permissions':
        return <PermissionsTab />;
      case 'audit':
        return <AuditTab />;
      case 'security':
        return <SecurityTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">个人设置</h1>
        <p className="mt-1 text-sm text-gray-400">管理角色资料、权限、审计日志和安全策略。</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-space-blue-600 bg-space-blue-800 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-amber-accent-500 text-space-blue-950'
                  : 'text-gray-400 hover:bg-space-blue-900/70 hover:text-gray-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-space-blue-600 bg-space-blue-800 p-5 shadow-card">
        {renderContent()}
      </section>
    </div>
  );
}
