import React, { useState } from 'react';

function NameDetail({ nameData }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!nameData || !nameData.analysis) return null;

  const { analysis } = nameData;
  const wuxingColors = {
    '金': '#C0C0C0',
    '木': '#228B22',
    '水': '#1E90FF',
    '火': '#DC143C',
    '土': '#DAA520'
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '8px' }}>
            {nameData.fullName}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
            综合评分
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '48px', fontWeight: 700 }}>
            {analysis.totalScore}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            分
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <div 
          className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          综合概览
        </div>
        <div 
          className={`tab-item ${activeTab === 'wuxing' ? 'active' : ''}`}
          onClick={() => setActiveTab('wuxing')}
        >
          五行平衡
        </div>
        <div 
          className={`tab-item ${activeTab === 'wuge' ? 'active' : ''}`}
          onClick={() => setActiveTab('wuge')}
        >
          五格数理
        </div>
        <div 
          className={`tab-item ${activeTab === 'gua' ? 'active' : ''}`}
          onClick={() => setActiveTab('gua')}
        >
          周易卦象
        </div>
        <div 
          className={`tab-item ${activeTab === 'tone' ? 'active' : ''}`}
          onClick={() => setActiveTab('tone')}
        >
          声调发音
        </div>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="detail-section">
            <div className="detail-title">📊 各项评分</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <ScoreCard label="五行平衡度" score={analysis.wuxingBalance?.score || 0} color="#1890ff" />
              <ScoreCard label="五格数理" score={analysis.wuge?.score || 0} color="#722ed1" />
              <ScoreCard label="生肖适配" score={analysis.shengxiao?.score || 0} color="#52c41a" />
              <ScoreCard label="音律优美" score={analysis.pinyin?.score || 0} color="#fa8c16" />
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-title">🏷️ 重名率统计</div>
            <div className="chongming">
              <div>
                <div style={{ fontSize: '13px', color: '#888' }}>全国使用人数</div>
                <div className="chongming-rate">
                  约{Math.floor((analysis.chongmingRate?.rate || 0) * 100)}万人
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#888' }}>重名率等级</div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: analysis.chongmingRate?.level === '极低' ? '#52c41a' 
                    : analysis.chongmingRate?.level === '极高' ? '#f5222d' 
                    : '#fa8c16'
                }}>
                  {analysis.chongmingRate?.level || '-'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              {analysis.chongmingRate?.description || ''}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wuxing' && (
        <div>
          <div className="detail-section">
            <div className="detail-title">⚖️ 五行平衡度分析</div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>平衡度评分</span>
                <span style={{ fontWeight: 600, color: '#1890ff' }}>
                  {analysis.wuxingBalance?.score || 0}分
                  <span style={{ 
                    fontSize: '12px', 
                    marginLeft: '8px',
                    color: analysis.wuxingBalance?.level === '优秀' ? '#52c41a' : '#fa8c16'
                  }}>
                    {analysis.wuxingBalance?.level || ''}
                  </span>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {Object.entries(analysis.wuxingBalance?.counts || {}).map(([wx, count]) => (
                <div key={wx} className="wuxing-bar">
                  <span className="wuxing-label" style={{ color: wuxingColors[wx] }}>
                    {wx}
                  </span>
                  <div className="wuxing-track">
                    <div 
                      className="wuxing-fill"
                      style={{ 
                        width: `${(analysis.wuxingBalance?.balance?.[wx] || 0) * 100}%`,
                        background: wuxingColors[wx]
                      }}
                    ></div>
                  </div>
                  <span className="wuxing-value">
                    {count}个 ({((analysis.wuxingBalance?.balance?.[wx] || 0) * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="flow-chart">
              <div className="flow-item">
                <div className="flow-box" style={{ background: '#228B22' }}>木</div>
                <div className="flow-label">生</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-item">
                <div className="flow-box" style={{ background: '#DC143C' }}>火</div>
                <div className="flow-label">生</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-item">
                <div className="flow-box" style={{ background: '#DAA520' }}>土</div>
                <div className="flow-label">生</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-item">
                <div className="flow-box" style={{ background: '#C0C0C0', color: '#333' }}>金</div>
                <div className="flow-label">生</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-item">
                <div className="flow-box" style={{ background: '#1E90FF' }}>水</div>
                <div className="flow-label">生木</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
              五行相生关系图
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wuge' && (
        <div>
          <div className="detail-section">
            <div className="detail-title">🔢 五格数理分析</div>
            
            <div className="sancai">
              <div className="sancai-title">三才配置</div>
              <div className="sancai-value">
                {analysis.wuge?.sanCai?.tianWx} - {analysis.wuge?.sanCai?.renWx} - {analysis.wuge?.sanCai?.diWx}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                {analysis.wuge?.sanCai?.type} ({analysis.wuge?.sanCai?.jixiong})
              </div>
              <div className="sancai-desc">
                {analysis.wuge?.sanCai?.description}
              </div>
            </div>

            <div className="wuge-grid">
              {['tianGe', 'renGe', 'diGe', 'waiGe', 'zongGe'].map(key => {
                const wuge = analysis.wuge?.wuge?.[key];
                if (!wuge) return null;
                return (
                  <div key={key} className="wuge-item">
                    <div className="wuge-name">{wuge.position}</div>
                    <div className="wuge-num">{wuge.strokes}</div>
                    <div className={`wuge-type type-${wuge.type}`}>{wuge.type}</div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                      {wuge.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {analysis.wuge?.biange?.hasBiange && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: '#fffbe6', 
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>⚠️ 变格提示</div>
                {analysis.wuge.biange.issues.map((issue, idx) => (
                  <div key={idx} style={{ color: '#666', fontSize: '12px' }}>
                    • {issue.description}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>天格</strong>：{analysis.wuge?.wuge?.tianGe?.description}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>人格</strong>：{analysis.wuge?.wuge?.renGe?.description}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>地格</strong>：{analysis.wuge?.wuge?.diGe?.description}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>外格</strong>：{analysis.wuge?.wuge?.waiGe?.description}
              </div>
              <div>
                <strong>总格</strong>：{analysis.wuge?.wuge?.zongGe?.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gua' && analysis.gua && (
        <div>
          <div className="detail-section">
            <div className="detail-title">☯️ 周易卦象解析</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="gua-info">
                <div className="gua-symbol">{analysis.gua.benGua?.symbol || '☰'}</div>
                <div className="gua-name">本卦：{analysis.gua.benGua?.name || '未知'}</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  marginTop: '8px',
                  background: analysis.gua.benGua?.jixiong === '大吉' || analysis.gua.benGua?.jixiong === '吉'
                    ? '#f6ffed'
                    : '#fffbe6',
                  color: analysis.gua.benGua?.jixiong === '大吉' || analysis.gua.benGua?.jixiong === '吉'
                    ? '#52c41a'
                    : '#fa8c16'
                }}>
                  {analysis.gua.benGua?.jixiong || '平'}
                </div>
                <div className="gua-ci">「{analysis.gua.benGua?.guaCi || ''}」</div>
              </div>

              <div className="gua-info" style={{ background: '#f0f5ff' }}>
                <div className="gua-symbol">{analysis.gua.zhiGua?.symbol || '☷'}</div>
                <div className="gua-name">之卦：{analysis.gua.zhiGua?.name || '未知'}</div>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  marginTop: '8px',
                  background: analysis.gua.zhiGua?.jixiong === '大吉' || analysis.gua.zhiGua?.jixiong === '吉'
                    ? '#f6ffed'
                    : '#fffbe6',
                  color: analysis.gua.zhiGua?.jixiong === '大吉' || analysis.gua.zhiGua?.jixiong === '吉'
                    ? '#52c41a'
                    : '#fa8c16'
                }}>
                  {analysis.gua.zhiGua?.jixiong || '平'}
                </div>
                <div className="gua-ci">「{analysis.gua.zhiGua?.guaCi || ''}」</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                六爻解析 (动爻: 第{analysis.gua.dongYao}爻)
              </div>
              <div className="yaos-list">
                {analysis.gua.yaoCis?.map((yao, idx) => (
                  <div 
                    key={idx} 
                    className={`yao ${yao.yinYang === '阳' ? 'yao-yang' : 'yao-yin'} ${yao.isDong ? 'yao-dong' : ''}`}
                    title={yao.yaoCi}
                  >
                    {yao.isDong ? '●' : yao.yinYang === '阳' ? '—' : '- -'}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginBottom: '16px' }}>
                ○阳爻 &nbsp; ●动爻 &nbsp; --阴爻
              </div>
            </div>

            <div style={{ 
              padding: '16px', 
              background: '#faf5ff', 
              borderRadius: '12px',
              fontSize: '14px',
              lineHeight: 1.8,
              color: '#333'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#722ed1' }}>
                📖 卦象总结
              </div>
              {analysis.gua.jieshi?.zongJie || ''}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tone' && (
        <div>
          <div className="detail-section">
            <div className="detail-title">🎵 发音声调可视化</div>
            
            <div className="tone-visual">
              {analysis.fayinTone?.details?.map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div className={`tone-bar tone-${item.tone || 1}`}>
                    {item.tone === 1 ? 'ˉ' : item.tone === 2 ? 'ˊ' : item.tone === 3 ? 'ˇ' : 'ˋ'}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 600 }}>{item.char}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.pinyin}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {item.tone === 1 ? '阴平' : item.tone === 2 ? '阳平' : item.tone === 3 ? '上声' : '去声'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: '#f9f0ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#888' }}>声调格局</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#722ed1', marginTop: '4px' }}>
                {analysis.fayinTone?.description || ''}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                音律评分: {analysis.pinyin?.score || 0}分 ({analysis.pinyin?.level || ''})
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                📝 字意解析
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {nameData.characters?.map((char, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px', 
                    background: '#f6ffed', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${wuxingColors[char.wuxing] || '#666'} 0%, ${wuxingColors[char.wuxing] || '#666'}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'white',
                      fontWeight: 600
                    }}>
                      {char.char}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>
                        {char.char} [{char.pinyin}] · {char.strokes}画
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        五行: <span style={{ color: wuxingColors[char.wuxing], fontWeight: 500 }}>{char.wuxing}</span>
                        <span style={{ margin: '0 8px' }}>|</span>
                        含义: {char.meaning}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score, color }) {
  return (
    <div style={{ 
      padding: '16px', 
      background: '#fafafa', 
      borderRadius: '12px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: 700,
        color: color
      }}>
        {score}
        <span style={{ fontSize: '14px', color: '#999' }}>分</span>
      </div>
    </div>
  );
}

export default NameDetail;
