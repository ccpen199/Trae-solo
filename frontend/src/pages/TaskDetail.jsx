import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Timeline, Tag, Space, Modal, Form, Input, Select, message, Descriptions } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, StopOutlined } from '@ant-design/icons';
import { crawlTasks } from '../api.js';

const TaskDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await crawlTasks.get(id);
      setTask(data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleWorkflowAction = (action) => {
    setCurrentAction(action);
    form.resetFields();
    setWorkflowModalVisible(true);
  };

  const handleSubmitAction = async () => {
    try {
      const values = await form.validateFields();
      await crawlTasks.workflow(id, {
        action: currentAction,
        operator: currentUser?.username || 'system',
        ...values
      });
      message.success('操作成功');
      setWorkflowModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      create: '创建',
      submit: '提交',
      execute: '执行',
      review: '复核',
      reject: '退回',
      close: '关闭'
    };
    return labels[action] || action;
  };

  const statusColors = {
    pending: 'default',
    queued: 'blue',
    running: 'processing',
    reviewing: 'orange',
    rejected: 'red',
    closed: 'default',
    completed: 'success',
    auto_block: 'red',
    manual_review: 'orange',
    observe: 'blue'
  };

  if (!task) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          返回列表
        </Button>
      </div>

      <Card title={`任务 #${task.id} - 详情`} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="任务类型">{task.task_type}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[task.status]}>{task.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="目标URL" span={2}>
            <a href={task.target_url} target="_blank" rel="noopener noreferrer">{task.target_url}</a>
          </Descriptions.Item>
          <Descriptions.Item label="创建人">{task.created_by}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{task.created_at}</Descriptions.Item>
          {task.error_message && (
            <Descriptions.Item label="错误信息" span={2} style={{ color: 'red' }}>
              {task.error_message}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title="工作流操作"
        extra={
          <Space>
            {task.status === 'pending' && (
              <Button type="primary" onClick={() => handleWorkflowAction('submit')}>
                提交
              </Button>
            )}
            {task.status === 'queued' && (
              <Button type="primary" onClick={() => handleWorkflowAction('execute')}>
                开始执行
              </Button>
            )}
            {task.status === 'running' && (
              <Space>
                <Button type="primary" onClick={() => handleWorkflowAction('review')}>
                  提交复核
                </Button>
                <Button danger onClick={() => handleWorkflowAction('reject')}>
                  退回
                </Button>
              </Space>
            )}
            {(task.status === 'reviewing' || task.status === 'manual_review') && (
              <Space>
                <Button type="primary" icon={<CheckOutlined />} onClick={() => handleWorkflowAction('close')}>
                  通过并关闭
                </Button>
                <Button danger icon={<CloseOutlined />} onClick={() => handleWorkflowAction('reject')}>
                  退回补正
                </Button>
              </Space>
            )}
            {!['closed', 'completed', 'rejected'].includes(task.status) && (
              <Button icon={<StopOutlined />} onClick={() => handleWorkflowAction('close')}>
                手动关闭
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Timeline>
          {task.workflow?.map((item, index) => (
            <Timeline.Item key={item.id}>
              <p>
                <strong>{getActionLabel(item.action)}</strong> - {item.operator}
                {item.new_status && <Tag style={{ marginLeft: 8 }}>{item.new_status}</Tag>}
              </p>
              {item.reason && <p style={{ color: '#666' }}>原因: {item.reason}</p>}
              <p style={{ color: '#999', fontSize: 12 }}>{item.created_at}</p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      <Modal
        title={currentAction === 'close' ? '关闭任务' : currentAction === 'reject' ? '退回补正' : '提交操作'}
        open={workflowModalVisible}
        onOk={handleSubmitAction}
        onCancel={() => setWorkflowModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="原因/备注">
            <Input.TextArea rows={4} placeholder="请输入原因说明" />
          </Form.Item>
          {currentAction === 'close' && (
            <Form.Item name="result" label="处理结果">
              <Select>
                <Select.Option value="auto_block">自动拦截</Select.Option>
                <Select.Option value="manual_review">人工复核通过</Select.Option>
                <Select.Option value="observe">继续观察</Select.Option>
                <Select.Option value="closed">已关闭</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetail;
