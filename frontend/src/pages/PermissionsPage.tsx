import React, { useEffect, useState } from 'react';
import { permissionsApi, devicesApi } from '../api';

export default function PermissionsPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [shareForm, setShareForm] = useState({ username: '', access_level: 'viewer' });
  const [tempForm, setTempForm] = useState({ expires_in_minutes: 60 });
  const [tempCode, setTempCode] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadPermissions();
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const response = await devicesApi.getDevices();
      setDevices(response.data);
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    if (!selectedDevice) return;
    try {
      const response = await permissionsApi.getDevicePermissions(selectedDevice);
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await permissionsApi.shareDevice(selectedDevice, shareForm.username, shareForm.access_level);
      setShowShareModal(false);
      setShareForm({ username: '', access_level: 'viewer' });
      loadPermissions();
    } catch (error: any) {
      alert(error.response?.data?.error || '分享失败');
    }
  };

  const handleCreateTempAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      const response = await permissionsApi.createTemporaryAccess(selectedDevice, tempForm.expires_in_minutes);
      setTempCode(response.data.code);
    } catch (error) {
      console.error('Failed to create temp access:', error);
    }
  };

  const handleRemovePermission = async (userId: string) => {
    if (!selectedDevice) return;
    if (!confirm('确定移除该用户的权限？')) return;
    try {
      await permissionsApi.removePermission(selectedDevice, userId);
      loadPermissions();
    } catch (error) {
      console.error('Failed to remove permission:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">权限管理</h2>
      </div>

      {devices.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">🔐</div>
              <div className="empty-title">暂无设备</div>
              <div className="empty-description">请先添加设备后再进行权限管理</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">选择设备</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gap: '8px' }}>
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      style={{
                        padding: '12px',
                        background: selectedDevice === device.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--gray-50)',
                        border: selectedDevice === device.id ? '1px solid var(--primary)' : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedDevice(device.id)}
                    >
                      <div style={{ fontWeight: '500' }}>{device.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{device.manufacturer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">共享权限</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowTempModal(true)}>
                    临时访问
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowShareModal(true)}>
                    分享设备
                  </button>
                </div>
              </div>
              <div className="card-body">
                {permissions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <div className="empty-icon" style={{ fontSize: '32px' }}>👥</div>
                    <div className="empty-title" style={{ fontSize: '14px' }}>暂无共享</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {permissions.map((perm) => (
                      <div
                        key={perm.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'var(--gray-50)',
                          borderRadius: '8px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500' }}>{perm.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                            {perm.access_level === 'owner' ? '所有者' : perm.access_level === 'admin' ? '管理员' : '查看者'}
                          </div>
                        </div>
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemovePermission(perm.user_id)}>
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">分享设备</h3>
            </div>
            <form onSubmit={handleShare}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={shareForm.username}
                    onChange={(e) => setShareForm({ ...shareForm, username: e.target.value })}
                    placeholder="输入要分享的用户名"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">权限级别</label>
                  <select
                    className="form-input"
                    value={shareForm.access_level}
                    onChange={(e) => setShareForm({ ...shareForm, access_level: e.target.value })}
                  >
                    <option value="viewer">查看者</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">分享</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTempModal && (
        <div className="modal-overlay" onClick={() => { setShowTempModal(false); setTempCode(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">生成临时访问码</h3>
            </div>
            {tempCode ? (
              <div className="modal-body">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '12px' }}>访问码</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '4px', fontFamily: 'monospace' }}>{tempCode}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '12px' }}>有效期 {tempForm.expires_in_minutes} 分钟</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTempAccess}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">有效期（分钟）</label>
                    <input
                      type="number"
                      className="form-input"
                      value={tempForm.expires_in_minutes}
                      onChange={(e) => setTempForm({ ...tempForm, expires_in_minutes: parseInt(e.target.value) })}
                      min={5}
                      max={1440}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTempModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">生成</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
