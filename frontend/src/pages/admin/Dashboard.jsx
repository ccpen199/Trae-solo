import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  MessageOutlined,
  SafetyOutlined,
  FileTextOutlined,
  DollarOutlined,
  AuditOutlined,
  SearchOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAPI, dashboardAPI } from '../../utils/api';

const { Title } = Typography;

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardAPI.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  const quickEntries = [
    { title: '律师审核', icon: <AuditOutlined />, path: '/admin/lawyer-verify', color: '#1890ff' },
    { title: '会话质检', icon: <SafetyOutlined />, path: '/admin/audits', color: '#52c41a' },
    { title: 'NPS归因', icon: <BarChartOutlined />, path: '/admin/nps', color: '#722ed1' },
    { title: '合规巡检', icon: <SearchOutlined />, path: '/admin/compliance', color: '#fa8c16' },
    { title: '文书沙箱', icon: <CloudServerOutlined />, path: '/admin/document-sandbox', color: '#13c2c2' },
    { title: '分账管理', icon: <FundOutlined />, path: '/admin/revenue', color: '#eb2f96' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>管理后台</Title>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="认证律师" value={stats.total_lawyers || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="注册用户" value={stats.total_users || 0} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="咨询总量" value={stats.total_consultations || 0} prefix={<MessageOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待审会话" value={stats.pending_audits || 0} prefix={<SafetyOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="文书分析数" value={stats.document_analyses || 0} prefix={<FileTextOutlined />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="分账总额" value={stats.total_revenue || 0} prefix={<DollarOutlined />} valueStyle={{ color: '#fa8c16' }} precision={2} suffix="元" />
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 32 }}>快速入口</Title>
      <Row gutter={[16, 16]}>
        {quickEntries.map((entry) => (
          <Col span={6} key={entry.path}>
            <Card hoverable onClick={() => navigate(entry.path)} style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: entry.color, marginBottom: 8 }}>{entry.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.title}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default AdminDashboard;
