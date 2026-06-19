import { useEffect, useState } from 'react';
import { Bell, Search, Check, CheckCheck, X, Filter, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAlertStore } from '../stores/alertStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable } from '../components/common/DataTable';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import dayjs from 'dayjs';
import type { Alert } from '@shared/types';

export default function Alerts() {
  const { alerts, isLoading, pagination, unreadCount, fetchAlerts, fetchUnreadCount, markAsRead, markAllAsRead, dismissAlert } = useAlertStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAlerts({ page: currentPage, pageSize: 10 });
    fetchUnreadCount();
  }, [currentPage]);

  const handleFilter = () => {
    const params: any = { page: 1, pageSize: 10 };
    if (typeFilter !== 'all') params.type = typeFilter;
    if (levelFilter !== 'all') params.level = levelFilter;
    if (readFilter !== 'all') params.read = readFilter === 'read';
    fetchAlerts(params);
    setCurrentPage(1);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDismiss = async (id: string) => {
    await dismissAlert(id);
  };

  const handleViewDetail = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailModalOpen(true);
    if (!alert.read) {
      markAsRead(alert.id);
    }
  };

  const getAlertIcon = (type: string, level: string) => {
    if (level === 'critical') return <AlertCircle className="w-5 h-5 text-danger-500" />;
    if (level === 'warning') return <AlertTriangle className="w-5 h-5 text-warning-500" />;
    return <Info className="w-5 h-5 text-primary-500" />;
  };

  const columns = [
    {
      key: 'level',
      header: '级别',
      width: '80px',
      render: (item: Alert) => <StatusBadge status={item.level} type="alert" />,
    },
    {
      key: 'type',
      header: '类型',
      width: '100px',
      render: (item: Alert) => {
        const typeMap: Record<string, string> = {
          inventory: '库存告警',
          verification_rate: '核销率告警',
          risk: '风险告警',
          system: '系统告警',
        };
        return typeMap[item.type] || item.type;
      },
    },
    {
      key: 'title',
      header: '标题',
      render: (item: Alert) => (
        <div className="flex items-center gap-2">
          {getAlertIcon(item.type, item.level)}
          <span className={!item.read ? 'font-semibold text-gray-900' : 'text-gray-600'}>{item.title}</span>
          {!item.read && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '时间',
      width: '160px',
      render: (item: Alert) => dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '180px',
      render: (item: Alert) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetail(item)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            查看
          </button>
          {!item.read && (
            <button
              onClick={() => handleMarkAsRead(item.id)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              已读
            </button>
          )}
          <button
            onClick={() => handleDismiss(item.id)}
            className="text-gray-400 hover:text-danger-500 text-sm font-medium"
          >
            忽略
          </button>
        </div>
      ),
    },
  ];

  const filteredAlerts = alerts.filter((alert) =>
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">告警中心</h1>
          <p className="text-gray-500 mt-1">管理和处理系统告警信息</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 rounded-lg">
            <Bell className="w-5 h-5 text-warning-500" />
            <span className="text-warning-700 font-medium">
              {unreadCount} 条未读告警
            </span>
          </div>
          <button onClick={handleMarkAllAsRead} className="btn-secondary flex items-center gap-2">
            <CheckCheck className="w-4 h-4" />
            全部已读
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索告警标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部类型</option>
              <option value="inventory">库存告警</option>
              <option value="verification_rate">核销率告警</option>
              <option value="risk">风险告警</option>
              <option value="system">系统告警</option>
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部级别</option>
              <option value="info">信息</option>
              <option value="warning">警告</option>
              <option value="critical">严重</option>
            </select>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="input w-32"
            >
              <option value="all">全部状态</option>
              <option value="unread">未读</option>
              <option value="read">已读</option>
            </select>
            <button onClick={handleFilter} className="btn-primary">
              筛选
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAlerts}
          loading={isLoading}
          pagination={{
            page: currentPage,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) => setCurrentPage(page),
          }}
          rowKey={(row) => row.id}
        />
      )}

      <Modal
        visible={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="告警详情"
        size="lg"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              {getAlertIcon(selectedAlert.type, selectedAlert.level)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{selectedAlert.title}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {dayjs(selectedAlert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>
              <StatusBadge status={selectedAlert.level} type="alert" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">告警类型</label>
                <p className="text-gray-900">
                  {{
                    inventory: '库存告警',
                    verification_rate: '核销率告警',
                    risk: '风险告警',
                    system: '系统告警',
                  }[selectedAlert.type] || selectedAlert.type}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">详细内容</label>
                <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedAlert.message}</p>
              </div>
              {selectedAlert.relatedId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">关联ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedAlert.relatedId}</p>
                </div>
              )}
              {selectedAlert.merchantId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">关联商户</label>
                  <p className="text-gray-900">{selectedAlert.merchantId}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleMarkAsRead(selectedAlert.id)}
                className="btn-primary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                标记已读
              </button>
              <button
                onClick={() => {
                  handleDismiss(selectedAlert.id);
                  setDetailModalOpen(false);
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                忽略告警
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
