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
  MoneyCollectOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { get } from '@/services/api';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

interface DashboardStats {
  registration: {
    total: number;
    completed: number;
    cancelled: number;
    refunded: number;
  };
  appointment: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  payment: {
    total: number;
    totalAmount: number;
    refundAmount: number;
    netAmount: number;
  };
}

interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  registrations: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

export const RegistrarDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  useEffect(() => {
    fetchDashboardStats();
    fetchDepartmentStats();
  }, [selectedDate]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const result = await get<DashboardStats>('/statistics/dashboard', {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setStats(result);
    } catch (error) {
      console.error('获取仪表盘统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const result = await get<DepartmentStat[]>('/statistics/departments', {
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setDepartmentStats(result);
    } catch (error) {
      console.error('获取科室统计失败:', error);
    }
  };

  const departmentColumns: ColumnsType<DepartmentStat> = [
    {
      title: '科室名称',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '总挂号数',
      dataIndex: 'registrations',
      key: 'registrations',
      sorter: (a, b) => a.registrations - b.registrations,
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: '已取消',
      dataIndex: 'cancelled',
      key: 'cancelled',
      render: (text) => <Tag color="red">{text}</Tag>,
    },
    {
      title: '营收 (元)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (text) => `¥${text.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
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
        <h2 style={{ margin: 0 }}>挂号员工作台</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />}>
            现场挂号
          </Button>
        </div>
      </div>

      {stats && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日挂号"
                  value={stats.registration.total}
                  prefix={<UserOutlined />}
                  suffix="人"
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Tag color="green">完成: {stats.registration.completed}</Tag>
                  <Tag color="red">取消: {stats.registration.cancelled + stats.registration.refunded}</Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日预约"
                  value={stats.appointment.total}
                  prefix={<ScheduleOutlined />}
                  suffix="个"
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Tag color="blue">已确认: {stats.appointment.confirmed}</Tag>
                  <Tag color="green">已完成: {stats.appointment.completed}</Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日营收"
                  value={stats.payment.netAmount}
                  prefix={<MoneyCollectOutlined />}
                  suffix="元"
                  precision={2}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <Tag color="green">收入: ¥{stats.payment.totalAmount}</Tag>
                  <Tag color="orange">退款: ¥{stats.payment.refundAmount}</Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日挂号率"
                  value={
                    stats.registration.total > 0
                      ? Math.round((stats.registration.completed / stats.registration.total) * 100)
                      : 0
                  }
                  prefix={<FileTextOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card title="挂号状态概览">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="总挂号数">
                    {stats.registration.total}
                  </Descriptions.Item>
                  <Descriptions.Item label="已完成">
                    {stats.registration.completed}
                  </Descriptions.Item>
                  <Descriptions.Item label="已取消">
                    {stats.registration.cancelled}
                  </Descriptions.Item>
                  <Descriptions.Item label="已退款">
                    {stats.registration.refunded}
                  </Descriptions.Item>
                  <Descriptions.Item label="支付笔数">
                    {stats.payment.total}
                  </Descriptions.Item>
                  <Descriptions.Item label="净收入">
                    ¥{stats.payment.netAmount}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="快捷操作">
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Button
                      block
                      icon={<PlusOutlined />}
                      style={{ height: 48 }}
                    >
                      现场挂号
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      block
                      icon={<SearchOutlined />}
                      style={{ height: 48 }}
                    >
                      查询挂号
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      block
                      icon={<ScheduleOutlined />}
                      style={{ height: 48 }}
                    >
                      预约管理
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      block
                      icon={<FileTextOutlined />}
                      style={{ height: 48 }}
                    >
                      发票打印
                    </Button>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Card title="科室挂号统计">
        {departmentStats.length > 0 ? (
          <Table
            columns={departmentColumns}
            dataSource={departmentStats}
            rowKey="departmentId"
            pagination={false}
          />
        ) : (
          <Empty description="暂无科室数据" />
        )}
      </Card>
    </div>
  );
};

export default RegistrarDashboard;
