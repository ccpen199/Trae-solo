import React from 'react';
import { Card, Table, Tag, Button, Space, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { todoApi } from '../api';
import { STEP_NAMES } from '../utils/constants';
import dayjs from 'dayjs';

const TodoList = () => {
  const navigate = useNavigate();
  const [todos, setTodos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await todoApi.getList({ limit: 100 });
        setTodos(res.data || []);
      } catch (error) {
        console.error('获取待办列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, []);

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '步骤',
      dataIndex: 'step',
      key: 'step',
      width: 120,
      render: (step) => (
        <Tag color="blue">{STEP_NAMES[step] || step}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'pending' ? 'warning' : status === 'completed' ? 'success' : 'default'}>
          {status === 'pending' ? '待处理' : status === 'completed' ? '已完成' : status}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        const colors = { high: 'red', normal: 'orange', low: 'blue' };
        const names = { high: '高', normal: '中', low: '低' };
        return <Tag color={colors[priority] || 'default'}>{names[priority] || priority}</Tag>;
      },
    },
    {
      title: '截止时间',
      dataIndex: 'due_time',
      key: 'due_time',
      width: 160,
      render: (time) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/orders/${record.main_order_id}`)}>
            查看工单
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              onClick={async () => {
                try {
                  await todoApi.complete(record.id);
                  setTodos((prev) =>
                    prev.map((item) =>
                      item.id === record.id ? { ...item, status: 'completed' } : item
                    )
                  );
                } catch (error) {
                  console.error('完成待办失败:', error);
                }
              }}
            >
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">我的待办</div>

      <Card className="page-card">
        <Table
          columns={columns}
          dataSource={todos}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div>暂无待办任务</div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default TodoList;
