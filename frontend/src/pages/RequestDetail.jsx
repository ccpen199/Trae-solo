import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Space, Descriptions, Tag, Spin, message, Modal } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { getRequestDetail, acceptRequest, cancelRequest } from '../api/request';
import { getUser } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { confirm } = Modal;

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await getRequestDetail(id);
      setRequest(res.data);
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    confirm({
      title: '确认接单',
      content: '确认接受此辅导需求吗？接单后将生成订单，请及时联系学生',
      onOk: async () => {
        setActionLoading(true);
        try {
          const res = await acceptRequest(id);
          message.success('接单成功');
          navigate(`/order/${res.data.orderId}`);
        } catch (error) {
          console.error('接单失败:', error);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleCancel = () => {
    confirm({
      title: '取消需求',
      content: '确认取消此辅导需求吗？',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(true);
        try {
          await cancelRequest(id);
          message.success('取消成功');
          navigate('/');
        } catch (error) {
          console.error('取消失败:', error);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Typography.Text type="secondary">需求不存在</Typography.Text>
        </div>
      </div>
    );
  }

  const statusMap = {
    pending: { text: '待接单', color: 'orange' },
    accepted: { text: '已接单', color: 'blue' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <div className="page-title">辅导需求详情</div>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex-between" style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>{request.subject}</Title>
          <Tag color={statusMap[request.status]?.color}>
            {statusMap[request.status]?.text}
          </Tag>
        </div>

        <Descriptions column={1} bordered>
          <Descriptions.Item label="年级">{request.grade}</Descriptions.Item>
          <Descriptions.Item label="学生人数">{request.student_count}人</Descriptions.Item>
          <Descriptions.Item label="上课地点">
            <Space>
              <EnvironmentOutlined />
              {request.location}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="上课时间">
            <Space>
              <ClockCircleOutlined />
              {request.time}
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {user.role === 'teacher' && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
            <Title level={5} style={{ marginBottom: 16 }}>学生信息</Title>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="学生姓名">
                <Space>
                  <UserOutlined />
                  {request.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space>
                  <PhoneOutlined />
                  {request.phone}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: 'right', color: '#999', fontSize: 12 }}>
          发布时间: {dayjs(request.created_at).format('YYYY-MM-DD HH:mm')}
        </div>

        <div style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {user.role === 'teacher' && request.status === 'pending' && (
              <Button
                type="primary"
                size="large"
                block
                icon={<CheckOutlined />}
                loading={actionLoading}
                onClick={handleAccept}
              >
                接受需求并接单
              </Button>
            )}
            
            {user.role === 'student' && request.status === 'pending' && (
              <Button
                danger
                size="large"
                block
                icon={<CloseOutlined />}
                loading={actionLoading}
                onClick={handleCancel}
              >
                取消需求
              </Button>
            )}

            {request.status === 'accepted' && (
              <Button
                type="primary"
                size="large"
                block
                onClick={() => navigate('/orders')}
              >
                查看对应订单
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default RequestDetail;
