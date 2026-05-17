import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/client';

const MOCK_USER_ID = 'user_001';

function MyPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [profile, setProfile] = useState({
    nickname: '海龟达人',
    gender: '保密',
    birthday: '未设置',
    region: '未设置',
    bio: '这个人很懒，什么都没留下...'
  });

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(MOCK_USER_ID);
      setUser(response.data);
    } catch (err) {
      console.error('Get user info error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleEditClick = (field, value) => {
    setEditingField(field);
    setEditValue(value === '未设置' ? '' : value);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const fieldMap = {
      '昵称': 'nickname',
      '性别': 'gender',
      '生日': 'birthday',
      '地区': 'region',
      '个人简介': 'bio'
    };
    const key = fieldMap[editingField];
    if (key) {
      setProfile(prev => ({
        ...prev,
        [key]: editValue || '未设置'
      }));
    }
    setShowEditModal(false);
    setEditingField(null);
    setEditValue('');
  };

  const gameStats = [
    { label: '游戏场次', value: 28, icon: '🎮' },
    { label: '猜对次数', value: 12, icon: '✅' },
    { label: '创作故事', value: 5, icon: '📝' },
    { label: '关注好友', value: 16, icon: '👥' },
  ];

  const recentGames = [
    { id: 1, title: '海上命案', result: '猜对', time: '2小时前', points: '+50' },
    { id: 2, title: '半夜敲门声', result: '参与', time: '昨天', points: '+20' },
    { id: 3, title: '水草', result: '猜对', time: '3天前', points: '+80' },
    { id: 4, title: '葬礼上的妹妹', result: '参与', time: '1周前', points: '+20' },
  ];

  const achievements = [
    { id: 1, name: '初出茅庐', desc: '完成第一局游戏', icon: '🌱', unlocked: true },
    { id: 2, name: '推理达人', desc: '累计猜对10个故事', icon: '🏆', unlocked: true },
    { id: 3, name: '故事大师', desc: '创作5个故事', icon: '✍️', unlocked: true },
    { id: 4, name: '社交蝴蝶', desc: '关注20位好友', icon: '🦋', unlocked: false },
    { id: 5, name: '常胜将军', desc: '连续猜对5个故事', icon: '👑', unlocked: false },
    { id: 6, name: '资深玩家', desc: '累计游戏100场', icon: '🎖️', unlocked: false },
  ];

  const settings = [
    { label: '账号安全', icon: '🔐', route: '/settings/security' },
    { label: '通知设置', icon: '🔔', route: '/settings/notifications' },
    { label: '隐私设置', icon: '🛡️', route: '/settings/privacy' },
    { label: '音效设置', icon: '🔊', route: '/settings/sound' },
    { label: '意见反馈', icon: '💬', route: '/settings/feedback' },
    { label: '关于我们', icon: 'ℹ️', route: '/settings/about' },
  ];

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px 30px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          margin: '0 auto 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          border: '3px solid rgba(255,255,255,0.3)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          {user?.nickname?.charAt(0) || '?'}
        </div>
        <h2 style={{ color: '#fff', marginBottom: '5px', fontSize: '22px' }}>
          {user?.nickname || '玩家'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '15px' }}>
          ID: {user?.id || 'user_001'}
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 20px',
          borderRadius: '20px'
        }}>
          <span style={{ fontSize: '18px' }}>⭐</span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
            {user?.points || 1500}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>积分</span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {gameStats.map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '15px 10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          {[
            { key: 'profile', label: '个人资料' },
            { key: 'history', label: '游戏记录' },
            { key: 'achievements', label: '成就' },
            { key: 'settings', label: '设置' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '10px',
                background: activeTab === tab.key 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'transparent',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
              个人资料
            </h3>
            {[
              { label: '昵称', value: profile.nickname, editable: true },
              { label: '性别', value: profile.gender, editable: true },
              { label: '生日', value: profile.birthday, editable: true },
              { label: '地区', value: profile.region, editable: true },
              { label: '个人简介', value: profile.bio, editable: true },
            ].map((item, index) => (
              <div 
                key={index} 
                onClick={() => item.editable && handleEditClick(item.label, item.value)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 0',
                  borderBottom: index < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  cursor: item.editable ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  borderRadius: '8px',
                  paddingLeft: '10px',
                  paddingRight: '10px',
                  marginLeft: '-10px',
                  marginRight: '-10px'
                }}
                onMouseEnter={(e) => {
                  if (item.editable) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>
                  {item.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#fff', fontSize: '15px' }}>{item.value}</span>
                  {item.editable && (
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>
                      ›
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showEditModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowEditModal(false)}>
            <div style={{
              background: '#1e1e2e',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px', textAlign: 'center' }}>
                编辑{editingField}
              </h3>
              
              {editingField === '性别' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['男', '女', '保密'].map(option => (
                    <button
                      key={option}
                      onClick={() => { setEditValue(option); handleSaveEdit(); }}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: editValue === option ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: '15px',
                        cursor: 'pointer'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : editingField === '生日' ? (
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <input
                    type="date"
                    value={editValue === '未设置' ? '' : editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    📅
                  </div>
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '12px',
                    marginTop: '8px',
                    textAlign: 'center'
                  }}>
                    点击输入框右侧的日历图标选择日期
                  </p>
                </div>) : editingField === '个人简介' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="请输入个人简介..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    marginBottom: '20px',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`请输入${editingField}...`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    marginBottom: '20px'
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingField(null);
                    setEditValue('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                {editingField !== '性别' && (
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontSize: '15px',
                      cursor: 'pointer'
                    }}
                  >
                    保存
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
              游戏记录
            </h3>
            {recentGames.map((game, index) => (
              <div key={game.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 0',
                borderBottom: index < recentGames.length - 1 
                  ? '1px solid rgba(255,255,255,0.1)' 
                  : 'none'
              }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '15px', marginBottom: '4px' }}>
                    {game.title}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    {game.time}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    color: game.result === '猜对' ? '#4ade80' : '#fbbf24',
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {game.result}
                  </div>
                  <div style={{
                    color: game.points.startsWith('+') ? '#4ade80' : '#f87171',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {game.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
              成就徽章 ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '15px'
            }}>
              {achievements.map(achievement => (
                <div key={achievement.id} style={{
                  textAlign: 'center',
                  padding: '15px 10px',
                  background: achievement.unlocked 
                    ? 'rgba(102, 126, 234, 0.3)' 
                    : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  opacity: achievement.unlocked ? 1 : 0.5
                }}>
                  <div style={{ 
                    fontSize: '32px', 
                    marginBottom: '8px',
                    filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ 
                    color: '#fff', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: '11px',
                    lineHeight: '1.3'
                  }}>
                    {achievement.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>
              设置
            </h3>
            {settings.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 0',
                borderBottom: index < settings.length - 1 
                  ? '1px solid rgba(255,255,255,0.1)' 
                  : 'none',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ color: '#fff', fontSize: '15px' }}>{item.label}</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                  ›
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;
