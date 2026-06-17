import React, { useState, useEffect } from 'react';
import { 
  Card, Tag, Button, Descriptions, Avatar, List, message, Modal, Form, Input, 
  Rate, Divider, Space, Alert, InputNumber, Select, Table, Progress, Statistic, Row, Col,
  Timeline, Upload, DatePicker, Steps
} from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  PhoneOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  SplitCellsOutlined,
  CarOutlined,
  RiseOutlined,
  FileTextOutlined,
  TeamOutlined,
  GoldOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined,
  EnvironmentFilled,
  SendOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import api from '../api';
import type { LaborOrder, Review, GpsTrack, InsuranceClaim, Dispute } from '../types';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const WORKER_SKILLS = ['水电工', '木工', '瓦工', '搬运工', '家政保洁', '油漆工', '电工', '管道工', '空调维修', '家电维修'];

interface SubOrderFormData {
  title: string;
  skills_required: string[];
  estimated_hours: number;
  price_per_hour: number;
  task_price: number;
  worker_id?: string;
}

interface AssignedWorker {
  id: string;
  name: string;
  avatar?: string;
  skills: string[];
  status: 'accepted' | 'pending' | 'rejected';
}

interface SelectionRecord {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_avatar?: string;
  action: 'accept' | 'reject';
  action_time: string;
  remark?: string;
}

function LaborOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<LaborOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gpsTracks, setGpsTracks] = useState<GpsTrack[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [assignedWorkers, setAssignedWorkers] = useState<AssignedWorker[]>([]);
  const [selectionRecords, setSelectionRecords] = useState<SelectionRecord[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<AssignedWorker | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrderFormData[]>([
    { title: '', skills_required: [], estimated_hours: 2, price_per_hour: 50, task_price: 0 }
  ]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [insuranceForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    fetchOrder();
    fetchReviews();
    loadMockData();
  }, [id]);

  const loadMockData = () => {
    const mockWorkers: AssignedWorker[] = [
      { id: '1', name: '张三', avatar: '', skills: ['水电工', '电工'], status: 'accepted' },
      { id: '2', name: '李四', avatar: '', skills: ['木工', '瓦工'], status: 'pending' },
      { id: '3', name: '王五', avatar: '', skills: ['搬运工'], status: 'rejected' },
    ];
    setAssignedWorkers(mockWorkers);
    setSelectedWorker(mockWorkers[0]);

    const mockRecords: SelectionRecord[] = [
      { id: '1', worker_id: '1', worker_name: '张三', action: 'accept', action_time: '2024-01-15 10:30:00', remark: '有时间，可以接单' },
      { id: '2', worker_id: '2', worker_name: '李四', action: 'accept', action_time: '2024-01-15 11:00:00', remark: '稍晚到，预计12点开始' },
      { id: '3', worker_id: '3', worker_name: '王五', action: 'reject', action_time: '2024-01-15 09:00:00', remark: '当天有事，无法接单' },
    ];
    setSelectionRecords(mockRecords);

    if (gpsTracks.length === 0) {
      const mockTracks: GpsTrack[] = [
        { id: '1', order_id: id || '', order_type: 'labor', user_id: '1', latitude: 31.2304, longitude: 121.4737, timestamp: '2024-01-15 08:00:00', speed: 0, heading: 0, accuracy: 5 },
        { id: '2', order_id: id || '', order_type: 'labor', user_id: '1', latitude: 31.2310, longitude: 121.4742, timestamp: '2024-01-15 08:15:00', speed: 15, heading: 45, accuracy: 5 },
        { id: '3', order_id: id || '', order_type: 'labor', user_id: '1', latitude: 31.2320, longitude: 121.4750, timestamp: '2024-01-15 08:30:00', speed: 20, heading: 60, accuracy: 5 },
        { id: '4', order_id: id || '', order_type: 'labor', user_id: '1', latitude: 31.2335, longitude: 121.4760, timestamp: '2024-01-15 08:45:00', speed: 18, heading: 30, accuracy: 5 },
        { id: '5', order_id: id || '', order_type: 'labor', user_id: '1', latitude: 31.2350, longitude: 121.4770, timestamp: '2024-01-15 09:00:00', speed: 0, heading: 0, accuracy: 5 },
      ];
      setGpsTracks(mockTracks);
    }
  };

  const fetchOrder = async () => {
    try {
      const data: any = await api.get(`/labor-orders/${id}`);
      setOrder(data as LaborOrder);
      if (data.gps_tracks) {
        setGpsTracks(data.gps_tracks);
      }
      if (data.insurance_claims) {
        setInsuranceClaims(data.insurance_claims);
      }
      if (data.disputes) {
        setDisputes(data.disputes);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data: any = await api.get(`/reviews/${id}`);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleSplitOrder = async () => {
    try {
      const validSubOrders = subOrders.filter(s => s.title.trim() !== '');
      if (validSubOrders.length === 0) {
        message.error('请至少填写一个子订单');
        return;
      }

      await api.post(`/labor-orders/${id}/split`, {
        sub_orders: validSubOrders,
      });
      message.success('拆单成功');
      setSplitModalVisible(false);
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '拆单失败');
    }
  };

  const addSubOrder = () => {
    setSubOrders([...subOrders, { title: '', skills_required: [], estimated_hours: 2, price_per_hour: 50, task_price: 0 }]);
  };

  const removeSubOrder = (index: number) => {
    if (subOrders.length > 1) {
      setSubOrders(subOrders.filter((_, i) => i !== index));
    }
  };

  const updateSubOrder = (index: number, field: keyof SubOrderFormData, value: any) => {
    const updated = [...subOrders];
    updated[index] = { ...updated[index], [field]: value };
    setSubOrders(updated);
  };

  const handleAssignWorker = async (values: any) => {
    try {
      message.success('工人指派成功');
      setAssignModalVisible(false);
      assignForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '指派失败');
    }
  };

  const handleReportLocation = async () => {
    try {
      const newTrack: GpsTrack = {
        id: Date.now().toString(),
        order_id: id || '',
        order_type: 'labor',
        user_id: user?.id || '',
        latitude: 31.2304 + Math.random() * 0.01,
        longitude: 121.4737 + Math.random() * 0.01,
        timestamp: new Date().toISOString(),
        speed: Math.random() * 30,
        heading: Math.random() * 360,
        accuracy: 5,
      };
      setGpsTracks([newTrack, ...gpsTracks]);
      message.success('定位上报成功');
    } catch (error) {
      message.error('上报失败');
    }
  };

  const handleSubmitInsurance = async (values: any) => {
    try {
      await api.post('/insurance-claims', {
        order_id: id,
        order_type: 'labor',
        ...values,
      });
      message.success('保险理赔申请已提交');
      setInsuranceModalVisible(false);
      insuranceForm.resetFields();
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const getConfirmationProgress = () => {
    const confirmation = (order as any)?.confirmation;
    if (!confirmation) return 0;
    let count = 0;
    if (confirmation.employer_confirmed) count++;
    if (confirmation.worker_confirmed) count++;
    if (confirmation.platform_confirmed) count++;
    return Math.round((count / 3) * 100);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待接单', color: 'orange' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
      split: { text: '已拆单', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const getWorkerStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      accepted: { text: '已接单', color: 'green' },
      pending: { text: '待确认', color: 'orange' },
      rejected: { text: '已拒单', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleTakeOrder = async () => {
    try {
      await api.post(`/labor-orders/${id}/take-order`);
      message.success('接单成功');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '接单失败');
    }
  };

  const handleStartService = async () => {
    try {
      await api.post(`/labor-orders/${id}/start`);
      message.success('服务已开始');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: '确认完工',
      content: '请确认服务已完成',
      onOk: async () => {
        try {
          await api.post(`/labor-orders/${id}/complete`, {});
          message.success('确认已提交');
          fetchOrder();
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const handleSubmitReview = async (values: any) => {
    try {
      await api.post('/reviews', {
        order_id: id,
        order_type: 'labor',
        reviewee_id: order?.employer_id === user?.id ? order?.worker_id : order?.employer_id,
        ...values,
      });
      message.success('评价提交成功');
      setReviewModalVisible(false);
      form.resetFields();
      fetchReviews();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleSubmitDispute = async (values: any) => {
    try {
      await api.post('/disputes', {
        order_id: id,
        order_type: 'labor',
        respondent_id: order?.employer_id === user?.id ? order?.worker_id : order?.employer_id,
        ...values,
      });
      message.success('纠纷提交成功');
      setDisputeModalVisible(false);
      disputeForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const getTrailChartOption = () => {
    const lngs = gpsTracks.map(t => t.longitude?.toFixed(4));
    const lats = gpsTracks.map(t => t.latitude?.toFixed(4));
    const times = gpsTracks.map(t => t.timestamp?.substring(11, 16));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `时间: ${times[data.dataIndex]}<br/>经度: ${lngs[data.dataIndex]}<br/>纬度: ${lats[data.dataIndex]}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: lngs,
        name: '经度',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'category',
        data: lats,
        name: '纬度',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          fontSize: 10
        }
      },
      series: [
        {
          name: '轨迹',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: gpsTracks.map((_, i) => [i, i]),
          lineStyle: {
            width: 3,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#ff4d4f' },
                { offset: 0.5, color: '#1890ff' },
                { offset: 1, color: '#52c41a' }
              ]
            }
          },
          itemStyle: {
            color: (params: any) => {
              if (params.dataIndex === 0) return '#52c41a';
              if (params.dataIndex === gpsTracks.length - 1) return '#ff4d4f';
              return '#1890ff';
            }
          },
          markPoint: {
            data: [
              { name: '起点', value: '起', xAxis: gpsTracks.length - 1, yAxis: gpsTracks.length - 1, itemStyle: { color: '#ff4d4f' } },
              { name: '终点', value: '终', xAxis: 0, yAxis: 0, itemStyle: { color: '#52c41a' } }
            ]
          }
        }
      ]
    };
  };

  if (loading) return <div className="page-container">加载中...</div>;
  if (!order) return <div className="page-container">订单不存在</div>;

  const statusInfo = getStatusText(order.status);
  const isEmployer = user?.id === order.employer_id;
  const isWorker = user?.id === order.worker_id;
  const canShowSplitModule = isEmployer && (order.status === 'pending' || order.status === 'accepted');
  const confirmation = (order as any)?.confirmation || {
    employer_confirmed: false,
    worker_confirmed: false,
    platform_confirmed: false,
    employer_confirmed_at: null,
    worker_confirmed_at: null,
    platform_confirmed_at: null,
  };

  return (
    <div className="page-container">
      <Card 
        title={
          <span>
            {order.title}
            <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
          </span>
        }
        extra={
          <span style={{ color: '#fa8c16', fontSize: 24, fontWeight: 600 }}>
            ¥{order.total_price}
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="服务类型">
            {order.category || '用工服务'}
          </Descriptions.Item>
          <Descriptions.Item label="计价方式">
            {order.pricing_type === 'hourly' ? '按小时计价' : '按任务计价'}
          </Descriptions.Item>
          <Descriptions.Item label="服务地址">
            <EnvironmentOutlined /> {order.city} {order.address}
          </Descriptions.Item>
          <Descriptions.Item label="需求人数">
            {order.worker_count} 人
          </Descriptions.Item>
          {order.pricing_type === 'hourly' && (
            <>
              <Descriptions.Item label="单价">¥{order.price_per_hour}/小时</Descriptions.Item>
              <Descriptions.Item label="预估工时">{order.estimated_hours} 小时</Descriptions.Item>
            </>
          )}
          {order.pricing_type === 'task' && (
            <Descriptions.Item label="任务价格" span={2}>¥{order.task_price}</Descriptions.Item>
          )}
          {order.start_time && (
            <Descriptions.Item label="开始时间">
              <ClockCircleOutlined /> {order.start_time}
            </Descriptions.Item>
          )}
          {order.end_time && (
            <Descriptions.Item label="结束时间">{order.end_time}</Descriptions.Item>
          )}
          {order.skills_required && order.skills_required.length > 0 && (
            <Descriptions.Item label="技能要求" span={2}>
              {order.skills_required.map(skill => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="服务描述" span={2}>
            {order.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>

        {order.sub_orders && order.sub_orders.length > 0 && (
          <>
            <Divider orientation="left">子订单</Divider>
            <List
              dataSource={order.sub_orders}
              renderItem={(sub: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={sub.title}
                    description={
                      <span>
                        <Tag color={getStatusText(sub.status).color}>
                          {getStatusText(sub.status).text}
                        </Tag>
                        {sub.worker_name && ` 工人: ${sub.worker_name}`}
                        <span style={{ float: 'right' }}>¥{sub.total_price}</span>
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Card>

      {canShowSplitModule && (
        <Card 
          title={
            <Space>
              <SplitCellsOutlined style={{ color: '#722ed1' }} />
              拆单分派
            </Space>
          } 
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button icon={<SplitCellsOutlined />} onClick={() => setSplitModalVisible(true)}>
                拆分订单
              </Button>
              <Button type="primary" icon={<UserOutlined />} onClick={() => setAssignModalVisible(true)}>
                指派工人
              </Button>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            message="已派单工人列表"
            description="以下工人已被分派到此订单，可查看其接单状态。"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={[16, 16]}>
            {assignedWorkers.map(worker => {
              const workerStatus = getWorkerStatusText(worker.status);
              return (
                <Col xs={24} sm={12} md={8} key={worker.id}>
                  <Card 
                    size="small"
                    hoverable
                    onClick={() => setSelectedWorker(worker)}
                    style={{ 
                      borderColor: selectedWorker?.id === worker.id ? '#1890ff' : undefined,
                      background: selectedWorker?.id === worker.id ? '#e6f7ff' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <Avatar icon={<UserOutlined />} src={worker.avatar} size={40} />
                      <div style={{ marginLeft: 12 }}>
                        <div style={{ fontWeight: 500 }}>{worker.name}</div>
                        <Tag color={workerStatus.color}>{workerStatus.text}</Tag>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {worker.skills.map(s => <Tag key={s} color="blue" style={{ marginRight: 4 }}>{s}</Tag>)}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      <Card 
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#13c2c2' }} />
            GPS服务轨迹
          </Space>
        } 
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button icon={<SendOutlined />} onClick={handleReportLocation}>
              上报定位(测试)
            </Button>
            <Button icon={<EnvironmentFilled />} onClick={() => setGpsModalVisible(true)}>
              查看详情
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic title="总定位点数" value={gpsTracks.length} prefix={<EnvironmentOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic 
                title="开始时间" 
                value={gpsTracks.length > 0 ? gpsTracks[gpsTracks.length - 1]?.timestamp?.substring(0, 16) : '-'} 
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: 14 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic 
                title="最新位置" 
                value={gpsTracks.length > 0 ? `${gpsTracks[0]?.latitude?.toFixed(4)}, ${gpsTracks[0]?.longitude?.toFixed(4)}` : '-'} 
                prefix={<EnvironmentFilled style={{ color: '#52c41a' }} />}
                valueStyle={{ fontSize: 12 }}
              />
            </Card>
          </Col>
        </Row>
        {gpsTracks.length > 0 && (
          <div style={{ marginTop: 16, height: 300 }}>
            <Alert
              type="info"
              showIcon
              message="地图轨迹模拟"
              description="以下为ECharts绘制的简易轨迹折线图，红色为起点，绿色为终点。"
              style={{ marginBottom: 16 }}
            />
            <ReactECharts option={getTrailChartOption()} style={{ height: '100%' }} />
          </div>
        )}
        <Divider />
        <List
          size="small"
          dataSource={gpsTracks.slice(0, 5)}
          renderItem={(track, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: index === 0 ? '#52c41a' : index === gpsTracks.length - 1 ? '#ff4d4f' : '#1890ff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                  }}>
                    {gpsTracks.length - index}
                  </div>
                }
                title={
                  <span>
                    {index === 0 && <Tag color="green" style={{ marginRight: 8 }}>最新</Tag>}
                    经度: {track.longitude?.toFixed(6)} | 纬度: {track.latitude?.toFixed(6)}
                  </span>
                }
                description={
                  <span style={{ fontSize: 12 }}>
                    {track.timestamp?.substring(0, 16)}
                    {track.speed !== undefined && ` | 速度: ${track.speed.toFixed(1)} km/h`}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card 
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            双向选择记录
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        {selectedWorker && (
          <Alert
            type="success"
            showIcon
            message="当前被选中的工人"
            description={
              <Space>
                <Avatar icon={<UserOutlined />} src={selectedWorker.avatar} size="small" />
                <span style={{ fontWeight: 500 }}>{selectedWorker.name}</span>
                {selectedWorker.skills.map(s => <Tag key={s} color="blue" style={{ marginRight: 4 }}>{s}</Tag>)}
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <List
          dataSource={selectionRecords}
          renderItem={(record) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} src={record.worker_avatar} />}
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{record.worker_name}</span>
                    <Tag color={record.action === 'accept' ? 'green' : 'red'}>
                      {record.action === 'accept' ? '接单' : '拒单'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>
                      <ClockCircleOutlined /> {record.action_time}
                    </div>
                    {record.remark && (
                      <div style={{ fontSize: 13 }}>备注: {record.remark}</div>
                    )}
                  </div>
                }
              />
              {record.action === 'accept' ? (
                <CheckOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              ) : (
                <CloseOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
              )}
            </List.Item>
          )}
        />
      </Card>

      <Card 
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            三方确认状态
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Progress percent={getConfirmationProgress()} status={getConfirmationProgress() === 100 ? 'success' : 'active'} />
        </div>
        <Steps current={[confirmation.employer_confirmed, confirmation.worker_confirmed, confirmation.platform_confirmed].filter(Boolean).length}>
          <Step 
            title="雇主确认" 
            status={confirmation.employer_confirmed ? 'finish' : 'wait'}
            icon={confirmation.employer_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ fontSize: 18 }}>○</span>}
            description={confirmation.employer_confirmed_at || '未确认'}
          />
          <Step 
            title="工人确认" 
            status={confirmation.worker_confirmed ? 'finish' : 'wait'}
            icon={confirmation.worker_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ fontSize: 18 }}>○</span>}
            description={confirmation.worker_confirmed_at || '未确认'}
          />
          <Step 
            title="平台确认" 
            status={confirmation.platform_confirmed ? 'finish' : 'wait'}
            icon={confirmation.platform_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ fontSize: 18 }}>○</span>}
            description={confirmation.platform_confirmed_at || '未确认'}
          />
        </Steps>
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={8}>
            <div style={{ textAlign: 'center', padding: 12, background: confirmation.employer_confirmed ? '#f6ffed' : '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {confirmation.employer_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ color: '#bfbfbf' }}>○</span>}
              </div>
              <div style={{ fontWeight: 500 }}>雇主确认</div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                {confirmation.employer_confirmed_at || '未确认'}
              </div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center', padding: 12, background: confirmation.worker_confirmed ? '#f6ffed' : '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {confirmation.worker_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ color: '#bfbfbf' }}>○</span>}
              </div>
              <div style={{ fontWeight: 500 }}>工人确认</div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                {confirmation.worker_confirmed_at || '未确认'}
              </div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center', padding: 12, background: confirmation.platform_confirmed ? '#f6ffed' : '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {confirmation.platform_confirmed ? <CheckOutlined style={{ color: '#52c41a' }} /> : <span style={{ color: '#bfbfbf' }}>○</span>}
              </div>
              <div style={{ fontWeight: 500 }}>平台确认</div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                {confirmation.platform_confirmed_at || '未确认'}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="履约追踪与风控状态" style={{ marginBottom: 16 }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="用工履约链路"
          description="拆单分派、双向选择、轨迹存证、完工确认、保险理赔与纠纷复查均在订单详情中留痕。"
        />
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="拆单分派">
            {order.split_enabled ? <Tag color="purple">支持组合用工 / 子订单分派</Tag> : <Tag>单人服务</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="双向选择">
            {order.worker_id ? <Tag color="green">已匹配工人</Tag> : <Tag color="orange">等待工人接单</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="服务轨迹">
            <Tag color={gpsTracks.length ? 'green' : 'default'}>
              {gpsTracks.length || 0} 条定位记录
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="三方确认">
            <Space wrap>
              <Tag color={confirmation.employer_confirmed ? 'green' : 'default'}>雇主确认</Tag>
              <Tag color={confirmation.worker_confirmed ? 'green' : 'default'}>工人确认</Tag>
              <Tag color={confirmation.platform_confirmed ? 'green' : 'default'}>平台复核</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="保险理赔">
            <Tag color={insuranceClaims.length ? 'red' : 'green'}>
              {insuranceClaims.length || 0} 笔
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="纠纷复查">
            <Tag color={disputes.length ? 'orange' : 'green'}>
              {disputes.length || 0} 件
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="雇主信息" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} src={order.employer_avatar} size={48} />
          <div style={{ marginLeft: 16, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              {order.employer_real_name || order.employer_name}
              <Tag color="green">信用分: {order.employer_credit_score || '100'}/100</Tag>
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
              <PhoneOutlined /> {order.employer_phone || '未填写'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <GoldOutlined style={{ fontSize: 24, color: '#faad14' }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: '#faad14' }}>
              {order.employer_credit_score || '100'}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>信用分</div>
          </div>
        </div>
      </Card>

      {order.worker_id && (
        <Card title="工人信息" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} src={order.worker_avatar} size={48} />
            <div style={{ marginLeft: 16, flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                {order.worker_real_name || order.worker_name}
                <Tag color="green">信用分: {order.worker_credit_score || '100'}/100</Tag>
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                <PhoneOutlined /> {order.worker_phone || '未填写'}
              </div>
              {(order as any).worker_rating && (
                <div style={{ marginTop: 4 }}>
                  <Rate disabled defaultValue={(order as any).worker_rating} allowHalf style={{ fontSize: 12 }} />
                  <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
                    完成 {(order as any).worker_completed_orders || 0} 单
                  </span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <GoldOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: '#faad14' }}>
                {order.worker_credit_score || '100'}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>信用分</div>
            </div>
          </div>
        </Card>
      )}

      {order.status !== 'pending' && order.status !== 'cancelled' && (
        <Card title="履约功能模块" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => isEmployer && order.split_enabled && order.status === 'pending' ? setSplitModalVisible(true) : message.info('该功能在当前状态不可用')}>
                <div style={{ textAlign: 'center' }}>
                  <SplitCellsOutlined style={{ fontSize: 32, color: order.split_enabled && isEmployer ? '#722ed1' : '#bfbfbf' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>拆单分派</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {order.split_enabled ? '支持多人分工' : '单人服务订单'}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => gpsTracks.length > 0 ? setGpsModalVisible(true) : message.info('暂无GPS轨迹数据')}>
                <div style={{ textAlign: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: 32, color: gpsTracks.length > 0 ? '#13c2c2' : '#bfbfbf' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>服务轨迹</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {gpsTracks.length} 条定位记录
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => message.info('三方确认状态请查看下方履约追踪卡片')}>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>三方确认</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {getConfirmationProgress()}% 已完成
                  </div>
                  <Progress percent={getConfirmationProgress()} size="small" style={{ marginTop: 8 }} />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => setInsuranceModalVisible(true)}>
                <div style={{ textAlign: 'center' }}>
                  <SafetyOutlined style={{ fontSize: 32, color: insuranceClaims.length > 0 ? '#faad14' : '#52c41a' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>保险理赔</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {insuranceClaims.length > 0 ? `${insuranceClaims.length} 笔申请` : '申请理赔'}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {insuranceClaims.length > 0 && (
        <Card title="保险理赔记录" style={{ marginBottom: 16 }}>
          <List
            dataSource={insuranceClaims}
            renderItem={(claim) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<SafetyOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  title={
                    <span>
                      理赔申请 - ¥{claim.claim_amount}
                      <Tag style={{ marginLeft: 8 }} color={claim.status === 'resolved' ? 'green' : claim.status === 'pending' ? 'orange' : 'red'}>
                        {claim.status === 'resolved' ? '已赔付' : claim.status === 'pending' ? '处理中' : claim.status}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      原因: {claim.claim_reason} | {claim.insurance_company}
                      {claim.payout_amount !== undefined && claim.payout_amount !== null && (
                        <span style={{ color: '#52c41a', marginLeft: 8 }}>已赔付: ¥{claim.payout_amount}</span>
                      )}
                    </span>
                  }
                />
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>{claim.created_at}</span>
              </List.Item>
            )}
          />
        </Card>
      )}

      {reviews.length > 0 && (
        <Card title="评价" style={{ marginBottom: 16 }}>
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={review.reviewer_avatar} icon={<UserOutlined />} />}
                  title={
                    <span>
                      {review.reviewer_name}
                      <Rate disabled defaultValue={review.rating} style={{ marginLeft: 12, fontSize: 14 }} />
                    </span>
                  }
                  description={review.content || '暂无评价内容'}
                />
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>{review.created_at}</span>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user?.role === 'worker' && order.status === 'pending' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleTakeOrder}>
              立即接单
            </Button>
          )}

          {isEmployer && order.status === 'pending' && order.split_enabled && order.worker_count > 1 && (
            <Button type="primary" size="large" icon={<SplitCellsOutlined />} onClick={() => setSplitModalVisible(true)}>
              拆单分派
            </Button>
          )}
          
          {(isWorker || isEmployer) && order.status === 'accepted' && (
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStartService}>
              开始服务
            </Button>
          )}

          {(isWorker || isEmployer) && order.status !== 'pending' && order.status !== 'cancelled' && gpsTracks.length > 0 && (
            <Button size="large" icon={<EnvironmentOutlined />} onClick={() => setGpsModalVisible(true)}>
              查看轨迹
            </Button>
          )}

          {isWorker && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认完工
            </Button>
          )}

          {isEmployer && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认收货
            </Button>
          )}

          {order.status === 'completed' && reviews.length === 0 && (
            <Button icon={<CommentOutlined />} onClick={() => setReviewModalVisible(true)}>
              发表评价
            </Button>
          )}

          {order.status !== 'pending' && order.status !== 'cancelled' && (
            <Button icon={<SafetyOutlined />} onClick={() => setInsuranceModalVisible(true)}>
              保险理赔
            </Button>
          )}

          {(isWorker || isEmployer) && order.status !== 'pending' && order.status !== 'completed' && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setDisputeModalVisible(true)}>
              申请纠纷
            </Button>
          )}
        </div>
      </Card>

      <Modal
        title="发表评价"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
          <Form.Item label="评分" name="rating" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="评价内容" name="content">
            <Input.TextArea rows={4} placeholder="请输入评价内容" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交评价</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请纠纷"
        open={disputeModalVisible}
        onCancel={() => setDisputeModalVisible(false)}
        footer={null}
      >
        <Form form={disputeForm} onFinish={handleSubmitDispute} layout="vertical">
          <Form.Item label="纠纷原因" name="reason" rules={[{ required: true, message: '请输入纠纷原因' }]}>
            <Input placeholder="请简要描述纠纷原因" />
          </Form.Item>
          <Form.Item label="详细描述" name="description">
            <Input.TextArea rows={4} placeholder="请详细描述纠纷情况" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拆单分派"
        open={splitModalVisible}
        onCancel={() => setSplitModalVisible(false)}
        width={700}
        footer={[
          <Button key="add" onClick={addSubOrder} icon={<PlusOutlined />}>
            添加子订单
          </Button>,
          <Button key="cancel" onClick={() => setSplitModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSplitOrder}>
            确认拆单
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          message="拆单说明"
          description="将订单拆分为多个子订单，每个子订单可分派给不同工人。请填写每个子订单的标题和技能要求。"
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {subOrders.map((sub, index) => (
            <Card key={index} size="small" style={{ marginBottom: 12 }} title={`子订单 ${index + 1}`} extra={
              subOrders.length > 1 ? (
                <Button type="text" danger size="small" onClick={() => removeSubOrder(index)}>删除</Button>
              ) : null
            }>
              <Form layout="vertical">
                <Form.Item label="子订单标题" required>
                  <Input 
                    placeholder="例如：水电维修部分" 
                    value={sub.title}
                    onChange={(e) => updateSubOrder(index, 'title', e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="技能要求">
                  <Select
                    mode="multiple"
                    placeholder="选择所需技能"
                    value={sub.skills_required}
                    onChange={(value) => updateSubOrder(index, 'skills_required', value)}
                    style={{ width: '100%' }}
                  >
                    {WORKER_SKILLS.map(skill => (
                      <Option key={skill} value={skill}>{skill}</Option>
                    ))}
                  </Select>
                </Form.Item>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item label="预估工时" style={{ flex: 1 }}>
                    <InputNumber 
                      min={0.5} 
                      style={{ width: '100%' }} 
                      value={sub.estimated_hours}
                      onChange={(value) => updateSubOrder(index, 'estimated_hours', value)}
                    />
                  </Form.Item>
                  <Form.Item label="时薪" style={{ flex: 1 }}>
                    <InputNumber 
                      min={10} 
                      style={{ width: '100%' }} 
                      value={sub.price_per_hour}
                      onChange={(value) => updateSubOrder(index, 'price_per_hour', value)}
                    />
                  </Form.Item>
                </div>
              </Form>
            </Card>
          ))}
        </div>
      </Modal>

      <Modal
        title="指派工人"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} onFinish={handleAssignWorker} layout="vertical">
          <Form.Item label="选择工人" name="worker_id" rules={[{ required: true, message: '请选择工人' }]}>
            <Select placeholder="选择要指派的工人">
              {assignedWorkers.map(worker => (
                <Option key={worker.id} value={worker.id}>
                  {worker.name} - {worker.skills.join(', ')}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="可以给工人留言" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">确认指派</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="GPS服务轨迹"
        open={gpsModalVisible}
        onCancel={() => setGpsModalVisible(false)}
        width={700}
        footer={[
          <Button key="report" icon={<SendOutlined />} onClick={handleReportLocation}>
            上报定位
          </Button>,
          <Button key="close" onClick={() => setGpsModalVisible(false)}>关闭</Button>,
        ]}
      >
        {gpsTracks.length > 0 ? (
          <>
            <Alert
              type="info"
              showIcon
              message="服务轨迹记录"
              description={`共记录 ${gpsTracks.length} 条定位数据，展示服务过程中的位置变化。`}
              style={{ marginBottom: 16 }}
            />
            <div style={{ height: 300, marginBottom: 16 }}>
              <ReactECharts option={getTrailChartOption()} style={{ height: '100%' }} />
            </div>
            <List
              dataSource={gpsTracks}
              renderItem={(track, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        background: index === 0 ? '#52c41a' : index === gpsTracks.length - 1 ? '#ff4d4f' : '#1890ff',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {gpsTracks.length - index}
                      </div>
                    }
                    title={
                      <span>
                        {index === 0 && <Tag color="green">最新位置</Tag>}
                        {index === gpsTracks.length - 1 && <Tag color="red">起点</Tag>}
                        经度: {track.longitude?.toFixed(6)} | 纬度: {track.latitude?.toFixed(6)}
                      </span>
                    }
                    description={
                      <span>
                        {track.timestamp}
                        {track.speed !== undefined && ` | 速度: ${track.speed} km/h`}
                        {track.heading !== undefined && ` | 方向: ${track.heading}°`}
                        {track.accuracy !== undefined && ` | 精度: ±${track.accuracy}m`}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无轨迹数据</div>
          </div>
        )}
      </Modal>

      <Modal
        title="保险理赔申请"
        open={insuranceModalVisible}
        onCancel={() => setInsuranceModalVisible(false)}
        footer={null}
      >
        <Form form={insuranceForm} onFinish={handleSubmitInsurance} layout="vertical">
          <Form.Item label="理赔金额 (元)" name="claim_amount" rules={[{ required: true, message: '请输入理赔金额' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入申请理赔的金额" />
          </Form.Item>
          <Form.Item label="理赔原因" name="claim_reason" rules={[{ required: true, message: '请输入理赔原因' }]}>
            <Select placeholder="选择理赔原因">
              <Option value="物品损坏">物品损坏</Option>
              <Option value="服务延误">服务延误</Option>
              <Option value="质量问题">服务质量问题</Option>
              <Option value="物品丢失">物品丢失</Option>
              <Option value="其他">其他原因</Option>
            </Select>
          </Form.Item>
          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请描述具体情况' }]}>
            <TextArea rows={4} placeholder="请详细描述理赔情况，包括时间、地点、损失情况等" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LaborOrderDetail;
