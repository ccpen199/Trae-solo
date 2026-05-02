import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileText, ArrowLeft, Check, X, Edit2 } from 'lucide-react';
import { OrderStatus, type Order } from '../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const order: Order = {
    id: id || '1',
    orderNo: 'ORD20240101001',
    propertyId: '1',
    guestId: 'guest-1',
    checkIn: '2024-01-15',
    checkOut: '2024-01-17',
    guestCount: 2,
    totalPrice: 1200,
    status: OrderStatus.CONFIRMED,
    specialRequests: '需要额外的毛巾',
    checkInCode: '123456',
    doorPassword: '888888',
    property: {
      id: '1',
      landlordId: 'landlord-1',
      name: '海景公寓A栋',
      description: '美丽的海景公寓，设施齐全，交通便利',
      address: '深圳市南山区海岸线1号',
      city: '深圳',
      province: '广东省',
      country: '中国',
      zipCode: '518000',
      roomCount: 2,
      bedCount: 3,
      bathroomCount: 2,
      maxGuests: 6,
      basePrice: 600,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      status: 'ACTIVE' as any,
      amenities: { wifi: true, airConditioner: true, tv: true },
      rules: { smoking: false, pets: true },
      images: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    guest: {
      id: 'guest-1',
      email: 'guest@example.com',
      phone: '13800138000',
      role: 'GUEST' as any,
      name: '张三',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:30:00Z',
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; className: string }> = {
      [OrderStatus.PENDING]: { label: '待确认', className: 'badge-warning' },
      [OrderStatus.CONFIRMED]: { label: '已确认', className: 'badge-success' },
      [OrderStatus.CHECKED_IN]: { label: '已入住', className: 'badge-info' },
      [OrderStatus.CHECKED_OUT]: { label: '已退房', className: 'badge-secondary' },
      [OrderStatus.CANCELLED]: { label: '已取消', className: 'badge-danger' },
      [OrderStatus.REFUNDED]: { label: '已退款', className: 'badge-danger' },
    };
    const config = statusMap[status];
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-outline"
            style={{ marginBottom: '1rem' }}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
            返回列表
          </button>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FileText size={28} style={{ color: 'var(--primary-color)' }} />
                订单详情
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                订单号：{order.orderNo}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {order.status === OrderStatus.PENDING && (
                <>
                  <button className="btn btn-primary">
                    <Check size={18} style={{ marginRight: '0.5rem' }} />
                    确认订单
                  </button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger-color)' }}>
                    <X size={18} style={{ marginRight: '0.5rem' }} />
                    取消订单
                  </button>
                </>
              )}
              {order.status === OrderStatus.CONFIRMED && (
                <>
                  <button className="btn btn-success">
                    <Check size={18} style={{ marginRight: '0.5rem' }} />
                    办理入住
                  </button>
                  <button className="btn btn-outline" style={{ color: 'var(--danger-color)' }}>
                    <X size={18} style={{ marginRight: '0.5rem' }} />
                    取消订单
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              订单状态
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {getStatusBadge(order.status)}
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                最后更新：{new Date(order.updatedAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>

          <div className="card">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              订单金额
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--primary-color)',
                }}
              >
                ¥{order.totalPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                (共{order.guestCount}位客人，{order.totalPrice / 600}晚)
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: 'var(--gray-800)',
            }}
          >
            房源信息
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--gray-100)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={32} style={{ color: 'var(--gray-400)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {order.property?.name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                {order.property?.address}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span className="badge badge-secondary">
                  {order.property?.roomCount}室
                </span>
                <span className="badge badge-secondary">
                  {order.property?.bedCount}床
                </span>
                <span className="badge badge-secondary">
                  {order.property?.bathroomCount}卫
                </span>
                <span className="badge badge-secondary">
                  最多{order.property?.maxGuests}人
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="card">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              住客信息
            </h2>
            {order.guest && (
              <div>
                <p style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>姓名：</span>
                  <span style={{ fontWeight: '500' }}>{order.guest.name}</span>
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>邮箱：</span>
                  <span>{order.guest.email}</span>
                </p>
                <p>
                  <span style={{ color: 'var(--gray-500)' }}>电话：</span>
                  <span>{order.guest.phone}</span>
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              入住信息
            </h2>
            <div>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>入住日期：</span>
                <span style={{ fontWeight: '500' }}>{order.checkIn}</span>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>退房日期：</span>
                <span style={{ fontWeight: '500' }}>{order.checkOut}</span>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>入住人数：</span>
                <span style={{ fontWeight: '500' }}>{order.guestCount}人</span>
              </p>
              {order.checkInCode && (
                <p style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>入住码：</span>
                  <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                    {order.checkInCode}
                  </span>
                </p>
              )}
              {order.doorPassword && (
                <p>
                  <span style={{ color: 'var(--gray-500)' }}>门锁密码：</span>
                  <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
                    {order.doorPassword}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {order.specialRequests && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: 'var(--gray-800)',
              }}
            >
              特殊需求
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              {order.specialRequests}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;
