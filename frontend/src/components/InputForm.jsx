import React, { useState } from 'react';

function InputForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    surname: '',
    gender: '男',
    birthday: '',
    birthHour: 12,
    birthMinute: 0,
    longitude: 116.4,
    nameLength: 2,
    wish: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'birthHour' || name === 'birthMinute' || name === 'nameLength' || name === 'longitude' 
        ? parseFloat(value) 
        : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.surname) {
      alert('请输入姓氏');
      return;
    }
    if (!formData.birthday) {
      alert('请选择出生日期');
      return;
    }
    
    onSubmit(formData);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">姓氏</label>
        <input
          type="text"
          name="surname"
          className="form-input"
          placeholder="请输入姓氏"
          value={formData.surname}
          onChange={handleChange}
          maxLength={2}
        />
      </div>

      <div className="form-group">
        <label className="form-label">性别</label>
        <select
          name="gender"
          className="select-input"
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">出生日期</label>
        <input
          type="date"
          name="birthday"
          className="form-input"
          value={formData.birthday}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">出生时</label>
          <select
            name="birthHour"
            className="select-input"
            value={formData.birthHour}
            onChange={handleChange}
          >
            {hours.map(h => (
              <option key={h} value={h}>{h}时</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">出生分</label>
          <select
            name="birthMinute"
            className="select-input"
            value={formData.birthMinute}
            onChange={handleChange}
          >
            {minutes.map(m => (
              <option key={m} value={m}>{m}分</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">出生地经度 (默认北京116.4°)</label>
        <input
          type="number"
          name="longitude"
          className="form-input"
          placeholder="请输入经度"
          value={formData.longitude}
          onChange={handleChange}
          step="0.1"
          min="73"
          max="135"
        />
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          用于真太阳时校准，如：上海121.47°、广州113.23°、成都104.06°
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">名字字数</label>
        <select
          name="nameLength"
          className="select-input"
          value={formData.nameLength}
          onChange={handleChange}
        >
          <option value={1}>单字名 (姓+1字)</option>
          <option value={2}>双字名 (姓+2字)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">起名期望 (选填)</label>
        <input
          type="text"
          name="wish"
          className="form-input"
          placeholder="如：健康、聪明、富贵、文雅等"
          value={formData.wish}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
      >
        {loading ? '✨ 智能分析中...' : '🔮 开始智能起名'}
      </button>
    </form>
  );
}

export default InputForm;
