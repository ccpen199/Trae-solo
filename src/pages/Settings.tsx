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
  ChevronDown,
  AlertTriangle,
  History,
  Activity,
  Database,
  RefreshCw,
  Globe,
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

interface MerchantScope {
  id: string;
  label: string;
  count: number;
}

const merchantScopes: MerchantScope[] = [
  { id: 'scope-all', label: '全部商户', count: 25 },
  { id: 'scope-east', label: '限华东区', count: 8 },
  { id: 'scope-north', label: '限华北区', count: 6 },
  { id: 'scope-south', label: '限华南区', count: 7 },
];

interface PermissionScope {
  key: string;
  label: string;
  color: string;
}

const permissionScopes: PermissionScope[] = [
  { key: 'orders:read', label: 'orders:read', color: 'border-info-500/50 text-info-400 bg-info-500/10' },
  { key: 'orders:write', label: 'orders:write', color: 'border-warning-500/50 text-warning-400 bg-warning-500/10' },
  { key: 'riders:read', label: 'riders:read', color: 'border-success-500/50 text-success-400 bg-success-500/10' },
  { key: 'pricing:read', label: 'pricing:read', color: 'border-amber-accent-500/50 text-amber-accent-400 bg-amber-accent-500/10' },
  { key: 'waybills:read', label: 'waybills:read', color: 'border-danger-500/50 text-danger-400 bg-danger-500/10' },
];

interface ReviewRecord {
  id: string;
  time: string;
  reviewer: string;
  reviewerTitle: string;
  result: '通过' | '调整权限' | '拒绝';
  remark: string;
}

const reviewRecords: ReviewRecord[] = [
  { id: 'rr1', time: '2024-06-10 14:30', reviewer: '张经理', reviewerTitle: '运营总监', result: '通过', remark: '配额正常，无异常调用' },
  { id: 'rr2', time: '2024-05-25 09:15', reviewer: '李主管', reviewerTitle: '风控', result: '通过', remark: '检查异常调用IP，无风险' },
  { id: 'rr3', time: '2024-04-20 16:45', reviewer: '王总', reviewerTitle: 'CTO', result: '调整权限', remark: '移除waybills:write权限' },
];

interface AuditLogRecord {
  id: string;
  time: string;
  endpoint: string;
  ip: string;
  result: '成功' | '失败' | '限流';
  responseTime: number;
}

const auditLogRecords: AuditLogRecord[] = [
  { id: 'al1', time: '2024-06-12 15:42:18', endpoint: 'GET /api/v1/orders', ip: '192.168.1.101', result: '成功', responseTime: 45 },
  { id: 'al2', time: '2024-06-12 15:41:55', endpoint: 'POST /api/v1/riders/location', ip: '192.168.1.102', result: '成功', responseTime: 32 },
  { id: 'al3', time: '2024-06-12 15:41:30', endpoint: 'GET /api/v1/pricing/rules', ip: '10.0.0.88', result: '成功', responseTime: 68 },
  { id: 'al4', time: '2024-06-12 15:40:12', endpoint: 'GET /api/v1/waybills/DD20240612008', ip: '192.168.1.101', result: '成功', responseTime: 52 },
  { id: 'al5', time: '2024-06-12 15:39:45', endpoint: 'POST /api/v1/orders/create', ip: '192.168.1.105', result: '成功', responseTime: 128 },
  { id: 'al6', time: '2024-06-12 15:38:20', endpoint: 'GET /api/v1/orders?page=2', ip: '192.168.1.101', result: '成功', responseTime: 41 },
  { id: 'al7', time: '2024-06-12 15:37:58', endpoint: 'POST /api/v1/orders/batch', ip: '10.0.0.92', result: '限流', responseTime: 8 },
  { id: 'al8', time: '2024-06-12 15:36:33', endpoint: 'GET /api/v1/riders/status', ip: '192.168.1.103', result: '成功', responseTime: 36 },
  { id: 'al9', time: '2024-06-12 15:35:10', endpoint: 'GET /api/v1/waybills?status=delivering', ip: '192.168.1.101', result: '失败', responseTime: 185 },
  { id: 'al10', time: '2024-06-12 15:34:42', endpoint: 'POST /api/v1/pricing/calculate', ip: '10.0.0.77', result: '成功', responseTime: 95 },
];

interface ErpSystem {
  id: string;
  name: string;
}

