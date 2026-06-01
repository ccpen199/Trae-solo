import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, devicesApi, permissionsApi, scenesApi } from '../api';

interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  online: boolean;
  status: string;
}

interface AdminStats {
  total_users: number;
  total_scenes: number;
  active_alerts: number;
  operations_24h: number;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
}

interface Log {
  id: string;
  action: string;
  module: string;
  user: string;
  created_at: string;
}

interface SharedDevice {
  device_id: string;
  device_name: string;
  access_level: string;
  shared_by: string;
}

interface TempCode {
  code: string;
  device_id: string;
  device_name: string;
  expires_at: number;
}

type UserRole = 'admin' | 'platform' | 'ops' | 'user' | 'viewer' | 'guest';

const LIFECYCLE_STATUS_MAP: Record<string, { label: string; badge: string }> = {
  pending: { label: '待配网', badge: 'pending' },
  online: { label: '在线', badge: 'online' },
  offline: { label: '离线', badge: 'offline' },
  rebooting: { label: '重启中', badge: 'pending' },
  upgrading: { label: '升级中', badge: 'pending' },
};

function getRole(): UserRole {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'guest';
    const user = JSON.parse(raw);
    return user.role || 'guest';
  } catch {
    return 'guest';
  }
}

function isPrivileged(role: UserRole): boolean {
  return role === 'admin' || role === 'platform' || role === 'ops';
}

