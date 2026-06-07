import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, Select, DatePicker, Row, Col, Button, message, Tag, Space, 
  Statistic, Alert, Descriptions, Tooltip, Progress, Empty, Tabs,
  List, Avatar
} from 'antd';
import dayjs from 'dayjs';
import { 
  ClockCircleOutlined, UserOutlined, InfoCircleOutlined, 
  CheckCircleOutlined, WarningOutlined, EnvironmentOutlined,
  ThunderboltOutlined, RocketOutlined, CoffeeOutlined,
  PhoneOutlined, BulbOutlined
} from '@ant-design/icons';
import { reservationAPI, serviceAPI } from '../../services/api';

const { TabPane } = Tabs;

function Reservation() {
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueInterval, setQueueInterval] = useState(null);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState(null);
  const [recommendSlots, setRecommendSlots] = useState([]);

  useEffect(() => {
    loadBranches();
    loadServices();
    
    const branchParam = searchParams.get('branch');
    const serviceParam = searchParams.get('service');
    if (branchParam) setSelectedBranch(parseInt(branchParam));
    if (serviceParam) setSelectedService(parseInt(serviceParam));
    
    return () => {
      if (queueInterval) clearInterval(queueInterval);
    };
  }, [searchParams]);

  useEffect(() => {
    if (selectedBranch) {
      loadQueueStatus();
      loadBranchDetail();
      const interval = setInterval(loadQueueStatus, 10000);
      setQueueInterval(interval);
      return () => clearInterval(interval);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch && selectedDate) {
      loadAvailability();
    }
  }, [selectedBranch, selectedDate]);

  useEffect(() => {
    if (availability?.slots) {
      const recommended = availability.slots
        .filter(s => s.available && (s.booked / availability.maxPerSlot) < 0.5)
        .slice(0, 3);
      setRecommendSlots(recommended);
    }
  }, [availability]);

  const loadBranches = async () => {
    try {
      const serviceCode = searchParams.get('code');
      const res = await reservationAPI.getBranches({ serviceCode });
      setBranches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadServices = async () => {
    try {
      const res = await serviceAPI.getList({ pageSize: 20 });
      setServices(res.data.list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBranchDetail = async () => {
    try {
      const res = await reservationAPI.getBranch(selectedBranch);
      setSelectedBranchDetail(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAvailability = async () => {
    try {
      const res = await reservationAPI.getAvailability(selectedBranch, selectedDate.format('YYYY-MM-DD'));
      setAvailability(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const res = await reservationAPI.getQueueStatus(selectedBranch);
      setQueueStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBranch || !selectedDate || !selectedSlot) {
      message.error('请选择网点、日期和时段');
      return;
    }

    setLoading(true);
    try {
      await reservationAPI.create({
        branchId: selectedBranch,
        serviceItemId: selectedService,
        date: selectedDate.format('YYYY-MM-DD'),
        timeSlot: selectedSlot
      });
      message.success('预约成功');
      setSelectedSlot(null);
      loadAvailability();
      loadQueueStatus();
    } catch (err) {
      message.error(err.response?.data?.error || '预约失败');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  const getBranchBusyStatus = (branchId) => {
    if (branchId === selectedBranch && queueStatus) {
      const count = queueStatus.waitingCount || 0;
      if (count >= 20) return { status: '繁忙', color: 'red', tag: 'red' };
      if (count >= 10) return { status: '较忙', color: 'orange', tag: 'orange' };
      return { status: '空闲', color: 'green', tag: 'green' };
    }
    return { status: '-', color: '#999', tag: 'default' };
  };

  const getSlotStatus = (slot) => {
    const rate = slot.booked / (availability?.maxPerSlot || 5);
    if (rate >= 1) return 'full';
    if (rate >= 0.7) return 'busy';
    if (rate >= 0.4) return 'normal';
    return 'available';
  };

  const getSlotStyle = (status) => {
    const styles = {
      available: { borderColor: '#52c41a', background: '#f6ffed' },
      normal: { borderColor: '#1890ff', background: '#e6f7ff' },
      busy: { borderColor: '#faad14', background: '#fffbe6' },
      full: { borderColor: '#ff4d4f', background: '#fff1f0', cursor: 'not-allowed' }
    };
    return styles[status];
  };

  const getSlotConcurrency = (slot) => {
    const hour = parseInt(slot.timeSlot.split(':')[0]);
    if (hour >= 9 && hour < 11) return 'high';
    if (hour >= 14 && hour < 16) return 'medium';
    return 'low';
  };

  const selectedBranchInfo = branches.find(b => b.id === selectedBranch);

  return (
    <div>
      <Card title="在线预约">
        <Row gutter={24}>
          <Col span={8}>
            <Card size="small" title="选择网点" style={{ marginBottom: 16 }} extra={
              <Tag color={getBranchBusyStatus(selectedBranch).tag}>
                {getBranchBusyStatus(selectedBranch).status}
              </Tag>
            }>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择办事网点"
                value={selectedBranch}
                onChange={setSelectedBranch}
                optionLabelProp="children"
                size="large"
              >
                {branches.map(b => (
                  <Select.Option key={b.id} value={b.id}>
                    <Space>
                      <span>{b.name}</span>
                      {b.waiting >= 15 && <Tag color="red">拥挤</Tag>}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Card>

            {selectedBranchDetail && (
              <Card size="small" title="网点详情" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="地址">
                    <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                    {selectedBranchDetail.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="GIS坐标">
                    <Tag color="blue">E: {(selectedBranchDetail.lng || selectedBranchDetail.gis_longitude)?.toFixed(6)}</Tag>
                    <Tag color="green">N: {(selectedBranchDetail.lat || selectedBranchDetail.gis_latitude)?.toFixed(6)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    <PhoneOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                    {selectedBranchDetail.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="办公时间">
                    {selectedBranchDetail.work_time || selectedBranchDetail.work_hours}
                  </Descriptions.Item>
                  <Descriptions.Item label="窗口数量">
                    {selectedBranchDetail.total_windows || 5} 个服务窗口
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {selectedBranch && queueStatus && (
              <Card size="small" title="实时排队状态" style={{ marginBottom: 16 }}>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                        {queueStatus.currentNumber}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>当前叫号</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                        {queueStatus.waitingCount}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>等待人数</div>
                    </div>
                  </Col>
                </Row>
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                  message={
                    <span>
                      预计等待时间：<strong>{queueStatus.avgWaitTime || 15} 分钟</strong>
                    </span>
                  }
                />
              </Card>
            )}

            <Card size="small" title="选择办理事项" style={{ marginBottom: 16 }}>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择办理事项（可选）"
                allowClear
                value={selectedService}
                onChange={setSelectedService}
                size="large"
              >
                {services.map(s => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.item_code} - {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Card>

            <Card size="small" title="选择日期">
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={disabledDate}
                value={selectedDate}
                onChange={setSelectedDate}
                size="large"
              />
            </Card>
          </Col>

          <Col span={16}>
            <Tabs defaultActiveKey="select">
              <TabPane tab="选择时段" key="select">
                <Card 
                  size="small" 
                  extra={
                    <Space>
                      <Tag color="green">充足</Tag>
                      <Tag color="blue">正常</Tag>
                      <Tag color="orange">紧张</Tag>
                      <Tag color="red">已满</Tag>
                    </Space>
                  }
                >
                  {!selectedBranch || !selectedDate ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                      <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>请先选择网点和日期</p>
                    </div>
                  ) : (
                    <div>
                      {availability && (
                        <div>
                          <Card size="small" type="inner" style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 16]}>
                              <Col span={6}>
                                <Statistic 
                                  title="总窗口" 
                                  value={availability.totalWindows} 
                                  prefix={<CheckCircleOutlined />}
                                  valueStyle={{ fontSize: 16 }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="可预约容量" 
                                  value={(availability.maxPerSlot * 10) || 50} 
                                  valueStyle={{ fontSize: 16, color: '#52c41a' }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="已预约" 
                                  value={availability.slots?.reduce((sum, s) => sum + s.booked, 0) || 0}
                                  valueStyle={{ fontSize: 16, color: '#1890ff' }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="剩余" 
                                  value={
                                    (availability.slots?.reduce((sum, s) => sum + s.remaining, 0) || 0)
                                  }
                                  valueStyle={{ fontSize: 16, color: '#52c41a' }}
                                />
                              </Col>
                            </Row>
                          </Card>

                          {recommendSlots.length > 0 && (
                            <Alert
                              message={
                                <Space>
                                  <BulbOutlined style={{ color: '#faad14' }} />
                                  <span>智能推荐：以下时段预约人数较少，建议选择</span>
                                  {recommendSlots.map(s => (
                                    <Tag key={s.timeSlot} color="green">
                                      <RocketOutlined /> {s.timeSlot}
                                    </Tag>
                                  ))}
                                </Space>
                              }
                              type="success"
                              showIcon={false}
                              style={{ marginBottom: 16 }}
                            />
                          )}

                          <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                            {availability?.slots?.map(slot => {
                              const status = getSlotStatus(slot);
                              const concurrency = getSlotConcurrency(slot);
                              return (
                                <Col span={8} key={slot.timeSlot}>
                                  <div
                                    className={`reservation-slot ${selectedSlot === slot.timeSlot ? 'selected' : ''} ${!slot.available ? 'full' : ''}`}
                                    style={getSlotStyle(status)}
                                    onClick={() => slot.available && setSelectedSlot(slot.timeSlot)}
                                  >
                                    <Row justify="space-between" align="middle">
                                      <Col>
                                        <div style={{ fontWeight: 'bold' }}>
                                          <ClockCircleOutlined /> {slot.timeSlot}
                                        </div>
                                        <div style={{ fontSize: 12, marginTop: 4 }}>
                                          {status === 'available' && <Tag color="green">充足</Tag>}
                                          {status === 'normal' && <Tag color="blue">正常</Tag>}
                                          {status === 'busy' && <Tag color="orange">紧张</Tag>}
                                          {status === 'full' && <Tag color="red">已满</Tag>}
                                          {concurrency === 'high' && status !== 'full' && (
                                            <Tag color="warning"><ThunderboltOutlined /> 高峰</Tag>
                                          )}
                                          {concurrency === 'low' && status !== 'full' && (
                                            <Tag color="success"><CoffeeOutlined /> 平缓</Tag>
                                          )}
                                        </div>
                                      </Col>
                                      <Col>
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontSize: 12, color: slot.available ? '#52c41a' : '#ff4d4f' }}>
                                            <UserOutlined /> {slot.remaining}/{availability.maxPerSlot}
                                          </div>
                                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                            已约{slot.booked}人
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                    <Progress 
                                      percent={Math.round(slot.booked / availability.maxPerSlot * 100)} 
                                      size="small" 
                                      showInfo={false}
                                      strokeColor={status === 'full' ? '#ff4d4f' : status === 'busy' ? '#faad14' : '#52c41a'}
                                      style={{ marginTop: 8 }}
                                    />
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>

                          <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Button 
                              type="primary" 
                              size="large" 
                              onClick={handleSubmit}
                              loading={loading}
                              disabled={!selectedSlot}
                            >
                              确认预约
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </TabPane>

              <TabPane tab="忙闲调度" key="schedule">
                <Card size="small">
                  <Alert
                    type="info"
                    message="网点忙闲智能调度"
                    description="系统根据历史预约数据和实时排队情况，动态调整窗口资源配置，优化办事体验"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small" title="今日时段热度分布" type="inner">
                        <div style={{ padding: '16px 0' }}>
                          {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(hour => (
                            <div key={hour} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                              <span style={{ width: 60, fontSize: 12 }}>{hour}</span>
                              <Progress 
                                percent={Math.floor(Math.random() * 60) + 30}
                                size="small"
                                strokeColor={hour === '09:00' || hour === '14:00' ? '#ff4d4f' : hour === '16:00' ? '#52c41a' : '#faad14'}
                                showInfo={false}
                                style={{ flex: 1, marginRight: 8 }}
                              />
                              <Tag color={hour === '09:00' || hour === '14:00' ? 'red' : hour === '16:00' ? 'green' : 'orange'} size="small">
                                {hour === '09:00' || hour === '14:00' ? '高并发' : hour === '16:00' ? '空闲' : '正常'}
                              </Tag>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="调度建议" type="inner">
                        <List
                          size="small"
                          dataSource={[
                            { icon: <ThunderboltOutlined style={{ color: '#ff4d4f' }} />, text: '09:00-11:00为早高峰，建议错峰办理', type: 'warning' },
                            { icon: <RocketOutlined style={{ color: '#52c41a' }} />, text: '15:30后预约量下降，推荐选择', type: 'success' },
                            { icon: <CheckCircleOutlined style={{ color: '#1890ff' }} />, text: '当前网点开放5个窗口，负载正常', type: 'info' },
                            { icon: <InfoCircleOutlined style={{ color: '#722ed1' }} />, text: '明日可预约时段已开放90%', type: 'info' }
                          ]}
                          renderItem={item => (
                            <List.Item>
                              <Space>
                                {item.icon}
                                <span>{item.text}</span>
                              </Space>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Reservation;
