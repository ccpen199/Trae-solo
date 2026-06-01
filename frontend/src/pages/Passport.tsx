import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { planetAPI } from '../utils/api';
import { PassportCategory } from '../types';

const Passport: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<PassportCategory[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadPassport();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated]);

  const loadPassport = async () => {
    try {
      const res = await planetAPI.getPassport();
      setCategories(res.data.categories || []);
      setTotalValue(res.data.totalValue || 0);
    } catch (error) {
      console.error('Load passport error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateData = async (category: string) => {
    try {
      await planetAPI.updatePassport({
        category,
        dataPoints: Math.floor(Math.random() * 10) + 1,
        valueScore: Math.random() * 10
      });
      loadPassport();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="header">
        <h1>📊 数据护照</h1>
        <p>您的数据价值</p>
      </div>

      <div className="card balance-card">
        <div className="balance-label">总价值评分</div>
        <div className="balance-value">{totalValue.toFixed(1)}</div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>数据分类</h3>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="passport-grid">
            {categories.map((cat, index) => (
              <div key={index} className="passport-item">
                <div className="passport-category">{cat.category}</div>
                <div className="passport-value">{cat.value_score.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {cat.data_points} 条数据
                </div>
                <button 
                  className="btn btn-primary"
                  style={{ marginTop: 12, padding: '6px 12px', fontSize: 12 }}
                  onClick={() => handleUpdateData(cat.category)}
                >
                  同步数据
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>数据价值说明</h3>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
          <p>✅ <strong>电商数据</strong>：购物记录、消费偏好等</p>
          <p>✅ <strong>游戏数据</strong>：游戏时长、成就、虚拟资产等</p>
          <p>✅ <strong>娱乐数据</strong>：视频观看、音乐播放等</p>
          <p>✅ <strong>金融数据</strong>：支付习惯、信用记录等</p>
          <p>✅ <strong>健康数据</strong>：运动、睡眠等健康指标</p>
          <br />
          <p>💡 您的数据归您所有，数据产生的价值也归您所有。</p>
        </div>
      </div>

      <button 
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => navigate('/profile')}
      >
        返回
      </button>
    </div>
  );
};

export default Passport;
