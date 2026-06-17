import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Button,
  Space,
  DatePicker,
  Input,
  Modal,
  Descriptions,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
} from 'lucide-react';
import dayjs from 'dayjs';
import { auditApi } from '@/services/api';
import type { AuditLog } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search: SearchInput } = Input;

const actionColorMap: Record<string, string> = {
  '开启隐私模式': 'blue',
  '查看实时画面': 'green',
  '固件升级': 'orange',
  '添加成员': 'purple',
  '设备分享': 'cyan',
  '修改配置': 'gold',
  '删除设备': 'red',
  '登录系统': 'green',
  '退出登录': 'default',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    keyword: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [detailModal, setDetailModal] = useState<{ visible: boolean; log: AuditLog | null }>({
    visible: false,
    log: null,
  });

  const fetchActions = async () => {
    try {
      const data = await auditApi.getActions();
      setActions(data);
    } catch (error) {
      console.error('获取操作类型失败:', error);
    }
  };

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.keyword) {
        params.userId = filters.keyword;
      }
      if (filters.dateRange) {
        params.startTime = filters.dateRange[0].toISOString();
        params.endTime = filters.dateRange[1].toISOString();
      }
      const data = await auditApi.getLogs(params);
      setLogs(data.list);
      setPagination({ current: data.page, pageSize: data.pageSize, total: data.total });
    } catch (error) {
      console.error('获取审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchLogs();
  }, []);

  const handleTableChange: TableProps<AuditLog>['onChange'] = (pag) => {
    fetchLogs(pag.current, pag.pageSize);
  };

  const handleSearch = () => {
    fetchLogs(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({ action: undefined, keyword: '', dateRange: null });
    fetchLogs(1, pagination.pageSize);
  };

  const handleExport = async () => {
    try {
      const blob = await auditApi.exportLogs({
        startTime: filters.dateRange?.[0].toISOString(),
        endTime: filters.dateRange?.[1].toISOString(),
        action: filters.action,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `审计日志_${dayjs().format('YYYYMMDD')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setDetailModal({ visible: true, log });
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (time: string) => (
        <span className="text-gray-600">{dayjs(time).format('YYYY-MM-DD HH:mm:ss')}</span>
      ),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: '操作人',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name: string) => <span className="font-medium text-gray-800">{name}</span>,
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => (
        <Tag color={actionColorMap[action] || 'default'} className="border-0">
          {action}
        </Tag>
      ),
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 140,
      render: (name?: string) => <span className="text-gray-600">{name || '-'}</span>,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip: string) => (
        <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
          {ip}
        </span>
      ),
    },
    {
      title: '操作详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: string) => <span className="text-gray-600">{details}</span>,
    },
    {
      title: '操作',
      key: 'action_col',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>
          <p className="text-gray-500 mt-1">记录系统所有操作行为，支持追溯和审计</p>
        </div>
        <Button type="primary" icon={<Download size={16} />} onClick={handleExport}>
          导出日志
        </Button>
      </div>

      <Card className="shadow-sm" bordered={false}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-gray-600">筛选：</span>
          </div>
          <Select
            placeholder="操作类型"
            style={{ width: 160 }}
            allowClear
            value={filters.action}
            onChange={(value) => setFilters({ ...filters, action: value })}
          >
            {actions.map((action) => (
              <Option key={action} value={action}>
                {action}
              </Option>
            ))}
          </Select>
          <SearchInput
            placeholder="搜索操作人"
            style={{ width: 200 }}
            allowClear
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onSearch={handleSearch}
          />
          <RangePicker
            showTime
            style={{ width: 320 }}
            value={filters.dateRange}
            onChange={(dates) =>
              setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })
            }
          />
          <Space>
            <Button type="primary" icon={<Search size={14} />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>
      </Card>

      <Card className="shadow-sm" bordered={false}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <FileText size={18} className="text-primary-500" />
            日志详情
          </span>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, log: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, log: null })}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {detailModal.log && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="操作时间">
              {dayjs(detailModal.log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {detailModal.log.userName} (ID: {detailModal.log.userId})
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              <Tag color={actionColorMap[detailModal.log.action] || 'default'}>
                {detailModal.log.action}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="关联设备">
              {detailModal.log.deviceName || '-'}
              {detailModal.log.deviceId && (
                <span className="text-gray-400 text-sm ml-2">
                  (ID: {detailModal.log.deviceId})
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              <span className="font-mono">{detailModal.log.ip}</span>
            </Descriptions.Item>
            <Descriptions.Item label="操作详情">
              {detailModal.log.details}
            </Descriptions.Item>
            <Descriptions.Item label="日志ID">
              <span className="font-mono text-gray-400 text-sm">{detailModal.log.id}</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
