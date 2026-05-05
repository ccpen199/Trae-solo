import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore, useModalStore } from '@/store';
import { homeApi, cityApi } from '@/api';
import { City, Banner, ActivityTopic, Property, SearchHistory } from '@/types';
import { formatDateCN } from '@/utils/date';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCity, keyword, dateSelection, guests, setSelectedCity, setKeyword, setGuests } =
    useSearchStore();
  const { setShowDatePicker, setShowCityPicker, setShowLoginModal } = useModalStore();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [topics, setTopics] = useState<ActivityTopic[]>([]);
  const [hotCities, setHotCities] = useState<City[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bannersData, topicsData, hotCitiesData, propertiesData, historyData] =
        await Promise.all([
          homeApi.getBanners(),
          homeApi.getTopics(),
          homeApi.getHotCities(),
          homeApi.getRecommendedProperties(),
          homeApi.getSearchHistory(),
        ]);
      setBanners(bannersData);
      setTopics(topicsData);
      setHotCities(hotCitiesData);
      setRecommendedProperties(propertiesData);
      setSearchHistory(historyData);
    } catch (error) {
      console.error('Load home data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async (kw: string) => {
    setSearchKeyword(kw);
    if (kw.trim().length > 0) {
      try {
        const results = await cityApi.searchCities(kw);
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Search cities error:', error);
      }
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setSearchKeyword('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity?.id) params.append('cityId', selectedCity.id);
    if (searchKeyword || keyword) params.append('keyword', searchKeyword || keyword);
    if (dateSelection.checkIn)
      params.append('checkIn', dateSelection.checkIn.toISOString().split('T')[0]);
    if (dateSelection.checkOut)
      params.append('checkOut', dateSelection.checkOut.toISOString().split('T')[0]);
    if (guests) params.append('guests', String(guests));

    navigate(`/search?${params.toString()}`);
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const handleCityClick = (city: City) => {
    setSelectedCity(city);
    navigate(`/search?cityId=${city.id}`);
  };

  const handleHistoryClick = (history: SearchHistory) => {
    if (history.cityId) {
      navigate(`/search?cityId=${history.cityId}`);
    } else if (history.keyword) {
      navigate(`/search?keyword=${encodeURIComponent(history.keyword)}`);
    }
  };

  const handleClearHistory = async () => {
    try {
      await homeApi.clearSearchHistory();
      setSearchHistory([]);
    } catch (error) {
      console.error('Clear history error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 24px 60px',
  };

  const searchBarStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    marginBottom: 32,
  };

  const searchItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderRight: '1px solid #eee',
    position: 'relative',
  };

  const searchInputStyle: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    width: 180,
  };

  const searchLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    marginBottom: 4,
  };

  const searchBtnStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    backgroundColor: '#ff385c',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: 8,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    marginTop: 8,
    zIndex: 10,
    maxHeight: 300,
    overflow: 'auto',
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
  };

  const bannerContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    marginBottom: 40,
    overflow: 'auto',
    paddingBottom: 8,
  };

  const bannerItemStyle: React.CSSProperties = {
    flex: '0 0 auto',
    width: 380,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
  };

  const bannerImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

  const bannerOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px 20px',
    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
    color: '#fff',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 20,
  };

  const topicsContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 16,
    marginBottom: 40,
  };

  const topicItemStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const citiesContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 16,
    marginBottom: 40,
  };

  const cityItemStyle: React.CSSProperties = {
    textAlign: 'center',
    cursor: 'pointer',
  };

  const cityImageStyle: React.CSSProperties = {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
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

  const historyContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  };

  const historyTagsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  };

  const historyTagStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#fff',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 14,
    color: '#666',
  };

  return (
    <div style={containerStyle}>
      <div style={searchBarStyle}>
        <div style={{ ...searchItemStyle, position: 'relative' }}>
          <div style={searchLabelStyle}>目的地</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              style={searchInputStyle}
              placeholder={selectedCity?.name || '搜索城市或地区'}
              value={searchKeyword}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => searchKeyword && setShowSearchDropdown(true)}
            />
            {selectedCity && !searchKeyword && (
              <span style={{ color: '#333' }}>{selectedCity.name}</span>
            )}
          </div>

          {showSearchDropdown && searchResults.length > 0 && (
            <div style={dropdownStyle}>
              {searchResults.map((city) => (
                <div
                  key={city.id}
                  style={dropdownItemStyle}
                  onClick={() => handleSelectCity(city)}
                >
                  <div style={{ fontWeight: 500 }}>{city.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {city.province || city.country}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={searchItemStyle} onClick={() => setShowDatePicker(true)}>
          <div style={searchLabelStyle}>入住日期</div>
          <div style={{ color: dateSelection.checkIn ? '#333' : '#999' }}>
            {dateSelection.checkIn
              ? `${formatDateCN(dateSelection.checkIn)} - ${formatDateCN(
                  dateSelection.checkOut!
                )} (${dateSelection.nights}晚)`
              : '请选择日期'}
          </div>
        </div>

        <div style={searchItemStyle}>
          <div style={searchLabelStyle}>入住人数</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setGuests(Math.max(1, guests - 1))}
            >
              -
            </button>
            <span>{guests}位客人</span>
            <button
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setGuests(Math.min(16, guests + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div style={searchBtnStyle} onClick={handleSearch}>
          <span style={{ color: '#fff', fontSize: 20 }}>🔍</span>
        </div>
      </div>

      {searchHistory.length > 0 && (
        <div>
          <div style={historyContainerStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>搜索历史</h3>
            <button
              style={{ color: '#999', cursor: 'pointer', fontSize: 14 }}
              onClick={handleClearHistory}
            >
              清空
            </button>
          </div>
          <div style={historyTagsStyle}>
            {searchHistory.map((history) => (
              <div
                key={history.id}
                style={historyTagStyle}
                onClick={() => handleHistoryClick(history)}
              >
                {history.keyword}
              </div>
            ))}
          </div>
        </div>
      )}

      {banners.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>活动推荐</h2>
          <div style={bannerContainerStyle}>
            {banners.map((banner) => (
              <div key={banner.id} style={bannerItemStyle}>
                <img
                  src={banner.image}
                  alt={banner.title}
                  style={bannerImageStyle}
                />
                <div style={bannerOverlayStyle}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                    {banner.title}
                  </div>
                  {banner.subtitle && (
                    <div style={{ fontSize: 14, opacity: 0.9 }}>{banner.subtitle}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>出行目的</h2>
          <div style={topicsContainerStyle}>
            {topics.map((topic) => (
              <div key={topic.id} style={topicItemStyle}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{topic.icon}</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{topic.title}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{topic.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hotCities.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>热门城市</h2>
          <div style={citiesContainerStyle}>
            {hotCities.slice(0, 6).map((city) => (
              <div key={city.id} style={cityItemStyle} onClick={() => handleCityClick(city)}>
                <div style={cityImageStyle}>
                  {city.isDomestic ? '🏙️' : '✈️'}
                </div>
                <div style={{ fontWeight: 500 }}>{city.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {city.province || city.country}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendedProperties.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>精选民宿</h2>
          <div style={propertiesContainerStyle}>
            {recommendedProperties.map((property) => (
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
                      ({property.reviewCount}条评价)
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
        </div>
      )}
    </div>
  );
};

export default Home;
