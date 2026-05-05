import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { bookingApi } from '@/api';
import { Booking } from '@/types';
import { formatDateCN, formatDate } from '@/utils/date';

const statusLabels: Record<string, string> = {
  PENDING: '待支付',
  CONFIRMED: '已确认',
  PAID: '已支付',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
};

const statusColors: Record<string, string> = {
  PENDING: '#fa8c16',
  CONFIRMED: '#1890ff',
  PAID: '#52c41a',
  CANCELLED: '#999',
  COMPLETED: '#666',
};

const Bookings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (id) {
      loadBookingDetail(id);
    } else {
      loadBookings();
    }
  }, [id, isAuthenticated, activeTab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await bookingApi.getList(activeTab === 'all' ? undefined : activeTab);
      setBookings(result.list);
    } catch (error) {
      console.error('Load bookings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingDetail = async (bookingId: string) => {
    setLoading(true);
    try {
      const booking = await bookingApi.getById(bookingId);
      setSelectedBooking(booking);
    } catch (error) {
      console.error('Load booking detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (bookingId: string) => {
    setProcessing(true);
    try {
      await bookingApi.pay(bookingId);
      alert('支付成功！');
      if (id) {
        loadBookingDetail(id);
      } else {
        loadBookings();
      }
    } catch (error: any) {
      alert(error.message || '支付失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('确定要取消预订吗？')) return;
    
    setProcessing(true);
    try {
      await bookingApi.cancel(bookingId);
      alert('订单已取消');
      if (id) {
        loadBookingDetail(id);
      } else {
        loadBookings();
      }
    } catch (error: any) {
      alert(error.message || '取消失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (selectedBooking) {
      setSelectedBooking(null);
      navigate('/bookings');
    } else {
      navigate('/');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div>请先登录</div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 24px 60px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
  };

  const backBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    cursor: 'pointer',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    backgroundColor: active ? '#ff385c' : 'transparent',
    color: active ? '#fff' : '#666',
    fontWeight: active ? 600 : 400,
  });

  const bookingCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const bookingHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  };

  const orderNoStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#999',
  };

  const statusBadgeStyle = (status: string): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
    backgroundColor: statusColors[status] || '#999',
  });

  const propertyInfoStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  };

  const propertyImageStyle: React.CSSProperties = {
    width: 120,
    height: 90,
    borderRadius: 8,
    objectFit: 'cover' as const,
  };

  const dateRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  };

  const amountStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid #f0f0f0',
  };

  const actionBtnStyle = (primary: boolean, disabled: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: primary ? '#ff385c' : '#f5f5f5',
    color: primary ? '#fff' : '#666',
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
  });

  const detailSectionStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  };

  const detailTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0',
  };

  const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
  };

  const priceRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: 14,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 80 }}>加载中...</div>
      </div>
    );
  }

  if (selectedBooking || id) {
    const booking = selectedBooking;
    if (!booking) {
      return (
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', padding: 80 }}>订单不存在</div>
        </div>
      );
    }

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={handleBack}>
            ← 返回列表
          </button>
          <h1 style={titleStyle}>订单详情</h1>
        </div>

        <div style={detailSectionStyle}>
          <div style={bookingHeaderStyle}>
            <div>
              <div style={{ marginBottom: 4 }}>
                <span style={statusBadgeStyle(booking.status)}>
                  {statusLabels[booking.status] || booking.status}
                </span>
              </div>
              <div style={orderNoStyle}>订单号: {booking.orderNo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>创建时间</div>
              <div style={{ fontSize: 14 }}>
                {booking.createdAt ? formatDate(booking.createdAt, 'YYYY-MM-DD HH:mm') : '-'}
              </div>
            </div>
          </div>
        </div>

        <div style={detailSectionStyle}>
          <h3 style={detailTitleStyle}>房源信息</h3>
          {booking.property && (
            <div style={propertyInfoStyle}>
              <img
                src={booking.property.mainImage}
                alt={booking.property.title}
                style={propertyImageStyle}
              />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  {booking.property.title}
                </div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                  {booking.property.address}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={detailSectionStyle}>
          <h3 style={detailTitleStyle}>入住信息</h3>
          <div style={detailRowStyle}>
            <span style={{ color: '#666' }}>入住日期</span>
            <span>{formatDateCN(booking.checkIn)}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: '#666' }}>离店日期</span>
            <span>{formatDateCN(booking.checkOut)}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: '#666' }}>入住天数</span>
            <span>{booking.nights} 晚</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: '#666' }}>入住人数</span>
            <span>{booking.guests} 人</span>
          </div>
          {booking.guestName && (
            <div style={detailRowStyle}>
              <span style={{ color: '#666' }}>入住人</span>
              <span>{booking.guestName}</span>
            </div>
          )}
          {booking.guestPhone && (
            <div style={detailRowStyle}>
              <span style={{ color: '#666' }}>联系电话</span>
              <span>{booking.guestPhone}</span>
            </div>
          )}
        </div>

        <div style={detailSectionStyle}>
          <h3 style={detailTitleStyle}>费用明细</h3>
          <div style={priceRowStyle}>
            <span style={{ color: '#666' }}>房费 (¥{booking.pricePerNight} × {booking.nights}晚)</span>
            <span>¥{booking.pricePerNight * booking.nights}</span>
          </div>
          {booking.cleaningFee > 0 && (
            <div style={priceRowStyle}>
              <span style={{ color: '#666' }}>清洁费</span>
              <span>¥{booking.cleaningFee}</span>
            </div>
          )}
          {booking.serviceFee > 0 && (
            <div style={priceRowStyle}>
              <span style={{ color: '#666' }}>服务费</span>
              <span>¥{booking.serviceFee}</span>
            </div>
          )}
          {booking.deposit > 0 && (
            <div style={priceRowStyle}>
              <span style={{ color: '#666' }}>押金（退房后退还）</span>
              <span>¥{booking.deposit}</span>
            </div>
          )}
          <div
            style={{
              ...priceRowStyle,
              paddingTop: 16,
              marginTop: 8,
              borderTop: '1px solid #eee',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            <span>合计</span>
            <span style={{ color: '#ff385c', fontSize: 20 }}>¥{booking.totalAmount}</span>
          </div>
        </div>

        {booking.status === 'PENDING' && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              marginTop: 24,
            }}
          >
            <button
              style={actionBtnStyle(false, processing)}
              onClick={() => handleCancel(booking.id)}
              disabled={processing}
            >
              取消预订
            </button>
            <button
              style={actionBtnStyle(true, processing)}
              onClick={() => handlePay(booking.id)}
              disabled={processing}
            >
              {processing ? '处理中...' : '立即支付'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={() => navigate('/')}>
          ← 返回首页
        </button>
        <h1 style={titleStyle}>我的订单</h1>
      </div>

      <div style={tabsStyle}>
        <div style={tabStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          全部
        </div>
        <div style={tabStyle(activeTab === 'PENDING')} onClick={() => setActiveTab('PENDING')}>
          待支付
        </div>
        <div style={tabStyle(activeTab === 'PAID')} onClick={() => setActiveTab('PAID')}>
          已支付
        </div>
        <div style={tabStyle(activeTab === 'CANCELLED')} onClick={() => setActiveTab('CANCELLED')}>
          已取消
        </div>
      </div>

      {bookings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 80,
            backgroundColor: '#fff',
            borderRadius: 16,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
            暂无{activeTab !== 'all' ? statusLabels[activeTab] : ''}订单
          </div>
          <div style={{ fontSize: 14, color: '#999' }}>
            去发现页找找心仪的民宿吧
          </div>
          <button
            style={{
              marginTop: 24,
              padding: '12px 32px',
              backgroundColor: '#ff385c',
              color: '#fff',
              borderRadius: 8,
              cursor: 'pointer',
              border: 'none',
              fontSize: 14,
            }}
            onClick={() => navigate('/')}
          >
            去看看
          </button>
        </div>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking.id}
            style={bookingCardStyle}
            onClick={() => navigate(`/bookings/${booking.id}`)}
          >
            <div style={bookingHeaderStyle}>
              <div style={orderNoStyle}>订单号: {booking.orderNo}</div>
              <span style={statusBadgeStyle(booking.status)}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>

            {booking.property && (
              <div style={propertyInfoStyle}>
                <img
                  src={booking.property.mainImage}
                  alt={booking.property.title}
                  style={propertyImageStyle}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    {booking.property.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    {booking.property.address}
                  </div>
                </div>
              </div>
            )}

            <div style={dateRowStyle}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>入住</div>
                <div style={{ fontWeight: 500 }}>{formatDateCN(booking.checkIn)}</div>
              </div>
              <div style={{ color: '#ccc', fontSize: 20 }}>→</div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>离店</div>
                <div style={{ fontWeight: 500 }}>{formatDateCN(booking.checkOut)}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>共</div>
                <div style={{ fontWeight: 500, color: '#ff385c' }}>{booking.nights} 晚</div>
              </div>
            </div>

            <div style={amountStyle}>
              <div>
                <span style={{ color: '#666', fontSize: 14 }}>合计:</span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#ff385c',
                    marginLeft: 8,
                  }}
                >
                  ¥{booking.totalAmount}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {booking.status === 'PENDING' && (
                  <>
                    <button
                      style={actionBtnStyle(false, processing)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(booking.id);
                      }}
                    >
                      取消
                    </button>
                    <button
                      style={actionBtnStyle(true, processing)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePay(booking.id);
                      }}
                    >
                      去支付
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Bookings;
