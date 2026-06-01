import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { devicesApi } from '../api';

const LIFECYCLE_CONFIG: Record<string, { label: string; color: string; bg: string; spin?: boolean }> = {
  pending: { label: '待配网', color: '#92400e', bg: '#fef3c7' },
  online: { label: '在线', color: '#065f46', bg: '#d1fae5' },
  offline: { label: '离线', color: '#991b1b', bg: '#fee2e2' },
  rebooting: { label: '重启中', color: '#1e40af', bg: '#dbeafe', spin: true },
  upgrading: { label: '升级中', color: '#5b21b6', bg: '#ede9fe', spin: true },
};

const TYPE_ICONS: Record<string, string> = {
  light: '💡',
  ac: '❄️',
  sensor: '🌡️',
  switch: '🔌',
  other: '📱',
};

const PROTOCOLS = ['matter', 'thread', 'miot', 'zigbee', 'wifi'];

const PROTOCOL_LABELS: Record<string, string> = {
  matter: 'Matter',
  thread: 'Thread',
  miot: 'MIoT',
  zigbee: 'Zigbee',
  wifi: 'Wi-Fi',
};

function formatLastSeen(lastSeen: string | undefined) {
  if (!lastSeen) return '未知';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'light',
    manufacturer: '',
    model: '',
    protocol: 'matter',
    firmware_version: '',
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadDevices();
    if (searchParams.get('action') === 'discover') {
      handleDiscover();
    }
  }, []);

  const loadDevices = async () => {
    try {
      const response = await devicesApi.getDevices();
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    setShowDiscover(true);
    try {
      const response = await devicesApi.discover();
      setDiscoveredDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to discover devices:', error);
    }
  };

  const handleAddAndOnboard = async (device: any) => {
    try {
      const res = await devicesApi.createDevice(device);
      const createdId = res.data?.id || res.data?._id;
      if (createdId) {
        await devicesApi.onboard(createdId);
      }
      setShowDiscover(false);
      setDiscoveredDevices([]);
      loadDevices();
    } catch (error) {
      console.error('Failed to add and onboard device:', error);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await devicesApi.createDevice(newDevice);
      setShowAddModal(false);
      setNewDevice({ name: '', type: 'light', manufacturer: '', model: '', protocol: 'matter', firmware_version: '' });
      loadDevices();
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  const handleOnboard = async (id: string) => {
    try {
      await devicesApi.onboard(id);
      loadDevices();
    } catch (error) {
      console.error('Failed to onboard device:', error);
    }
  };

  const handleTurnOn = async (id: string) => {
    try {
      await devicesApi.sendCommand(id, 'turn_on', {});
      loadDevices();
    } catch (error) {
      console.error('Failed to turn on device:', error);
    }
  };

  const handleTurnOff = async (id: string) => {
    try {
      await devicesApi.sendCommand(id, 'turn_off', {});
      loadDevices();
    } catch (error) {
      console.error('Failed to turn off device:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    return TYPE_ICONS[type] || TYPE_ICONS.other;
  };

  const getLifecycleConfig = (status: string) => {
    return LIFECYCLE_CONFIG[status] || LIFECYCLE_CONFIG.offline;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.lifecycle_status === 'online').length;
  const offlineCount = devices.filter(d => d.lifecycle_status === 'offline').length;
  const pendingCount = devices.filter(d => d.lifecycle_status === 'pending').length;

  const renderLifecycleBadge = (status: string) => {
    const config = getLifecycleConfig(status);
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          fontSize: '12px',
          fontWeight: 500,
          borderRadius: '12px',
          color: config.color,
          background: config.bg,
        }}
      >
        {config.spin && (
          <span
            style={{
              width: '12px',
              height: '12px',
              border: `2px solid ${config.bg}`,
              borderTopColor: config.color,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }}
          />
        )}
        {config.label}
      </span>
    );
  };

  const renderDeviceActions = (device: any) => {
    const status = device.lifecycle_status || 'offline';
    switch (status) {
      case 'pending':
        return (
          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleOnboard(device.id); }}>
            配网
          </button>
        );
      case 'online':
        return (
          <>
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/devices/${device.id}?tab=control`); }}>
              远程控制
            </button>
            <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleTurnOff(device.id); }}>
              关机
            </button>
          </>
        );
      case 'offline':
        return (
          <>
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleTurnOn(device.id); }}>
              开机
            </button>
            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/devices/${device.id}`); }}>
              查看详情
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">设备管理</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleDiscover}>
            🔍 发现设备
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ 添加设备
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--gray-500)' }}>
        共 {totalCount} 台设备 · {onlineCount} 台在线 · {offlineCount} 台离线 · {pendingCount} 台待配网
      </div>

      {showDiscover && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">发现的设备</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => { setShowDiscover(false); setDiscoveredDevices([]); }}>
              关闭
            </button>
          </div>
          <div className="card-body">
            {discoveredDevices.length === 0 ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="grid grid-3">
                {discoveredDevices.map((device) => (
                  <div key={device.id} className="device-card">
                    <div className="device-header">
                      <div className={`device-icon ${device.type || 'default'}`}>
                        {getDeviceIcon(device.type)}
                      </div>
                    </div>
                    <div className="device-name">{device.name}</div>
                    <div className="device-type">{device.manufacturer} · {device.model}</div>
                    <div className="device-control">
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddAndOnboard(device)}>
                        添加并配网
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <div className="empty-title">暂无设备</div>
              <div className="empty-description">点击"发现设备"或"添加设备"开始添加您的智能设备</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {devices.map((device) => (
            <div key={device.id} className={`device-card ${device.online ? 'online' : 'offline'}`}>
              <div className="device-header">
                <div className={`device-icon ${device.type || 'default'}`}>
                  {getDeviceIcon(device.type)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderLifecycleBadge(device.lifecycle_status)}
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: device.online ? 'var(--primary)' : 'var(--gray-400)',
                      display: 'inline-block',
                    }}
                  />
                </div>
              </div>
              <div className="device-name">{device.name}</div>
              <div className="device-type">{device.manufacturer} · {device.model}</div>
              <div className="device-stats" style={{ marginBottom: '4px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-600)',
                  }}
                >
                  {PROTOCOL_LABELS[device.protocol] || device.protocol?.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  固件: {device.firmware_version || '未安装'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '8px' }}>
                最后在线: {formatLastSeen(device.last_seen)}
              </div>
              <div className="device-control">
                {renderDeviceActions(device)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加设备</h3>
            </div>
            <form onSubmit={handleCreateDevice}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">设备名称</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="请输入设备名称"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">设备类型</label>
                  <select
                    className="form-input"
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                  >
                    <option value="light">智能灯</option>
                    <option value="ac">空调</option>
                    <option value="sensor">传感器</option>
                    <option value="switch">开关</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">厂商</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDevice.manufacturer}
                    onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
                    placeholder="请输入厂商名称"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">型号</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    placeholder="请输入型号"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">协议</label>
                  <select
                    className="form-input"
                    value={newDevice.protocol}
                    onChange={(e) => setNewDevice({ ...newDevice, protocol: e.target.value })}
                  >
                    {PROTOCOLS.map((p) => (
                      <option key={p} value={p}>{PROTOCOL_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">固件版本</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newDevice.firmware_version}
                    onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                    placeholder="请输入固件版本（可选）"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
