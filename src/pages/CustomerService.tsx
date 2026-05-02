import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Modal, Form, Input, Select, Card, Row, Col, Statistic, Timeline, Tabs } from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { customersAPI } from '../services/api';

interface AfterSale {
  id: number;
  order_id: number;
  type: string;
  reason: string;
  description: string;
  status: string;
  amount: string;
  processing_chain: any[];
  created_at: string;
  order?: any;
}

const CustomerService: React.FC = () => {
  const [afterSales, setAfterSales] = useState<AfterSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAfterSale, setSelectedAfterSale] = useState<AfterSale | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [filters, setFilters] = useState({ type: undefined as string | undefined, status: undefined as string | undefined });

  useEffect(() => {
    loadAfterSales();
  }, [filters]);

  const loadAfterSales = async () => {
    setLoading(true);
    try {
      const response = await customersAPI.getAfterSales(filters);
      setAfterSales(response.data.afterSales);
    } catch (error) {
      message.error('加载售后记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record: AfterSale) => {
    try {
      const response = await customersAPI.getAfterSaleById(record.id);
      setSelectedAfterSale(response.data.afterSale);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleUpdateStatus = async (id: number, status: string, notes?: string) => {
    try {
      await customersAPI.update(id, { status, notes });
      message.success('状态更新成功');
      setDetailVisible(false);
      loadAfterSales();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const typeLabels: Record<string, string> = {
    refund: '退款',
    return: '退货',
    dispute: '纠纷'
  };

  const typeColors: Record<string, string> = {
    refund: 'blue',
    return: 'orange',
    dispute: 'red'
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    processing: 'processing',
    completed: 'success',
    rejected: 'error'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    rejected: '已拒绝'
  };

  const columns: ColumnsType<AfterSale> = [
    {
      title: '售后类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => amount ? `$${parseFloat(amount).toFixed(2)}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'processing')}>
                开始处理
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'rejected')}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'completed')}>
              完成
            </Button>
          )}
        </Space>
      )
    }
  ];

  const stats = {
    total: afterSales.length,
    pending: afterSales.filter(a => a.status === 'pending').length,
    processing: afterSales.filter(a => a.status === 'processing').length,
    completed: afterSales.filter(a => a.status === 'completed').length
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>客服工作台</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="总售后单" value={stats.total} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="售后类型"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, type: value })}
              value={filters.type}
            >
              <Select.Option value="refund">退款</Select.Option>
              <Select.Option value="return">退货</Select.Option>
              <Select.Option value="dispute">纠纷</Select.Option>
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
              value={filters.status}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={afterSales}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="售后详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {selectedAfterSale && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="售后信息" size="small">
                  <p><strong>类型：</strong><Tag color={typeColors[selectedAfterSale.type]}>{typeLabels[selectedAfterSale.type]}</Tag></p>
                  <p><strong>原因：</strong>{selectedAfterSale.reason || '-'}</p>
                  <p><strong>金额：</strong>{selectedAfterSale.amount ? `$${parseFloat(selectedAfterSale.amount).toFixed(2)}` : '-'}</p>
                  <p><strong>状态：</strong><Tag color={statusColors[selectedAfterSale.status]}>{statusLabels[selectedAfterSale.status]}</Tag></p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="关联订单" size="small">
                  {selectedAfterSale.order ? (
                    <>
                      <p><strong>订单号：</strong>{selectedAfterSale.order.platform_order_id}</p>
                      <p><strong>金额：</strong>${parseFloat(selectedAfterSale.order.total_amount).toFixed(2)}</p>
                      <p><strong>状态：</strong>{selectedAfterSale.order.status}</p>
                    </>
                  ) : <p>-</p>}
                </Card>
              </Col>
            </Row>

            {selectedAfterSale.description && (
              <Card title="详细描述" size="small" style={{ marginTop: 16 }}>
                <p>{selectedAfterSale.description}</p>
              </Card>
            )}

            <Card title="处理链路" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={(selectedAfterSale.processing_chain || []).map((item: any, index: number) => ({
                  children: (
                    <div key={index}>
                      <div><strong>{item.action}</strong> - {item.message}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {item.timestamp} {item.operator && `by ${item.operator}`}
                      </div>
                      {item.notes && <div style={{ fontSize: 12 }}>备注: {item.notes}</div>}
                    </div>
                  )
                }))}
              />
            </Card>

            {selectedAfterSale.status !== 'completed' && selectedAfterSale.status !== 'rejected' && (
              <Card size="small" style={{ marginTop: 16 }}>
                <Form form={actionForm} layout="inline">
                  <Form.Item name="notes" label="处理备注">
                    <Input placeholder="请输入处理备注" style={{ width: 300 }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" onClick={() => {
                      const notes = actionForm.getFieldValue('notes');
                      handleUpdateStatus(selectedAfterSale.id, 'completed', notes);
                    }}>完成处理</Button>
                  </Form.Item>
                </Form>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerService;