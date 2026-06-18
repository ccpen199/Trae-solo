import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Space,
  Typography,
  Button,
  Tag,
  Descriptions,
  DatePicker,
  Radio,
  Select,
  Modal,
  Form,
  InputNumber,
  Alert,
  Skeleton,
  Empty,
  Divider,
  Statistic,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  QrcodeOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WaterOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore, useAppStore } from '@/store';
import { deviceApi, bookingApi, orderApi } from '@/api';
import type { Device, Booking, DeviceType } from '@/types';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_COLORS,
  DEVICE_STATUS_MAP,
  WORKING_STATUS_MAP,
  WORKING_STATUS_COLOR_MAP,
  getDeviceModes,
} from '@/utils/constants';
import { formatPrice, formatDuration, formatDateTime, formatTime } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Group: RadioGroup, Button: RadioButton } = Radio;
const { Option } = Select;
const { Meta } = Card;

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

interface DeviceMode {
  value: string;
  label: string;
  duration: number;
  multiplier: number;
}

const ResidentDeviceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { showNotification, setLoading } = useAppStore();
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<any>(null);
  const [loading, setPageLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<DeviceMode | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [actionType, setActionType] = useState<'start' | 'book'>('start');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [form] = Form.useForm();

  const BASE_PRICE = 2.0;
  const UNIT_PRICE = 0.5;

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      loadAvailableSlots();
    }
  }, [id, selectedDate]);

  useEffect(() => {
    if (user) {
      loadWallet();
    }
  }, [user]);

  const loadData = async () => {
    if (!id) return;
    try {
      setPageLoading(true);
      const [deviceRes, statusRes] = await Promise.all([
        deviceApi.getDeviceById(id),
        deviceApi.getDeviceStatus(id),
      ]);

      if (deviceRes.success) {
        setDevice(deviceRes.data || null);
        if (deviceRes.data) {
          const modes = getDeviceModes(deviceRes.data.deviceType);
          if (modes.length > 0) {
            setSelectedMode(modes[0]);
            setDuration(modes[0].duration);
          }
        }
      }
      if (statusRes.success) {
        setDeviceStatus(statusRes.data);
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载设备详情失败');
    } finally {
      setPageLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await orderApi.getWallet();
      if (res.success) {
        setWallet(res.data);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!id) return;
    try {
      const res = await bookingApi.getAvailableSlots({
        deviceId: id,
        date: selectedDate.format('YYYY-MM-DD'),
      });
      if (res.success) {
        setAvailableSlots(res.data?.available || []);
        setBookedSlots(res.data?.booked || []);
      }
    } catch (error) {
      console.error('Failed to load available slots:', error);
    }
  };

  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = bookedSlots.some(
          (slot) => slot.startTime?.includes(time) || slot.timeSlot === time
        );
        const isAvailable = availableSlots.includes(time);
        const isPast = selectedDate.isSame(dayjs(), 'day') && 
          dayjs(time, 'HH:mm').isBefore(dayjs());
        
        slots.push({
          time,
          available: isAvailable && !isPast && !isBooked,
          booked: isBooked,
        });
      }
    }
    return slots;
  }, [availableSlots, bookedSlots, selectedDate]);

  const deviceModes = useMemo((): DeviceMode[] => {
    if (!device) return [];
    return getDeviceModes(device.deviceType);
  }, [device]);

  const priceCalculation = useMemo(() => {
    if (!selectedMode) return null;
    
    const basePrice = BASE_PRICE;
    const unitPrice = UNIT_PRICE * selectedMode.multiplier;
    const usageMinutes = duration;
    const usagePrice = unitPrice * (usageMinutes / 10);
    const totalAmount = basePrice + usagePrice;
    const ecoDiscount = user?.ecoPoints ? Math.min(user.ecoPoints * 0.01, totalAmount * 0.1) : 0;
    const finalAmount = totalAmount - ecoDiscount;

    return {
      basePrice,
      unitPrice,
      usageMinutes,
      usagePrice,
      totalAmount,
      ecoDiscount,
      finalAmount,
    };
  }, [selectedMode, duration, user]);

  const handleModeChange = (mode: DeviceMode) => {
    setSelectedMode(mode);
    setDuration(mode.duration);
  };

  const handleAction = (type: 'start' | 'book') => {
    if (!device) return;
    
    if (device.status !== 'online') {
      showNotification('warning', '设备当前不在线，无法使用');
      return;
    }
    
    if (device.workingStatus === 'running') {
      showNotification('warning', '设备正在运行中，请等待');
      return;
    }

    if (type === 'book' && !selectedSlot) {
      showNotification('warning', '请选择预约时段');
      return;
    }

    if (!selectedMode) {
      showNotification('warning', '请选择使用模式');
      return;
    }

    setActionType(type);
    setConfirmModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!device || !selectedMode || !priceCalculation) return;
    
    try {
      setSubmitting(true);

      const bookingData: any = {
        deviceId: device._id,
        deviceType: device.deviceType,
        mode: selectedMode.value,
        duration: duration,
        pricing: {
          basePrice: priceCalculation.basePrice,
          unitPrice: priceCalculation.unitPrice,
          totalAmount: priceCalculation.totalAmount,
          discountAmount: priceCalculation.ecoDiscount,
          finalAmount: priceCalculation.finalAmount,
        },
        source: 'web',
      };

      if (actionType === 'book' && selectedSlot) {
        const [startHour, startMin] = selectedSlot.split(':').map(Number);
        const startTime = selectedDate
          .hour(startHour)
          .minute(startMin)
          .second(0);
        const endTime = startTime.add(duration, 'minute');
        
        bookingData.startTime = startTime.toISOString();
        bookingData.endTime = endTime.toISOString();
        bookingData.timeSlot = selectedSlot;
      } else {
        bookingData.startTime = dayjs().toISOString();
        bookingData.endTime = dayjs().add(duration, 'minute').toISOString();
      }

      const res = await bookingApi.createBooking(bookingData);
      
      if (res.success && res.data) {
        setConfirmModalVisible(false);
        showNotification('success', actionType === 'start' ? '设备启动成功' : '预约成功');
        
        if (actionType === 'start') {
          await bookingApi.startBooking(res.data._id);
          navigate(`/resident/bookings/${res.data._id}`);
        } else {
          navigate('/resident/bookings');
        }
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getDeviceIcon = () => {
    if (!device) return '❓';
    return DEVICE_TYPE_ICONS[device.deviceType];
  };

  const getDeviceColor = () => {
    if (!device) return '#1890ff';
    return DEVICE_TYPE_COLORS[device.deviceType];
  };

  const getUsageMetrics = () => {
    if (!deviceStatus) return null;
    
    const metrics = deviceStatus.metrics || {};
    const items = [];
    
    if (metrics.electricityUsed !== undefined) {
      items.push({
        icon: <ThunderboltOutlined style={{ color: '#faad14' }} />,
        label: '用电量',
        value: `${metrics.electricityUsed.toFixed(2)} kWh`,
      });
    }
    
    if (metrics.waterUsed !== undefined) {
      items.push({
        icon: <WaterOutlined style={{ color: '#1890ff' }} />,
        label: '用水量',
        value: `${metrics.waterUsed.toFixed(2)} L`,
      });
    }
    
    if (metrics.temperature !== undefined) {
      items.push({
        icon: <InfoCircleOutlined style={{ color: '#ff4d4f' }} />,
        label: '温度',
        value: `${metrics.temperature}°C`,
      });
    }
    
    if (metrics.weight !== undefined) {
      items.push({
        icon: <InfoCircleOutlined style={{ color: '#722ed1' }} />,
        label: '重量',
        value: `${metrics.weight} kg`,
      });
    }
    
    return items;
  };

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="page-container">
        <Card className="card-shadow">
          <Empty description="设备不存在" />
          <Button onClick={() => navigate('/resident/devices')} style={{ marginTop: 16 }}>
            返回设备列表
          </Button>
        </Card>
      </div>
    );
  }

  const usageMetrics = getUsageMetrics();
  const remainingTime = deviceStatus?.remainingTime || 0;
  const progress = deviceStatus?.progress || 0;

  return (
    <div className="page-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/resident/devices')}
        style={{ marginBottom: 16 }}
      >
        返回设备列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            className="card-shadow"
            style={{
              marginBottom: 24,
              borderLeft: `4px solid ${getDeviceColor()}`,
            }}
          >
            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space align="center" size={24}>
                <div
                  style={{
                    fontSize: '80px',
                    background: `${getDeviceColor()}15`,
                    borderRadius: '16px',
                    padding: '24px',
                  }}
                >
                  {getDeviceIcon()}
                </div>
                <div>
                  <Title level={3} style={{ margin: 0 }}>{device.name}</Title>
                  <Space size="middle" style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      {DEVICE_TYPE_MAP[device.deviceType]} · {device.deviceCode}
                    </Text>
                    <StatusBadge type="device" status={device.status} />
                    <StatusBadge type="working" status={device.workingStatus} />
                  </Space>
                  <Space size="middle" style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      <EnvironmentOutlined /> {device.location?.building} {device.location?.floor} {device.location?.room}
                    </Text>
                  </Space>
                </div>
              </Space>
              <Space>
                <Button icon={<QrcodeOutlined />}>查看二维码</Button>
              </Space>
            </Space>
          </Card>

          {device.workingStatus === 'running' && deviceStatus && (
            <Card
              className="card-shadow"
              style={{
                marginBottom: 24,
                background: `linear-gradient(135deg, ${getDeviceColor()}10 0%, ${getDeviceColor()}20 100%)`,
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space align="center">
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#52c41a',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                  <Title level={5} style={{ margin: 0, color: WORKING_STATUS_COLOR_MAP[device.workingStatus] }}>
                    {WORKING_STATUS_MAP[device.workingStatus]}
                  </Title>
                </Space>
                
                {progress !== undefined && (
                  <Progress
                    percent={progress}
                    strokeColor={{
                      '0%': getDeviceColor(),
                      '100%': DEVICE_TYPE_COLORS.shower,
                    }}
                    format={(percent) => `${percent}% 完成`}
                  />
                )}

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="已运行时间"
                      value={deviceStatus.elapsedTime || 0}
                      suffix="分钟"
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="剩余时间"
                      value={remainingTime}
                      suffix="分钟"
                      valueStyle={{ color: remainingTime < 5 ? '#ff4d4f' : '#1890ff' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="当前模式"
                      value={deviceStatus.mode ? deviceModes.find(m => m.value === deviceStatus.mode)?.label || deviceStatus.mode : '-'}
                    />
                  </Col>
                </Row>

                {usageMetrics && usageMetrics.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row gutter={[16, 16]}>
                      {usageMetrics.map((metric, index) => (
                        <Col span={12} key={index}>
                          <Space align="center">
                            {metric.icon}
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>{metric.label}</Text>
                              <div>
                                <Text strong>{metric.value}</Text>
                              </div>
                            </div>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </Space>
            </Card>
          )}

          <Card
            className="card-shadow"
            title={<Title level={5} style={{ margin: 0 }}>设备信息</Title>}
            style={{ marginBottom: 24 }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="设备编号">{device.deviceCode}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{DEVICE_TYPE_MAP[device.deviceType]}</Descriptions.Item>
              <Descriptions.Item label="设备状态">{DEVICE_STATUS_MAP[device.status]}</Descriptions.Item>
              <Descriptions.Item label="运行状态">{WORKING_STATUS_MAP[device.workingStatus]}</Descriptions.Item>
              <Descriptions.Item label="位置">
                {device.location?.building} {device.location?.floor} {device.location?.room}
              </Descriptions.Item>
              <Descriptions.Item label="通讯协议">{device.protocol}</Descriptions.Item>
              <Descriptions.Item label="累计使用">
                {device.totalUsage} 次 / {formatDuration(device.totalDuration || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="故障次数">{device.faultCount} 次</Descriptions.Item>
              <Descriptions.Item label="生产厂商">{device.manufacturer || '-'}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{device.model || '-'}</Descriptions.Item>
              <Descriptions.Item label="安装日期">{formatDateTime(device.installDate)}</Descriptions.Item>
              <Descriptions.Item label="最后心跳">
                {device.lastHeartbeat ? formatDateTime(device.lastHeartbeat) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            className="card-shadow"
            title={
              <Space align="center">
                <CalendarOutlined style={{ color: getDeviceColor() }} />
                <Title level={5} style={{ margin: 0 }}>预约时段</Title>
              </Space>
            }
            style={{ marginBottom: 24 }}
            extra={
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                allowClear={false}
              />
            }
          >
            {timeSlots.length > 0 ? (
              <div className="booking-calendar">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`booking-slot ${
                      selectedSlot === slot.time ? 'selected' : ''
                    } ${!slot.available ? 'disabled' : ''}`}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedSlot(slot.time);
                      }
                    }}
                  >
                    <div>{slot.time}</div>
                    {slot.booked && <Text type="danger" style={{ fontSize: '10px' }}>已预约</Text>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无可用时段" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="card-shadow"
            style={{ marginBottom: 24 }}
            title={<Title level={5} style={{ margin: 0 }}>使用模式</Title>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <RadioGroup
                value={selectedMode?.value}
                onChange={(e) => {
                  const mode = deviceModes.find((m) => m.value === e.target.value);
                  if (mode) handleModeChange(mode);
                }}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {deviceModes.map((mode) => (
                    <RadioButton
                      key={mode.value}
                      value={mode.value}
                      style={{
                        width: '100%',
                        height: 'auto',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: selectedMode?.value === mode.value ? `${getDeviceColor()}10` : '#fff',
                        borderColor: selectedMode?.value === mode.value ? getDeviceColor() : '#d9d9d9',
                      }}
                    >
                      <Space align="center">
                        <div>
                          <Text strong>{mode.label}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {formatDuration(mode.duration)} · {(mode.multiplier * 100).toFixed(0)}% 价格
                            </Text>
                          </div>
                        </div>
                      </Space>
                      <Tag color={selectedMode?.value === mode.value ? 'blue' : 'default'}>
                        {formatPrice(BASE_PRICE + UNIT_PRICE * mode.multiplier * (mode.duration / 10))}
                      </Tag>
                    </RadioButton>
                  ))}
                </Space>
              </RadioGroup>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Text type="secondary">使用时长</Text>
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                  <Form.Item name="duration" style={{ marginBottom: 0 }}>
                    <InputNumber
                      min={5}
                      max={120}
                      step={5}
                      value={duration}
                      onChange={(value) => setDuration(value || 30)}
                      style={{ width: '100%' }}
                      addonBefore="分钟"
                      disabled={device.workingStatus === 'running'}
                    />
                  </Form.Item>
                </Form>
              </div>
            </Space>
          </Card>

          <Card
            className="card-shadow"
            style={{ marginBottom: 24 }}
            title={<Title level={5} style={{ margin: 0 }}>价格明细</Title>}
          >
            {priceCalculation && (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text type="secondary">基础服务费</Text>
                  <Text>{formatPrice(priceCalculation.basePrice)}</Text>
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text type="secondary">
                    使用费 ({priceCalculation.usageMinutes}分钟 × {formatPrice(priceCalculation.unitPrice)}/10分钟)
                  </Text>
                  <Text>{formatPrice(priceCalculation.usagePrice)}</Text>
                </Space>
                {priceCalculation.ecoDiscount > 0 && (
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text type="secondary">环保积分抵扣</Text>
                    <Text type="success">-{formatPrice(priceCalculation.ecoDiscount)}</Text>
                  </Space>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: '16px' }}>应付金额</Text>
                  <Text strong style={{ fontSize: '24px', color: getDeviceColor() }}>
                    {formatPrice(priceCalculation.finalAmount)}
                  </Text>
                </Space>
                {wallet && wallet.balance < priceCalculation.finalAmount && (
                  <Alert
                    type="warning"
                    showIcon
                    message="余额不足"
                    description={`当前余额 ${formatPrice(wallet.balance)}，请先充值`}
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            )}
          </Card>

          <Card className="card-shadow">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary">安全保障</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  设备已通过安全检测
                </Text>
              </Space>

              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => handleAction('start')}
                disabled={
                  device.status !== 'online' ||
                  device.workingStatus === 'running' ||
                  device.workingStatus === 'reserved' ||
                  !selectedMode
                }
                style={{ width: '100%', height: '48px', fontSize: '16px' }}
              >
                立即启动
              </Button>

              <Button
                size="large"
                icon={<CalendarOutlined />}
                onClick={() => handleAction('book')}
                disabled={
                  device.status !== 'online' ||
                  !selectedMode ||
                  !selectedSlot
                }
                style={{ width: '100%', height: '48px', fontSize: '16px' }}
              >
                {selectedSlot ? `预约 ${selectedSlot}` : '请先选择预约时段'}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={actionType === 'start' ? '确认启动' : '确认预约'}
        open={confirmModalVisible}
        onOk={handleConfirm}
        onCancel={() => setConfirmModalVisible(false)}
        confirmLoading={submitting}
        okText={actionType === 'start' ? '立即启动' : '确认预约'}
        cancelText="取消"
      >
        {device && selectedMode && priceCalculation && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={
                actionType === 'start'
                  ? `即将启动 ${device.name}`
                  : `即将预约 ${device.name} ${selectedDate.format('YYYY-MM-DD')} ${selectedSlot}`
              }
            />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
              <Descriptions.Item label="使用模式">{selectedMode.label}</Descriptions.Item>
              <Descriptions.Item label="使用时长">{formatDuration(duration)}</Descriptions.Item>
              <Descriptions.Item label="应付金额">
                <Text strong style={{ color: getDeviceColor(), fontSize: '18px' }}>
                  {formatPrice(priceCalculation.finalAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            {actionType === 'start' && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                点击"立即启动"后，设备将开始运行，费用将从您的账户余额中扣除。
              </Text>
            )}
          </Space>
        )}
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ResidentDeviceDetail;
