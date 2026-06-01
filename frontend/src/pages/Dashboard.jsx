import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { FileTextOutlined, CalendarOutlined, ClockCircleOutlined, BellOutlined } from '@ant-design/icons';
import { casesApi, schedulesApi, notificationsApi } from '../api';

const Dashboard = () => {
  const [overview, setOverview] = useState({
    cases: { total: 0, scheduled: 0, pending: 0, postponed: 0 },
    schedules: { total: 0, completed: 0 },
    notifications: { pending: 0, failed: 0 }
  });
  const [recentCases, setRecentCases] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [casesRes, schedulesRes, notificationsRes] = await Promise.all([
        casesApi.getAll(),
        schedulesApi.getAll({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] }),
        notificationsApi.getAll(),
      ]);
      
      const cases = casesRes.data;
      const schedules = schedulesRes.data;
      const notifications = notificationsRes.data;

      setOverview({
        cases: {
          total: cases.length,
          scheduled: cases.filter(c => c.status === 'scheduled').length,
          pending: cases.filter(c => c.status === 'pending_scheduling').length,
          postponed: cases.filter(c => c.status === 'postponed').length,
        },
        schedules: {
          total: schedules.length,
          completed: schedules.filter(s => s.status === 'completed').length,
        },
        notifications: {
          pending: notifications.filter(n => n.status === 'pending').length,
          failed: notifications.filter(n => n.status === 'failed').length,
        }
      });

      setRecentCases(cases.slice(0, 5));
      setTodaySchedules(schedules.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const caseColumns = [
    { title: '案号', dataIndex: 'case_number', key: 'case_number' },
    { title: '案由', dataIndex: 'case_reason', key: 'case_reason' },
    { title: '当事人', dataIndex: 'parties', key: 'parties' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending_scheduling: { color: 'orange', text: '待排期' },
          scheduled: { color: 'green', text: '已排期' },
          hearing: { color: 'blue', text: '审理中' },
          closed: { color: 'gray', text: '已结案' },
          postponed: { color: 'red', text: '已改期' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
  ];

  const scheduleColumns = [
    { title: '案号', dataIndex: 'case_number', key: 'case_number' },
    { title: '法庭', dataIndex: 'court_name', key: 'court_name' },
    { title: '法官', dataIndex: 'judge_name', key: 'judge_name' },
    { title: '开庭时间', dataIndex: 'start_time', key: 'start_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          scheduled: { color: 'green', text: '已排期' },
          ongoing: { color: 'blue', text: '审理中' },
          completed: { color: 'gray', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
          postponed: { color: 'orange', text: '已改期' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>首页概览</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="案件总数"
              value={overview.cases.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              已排期: {overview.cases.scheduled} | 待排期: {overview.cases.pending}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日排期"
              value={overview.schedules.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              已完成: {overview.schedules.completed}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待排案件"
              value={overview.cases.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              请及时安排排期
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待发通知"
              value={overview.notifications.pending}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              发送失败: {overview.notifications.failed}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近案件" extra={<a href="#/cases">查看全部</a>}>
            <Table
              columns={caseColumns}
              dataSource={recentCases.map(c => ({ ...c, key: c.id }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="今日排期" extra={<a href="#/scheduling">查看全部</a>}>
            <Table
              columns={scheduleColumns}
              dataSource={todaySchedules.map(s => ({ ...s, key: s.id }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
