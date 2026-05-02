import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, message, Typography } from 'antd';
import { 
  ProjectOutlined, 
  UserOutlined, 
  SafetyOutlined,
  AlertOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { projectApi, auditApi, bidApi, registrationApi } from '../services/api';

const { Title, Text } = Typography;

const statusColors = {
  draft: 'default',
  announcing: 'blue',
  registration: 'cyan',
  bidding: 'orange',
  completed: 'green',
  finished: 'purple'
};

const statusLabels = {
  draft: '草稿',
  announcing: '公告中',
  registration: '报名中',
  bidding: '竞价中',
  completed: '已成交',
  finished: '已完成'
};

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (hasRole(['supervisor', 'auditor'])) {
        try {
          const [statsRes, projectsRes] = await Promise.all([
            auditApi.getDashboardStats(),
            projectApi.getProjects()
          ]);
          setDashboardData(statsRes.data.data);
          setRecentProjects(projectsRes.data.data?.slice(0, 5) || []);
        } catch (err) {
          console.error('获取仪表板统计失败，继续加载项目:', err);
          const projectsRes = await projectApi.getProjects();
          setRecentProjects(projectsRes.data.data?.slice(0, 5) || []);
        }
      } else if (hasRole(['tenderer'])) {
        try {
          const projectsRes = await projectApi.getProjects();
          setRecentProjects(projectsRes.data.data?.slice(0, 5) || []);
        } catch (err) {
          console.error('获取项目列表失败:', err);
        }
      } else if (hasRole(['bidder'])) {
        try {
          const [regRes, bidsRes, projectsRes] = await Promise.all([
            registrationApi.getMyRegistrations().catch(() => ({ data: { data: [] } })),
            bidApi.getMyBids().catch(() => ({ data: { data: [] } })),
            projectApi.getProjects({ status: 'announcing,registration,bidding' }).catch(() => ({ data: { data: [] } }))
          ]);
          setRecentProjects(projectsRes.data?.data?.slice(0, 5) || []);
          setDashboardData({
            myRegistrations: regRes.data?.data?.length || 0,
            myBids: bidsRes.data?.data?.length || 0
          });
        } catch (err) {
          console.error('获取竞买人数据失败:', err);
        }
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        工作台
        <Tag color="blue" style={{ marginLeft: 12 }}>
          端口: 11093 / 21093
        </Tag>
      </Title>

      {hasRole(['supervisor', 'auditor']) && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总项目数"
                  value={dashboardData?.totalProjects || 0}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="进行中项目"
                  value={dashboardData?.activeProjects || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日操作日志"
                  value={dashboardData?.todayLogs || 0}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="高风险操作"
                  value={dashboardData?.highRiskLogs || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {dashboardData?.depositStats && (
            <Card title="保证金托管状态" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={4}>
                  <Statistic title="待锁定" value={dashboardData.depositStats.pending || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="已锁定" value={dashboardData.depositStats.locked || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="已激活" value={dashboardData.depositStats.activated || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="已退回" value={dashboardData.depositStats.refunded || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="已扣除" value={dashboardData.depositStats.deducted || 0} />
                </Col>
                <Col span={4}>
                  <Statistic title="总计" value={dashboardData.depositStats.total || 0} />
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}

      {hasRole(['bidder']) && dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="我的报名数"
                value={dashboardData.myRegistrations || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="我的竞价记录"
                value={dashboardData.myBids || 0}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card title="近期项目" extra={<Text type="secondary">最近5个项目</Text>}>
        {recentProjects.length > 0 ? (
          <List
            dataSource={recentProjects}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Tag color={statusColors[item.status]} key={item.status}>
                    {statusLabels[item.status]}
                  </Tag>
                ]}
              >
                <List.Item.Meta
                  title={item.name}
                  description={
                    <div>
                      <Text type="secondary">项目编号: {item.projectNumber}</Text>
                      <br />
                      <Text type="secondary">预算金额: ¥{Number(item.budget).toLocaleString()}</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无项目数据
          </div>
        )}
      </Card>

      <Card title="系统信息" style={{ marginTop: 24 }}>
        <Row>
          <Col span={8}>
            <Text strong>后端服务:</Text>
            <br />
            <Text type="secondary">http://localhost:11093</Text>
          </Col>
          <Col span={8}>
            <Text strong>前端服务:</Text>
            <br />
            <Text type="secondary">http://localhost:21093</Text>
          </Col>
          <Col span={8}>
            <Text strong>四大引擎:</Text>
            <br />
            <Text type="secondary">Escrow-Control, Auction-Bid, Bid-Security, Integrity-Verify</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
