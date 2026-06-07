import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, CheckCircle2, XCircle, Flag } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { AlertLevelBadge, AlertStatusBadge } from '@/components/Badges';
import { ALERT_TYPE_MAP } from '@/types';
import type { Alert } from '@/types';
import { formatDateTime, getDaysAgoDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

export default function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('all');
  const [type, setType] = useState('all');
  const [startDate, setStartDate] = useState(getDaysAgoDate(7));
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = useAuthStore(s => s.isAdmin);

  const fetchData = () => {
    setLoading(true);
    api.get('/alerts', { params: { page, pageSize, level, type, startDate, endDate } })
      .then(res => {
        if (res.data.success) {
          setAlerts(res.data.list);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '告警中心 - 云瞳视频监控';
    fetchData();
  }, [page, pageSize, level, type, startDate, endDate]);

  const handleAck = async (id: number) => {
    try {
      await api.put(`/alerts/${id}/acknowledge`);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'motion', label: '移动侦测' },
    { value: 'crossing', label: '区域越界' },
    { value: 'occlusion', label: '画面遮挡' },
    { value: 'offline', label: '设备离线' },
    { value: 'storage_low', label: '存储不足' },
  ];

  const stats = [
    { label: '待处理', value: alerts.filter(a => a.status === 'pending').length, color: 'text-red-400' },
    { label: '已确认', value: alerts.filter(a => a.status === 'acknowledged').length, color: 'text-blue-400' },
    { label: '已忽略', value: alerts.filter(a => a.status === 'ignored').length, color: 'text-gray-400' },
  ];

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="告警中心"
        subtitle={`共 ${total} 条告警记录，支持按时间、级别、类型筛选`}
        breadcrumbs={[{ label: '告警中心' }]}
        actions={
          <Link to="/alerts/rules" className="vms-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 告警规则
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="vms-card p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.color} bg-current/10 flex items-center justify-center`}>
              {i === 0 ? <AlertTriangle className="w-6 h-6" /> : i === 1 ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-sm text-vms-text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vms-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vms-text-muted" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索告警内容..."
              className="vms-input pl-9"
            />
          </div>
          <select value={level} onChange={e => setLevel(e.target.value)} className="vms-input w-32">
            <option value="all">全部级别</option>
            <option value="critical">严重</option>
            <option value="warning">警告</option>
            <option value="info">信息</option>
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="vms-input w-36">
            {typeOptions.map(o => (
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
                  <th>设备</th>
                  <th>类型</th>
                  <th>级别</th>
                  <th>内容</th>
                  <th>状态</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td className="text-xs text-vms-text-muted whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                    <td className="font-medium text-white">{a.device_name}</td>
                    <td>
                      <span className="text-sm">{ALERT_TYPE_MAP[a.type] || a.type}</span>
                    </td>
                    <td><AlertLevelBadge status={a.level} /></td>
                    <td className="text-vms-text-muted">{a.message || '-'}</td>
                    <td><AlertStatusBadge status={a.status} /></td>
                    <td className="text-right">
                      {a.status === 'pending' && (
                        <button
                          onClick={() => handleAck(a.id)}
                          className="vms-btn-primary text-xs py-1.5 px-3"
                        >
                          确认
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-vms-text-muted">暂无告警记录</td>
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
