import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Button, Empty, Spin, message, Alert } from 'antd';
import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { statsApi, orderApi, violationApi, licenseApi } from '../services/api';
import { OrderStatusMap, ViolationStatusMap, LicenseStatusMap } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [pendingViolations, setPendingViolations] = useState<any[]>([]);
  const [pendingLicenses, setPendingLicenses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        statsApi.overview(),
        orderApi.list({ pageSize: 5 }),
        violationApi.list({ status: 'pending', pageSize: 5 }),
        licenseApi.list({ status: 'pending', pageSize: 5 })
      ]);

      const [overviewRes, ordersRes, violationsRes, licensesRes] = results;

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value.data || {});
      } else {
        console.error('统计数据加载失败', overviewRes.reason);
      }

      if (ordersRes.status === 'fulfilled') {
        setRecentOrders(ordersRes.value.data || []);
      } else {
        console.error('订单数据加载失败', ordersRes.reason);
      }

      if (violationsRes.status === 'fulfilled') {
        setPendingViolations(violationsRes.value.data || []);
      } else {
        console.error('违章数据加载失败', violationsRes.reason);
      }

      if (licensesRes.status === 'fulfilled') {
        setPendingLicenses(licensesRes.value.data || []);
      } else {
        console.error('驾照数据加载失败', licensesRes.reason);
      }

      if (overviewRes.status === 'rejected' && ordersRes.status === 'rejected') {
        setError('数据加载失败，请检查网络连接或刷新页面重试');
      }
    } catch (err: any) {
      console.error('加载数据失败', err);
      setError(err?.message || '数据加载失败');
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="正在加载数据..." />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert
          message="数据加载异常"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={loadData}>
              重新加载
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <div className="stat-label">车辆总数</div>
            <div className="stat-value">{overview.vehicles?.total ?? 0}</div>
            <div className="stat-desc">
              <span style={{ marginRight: 12 }}>可用 {overview.vehicles?.available ?? 0}</span>
              <span>出租中 {overview.vehicles?.rented ?? 0}</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card green">
            <div className="stat-label">进行中订单</div>
            <div className="stat-value">{overview.orders?.active ?? 0}</div>
            <div className="stat-desc">
              <span style={{ marginRight: 12 }}>今日新增 0</span>
              <span>累计 {overview.orders?.total ?? 0}</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card orange">
            <div className="stat-label">累计营收</div>
            <div className="stat-value">¥{(overview.finance?.totalRevenue ?? 0).toLocaleString()}</div>
            <div className="stat-desc">
              <span style={{ marginRight: 12 }}>已完成订单 {overview.orders?.completed ?? 0}</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card blue">
            <div className="stat-label">待处理事项</div>
            <div className="stat-value">{(overview.pending?.licenses ?? 0) + (overview.pending?.violations ?? 0) + (overview.pending?.settlements ?? 0)}</div>
            <div className="stat-desc">
              <span style={{ marginRight: 12 }}>驾照审核 {overview.pending?.licenses ?? 0}</span>
              <span>违章待处理 {overview.pending?.violations ?? 0}</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="最近订单" 
            extra={<Button type="link" onClick={() => navigate('/orders')}>查看全部</Button>}
          >
            {recentOrders.length > 0 ? (
              <List
                dataSource={recentOrders}
                renderItem={(order: any) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate(`/orders/${order.id}`)}>
                        详情 <ArrowRightOutlined />
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          订单号：{order.order_no}
                          <Tag color={OrderStatusMap[order.status]?.color} style={{ marginLeft: 12 }}>
                            {OrderStatusMap[order.status]?.text}
                          </Tag>
                        </span>
                      }
                      description={
                        <span>
                          {order.plate_number} | {order.user_name} | {order.pickup_time?.slice(0, 10)} 至 {order.return_time?.slice(0, 10)}
                          <span style={{ marginLeft: 12, color: '#1677ff', fontWeight: 500 }}>¥{order.total_amount}</span>
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无订单" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="待处理违章" style={{ marginBottom: 16 }}>
            {pendingViolations.length > 0 ? (
              <List
                size="small"
                dataSource={pendingViolations}
                renderItem={(item: any) => (
                  <List.Item>
                    <span>{item.violation_type}</span>
                    <Tag color={ViolationStatusMap[item.status]?.color}>
                      {ViolationStatusMap[item.status]?.text}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无待处理违章" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card title="待审核驾照">
            {pendingLicenses.length > 0 ? (
              <List
                size="small"
                dataSource={pendingLicenses}
                renderItem={(item: any) => (
                  <List.Item>
                    <span>{item.user_name}</span>
                    <Tag color={LicenseStatusMap[item.status]?.color}>
                      {LicenseStatusMap[item.status]?.text}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无待审核驾照" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
