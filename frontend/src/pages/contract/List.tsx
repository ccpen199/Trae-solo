import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, Card, Typography, Space, App, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Contract {
  id: string;
  demand_id: string;
  contract_no: string;
  total_amount: number;
  status: 'draft' | 'pending_sign' | 'signed' | 'terminated';
  owner_name: string;
  designer_name: string;
  store_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_sign: { text: '待签署', color: 'warning' },
  signed: { text: '已签署', color: 'success' },
  terminated: { text: '已终止', color: 'error' },
};

const ContractList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);

  const fetchContracts = async (status?: string) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/contracts', { params });
      setContracts(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts(statusFilter);
  }, [statusFilter]);

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 200,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
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
      width: 150,
    },
    {
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color as any}>{info.text}</Tag>;
      },
    },
    {
      title: '开工日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '签约时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Contract) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/contracts/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            {user?.role === 'owner' ? '我的合同' : '合同管理'}
          </Title>
          <Space>
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
              <Option value="terminated">已终止</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={contracts}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
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

export default ContractList;
