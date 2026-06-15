import React, { useState, useEffect } from 'react';
import { Table, Switch, Tag, Card, Typography, Space, App, Button, Statistic, Row, Col } from 'antd';
import { EyeOutlined, WarningOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface WarrantyItem {
  id: string;
  contract_no: string;
  total_amount: number;
  end_date: string;
  warranty_years: number;
  warranty_expire: string;
  days_remaining: number;
  owner_name: string;
  owner_phone: string;
  store_name: string;
  open_work_orders: number;
}

const WarrantyList: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);

  useEffect(() => {
    fetchWarranties(expiringSoonOnly);
  }, [expiringSoonOnly]);

  const fetchWarranties = async (expiringSoon: boolean) => {
    setLoading(true);
    try {
      const params = expiringSoon ? { expiring_soon: 'true' } : {};
      const response = await apiClient.get('/admin/warranty/list', { params });
      setWarranties(response.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取质保列表失败');
    } finally {
      setLoading(false);
    }
  };

  const expiringCount = warranties.filter((w) => Math.floor(w.days_remaining || 0) < 365).length;

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 170,
      fixed: 'left' as const,
      render: (text: string, record: WarrantyItem) => {
        const isUrgent = Math.floor(record.days_remaining || 0) < 365;
        return (
          <span style={{ fontFamily: 'monospace', color: isUrgent ? '#f5222d' : '#1890ff', fontWeight: 500 }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d', fontSize: 15 }}>
          ¥{amount?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: '竣工日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '质保到期日',
      dataIndex: 'warranty_expire',
      key: 'warranty_expire',
      width: 120,
      render: (date: string, record: WarrantyItem) => {
        const isUrgent = Math.floor(record.days_remaining || 0) < 365;
        return (
          <Text strong style={{ color: isUrgent ? '#f5222d' : '#333' }}>
            {dayjs(date).format('YYYY-MM-DD')}
          </Text>
        );
      },
    },
    {
      title: '剩余天数',
      dataIndex: 'days_remaining',
      key: 'days_remaining',
      width: 140,
      render: (days: number) => {
        const daysNum = Math.floor(days || 0);
        const isUrgent = daysNum < 365;
        const isCritical = daysNum < 90;
        return (
          <Space>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isCritical ? '#f5222d' : isUrgent ? '#faad14' : '#52c41a',
              }}
            />
            <Tag
              color={isCritical ? 'red' : isUrgent ? 'orange' : 'green'}
              style={{ padding: '4px 12px', borderRadius: 4, fontSize: 13 }}
            >
              {daysNum > 0 ? `${daysNum} 天` : '已到期'}
            </Tag>
            {isUrgent && <WarningOutlined style={{ color: '#faad14' }} />}
          </Space>
        );
      },
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'owner_phone',
      key: 'owner_phone',
      width: 130,
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 140,
    },
    {
      title: '未完工单数',
      dataIndex: 'open_work_orders',
      key: 'open_work_orders',
      width: 120,
      render: (count: number) => {
        const num = count || 0;
        return (
          <Tag color={num > 0 ? 'red' : 'green'} style={{ padding: '4px 12px', borderRadius: 4 }}>
            {num} 单
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: WarrantyItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/contracts/${record.id}`);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              <SafetyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              十年质保管理
            </Title>
            <Text type="secondary">
              管理所有在保项目，提前预警即将到期的质保项目，保障业主权益
            </Text>
          </div>
          <Space>
            <ClockCircleOutlined style={{ color: '#666' }} />
            <span style={{ color: '#666' }}>仅显示即将到期（1年内）：</span>
            <Switch
              checked={expiringSoonOnly}
              onChange={setExpiringSoonOnly}
            />
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', background: '#e6f7ff' }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>在保项目总数</Text>}
              value={warranties.length}
              suffix="份"
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', background: '#fff7e6' }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>1年内到期</Text>}
              value={expiringCount}
              suffix="份"
              valueStyle={{ color: '#fa8c16', fontSize: 28 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', background: '#fff1f0' }} bodyStyle={{ padding: 20 }}>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 13 }}>待处理工单数</Text>}
              value={warranties.reduce((sum, w) => sum + (w.open_work_orders || 0), 0)}
              suffix="单"
              valueStyle={{ color: '#f5222d', fontSize: 28 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={warranties}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/contracts/${record.id}`),
            style: {
              cursor: 'pointer',
              background: Math.floor(record.days_remaining || 0) < 365 ? '#fff7e6' : undefined,
            },
          })}
        />
      </Card>
    </div>
  );
};

export default WarrantyList;