function isViewOnly(role: UserRole): boolean {
  return role === 'viewer' || role === 'guest';
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [sharedDevices, setSharedDevices] = useState<SharedDevice[]>([]);
  const [tempCodes, setTempCodes] = useState<TempCode[]>([]);
  const [scenesCount, setScenesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const role = getRole();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const devicesRes = await devicesApi.getDevices();
      const deviceList: Device[] = devicesRes.data;
      setDevices(deviceList);

      if (isPrivileged(role)) {
        const [statsRes, alertsRes, logsRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getAlerts(),
          adminApi.getOperationLogs(),
        ]);
        if (statsRes.status === 'fulfilled') setAdminStats(statsRes.value.data);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.slice(0, 5));
        if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.slice(0, 5));
      } else if (!isViewOnly(role)) {
        const [meRes, scenesRes] = await Promise.allSettled([
          permissionsApi.getMe(),
          scenesApi.getScenes(),
        ]);
        if (meRes.status === 'fulfilled') {
          const me = meRes.value.data;
          setSharedDevices(me.shared_devices || []);
          setTempCodes(me.temp_codes || []);
        }
        if (scenesRes.status === 'fulfilled') {
          setScenesCount(scenesRes.value.data.length);
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.online).length;
  const offlineDevices = devices.filter((d) => !d.online && d.status !== 'pending').length;
  const pendingDevices = devices.filter((d) => d.status === 'pending').length;

  const statCards = [
    { label: '设备总数', value: totalDevices, color: 'primary', icon: '📱' },
    { label: '在线设备', value: onlineDevices, color: 'secondary', icon: '🟢' },
    { label: '离线设备', value: offlineDevices, color: 'warning', icon: '🔴' },
    { label: '待配网', value: pendingDevices, color: 'danger', icon: '⏳' },
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'light': return '💡';
      case 'ac': return '❄️';
      case 'sensor': return '🌡️';
      case 'switch': return '🔌';
      default: return '📱';
    }
  };

  const getLifecycleBadge = (device: Device) => {
    const status = device.online ? 'online' : (device.status || 'offline');
    const mapped = LIFECYCLE_STATUS_MAP[status] || LIFECYCLE_STATUS_MAP.offline;
    return mapped;
  };

  const quickActions = isViewOnly(role)
    ? [
        { label: '查看设备列表', icon: '📱', action: () => navigate('/devices') },
        { label: '查看场景', icon: '🎬', action: () => navigate('/scenes') },
      ]
    : [
        { label: '发现新设备', icon: '🔍', action: () => navigate('/devices?action=discover') },
        { label: '创建自动化场景', icon: '➕', action: () => navigate('/scenes?action=create') },
        { label: '分享设备给家人', icon: '🔗', action: () => navigate('/permissions?action=share') },
        { label: '配网设备', icon: '📡', action: () => navigate('/devices?action=onboard') },
        ...(isPrivileged(role) ? [{ label: '查看系统状态', icon: '⚙️', action: () => navigate('/admin') }] : []),
      ];

  const formatTime = (t: string) => {
    if (!t) return '-';
    return new Date(t).toLocaleString('zh-CN');
  };

  const renderDeviceOverview = () => (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">设备概览</h3>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/devices')}>查看全部</button>
      </div>
      <div className="card-body">
        {devices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <div className="empty-title">暂无设备</div>
            <div className="empty-description">
              {isViewOnly(role) ? '当前无可查看的设备' : '点击「发现新设备」添加您的第一个设备'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {devices.slice(0, 8).map((device) => {
              const lifecycle = getLifecycleBadge(device);
              return (
                <div
                  key={device.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/devices/${device.id}`)}
                >
                  <div className={`device-icon ${device.type || 'default'}`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{device.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{device.manufacturer || '-'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: device.online ? 'var(--primary)' : 'var(--gray-400)',
                      }}
                    />
                    <span className={`badge badge-${lifecycle.badge}`}>
                      {lifecycle.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">快速操作</h3>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gap: '12px' }}>
          {quickActions.map((item, idx) => (
            <button
              key={idx}
              className={`btn ${idx === 0 && !isViewOnly(role) ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', gap: '12px' }}
              onClick={item.action}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdminSection = () => (
    <div className="grid grid-2" style={{ marginTop: '24px' }}>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">告警摘要</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin')}>查看全部</button>
        </div>
        <div className="card-body">
          {alerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-title">暂无告警</div>
              <div className="empty-description">系统运行正常</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.severity || 'warning'}`}>
                  <div className="alert-header">
                    <span className="alert-type">{alert.type}</span>
                    <span className="alert-time">{formatTime(alert.created_at)}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">最近操作</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin')}>查看全部</button>
        </div>
        <div className="card-body">
          {logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-title">暂无操作记录</div>
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <div key={log.id} className="log-item">
                  <div className="log-header">
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{log.action}</span>
                    <span className="alert-time">{formatTime(log.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                    {log.module} · {log.user}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUserSection = () => (
    <div className="grid grid-2" style={{ marginTop: '24px' }}>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">共享给我的设备</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/permissions')}>管理权限</button>
        </div>
        <div className="card-body">
          {sharedDevices.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-title">暂无共享设备</div>
              <div className="empty-description">其他用户分享的设备将在此显示</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {sharedDevices.map((item) => (
                <div
                  key={item.device_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/devices/${item.device_id}`)}
                >
                  <div className="device-icon default">📱</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.device_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>来自 {item.shared_by}</div>
                  </div>
                  <span className="badge badge-online">{item.access_level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">我的临时码</h3>
        </div>
        <div className="card-body">
          {tempCodes.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-title">暂无临时码</div>
              <div className="empty-description">在权限管理中可创建临时访问码</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {tempCodes.map((item) => (
                <div
                  key={item.code}
                  style={{
                    padding: '12px',
                    background: 'var(--gray-50)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px', fontFamily: 'monospace' }}>{item.code}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{item.device_name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>有效期至</div>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>
                        {new Date(item.expires_at * 1000).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderViewerSection = () => (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="card-body">
        <div className="empty-state" style={{ padding: '30px 20px' }}>
          <div className="empty-icon">👁️</div>
          <div className="empty-title">访客模式</div>
          <div className="empty-description">您当前为只读权限，仅可查看设备和场景信息</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
              <div style={{ fontSize: '32px' }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {isPrivileged(role) && adminStats && (
        <div className="grid grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card primary">
            <div className="stat-value">{adminStats.total_users}</div>
            <div className="stat-label">用户总数</div>
          </div>
          <div className="stat-card secondary">
            <div className="stat-value">{adminStats.total_scenes}</div>
            <div className="stat-label">场景总数</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{adminStats.active_alerts}</div>
            <div className="stat-label">活跃告警</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-value">{adminStats.operations_24h}</div>
            <div className="stat-label">24小时操作数</div>
          </div>
        </div>
      )}

      {!isPrivileged(role) && !isViewOnly(role) && scenesCount > 0 && (
        <div className="grid grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card primary">
            <div className="stat-value">{scenesCount}</div>
            <div className="stat-label">我的场景</div>
          </div>
          <div className="stat-card secondary">
            <div className="stat-value">{sharedDevices.length}</div>
            <div className="stat-label">共享设备</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-value">{tempCodes.length}</div>
            <div className="stat-label">临时码</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-value">{pendingDevices}</div>
            <div className="stat-label">待配网</div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {renderDeviceOverview()}
        {renderQuickActions()}
      </div>

      {isPrivileged(role) && renderAdminSection()}
      {!isPrivileged(role) && !isViewOnly(role) && renderUserSection()}
      {isViewOnly(role) && renderViewerSection()}
    </div>
  );
}
