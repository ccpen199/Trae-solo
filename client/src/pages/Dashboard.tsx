import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import {
  GiftOutlined,
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { useAuthStore } from '@/stores/authStore';
import { getStatusBadgeProps, getOrderStatusBadgeProps } from '@/stores/store';
import { couponApi, orderApi, financeApi } from '@/services/api';
import { CouponTemplate, Order, Budget } from '@/types';
import dayjs from 'dayjs';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { data: templates } = useQuery(
    ['coupon-templates'],
    () => couponApi.listTemplates({ limit: 100 }),
    { enabled: !!user && user.role !== 'customer' }
  );

  const { data: orders } = useQuery(
    ['orders'],
    () => orderApi.listOrders({ limit: 10 }),
    { enabled: !!user }
  );

  const { data: budgets } = useQuery(
    ['budgets'],
    () => financeApi.listBudgets({ limit: 10 }),
    { enabled: !!user && (user.role === 'admin' || user.role === 'finance') }
  );

  const { data: myCoupons } = useQuery(
    ['my-coupons'],
    () => couponApi.getMyCoupons({ limit: 100 }),
    { enabled: !!user && user.role === 'customer' }
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        templates,
        orders,
        budgets,
        myCoupons
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (user?.role === 'customer') {
      const pendingCount = myCoupons?.data?.filter((c: any) => c.status === 'pending_use').length || 0;
      const usedCount = myCoupons?.data?.filter((c: any) => c.status === 'used').length || 0;
      const expiredCount = myCoupons?.data?.filter((c: any) => c.status === 'expired').length || 0;

      return [
        {
          title: '可用优惠券',
          value: pendingCount,
          icon: <GiftOutlined style={{ color: '#52c41a' }} />,
          color: '#52c41a'
        },
        {
          title: '已使用',
          value: usedCount,
          icon: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
          color: '#1890ff'
        },
        {
          title: '已过期',
          value: expiredCount,
          icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
          color: '#faad14'
        },
        {
          title: '我的订单',
          value: orders?.total || 0,
          icon: <ShoppingOutlined style={{ color: '#722ed1' }} />,
          color: '#722ed1'
        }
      ];
    }

    const activeTemplates = templates?.data?.filter((t: any) => 
      t.status === 'pending_distribution' || t.status === 'distributing' || t.status === 'pending_use'
    ).length || 0;

    const paidOrders = orders?.data?.filter((o: any) => o.status === 'paid').length || 0;
    const refundedOrders = orders?.data?.filter((o: any) => o.status === 'refunded').length || 0;

    const totalBudget = budgets?.data?.reduce((sum: number, b: any) => sum + b.totalBudget, 0) || 0;
    const usedBudget = budgets?.data?.reduce((sum: number, b: any) => sum + b.usedBudget, 0) || 0;

    return [
      {
        title: '活跃券模板',
        value: activeTemplates,
        icon: <GiftOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      {
        title: '已支付订单',
        value: paidOrders,
        icon: <ShoppingOutlined style={{ color: '#1890ff' }} />,
        color: '#1890ff'
      },
      {
        title: '已使用预算',
        value: `¥${usedBudget.toLocaleString()} / ¥${totalBudget.toLocaleString()}`,
        icon: <DollarOutlined style={{ color: '#722ed1' }} />,
        color: '#722ed1'
      },
      {
        title: '退款订单',
        value: refundedOrders,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        color: '#faad14'
      }
    ];
  };

  const getRecentOrdersColumns = () => [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '原金额',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      render: (val: number) => `¥${val.toFixed(2)}`
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (val: number) => (
        <span style={{ color: '#ff4d4f' }}>-¥{val.toFixed(2)}</span>
      )
    },
    {
      title: '实付金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (val: number) => <strong>¥{val.toFixed(2)}</strong>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const badge = getOrderStatusBadgeProps(status);
        return <Tag color={badge.color}>{badge.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  const getTemplateColumns = () => [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          fixed_discount: '满减券',
          percentage_discount: '折扣券',
          free_shipping: '免邮券'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      }
    },
    {
      title: '面值',
      dataIndex: 'value',
      key: 'value',
      render: (val: number, record: any) => {
        if (record.type === 'percentage_discount') {
          return `${val}折`;
        }
        return `¥${val}`;
      }
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_: any, record: any) => (
        <span>
          {record.usedQuantity} / {record.totalQuantity}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const badge = getStatusBadgeProps(status);
        return <Tag color={badge.color}>{badge.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近订单" extra={<a href="/orders">查看全部</a>}>
            <Table
              dataSource={orders?.data || []}
              columns={getRecentOrdersColumns()}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {user?.role !== 'customer' && (
          <Col xs={24} lg={12}>
            <Card title="券模板列表" extra={<a href="/coupons/templates">查看全部</a>}>
              <Table
                dataSource={templates?.data || []}
                columns={getTemplateColumns()}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        )}

        {user?.role === 'customer' && myCoupons?.data && myCoupons.data.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title="我的优惠券" extra={<a href="/coupons/my-coupons">查看全部</a>}>
              <Table
                dataSource={myCoupons.data.slice(0, 5)}
                columns={[
                  {
                    title: '券码',
                    dataIndex: 'couponCode',
                    key: 'couponCode',
                    render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
                  },
                  {
                    title: '面值',
                    dataIndex: 'value',
                    key: 'value',
                    render: (val: number) => `¥${val}`
                  },
                  {
                    title: '有效期',
                    key: 'validity',
                    render: (_: any, record: any) => (
                      <span style={{ fontSize: 12 }}>
                        {dayjs(record.validFrom).format('MM-DD')} ~ {dayjs(record.validTo).format('MM-DD')}
                      </span>
                    )
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: string) => {
                      const badge = getStatusBadgeProps(status);
                      return <Tag color={badge.color}>{badge.text}</Tag>;
                    }
                  }
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        )}

        {(user?.role === 'admin' || user?.role === 'finance') && (
          <Col xs={24}>
            <Card title="预算概览" extra={<a href="/finance">查看全部</a>}>
              <Row gutter={16}>
                {budgets?.data?.slice(0, 4).map((budget: any, index: number) => (
                  <Col xs={24} sm={12} lg={6} key={budget.id}>
                    <Card size="small">
                      <div style={{ marginBottom: 8 }}>
                        <strong>{budget.name}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        总预算: ¥{budget.totalBudget.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        已使用: ¥{budget.usedBudget.toLocaleString()}
                        <span style={{ marginLeft: 8 }}>
                          ({((budget.usedBudget / budget.totalBudget) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ marginTop: 8, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min((budget.usedBudget / budget.totalBudget) * 100, 100)}%`,
                            background: budget.usedBudget / budget.totalBudget > 0.9 ? '#ff4d4f' : '#1890ff',
                            borderRadius: 3
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DashboardPage;
