import React, { useState, useEffect } from 'react';
import { hrisAPI } from '../services/api.js';

function HRISIntegration() {
  const [integrations, setIntegrations] = useState([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [config, setConfig] = useState({ api_key: '', api_url: '' });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});

  const providers = [
    { id: 'sap_successfactors', name: 'SAP SuccessFactors', icon: '🏢', desc: '企业级人力资本管理系统' },
    { id: 'beisen', name: '北森', icon: '🌟', desc: '一体化HR SaaS平台' },
    { id: 'workday', name: 'Workday', icon: '☀️', desc: '云端财务管理和人力资源系统' },
    { id: 'dingtalk', name: '钉钉智能人事', icon: '🔔', desc: '钉钉一体化HR解决方案' },
    { id: 'feishu', name: '飞书People', icon: '📝', desc: '飞书人力资源管理系统' },
    { id: 'wecom', name: '企业微信HR', icon: '💬', desc: '企业微信人事管理' }
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const res = await hrisAPI.getIntegrations();
      setIntegrations(res.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (providerId) => {
    return integrations.some(i => i.provider === providerId && i.sync_status === 'connected');
  };

  const getIntegration = (providerId) => {
    return integrations.find(i => i.provider === providerId);
  };

  const handleConnect = async () => {
    try {
      await hrisAPI.connect({
        provider: selectedProvider.id,
        api_key: config.api_key,
        api_url: config.api_url
      });
      setShowConnectModal(false);
      setConfig({ api_key: '', api_url: '' });
      setSelectedProvider(null);
      loadIntegrations();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleSync = async (providerId) => {
    setSyncing({ ...syncing, [providerId]: true });
    try {
      await hrisAPI.sync(providerId);
      setTimeout(() => {
        loadIntegrations();
        setSyncing({ ...syncing, [providerId]: false });
      }, 2000);
    } catch (error) {
      console.error('Failed to sync:', error);
      setSyncing({ ...syncing, [providerId]: false });
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>🔗 HRIS系统对接</h1>
        <p>与主流HR系统无缝集成，实现数据双向同步</p>
      </div>

      <div className="card">
        <div className="card-title">支持的HRIS系统</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {providers.map(provider => {
            const connected = isConnected(provider.id);
            const integration = getIntegration(provider.id);
            
            return (
              <div 
                key={provider.id}
                className={`hris-card ${connected ? 'connected' : ''}`}
                onClick={() => !connected && setSelectedProvider(provider) || setShowConnectModal(true)}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{provider.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{provider.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>{provider.desc}</div>
                
                {connected ? (
                  <div>
                    <span className="badge badge-published">已连接</span>
                    <div style={{ marginTop: '12px' }}>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.stopPropagation(); handleSync(provider.id); }}
                        disabled={syncing[provider.id]}
                      >
                        {syncing[provider.id] ? '⏳ 同步中...' : '🔄 立即同步'}
                      </button>
                    </div>
                    {integration?.last_sync_at && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                        上次同步：{new Date(integration.last_sync_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-sm btn-secondary">
                    🔌 点击连接
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showConnectModal && selectedProvider && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', margin: 0 }}>
            <div className="card-title">
              连接 {selectedProvider.name}
            </div>
            
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="text"
                className="form-input"
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="请输入API密钥"
              />
            </div>

            <div className="form-group">
              <label className="form-label">API URL</label>
              <input
                type="text"
                className="form-input"
                value={config.api_url}
                onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowConnectModal(false);
                  setSelectedProvider(null);
                  setConfig({ api_key: '', api_url: '' });
                }}
              >
                取消
              </button>
              <button 
                className="btn btn-success"
                onClick={handleConnect}
                disabled={!config.api_key}
              >
                🔗 连接
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">同步能力说明</div>
        <div className="grid-2">
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📥 组织架构同步</div>
              <div style={{ fontSize: '12px', color: '#666' }}>自动同步部门、岗位、职级信息</div>
            </div>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>👤 员工数据同步</div>
              <div style={{ fontSize: '12px', color: '#666' }}>员工档案、入职信息双向同步</div>
            </div>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📋 招聘流程同步</div>
              <div style={{ fontSize: '12px', color: '#666' }}>面试、录用、入职流程对接</div>
            </div>
          </div>
          <div className="channel-card">
            <div>
              <div style={{ fontWeight: 600 }}>📊 报表数据同步</div>
              <div style={{ fontSize: '12px', color: '#666' }}>招聘数据、人力成本分析报表</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HRISIntegration;
