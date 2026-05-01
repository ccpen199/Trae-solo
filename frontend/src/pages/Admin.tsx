import { useState } from 'react';
import {
  Settings,
  Users,
  AlertTriangle,
  FileText,
  Shield,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn, formatDate, formatNumber, getStatusColor, getStatusLabel } from '@/lib/utils';

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  isAcknowledged: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'USER_UNSUBSCRIBE',
      severity: 'MEDIUM',
      message: '用户 user1@example.com 已退订',
      isAcknowledged: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'BOUNCE_HARD',
      severity: 'HIGH',
      message: '邮件退信 [hard]: user2@example.com',
      isAcknowledged: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'LOW_DELIVERY_RATE',
      severity: 'WARNING',
      message: '活动 "春季促销" 送达率低于80%',
      isAcknowledged: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);
  
  const [auditLogs] = useState<AuditLog[]>([
    {
      id: '1',
      action: 'LOGIN',
      entityType: 'User',
      entityId: 'u1',
      userId: 'u1',
      userEmail: 'admin@example.com',
      ipAddress: '192.168.1.100',
      details: '用户登录成功',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      action: 'CREATE_CAMPAIGN',
      entityType: 'Campaign',
      entityId: 'c1',
      userId: 'u2',
      userEmail: 'marketing@example.com',
      ipAddress: '192.168.1.101',
      details: '创建活动: 春季促销活动',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '3',
      action: 'UPDATE_TEMPLATE',
      entityType: 'Template',
      entityId: 't1',
      userId: 'u3',
      userEmail: 'copywriter@example.com',
      ipAddress: '192.168.1.102',
      details: '更新模板: 促销邮件模板',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
  
  const tabs = [
    { id: 'overview', label: '系统概览', icon: BarChart3 },
    { id: 'alerts', label: '告警中心', icon: AlertTriangle },
    { id: 'audit', label: '审计日志', icon: FileText },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];
  
  const reputationData = {
    domain: 'example.com',
    senderScore: 85,
    reputation: 'good',
    bounceRate: 2.5,
    complaintRate: 0.1,
    spf: 'pass',
    dkim: 'pass',
    dmarc: 'pass',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">系统管理</h1>
          <p className="text-neutral-500 mt-1">系统配置、告警监控和审计日志</p>
        </div>
      </div>
      
      <div className="flex gap-2 border-b border-neutral-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'text-primary-600 border-primary-600'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">发件人分数</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {reputationData.senderScore}/100
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    reputationData.senderScore >= 80 ? 'bg-success-100' :
                    reputationData.senderScore >= 60 ? 'bg-warning-100' :
                    'bg-danger-100'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      reputationData.senderScore >= 80 ? 'text-success-600' :
                      reputationData.senderScore >= 60 ? 'text-warning-600' :
                      'text-danger-600'
                    }`} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">退信率</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {formatPercentage(reputationData.bounceRate)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">投诉率</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {formatPercentage(reputationData.complaintRate)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">未处理告警</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {alerts.filter(a => !a.isAcknowledged).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-danger-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">邮件认证状态</h3>
              <p className="text-sm text-neutral-500">SPF、DKIM、DMARC 配置检查</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'SPF', status: reputationData.spf, description: '发件人策略框架' },
                  { name: 'DKIM', status: reputationData.dkim, description: '域名密钥识别邮件' },
                  { name: 'DMARC', status: reputationData.dmarc, description: '基于域的消息认证' },
                ].map((item) => (
                  <div key={item.name} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-900">{item.name}</span>
                      <span className={cn(
                        'badge',
                        item.status === 'pass' ? 'badge-success' : 'badge-danger'
                      )}>
                        {item.status === 'pass' ? '通过' : '失败'}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'alerts' && (
        <div className="card">
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12">状态</th>
                  <th className="w-32">级别</th>
                  <th className="w-64">类型</th>
                  <th>消息</th>
                  <th className="w-40">时间</th>
                  <th className="w-24 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        alert.isAcknowledged ? 'bg-neutral-300' :
                        alert.severity === 'HIGH' ? 'bg-danger-500' :
                        alert.severity === 'MEDIUM' ? 'bg-warning-500' :
                        'bg-primary-500'
                      )} />
                    </td>
                    <td>
                      <span className={cn(
                        'badge',
                        alert.severity === 'HIGH' ? 'badge-danger' :
                        alert.severity === 'MEDIUM' ? 'badge-warning' :
                        'badge-primary'
                      )}>
                        {alert.severity === 'HIGH' ? '高' : alert.severity === 'MEDIUM' ? '中' : '低'}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-neutral-900">{alert.type}</span>
                    </td>
                    <td>
                      <span className="text-neutral-600">{alert.message}</span>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-500">{formatDate(alert.createdAt)}</span>
                    </td>
                    <td className="text-right">
                      {!alert.isAcknowledged && (
                        <button className="btn-ghost btn-sm text-primary-600">
                          确认
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="搜索操作、用户邮箱..."
                className="input max-w-md"
              />
              <select className="input w-40">
                <option value="">全部操作</option>
                <option value="LOGIN">登录</option>
                <option value="CREATE_CAMPAIGN">创建活动</option>
                <option value="UPDATE_TEMPLATE">更新模板</option>
              </select>
            </div>
            <button className="btn-secondary">
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
          
          <div className="card">
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-32">操作</th>
                    <th className="w-32">实体类型</th>
                    <th className="w-48">用户</th>
                    <th>详情</th>
                    <th className="w-32">IP地址</th>
                    <th className="w-40">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="font-medium text-neutral-900">{log.action}</span>
                      </td>
                      <td>
                        <span className="badge badge-default">{log.entityType}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-neutral-900">{log.userEmail}</p>
                          <p className="text-xs text-neutral-500">ID: {log.userId}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-neutral-600">{log.details}</span>
                      </td>
                      <td>
                        <span className="text-sm font-mono text-neutral-500">{log.ipAddress}</span>
                      </td>
                      <td>
                        <span className="text-sm text-neutral-500">{formatDate(log.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-48">用户</th>
                  <th className="w-32">角色</th>
                  <th className="w-24">状态</th>
                  <th className="w-40">最后登录</th>
                  <th className="w-40">创建时间</th>
                  <th className="w-24 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: '1', email: 'admin@example.com', name: '管理员', role: 'ADMIN', isActive: true, lastLoginAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
                  { id: '2', email: 'marketing@example.com', name: '市场运营', role: 'MARKETING_OPERATOR', isActive: true, lastLoginAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
                  { id: '3', email: 'copywriter@example.com', name: '文案策划', role: 'COPYWRITER', isActive: true, lastLoginAt: new Date(Date.now() - 7200000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 45).toISOString() },
                  { id: '4', email: 'analyst@example.com', name: '数据分析师', role: 'DATA_ANALYST', isActive: false, lastLoginAt: null, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
                ].map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <p className="font-medium text-neutral-900">{user.name}</p>
                        <p className="text-sm text-neutral-500">{user.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{
                        user.role === 'ADMIN' ? '系统管理员' :
                        user.role === 'MARKETING_OPERATOR' ? '市场运营' :
                        user.role === 'COPYWRITER' ? '文案策划' :
                        user.role === 'DATA_ANALYST' ? '数据分析师' :
                        '只读用户'
                      }</span>
                    </td>
                    <td>
                      <span className={cn('badge', user.isActive ? 'badge-success' : 'badge-danger')}>
                        {user.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-500">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-500">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="text-right">
                      <button className="btn-ghost btn-sm">
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">邮件服务配置</h3>
              <p className="text-sm text-neutral-500">SMTP服务器和发送参数设置</p>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">SMTP服务器</label>
                  <input type="text" defaultValue="smtp.example.com" className="input" />
                </div>
                <div>
                  <label className="label">端口</label>
                  <input type="text" defaultValue="587" className="input" />
                </div>
                <div>
                  <label className="label">发件人邮箱</label>
                  <input type="email" defaultValue="no-reply@example.com" className="input" />
                </div>
                <div>
                  <label className="label">发件人名称</label>
                  <input type="text" defaultValue="邮件营销系统" className="input" />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary">保存配置</button>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-neutral-900">发送优化设置</h3>
              <p className="text-sm text-neutral-500">发送速率、批次大小等参数</p>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">每批次最大数量</label>
                  <input type="number" defaultValue="1000" className="input" />
                </div>
                <div>
                  <label className="label">并发发送数</label>
                  <input type="number" defaultValue="10" className="input" />
                </div>
                <div>
                  <label className="label">批次间隔(毫秒)</label>
                  <input type="number" defaultValue="1000" className="input" />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary">保存设置</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
