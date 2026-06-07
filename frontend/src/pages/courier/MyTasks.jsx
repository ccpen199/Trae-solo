import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Tag, Button, Empty, Spin, Row, Col, Typography,
  Modal, Form, Input, message, Upload,
} from 'antd';
import {
  EnvironmentOutlined, CheckCircleOutlined, PlayCircleOutlined,
  CameraOutlined, FileTextOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const statusMap = {
  accepted: { text: '已接单', color: 'cyan' },
  arrived: { text: '已上门', color: 'geekblue' },
  in_progress: { text: '进行中', color: 'processing' },
  completed: { text: '已完成', color: 'green' },
};

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

export default function MyTasks() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('in_progress');
  const [actionModal, setActionModal] = useState({ visible: false, order: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchTasks = async (status = activeTab) => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'in_progress') params.status = 'completed';
      else params.status = 'in_progress';
      const res = await orderAPI.getMyTasks(params);
      const data = res.data || res;
      setOrders(data.orders || data.list || data.items || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const handleAction = async (values) => {
    const { order, action } = actionModal;
    setActionLoading(true);
    try {
      const data = { ...values };
      if (values.photos) {
        data.photos = values.photos.fileList?.map((f) => f.thumbUrl || f.url).filter(Boolean) || [];
      }
      await orderAPI[action](order.id, data);
      message.success('操作成功');
      setActionModal({ visible: false, order: null, action: null });
      form.resetFields();
      fetchTasks();
    } catch {
    } finally {
      setActionLoading(false);
    }
  };

  const getActions = (order) => {
    const actions = [];
    if (order.status === 'accepted') {
      actions.push(
        <Button
          type="primary"
          size="small"
          icon={<EnvironmentOutlined />}
          onClick={() => setActionModal({ visible: true, order, action: 'arrive' })}
        >
          上门打卡
        </Button>
      );
    }
    if (order.status === 'arrived') {
      actions.push(
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => setActionModal({ visible: true, order, action: 'start' })}
        >
          开始服务
        </Button>
      );
    }
    if (order.status === 'in_progress') {
      actions.push(
        <Button
          size="small"
          icon={<CameraOutlined />}
          onClick={() => navigate(`/courier/checkin/${order.id}`)}
        >
          上传追踪
        </Button>,
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => setActionModal({ visible: true, order, action: 'complete' })}
        >
          完成确认
        </Button>
      );
    }
    return actions;
  };

  const actionLabels = {
    arrive: '上门打卡',
    start: '开始服务',
    complete: '完成确认',
  };

  return (
    <div>
      <Card title="我的任务">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            fetchTasks(key);
          }}
          items={[
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ]}
        />

        <Spin spinning={loading}>
          {orders.length === 0 && !loading ? (
            <Empty description="暂无任务" />
          ) : (
            <Row gutter={[16, 16]}>
              {orders.map((order) => (
                <Col xs={24} sm={12} lg={8} key={order.id}>
                  <Card
                    size="small"
                    title={
                      <span>
                        <Tag color={typeMap[order.type]?.color}>{typeMap[order.type]?.text}</Tag>
                        <Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.text}</Tag>
                      </span>
                    }
                  >
                    <Paragraph ellipsis={{ rows: 1 }} strong>{order.title}</Paragraph>
                    <div style={{ marginBottom: 4 }}>
                      <EnvironmentOutlined style={{ marginRight: 4, color: '#999' }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {order.pickup_address || order.queue_location || '-'}
                      </Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="warning" strong>¥{order.fee}</Text>
                      {order.reward > 0 && <Tag color="red" style={{ marginLeft: 8 }}>+¥{order.reward}</Tag>}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <ClockCircleOutlined style={{ marginRight: 4, color: '#999' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(order.created_at).format('MM-DD HH:mm')}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {getActions(order)}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>

      <Modal
        title={actionLabels[actionModal.action] || '操作'}
        open={actionModal.visible}
        onCancel={() => {
          setActionModal({ visible: false, order: null, action: null });
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleAction}>
          <Form.Item name="photos" label="拍照上传">
            <Upload
              listType="picture-card"
              maxCount={3}
              beforeUpload={() => false}
            >
              <div>
                <CameraOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item name="location" label="当前位置">
            <Input prefix={<EnvironmentOutlined />} placeholder="自动获取位置" disabled />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
