import React from 'react';
import Layout from '../components/Layout';
import { Sparkles, RefreshCw, Check, Eye, UserCheck } from 'lucide-react';
import { CleaningTaskStatus, type CleaningTask } from '../types';

const CleaningTaskList: React.FC = () => {
  const tasks: CleaningTask[] = [
    {
      id: '1',
      orderId: 'order-1',
      propertyId: '1',
      cleanerId: 'cleaner-1',
      scheduledDate: '2024-01-17',
      status: CleaningTaskStatus.IN_PROGRESS,
      priority: 2,
      notes: '',
      order: {
        id: 'order-1',
        orderNo: 'ORD20240101001',
        propertyId: '1',
        guestId: 'guest-1',
        checkIn: '2024-01-15',
        checkOut: '2024-01-17',
        guestCount: 2,
        totalPrice: 1200,
        status: 'CHECKED_OUT' as any,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
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
      cleaner: {
        id: 'cleaner-1',
        email: 'cleaner1@example.com',
        phone: '13800138001',
        role: 'CLEANER' as any,
        name: '李阿姨',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      orderId: 'order-2',
      propertyId: '2',
      cleanerId: 'cleaner-2',
      scheduledDate: '2024-01-20',
      status: CleaningTaskStatus.ASSIGNED,
      priority: 1,
      notes: '',
      order: {
        id: 'order-2',
        orderNo: 'ORD20240101002',
        propertyId: '2',
        guestId: 'guest-2',
        checkIn: '2024-01-18',
        checkOut: '2024-01-20',
        guestCount: 2,
        totalPrice: 2400,
        status: 'CONFIRMED' as any,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
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
      cleaner: {
        id: 'cleaner-2',
        email: 'cleaner2@example.com',
        phone: '13800138002',
        role: 'CLEANER' as any,
        name: '王阿姨',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      orderId: 'order-3',
      propertyId: '3',
      scheduledDate: '2024-01-12',
      status: CleaningTaskStatus.PENDING,
      priority: 3,
      notes: '',
      order: {
        id: 'order-3',
        orderNo: 'ORD20240101003',
        propertyId: '3',
        guestId: 'guest-3',
        checkIn: '2024-01-10',
        checkOut: '2024-01-12',
        guestCount: 4,
        totalPrice: 3600,
        status: 'CHECKED_OUT' as any,
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
      },
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
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    },
  ];

  const getStatusBadge = (status: CleaningTaskStatus) => {
    const statusMap: Record<CleaningTaskStatus, { label: string; className: string }> = {
      [CleaningTaskStatus.PENDING]: { label: '待分配', className: 'badge-secondary' },
      [CleaningTaskStatus.ASSIGNED]: { label: '已分配', className: 'badge-info' },
      [CleaningTaskStatus.IN_PROGRESS]: { label: '进行中', className: 'badge-warning' },
      [CleaningTaskStatus.COMPLETED]: { label: '已完成', className: 'badge-success' },
      [CleaningTaskStatus.VERIFIED]: { label: '已核验', className: 'badge-info' },
      [CleaningTaskStatus.CANCELLED]: { label: '已取消', className: 'badge-danger' },
    };
    const config = statusMap[status];
    return <span className={`badge ${config.className}`}>{config.label}</span>;
  };

  const getPriorityLabel = (priority: number) => {
    const priorityMap: Record<number, { label: string; className: string }> = {
      1: { label: '高优先级', className: 'badge-danger' },
      2: { label: '中优先级', className: 'badge-warning' },
      3: { label: '低优先级', className: 'badge-secondary' },
    };
    const config = priorityMap[priority] || { label: '正常', className: 'badge-secondary' };
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
              <Sparkles size={28} style={{ color: 'var(--primary-color)' }} />
              保洁管理
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              管理保洁任务和人员分配
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 grid-cols-4" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={20} style={{ color: 'var(--warning-color)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>进行中</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>1</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={20} style={{ color: 'var(--primary-color)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>已分配</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>1</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} style={{ color: 'var(--gray-500)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>待分配</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>1</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={20} style={{ color: 'var(--success-color)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>本月完成</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>12</p>
            </div>
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
                    保洁人员
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
                    预约日期
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
                    优先级
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
                {tasks.map((task) => (
                  <tr
                    key={task.id}
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
                      {task.order?.orderNo}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {task.property?.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {task.property?.address}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {task.cleaner ? (
                        <div>
                          <p style={{ fontWeight: '500' }}>{task.cleaner.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {task.cleaner.phone}
                          </p>
                        </div>
                      ) : (
                        <span className="badge badge-secondary">未分配</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {task.scheduledDate}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getPriorityLabel(task.priority)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(task.status)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.375rem 0.5rem' }}
                        >
                          <Eye size={16} />
                        </button>
                        {task.status === CleaningTaskStatus.PENDING && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            自动派单
                          </button>
                        )}
                        {task.status === CleaningTaskStatus.IN_PROGRESS && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.375rem 0.5rem' }}
                          >
                            <Check size={16} />
                          </button>
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

export default CleaningTaskList;
