import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const CreditCenter = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      setCreditData({
        score: 725,
        level: '良好',
        maxScore: 900,
        nextLevel: '优秀',
        nextLevelScore: 750,
        components: [
          { name: '身份认证', score: 150, maxScore: 150, percentage: 100, icon: '🆔' },
          { name: '履约记录', score: 280, maxScore: 300, percentage: 93, icon: '📝' },
          { name: '行为信用', score: 175, maxScore: 250, percentage: 70, icon: '⭐' },
          { name: '守约历史', score: 120, maxScore: 200, percentage: 60, icon: '📜' }
        ],
        privileges: [
          { name: '免押额度', value: '¥10,000', icon: '💳', desc: '可享受最高1万元押金减免' },
          { name: '优先匹配', value: '是', icon: '🎯', desc: '优质房源优先推荐匹配' },
          { name: '服务折扣', value: '9折', icon: '🏷️', desc: '平台服务费用享受9折优惠' },
          { name: '快速审核', value: '是', icon: '⚡', desc: '房源发布、认证等快速审核' }
        ],
        history: [
          { date: '2026-05-20', type: 'increase', amount: 10, reason: '按时支付租金', contract: 'HT202605001' },
          { date: '2026-05-15', type: 'increase', amount: 15, reason: '完成实名认证升级', contract: '' },
          { date: '2026-04-28', type: 'decrease', amount: 5, reason: '延迟支付租金3天', contract: 'HT202604002' },
          { date: '2026-04-01', type: 'increase', amount: 20, reason: '按时完成合同履约', contract: 'HT202603003' },
          { date: '2026-03-10', type: 'decrease', amount: 10, reason: '房源信息填写不完整', contract: '' },
          { date: '2026-02-15', type: 'increase', amount: 8, reason: '好评房东', contract: 'HT202602004' }
        ]
      });
    } catch (error) {
      console.error('获取信用分数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 800) return '#52c41a';
    if (score >= 700) return '#1890ff';
    if (score >= 600) return '#faad14';
    return '#ef4444';
  };

  const getLevelDescription = (level) => {
    const levels = {
      '极差': '信用记录较差，可能影响租房交易',
      '较差': '信用记录一般，建议改善信用行为',
      '中等': '信用记录良好，可享受基本服务',
      '良好': '信用记录优秀，可享受多项权益',
      '优秀': '信用记录极佳，享受最高等级权益'
    };
    return levels[level] || '';
  };

  const handleConnectZhima = () => {
    alert('正在跳转到芝麻信用授权页面...');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">信用分体系</h1>
        <p className="text-gray">建立良好信用，享受更多租房权益</p>
      </div>

      <div className="card mb-6" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div className="card-body">
          <div className="flex-between">
            <div>
              <div className="text-sm opacity-90 mb-1">我的信用分</div>
              <div className="text-5xl font-bold mb-2">
                {creditData?.score}
                <span className="text-xl font-normal opacity-80">/{creditData?.maxScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>
                  {creditData?.level}
                </span>
                <span className="text-sm opacity-90">
                  距离下一等级还需 {creditData?.nextLevelScore - creditData?.score} 分
                </span>
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontSize: '4rem' }}>⭐</div>
              <div className="text-sm opacity-90 mt-1">
                {getLevelDescription(creditData?.level)}
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '1.5rem', 
            height: '8px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div 
              style={{
                height: '100%',
                width: `${(creditData?.score / creditData?.maxScore) * 100}%`,
                background: '#fff',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <div className="flex-between mt-2 text-sm opacity-80">
            <span>350分</span>
            <span>极差</span>
            <span>较差</span>
            <span>中等</span>
            <span>良好</span>
            <span>优秀</span>
            <span>900分</span>
          </div>
        </div>
      </div>

      <div className="tabs mb-6">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 信用构成
        </div>
        <div 
          className={`tab ${activeTab === 'privileges' ? 'active' : ''}`}
          onClick={() => setActiveTab('privileges')}
        >
          🎁 我的权益
        </div>
        <div 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📝 变更记录
        </div>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-2 mb-6" style={{ gap: '1.5rem' }}>
            {creditData?.components?.map((component, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex-between mb-3">
                    <div className="flex items-center gap-3">
                      <div style={{ fontSize: '2.5rem' }}>{component.icon}</div>
                      <div>
                        <h4 className="font-bold">{component.name}</h4>
                        <div className="text-2xl font-bold" style={{ color: getScoreColor(component.score) }}>
                          {component.score}
                          <span className="text-sm font-normal text-gray">/{component.maxScore}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: '#667eea' }}>
                        {component.percentage}%
                      </div>
                      <div className="text-gray text-sm">完成度</div>
                    </div>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    background: '#f0f0f0', 
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        height: '100%',
                        width: `${component.percentage}%`,
                        background: component.percentage >= 90 ? '#52c41a' : component.percentage >= 70 ? '#1890ff' : component.percentage >= 50 ? '#faad14' : '#ef4444',
                        borderRadius: '5px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card mb-6">
            <div className="card-header flex-between">
              <h3 className="font-bold">提升信用分建议</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2" style={{ gap: '1rem' }}>
                {[
                  { icon: '💳', title: '按时支付租金', desc: '按时支付房租可获得额外信用分奖励', reward: '+5分/次' },
                  { icon: '✅', title: '完成实名认证', desc: '完善身份信息和实名认证', reward: '+15分' },
                  { icon: '⭐', title: '积极评价互动', desc: '及时对房东/房源进行评价', reward: '+3-8分' },
                  { icon: '📋', title: '完善房源信息', desc: '发布真实完整的房源信息', reward: '+5-20分' },
                  { icon: '🤝', title: '保持良好履约', desc: '避免违约记录，按时履行合同', reward: '+10-30分' },
                  { icon: '🔗', title: '关联第三方信用', desc: '连接芝麻信用等第三方信用', reward: '+20-50分' }
                ].map((tip, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    padding: '1rem', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ fontSize: '2rem' }}>{tip.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <h5 className="font-bold">{tip.title}</h5>
                        <span className="text-sm" style={{ color: '#52c41a' }}>{tip.reward}</span>
                      </div>
                      <p className="text-gray text-sm mt-1">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex-between">
              <h3 className="font-bold">第三方信用关联</h3>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between" style={{ 
                padding: '1rem', 
                border: '1px solid #e8e8e8', 
                borderRadius: '8px' 
              }}>
                <div className="flex items-center gap-3">
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    background: '#1677ff', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}>
                    芝
                  </div>
                  <div>
                    <h5 className="font-bold">芝麻信用</h5>
                    <p className="text-gray text-sm">关联芝麻信用分，快速提升平台信用等级</p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleConnectZhima}>
                  🔗 立即关联
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privileges' && (
        <div>
          <div className="grid grid-2 mb-6" style={{ gap: '1.5rem' }}>
            {creditData?.privileges?.map((privilege, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      flexShrink: 0
                    }}>
                      {privilege.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex-between">
                        <h4 className="font-bold">{privilege.name}</h4>
                        <span className="text-xl font-bold" style={{ color: '#52c41a' }}>
                          {privilege.value}
                        </span>
                      </div>
                      <p className="text-gray text-sm mt-2">{privilege.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-bold">权益等级说明</h3>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>信用等级</th>
                    <th>分数区间</th>
                    <th>免押额度</th>
                    <th>服务折扣</th>
                    <th>优先匹配</th>
                    <th>快速审核</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { level: '极差', range: '350-500', deposit: '¥0', discount: '原价', match: '否', fast: '否' },
                    { level: '较差', range: '500-600', deposit: '¥1,000', discount: '9.5折', match: '否', fast: '否' },
                    { level: '中等', range: '600-700', deposit: '¥5,000', discount: '9.2折', match: '部分', fast: '否' },
                    { level: '良好', range: '700-800', deposit: '¥10,000', discount: '9折', match: '是', fast: '是' },
                    { level: '优秀', range: '800-900', deposit: '¥30,000', discount: '8折', match: '优先', fast: '优先' }
                  ].map((row, i) => (
                    <tr key={i} style={{ 
                      background: creditData?.level === row.level ? '#f0f7ff' : 'white' 
                    }}>
                      <td>
                        <span className={`badge ${
                          row.level === '极差' ? 'badge-danger' :
                          row.level === '较差' ? 'badge-warning' :
                          row.level === '中等' ? 'badge-info' :
                          row.level === '良好' ? 'badge-success' : ''
                        }`}>
                          {row.level}
                        </span>
                        {creditData?.level === row.level && (
                          <span className="text-xs text-primary ml-2">← 当前等级</span>
                        )}
                      </td>
                      <td>{row.range}</td>
                      <td style={{ color: '#52c41a', fontWeight: 'bold' }}>{row.deposit}</td>
                      <td>{row.discount}</td>
                      <td>{row.match}</td>
                      <td>{row.fast}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">信用分变更记录</h3>
          </div>
          <div className="card-body">
            {creditData?.history?.length === 0 ? (
              <div className="text-center text-gray" style={{ padding: '3rem' }}>
                暂无变更记录
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>变更类型</th>
                    <th>变更分数</th>
                    <th>原因</th>
                    <th>关联合同</th>
                  </tr>
                </thead>
                <tbody>
                  {creditData?.history?.map((record, i) => (
                    <tr key={i}>
                      <td>{record.date}</td>
                      <td>
                        <span className={`badge ${record.type === 'increase' ? 'badge-success' : 'badge-danger'}`}>
                          {record.type === 'increase' ? '加分' : '扣分'}
                        </span>
                      </td>
                      <td style={{ 
                        color: record.type === 'increase' ? '#52c41a' : '#ef4444', 
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {record.type === 'increase' ? '+' : '-'}{record.amount}
                      </td>
                      <td>{record.reason}</td>
                      <td className="text-gray">{record.contract || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCenter;
