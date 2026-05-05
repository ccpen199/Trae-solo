import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Spin,
  Empty
} from 'antd';
import {
  CalendarOutlined,
  NotificationOutlined,
  MessageOutlined,
  UserOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { reportApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const getStatusTag = (status) => {
  const statusMap = {
    PENDING: { text: '待审批', color: 'orange' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已拒绝', color: 'red' },
    COMPLETED: { text: '已完成', color: 'blue' },
    CANCELLED: { text: '已取消', color: 'default' },
    DRAFT: { text: '草稿', color: 'default' },
    EXTENDING: { text: '续假中', color: 'gold' }
  };
  const config = statusMap[status] || { text: status, color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const { user } = useUserStore();
  const isStudent = ['STUDENT', 'CLASS_MONITOR'].includes(user?.role);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const result = await reportApi.getStudentDashboard();
        setStats(result.data);
      } else {
        const result = await reportApi.getDashboardStats();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const studentColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '发布者',
      dataIndex: ['author', 'name'],
      key: 'author'
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    }
  ];

  const teacherColumns = [
    {
      title: '申请人',
      dataIndex: ['applicant', 'name'],
      key: 'applicant'
    },
    {
      title: '请假原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '请假天数',
      dataIndex: 'days',
      key: 'days',
      render: (days) => `${days} 天`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
      </div>

      {isStudent ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="请假记录"
                  value={stats?.leaveStats?.total || 0}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="待审批"
                  value={stats?.leaveStats?.pending || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="已通过"
                  value={stats?.leaveStats?.approved || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="最新公告" size="small">
                {stats?.recentAnnouncements?.length > 0 ? (
                  <Table
                    dataSource={stats.recentAnnouncements}
                    columns={studentColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="暂无公告" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="综合测评概览" size="small">
                {stats?.evaluationSummary?.length > 0 ? (
                  <Table
                    dataSource={stats.evaluationSummary}
                    columns={[
                      {
                        title: '学期',
                        dataIndex: 'semester',
                        key: 'semester'
                      },
                      {
                        title: '平均分',
                        dataIndex: 'average',
                        key: 'average',
                        render: (val) => `${val} 分`
                      },
                      {
                        title: '项目数',
                        dataIndex: 'count',
                        key: 'count'
                      }
                    ]}
                    rowKey="semester"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="暂无测评数据" />
                )}
              </Card>
            </Col>
          </Row>

          {stats?.classFeeSummary && (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Card 
                  title="班费情况" 
                  size="small"
                  extra={
                    <Statistic
                      value={stats.classFeeSummary.currentBalance}
                      prefix="¥"
                      valueStyle={{ color: '#1890ff', fontSize: 18 }}
                    />
                  }
                >
                  {stats.classFeeSummary.recentRecords?.length > 0 ? (
                    <Table
                      dataSource={stats.classFeeSummary.recentRecords}
                      columns={[
                        {
                          title: '描述',
                          dataIndex: 'description',
                          key: 'description'
                        },
                        {
                          title: '金额',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (amount) => (
                            <span className={amount > 0 ? 'income-amount' : 'expense-amount'}>
                              {amount > 0 ? '+' : ''}{amount} 元
                            </span>
                          )
                        },
                        {
                          title: '操作人',
                          dataIndex: ['operator', 'name'],
                          key: 'operator'
                        },
                        {
                          title: '时间',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          render: (text) => dayjs(text).format('YYYY-MM-DD')
                        }
                      ]}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ) : (
                    <Empty description="暂无班费记录" />
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="待审批请假"
                  value={stats?.pendingLeaves || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="待处理意见"
                  value={stats?.pendingFeedbacks || 0}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="已发布公告"
                  value={stats?.publishedAnnouncements || 0}
                  prefix={<NotificationOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="学生总数"
                  value={stats?.totalStudents || 0}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="待审批请假申请" size="small">
                {stats?.recentLeaves?.length > 0 ? (
                  <Table
                    dataSource={stats.recentLeaves}
                    columns={teacherColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="暂无待审批请假" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="最新公告" size="small">
                {stats?.recentAnnouncements?.length > 0 ? (
                  <Table
                    dataSource={stats.recentAnnouncements}
                    columns={studentColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty description="暂无公告" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
