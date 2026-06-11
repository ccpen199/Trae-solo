import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Tabs, Button, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ordersApi, type OrderListItem } from '../api/orders';
import type { CargoStatus } from '../../shared/types';
import { formatMoney, formatDateTime } from '../utils/format';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'blue' },
  bidding: { label: '竞价中', color: 'orange' },
  assigned: { label: '已派单', color: 'cyan' },
  in_transit: { label: '运输中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const tabItems = [
  { key: '', label: '全部' },
  { key: 'published', label: '待派单' },
  { key: 'in_transit', label: '运输中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getList({
        status: (activeTab || undefined) as CargoStatus | undefined,
        page,
        pageSize,
      });
      setData(res.data.list);
      setTotal(res.data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await ordersApi.getDetail(id);
      setCurrentOrder(res.data);
      setDetailVisible(true);
    } catch {
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '货物名称',
      dataIndex: 'cargoName',
      key: 'cargoName',
      width: 120,
    },
    {
      title: '路线',
      key: 'route',
      width: 160,
      render: (_: unknown, record: OrderListItem) => `${record.startCity} → ${record.endCity}`,
    },
    {
      title: '运费',
      dataIndex: 'expectedPrice',
      key: 'expectedPrice',
      width: 120,
      render: (price: number) => (
        <span className="font-semibold" style={{ color: '#165DFF' }}>{formatMoney(price)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status];
        return <Tag color={config?.color}>{config?.label || status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: OrderListItem) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          查看
        </Button>
      ),
    },
  ];

  const orderDetail = currentOrder as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      <Card variant="borderless" className="card-shadow">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems.map(item => ({
            key: item.key,
            label: item.label,
          }))}
        />
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 940 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {orderDetail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单号" span={2}>
              <span className="font-mono">{String(orderDetail.orderNo || '-')}</span>
            </Descriptions.Item>
            <Descriptions.Item label="货主">{String((orderDetail.owner as Record<string, string>)?.name || '-')}</Descriptions.Item>
            <Descriptions.Item label="货主公司">{String((orderDetail.owner as Record<string, string>)?.company || '-')}</Descriptions.Item>
            <Descriptions.Item label="货物名称">{String((orderDetail.cargo as Record<string, string>)?.name || '-')}</Descriptions.Item>
            <Descriptions.Item label="货物类型">{String((orderDetail.cargo as Record<string, string>)?.type === 'FTL' ? '整车' : '零担')}</Descriptions.Item>
            <Descriptions.Item label="重量">{(orderDetail.cargo as Record<string, number>)?.weight ? `${(orderDetail.cargo as Record<string, number>).weight} 吨` : '-'}</Descriptions.Item>
            <Descriptions.Item label="体积">{(orderDetail.cargo as Record<string, number>)?.volume ? `${(orderDetail.cargo as Record<string, number>).volume} m³` : '-'}</Descriptions.Item>
            <Descriptions.Item label="出发城市">{String((orderDetail.route as Record<string, string>)?.startCity || '-')}</Descriptions.Item>
            <Descriptions.Item label="目的城市">{String((orderDetail.route as Record<string, string>)?.endCity || '-')}</Descriptions.Item>
            <Descriptions.Item label="出发地址" span={2}>{String((orderDetail.route as Record<string, string>)?.startAddress || '-')}</Descriptions.Item>
            <Descriptions.Item label="目的地址" span={2}>{String((orderDetail.route as Record<string, string>)?.endAddress || '-')}</Descriptions.Item>
            <Descriptions.Item label="运费" span={2}>
              <span className="text-lg font-semibold" style={{ color: '#165DFF' }}>
                {formatMoney(orderDetail.expectedPrice as number)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <Tag color={statusConfig[String(orderDetail.status)]?.color}>
                {statusConfig[String(orderDetail.status)]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {formatDateTime(String(orderDetail.createdAt))}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
