import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Select, Input, Space, Modal, Descriptions, message, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, SendOutlined, UserSwitchOutlined, DeleteOutlined } from '@ant-design/icons';
import { cargoApi, type CargoListQuery } from '../api/cargo';
import type { Cargo, CargoStatus } from '../../shared/types';
import { formatMoney, formatDateTime } from '../utils/format';

const statusConfig: Record<CargoStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'blue' },
  bidding: { label: '竞价中', color: 'orange' },
  assigned: { label: '已派单', color: 'cyan' },
  in_transit: { label: '运输中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
};

const statusOptions = Object.entries(statusConfig).map(([value, { label }]) => ({
  label,
  value,
}));

const CargoList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Cargo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<CargoListQuery>({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentCargo, setCurrentCargo] = useState<Cargo | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cargoApi.getList({
        ...filters,
        page,
        pageSize,
      });
      setData(res.data.list);
      setTotal(res.data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const res = await cargoApi.getDetail(id);
      setCurrentCargo(res.data as Cargo);
      setDetailVisible(true);
    } catch {
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await cargoApi.publish(id);
      message.success('发布成功');
      fetchData();
    } catch {
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cargoApi.remove(id);
      message.success('删除成功');
      fetchData();
    } catch {
    }
  };

  const getActions = (record: Cargo) => {
    const actions: React.ReactNode[] = [];
    actions.push(
      <Button
        key="view"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record.id)}
      >
        详情
      </Button>
    );

    if (record.status === 'draft') {
      actions.push(
        <Button
          key="publish"
          type="link"
          size="small"
          icon={<SendOutlined />}
          onClick={() => handlePublish(record.id)}
        >
          发布
        </Button>
      );
    }

    if (record.status === 'published' || record.status === 'bidding') {
      actions.push(
        <Button
          key="assign"
          type="link"
          size="small"
          icon={<UserSwitchOutlined />}
          style={{ color: '#165DFF' }}
        >
          派单
        </Button>
      );
    }

    if (record.status === 'draft') {
      actions.push(
        <Popconfirm
          key="delete"
          title="确定要删除该货源吗？"
          onConfirm={() => handleDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      );
    }

    return actions;
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
      title: '类型',
      dataIndex: 'cargoType',
      key: 'cargoType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'FTL' ? 'blue' : 'orange'}>
          {type === 'FTL' ? '整车' : '零担'}
        </Tag>
      ),
    },
    {
      title: '路线',
      key: 'route',
      width: 160,
      render: (_: unknown, record: Cargo) => `${record.startCity} → ${record.endCity}`,
    },
    {
      title: '重量(吨)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (weight: number) => weight ?? '-',
    },
    {
      title: '价格',
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
      render: (status: CargoStatus) => {
        const config = statusConfig[status];
        return <Tag color={config?.color}>{config?.label || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Cargo) => <Space size={0}>{getActions(record)}</Space>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card variant="borderless" className="card-shadow">
        <Space wrap size="middle">
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={filters.status}
            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            options={statusOptions}
          />
          <Input.Search
            placeholder="搜索货物名称"
            allowClear
            style={{ width: 240 }}
            onSearch={(value) => {
              setFilters(prev => ({ ...prev, startCity: value || undefined }));
              setPage(1);
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ background: '#165DFF' }}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <Card variant="borderless" className="card-shadow" title="货源列表">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1100 }}
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
        title="货源详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentCargo && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单号" span={2}>
              <span className="font-mono">{currentCargo.orderNo}</span>
            </Descriptions.Item>
            <Descriptions.Item label="货物名称">{currentCargo.cargoName}</Descriptions.Item>
            <Descriptions.Item label="货物类型">
              {currentCargo.cargoType === 'FTL' ? '整车' : '零担'}
            </Descriptions.Item>
            <Descriptions.Item label="重量">{currentCargo.weight ? `${currentCargo.weight} 吨` : '-'}</Descriptions.Item>
            <Descriptions.Item label="体积">{currentCargo.volume ? `${currentCargo.volume} m³` : '-'}</Descriptions.Item>
            <Descriptions.Item label="出发城市">{currentCargo.startCity}</Descriptions.Item>
            <Descriptions.Item label="目的城市">{currentCargo.endCity}</Descriptions.Item>
            <Descriptions.Item label="出发地址" span={2}>{currentCargo.startAddress}</Descriptions.Item>
            <Descriptions.Item label="目的地址" span={2}>{currentCargo.endAddress}</Descriptions.Item>
            <Descriptions.Item label="装货时间">{formatDateTime(currentCargo.pickupTime)}</Descriptions.Item>
            <Descriptions.Item label="送达时间">{formatDateTime(currentCargo.deliveryTime)}</Descriptions.Item>
            <Descriptions.Item label="期望运费" span={2}>
              <span className="text-lg font-semibold" style={{ color: '#165DFF' }}>
                {formatMoney(currentCargo.expectedPrice)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <Tag color={statusConfig[currentCargo.status]?.color}>
                {statusConfig[currentCargo.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {formatDateTime(currentCargo.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CargoList;
