import { useEffect, useState } from 'react';
import { Search, Download, Globe, User, Clock, Activity } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { RoleBadge } from '@/components/Badges';
import type { AuditLog, User } from '@/types';
import { formatDateTime, getDaysAgoDate } from '@/lib/utils';

const ACTION_MAP: Record<string, string> = {
  login: '登录',
  logout: '登出',
  create: '创建',
  update: '更新',
  delete: '删除',
  acknowledge: '确认告警',
  ptz_control: '云台控制',
  create_firmware_task: '创建固件任务',
  update_permissions: '更新权限',
};

const RESOURCE_MAP: Record<string, string> = {
  auth: '认证',
  device: '设备',
  organization: '组织',
  alert: '告警',
  alert_rule: '告警规则',
  user: '用户',
  firmware: '固件',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState('all');
  const [userId, setUserId] = useState('all');
  const [startDate, setStartDate] = useState(getDaysAgoDate(7));
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get('/settings/audit', { params: { page, pageSize, action, userId, startDate, endDate } })
      .then(res => {
        if (res.data.success) {
          setLogs(res.data.list);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '审计日志 - 云瞳视频监控';
    fetchData();
    api.get('/users?pageSize=100').then(res => {
      if (res.data.success) setUsers(res.data.list);
    });
  }, [page, pageSize, action, userId, startDate, endDate]);

  const exportCsv = () => {
    const header = ['时间', '操作人', 'IP地址', '操作类型', '资源类型', '资源ID', '详情'];
    const rows = logs.map(l => [
      formatDateTime(l.created_at),
      l.user_name || '',
      l.ip_address || '',
      ACTION_MAP[l.action] || l.action,
      RESOURCE_MAP[l.resource_type] || l.resource_type,
      l.resource_id || '',
      l.detail || '',
    ]);
    const csv = [header, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionOptions = [
    { value: 'all', label: '全部操作' },
    ...Object.entries(ACTION_MAP).map(([v, l]) => ({ value: v, label: l })),
  ];

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="操作审计日志"
        subtitle={`共 ${total} 条操作记录，完整记录所有用户操作与 IP 地址、时间戳`}
        breadcrumbs={[{ label: '系统设置' }, { label: '审计日志' }]}
        actions={
          <button onClick={exportCsv} className="vms-btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出 CSV
          </button>
        }
      />

      <div className="vms-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <select value={userId} onChange={e => setUserId(e.target.value)} className="vms-input w-40">
            <option value="all">全部用户</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select value={action} onChange={e => setAction(e.target.value)} className="vms-input w-40">
            {actionOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="vms-input w-40" />
          <span className="text-vms-text-muted">至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="vms-input w-40" />
          <button onClick={fetchData} className="vms-btn-primary">查询</button>
        </div>
      </div>

      <div className="vms-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vms-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>IP 地址</th>
                  <th>操作类型</th>
                  <th>资源类型</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="text-xs text-vms-text-muted whitespace-nowrap font-mono">{formatDateTime(l.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-vms-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-vms-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-white">{l.user_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-vms-text-muted">
                        <Globe className="w-3 h-3" />
                        {l.ip_address || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-white">{ACTION_MAP[l.action] || l.action}</span>
                    </td>
                    <td>
                      <span className="text-sm text-vms-text-muted">{RESOURCE_MAP[l.resource_type] || l.resource_type}</span>
                      {l.resource_id && <span className="text-xs text-vms-text-muted ml-1 font-mono">#{l.resource_id}</span>}
                    </td>
                    <td className="text-xs text-vms-text-muted max-w-xs truncate">{l.detail || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-vms-text-muted">暂无日志记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && (
          <div className="px-4 py-4 border-t border-vms-border/50">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
