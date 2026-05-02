import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  DatePicker,
  Spin,
  Empty,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ScheduleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { get, post } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

interface DoctorStats {
  basic: {
    name: string;
    department: string;
    title: string;
  };
  today: {
    total: number;
    completed: number;
    inConsultation: number;
    waiting: number;
    cancelled: number;
    avgDuration: number;
    revenue: number;
  };
  weekly: {
    total: number;
    completed: number;
    avgDuration: number;
    revenue: number;
  };
}

interface QueueItem {
  id: string;
  queueNumber: number;
  position: number;
  status: string;
  registration: {
    id: string;
    patient: {
      id: string;
      name: string;
      gender: string;
      phone: string;
    };
  };
}

export const DoctorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchDoctorStats();
      fetchQueue();
    }
  }, [user, selectedDate]);

  const fetchDoctorStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await get<DoctorStats>(`/statistics/doctors/${user.id}`, {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setStats(result);
    } catch (error) {
      console.error('获取医生统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    if (!user) return;
    try {
      const result = await get<{ waiting: QueueItem[] }>(`/queues/doctor/${user.id}`);
      setQueueItems(result.waiting || []);
    } catch (error) {
      console.error('获取队列失败:', error);
    }
  };

  const handleCallNext = async () => {
    if (!user) return;
    try {
      await post(`/queues/call-next/${user.id}`);
      fetchQueue();
    } catch (error) {
      console.error('叫号失败:', error);
    }
  };

  const handleStartConsultation = async (registrationId: string) => {
    try {
      await post(`/consultations/start/${registrationId}`);
      fetchQueue();
      fetchDoctorStats();
    } catch (error) {
      console.error('开始就诊失败:', error);
    }
  };

  const handleCompleteConsultation = async (registrationId: string) => {
    try {
      await post(`/consultations/complete/${registrationId}`);
      fetchQueue();
      fetchDoctorStats();
    } catch (error) {
      console.error('完成就诊失败:', error);
    }
  };

  const queueColumns: ColumnsType<QueueItem> = [
    {
      title: '候诊号',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      render: (num) => <Tag color="blue" style={{ fontSize: 16, fontWeight: 'bold' }}>{num}</Tag>,
    },
    {
      title: '患者姓名',
      dataIndex: ['registration', 'patient', 'name'],
      key: 'patientName',
    },
    {
      title: '性别',
      dataIndex: ['registration', 'patient', 'gender'],
      key: 'gender',
    },
    {
      title: '联系电话',
      dataIndex: ['registration', 'patient', 'phone'],
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          WAITING: { color: 'orange', text: '等待中' },
          CALLED: { color: 'blue', text: '已叫号' },
          IN_CONSULTATION: { color: 'processing', text: '就诊中' },
          COMPLETED: { color: 'success', text: '已完成' },
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const status = record.status;
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            {status === 'WAITING' && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartConsultation(record.registration.id)}
              >
                开始就诊
              </Button>
            )}
            {status === 'IN_CONSULTATION' && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleCompleteConsultation(record.registration.id)}
              >
                完成就诊
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>医生工作台</h2>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          style={{ width: 200 }}
        />
      </div>

      {stats && (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Descriptions title="医生信息" column={3}>
              <Descriptions.Item label="姓名">{stats.basic.name}</Descriptions.Item>
              <Descriptions.Item label="科室">{stats.basic.department}</Descriptions.Item>
              <Descriptions.Item label="职称">{stats.basic.title}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日挂号"
                  value={stats.today.total}
                  prefix={<UserOutlined />}
                  suffix="人"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="等待中"
                  value={stats.today.waiting}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="就诊中"
                  value={stats.today.inConsultation}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已完成"
                  value={stats.today.completed}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card title="今日统计">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="平均就诊时长">
                    {stats.today.avgDuration} 分钟
                  </Descriptions.Item>
                  <Descriptions.Item label="已取消">
                    {stats.today.cancelled} 人
                  </Descriptions.Item>
                  <Descriptions.Item label="营收">
                    ¥{stats.today.revenue}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="本周统计">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="总挂号数">
                    {stats.weekly.total} 人
                  </Descriptions.Item>
                  <Descriptions.Item label="已完成">
                    {stats.weekly.completed} 人
                  </Descriptions.Item>
                  <Descriptions.Item label="平均就诊时长">
                    {stats.weekly.avgDuration} 分钟
                  </Descriptions.Item>
                  <Descriptions.Item label="本周营收">
                    ¥{stats.weekly.revenue}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Card
        title="候诊队列"
        extra={
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={handleCallNext}
          >
            叫下一位
          </Button>
        }
      >
        {queueItems.length > 0 ? (
          <Table
            columns={queueColumns}
            dataSource={queueItems}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="暂无候诊患者" />
        )}
      </Card>
    </div>
  );
};

export default DoctorDashboard;
