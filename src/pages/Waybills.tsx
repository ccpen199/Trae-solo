import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Tabs, Tag, Button, Space, Modal, Select, message, Card } from 'antd';
import { SearchOutlined, EnvironmentOutlined, SyncOutlined } from '@ant-design/icons';
import { waybillApi, type WaybillListItem } from '../api/waybill';
import { formatMoney, formatDateTime } from '../utils/format';
import type { WaybillStatus } from '../../shared/types';
import type { ColumnsType } from 'antd/es/table';

const statusMap: Record<WaybillStatus, { label: string; color: string }> = {
  pending: { label: '待发车', color: 'default' },
  loading: { label: '装车中', color: 'processing' },
  in_transit: { label: '运输中', color: 'blue' },
  unloading: { label: '卸车中', color: 'cyan' },
  completed: { label: '已送达', color: 'success' },
  exception: { label: '异常', color: 'error' },
};

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待发车' },
  { key: 'in_transit', label: '运输中' },
  { key: 'completed', label: '已送达' },
  { key: 'exception', label: '异常' },
];

const statusOptions = Object.entries(statusMap).map(([value, { label }]) => ({
  value,
  label,
}));

const Waybills: React.FC = () => {
  const [data, setData] = useState<WaybillListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [currentWaybill, setCurrentWaybill] = useState<WaybillListItem | null>(null);
  const [newStatus, setNewStatus] = useState<WaybillStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (activeStatus !== 'all') {
        params.status = activeStatus;
      }
      const res = await waybillApi.getList(params as Parameters<typeof waybillApi.getList>[0]);
      setData(res.data.list);
      setTotal(res.data.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveStatus(key);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleUpdateStatus = (record: WaybillListItem) => {
    setCurrentWaybill(record);
    setNewStatus(record.status);
    setStatusModalOpen(true);
  };

  const submitStatusUpdate = async () => {
    if (!currentWaybill || !newStatus) return;
    setUpdating(true);
    try {
      await waybillApi.updateStatus(currentWaybill.id, newStatus);
      message.success('状态更新成功');
      setStatusModalOpen(false);
      fetchData();
    } catch {
      message.error('状态更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewTrack = (record: WaybillListItem) => {
    window.open(`/tracking?waybill=${record.id}`, '_blank');
  };

  const filteredData = keyword
    ? data.filter(
        (item) =>
          item.waybillNo.includes(keyword) ||
          item.driverName?.includes(keyword) ||
          item.plateNo?.includes(keyword) ||
          item.cargoName?.includes(keyword)
      )
    : data;

  const columns: ColumnsType<WaybillListItem> = [
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      width: 160,
      render: (text: string) => <span className="font-medium text-primary-500">{text}</span>,
    },
    {
      title: '货物',
      dataIndex: 'cargoName',
      key: 'cargoName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '路线',
      key: 'route',
      width: 160,
      render: (_: unknown, record: WaybillListItem) => (
        <span>
          {record.startCity} → {record.endCity}
        </span>
      ),
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      width: 100,
    },
    {
      title: '车牌号',
      dataIndex: 'plateNo',
      key: 'plateNo',
      width: 110,
    },
    {
      title: '运费',
      dataIndex: 'actualPrice',
      key: 'actualPrice',
      width: 110,
      render: (val: number) => <span className="font-medium">{formatMoney(val)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WaybillStatus) => {
        const info = statusMap[status];
        return <Tag color={info?.color}>{info?.label || status}</Tag>;
      },
    },
    {
      title: '发车时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: WaybillListItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => handleViewTrack(record)}
          >
            轨迹
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleUpdateStatus(record)}
          >
            状态
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card variant="borderless" className="card-shadow">
        <Tabs
          activeKey={activeStatus}
          onChange={handleTabChange}
          items={statusTabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
          }))}
          tabBarExtraContent={
            <Input.Search
              placeholder="搜索运单号/司机/车牌"
              allowClear
              onSearch={handleSearch}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />
          }
        />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="更新运单状态"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={submitStatusUpdate}
        confirmLoading={updating}
        okText="确认更新"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-4 text-gray-500">
            运单号：<span className="text-gray-900 font-medium">{currentWaybill?.waybillNo}</span>
          </p>
          <Select
            value={newStatus}
            onChange={(val) => setNewStatus(val)}
            options={statusOptions}
            className="w-full"
            placeholder="请选择新状态"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Waybills;
