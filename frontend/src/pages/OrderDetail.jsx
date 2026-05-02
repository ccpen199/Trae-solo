import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, message, Typography, Timeline, Input, Select, Divider, List, Popconfirm, Row, Col, Statistic } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CarOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_NAMES, STATUS_COLORS, ORDER_STATUS, formatDuration, formatDistance } from '../utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getById(id);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAction = async (action, data = {}) => {
    setActionLoading(action);
    try {
      let response;
      const actionData = {
        ...data,
        userName: user?.name,
        userRole: user?.role,
      };

      switch (action) {
        case 'submitLocation':
          response = await orderApi.submitLocation(id, actionData);
          break;
        case 'planRoute':
          response = await orderApi.planRoute(id, actionData);
          break;
        case 'approveRoute':
          response = await orderApi.approveRoute(id, actionData);
          break;
        case 'rejectRoute':
          response = await orderApi.rejectRoute(id, actionData);
          break;
        case 'startNavigation':
          response = await orderApi.startNavigation(id, actionData);
          break;
        case 'submitTrack':
          response = await orderApi.submitTrack(id, {
            lat: order.current_lat || order.origin_lat,
            lng: order.current_lng || order.origin_lng,
            accuracy: 10,
            source: 'MOCK',
            ...actionData,
          });
          break;
        case 'confirmArrival':
          response = await orderApi.confirmArrival(id, {
            forceConfirm: true,
            ...actionData,
          });
          break;
        case 'cancel':
          response = await orderApi.cancel(id, actionData);
          break;
        default:
          return;
      }

      if (response.data.success) {
        message.success('操作成功');
        fetchOrder();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = () => {
    if (!order) return null;

    const { status } = order;
    const actions = [];

    switch (status) {
      case ORDER_STATUS.PENDING_LOCATION:
        actions.push(
          <Button
            key="submitLocation"
            type="primary"
            icon={<EnvironmentOutlined />}
            loading={actionLoading === 'submitLocation'}
            onClick={() => handleAction('submitLocation', {
              origin_lat: order.origin_lat,
              origin_lng: order.origin_lng,
              origin_address: order.origin_address,
              dest_lat: order.dest_lat,
              dest_lng: order.dest_lng,
              dest_address: order.dest_address,
            })}
          >
            确认位置
          </Button>
        );
        break;

      case ORDER_STATUS.PENDING_ROUTE_PLAN:
        actions.push(
          <Button
            key="planRoute"
            icon={<ReloadOutlined />}
            loading={actionLoading === 'planRoute'}
            onClick={() => handleAction('planRoute')}
          >
            规划路线
          </Button>
        );
        actions.push(
          <Button
            key="approveRoute"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading === 'approveRoute'}
            onClick={() => handleAction('approveRoute')}
          >
            审批通过
          </Button>
        );
        actions.push(
          <Button
            key="rejectRoute"
            danger
            icon={<CloseCircleOutlined />}
            loading={actionLoading === 'rejectRoute'}
            onClick={() => handleAction('rejectRoute', { remark: '路线规划不通过' })}
          >
            驳回
          </Button>
        );
        break;

      case ORDER_STATUS.NAVIGATING:
        actions.push(
          <Button
            key="startNavigation"
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={actionLoading === 'startNavigation'}
            onClick={() => handleAction('startNavigation')}
          >
            开始导航
          </Button>
        );
        actions.push(
          <Button
            key="submitTrack"
            icon={<CarOutlined />}
            loading={actionLoading === 'submitTrack'}
            onClick={() => handleAction('submitTrack')}
          >
            提交轨迹
          </Button>
        );
        actions.push(
          <Button
            key="confirmArrival"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading === 'confirmArrival'}
            onClick={() => handleAction('confirmArrival')}
          >
            确认到达
          </Button>
        );
        break;

      case ORDER_STATUS.PENDING_TRACK_RECORD:
        actions.push(
          <Button
            key="submitTrack"
            icon={<CarOutlined />}
            loading={actionLoading === 'submitTrack'}
            onClick={() => handleAction('submitTrack')}
          >
            提交轨迹
          </Button>
        );
        actions.push(
          <Button
            key="confirmArrival"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={actionLoading === 'confirmArrival'}
            onClick={() => handleAction('confirmArrival')}
          >
            确认到达
          </Button>
        );
        break;
    }

    if (status !== ORDER_STATUS.ARRIVED && status !== ORDER_STATUS.CANCELLED) {
      actions.push(
        <Popconfirm
          key="cancel"
          title="确定要取消这个订单吗？"
          onConfirm={() => handleAction('cancel')}
          okText="确定"
          cancelText="取消"
        >
          <Button
            danger
            icon={<StopOutlined />}
            loading={actionLoading === 'cancel'}
          >
            取消订单
          </Button>
        </Popconfirm>
      );
    }

    return actions;
  };

  if (loading && !order) {
    return <Card loading={true} />;
  }

  if (!order) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">订单不存在</Text>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
        >
          返回列表
        </Button>
        <Tag color={STATUS_COLORS[order.status]}>
          {order.statusName}
        </Tag>
      </Space>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="订单信息"
            extra={<Space>{renderActions()}</Space>}
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLORS[order.status]}>
                  {order.statusName}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="起点" span={2}>
                {order.origin_address || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="起点坐标">
                {order.origin_lat && order.origin_lng 
                  ? `${order.origin_lat}, ${order.origin_lng}`
                  : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="终点" span={2}>
                {order.dest_address || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="终点坐标">
                {order.dest_lat && order.dest_lng 
                  ? `${order.dest_lat}, ${order.dest_lng}`
                  : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="当前位置">
                {order.current_lat && order.current_lng 
                  ? `${order.current_lat}, ${order.current_lng}`
                  : '未更新'}
              </Descriptions.Item>
              <Descriptions.Item label="路线距离">
                {order.route_distance ? formatDistance(order.route_distance) : '未规划'}
              </Descriptions.Item>
              <Descriptions.Item label="预计时间">
                {order.route_duration ? formatDuration(order.route_duration) : '未规划'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(order.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {order.routes && order.routes.length > 0 && (
            <Card title="路线信息" style={{ marginTop: 16 }}>
              <List
                dataSource={order.routes}
                renderItem={(route) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={route.is_selected ? 'blue' : 'default'}>
                            {route.is_selected ? '已选择' : '可选'}
                          </Tag>
                          {route.route_type}
                        </Space>
                      }
                      description={
                        <Space>
                          <Text>距离: {formatDistance(route.distance)}</Text>
                          <Text>时间: {formatDuration(route.duration)}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {order.timeAxis && order.timeAxis.length > 0 && (
            <Card title="时间轴" style={{ marginTop: 16 }}>
              <Timeline
                mode="left"
                items={order.timeAxis.map((item, index) => ({
                  key: index,
                  color: item.status_after === ORDER_STATUS.EXCEPTION ? 'red' : 
                         item.status_after === ORDER_STATUS.ARRIVED ? 'green' : 'blue',
                  children: (
                    <div>
                      <Text strong>{item.action_name}</Text>
                      <div>
                        <Text type="secondary" size="small">
                          操作人: {item.operator_name} ({item.operator_role})
                        </Text>
                      </div>
                      {item.remark && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">{item.remark}</Text>
                        </div>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" size="small">
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="统计信息" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="轨迹点数量"
                  value={order.tracks?.length || 0}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="路线数量"
                  value={order.routes?.length || 0}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            </Row>
          </Card>

          {order.tracks && order.tracks.length > 0 && (
            <Card title="最近轨迹" size="small" style={{ marginTop: 16 }}>
              <List
                size="small"
                dataSource={[...order.tracks].reverse().slice(0, 5)}
                renderItem={(track) => (
                  <List.Item>
                    <div>
                      <Text>
                        {track.lat?.toFixed(4)}, {track.lng?.toFixed(4)}
                      </Text>
                      <div>
                        <Text type="secondary" size="small">
                          {dayjs(track.created_at).format('HH:mm:ss')}
                          {track.is_drift === 1 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>漂移</Tag>
                          )}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OrderDetail;
