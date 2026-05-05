import React from 'react';
import { Card, Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { transferApi } from '../services/api';
import type { Transfer, TransferStatus } from '../types';
import { TransferStatusLabel } from '../types';
import dayjs from 'dayjs';

const TransferPage: React.FC = () => {
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 20, total: 0 });

  React.useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const result = await transferApi.getList({ page: pagination.current, pageSize: pagination.pageSize });
      setTransfers(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取调动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await transferApi.delete(id);
      message.success('删除成功');
      fetchTransfers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'orange';
    }
  };

  const columns = [
    {
      title: '员工',
      key: 'employee',
      render: (_: any, record: Transfer) => record.employee?.name || '-',
    },
    {
      title: '原部门',
      dataIndex: ['fromDepartment', 'name'],
      key: 'fromDept',
      render: (v: string) => v || '-',
    },
    {
      title: '原职位',
      dataIndex: 'fromPosition',
      key: 'fromPos',
      render: (v: string) => v || '-',
    },
    {
      title: '新部门',
      dataIndex: ['toDepartment', 'name'],
      key: 'toDept',
      render: (v: string) => v || '-',
    },
    {
      title: '新职位',
      dataIndex: 'toPosition',
      key: 'toPos',
      render: (v: string) => v || '-',
    },
    {
      title: '调动日期',
      dataIndex: 'transferDate',
      key: 'transferDate',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TransferStatus) => (
        <Tag color={getStatusColor(status)}>
          {TransferStatusLabel[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Transfer) => (
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
      <h2 style={{ marginBottom: 24 }}>调动管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            新增调动
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={transfers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default TransferPage;
