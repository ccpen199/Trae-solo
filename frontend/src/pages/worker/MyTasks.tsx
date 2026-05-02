import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, message, Modal, Form, Input, Space, Select, Tabs } from 'antd';
import { EyeOutlined, UploadOutlined, RollbackOutlined } from '@ant-design/icons';
import { TaskUnit, TaskStatus, TaskDelivery } from '../../types';
import api from '../../utils/api';

const { TextArea } = Input;
const { TabPane } = Tabs;

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

const MyTasks: React.FC = () => {
  const [inProgressTasks, setInProgressTasks] = useState<TaskUnit[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliverModalVisible, setDeliverModalVisible] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskUnit | null>(null);
  const [form] = Form.useForm();
  const [appealForm] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const inProgressResponse = await api.get('/workers/tasks/assigned', {
        params: { status: TaskStatus.IN_PROGRESS }
      });
      setInProgressTasks(inProgressResponse.data);

      const completedResponse = await api.get('/workers/tasks/assigned');
      const filtered = completedResponse.data.filter(
        (t: TaskUnit) => t.status !== TaskStatus.IN_PROGRESS && t.status !== TaskStatus.PENDING
      );
      setCompletedTasks(filtered);
    } catch (error) {
      console.error('获取任务列表失败', error);
    } finally {
      setLoading(false);
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

      message.success('任务交付成功！已进入防作弊检测流程');
      setDeliverModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '交付失败');
    }
  };

  const handleAppeal = async (values: any) => {
    if (!selectedTask) return;

    try {
      await api.post('/workers/appeals', {
        task_unit_id: selectedTask.id,
        reason: values.reason,
        evidence: values.evidence,
      });

      message.success('申诉已提交，管理员将尽快处理');
      setAppealModalVisible(false);
      appealForm.resetFields();
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '提交申诉失败');
    }
  };

  const openDeliverModal = (task: TaskUnit) => {
    setSelectedTask(task);
    setDeliverModalVisible(true);
  };

  const openAppealModal = (task: TaskUnit) => {
    setSelectedTask(task);
    setAppealModalVisible(true);
  };

  const inProgressColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
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
      render: (reward: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{reward}</span>
      ),
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
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => openDeliverModal(record)}
          >
            交付任务
          </Button>
          <Button icon={<RollbackOutlined />} onClick={() => handleRelease(record)}>
            放弃
          </Button>
        </Space>
      ),
    },
  ];

  const completedColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '任务内容',
      dataIndex: 'task_data',
      key: 'task_data',
      width: 250,
      ellipsis: true,
    },
    {
      title: '佣金',
      dataIndex: 'reward',
      key: 'reward',
      width: 100,
      render: (reward: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{reward}</span>
      ),
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
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: TaskUnit) => (
        <Space>
          {[TaskStatus.DISQUALIFIED, TaskStatus.PENDING_REVIEW].includes(record.status) && (
            <Button
              type="link"
              onClick={() => openAppealModal(record)}
            >
              提交申诉
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleRelease = async (task: TaskUnit) => {
    try {
      await api.post(`/workers/tasks/${task.id}/release`);
      message.success('任务已放弃');
      fetchTasks();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>我的任务</h1>

      <Tabs defaultActiveKey="inProgress">
        <TabPane
          tab={
            <span>
              进行中 <Tag color="processing">{inProgressTasks.length}</Tag>
            </span>
          }
          key="inProgress"
        >
          <Card>
            <Table
              columns={inProgressColumns}
              dataSource={inProgressTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: inProgressTasks.length === 0 
                  ? '暂无进行中的任务，去任务大厅领取任务吧！' 
                  : '加载中...'
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              已完成 <Tag color="success">{completedTasks.length}</Tag>
            </span>
          }
          key="completed"
        >
          <Card>
            <Table
              columns={completedColumns}
              dataSource={completedTasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="交付任务"
        open={deliverModalVisible}
        onCancel={() => setDeliverModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTask && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              padding: 12, 
              background: '#f5f5f5', 
              borderRadius: 6,
              marginBottom: 16 
            }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>任务详情</div>
              <div style={{ color: '#666', fontSize: 14 }}>
                任务ID: {selectedTask.id} | 佣金: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{selectedTask.reward}</span>
              </div>
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleDeliver}>
          <Form.Item
            name="delivery_data"
            label="交付内容"
            rules={[{ required: true, message: '请输入交付内容' }]}
          >
            <TextArea
              rows={8}
              placeholder="请输入任务交付结果，包括完成情况说明、相关数据等..."
              showCount
              maxLength={5000}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large">
                确认交付
              </Button>
              <Button onClick={() => setDeliverModalVisible(false)} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交申诉"
        open={appealModalVisible}
        onCancel={() => setAppealModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 6 }}>
          <div style={{ color: '#fa8c16', fontWeight: 500 }}>
            申诉说明
          </div>
          <div style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
            请详细说明申诉理由，管理员将查看任务全轨迹后进行终审。
          </div>
        </div>
        <Form form={appealForm} layout="vertical" onFinish={handleAppeal}>
          <Form.Item
            name="reason"
            label="申诉理由"
            rules={[{ required: true, message: '请输入申诉理由' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明您的申诉理由..."
              showCount
              maxLength={2000}
            />
          </Form.Item>
          <Form.Item
            name="evidence"
            label="证据说明（可选）"
          >
            <TextArea
              rows={3}
              placeholder="如有相关证据，请在此说明..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交申诉
              </Button>
              <Button onClick={() => setAppealModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyTasks;
