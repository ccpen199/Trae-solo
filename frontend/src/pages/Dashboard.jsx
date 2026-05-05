import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, message, Spin } from 'antd';
import { 
  TeamOutlined, 
  UserOutlined, 
  LoginOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons';
import * as api from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    moved: 0,
    deleted: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.getHouseholdStatistics();
      if (response.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 'bold' }}>系统概览</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="户籍总数"
              value={statistics.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="正常状态"
              value={statistics.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已迁出"
              value={statistics.moved}
              prefix={<ExportOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已注销"
              value={statistics.deleted}
              prefix={<DeleteOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="使用说明">
            <div style={{ lineHeight: 2 }}>
              <p><strong>户籍管理流程：</strong></p>
              <ol>
                <li><strong>登录系统：</strong>使用分配的账号登录系统</li>
                <li><strong>新增户籍：</strong>录入公民姓名、身份证号、年龄等基础资料</li>
                <li><strong>修改户籍：</strong>对已存在户籍信息进行变更</li>
                <li><strong>迁入迁出：</strong>处理人口流动的迁入迁出操作</li>
                <li><strong>注销户籍：</strong>处理户籍失效或删除场景</li>
                <li><strong>查询检索：</strong>按姓名或身份证号检索公民户籍信息</li>
              </ol>
              
              <p style={{ marginTop: 16 }}><strong>权限说明：</strong></p>
              <ul>
                <li><strong>管理员：</strong>可管理所有用户、查看操作日志、进行所有户籍操作</li>
                <li><strong>普通用户：</strong>在授权范围内操作户籍数据，可进行查询、新增、修改、迁入迁出操作</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
