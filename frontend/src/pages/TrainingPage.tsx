import React from 'react';
import { Card, Table, Tag, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { trainingApi } from '../services/api';
import type { Training } from '../types';
import dayjs from 'dayjs';

const TrainingPage: React.FC = () => {
  const [trainings, setTrainings] = React.useState<Training[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 20, total: 0 });

  React.useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const result = await trainingApi.getList({ page: pagination.current, pageSize: pagination.pageSize });
      setTrainings(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取培训列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await trainingApi.delete(id);
      message.success('删除成功');
      fetchTrainings();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '培训名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '员工',
      key: 'employee',
      render: (_: any, record: Training) => record.employee?.name || '-',
    },
    {
      title: '培训机构',
      dataIndex: 'provider',
      key: 'provider',
      render: (v: string) => v || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '时长(小时)',
      dataIndex: 'duration',
      key: 'duration',
      render: (v: number) => v || '-',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Training) => (
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
      <h2 style={{ marginBottom: 24 }}>培训管理</h2>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />}>
            新增培训
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={trainings}
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

export default TrainingPage;
