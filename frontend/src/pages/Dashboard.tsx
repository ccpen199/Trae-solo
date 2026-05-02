import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { UserRole, TaskStatus, StatisticsOverview, TaskUnit } from '../types';
import api from '../utils/api';

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.DRAFT]: 'default',
  [TaskStatus.PENDING]: 'blue',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.DELIVERED]: 'orange',
  [TaskStatus.PENDING_REVIEW]: 'warning',
  [TaskStatus.REVIEWING]: 'processing',
  [TaskStatus.QUALIFIED]: 'success',
  [TaskStatus.DISQUALIFIED]: 'error',
  [TaskStatus.APPEALING]: 'warning',
  [TaskStatus.SETTLED]: 'green',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.DRAFT]: '草稿',
  [TaskStatus.PENDING]: '待领取',
  [TaskStatus.IN_PROGRESS]: '进行中',
  [TaskStatus.DELIVERED]: '已交付',
  [TaskStatus.PENDING_REVIEW]: '待复核',
  [TaskStatus.REVIEWING]: '审核中',
  [TaskStatus.QUALIFIED]: '合格',
  [TaskStatus.DISQUALIFIED]: '不合格',
  [TaskStatus.APPEALING]: '申诉中',
  [TaskStatus.SETTLED]: '已结算',
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [statistics, setStatistics] = useState<StatisticsOverview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.PUBLISHER) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/statistics/overview');
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={statistics?.total_tasks || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics?.in_progress_tasks || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics?.completed_tasks || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已结算金额"
              value={statistics?.total_settled || 0}
              prefix={<MoneyCollectOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="平台统计概览">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic title="用户总数" value={statistics?.total_users || 0} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="接单员数量" value={statistics?.total_workers || 0} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title="专家数量" value={statistics?.total_experts || 0} />
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderWorkerDashboard = () => (
    <>
      <Card title="接单员工作台" style={{ marginBottom: 16 }}>
        <p>欢迎使用众包任务平台！作为接单员，您可以：</p>
        <ul>
          <li>在任务大厅浏览可领取的任务</li>
          <li>领取任务并完成交付</li>
          <li>查看我的任务状态</li>
          <li>查看钱包余额和交易记录</li>
        </ul>
      </Card>
      <Card title="快捷操作">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <p style={{ marginTop: 12 }}>任务大厅</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <p style={{ marginTop: 12 }}>我的任务</p>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <MoneyCollectOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <p style={{ marginTop: 12 }}>我的钱包</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderPublisherDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={statistics?.total_tasks || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics?.in_progress_tasks || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics?.completed_tasks || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总金额"
              value={statistics?.total_reward || 0}
              prefix={<MoneyCollectOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <p style={{ marginTop: 12 }}>发布新任务</p>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card hoverable style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <p style={{ marginTop: 12 }}>查看任务批次</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderExpertDashboard = () => (
    <>
      <Card title="专家工作台" style={{ marginBottom: 16 }}>
        <p>欢迎使用众包任务平台！作为专家，您可以：</p>
        <ul>
          <li>查看待审核的任务</li>
          <li>对任务进行盲审</li>
          <li>提交审核结果</li>
        </ul>
      </Card>
      <Card title="快捷操作">
        <Card hoverable style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <p style={{ marginTop: 12 }}>待审核任务</p>
        </Card>
      </Card>
    </>
  );

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        欢迎回来，{user?.real_name || user?.username}！
      </h1>

      {user?.role === UserRole.ADMIN && renderAdminDashboard()}
      {user?.role === UserRole.WORKER && renderWorkerDashboard()}
      {user?.role === UserRole.PUBLISHER && renderPublisherDashboard()}
      {user?.role === UserRole.EXPERT && renderExpertDashboard()}
    </div>
  );
};

export default Dashboard;
