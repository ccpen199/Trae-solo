import React, { useState } from 'react';
import { Table, Card, Tag, Button, Space, Input, Select, Modal, Form, InputNumber, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { accountApi, orderApi } from '../services/api';
import { GameAccount, AccountStatus } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const AccountList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'APPROVED',
    gameName: undefined as string | undefined,
    keyword: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GameAccount | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
        status: filters.status,
      };
      if (filters.gameName) params.gameName = filters.gameName;
      const response = await accountApi.getList(params);
      return response.data;
    },
  });

  const { data: gameNamesData } = useQuery({
    queryKey: ['gameNames'],
    queryFn: async () => {
      const response = await accountApi.getGameNames();
      return response.data.data;
    },
  });

  const buyMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await orderApi.create(accountId);
      return response.data;
    },
    onSuccess: () => {
      message.success('下单成功，请前往订单管理查看');
      setBuyModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '下单失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await accountApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除失败');
    },
  });

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: GameAccount) => (
        <Space>
          {record.isTop && <Tag color="orange">置顶</Tag>}
          {record.isHot && <Tag color="red">热门</Tag>}
          <a onClick={() => navigate(`/accounts/${record.id}`)}>{text}</a>
        </Space>
      ),
    },
    {
      title: '游戏',
      dataIndex: 'gameName',
      key: 'gameName',
      width: 120,
    },
    {
      title: '服务器',
      dataIndex: 'gameServer',
      key: 'gameServer',
      width: 100,
    },
    {
      title: '等级',
      dataIndex: 'accountLevel',
      key: 'accountLevel',
      width: 80,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number, record: GameAccount) => (
        <Space>
          <strong style={{ color: '#ff4d4f', fontSize: 16 }}>¥{price}</strong>
          {record.originalPrice && (
            <span style={{ color: '#999', textDecoration: 'line-through' }}>
              ¥{record.originalPrice}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AccountStatus) => {
        const colorMap: Record<AccountStatus, string> = {
          PENDING_REVIEW: 'orange',
          REVIEWING: 'processing',
          APPROVED: 'success',
          REJECTED: 'error',
          SOLD: 'default',
          REMOVED: 'default',
        };
        const statusText: Record<AccountStatus, string> = {
          PENDING_REVIEW: '待审核',
          REVIEWING: '审核中',
          APPROVED: '已上架',
          REJECTED: '已拒绝',
          SOLD: '已售出',
          REMOVED: '已下架',
        };
        return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
      },
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: GameAccount) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/accounts/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'APPROVED' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedAccount(record);
                setBuyModalVisible(true);
              }}
            >
              购买
            </Button>
          )}
          {record.status === 'PENDING_REVIEW' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除这个账号吗？',
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword, page: 1 }));
    refetch();
  };

  const handleStatusChange = (status: string | null) => {
    setFilters((prev) => ({ ...prev, status: status || undefined, page: 1 }));
  };

  const handleGameChange = (gameName: string | null) => {
    setFilters((prev) => ({ ...prev, gameName: gameName || undefined, page: 1 }));
  };

  const handleTableChange = (pagination: any) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleBuy = () => {
    if (selectedAccount) {
      buyMutation.mutate(selectedAccount.id);
    }
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Search
            placeholder="搜索账号标题"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150 }}
            onChange={handleStatusChange}
            value={filters.status}
          >
            <Option value="APPROVED">已上架</Option>
            <Option value="PENDING_REVIEW">待审核</Option>
            <Option value="SOLD">已售出</Option>
            <Option value="REJECTED">已拒绝</Option>
          </Select>
          <Select
            placeholder="选择游戏"
            allowClear
            style={{ width: 150 }}
            onChange={handleGameChange}
            showSearch
            optionFilterProp="children"
          >
            {gameNamesData?.map((game: { name: string; count: number }) => (
              <Option key={game.name} value={game.name}>
                {game.name} ({game.count})
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/publish')}
          >
            发布账号
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="确认购买"
        open={buyModalVisible}
        onOk={handleBuy}
        onCancel={() => setBuyModalVisible(false)}
        confirmLoading={buyMutation.isPending}
      >
        <div style={{ marginBottom: 16 }}>
          <p><strong>账号：</strong>{selectedAccount?.title}</p>
          <p><strong>价格：</strong><span style={{ color: '#ff4d4f', fontSize: 18 }}>¥{selectedAccount?.price}</span></p>
          <p style={{ color: '#999', fontSize: 12 }}>
            提示：下单后请在30分钟内完成支付，否则订单将自动取消
          </p>
        </div>
      </Modal>
    </Card>
  );
};

export default AccountList;
