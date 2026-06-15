import React, { useState, useEffect } from 'react';
import { Table, Select, Input, Button, Space, Card, Tag, App, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

interface DemandItem {
  id: string;
  owner_id: string;
  owner_name: string;
  city: string;
  district: string;
  address: string;
  house_type: string;
  area: number;
  budget_min: number;
  budget_max: number;
  decoration_style: string;
  contact_name?: string;
  contact_phone?: string;
  status: 'pending' | 'matched' | 'signed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待匹配', color: 'orange' },
  matched: { text: '已匹配', color: 'blue' },
  signed: { text: '已签约', color: 'purple' },
  in_progress: { text: '施工中', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const DemandList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DemandItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const response = await apiClient.get('/demands', { params });
      setData(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取需求列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, [statusFilter]);

  const filteredData = data.filter((item) => {
    if (!searchText) return true;
    const lowerSearch = searchText.toLowerCase();
    return (
      item.address.toLowerCase().includes(lowerSearch) ||
      item.city.toLowerCase().includes(lowerSearch) ||
      item.district?.toLowerCase().includes(lowerSearch) ||
      item.contact_name?.toLowerCase().includes(lowerSearch) ||
      item.owner_name?.toLowerCase().includes(lowerSearch)
    );
  });

  const columns: ColumnsType<DemandItem> = [
    {
      title: '需求编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id.slice(0, 8)}</span>,
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 80,
    },
    {
      title: '区域',
      dataIndex: 'district',
      key: 'district',
      width: 100,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '户型',
      dataIndex: 'house_type',
      key: 'house_type',
      width: 100,
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (area: number) => `${area}㎡`,
    },
    {
      title: '预算范围(万元)',
      key: 'budget',
      width: 140,
      render: (_: any, record: DemandItem) =>
        `${(record.budget_min / 10000).toFixed(1)} - ${(record.budget_max / 10000).toFixed(1)}`,
    },
    {
      title: '装修风格',
      dataIndex: 'decoration_style',
      key: 'decoration_style',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: DemandItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/demands/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>需求列表</Title>}
        extra={
          user?.role === 'owner' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/demands/create')}>
              发布新需求
            </Button>
          )
        }
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="按状态筛选"
            style={{ width: 160 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || '')}
          >
            <Option value="pending">待匹配</Option>
            <Option value="matched">已匹配</Option>
            <Option value="signed">已签约</Option>
            <Option value="in_progress">施工中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Input
            placeholder="搜索城市、区域、地址、业主"
            style={{ width: 320 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Button onClick={fetchDemands}>刷新</Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredData}
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </div>
  );
};

export default DemandList;
