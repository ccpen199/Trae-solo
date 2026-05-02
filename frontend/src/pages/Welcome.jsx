import React from 'react';
import { Link } from 'react-router-dom';

function Welcome() {
  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <div className="card">
        <div className="welcome-section">
          <h1 className="welcome-title">🏠 休闲合成游戏</h1>
          <p className="welcome-subtitle">
            收集材料，合成物品，建造你的梦幻家园！
          </p>

          <div className="welcome-actions">
            <Link to="/login">
              <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
                登录游戏
              </button>
            </Link>
            <Link to="/register">
              <button className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
                注册账号
              </button>
            </Link>
          </div>

          <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ marginBottom: '8px', color: '#2d3748' }}>收集合成</h3>
              <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                收集各种材料，通过配方合成更高级的物品
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
              <h3 style={{ marginBottom: '8px', color: '#2d3748' }}>背包管理</h3>
              <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                管理你的物品，查看拥有的材料和物品
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎁</div>
              <h3 style={{ marginBottom: '8px', color: '#2d3748' }}>每日奖励</h3>
              <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                每日登录领取奖励，获得金币和材料
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
