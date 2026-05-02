import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, message, Modal, Form, Input, Space } from 'antd';
import { TaskUnit, TaskStatus } from '../../types';
import api from '../../utils/api';

const { TextArea } = Input;

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'blue',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.DELIVERED]: 'orange',
  [TaskStatus.QUALIFIED]: 'success',
  [TaskStatus.SETTLED]: 'green',
  [TaskStatus.DISQUALIFIED]: 'error',
  [TaskStatus.REVIEWING]: 'processing',
  [TaskStatus.PENDING_REVIEW]: 'warning',
  [TaskStatus.APPEALING]: 'warning',
  [TaskStatus.DRAFT]: 'default',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待领取',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.DELIVERED]: '已交付',
  [TaskStatus.QUALIFIED]: '合格',
  [TaskStatus.SETTLED]: '已结算',
  [TaskStatus.DISQUALIFIED]: '不合格',
  [TaskStatus.REVIEWING]: '审核中',
  [TaskStatus.PENDING_REVIEW]: '待复核',
  [TaskStatus.APPEALING]: '申诉中',
  [TaskStatus.DRAFT]: '草稿',
};

const TaskHall: React.FC = () => {
  const [tasks, setTasks] = useState<TaskUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskUnit | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workers/tasks/available');
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (task: TaskUnit) => {
    try {
      await api.post(`/workers/tasks/${task.id}/assign`);
      message.success('任务领取成功');
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '领取失败');
    }
  };

  const handleDeliver = async (values: any) => {
    if (!selectedTask) return;
    
    try {
      const deviceFingerprint = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await api.post('/tasks/deliver', {
        task_unit_id: selectedTask.id,
        delivery_data: values.delivery_data,
        device_fingerprint: deviceFingerprint,
      });
      
      message.success('任务交付成功');
      setDeliverModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '交付失败');
    }
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '批次ID',
      dataIndex: 'batch_id',
      key: 'batch_id',
      width: 80,
    },
    {
      title: '任务内容',
      dataIndex: 'task_data',
      key: 'task_data',
      width: 300,
      ellipsis: true,
    },
    {
      title: '佣金',
      dataIndex: 'reward',
      key: 'reward',
      width: 100,
      render: (reward: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{reward}</span>,
    },
    {
      title: '最低等级',
      dataIndex: 'min_worker_level',
      key: 'min_worker_level',
      width: 100,
      render: (level: number) => `Lv.${level}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: TaskUnit) => (
        <Space>
          <Button type="primary" onClick={() => handleAssign(record)}>
            领取任务
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>任务大厅</h1>
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="交付任务"
        open={deliverModalVisible}
        onCancel={() => setDeliverModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleDeliver}>
          <Form.Item
            name="delivery_data"
            label="交付内容"
            rules={[{ required: true, message: '请输入交付内容' }]}
          >
            <TextArea rows={8} placeholder="请输入任务交付内容..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认交付
              </Button>
              <Button onClick={() => setDeliverModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskHall;
