import React, { useState } from 'react';

function BaziInfo({ baziData, liuNianData, targetWuxing }) {
  const [activeTab, setActiveTab] = useState('bazi');

  const wuxingColors = {
    '金': '#C0C0C0',
    '木': '#228B22',
    '水': '#1E90FF',
    '火': '#DC143C',
    '土': '#DAA520'
  };

  if (!baziData) return null;

  return (
    <div>
      <div className="tab-bar">
        <div 
          className={`tab-item ${activeTab === 'bazi' ? 'active' : ''}`}
          onClick={() => setActiveTab('bazi')}
        >
          八字排盘
        </div>
        <div 
          className={`tab-item ${activeTab === 'wuxing' ? 'active' : ''}`}
          onClick={() => setActiveTab('wuxing')}
        >
          五行分析
        </div>
        <div 
          className={`tab-item ${activeTab === 'liunian' ? 'active' : ''}`}
          onClick={() => setActiveTab('liunian')}
        >
          2025流年
        </div>
      </div>

      {activeTab === 'bazi' && (
        <div className="bazi-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="shengxiao-badge">
              🐾 生肖：{baziData.shengxiao}
            </span>
            <span style={{ fontSize: '13px', color: '#666' }}>
              {baziData.wuxingWangshuai?.mingGe || ''}
            </span>
          </div>

          <div className="bazi-pillars">
            {baziData.eightChars?.map((pillar, idx) => (
              <div key={idx} className="pillar">
                <div className="pillar-label">{pillar.position}</div>
                <div className="pillar-text">{pillar.tianGan}{pillar.diZhi}</div>
              </div>
            ))}
          </div>

          {baziData.trueSolarTime && (
            <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
              真太阳时校准：{baziData.trueSolarTime.hour}时{baziData.trueSolarTime.minute}分
              <span style={{ marginLeft: '8px' }}>
                (北京时间：{baziData.trueSolarTime.hour}时)
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'wuxing' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            {Object.entries(baziData.wuxingPercent || {}).map(([wx, percent]) => (
              <div key={wx} className="wuxing-bar">
                <span className="wuxing-label" style={{ color: wuxingColors[wx] }}>
                  {wx}
                </span>
                <div className="wuxing-track">
                  <div 
                    className="wuxing-fill"
                    style={{ 
                      width: `${percent * 100}%`,
                      background: wuxingColors[wx]
                    }}
                  ></div>
                </div>
                <span className="wuxing-value">{(percent * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <div style={{ 
              flex: 1, 
              padding: '12px', 
              background: '#fff7e6', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>旺相五行</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#d46b08' }}>
                {baziData.wuxingWangshuai?.wang?.join(' · ') || '-'}
              </div>
            </div>
            <div style={{ 
              flex: 1, 
              padding: '12px', 
              background: '#e6f7ff', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>宜补五行</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#1890ff' }}>
                {targetWuxing?.bu?.join(' · ') || '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'liunian' && (
        <div>
          {liuNianData ? (
            <div style={{ 
              padding: '16px', 
              background: liuNianData.jixiong === '吉' || liuNianData.jixiong === '大吉' 
                ? '#f6ffed' 
                : liuNianData.jixiong === '凶' 
                  ? '#fff1f0' 
                  : '#fffbe6',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>
                  2025乙巳蛇年 {liuNianData.yueming}
                </span>
                <span style={{ 
                  padding: '4px 12px', 
                  background: liuNianData.jixiong === '吉' || liuNianData.jixiong === '大吉' 
                    ? '#52c41a' 
                    : liuNianData.jixiong === '凶' 
                      ? '#f5222d' 
                      : '#faad14',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '13px'
                }}>
                  {liuNianData.relation} · {liuNianData.jixiong}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
                {liuNianData.yunyishi}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无流年数据
            </div>
          )}

          {baziData.dayun && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                大运走势
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {baziData.dayun.map((yun, idx) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    background: '#f0f5ff',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '70px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#888' }}>{yun.age}岁</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>
                      {yun.tianGan}{yun.diZhi}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BaziInfo;
