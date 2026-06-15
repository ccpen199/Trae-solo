import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, Card, Typography, Space, Progress, App, Button } from 'antd';
import { EyeOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface TrackingContract {
  id: string;
  contract_no: string;
  total_amount: number;
  status: string;
  start_date: string;
  end_date: string;
  warranty_years: number;
  owner_name: string;
  owner_phone: string;
  designer_name: string;
  store_name: string;
  milestone_count: number;
  completed_milestones: number;
  paid_amount: number;
}

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_sign: { text: '待签署', color: 'warning' },
  signed: { text: '已签署', color: 'processing' },
  in_progress: { text: '施工中', color: 'blue' },
  completed: { text: '已完成', color: 'success' },
  terminated: { text: '已终止', color: 'error' },
};

const ContractTracking: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [contracts, setContracts] = useState<TrackingContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchContracts(statusFilter);
  }, [statusFilter]);

  const fetchContracts = async (status?: string) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/admin/contracts/tracking', { params });
      setContracts(response.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 180,
      fixed: 'left' as const,
      render: (text: string) => <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{text}</span>,
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
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '设计师',
      dataIndex: 'designer_name',
      key: 'designer_name',
      width: 100,
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color as any} style={{ padding: '4px 12px', borderRadius: 4 }}>{info.text}</Tag>;
      },
    },
    {
      title: '开工日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '竣工日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '质保年限',
      dataIndex: 'warranty_years',
      key: 'warranty_years',
      width: 100,
      render: (years: number) => (
        <Tag color="purple" style={{ padding: '4px 12px', borderRadius: 4 }}>
          {years} 年
        </Tag>
      ),
    },
    {
      title: '节点完成进度',
      key: 'milestone_progress',
      width: 180,
      render: (_: any, record: TrackingContract) => {
        const total = record.milestone_count || 0;
        const completed = record.completed_milestones || 0;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Text type="secondary">已完成 {completed}/{total} 个节点</Text>
              <Text strong>{percent}%</Text>
            </div>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent === 100 ? '#52c41a' : percent >= 50 ? '#1890ff' : '#faad14'}
              showInfo={false}
            />
          </Space>
        );
      },
    },
    {
      title: '付款进度',
      key: 'payment_progress',
      width: 180,
      render: (_: any, record: TrackingContract) => {
        const total = record.total_amount || 0;
        const paid = record.paid_amount || 0;
        const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Text type="secondary">已付款 ¥{paid?.toLocaleString() || 0}</Text>
              <Text strong>{percent}%</Text>
            </div>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent === 100 ? '#52c41a' : '#1890ff'}
              showInfo={false}
            />
          </Space>
        );
      },
    },
    {
      title: '已付款金额',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ¥{amount?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: TrackingContract) => (
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
              合同履约追踪
            </Title>
            <Text type="secondary">
              实时跟踪所有合同的履约进度、节点完成情况和付款状态
            </Text>
          </div>
          <Space>
            <FilterOutlined style={{ color: '#666' }} />
            <span style={{ color: '#666' }}>状态筛选：</span>
            <Select
              placeholder="全部状态"
              style={{ width: 140 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="draft">草稿</Option>
              <Option value="pending_sign">待签署</Option>
              <Option value="signed">已签署</Option>
              <Option value="in_progress">施工中</Option>
              <Option value="completed">已完成</Option>
              <Option value="terminated">已终止</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0, borderRadius: 12 }} style={{ borderRadius: 12 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={contracts}
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/contracts/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
};

export default ContractTracking;
