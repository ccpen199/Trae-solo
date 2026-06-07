import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Switch, Space, Modal, Form, Input,
  Select, Alert, Row, Col, Badge, message, Spin, List, Avatar,
  Statistic, Progress, Typography, Divider,
} from 'antd';
import {
  SwapOutlined, ThunderboltOutlined, WarningOutlined,
  EnvironmentOutlined, UserOutlined, StarOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SafetyCertificateOutlined, SendOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI, dispatchAPI } from '../../api';

const { Text, Title } = Typography;

const statusMap = {
  pending: { text: '待接单', color: 'orange' },
  dispatched: { text: '已调度', color: 'blue' },
  accepted: { text: '已接单', color: 'cyan' },
  in_progress: { text: '进行中', color: 'processing' },
  timeout: { text: '超时', color: 'volcano' },
};

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

const priorityMap = {
  0: { text: '普通', color: 'default' },
  1: { text: '加急', color: 'orange' },
  2: { text: '特急', color: 'red' },
};

export default function DispatchCenter() {
  const [queue, setQueue] = useState([]);
  const [timeoutAlerts, setTimeoutAlerts] = useState([]);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dispatchModal, setDispatchModal] = useState({ visible: false, order: null });
  const [dispatchForm] = Form.useForm();
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [dispatchNote, setDispatchNote] = useState('');
  const [districtHeat, setDistrictHeat] = useState([]);
  const [dispatching, setDispatching] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDispatchQueue();
      const data = res.data || res;
      setQueue(data.queue || []);
      setTimeoutAlerts(data.timeout_alerts || []);
      setDistrictHeat(data.district_heat || []);
    } catch {
      setQueue([]);
      setTimeoutAlerts([]);
      setDistrictHeat([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAuto = async (checked) => {
    try {
      await adminAPI.toggleAutoDispatch({ enabled: checked });
      setAutoDispatch(checked);
      message.success(checked ? '自动调度已开启' : '自动调度已关闭');
    } catch {}
  };

  const loadCandidates = async (orderId) => {
    setCandidatesLoading(true);
    try {
      const res = await adminAPI.getDispatchCandidates(orderId);
      const data = res.data || res;
      setCandidates(data.candidates || []);
      setOrderInfo({
        order_id: data.order_id,
        order_no: data.order_no,
        pickup_address: data.pickup_address,
      });
    } catch {
      setCandidates([]);
      setOrderInfo(null);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const openDispatchModal = (order) => {
    setDispatchModal({ visible: true, order });
    setSelectedCourier(null);
    setDispatchNote('');
    loadCandidates(order.id);
  };

  const handleManualDispatch = async () => {
    if (!selectedCourier) {
      message.warning('请选择跑腿员');
      return;
    }
    setDispatching(true);
    try {
      await dispatchAPI.manualDispatch({
        order_id: dispatchModal.order.id,
        courier_id: selectedCourier.id,
        note: dispatchNote,
      });
      message.success(`已成功分配给 ${selectedCourier.name}，通知已发送`);
      setDispatchModal({ visible: false, order: null });
      dispatchForm.resetFields();
      setSelectedCourier(null);
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || '分配失败');
    } finally {
      setDispatching(false);
    }
  };

  const getAreaStatus = (heatLevel, pendingOrders) => {
    if (pendingOrders >= 10 || heatLevel >= 4) return 'busy';
    if (pendingOrders === 0) return 'idle';
    return 'active';
  };

  const getAreaStyle = (status) => {
    if (status === 'busy') return {
      background: '#fff2e8',
      borderColor: '#ffd591',
    };
    if (status === 'idle') return {
      background: '#f6ffed',
      borderColor: '#b7eb8f',
    };
    return {
      background: '#e6f7ff',
      borderColor: '#91d5ff',
    };
  };

  const handleAutoDispatch = async (order) => {
    try {
      await dispatchAPI.autoDispatch(order.id);
      message.success('自动调度成功');
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || '自动调度失败');
    }
  };

  const queueColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 150 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (v) => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.text || '普通'}</Tag>,
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>,
    },
    { title: '费用', dataIndex: 'fee', key: 'fee', width: 80, render: (v) => `¥${v}` },
    {
      title: '操作', key: 'actions', width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleAutoDispatch(record)}
          >
            自动
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => openDispatchModal(record)}
          >
            手动分配
          </Button>
        </Space>
      ),
    },
  ];

  const renderCandidateScore = (c) => {
    const details = c.score_details || {};
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
          综合评分: <Text strong>{Math.round(c.score)} 分</Text>
        </div>
        {details.distanceScore != null && (
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>距离 {Math.round(details.distanceScore)}%</Text>
            <Progress percent={Math.round(details.distanceScore)} showInfo={false} size="small" strokeColor="#1890ff" />
          </div>
        )}
        {details.fulfillmentScore != null && (
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>履约率 {Math.round(details.fulfillmentScore)}%</Text>
            <Progress percent={Math.round(details.fulfillmentScore)} showInfo={false} size="small" strokeColor="#52c41a" />
          </div>
        )}
        {details.ratingScore != null && (
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>评分 {Math.round(details.ratingScore)}%</Text>
            <Progress percent={Math.round(details.ratingScore)} showInfo={false} size="small" strokeColor="#faad14" />
          </div>
        )}
        {details.idleScore != null && (
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>空闲 {Math.round(details.idleScore)}%</Text>
            <Progress percent={Math.round(details.idleScore)} showInfo={false} size="small" strokeColor="#722ed1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Card
        title="调度中心"
        extra={
          <Space>
            <span>自动调度</span>
            <Switch checked={autoDispatch} onChange={handleToggleAuto} />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card type="inner" title="调度队列" size="small" extra={
              <Space size={16}>
                <Statistic title="待调度" value={queue.length} valueStyle={{ fontSize: 14, color: '#fa8c16' }} />
                <Statistic title="超时" value={timeoutAlerts.length} valueStyle={{ fontSize: 14, color: '#f5222d' }} />
              </Space>
            }>
              <Table
                columns={queueColumns}
                dataSource={queue}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
                locale={{ emptyText: '暂无待调度订单' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card type="inner" title="实时区域视图" size="small" style={{ marginBottom: 16 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}>
                {districtHeat.length > 0 ? districtHeat.map((area, idx) => {
                  const status = getAreaStatus(area.heat_level, area.pending_orders);
                  const style = getAreaStyle(status);
                  return (
                    <div
                      key={area.district || idx}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        textAlign: 'center',
                        border: `1px solid ${style.borderColor}`,
                        background: style.background,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                        <EnvironmentOutlined /> {area.district}
                      </div>
                      <div>
                        <Tag color="blue">{area.pending_orders || 0}单</Tag>
                        <Tag color="green">{area.active_couriers || 0}人</Tag>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ gridColumn: '1 / -1', padding: 20, textAlign: 'center', color: '#999' }}>
                    暂无区域数据
                  </div>
                )}
              </div>
            </Card>

            {timeoutAlerts.length > 0 && (
              <Card type="inner" title="超时预警" size="small">
                {timeoutAlerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    message={`${alert.order_no} - ${alert.title || ''}`}
                    description={`已超时 ${alert.timeout_minutes} 分钟 | 跑腿员: ${alert.courier || '未分配'}`}
                    type="error"
                    showIcon
                    action={
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={() => handleAutoDispatch(alert)}
                        >
                          自动转派
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => openDispatchModal(alert)}
                        >
                          手动
                        </Button>
                      </Space>
                    }
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </Card>
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <SwapOutlined />
            <span>分配订单</span>
            {orderInfo && <Tag color="blue">{orderInfo.order_no}</Tag>}
          </Space>
        }
        open={dispatchModal.visible}
        onCancel={() => {
          setDispatchModal({ visible: false, order: null });
          dispatchForm.resetFields();
          setSelectedCourier(null);
        }}
        width={820}
        footer={
          <Space>
            <Button onClick={() => setDispatchModal({ visible: false, order: null })}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={dispatching}
              onClick={handleManualDispatch}
              disabled={!selectedCourier}
            >
              确认分配并通知
            </Button>
          </Space>
        }
      >
        {candidatesLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : orderInfo ? (
          <div>
            <Alert
              message={orderInfo.pickup_address}
              description={`订单: ${orderInfo.order_no} | ${dispatchModal.order?.title || ''}`}
              type="info"
              showIcon
              icon={<EnvironmentOutlined />}
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>
                可选跑腿员 <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>(共 {candidates.length} 人，按综合评分排序)</Text>
              </Title>
            </div>

            {candidates.length > 0 ? (
              <List
                dataSource={candidates}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{
                      border: selectedCourier?.id === item.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      borderRadius: 8,
                      marginBottom: 8,
                      padding: '12px 16px',
                      background: selectedCourier?.id === item.id ? '#e6f7ff' : '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedCourier(item)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: item.is_available ? '#52c41a' : '#bfbfbf',
                          }}
                          icon={<UserOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.name}</Text>
                          {item.is_available ? (
                            <Tag color="green"><CheckCircleOutlined /> 空闲</Tag>
                          ) : item.is_online ? (
                            <Tag color="orange">忙碌 ({item.current_orders}单)</Tag>
                          ) : (
                            <Tag color="default"><CloseCircleOutlined /> 离线</Tag>
                          )}
                          <Tag color="purple">{Math.round(item.score)}分</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Space wrap size={[12, 4]} style={{ marginBottom: 8 }}>
                            <span><EnvironmentOutlined /> {item.distance_km != null ? `${item.distance_km} km` : '位置未知'}</span>
                            <span><StarOutlined style={{ color: '#faad14' }} /> {item.rating ? item.rating.toFixed(1) : '-'}</span>
                            <span><SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 履约 {item.fulfillment_rate}%</span>
                            <span><CheckCircleOutlined style={{ color: '#1890ff' }} /> {item.completed_orders}单</span>
                            <span><ClockCircleOutlined /> 信用 {item.credit_score}</span>
                            {item.service_area && <span>服务: {item.service_area}</span>}
                          </Space>
                          {renderCandidateScore(item)}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Alert message="暂无可用跑腿员" type="warning" showIcon />
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Form layout="vertical">
              <Form.Item label="调度备注">
                <Input.TextArea
                  rows={2}
                  placeholder="请输入调度备注（可选），将通知给跑腿员"
                  value={dispatchNote}
                  onChange={(e) => setDispatchNote(e.target.value)}
                />
              </Form.Item>
            </Form>

            {selectedCourier && (
              <Alert
                message={`将分配给 ${selectedCourier.name}`}
                description={`距离 ${selectedCourier.distance_km}km，评分 ${selectedCourier.rating?.toFixed(1)}，履约率 ${selectedCourier.fulfillment_rate}%。分配后将实时推送通知给跑腿员和需求方。`}
                type="success"
                showIcon
              />
            )}
          </div>
        ) : (
          <Alert message="加载失败，请重试" type="error" showIcon />
        )}
      </Modal>
    </div>
  );
}
