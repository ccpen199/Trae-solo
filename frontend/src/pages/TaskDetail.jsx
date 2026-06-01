import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined, FileDoneOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [startModal, setStartModal] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then(res => res.json())
      .then(data => setTask(data));
  }, [id]);

  const handleStart = () => {
    fetch(`/api/tasks/${id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('任务已开始');
          setStartModal(false);
          fetch(`/api/tasks/${id}`)
            .then(res => res.json())
            .then(data => setTask(data));
        }
      });
  };

  const handleSubmit = () => {
    fetch(`/api/tasks/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('已提交复查');
          setSubmitModal(false);
          fetch(`/api/tasks/${id}`)
            .then(res => res.json())
            .then(data => setTask(data));
        }
      });
  };

  const handleReview = (values) => {
    fetch(`/api/tasks/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('复查完成');
          setReviewModal(false);
          reviewForm.resetFields();
          fetch(`/api/tasks/${id}`)
            .then(res => res.json())
            .then(data => setTask(data));
        }
      });
  };

  const handleClose = () => {
    fetch(`/api/tasks/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('任务已关闭');
          setCloseModal(false);
          fetch(`/api/tasks/${id}`)
            .then(res => res.json())
            .then(data => setTask(data));
        } else {
          message.error('未复查不能关闭任务');
        }
      });
  };

  const statusColors = {
    pending: 'default',
    in_progress: 'blue',
    for_review: 'orange',
    completed: 'green',
    rejected: 'red',
    closed: 'gray',
  };

  const statusText = {
    pending: '待开始',
    in_progress: '进行中',
    for_review: '待复查',
    completed: '已完成',
    rejected: '需整改',
    closed: '已关闭',
  };

  if (!task) return <div>加载中...</div>;

  const canStart = task.status === 'pending';
  const canSubmit = task.status === 'in_progress';
  const canReview = task.status === 'for_review';
  const canClose = task.status === 'completed' && task.review_result;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          返回列表
        </Button>
        <Tag color={statusColors[task.status]}>{statusText[task.status]}</Tag>
      </Space>

      <Card title="整改任务详情" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="任务编号">{task.task_code}</Descriptions.Item>
          <Descriptions.Item label="责任科室">{task.department_name}</Descriptions.Item>
          <Descriptions.Item label="负责人">{task.assignee_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="截止日期">{task.due_date}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{task.created_at}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{task.updated_at}</Descriptions.Item>
        </Descriptions>
        <Descriptions column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label="问题描述">{task.issue_description}</Descriptions.Item>
          <Descriptions.Item label="整改措施">{task.corrective_measures || '-'}</Descriptions.Item>
          {task.review_result && (
            <>
              <Descriptions.Item label="复查结果">{task.review_result}</Descriptions.Item>
              <Descriptions.Item label="复查人">{task.reviewed_by_name}</Descriptions.Item>
              <Descriptions.Item label="复查时间">{task.reviewed_at}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Space style={{ marginBottom: 16 }}>
        {canStart && (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => setStartModal(true)}>
            开始整改
          </Button>
        )}
        {canSubmit && (
          <Button type="primary" icon={<FileDoneOutlined />} onClick={() => setSubmitModal(true)}>
            提交复查
          </Button>
        )}
        {canReview && (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setReviewModal(true)}>
            复查确认
          </Button>
        )}
        {canClose && (
          <Button icon={<CloseCircleOutlined />} onClick={() => setCloseModal(true)}>
            关闭任务
          </Button>
        )}
      </Space>

      <Modal title="确认开始整改" open={startModal} onOk={handleStart} onCancel={() => setStartModal(false)}>
        <p>确认开始执行此整改任务？</p>
      </Modal>

      <Modal title="提交复查" open={submitModal} onOk={handleSubmit} onCancel={() => setSubmitModal(false)}>
        <p>确认整改已完成，提交复查？</p>
      </Modal>

      <Modal
        title="复查确认"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={null}
      >
        <Form form={reviewForm} onFinish={handleReview} layout="vertical">
          <Form.Item name="review_result" label="复查意见" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请填写复查意见" />
          </Form.Item>
          <Form.Item name="passed" label="复查结论" rules={[{ required: true }]}>
            <Select>
              <Option value={true}>通过</Option>
              <Option value={false}>不通过，需继续整改</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setReviewModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="关闭任务" open={closeModal} onOk={handleClose} onCancel={() => setCloseModal(false)}>
        <p>确认关闭此任务？关闭后不可重新打开。</p>
      </Modal>
    </div>
  );
}
