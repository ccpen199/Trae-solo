import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSearchStore, useModalStore } from '@/store';
import { propertyApi } from '@/api';
import { Property, Pagination, SearchParams } from '@/types';
import { formatDateCN } from '@/utils/date';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCity, dateSelection, guests, setGuests } = useSearchStore();
  const { setShowDatePicker } = useModalStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination<Property>['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: (searchParams.get('sortBy') as 'price' | 'rating' | 'views') || 'rating',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });

  useEffect(() => {
    loadProperties();
  }, [currentPage, filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params: SearchParams = {
        cityId: searchParams.get('cityId') || selectedCity?.id,
        keyword: searchParams.get('keyword'),
        checkIn: searchParams.get('checkIn') || (dateSelection.checkIn ? dateSelection.checkIn.toISOString().split('T')[0] : undefined),
        checkOut: searchParams.get('checkOut') || (dateSelection.checkOut ? dateSelection.checkOut.toISOString().split('T')[0] : undefined),
        guests: parseInt(searchParams.get('guests') || String(guests), 10),
        page: currentPage,
        pageSize: 20,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.minPrice) params.minPrice = parseInt(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = parseInt(filters.maxPrice);

      const result = await propertyApi.search(params);
      setProperties(result.list);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Search properties error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 24px 60px',
  };

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  };

  const filterItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    cursor: 'pointer',
  };

  const dateBoxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: 80,
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: '#fff',
  };

  const resultsTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 20,
  };

  const propertiesContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 24,
  };

  const propertyCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const propertyImageStyle: React.CSSProperties = {
    width: '100%',
    height: 200,
    objectFit: 'cover' as const,
  };

  const propertyContentStyle: React.CSSProperties = {
    padding: 16,
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
  };

  const pageBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: active ? '#ff385c' : '#fff',
    color: active ? '#fff' : '#333',
    border: active ? 'none' : '1px solid #ddd',
  });

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 80,
    fontSize: 16,
    color: '#666',
  };

  const noResultsStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 80,
  };

  return (
    <div style={containerStyle}>
      <div style={filterBarStyle}>
        <div style={dateBoxStyle} onClick={() => setShowDatePicker(true)}>
          <span>📅</span>
          <span>
            {dateSelection.checkIn
              ? `${formatDateCN(dateSelection.checkIn)} - ${formatDateCN(
                  dateSelection.checkOut!
                )} (${dateSelection.nights}晚)`
              : '选择日期'}
          </span>
        </div>

        <div style={filterItemStyle}>
          <span>👥</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setGuests(Math.max(1, guests - 1))}
          >
            -
          </button>
          <span>{guests}人</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setGuests(Math.min(16, guests + 1))}
          >
            +
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 14 }}>价格:</span>
          <input
            style={inputStyle}
            placeholder="最低"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            type="number"
          />
          <span style={{ color: '#999' }}>-</span>
          <input
            style={inputStyle}
            placeholder="最高"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            type="number"
          />
        </div>

        <select
          style={selectStyle}
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
        >
          <option value="rating">评分优先</option>
          <option value="price">价格优先</option>
          <option value="views">人气优先</option>
        </select>

        <select
          style={selectStyle}
          value={filters.sortOrder}
          onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
        >
          <option value="desc">从高到低</option>
          <option value="asc">从低到高</option>
        </select>
      </div>

      <div style={resultsTitleStyle}>
        找到 {pagination?.total || 0} 套房源
      </div>

      {loading ? (
        <div style={loadingStyle}>加载中...</div>
      ) : properties.length === 0 ? (
        <div style={noResultsStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
          <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
            暂无符合条件的房源
          </div>
          <div style={{ fontSize: 14, color: '#999' }}>
            试试调整搜索条件或价格范围
          </div>
        </div>
      ) : (
        <>
          <div style={propertiesContainerStyle}>
            {properties.map((property) => (
              <div
                key={property.id}
                style={propertyCardStyle}
                onClick={() => handlePropertyClick(property.id)}
              >
                <img
                  src={property.mainImage}
                  alt={property.title}
                  style={propertyImageStyle}
                />
                <div style={propertyContentStyle}>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {property.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    {property.city?.name} · {property.bedrooms}室{property.beds}床
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#ff385c', fontSize: 12 }}>★</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{property.rating}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      ({property.reviewCount})
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 600, color: '#ff385c' }}>
                      ¥{property.pricePerNight}
                    </span>
                    <span style={{ fontSize: 12, color: '#666' }}>/晚</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                style={{ ...pageBtnStyle(false), opacity: currentPage === 1 ? 0.5 : 1 }}
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  style={pageBtnStyle(page === currentPage)}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                style={{
                  ...pageBtnStyle(false),
                  opacity: currentPage === pagination.totalPages ? 0.5 : 1,
                }}
                onClick={() =>
                  currentPage < pagination.totalPages && setCurrentPage(currentPage + 1)
                }
                disabled={currentPage === pagination.totalPages}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;