const erpSystems: ErpSystem[] = [
  { id: 'dingjie', name: '鼎捷ERP' },
  { id: 'yonyou', name: '用友U8' },
  { id: 'webhook', name: '自定义Webhook' },
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
  const [merchantScopeOpen, setMerchantScopeOpen] = useState(false);
  const [selectedMerchantScope, setSelectedMerchantScope] = useState<MerchantScope>(merchantScopes[0]);
  const [reviewRecordsOpen, setReviewRecordsOpen] = useState(true);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);
  const [selectedErpSystem, setSelectedErpSystem] = useState<ErpSystem>(erpSystems[0]);
  const [erpConnected, setErpConnected] = useState(true);
  const apiKey = 'sk-live-a8f3e2d1c9b7a6f5e4d3c2b1a0';
  const dailyQuota = 100000;
  const dailyUsed = 68452;
  const quotaPercent = Math.round((dailyUsed / dailyQuota) * 100);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      showToast('success', 'API密钥已复制到剪贴板');
    });
  };

  const handleRevokeKey = () => {
    showToast('warning', 'API密钥撤销请求已提交，将在24小时后生效');
  };

  const handleMerchantScopeSelect = (scope: MerchantScope) => {
    setSelectedMerchantScope(scope);
    setMerchantScopeOpen(false);
    showToast('info', `接入商户范围已切换为「${scope.label}」`);
  };

  const handleErpResync = () => {
    showToast('info', 'ERP同步任务已启动，请稍候查看结果');
  };

  const getReviewResultVariant = (result: ReviewRecord['result']): 'success' | 'warning' | 'danger' => {
    switch (result) {
      case '通过':
        return 'success';
      case '调整权限':
        return 'warning';
      case '拒绝':
        return 'danger';
    }
  };

  const getAuditResultVariant = (result: AuditLogRecord['result']): 'success' | 'warning' | 'danger' => {
    switch (result) {
      case '成功':
        return 'success';
      case '限流':
        return 'warning';
      case '失败':
        return 'danger';
    }
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
        <div className="rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4 space-y-4">
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

          <div className="pt-2 border-t border-space-blue-600 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs text-gray-500">接入商户范围</span>
                <div className="relative">
                  <button
                    onClick={() => setMerchantScopeOpen(!merchantScopeOpen)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-accent-500/40 bg-amber-accent-500/10 px-2.5 py-1 text-xs text-amber-accent-400 hover:bg-amber-accent-500/20 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    {selectedMerchantScope.label}({selectedMerchantScope.count}家)
                    <ChevronDown className={cn('h-3 w-3 transition-transform', merchantScopeOpen && 'rotate-180')} />
                  </button>
                  {merchantScopeOpen && (
                    <div className="absolute top-full left-0 mt-1 z-10 w-40 rounded-md border border-space-blue-600 bg-space-blue-800 py-1 shadow-card animate-fade-in">
                      {merchantScopes.map((scope) => (
                        <button
                          key={scope.id}
                          onClick={() => handleMerchantScopeSelect(scope)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-space-blue-700 transition-colors',
                            selectedMerchantScope.id === scope.id ? 'text-amber-accent-400' : 'text-gray-300'
                          )}
                        >
                          <span>{scope.label}</span>
                          <span className="text-gray-500">{scope.count}家</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[280px]">
                <span className="text-xs text-gray-500">权限范围标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {permissionScopes.map((perm) => (
                    <span
                      key={perm.key}
                      className={cn(
                        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono border',
                        perm.color
                      )}
                    >
                      {perm.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">每日调用配额</span>
                <span className="text-xs text-gray-400 font-mono">
                  {dailyUsed.toLocaleString()} / {dailyQuota.toLocaleString()}次/天
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-space-blue-700 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    quotaPercent >= 90
                      ? 'bg-danger-500'
                      : quotaPercent >= 70
                      ? 'bg-warning-500'
                      : 'bg-gradient-to-r from-amber-accent-500 to-amber-accent-400'
                  )}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">已使用 {quotaPercent}%</span>
                <span className="text-[11px] text-gray-500">剩余 {(dailyQuota - dailyUsed).toLocaleString()}次</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setReviewRecordsOpen(!reviewRecordsOpen)}
                className="flex w-full items-center justify-between rounded-md border border-space-blue-600 bg-space-blue-800/50 px-3 py-2 hover:bg-space-blue-800 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <History className="h-3.5 w-3.5 text-amber-accent-400" />
                  <span>复核记录</span>
                  <span className="text-gray-500">({reviewRecords.length}条)</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', reviewRecordsOpen && 'rotate-180')} />
              </button>
              {reviewRecordsOpen && (
                <div className="overflow-hidden rounded-md border border-space-blue-600 bg-space-blue-800/30 animate-fade-in">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-space-blue-600 bg-space-blue-800/50">
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">时间</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">复核人</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">结果</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRecords.map((record) => (
                        <tr key={record.id} className="border-b border-space-blue-600/50 last:border-0 hover:bg-space-blue-800/30 transition-colors">
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap font-mono">{record.time}</td>
                          <td className="px-3 py-2 text-gray-200 whitespace-nowrap">
                            {record.reviewer}
                            <span className="text-gray-500 ml-1">({record.reviewerTitle})</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <StatusBadge variant={getReviewResultVariant(record.result)} size="sm" showDot={false}>
                              {record.result}
                            </StatusBadge>
                          </td>
                          <td className="px-3 py-2 text-gray-400">{record.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setAuditLogsOpen(!auditLogsOpen)}
                className="flex w-full items-center justify-between rounded-md border border-space-blue-600 bg-space-blue-800/50 px-3 py-2 hover:bg-space-blue-800 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Activity className="h-3.5 w-3.5 text-info-400" />
                  <span>查看调用审计</span>
                  <span className="text-gray-500">(最近10条)</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', auditLogsOpen && 'rotate-180')} />
              </button>
              {auditLogsOpen && (
                <div className="overflow-x-auto overflow-hidden rounded-md border border-space-blue-600 bg-space-blue-800/30 animate-fade-in">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-space-blue-600 bg-space-blue-800/50">
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">时间</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">接口</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">IP地址</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">调用结果</th>
                        <th className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">响应时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogRecords.map((log) => (
                        <tr key={log.id} className="border-b border-space-blue-600/50 last:border-0 hover:bg-space-blue-800/30 transition-colors">
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap font-mono">{log.time}</td>
                          <td className="px-3 py-2 text-gray-200 whitespace-nowrap font-mono">{log.endpoint}</td>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap font-mono">{log.ip}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <StatusBadge variant={getAuditResultVariant(log.result)} size="sm" showDot={false}>
                              {log.result}
                            </StatusBadge>
                          </td>
                          <td className={cn(
                            'px-3 py-2 whitespace-nowrap font-mono',
                            log.responseTime >= 150 ? 'text-danger-400' : log.responseTime >= 100 ? 'text-warning-400' : 'text-success-400'
                          )}>
                            {log.responseTime}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-100">ERP对接状态</h3>
        <div className="rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-space-blue-800">
                <Database className="h-5 w-5 text-amber-accent-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedErpSystem.id}
                    onChange={(e) => {
                      const system = erpSystems.find((s) => s.id === e.target.value);
                      if (system) {
                        setSelectedErpSystem(system);
                        showToast('info', `已切换对接系统为「${system.name}」`);
                      }
                    }}
                    className="rounded-md border border-space-blue-600 bg-space-blue-800 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/70"
                  >
                    {erpSystems.map((sys) => (
                      <option key={sys.id} value={sys.id}>{sys.name}</option>
                    ))}
                  </select>
                  <StatusBadge variant={erpConnected ? 'success' : 'danger'} size="sm" showDot pulse={erpConnected}>
                    {erpConnected ? '已连接' : '连接异常'}
                  </StatusBadge>
                </div>
                <p className="text-xs text-gray-500">
                  最近同步：<span className="text-gray-400">2分钟前</span> · 同步订单 <span className="text-amber-accent-400 font-mono">156</span> 笔
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setErpConnected(!erpConnected);
                  showToast('info', erpConnected ? '已断开ERP连接' : 'ERP已重新连接');
                }}
                className="rounded-md border border-space-blue-600 px-2.5 py-1 text-xs text-gray-300 hover:bg-space-blue-800 transition-colors"
              >
                {erpConnected ? '断开' : '连接'}
              </button>
              <button
                onClick={handleErpResync}
                className="inline-flex items-center gap-1 rounded-md border border-amber-accent-500/40 bg-amber-accent-500/10 px-2.5 py-1 text-xs text-amber-accent-400 hover:bg-amber-accent-500/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重新同步
              </button>
            </div>
          </div>
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
