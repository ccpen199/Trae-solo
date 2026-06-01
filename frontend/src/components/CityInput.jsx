import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getCities, getHotCities } from '../utils/api';

function CityInput({ value, onChange, placeholder, label }) {
  const [keyword, setKeyword] = useState('');
  const [cities, setCities] = useState([]);
  const [hotCities, setHotCities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    getHotCities().then(res => {
      if (res.data.success) {
        setHotCities(res.data.data);
        setCities(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    if (value && hotCities.length > 0 && !isSelectingRef.current) {
      const city = hotCities.find(c => c.code === value);
      if (city && city.name !== keyword) {
        setKeyword(city.name);
      }
    }
  }, [value]);

  useEffect(() => {
    if (keyword.trim()) {
      const timer = setTimeout(() => {
        getCities(keyword).then(res => {
          if (res.data.success) {
            setCities(res.data.data);
          }
        });
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setCities(hotCities);
    }
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightText = useMemo(() => {
    if (!keyword) return (text) => <>{text}</>;
    
    return (text) => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      const parts = text.split(regex);
      return <>
        {parts.map((part, index) =>
          regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
        )}
      </>;
    };
  }, [keyword]);

  const handleSelect = (city) => {
    isSelectingRef.current = true;
    onChange(city.code);
    setKeyword(city.name);
    setShowDropdown(false);
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleInputClick = () => {
    setShowDropdown(true);
    setCities(hotCities);
  };

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const displayValue = useMemo(() => {
    if (!value) return keyword;
    const city = hotCities.find(c => c.code === value);
    return city ? city.name : keyword;
  }, [value, hotCities, keyword]);

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="city-input-wrapper" ref={dropdownRef}>
        <input
          type="text"
          className="city-input"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputClick}
        />
        {showDropdown && (
          <div className="city-dropdown">
            {cities.length > 0 ? (
              cities.map(city => (
                <div
                  key={city.code}
                  className="city-dropdown-item"
                  onClick={() => handleSelect(city)}
                >
                  {highlightText(city.name)}
                  <span className="city-code">{city.code}</span>
                </div>
              ))
            ) : (
              <div className="city-dropdown-item">暂无数据</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CityInput;
