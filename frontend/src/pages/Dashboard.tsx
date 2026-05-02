import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
  Building2,
  FileText,
  Sparkles,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';

interface Stats {
  properties: number;
  orders: number;
  cleaningTasks: number;
  revenue: number;
}

interface OrderSummary {
  id: string;
  orderNo: string;
  propertyName: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    properties: 0,
    orders: 0,
    cleaningTasks: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [propertiesRes, ordersRes, cleaningRes] = await Promise.all([
          api.get('/properties'),
          api.get('/orders'),
          api.get('/cleaning'),
        ]);

        const properties = propertiesRes.data?.data?.properties || [];
        const orders = ordersRes.data?.data?.orders || [];
        const cleaningTasks = cleaningRes.data?.data?.tasks || [];

        const totalRevenue = orders.reduce((sum: number, order: any) => {
          if (order.status === 'PAID' || order.status === 'CHECKED_OUT') {
            return sum + (order.totalAmount || 0);
          }
          return sum;
        }, 0);

        setStats({
          properties: properties.length,
          orders: orders.length,
          cleaningTasks: cleaningTasks.filter((t: any) => t.status === 'PENDING' || t.status === 'ASSIGNED').length,
          revenue: totalRevenue,
        });

        setRecentOrders(
          orders.slice(0, 5).map((order: any) => ({
            id: order.id,
            orderNo: order.orderNo,
            propertyName: order.property?.name || '未知房源',
            guestName: order.guest?.username || '未知住客',
            checkInDate: order.checkInDate,
            checkOutDate: order.checkOutDate,
            totalAmount: order.totalAmount,
            status: order.status,
          }))
        );
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: '待确认', className: 'badge-warning' },
      CONFIRMED: { label: '已确认', className: 'badge-info' },
      PAID: { label: '已支付', className: 'badge-success' },
      CHECKED_IN: { label: '已入住', className: 'badge-info' },
      CHECKED_OUT: { label: '已完成', className: 'badge-success' },
      CANCELLED: { label: '已取消', className: 'badge-danger' },
      REFUNDED: { label: '已退款', className: 'badge-danger' },
    };
    const config = statusMap[status] || { label: status, className: 'badge-secondary' };
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const statCards = [
    {
      title: '房源总数',
      value: loading ? '--' : stats.properties.toString(),
      icon: Building2,
      color: 'var(--primary-color)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      onClick: () => navigate('/properties'),
    },
    {
      title: '今日订单',
      value: loading ? '--' : stats.orders.toString(),
      icon: FileText,
      color: 'var(--success-color)',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      onClick: () => navigate('/orders'),
    },
    {
      title: '待处理保洁',
      value: loading ? '--' : stats.cleaningTasks.toString(),
      icon: Sparkles,
      color: 'var(--warning-color)',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      onClick: () => navigate('/cleaning'),
    },
    {
      title: '本月营收',
      value: loading ? '--' : `¥${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'var(--success-color)',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      onClick: undefined,
    },
  ];

  const quickActions = [
    {
      label: '新增房源',
      icon: Building2,
      isPrimary: true,
      onClick: () => navigate('/properties/create'),
    },
    {
      label: '查看订单',
      icon: FileText,
      isPrimary: false,
      onClick: () => navigate('/orders'),
    },
    {
      label: '保洁任务',
      icon: Sparkles,
      isPrimary: false,
      onClick: () => navigate('/cleaning'),
    },
    {
      label: '营收统计',
      icon: DollarSign,
      isPrimary: false,
      onClick: undefined,
    },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '0.25rem',
              }}
            >
              {getGreeting()}，{user?.username || user?.name || '用户'}
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              这是您的仪表盘概览
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--gray-500)' }} />
            <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={stat.onClick}
              onMouseEnter={(e) => {
                if (stat.onClick) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '0.75rem',
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
                  {stat.title}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FileText size={20} style={{ color: 'var(--primary-color)' }} />
              最近订单
            </h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                加载中...
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                暂无订单数据
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          fontWeight: '500',
                          color: 'var(--gray-500)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        订单号
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          fontWeight: '500',
                          color: 'var(--gray-500)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        房源
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          fontWeight: '500',
                          color: 'var(--gray-500)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        金额
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '0.75rem',
                          fontWeight: '500',
                          color: 'var(--gray-500)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: '1px solid var(--gray-100)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {order.orderNo}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                          {order.propertyName}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600' }}>
                          ¥{order.totalAmount?.toLocaleString() || 0}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Users size={20} style={{ color: 'var(--success-color)' }} />
              快捷操作
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={action.isPrimary ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1.5rem',
                    height: 'auto',
                    cursor: action.onClick ? 'pointer' : 'default',
                  }}
                  onClick={action.onClick}
                  disabled={!action.onClick}
                >
                  <action.icon size={24} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
