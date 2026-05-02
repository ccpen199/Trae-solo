import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Empty, Spin } from 'antd';
import {
  FileTextOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/api.js';
import { formatCurrency } from '../../utils/status.js';

function BorrowerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">我的首页</div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="总申请数"
              value={stats.totalApplications || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="进行中贷款"
              value={stats.activeLoans || 0}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="已结清贷款"
              value={stats.completedLoans || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/borrower/application')}
              style={{ height: '48px', fontSize: '16px' }}
              block
            >
              申请贷款
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="最近申请" extra={<a onClick={() => navigate('/borrower/loans')}>查看全部</a>}>
            {applications.length > 0 ? (
              <div>
                {applications.map(app => (
                  <div key={app.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{app.application_no}</div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {formatCurrency(app.loan_amount)} / {app.loan_term}个月
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: 4 }}>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => navigate(`/borrower/application/${app.id}`)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无贷款申请"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<FileAddOutlined />} onClick={() => navigate('/borrower/application')}>
                  立即申请
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default BorrowerDashboard;
