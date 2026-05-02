import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Empty, Spin } from 'antd';
import {
  FileTextOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/api.js';
import { getStatusInfo, formatCurrency, formatDateTime } from '../../utils/status.js';

function RiskDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        applicationApi.getDashboardStats(),
        applicationApi.getApplications()
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data.applications?.slice(0, 5) || []);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">核心看板</div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="今日进件"
              value={stats.todayApplications || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="待风控审核"
              value={stats.pendingRisk || 0}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="累计通过"
              value={stats.totalApproved || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="累计拒绝"
              value={stats.totalRejected || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="最近风控审核" extra={<a onClick={() => navigate('/risk/reviews')}>查看全部</a>}>
            {applications.length > 0 ? (
              <div>
                {applications.map(app => (
                  <div key={app.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{app.application_no}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {app.borrower_name || '未知'} | {formatCurrency(app.loan_amount)} / {app.loan_term}个月
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: 4 }}>
                        <span className={getStatusInfo(app.status).color === 'error' ? 'ant-tag ant-tag-red' : 'ant-tag ant-tag-blue'}>
                          {getStatusInfo(app.status).label}
                        </span>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/risk/application/${app.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无待风控审核任务"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default RiskDashboard;
