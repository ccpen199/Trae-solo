import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useSearchStore } from '@/store';
import { propertyApi, bookingApi } from '@/api';
import { Property, PriceDetails } from '@/types';
import { formatDateCN } from '@/utils/date';

const BookingConfirm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { guests } = useSearchStore();

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');

  const [property, setProperty] = useState<Property | null>(null);
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    specialRequest: '',
  });

  useEffect(() => {
    if (id && checkIn && checkOut) {
      loadData();
    }
  }, [id, checkIn, checkOut]);

  const loadData = async () => {
    if (!id || !checkIn || !checkOut) return;
    setLoading(true);
    try {
      const [propertyData, priceResult] = await Promise.all([
        propertyApi.getById(id),
        bookingApi.calculate(id, checkIn, checkOut, parseInt(guestsParam || String(guests), 10)),
      ]);
      setProperty(propertyData);
      setPriceDetails(priceResult.priceDetails);
      
      setFormData({
        guestName: user?.nickname || '',
        guestPhone: user?.phone || '',
        specialRequest: '',
      });
    } catch (error) {
      console.error('Load booking confirm error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id || !checkIn || !checkOut) return;

    if (!formData.guestName || !formData.guestPhone) {
      alert('请填写入住人姓名和手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(formData.guestPhone)) {
      alert('请输入正确的手机号');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingApi.create({
        propertyId: id,
        checkIn,
        checkOut,
        guests: parseInt(guestsParam || String(guests), 10),
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        specialRequest: formData.specialRequest || undefined,
      });

      alert('订单创建成功！请前往支付');
      navigate(`/bookings/${booking.id}`);
    } catch (error: any) {
      console.error('Create booking error:', error);
      alert(error.message || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!property || !priceDetails) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div>加载失败，请返回重试</div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 24px 60px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #f0f0f0',
  };

  const propertyInfoStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
  };

  const propertyImageStyle: React.CSSProperties = {
    width: 120,
    height: 90,
    borderRadius: 8,
    objectFit: 'cover' as const,
  };

  const dateBoxStyle: React.CSSProperties = {
    display: 'flex',
    gap: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    color: '#333',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical' as const,
    minHeight: 80,
    fontFamily: 'inherit',
  };

  const priceRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    fontSize: 14,
  };

  const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#ff385c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: submitting ? 'not-allowed' : 'pointer',
    opacity: submitting ? 0.7 : 1,
    marginTop: 16,
  };

  const nights = parseInt(guestsParam || '1', 10);

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>确认订单</h1>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>房源信息</h3>
        <div style={propertyInfoStyle}>
          <img
            src={property.mainImage}
            alt={property.title}
            style={propertyImageStyle}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>{property.title}</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
              {property.city?.name} · {property.address}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {property.bedrooms}室{property.beds}床{property.baths}卫 · 最多{property.maxGuests}人
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>入住日期</h3>
        <div style={dateBoxStyle}>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>入住</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {checkIn ? formatDateCN(new Date(checkIn)) : '-'}
            </div>
          </div>
          <div style={{ fontSize: 20, color: '#ddd', alignSelf: 'center' }}>→</div>
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>离店</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {checkOut ? formatDateCN(new Date(checkOut)) : '-'}
            </div>
          </div>
          <div style={{ alignSelf: 'center', marginLeft: 'auto' }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>共</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ff385c' }}>
              {priceDetails ? priceDetails.roomCost / property.pricePerNight : 0} 晚
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>入住人信息</h3>

        <div style={formGroupStyle}>
          <label style={labelStyle}>入住人姓名 *</label>
          <input
            style={inputStyle}
            placeholder="请输入入住人姓名"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>联系电话 *</label>
          <input
            style={inputStyle}
            placeholder="请输入联系电话"
            value={formData.guestPhone}
            onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
            maxLength={11}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>特殊要求（选填）</label>
          <textarea
            style={textareaStyle}
            placeholder="如有特殊要求可在此说明"
            value={formData.specialRequest}
            onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>费用明细</h3>

        <div style={priceRowStyle}>
          <span>
            房费 (¥{property.pricePerNight} × {priceDetails ? priceDetails.roomCost / property.pricePerNight : 0}晚)
          </span>
          <span>¥{priceDetails.roomCost}</span>
        </div>

        {property.cleaningFee > 0 && (
          <div style={priceRowStyle}>
            <span>清洁费</span>
            <span>¥{property.cleaningFee}</span>
          </div>
        )}

        {property.serviceFee > 0 && (
          <div style={priceRowStyle}>
            <span>服务费</span>
            <span>¥{property.serviceFee}</span>
          </div>
        )}

        {property.deposit > 0 && (
          <div style={priceRowStyle}>
            <span>押金（退房后退还）</span>
            <span>¥{property.deposit}</span>
          </div>
        )}

        <div
          style={{
            ...priceRowStyle,
            paddingTop: 16,
            borderTop: '1px solid #eee',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          <span>合计</span>
          <span style={{ color: '#ff385c', fontSize: 20 }}>¥{priceDetails.totalAmount}</span>
        </div>
      </div>

      <button style={submitBtnStyle} onClick={handleSubmit} disabled={submitting}>
        {submitting ? '提交中...' : '确认预订'}
      </button>
    </div>
  );
};

export default BookingConfirm;
