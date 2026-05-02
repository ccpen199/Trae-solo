import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Timeline,
  Empty,
  Descriptions,
  Spin,
} from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { get } from '@/services/api';
import { useAuthStore } from '@/store/auth';

interface Appointment {
  id: string;
  appointmentDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  doctor: {
    user: {
      name: string;
    };
    title: string;
    department: {
      name: string;
    };
  };
  status: string;
}

interface Registration {
  id: string;
  registrationDate: string;
  queueNumber: number;
  doctor: {
    user: {
      name: string;
    };
  };
  department: {
    name: string;
  };
  status: string;
  queueItem?: {
    status: string;
    position: number;
  };
}

export const PatientDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchMyAppointments();
      fetchMyRegistrations();
    }
  }, [user]);

  const fetchMyAppointments = async () => {
    setLoading(true);
    try {
      const result = await get<Appointment[]>('/appointments/my');
      setAppointments(result || []);
    } catch (error) {
      console.error('获取预约失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const result = await get<Registration[]>('/registrations/my');
      setRegistrations(result || []);
    } catch (error) {
      console.error('获取挂号失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待确认' },
      CONFIRMED: { color: 'blue', text: '已确认' },
      COMPLETED: { color: 'success', text: '已完成' },
      CANCELLED: { color: 'red', text: '已取消' },
      CHECKED_IN: { color: 'green', text: '已签到' },
      IN_CONSULTATION: { color: 'processing', text: '就诊中' },
      REFUNDED: { color: 'orange', text: '已退款' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const activeRegistration = registrations.find(
    (r) => r.status === 'CHECKED_IN' || r.status === 'IN_CONSULTATION'
  );

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  );

  if (loading && appointments.length === 0 && registrations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>患者工作台</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="我的预约"
              value={upcomingAppointments.length}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待就诊"
              value={registrations.filter((r) => r.status === 'CHECKED_IN').length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成就诊"
              value={registrations.filter((r) => r.status === 'COMPLETED').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ cursor: 'pointer' }}>
            <Statistic
              title="预约挂号"
              value={0}
              prefix={<PlusOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {activeRegistration && (
        <Card
          title="当前就诊状态"
          style={{ marginBottom: 24, backgroundColor: '#e6f7ff' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="候诊号">
                  <Tag color="blue" style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {activeRegistration.queueNumber}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {getStatusTag(activeRegistration.status)}
                </Descriptions.Item>
                <Descriptions.Item label="医生">
                  {activeRegistration.doctor.user.name}
                </Descriptions.Item>
                <Descriptions.Item label="科室">
                  {activeRegistration.department.name}
                </Descriptions.Item>
                {activeRegistration.queueItem && (
                  <Descriptions.Item label="队列位置">
                    第 {activeRegistration.queueItem.position} 位
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: '已挂号',
                  },
                  {
                    color: activeRegistration.status === 'CHECKED_IN' ? 'blue' : 'green',
                    children: '已签到',
                  },
                  {
                    color: activeRegistration.status === 'IN_CONSULTATION' ? 'blue' : 'gray',
                    children: '就诊中',
                  },
                  {
                    color: activeRegistration.status === 'COMPLETED' ? 'green' : 'gray',
                    children: '已完成',
                  },
                ]}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="我的预约"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />}>
                新预约
              </Button>
            }
          >
            {upcomingAppointments.length > 0 ? (
              <Table
                dataSource={upcomingAppointments}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '日期',
                    dataIndex: 'appointmentDate',
                    key: 'date',
                  },
                  {
                    title: '时段',
                    key: 'time',
                    render: (_, record) =>
                      `${record.timeSlot.startTime}-${record.timeSlot.endTime}`,
                  },
                  {
                    title: '医生',
                    key: 'doctor',
                    render: (_, record) => (
                      <div>
                        <div>{record.doctor.user.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {record.doctor.title}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => getStatusTag(status),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无预约" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="挂号记录"
            extra={
              <Button type="link" size="small">
                查看全部
              </Button>
            }
          >
            {registrations.length > 0 ? (
              <Table
                dataSource={registrations.slice(0, 5)}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '日期',
                    dataIndex: 'registrationDate',
                    key: 'date',
                  },
                  {
                    title: '候诊号',
                    dataIndex: 'queueNumber',
                    key: 'queueNumber',
                    render: (num) => <Tag color="blue">{num}</Tag>,
                  },
                  {
                    title: '医生',
                    key: 'doctor',
                    render: (_, record) => record.doctor.user.name,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => getStatusTag(status),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无挂号记录" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientDashboard;
