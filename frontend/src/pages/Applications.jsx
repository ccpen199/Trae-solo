import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Badge, Select, Space, Row, Col, Statistic, Modal, Rate, Input, message, Progress, Tabs, Empty } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StarOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  pending: { color: 'default', text: '待提交', icon: <ClockCircleOutlined /> },
  submitted: { color: 'processing', text: '审核中', icon: <ClockCircleOutlined /> },
  processing: { color: 'warning', text: '办理中', icon: <ClockCircleOutlined /> },
  completed: { color: 'success', text: '已办结', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', text: '已驳回', icon: <ExclamationCircleOutlined /> }
};

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('');
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    loadApplications();
  }, [status]);

  const loadApplications = async (filterStatus = '') => {
    try {
      let url = '/applications';
      if (filterStatus) url += `?status=${filterStatus}`;
      setApplications(await api.get(url));
    } catch (e) {}
  };

  const handleRate = (app) => {
    setSelectedApp(app);
    setRatingValue(app.rating || 5);
    setFeedbackText(app.feedback || '');
    setRateModalVisible(true);
  };

  const submitRate = async () => {
    if (!selectedApp) return;
    try {
      await api.post(`/applications/${selectedApp.id}/rating`, {
        rating: ratingValue,
        feedback: feedbackText
      });
      message.success('评价提交成功');
      setRateModalVisible(false);
      loadApplications(status);
    } catch (e) {
      message.error('评价失败');
    }
  };

  const pendingCount = applications.filter(a => ['submitted', 'processing'].includes(a.status)).length;
  const completedCount = applications.filter(a => a.status === 'completed').length;
  const unratedCount = applications.filter(a => a.status === 'completed' && !a.rating).length;

  const getOverdueTag = (app) => {
    if (['completed', 'rejected'].includes(app.status)) return null;
    const created = new Date(app.created_at);
    const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 7) return <Tag color="red"><WarningOutlined /> 超时{days}天</Tag>;
    return null;
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="办理中" value={pendingCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="已办结" value={completedCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="待评价" value={unratedCount} prefix={<StarOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="我的办件"
        extra={
          <Select placeholder="全部状态" style={{ width: 150 }} onChange={setStatus} allowClear>
            <Option value="submitted">审核中</Option>
            <Option value="processing">办理中</Option>
            <Option value="completed">已办结</Option>
            <Option value="rejected">已驳回</Option>
          </Select>
        }
      >
        {applications.length > 0 ? (
          <List
            dataSource={applications}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '16px', border: '1px solid #f0f0f0', marginBottom: '12px', borderRadius: '8px' }}
                actions={[
                  getOverdueTag(item),
                  item.status === 'completed' && !item.rating && (
                    <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleRate(item); }}>
                      评价
                    </Button>
                  ),
                  item.status === 'completed' && item.rating && (
                    <Tag color="gold"><StarOutlined /> {item.rating}星</Tag>
                  ),
                  <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/applications/${item.id}`); }}>
                    详情
                  </Button>
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span style={{ fontSize: 15, fontWeight: 'bold' }}>{item.service_name}</span>
                      <Badge status={statusMap[item.status]?.color} text={statusMap[item.status]?.text} />
                      {getOverdueTag(item)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <div>申请编号：{item.application_no}</div>
                      <div style={{ color: '#999' }}>提交时间：{item.created_at}</div>
                      {item.status === 'processing' && (
                        <div>
                          <span style={{ fontSize: 12, color: '#666' }}>办理进度：</span>
                          <Progress percent={60} size="small" style={{ width: 200 }} />
                        </div>
                      )}
                      {item.rating && (
                        <Space>
                          <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                          {item.feedback && <span style={{ fontSize: 12, color: '#999' }}>{item.feedback}</span>}
                        </Space>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无办件记录">
            <Button type="primary" onClick={() => navigate('/services')}>去办事</Button>
          </Empty>
        )}
      </Card>

      <Modal
        title="评价办件"
        open={rateModalVisible}
        onCancel={() => setRateModalVisible(false)}
        onOk={submitRate}
        okText="提交评价"
      >
        {selectedApp && (
          <div>
            <p><strong>服务事项：</strong>{selectedApp.service_name}</p>
            <p><strong>申请编号：</strong>{selectedApp.application_no}</p>
            <div style={{ margin: '16px 0' }}>
              <p>满意度评分：</p>
              <Rate value={ratingValue} onChange={setRatingValue} />
            </div>
            <div>
              <p>评价意见：</p>
              <TextArea rows={4} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="请输入您的评价和建议" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Applications;
