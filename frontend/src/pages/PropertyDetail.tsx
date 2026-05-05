import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useSearchStore, useModalStore } from '@/store';
import { propertyApi, bookingApi } from '@/api';
import { Property, PriceDetails } from '@/types';
import { formatDateCN, formatDate } from '@/utils/date';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { dateSelection, guests } = useSearchStore();
  const { setShowDatePicker, setShowLoginModal } = useModalStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  useEffect(() => {
    if (property && dateSelection.checkIn && dateSelection.checkOut) {
      calculatePrice();
    }
  }, [dateSelection]);

  const loadProperty = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await propertyApi.getById(id);
      setProperty(data);
    } catch (error) {
      console.error('Load property error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    if (!property || !dateSelection.checkIn || !dateSelection.checkOut) return;

    setCalculating(true);
    try {
      const result = await bookingApi.calculate(
        property.id,
        formatDate(dateSelection.checkIn),
        formatDate(dateSelection.checkOut),
        guests
      );
      setPriceDetails(result.priceDetails);
    } catch (error) {
      console.error('Calculate price error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      const redirectPath = encodeURIComponent(window.location.pathname);
      setShowLoginModal(true, redirectPath);
      return;
    }

    if (!dateSelection.checkIn || !dateSelection.checkOut) {
      setShowDatePicker(true);
      return;
    }

    if (!priceDetails) {
      calculatePrice();
      return;
    }

    navigate(`/booking/${id}?checkIn=${formatDate(dateSelection.checkIn)}&checkOut=${formatDate(dateSelection.checkOut)}&guests=${guests}`);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      const redirectPath = encodeURIComponent(window.location.pathname);
      setShowLoginModal(true, redirectPath);
      return;
    }

    if (!id) return;
    try {
      const result = await propertyApi.toggleFavorite(id);
      setProperty((prev) => (prev ? { ...prev, isFavorite: result.isFavorite } : null));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <div>房源不存在</div>
      </div>
    );
  }

  const images = [property.mainImage, ...property.images];

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 24px 60px',
  };

  const galleryStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: 8,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    height: 480,
  };

  const mainImageStyle: React.CSSProperties = {
    gridRow: 'span 2',
    cursor: 'pointer',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

  const contentStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 48,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid #eee',
  };

  const hostSectionStyle: React.CSSProperties = {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #eee',
  };

  const hostHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  };

  const hostAvatarStyle: React.CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#ff385c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 600,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
  };

  const facilitiesStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #eee',
  };

  const facilityItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  };

  const bookingCardStyle: React.CSSProperties = {
    position: 'sticky',
    top: 88,
    border: '1px solid #eee',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  };

  const priceRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  };

  const dateSelectorStyle: React.CSSProperties = {
    display: 'flex',
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    cursor: 'pointer',
  };

  const dateColStyle: React.CSSProperties = {
    flex: 1,
    padding: 12,
    borderRight: '1px solid #ddd',
  };

  const bookBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ff385c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 16,
  };

  const favoriteBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const successToastStyle: React.CSSProperties = {
    position: 'fixed',
    top: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    backgroundColor: '#52c41a',
    color: '#fff',
    borderRadius: 8,
    zIndex: 1000,
    animation: 'fadeInOut 2s ease',
  };

  return (
    <div style={containerStyle}>
      {showSuccess && (
        <div style={successToastStyle}>
          {property.isFavorite ? '已加入收藏' : '已取消收藏'}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div style={galleryStyle}>
          <div style={mainImageStyle}>
            <img src={images[0]} alt={property.title} style={imageStyle} />
          </div>
          {images.slice(1, 5).map((img, index) => (
            <div key={index}>
              <img src={img} alt={`${property.title} ${index + 2}`} style={imageStyle} />
            </div>
          ))}
        </div>

        <button style={favoriteBtnStyle} onClick={handleFavorite}>
          <span style={{ fontSize: 20, color: property.isFavorite ? '#ff385c' : '#333' }}>
            {property.isFavorite ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      <div style={contentStyle}>
        <div>
          <h1 style={titleStyle}>{property.title}</h1>
          <p style={subtitleStyle}>{property.subtitle}</p>

          <div style={infoRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#ff385c' }}>★</span>
              <span style={{ fontWeight: 600 }}>{property.rating}</span>
              <span style={{ color: '#999' }}>·</span>
              <span style={{ color: '#666' }}>{property.reviewCount}条评价</span>
            </div>
            <span style={{ color: '#999' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#666' }}>
              <span>📍 {property.city?.name}</span>
              <span>🏠 {property.bedrooms}室</span>
              <span>🛏️ {property.beds}床</span>
              <span>🛁 {property.baths}卫</span>
            </div>
          </div>

          {property.host && (
            <div style={hostSectionStyle}>
              <div style={hostHeaderStyle}>
                <div style={hostAvatarStyle}>
                  {property.host.user?.nickname?.charAt(0) || '房'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    房东: {property.host.user?.nickname}
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                    回复率 {property.host.responseRate}% · 平均响应时间 {property.host.responseTime}
                    分钟
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
                {property.host.intro}
              </p>
            </div>
          )}

          {property.intro && (
            <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #eee' }}>
              <h3 style={sectionTitleStyle}>房源介绍</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 2 }}>{property.intro}</p>
            </div>
          )}

          <div>
            <h3 style={sectionTitleStyle}>房源设施</h3>
            <div style={facilitiesStyle}>
              {property.facilities.map((facility, index) => (
                <div key={index} style={facilityItemStyle}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>

          {property.houseRules && property.houseRules.length > 0 && (
            <div>
              <h3 style={sectionTitleStyle}>入住须知</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {property.houseRules.map((rule, index) => (
                  <div key={index} style={{ fontSize: 14, color: '#666' }}>
                    • {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={bookingCardStyle}>
            <div style={priceRowStyle}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#ff385c' }}>
                  ¥{property.pricePerNight}
                </span>
                <span style={{ color: '#666', fontSize: 14 }}>/晚</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#ff385c' }}>★</span>
                <span style={{ fontWeight: 600 }}>{property.rating}</span>
                <span style={{ color: '#999', fontSize: 12 }}>({property.reviewCount})</span>
              </div>
            </div>

            <div style={dateSelectorStyle} onClick={() => setShowDatePicker(true)}>
              <div style={dateColStyle}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>入住</div>
                <div style={{ fontSize: 14, color: dateSelection.checkIn ? '#333' : '#999' }}>
                  {dateSelection.checkIn ? formatDateCN(dateSelection.checkIn) : '选择日期'}
                </div>
              </div>
              <div style={{ ...dateColStyle, borderRight: 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>离店</div>
                <div style={{ fontSize: 14, color: dateSelection.checkOut ? '#333' : '#999' }}>
                  {dateSelection.checkOut ? formatDateCN(dateSelection.checkOut) : '选择日期'}
                </div>
              </div>
            </div>

            {dateSelection.checkIn && dateSelection.checkOut && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                >
                  <span>
                    ¥{property.pricePerNight} × {dateSelection.nights} 晚
                  </span>
                  <span>
                    ¥
                    {priceDetails ? priceDetails.roomCost : property.pricePerNight * dateSelection.nights}
                  </span>
                </div>
                {property.cleaningFee > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    <span>清洁费</span>
                    <span>¥{property.cleaningFee}</span>
                  </div>
                )}
                {property.serviceFee > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    <span>服务费</span>
                    <span>¥{property.serviceFee}</span>
                  </div>
                )}
                {property.deposit > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    <span>押金</span>
                    <span>¥{property.deposit}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid #ddd',
                    fontWeight: 600,
                  }}
                >
                  <span>合计</span>
                  <span style={{ color: '#ff385c', fontSize: 16 }}>
                    ¥{priceDetails ? priceDetails.totalAmount : property.pricePerNight * dateSelection.nights + property.cleaningFee + property.serviceFee + property.deposit}
                  </span>
                </div>
              </div>
            )}

            <button style={bookBtnStyle} onClick={handleBook}>
              {!isAuthenticated
                ? '登录后预订'
                : !dateSelection.checkIn
                ? '请先选择日期'
                : '立即预订'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
