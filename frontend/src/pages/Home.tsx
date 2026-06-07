import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Spin, message } from 'antd';
import {
  BuildOutlined,
  FileTextOutlined,
  TeamOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  SafetyCertificateOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { getDashboard } from '@/api';

interface DashboardData {
  total_buildings?: number;
  total_listings?: number;
  total_agents?: number;
  deals_this_month?: number;
  avg_city_price?: number;
  total_commission?: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({});

  useEffect(() => {
    getDashboard()
      .then((res: any) => setData(res))
      .catch(() => message.error('获取仪表盘数据失败'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: '楼盘总数', value: data.total_buildings ?? 0, icon: <BuildOutlined />, color: '#1677ff' },
    { title: '房源总数', value: data.total_listings ?? 0, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: '经纪人数量', value: data.total_agents ?? 0, icon: <TeamOutlined />, color: '#722ed1' },
    { title: '本月成交', value: data.deals_this_month ?? 0, icon: <SwapOutlined />, color: '#fa8c16' },
  ];

  const quickActions = [
    { title: '地图找房', desc: '基于地图的智能房源搜索', icon: <EnvironmentOutlined style={{ fontSize: 32, color: '#1677ff' }} />, path: '/map' },
    { title: 'VR看房', desc: '沉浸式虚拟看房体验', icon: <VideoCameraOutlined style={{ fontSize: 32, color: '#722ed1' }} />, path: '/vr/0' },
    { title: '政策合规', desc: '购房资格与限售校验', icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52c41a' }} />, path: '/policy' },
    { title: '税费计算', desc: '精准房产税费测算', icon: <CalculatorOutlined style={{ fontSize: 32, color: '#fa8c16' }} />, path: '/tax' },
  ];

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <h2>房产交易数字化服务中台</h2>
        <p>数据驱动的房产交易综合服务平台</p>
      </div>

      <Row gutter={[16, 16]}>
        {statCards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <Card hoverable>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={React.cloneElement(item.icon, { style: { color: item.color } })}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {quickActions.map((action) => (
          <Col xs={24} sm={12} lg={6} key={action.title}>
            <Card
              hoverable
              onClick={() => navigate(action.path)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Meta
                avatar={action.icon}
                title={action.title}
                description={action.desc}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Spin>
  );
};

export default Home;
