import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationApi } from '../api';
import { useLocationStore } from '../store';

const CitySelector = () => {
  const navigate = useNavigate();
  const { setCurrentCity } = useLocationStore();
  const [cities, setCities] = useState([]);
  const [hotCities, setHotCities] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const [allRes, hotRes] = await Promise.all([
        locationApi.getCities(),
        locationApi.getCities({ hot: 1 })
      ]);
      
      if (allRes.data.success) {
        setCities(allRes.data.data);
      }
      if (hotRes.data.success) {
        setHotCities(hotRes.data.data);
      }
    } catch (err) {
      console.error('加载城市失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setCurrentCity(city);
    navigate(-1);
  };

  const filteredCities = searchKeyword
    ? cities.filter(c => 
        c.name.includes(searchKeyword) || 
        c.pinyin?.includes(searchKeyword.toLowerCase()) ||
        c.initial?.toLowerCase() === searchKeyword.toLowerCase()
      )
    : cities;

  const groupedCities = {};
  filteredCities.forEach(city => {
    const initial = city.initial || 'A';
    if (!groupedCities[initial]) {
      groupedCities[initial] = [];
    }
    groupedCities[initial].push(city);
  });

  const sortedInitials = Object.keys(groupedCities).sort();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'white', 
        padding: '12px 16px', 
        paddingTop: '50px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            onClick={() => navigate(-1)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            background: '#f5f5f5',
            borderRadius: '20px',
            padding: '8px 16px'
          }}>
            <span style={{ marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="搜索城市名称或拼音"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ 
                flex: 1, 
                border: 'none', 
                outline: 'none', 
                background: 'transparent',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </div>

      {!searchKeyword && (
        <div style={{ background: 'white', marginTop: '10px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>热门城市</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {hotCities.map(city => (
              <div
                key={city.id}
                onClick={() => handleSelectCity(city)}
                style={{ 
                  padding: '8px 16px', 
                  background: '#f5f5f5', 
                  borderRadius: '16px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {city.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'white', marginTop: '10px', padding: '16px' }}>
        {sortedInitials.map(initial => (
          <div key={initial} style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#ff6a00', 
              marginBottom: '8px',
              position: 'sticky',
              top: '100px',
              background: 'white',
              padding: '4px 0'
            }}>
              {initial}
            </div>
            {groupedCities[initial].map(city => (
              <div
                key={city.id}
                onClick={() => handleSelectCity(city)}
                style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {city.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitySelector;