import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Typography, message } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { taskAPI } from '../services/api';
import { ClaimTask, TASK_STATUS_MAP, TASK_STATUS_COLOR } from '../types';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;

const LossList: React.FC = () => {
  const [tasks, setTasks] = useState<ClaimTask[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getTasks({ pageSize: 100 });
      setTasks(response.data.list || []);
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'task_no',
      key: 'task_no',
      width: 140,
    },
    {
      title: '事故地点',
      dataIndex: 'accident_location',
      key: 'accident_location',
      ellipsis: true,
    },
    {
      title: '车主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={TASK_STATUS_COLOR[status]}>{TASK_STATUS_MAP[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: ClaimTask) => (
        <Button
          type="primary"
          size="small"
          icon={<CalculatorOutlined />}
          onClick={() => navigate(`/loss/${record.id}`)}
        >
          录入损失
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>损失录入</Title>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default LossList;
