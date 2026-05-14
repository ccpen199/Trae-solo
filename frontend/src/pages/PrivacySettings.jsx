import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/request';

function PrivacySettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    privateAccount: false,
    allowMessage: true,
    allowMomentView: true,
    showOnlineStatus: true,
    allowFriendRecommend: true
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    showToast('设置已更新');
  };

  const Toggle = ({ enabled, onChange }) => (
    <div
      onClick={onChange}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        background: enabled ? '#f5222d' : '#e0e0e0',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: enabled ? 24 : 2,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s'
        }}
      />
    </div>
  );

  const settingItems = [
    {
      key: 'privateAccount',
      icon: '🔒',
      title: '私密账号',
      desc: '开启后只有你批准的人才能关注你并查看你的随拍'
    },
    {
      key: 'allowMessage',
      icon: '💬',
      title: '谁可以给我发消息',
      desc: '所有人',
      hasToggle: true
    },
    {
      key: 'allowMomentView',
      icon: '📷',
      title: '谁可以查看我的随拍',
      desc: '所有人',
      hasToggle: true
    },
    {
      key: 'showOnlineStatus',
      icon: '🟢',
      title: '展示在线状态',
      desc: '关闭后他人将看不到你的在线状态',
      hasToggle: true
    },
    {
      key: 'allowFriendRecommend',
      icon: '👥',
      title: '允许将我推荐给好友',
      desc: '关闭后你将不会出现在好友推荐列表中',
      hasToggle: true
    }
  ];

  return (
    <div className="page">
      <div className="header">
        <div className="header-back" onClick={() => navigate(-1)}>←</div>
        <div className="header-title">隐私设置</div>
      </div>

      <div style={{ padding: '16px 0' }}>
        {settingItems.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 16px',
              borderBottom: '1px solid var(--border)',
              background: '#fff'
            }}
          >
            <span style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {item.desc}
              </div>
            </div>
            {item.hasToggle && (
              <Toggle
                enabled={settings[item.key]}
                onChange={() => toggleSetting(item.key)}
              />
            )}
            {!item.hasToggle && (
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>→</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: 16, marginTop: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>更多设置</div>
        <div
          style={{
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 8,
            marginBottom: 8,
            cursor: 'pointer'
          }}
          onClick={() => showToast('黑名单功能开发中')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>黑名单管理</span>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 8,
            cursor: 'pointer'
          }}
          onClick={() => showToast('隐私政策')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>隐私政策</span>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacySettings;
