import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Typography, Space, Tag, List, Empty, Spin, message, Modal, Form, DatePicker, InputNumber, Input } from 'antd';
import {
  HeartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
  EditOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { coupleAPI } from '../../api/index.js';

const { Title, Text } = Typography;

const KEY_MILESTONES = [
  { days: 365, title: '婚礼一周年', desc: '确定婚期，预订婚宴酒店', color: '#ff4d6d' },
  { days: 300, title: '提前10个月', desc: '挑选婚纱摄影机构', color: '#ff7a45' },
  { days: 270, title: '提前9个月', desc: '确定婚庆公司', color: '#faad14' },
  { days: 180, title: '提前6个月', desc: '选购婚纱礼服', color: '#a0d911' },
  { days: 120, title: '提前4个月', desc: '拍摄婚纱照', color: '#13c2c2' },
  { days: 90, title: '提前3个月', desc: '确定伴郎伴娘，预订蜜月', color: '#1890ff' },
  { days: 60, title: '提前2个月', desc: '发送电子请柬', color: '#722ed1' },
  { days: 30, title: '提前1个月', desc: '试妆试菜，确认细节', color: '#eb2f96' }
];

const WeddingCountdown = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchCountdown = async () => {
    setLoading(true);
    try {
      const response = await coupleAPI.getCountdown();
      setCountdown(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.warning('请先设置婚期信息');
      } else {
        message.error('获取倒计时信息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const response = await coupleAPI.getTasks({ status: 0 });
      const tasks = response.data || [];
      setUpcomingTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('获取待办任务失败', error);
    }
  };

  useEffect(() => {
    fetchCountdown();
    fetchUpcomingTasks();
  }, []);

  const handleUpdateProfile = async (values) => {
    try {
      await coupleAPI.updateProfile({
        wedding_date: values.wedding_date?.format('YYYY-MM-DD'),
        budget: values.budget,
        city: values.city
      });
      message.success('更新成功');
      setEditModalVisible(false);
      fetchCountdown();
      fetchUpcomingTasks();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getUpcomingMilestone = () => {
    if (!countdown) return null;
    const sorted = [...KEY_MILESTONES].sort((a, b) => a.days - b.days);
    return sorted.find(m => m.days >= countdown.days_left) || sorted[sorted.length - 1];
  };

  const getDaysLabel = (days) => {
    if (days === 0) return '今天是大喜之日！';
    if (days === 1) return '明天就是婚礼啦！';
    return `距离婚礼还有 ${days} 天`;
  };

  const upcomingMilestone = getUpcomingMilestone();

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', background: '#fafafa', minHeight: '100vh' }}>
      <Spin spinning={loading}>
        {countdown ? (
          <>
            <div
              style={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                borderRadius: 24,
                padding: '48px 32px',
                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20wedding%20flowers%20soft%20pink&image_size=landscape_16_9)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.15
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <HeartOutlined style={{ fontSize: 32, color: '#ff4d6d' }} />
                  <Title level={2} style={{ margin: 0, color: '#fff' }}>我们的婚礼</Title>
                  <HeartOutlined style={{ fontSize: 32, color: '#ff4d6d' }} />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
                    <CalendarOutlined /> {dayjs(countdown.wedding_date).format('YYYY年MM月DD日')}
                  </Text>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: 20,
                    padding: '40px 32px',
                    marginBottom: 24,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  {countdown.is_passed ? (
                    <>
                      <Title level={1} style={{ color: '#ff4d6d', margin: 0 }}>💍 新婚快乐！</Title>
                      <Text style={{ fontSize: 18, color: '#666' }}>愿你们的爱情永远甜蜜幸福</Text>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 72, fontWeight: 'bold', color: '#ff4d6d', lineHeight: 1, marginBottom: 8 }}>
                        {countdown.days_left}
                      </div>
                      <Text style={{ fontSize: 20, color: '#333' }}>{getDaysLabel(countdown.days_left)}</Text>
                    </>
                  )}
                </div>

                {upcomingMilestone && !countdown.is_passed && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 12,
                      padding: '16px 24px',
                      display: 'inline-block'
                    }}
                  >
                    <Space size={12}>
                      <BellOutlined style={{ color: upcomingMilestone.color, fontSize: 20 }} />
                      <div style={{ textAlign: 'left' }}>
                        <Text strong style={{ color: upcomingMilestone.color }}>
                          {upcomingMilestone.title}
                        </Text>
                        <div style={{ color: '#666', fontSize: 13 }}>{upcomingMilestone.desc}</div>
                      </div>
                    </Space>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Card
                style={{ borderRadius: 16 }}
                bodyStyle={{ padding: 32 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Title level={3} style={{ margin: 0 }}>
                    <span style={{ borderLeft: '4px solid #ff4d6d', paddingLeft: 12 }}>筹备进度</span>
                  </Title>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      form.setFieldsValue({
                        wedding_date: dayjs(countdown.wedding_date),
                        budget: countdown.budget,
                        city: countdown.city
                      });
                      setEditModalVisible(true);
                    }}
                  >
                    修改信息
                  </Button>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <Progress
                    percent={countdown.progress}
                    size="large"
                    strokeColor={{
                      '0%': '#ff9a9e',
                      '100%': '#ff4d6d'
                    }}
                    format={(percent) => (
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d6d' }}>{percent}%</span>
                    )}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Space size={8}>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text type="secondary">已完成 {countdown.completed_tasks} 项</Text>
                    </Space>
                    <Space size={8}>
                      <ClockCircleOutlined style={{ color: '#faad14' }} />
                      <Text type="secondary">剩余 {countdown.total_tasks - countdown.completed_tasks} 项</Text>
                    </Space>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Card
                    size="small"
                    style={{ flex: 1, minWidth: 200, borderRadius: 12, background: '#fff7e6' }}
                    bordered={false}
                  >
                    <Space size={12}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#faad14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>总预算</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                          ¥{countdown.budget?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </Space>
                  </Card>

                  <Card
                    size="small"
                    style={{ flex: 1, minWidth: 200, borderRadius: 12, background: '#e6f7ff' }}
                    bordered={false}
                  >
                    <Space size={12}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EnvironmentOutlined style={{ fontSize: 24, color: '#fff' }} />
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>举办城市</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                          {countdown.city || '未设置'}
                        </div>
                      </div>
                    </Space>
                  </Card>

                  <Card
                    size="small"
                    style={{ flex: 1, minWidth: 200, borderRadius: 12, background: '#f6ffed' }}
                    bordered={false}
                  >
                    <Space size={12}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StarOutlined style={{ fontSize: 24, color: '#fff' }} />
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>总任务</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                          {countdown.total_tasks} 项
                        </div>
                      </div>
                    </Space>
                  </Card>
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined style={{ color: '#ff4d6d' }} />
                    <span>关键节点提醒</span>
                  </div>
                }
                extra={
                  <Button type="link" onClick={() => navigate('/couple/tasks')}>
                    查看全部任务
                  </Button>
                }
                style={{ borderRadius: 16 }}
                bodyStyle={{ padding: 0 }}
              >
                <List
                  dataSource={KEY_MILESTONES}
                  renderItem={(item) => {
                    const isPast = countdown.days_left > item.days;
                    const isCurrent = upcomingMilestone?.days === item.days;
                    return (
                      <List.Item
                        style={{
                          padding: '16px 24px',
                          background: isCurrent ? `${item.color}08` : 'transparent',
                          borderLeft: isCurrent ? `4px solid ${item.color}` : '4px solid transparent'
                        }}
                      >
                        <Space size={16} style={{ width: '100%' }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: isPast ? '#f0f0f0' : item.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: isPast ? 0.5 : 1
                            }}
                          >
                            {isPast ? (
                              <CheckCircleOutlined style={{ color: '#bfbfbf' }} />
                            ) : (
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                {item.days}
                              </Text>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ color: isPast ? '#bfbfbf' : '#333', fontSize: 15 }}>
                              {item.title}
                            </Text>
                            <div style={{ color: isPast ? '#bfbfbf' : '#999', fontSize: 13, marginTop: 2 }}>
                              {item.desc}
                            </div>
                          </div>
                          {isCurrent && (
                            <Tag color="red" style={{ margin: 0 }}>进行中</Tag>
                          )}
                          {isPast && (
                            <Tag style={{ margin: 0 }}>已完成</Tag>
                          )}
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </div>

            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellOutlined style={{ color: '#ff4d6d' }} />
                  <span>即将到期任务</span>
                </div>
              }
              style={{ borderRadius: 16 }}
              bodyStyle={{ padding: 0 }}
            >
              {upcomingTasks.length > 0 ? (
                <List
                  dataSource={upcomingTasks}
                  renderItem={(task) => (
                    <List.Item
                      style={{ padding: '16px 24px', cursor: 'pointer' }}
                      onClick={() => navigate('/couple/tasks')}
                    >
                      <Space size={16} style={{ width: '100%' }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: task.priority === 1 ? '#ff4d4f' : task.priority === 2 ? '#faad14' : '#1890ff'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#333' }}>{task.title}</Text>
                          <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                            截止日期：{task.due_date}
                          </div>
                        </div>
                        <Tag color={task.priority === 1 ? 'red' : task.priority === 2 ? 'orange' : 'blue'}>
                          {task.priority === 1 ? '高优先级' : task.priority === 2 ? '中优先级' : '低优先级'}
                        </Tag>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无待办任务" style={{ padding: '40px 0' }} />
              )}
            </Card>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Title level={3} style={{ color: '#999', marginBottom: 24 }}>请先设置您的婚礼信息</Title>
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
              style={{
                height: 48,
                padding: '0 32px',
                fontSize: 16,
                background: '#ff4d6d',
                border: 'none',
                borderRadius: 24
              }}
            >
              设置婚礼信息
            </Button>
          </div>
        )}
      </Spin>

      <Modal
        title="设置婚礼信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="wedding_date"
            label="婚礼日期"
            rules={[{ required: true, message: '请选择婚礼日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择婚礼日期"
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item
            name="budget"
            label="总预算（元）"
            rules={[{ required: true, message: '请输入预算金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入预算金额"
              min={0}
              step={10000}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="city"
            label="举办城市"
            rules={[{ required: true, message: '请输入举办城市' }]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="请输入举办城市"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                height: 44,
                fontSize: 16,
                background: '#ff4d6d',
                border: 'none',
                borderRadius: 8
              }}
            >
              确认设置
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WeddingCountdown;
