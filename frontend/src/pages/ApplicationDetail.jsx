import React, { useState, useEffect } from 'react';
import { Card, Steps, Descriptions, Button, Rate, Modal, message, Spin, Form, Input } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Step } = Steps;
const { TextArea } = Input;

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
      try {
        const data = await api.get(`/applications/${id}`);
        setApplication(data);
      } catch (err) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    };

  const handleRating = async (values) => {
      try {
        await api.post(`/applications/${id}/rating`, values);
        message.success('评价成功');
        setRatingModalVisible(false);
        loadApplication();
      } catch (err) {
        message.error('评价失败');
      }
    };

  if (loading) {
      return <Spin />;
    }

  const currentStep = application?.steps?.findIndex(s => s.status === 'pending') || application?.steps?.length;

  return (
    <div>
      <Card
        title="办件详情"
        extra={
          <Button onClick={() => navigate(-1)}>返回</Button>
        }
      >
        <Descriptions column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="服务名称">{application?.service_name}</Descriptions.Item>
          <Descriptions.Item label="申请编号">{application?.application_no}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{application?.created_at}</Descriptions.Item>
          <Descriptions.Item label="当前状态">{application?.status === 'completed' && (
            <span style={{ color: '#52c41a' }}>已完成</span>
          )}</Descriptions.Item>
        </Descriptions>

        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {application?.steps?.map((step, idx) => (
            <Step key={idx} title={step.step_name} description={step.handle_time} />
          ))}
        </Steps>

        {application?.status === 'completed' && !application?.rating === null && (
          <div style={{ textAlign: 'center', padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
            <p>请对本次服务进行评价</p>
            <Button type="primary" onClick={() => setRatingModalVisible(true)}>
              立即评价
            </Button>
          </div>
          )}

        {application?.rating !== null && (
          <div style={{ marginTop: 24 }}>
            <h4>我的评价</h4>
            <Rate disabled value={application?.rating} />
            {application?.feedback && (
              <p style={{ marginTop: 8, color: '#666' }}>{application?.feedback}</p>
            )}
          </div>
        )}
      </Card>

      <Modal
        title="服务评价"
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleRating}>
          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="feedback"
            label="评价内容"
          >
            <TextArea rows={4} placeholder="请输入您的评价..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              提交评价
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ApplicationDetail;
