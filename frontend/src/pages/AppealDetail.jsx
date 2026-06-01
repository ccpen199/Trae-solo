import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, message, Typography, Modal, Form, Input } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { appealAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function AppealDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appeal, setAppeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [form] = Form.useForm();

  const isTeacher = user.role === 'teacher' || user.role === 'assistant';

  useEffect(() => {
    loadAppeal();
  }, [id]);

  const loadAppeal = async () => {
    setLoading(true);
    try {
      const response = await appealAPI.getById(id);
      setAppeal(response.data.appeal);
    } catch (error) {
      message.error('加载申诉详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    try {
      const values = await form.validateFields();
      await appealAPI.review(id, {
        status,
        teacherComment: values.teacherComment
      });
      message.success('审核完成');
      setReviewModalVisible(false);
      loadAppeal();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (!appeal) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/appeals')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>申诉详情</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="作业名称">{appeal.assignment_title}</Descriptions.Item>
          <Descriptions.Item label="提交版本">v{appeal.submission_version}</Descriptions.Item>
          <Descriptions.Item label="提交文件">{appeal.submission_file}</Descriptions.Item>
          <Descriptions.Item label="申诉状态">{getStatusTag(appeal.status)}</Descriptions.Item>
          {isTeacher && (
            <>
              <Descriptions.Item label="申诉学生">{appeal.student_name}</Descriptions.Item>
              <Descriptions.Item label="学生账号">{appeal.student_username}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="申诉时间">
            {dayjs(appeal.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {appeal.reviewed_at && (
            <>
              <Descriptions.Item label="审核时间">
                {dayjs(appeal.reviewed_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="审核人">{appeal.reviewer_name || '-'}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Card title="申诉原因" style={{ marginBottom: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {appeal.reason}
        </Paragraph>
      </Card>

      {appeal.teacher_comment && (
        <Card title="教师评语">
          <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {appeal.teacher_comment}
          </Paragraph>
        </Card>
      )}

      {isTeacher && appeal.status === 'pending' && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button
              type="primary"
              icon={<CloseOutlined />}
              onClick={() => {
                form.setFieldsValue({ teacherComment: '' });
                setReviewModalVisible(true);
              }}
            >
              驳回申诉
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              style={{ background: '#52c41a' }}
              onClick={() => {
                form.setFieldsValue({ teacherComment: '' });
                setReviewModalVisible(true);
              }}
            >
              通过申诉
            </Button>
          </Space>
        </div>
      )}

      <Modal
        title="审核申诉"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="teacherComment"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审核意见..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger onClick={() => handleReview('rejected')}>
                驳回
              </Button>
              <Button type="primary" style={{ background: '#52c41a' }} onClick={() => handleReview('approved')}>
                通过
              </Button>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AppealDetail;
