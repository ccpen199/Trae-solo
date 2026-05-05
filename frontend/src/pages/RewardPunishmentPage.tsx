import React from 'react';
import { Card, Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { rewardPunishmentApi } from '../services/api';
import type { RewardPunishment, RewardPunishmentType } from '../types';
import { RewardPunishmentTypeLabel } from '../types';
import dayjs from 'dayjs';

const RewardPunishmentPage: React.FC = () => {
  const [items, setItems] = React.useState<RewardPunishment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 20, total: 0 });

  React.useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await rewardPunishmentApi.getList({ page: pagination.current, pageSize: pagination.pageSize });
      setItems(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取奖惩列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await rewardPunishmentApi.delete(id);
      message.success('删除成功');
      fetchItems();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getTypeColor = (type: RewardPunishmentType) => {
    return type === 'REWARD' ? 'green' : 'red';
  };

  const columns = [
    {
      title: '员工',
      key: 'employee',
      render: (_: any, record: RewardPunishment) => record.employee?.name || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: RewardPunishmentType) => (
        <Tag color={getTypeColor(type)}>
          {RewardPunishmentTypeLabel[type]}
        </Tag>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => v || '-',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string) => v || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: RewardPunishment) => (
        <span style={{ color: record.type === 'REWARD' ? '#3f8600' : '#cf1322' }}>
          {record.type === 'REWARD' ? '+' : '-'}{amount}
        </span>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RewardPunishment) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>奖惩管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            新增奖惩
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default RewardPunishmentPage;
