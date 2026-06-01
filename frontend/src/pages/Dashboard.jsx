import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  FileTextOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { projectApi, clientApi, positionApi, candidateApi, slaApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    positions: 0,
    candidates: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentPositions, setRecentPositions] = useState([]);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, projectsRes, positionsRes, candidatesRes, warningsRes] = await Promise.all([
        clientApi.list(),
        projectApi.list(),
        positionApi.list(),
        candidateApi.list(),
        slaApi.getWarnings()
      ]);

      setStats({
        clients: clientsRes.data.length,
        projects: projectsRes.data.length,
        positions: positionsRes.data.length,
        candidates: candidatesRes.data.length
      });

      setRecentProjects(projectsRes.data.slice(0, 5));
      setRecentPositions(positionsRes.data.slice(0, 5));
      setWarnings(warningsRes.data.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '进行中' : '已完成'}
        </Tag>
      )
    }
  ];

  const positionColumns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          open: { color: 'green', text: '招聘中' },
          paused: { color: 'orange', text: '暂停' },
          closed: { color: 'default', text: '已关闭' }
        };
        const config = statusMap[status] || statusMap.open;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  const warningColumns = [
    {
      title: 'SLA指标',
      dataIndex: 'metric_type',
      key: 'metric_type',
      render: (type) => {
        const typeMap = {
          response: '岗位响应',
          first_recommend: '首批推荐',
          interview_arrange: '面试安排',
          offer_follow: 'Offer跟进'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '岗位',
      dataIndex: 'position_title',
      key: 'position_title'
    },
    {
      title: '剩余时间(小时)',
      dataIndex: 'remaining_hours',
      key: 'remaining_hours',
      render: (hours) => (
        <Tag color={hours <= 0 ? 'red' : hours < 6 ? 'orange' : 'default'}>
          {Math.max(0, hours)}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>数据看板</Title>
        <Typography.Text type="secondary">
          {dayjs().format('YYYY年MM月DD日')} 招聘工作概览
        </Typography.Text>
      </div>

      <Row gutter={[24, 24]} style={{ padding: '0 24px 24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="客户总数"
              value={stats.clients}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="项目总数"
              value={stats.projects}
              prefix={<ProjectOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="岗位总数"
              value={stats.positions}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="候选人总数"
              value={stats.candidates}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ padding: '0 24px 24px' }}>
        <Col xs={24} md={12}>
          <Card title="最近项目" className="card-shadow">
            <Table
              dataSource={recentProjects}
              columns={projectColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="最近岗位" className="card-shadow">
            <Table
              dataSource={recentPositions}
              columns={positionColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {warnings.length > 0 && (
        <Row gutter={[24, 24]} style={{ padding: '0 24px 24px' }}>
          <Col span={24}>
            <Card title="SLA预警提醒" className="card-shadow warning-card critical">
              <Table
                dataSource={warnings}
                columns={warningColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
