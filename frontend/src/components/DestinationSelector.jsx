import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationStore } from '../store';

const DestinationSelector = ({ onSelect, onClose }) => {
  const [searchText, setSearchText] = useState('');
  
  const destinations = [
    { name: '北京首都国际机场', address: '北京市顺义区', latitude: 40.0799, longitude: 116.6031 },
    { name: '北京西站', address: '北京市丰台区', latitude: 39.8948, longitude: 116.3216 },
    { name: '天安门广场', address: '北京市东城区', latitude: 39.9042, longitude: 116.4074 },
    { name: '中关村', address: '北京市海淀区', latitude: 39.9836, longitude: 116.3086 },
    { name: '望京SOHO', address: '北京市朝阳区', latitude: 39.9962, longitude: 116.4744 },
    { name: '三里屯', address: '北京市朝阳区', latitude: 39.9371, longitude: 116.4418 },
    { name: '国贸CBD', address: '北京市朝阳区', latitude: 39.9087, longitude: 116.4760 },
    { name: '奥林匹克公园', address: '北京市朝阳区', latitude: 39.9999, longitude: 116.4066 },
    { name: '王府井', address: '北京市东城区', latitude: 39.9142, longitude: 116.4039 },
    { name: '西单', address: '北京市西城区', latitude: 39.9122, longitude: 116.3665 },
  ];

  const filteredDestinations = searchText
    ? destinations.filter(d => d.name.includes(searchText) || d.address.includes(searchText))
    : destinations;

  const handleSelect = (dest) => {
    onSelect(dest);
    onClose();
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        background: 'rgba(0,0,0,0.5)', 
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white', 
          width: '100%', 
          maxHeight: '70vh',
          borderRadius: '16px 16px 0 0',
          padding: '16px',
          paddingBottom: '32px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div 
            onClick={onClose}
            style={{ fontSize: '20px', cursor: 'pointer', marginRight: '12px' }}
          >
            ✕
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '16px' }}>
            选择目的地
          </div>
          <div style={{ width: '24px' }}></div>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '0 12px',
          marginBottom: '16px'
        }}>
          <span style={{ marginRight: '8px' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索目的地"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              flex: 1, 
              border: 'none', 
              outline: 'none', 
              background: 'transparent',
              fontSize: '14px',
              padding: '12px 0'
            }}
          />
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 120px)' }}>
          {filteredDestinations.map((dest, index) => (
            <div
              key={index}
              onClick={() => handleSelect(dest)}
              style={{ 
                padding: '12px 0',
                borderBottom: index < filteredDestinations.length - 1 ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: '500' }}>{dest.name}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{dest.address}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationSelector;