import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, App } from 'antd';
import {
  FileTextOutlined,
  IdcardOutlined,
  UserOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { statsAPI } from '../services/api.js';

export default function Dashboard() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await statsAPI.getOverview();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="证照模板"
              value={stats.template_count || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="证照总数"
              value={stats.certificate_count || 0}
              prefix={<IdcardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="有效证照"
              value={stats.active_certificate_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="申请人"
              value={stats.applicant_count || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="核验次数"
              value={stats.verification_count || 0}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="系统说明" style={{ marginTop: 24 }}>
        <p><strong>电子证照管理系统</strong> 是面向政务服务和行业主管部门的证照全生命周期管理平台。</p>
        <ul style={{ marginTop: 16, paddingLeft: 20 }}>
          <li>证照模板管理：维护证照类型、字段、有效期、签章规则和适用事项</li>
          <li>证照签发流程：关联申请人、审批事项、签发机关和电子签章</li>
          <li>证照状态管理：支持变更、延期、吊销，保留完整历史记录</li>
          <li>证照核验接口：记录调用方、用途、核验结果，异常高频调用审计</li>
        </ul>
      </Card>
    </div>
  );
}
