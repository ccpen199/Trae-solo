import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileText, Plus, Eye, Check, X } from 'lucide-react';
import { OrderStatus, type Order } from '../types';

const OrderList: React.FC = () => {
  const orders: Order[] = [
    {
      id: '1',
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
        amenities: {},
        rules: {},
        images: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:30:00Z',
    },
    {
      id: '2',
      orderNo: 'ORD20240101002',
      propertyId: '2',
      guestId: 'guest-2',
      checkIn: '2024-01-18',
      checkOut: '2024-01-20',
      guestCount: 2,
      totalPrice: 2400,
      status: OrderStatus.PENDING,
      specialRequests: '',
      property: {
        id: '2',
        landlordId: 'landlord-1',
        name: '市中心豪华套房',
        address: '深圳市福田区深南大道100号',
        city: '深圳',
        province: '广东省',
        country: '中国',
        zipCode: '518000',
        roomCount: 1,
        bedCount: 1,
        bathroomCount: 1,
        maxGuests: 2,
        basePrice: 1200,
        checkInTime: '15:00',
        checkOutTime: '12:00',
        status: 'ACTIVE' as any,
        amenities: {},
        rules: {},
        images: [],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      createdAt: '2024-01-02T14:00:00Z',
      updatedAt: '2024-01-02T14:00:00Z',
    },
    {
      id: '3',
      orderNo: 'ORD20240101003',
      propertyId: '3',
      guestId: 'guest-3',
      checkIn: '2024-01-10',
      checkOut: '2024-01-12',
      guestCount: 4,
      totalPrice: 3600,
      status: OrderStatus.CHECKED_OUT,
      property: {
        id: '3',
        landlordId: 'landlord-1',
        name: '花园别墅',
        address: '深圳市龙岗区龙城大道200号',
        city: '深圳',
        province: '广东省',
        country: '中国',
        zipCode: '518000',
        roomCount: 4,
        bedCount: 5,
        bathroomCount: 3,
        maxGuests: 10,
        basePrice: 1800,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        status: 'INACTIVE' as any,
        amenities: {},
        rules: {},
        images: [],
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-12T12:00:00Z',
    },
  ];

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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FileText size={28} style={{ color: 'var(--primary-color)' }} />
              订单管理
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              管理所有预订订单
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select className="form-select" style={{ maxWidth: '200px' }}>
              <option value="">全部状态</option>
              <option value="PENDING">待确认</option>
              <option value="CONFIRMED">已确认</option>
              <option value="CHECKED_IN">已入住</option>
              <option value="CHECKED_OUT">已退房</option>
              <option value="CANCELLED">已取消</option>
            </select>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '300px' }}
              placeholder="搜索订单号、房源名称..."
            />
          </div>
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    订单号
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    房源
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    入住日期
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    金额
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    状态
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                      textTransform: 'uppercase',
                    }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--gray-100)',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      {order.orderNo}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {order.property?.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {order.property?.address}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '0.875rem' }}>{order.checkIn}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        至 {order.checkOut}
                      </p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                        ¥{order.totalPrice.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Link
                          to={`/orders/${order.id}`}
                          className="btn btn-outline"
                          style={{ padding: '0.375rem 0.5rem' }}
                        >
                          <Eye size={16} />
                        </Link>
                        {order.status === OrderStatus.PENDING && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.375rem 0.5rem' }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.375rem 0.5rem', color: 'var(--danger-color)' }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderList;
