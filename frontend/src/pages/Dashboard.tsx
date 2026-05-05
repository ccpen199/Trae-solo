import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Space,
  Tag,
  Statistic,
  message,
  Popconfirm,
} from 'antd';
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleApi, reportApi, orderApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface Schedule {
  id: string;
  orderId: string;
  userId: string;
  status: string;
  claimedAt: string;
  expiresAt: string;
  warningAt: string;
  beforeReceiverName: string;
  beforeReceiverPhone: string;
  beforeReceiverFixedPhone: string;
  beforeAppointmentCalendar: string;
  afterReceiverName: string;
  afterReceiverPhone: string;
  afterReceiverFixedPhone: string;
  afterAppointmentCalendar: string;
  order: any;
}

interface Order {
  id: string;
  orderNo: string;
  orderType: string;
  orderStatus: string;
  distributionCenterId: string;
  warehouseId: string;
  pieceCount: number;
  volume: number;
  weight: number;
  receiverName: string;
  receiverPhone: string;
  receiverFixedPhone: string;
  appointmentCalendar: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [countdownStatus, setCountdownStatus] = useState<'normal' | 'warning' | 'expired'>('normal');
  const [warningMinutes, setWarningMinutes] = useState(25);
  const [currentEditSchedule, setCurrentEditSchedule] = useState<Schedule | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, schedulesRes] = await Promise.all([
        reportApi.getStatistics(),
        scheduleApi.getMySchedules(),
      ]);

      setStats(statsRes.data.data);

      const { schedules, activeSchedule: active, warningMinutes: wm } = schedulesRes.data.data;
      setMySchedules(schedules);
      setActiveSchedule(active);
      if (wm) setWarningMinutes(wm);

      if (active) {
        const expiresAt = new Date(active.expiresAt);
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        setCountdown(Math.max(0, remaining));
      }
    } catch (error: any) {
      message.error('获取数据失败');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeSchedule) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          setCountdownStatus('expired');
          return 0;
        }

        const newCount = prev - 1;
        const warningSeconds = warningMinutes * 60;
        
        if (newCount <= 0) {
          setCountdownStatus('expired');
        } else if (newCount <= warningSeconds) {
          setCountdownStatus('warning');
        } else {
          setCountdownStatus('normal');
        }

        return Math.max(0, newCount);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSchedule, warningMinutes]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaim = async () => {
    if (activeSchedule) {
      message.warning('您还有未完成的调度任务');
      return;
    }

    setClaiming(true);
    try {
      const response = await scheduleApi.claimOrders();
      const { claimed, schedules } = response.data.data;
      message.success(`成功领取 ${claimed} 条订单`);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '领取失败');
    } finally {
      setClaiming(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setCurrentEditSchedule(schedule);
    form.setFieldsValue({
      receiverName: schedule.afterReceiverName || schedule.beforeReceiverName,
      receiverPhone: schedule.afterReceiverPhone || schedule.beforeReceiverPhone,
      receiverFixedPhone: schedule.afterReceiverFixedPhone || schedule.beforeReceiverFixedPhone,
      appointmentCalendar: schedule.afterAppointmentCalendar || schedule.beforeAppointmentCalendar,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      await scheduleApi.updateSchedule(currentEditSchedule!.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error('更新失败');
    }
  };

  const handleConfirm = (schedule: Schedule, values: any) => {
    setCurrentEditSchedule(schedule);
    form.setFieldsValue({
      isConfirmed: true,
      rejectReason: '',
      isMaliciousReject: false,
    });
    setConfirmModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const values = await form.validateFields();
      await scheduleApi.confirmSchedule(currentEditSchedule!.id, {
        isConfirmed: values.isConfirmed === 'true',
        rejectReason: values.rejectReason,
        isMaliciousReject: values.isMaliciousReject,
      });
      message.success('处理成功');
      setConfirmModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error('处理失败');
    }
  };

  const handleRelease = async (schedule: Schedule) => {
    try {
      await scheduleApi.releaseSchedule(schedule.id);
      message.success('订单已释放回调度队列');
      fetchData();
    } catch (error: any) {
      message.error('释放失败');
    }
  };

  const orderTypeMap: Record<string, string> = {
    SMALL_MEDIUM: '中小件',
    BULK: '大宗',
    SELF_PICKUP: '自提',
  };

  const orderStatusMap: Record<string, string> = {
    PENDING_ENTRY: '待准入',
    ENTRY_REJECTED: '准入拒绝',
    WAITING_SCHEDULE: '待调度',
    SCHEDULING: '调度中',
    SCHEDULED: '已调度',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REJECTED: '已拒绝',
  };

  const scheduleStatusMap: Record<string, string> = {
    PENDING: '待处理',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    EXPIRED: '已过期',
    RELEASED: '已释放',
  };

  const processingSchedules = mySchedules.filter(
    (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
  );

  const columns = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '订单类型',
      dataIndex: ['order', 'orderType'],
      key: 'orderType',
      render: (val: string) => orderTypeMap[val] || val,
    },
    {
      title: '收货人',
      dataIndex: 'afterReceiverName',
      key: 'receiverName',
      render: (val: string, record: Schedule) => val || record.beforeReceiverName,
    },
    {
      title: '联系电话',
      dataIndex: 'afterReceiverPhone',
      key: 'receiverPhone',
      render: (val: string, record: Schedule) => val || record.beforeReceiverPhone,
    },
    {
      title: '预约日历',
      dataIndex: 'afterAppointmentCalendar',
      key: 'appointmentCalendar',
      render: (val: string, record: Schedule) => val || record.beforeAppointmentCalendar,
    },
    {
      title: '件数/体积/重量',
      key: 'metrics',
      render: (_: any, record: Schedule) => (
        <span>
          {record.order.pieceCount}件 / {record.order.volume}m³ / {record.order.weight}kg
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const color =
          val === 'COMPLETED' ? 'success' : val === 'PROCESSING' ? 'processing' : 'default';
        return <Tag color={color}>{scheduleStatusMap[val] || val}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Schedule) => (
        <Space>
          {(record.status === 'PENDING' || record.status === 'PROCESSING') && (
            <>
              <Button type="link" size="small" onClick={() => handleEdit(record)}>
                <EditOutlined /> 修改
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setCurrentEditSchedule(record);
                  form.setFieldsValue({
                    isConfirmed: 'true',
                    rejectReason: '',
                    isMaliciousReject: false,
                  });
                  setConfirmModalVisible(true);
                }}
              >
                <CheckCircleOutlined /> 确认
              </Button>
              <Popconfirm title="确定要释放该订单吗？" onConfirm={() => handleRelease(record)}>
                <Button type="link" size="small" danger>
                  <StopOutlined /> 释放
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">调度工作台</h2>
      </div>

      <Row gutter={16} className="stats-row">
        <Col span={4}>
          <Card>
            <Statistic
              title="待调度订单"
              value={stats.waitingOrders || 0}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.activeSchedules || 0}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已调度完成"
              value={stats.scheduledOrders || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已拒绝"
              value={stats.rejectedOrders || 0}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleClaim}
                loading={claiming}
                disabled={!!activeSchedule}
                style={{ minWidth: 120 }}
              >
                {activeSchedule ? '已有处理中订单' : '领取订单 (10条)'}
              </Button>
              
              {activeSchedule && (
                <div
                  className={`countdown-card ${
                    countdownStatus === 'warning'
                      ? 'warning'
                      : countdownStatus === 'expired'
                      ? 'expired'
                      : ''
                  }`}
                  style={{ margin: 0, flex: 1 }}
                >
                  <div style={{ fontSize: 14, marginBottom: 4 }}>
                    {countdownStatus === 'expired' ? '已过期' : countdownStatus === 'warning' ? '即将过期' : '剩余时间'}
                  </div>
                  <div className="countdown-time">{formatCountdown(countdown)}</div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="我的调度任务">
        <Table
          columns={columns}
          dataSource={mySchedules}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="修改订单信息"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="receiverName"
            label="收货人"
            rules={[{ required: true, message: '请输入收货人' }]}
          >
            <Input placeholder="请输入收货人" />
          </Form.Item>
          <Form.Item
            name="receiverPhone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="receiverFixedPhone" label="固定电话">
            <Input placeholder="请输入固定电话" />
          </Form.Item>
          <Form.Item
            name="appointmentCalendar"
            label="预约日历"
            rules={[{ required: true, message: '请输入预约日历' }]}
          >
            <Input placeholder="请输入预约日期，如：2026-05-05" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认处理"
        open={confirmModalVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => setConfirmModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="isConfirmed"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Radio.Group>
              <Radio value="true">确认调度</Radio>
              <Radio value="false">拒绝/取消</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.isConfirmed !== curr.isConfirmed}
          >
            {({ getFieldValue }) =>
              getFieldValue('isConfirmed') === 'false' ? (
                <>
                  <Form.Item name="rejectReason" label="拒绝原因">
                    <TextArea rows={3} placeholder="请输入拒绝原因" />
                  </Form.Item>
                  <Form.Item name="isMaliciousReject" valuePropName="checked">
                    <Radio>标记为恶意拒收</Radio>
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
