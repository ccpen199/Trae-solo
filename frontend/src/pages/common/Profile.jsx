import { useState, useEffect } from 'react';
import { Card, Descriptions, Progress, Row, Col, Statistic, Tag, Spin } from 'antd';
import {
  UserOutlined, TrophyOutlined, ShoppingCartOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { getUser, getUserRole } from '../../utils/auth';
import { authAPI, courierAPI } from '../../api';

const roleLabelMap = {
  requester: '需求方',
  courier: '跑腿员',
  admin: '管理员',
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const role = getUserRole();

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      const rawData = res.data || res;
      const userData = rawData.user || rawData;
      if (role === 'courier' && rawData.courierProfile) {
        const cp = rawData.courierProfile;
        setProfile({
          ...userData,
          total_orders: cp.completed_orders,
          completed_orders: cp.completed_orders,
          fulfillment_rate: Math.round(cp.fulfillment_rate * 100),
          rating: cp.avg_rating,
          total_earnings: cp.completed_orders * 30,
        });
      } else {
        setProfile(userData);
      }
    } catch {
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const data = profile || user || {};

  const creditScore = data.credit_score ?? 80;
  const creditColor = creditScore >= 80 ? '#52c41a' : creditScore >= 60 ? '#faad14' : '#f5222d';
  const creditLabel = creditScore >= 80 ? '信用优秀' : creditScore >= 60 ? '信用良好' : '信用较差';

  return (
    <div>
      <Row gutter={[24, 16]}>
        <Col xs={24} lg={8}>
          <Card title="基本信息">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <UserOutlined style={{ fontSize: 36, color: '#fff' }} />
              </div>
              <h3 style={{ marginBottom: 4 }}>{data.name || data.phone || '用户'}</h3>
              <Tag color="blue">{roleLabelMap[role] || role}</Tag>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="手机号">{data.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{data.created_at || '-'}</Descriptions.Item>
              {role === 'courier' && (
                <>
                  <Descriptions.Item label="评分">{data.rating?.toFixed(1) || '-'}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={data.online_status === 'online' ? 'green' : 'default'}>
                      {data.online_status === 'online' ? '在线' : data.online_status === 'busy' ? '忙碌' : '离线'}
                    </Tag>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="信用评分" style={{ marginBottom: 16 }}>
            <Row gutter={24} align="middle">
              <Col span={8}>
                <Progress
                  type="circle"
                  percent={creditScore}
                  format={(percent) => `${percent}分`}
                  strokeColor={creditColor}
                  size={120}
                />
              </Col>
              <Col span={16}>
                <h3 style={{ color: creditColor, marginBottom: 8 }}>{creditLabel}</h3>
                <p style={{ color: '#999', marginBottom: 16 }}>
                  信用评分影响接单优先级和服务费率，保持良好信用可获得更多订单推荐。
                </p>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="本月变化" value={data.credit_change || 0} prefix={data.credit_change >= 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />} valueStyle={{ color: data.credit_change >= 0 ? '#52c41a' : '#f5222d' }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="排名" value={data.credit_rank || '-'} suffix={data.credit_rank ? '/ 100' : ''} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="连续好评" value={data.good_streak || 0} suffix="单" />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          <Card title="订单统计">
            <Row gutter={16}>
              {role === 'requester' && (
                <>
                  <Col span={6}>
                    <Statistic title="发布订单" value={data.total_orders || 0} prefix={<ShoppingCartOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="已完成" value={data.completed_orders || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="进行中" value={data.in_progress_orders || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="总消费" value={data.total_spent || 0} prefix="¥" valueStyle={{ color: '#faad14' }} />
                  </Col>
                </>
              )}
              {role === 'courier' && (
                <>
                  <Col span={6}>
                    <Statistic title="完成订单" value={data.total_orders || 0} prefix={<CheckCircleOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="履约率" value={data.fulfillment_rate || 0} suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="平均评分" value={data.rating?.toFixed(1) || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#faad14' }} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="总收入" value={data.total_earnings || 0} prefix="¥" valueStyle={{ color: '#52c41a' }} />
                  </Col>
                </>
              )}
              {role === 'admin' && (
                <>
                  <Col span={6}>
                    <Statistic title="管理订单" value={data.managed_orders || 0} prefix={<ShoppingCartOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="调度次数" value={data.dispatch_count || 0} prefix={<CheckCircleOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="处理投诉" value={data.complaints_handled || 0} prefix={<ClockCircleOutlined />} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="系统天数" value={data.system_days || 0} suffix="天" />
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
