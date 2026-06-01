import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { devicesApi, adminApi } from '../api';

const TAB_KEYS = ['info', 'control', 'firmware', 'alerts', 'logs'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  info: '设备信息',
  control: '远程控制',
  firmware: '固件升级',
  alerts: '连接告警',
  logs: '操作日志',
};

const DEVICE_ICONS: Record<string, string> = {
  light: '💡',
  ac: '❄️',
  sensor: '🌡️',
  switch: '🔌',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  online: { label: '在线', color: '#065f46', bg: '#d1fae5' },
  offline: { label: '离线', color: '#4b5563', bg: '#e5e7eb' },
  pending: { label: '待配网', color: '#92400e', bg: '#fef3c7' },
  rebooting: { label: '重启中', color: '#1e40af', bg: '#dbeafe' },
  upgrading: { label: '升级中', color: '#6b21a8', bg: '#ede9fe' },
};

const AC_MODES = [
  { value: 'cool', label: '制冷' },
  { value: 'heat', label: '制热' },
  { value: 'dehumidify', label: '除湿' },
  { value: 'auto', label: '自动' },
];

const tabFromParam = (param: string | null): TabKey => {
  if (param && TAB_KEYS.includes(param as TabKey)) return param as TabKey;
  return 'info';
};

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [device, setDevice] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [firmwares, setFirmwares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromParam(searchParams.get('tab')));
  const [upgradeStatus, setUpgradeStatus] = useState<string>('');
  const [commandSending, setCommandSending] = useState(false);

  const [controlState, setControlState] = useState<Record<string, any>>({});
  const [customCommand, setCustomCommand] = useState('');
  const [customParams, setCustomParams] = useState('');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getDeviceIcon = (type: string) => DEVICE_ICONS[type] || '📱';

  const getDeviceStatus = (d: any): string => {
    if (d.upgrading) return 'upgrading';
    if (d.rebooting) return 'rebooting';
    if (d.status === 'pending') return 'pending';
    if (d.online) return 'online';
    return 'offline';
  };

  const loadDevice = useCallback(async () => {
    if (!id) return;
    try {
      const [deviceRes, logsRes, alertsRes] = await Promise.all([
        devicesApi.getDevice(id),
        devicesApi.getLogs(id),
        devicesApi.getAlerts(id),
      ]);
      setDevice(deviceRes.data);
      setLogs(logsRes.data);
      setAlerts(alertsRes.data);
      if (deviceRes.data.state) {
        setControlState(deviceRes.data.state);
      }
    } catch (error) {
      console.error('Failed to load device:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadFirmwares = useCallback(async () => {
    if (!device) return;
    try {
      const res = await adminApi.getFirmwares();
      const all = res.data || [];
      setFirmwares(all.filter((f: any) => f.device_type === device.type || !f.device_type));
    } catch (error) {
      console.error('Failed to load firmwares:', error);
    }
  }, [device]);

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

  useEffect(() => {
    if (activeTab === 'firmware' && device) {
      loadFirmwares();
    }
  }, [activeTab, device, loadFirmwares]);

  const sendCommand = async (command: string, params: any = {}) => {
    if (!id) return;
    setCommandSending(true);
    try {
      await devicesApi.sendCommand(id, command, params);
      await loadDevice();
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setCommandSending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'onboard':
        devicesApi.onboard(id!);
        break;
      case 'turn_on':
        sendCommand('turn_on');
        break;
      case 'turn_off':
        sendCommand('turn_off');
        break;
      case 'reboot':
        sendCommand('reboot');
        break;
      case 'refresh':
        sendCommand('refresh');
        break;
    }
  };

  const handleUpgrade = async (firmware: any) => {
    if (!id) return;
    setUpgradeStatus('升级中...');
    try {
      await devicesApi.upgradeFirmware(id, firmware.id, firmware.version);
      setUpgradeStatus('升级指令已发送');
      loadDevice();
    } catch (error) {
      setUpgradeStatus('升级失败');
      console.error('Failed to upgrade firmware:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await adminApi.resolveAlert(alertId);
      loadDevice();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleControlChange = (key: string, value: any) => {
    setControlState((prev) => ({ ...prev, [key]: value }));
  };

  const handleControlCommit = (command: string, params: any) => {
    sendCommand(command, params);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!device) {
    return <div>设备不存在</div>;
  }

  const status = getDeviceStatus(device);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;

  const getQuickActions = () => {
    switch (status) {
      case 'pending':
        return [{ action: 'onboard', label: '配网', variant: 'btn-primary' }];
      case 'offline':
        return [
          { action: 'turn_on', label: '开机', variant: 'btn-primary' },
          { action: 'refresh', label: '刷新状态', variant: 'btn-secondary' },
        ];
      case 'online':
        return [
          { action: 'turn_off', label: '关机', variant: 'btn-danger' },
          { action: 'reboot', label: '重启', variant: 'btn-secondary' },
          { action: 'refresh', label: '刷新状态', variant: 'btn-secondary' },
        ];
      default:
        return [{ action: 'refresh', label: '刷新状态', variant: 'btn-secondary' }];
    }
  };

  const renderStatusPanel = () => (
    <div className="device-status-panel">
      <div className="device-status-panel-left">
        <div className={`device-icon ${device.type || 'default'}`} style={{ width: 56, height: 56, fontSize: 28 }}>
          {getDeviceIcon(device.type)}
        </div>
        <div className="device-status-panel-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{device.name}</h2>
            <span
              className="badge"
              style={{
                backgroundColor: statusCfg.bg,
                color: statusCfg.color,
                fontSize: 13,
                padding: '4px 12px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: statusCfg.color,
                  marginRight: 6,
                }}
              />
              {statusCfg.label}
            </span>
          </div>
          <div className="device-status-panel-meta">
            <span>{device.manufacturer} · {device.model}</span>
            <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: 11, padding: '2px 8px' }}>
              {device.protocol?.toUpperCase()}
            </span>
            <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
              固件 v{device.firmware_version || '-'}
            </span>
            {device.last_seen && (
              <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                最后在线: {formatTime(device.last_seen)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/devices')}>
          ← 返回
        </button>
        {getQuickActions().map((a) => (
          <button
            key={a.action}
            className={`btn ${a.variant}`}
            onClick={() => handleQuickAction(a.action)}
            disabled={commandSending}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderLightControls = () => (
    <div className="control-section">
      <div className="form-group">
        <label className="form-label">电源</label>
        <button
          className={`btn ${controlState.power ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            const next = !controlState.power;
            handleControlChange('power', next);
            handleControlCommit(next ? 'turn_on' : 'turn_off', {});
          }}
          disabled={commandSending}
        >
          {controlState.power ? '关灯' : '开灯'}
        </button>
      </div>
      <div className="form-group">
        <label className="form-label">亮度: {controlState.brightness ?? 0}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={controlState.brightness ?? 0}
          onChange={(e) => handleControlChange('brightness', Number(e.target.value))}
          onMouseUp={() => handleControlCommit('set_brightness', { value: controlState.brightness })}
          onTouchEnd={() => handleControlCommit('set_brightness', { value: controlState.brightness })}
          style={{ width: '100%' }}
        />
      </div>
      <div className="form-group">
        <label className="form-label">色温: {controlState.color_temp ?? 4000}K</label>
        <input
          type="range"
          min={2700}
          max={6500}
          step={100}
          value={controlState.color_temp ?? 4000}
          onChange={(e) => handleControlChange('color_temp', Number(e.target.value))}
          onMouseUp={() => handleControlCommit('set_color_temp', { value: controlState.color_temp })}
          onTouchEnd={() => handleControlCommit('set_color_temp', { value: controlState.color_temp })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)' }}>
          <span>暖光 2700K</span>
          <span>冷光 6500K</span>
        </div>
      </div>
    </div>
  );

  const renderAcControls = () => (
    <div className="control-section">
      <div className="form-group">
        <label className="form-label">电源</label>
        <button
          className={`btn ${controlState.power ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            const next = !controlState.power;
            handleControlChange('power', next);
            handleControlCommit(next ? 'turn_on' : 'turn_off', {});
          }}
          disabled={commandSending}
        >
          {controlState.power ? '关机' : '开机'}
        </button>
      </div>
      <div className="form-group">
        <label className="form-label">温度: {controlState.temperature ?? 24}°C</label>
        <input
          type="range"
          min={16}
          max={30}
          value={controlState.temperature ?? 24}
          onChange={(e) => handleControlChange('temperature', Number(e.target.value))}
          onMouseUp={() => handleControlCommit('set_temperature', { value: controlState.temperature })}
          onTouchEnd={() => handleControlCommit('set_temperature', { value: controlState.temperature })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-500)' }}>
          <span>16°C</span>
          <span>30°C</span>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">模式</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {AC_MODES.map((mode) => (
            <button
              key={mode.value}
              className={`btn ${controlState.mode === mode.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                handleControlChange('mode', mode.value);
                handleControlCommit('set_mode', { value: mode.value });
              }}
              disabled={commandSending}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSensorControls = () => (
    <div className="control-section">
      <div style={{ color: 'var(--gray-500)', marginBottom: 16, fontSize: 14 }}>传感器数据（只读）</div>
      {controlState.values && Object.keys(controlState.values).length > 0 ? (
        <div className="grid grid-3">
          {Object.entries(controlState.values).map(([key, val]) => (
            <div key={key} className="stat-card">
              <div className="stat-value">{String(val)}</div>
              <div className="stat-label">{key}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--gray-500)' }}>暂无传感器数据</div>
      )}
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={() => sendCommand('refresh')} disabled={commandSending}>
          刷新数据
        </button>
      </div>
    </div>
  );

  const renderSwitchControls = () => (
    <div className="control-section">
      <div className="form-group">
        <label className="form-label">电源</label>
        <button
          className={`btn ${controlState.power ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => {
            const next = !controlState.power;
            handleControlChange('power', next);
            handleControlCommit(next ? 'turn_on' : 'turn_off', {});
          }}
          disabled={commandSending}
        >
          {controlState.power ? '关闭' : '开启'}
        </button>
      </div>
    </div>
  );

  const renderGenericControls = () => (
    <div className="control-section">
      <div className="form-group">
        <label className="form-label">自定义指令</label>
        <input
          type="text"
          className="form-input"
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          placeholder="输入指令名称，如 turn_on"
        />
      </div>
      <div className="form-group">
        <label className="form-label">参数 (JSON 格式，可选)</label>
        <textarea
          className="form-input"
          rows={3}
          value={customParams}
          onChange={(e) => setCustomParams(e.target.value)}
          placeholder='例如: {"value": 80}'
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          if (!customCommand) return;
          let params = {};
          if (customParams) {
            try {
              params = JSON.parse(customParams);
            } catch {
              return;
            }
          }
          sendCommand(customCommand, params);
          setCustomCommand('');
          setCustomParams('');
        }}
        disabled={!customCommand || commandSending}
      >
        发送指令
      </button>
    </div>
  );

  const renderControls = () => {
    switch (device.type) {
      case 'light':
        return renderLightControls();
      case 'ac':
        return renderAcControls();
      case 'sensor':
        return renderSensorControls();
      case 'switch':
        return renderSwitchControls();
      default:
        return renderGenericControls();
    }
  };

  const renderInfoTab = () => (
    <div className="card">
      <div className="card-body">
        <div className="grid grid-2">
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>设备 ID</div>
              <div style={{ fontFamily: 'monospace' }}>{device.id}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>设备类型</div>
              <div>{device.type}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>厂商</div>
              <div>{device.manufacturer}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>型号</div>
              <div>{device.model}</div>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>通信协议</div>
              <div>{device.protocol?.toUpperCase()}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>固件版本</div>
              <div>{device.firmware_version || '-'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>添加时间</div>
              <div>{formatTime(device.created_at)}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>访问权限</div>
              <div>{device.access_level}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderControlTab = () => (
    <div className="card">
      <div className="card-body">
        {status !== 'online' && status !== 'rebooting' && status !== 'upgrading' && (
          <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: 8, color: '#92400e', fontSize: 14 }}>
            设备当前{statusCfg.label}，部分控制可能不可用
          </div>
        )}
        {renderControls()}
      </div>
    </div>
  );

  const renderFirmwareTab = () => (
    <div className="card">
      <div className="card-body">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 4 }}>当前固件版本</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>v{device.firmware_version || '未知'}</div>
        </div>

        {upgradeStatus && (
          <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#dbeafe', borderRadius: 8, color: '#1e40af', fontSize: 14 }}>
            {upgradeStatus}
          </div>
        )}

        <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>可用固件</div>
        {firmwares.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">暂无可用固件</div>
          </div>
        ) : (
          firmwares.map((fw) => (
            <div key={fw.id} className="firmware-item">
              <div className="firmware-item-info">
                <div style={{ fontWeight: 600 }}>v{fw.version}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{fw.description || '无描述'}</div>
                {fw.size && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>大小: {(fw.size / 1024).toFixed(1)} KB</div>}
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleUpgrade(fw)}
                disabled={status === 'upgrading' || status === 'rebooting'}
              >
                升级
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="card">
      <div className="card-body">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">暂无告警</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.severity || 'info'}`}>
              <div className="alert-header">
                <span className="alert-type">
                  {alert.severity === 'high' ? '严重' : alert.severity === 'warning' ? '警告' : '提示'}
                </span>
                <span className="alert-time">{formatTime(alert.created_at)}</span>
              </div>
              <div className="alert-message">{alert.message}</div>
              {!alert.resolved && (
                <button
                  className="btn btn-sm btn-secondary"
                  style={{ marginTop: 8 }}
                  onClick={() => handleResolveAlert(alert.id)}
                >
                  标记已解决
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="card">
      <div className="card-body">
        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">暂无日志</div>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <span className="log-action">{log.action}</span>
                <span className="log-time">{formatTime(log.created_at)}</span>
              </div>
              {log.details && <div className="log-details">{log.details}</div>}
              {log.username && (
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>操作人: {log.username}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab();
      case 'control':
        return renderControlTab();
      case 'firmware':
        return renderFirmwareTab();
      case 'alerts':
        return renderAlertsTab();
      case 'logs':
        return renderLogsTab();
    }
  };

  return (
    <div>
      {renderStatusPanel()}

      <div className="tabs">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}
