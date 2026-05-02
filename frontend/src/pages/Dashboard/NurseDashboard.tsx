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
  Input,
  message,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { get, post } from '@/services/api';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

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
    doctor: {
      user: {
        name: string;
      };
    };
    department: {
      name: string;
    };
  };
}

export const NurseDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState<{
    total: number;
    checkedIn: number;
    inQueue: number;
    inConsultation: number;
    completed: number;
    averageWaitTime: number;
  } | null>(null);

  useEffect(() => {
    fetchQueue();
    fetchStatistics();
  }, [selectedDate]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const result = await get<{ waiting: QueueItem[]; called: QueueItem[] }>('/queues', {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      const allItems = [...(result.waiting || []), ...(result.called || [])];
      setQueueItems(allItems);
    } catch (error) {
      console.error('获取队列失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const result = await get('/check-ins/stats', {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setStatistics(result);
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    try {
      await post(`/check-ins/registration/${registrationId}`);
      message.success('签到成功');
      fetchQueue();
      fetchStatistics();
    } catch (error) {
      console.error('签到失败:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredQueueItems = queueItems.filter((item) => {
    if (!searchText) return true;
    return (
      item.queueNumber.toString().includes(searchText) ||
      item.registration.patient.name.includes(searchText)
    );
  });

  const queueColumns: ColumnsType<QueueItem> = [
    {
      title: '候诊号',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 80,
      render: (num) => <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold' }}>{num}</Tag>,
    },
    {
      title: '患者姓名',
      dataIndex: ['registration', 'patient', 'name'],
      key: 'patientName',
      width: 100,
    },
    {
      title: '科室',
      dataIndex: ['registration', 'department', 'name'],
      key: 'department',
      width: 100,
    },
    {
      title: '医生',
      dataIndex: ['registration', 'doctor', 'user', 'name'],
      key: 'doctor',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 120,
      render: (_, record) => {
        const status = record.status;
        if (status === 'WAITING') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record.registration.id)}
            >
              签到
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (loading && queueItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>护士工作台</h2>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          style={{ width: 200 }}
        />
      </div>

      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="总挂号数"
                value={statistics.total}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已签到"
                value={statistics.checkedIn}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="排队中"
                value={statistics.inQueue}
                valueStyle={{ color: '#faad14' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="就诊中"
                value={statistics.inConsultation}
                valueStyle={{ color: '#1890ff' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已完成"
                value={statistics.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="平均等待时长"
                value={statistics.averageWaitTime}
                suffix="分钟"
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title="候诊队列"
        extra={
          <Input
            placeholder="搜索候诊号或患者姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        }
      >
        {filteredQueueItems.length > 0 ? (
          <Table
            columns={queueColumns}
            dataSource={filteredQueueItems}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
          />
        ) : (
          <Empty description="暂无候诊患者" />
        )}
      </Card>
    </div>
  );
};

export default NurseDashboard;
