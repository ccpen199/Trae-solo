import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Space } from 'antd';
import { BookOutlined, FileTextOutlined, AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { assignmentAPI, submissionAPI, appealAPI } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    assignments: 0,
    submissions: 0,
    highSimilarity: 0,
    pendingAppeals: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, submissionsRes, appealsRes] = await Promise.all([
        assignmentAPI.getAll(),
        submissionAPI.getAll(),
        appealAPI.getAll()
      ]);

      const assignments = assignmentsRes.data.assignments || [];
      const submissions = submissionsRes.data.submissions || [];
      const appeals = appealsRes.data.appeals || [];

      const highSimilarity = submissions.filter(s => (s.max_similarity || 0) >= 80).length;
      const pendingAppeals = appeals.filter(a => a.status === 'pending').length;

      setStats({
        assignments: assignments.length,
        submissions: submissions.length,
        highSimilarity,
        pendingAppeals
      });

      setRecentAssignments(assignments.slice(0, 5));
      setRecentSubmissions(submissions.slice(0, 5));
    } catch (error) {
      console.error('Load dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityTag = (similarity) => {
    if (!similarity) return <Tag color="default">未检测</Tag>;
    if (similarity >= 80) return <Tag color="red">高风险 {similarity.toFixed(1)}%</Tag>;
    if (similarity >= 50) return <Tag color="orange">中风险 {similarity.toFixed(1)}%</Tag>;
    return <Tag color="green">低风险 {similarity.toFixed(1)}%</Tag>;
  };

  const getAppealStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>欢迎回来，{user.name}</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="作业任务"
              value={stats.assignments}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="提交总数"
              value={stats.submissions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="高相似度"
              value={stats.highSimilarity}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理申诉"
              value={stats.pendingAppeals}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近作业任务">
            <List
              dataSource={recentAssignments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space>
                        <span>截止: {dayjs(item.deadline).format('YYYY-MM-DD HH:mm')}</span>
                        <Tag color="blue">阈值: {item.similarity_threshold}%</Tag>
                        {item.allow_resubmit ? <Tag color="green">允许重交</Tag> : null}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近提交">
            <List
              dataSource={recentSubmissions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span>{item.file_name} (v{item.version})</span>}
                    description={
                      <Space>
                        <span>{item.student_name || '我的提交'}</span>
                        <span>{dayjs(item.submit_time).format('YYYY-MM-DD HH:mm')}</span>
                        {getSimilarityTag(item.max_similarity)}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
