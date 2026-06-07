import React, { useState, useEffect } from 'react';
import { 
  Cpu, Search, Plus, RefreshCw, Wifi, Power, 
  Settings, AlertTriangle, CheckCircle, XCircle 
} from 'lucide-react';
import * as api from '../api.js';

const protocolColors = {
  matter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  thread: 'bg-green-500/20 text-green-400 border-green-500/30',
  zigbee: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  wifi: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  bluetooth: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
};

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [discoverInfo, setDiscoverInfo] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', protocol: 'all' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDiscovered, setSelectedDiscovered] = useState(null);

  useEffect(() => {
    loadDevices();
  }, [filter]);

  async function loadDevices() {
    try {
      const params = {};
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.protocol !== 'all') params.protocol = filter.protocol;
      
      const res = await api.getDevices(params);
      setDevices(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscover() {
    setDiscovering(true);
    try {
      const res = await api.discoverDevices('all');
      setDiscovered(res.data.devices || []);
      setDiscoverInfo({
        found: res.data.found,
        byProtocol: res.data.byProtocol,
        handshakeResults: res.data.handshakeResults,
        scanDuration: res.data.scanDuration,
        existingDevicesUnaffected: res.data.existingDevicesUnaffected
      });
    } catch (e) {
      console.error('Discover failed:', e);
    } finally {
      setDiscovering(false);
    }
  }

  async function handleAddDevice(dev) {
    try {
      await api.createDevice({
        name: dev.name,
        vendorId: dev.vendorId,
        firmwareVersion: dev.firmwareVersion,
        protocol: dev.protocol,
        capabilitySchema: dev.capability_schema
      });
      setDiscovered(prev => prev.filter(d => d.id !== dev.id));
      loadDevices();
    } catch (e) {
      alert('添加设备失败');
    }
  }

  async function handleControl(deviceId, action) {
    try {
      const res = await api.controlDevice(deviceId, action);
      console.log('[Control Result]', res);
      loadDevices();
      if (window.onDeviceStatusChange) {
        window.onDeviceStatusChange();
      }
    } catch (e) {
      console.error('Control failed:', e);
    }
  }

  async function handleTogglePower(device) {
    const newStatus = device.status === 'online' ? 'offline' : 'online';
    try {
      const action = { power: newStatus === 'online' };
      const res = await api.controlDevice(device.id, action);
      console.log('[Toggle Result]', res);
      loadDevices();
      if (window.onDeviceStatusChange) {
        window.onDeviceStatusChange();
      }
    } catch (e) {
      console.error('Toggle failed:', e);
    }
  }

  const filtered = devices.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">设备管理</h1>
          <p className="text-slate-400 mt-1">管理您的智能设备</p>
        </div>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={discovering ? 'animate-spin' : ''} />
          {discovering ? '扫描中...' : '发现设备'}
        </button>
      </div>

      {discovered.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wifi className="text-green-400" size={20} />
              发现的新设备 ({discovered.length})
            </h3>
            {discoverInfo && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">扫描耗时: {discoverInfo.scanDuration}ms</span>
                {discoverInfo.existingDevicesUnaffected && (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    现有设备未受影响
                  </span>
                )}
              </div>
            )}
          </div>
          
          {discoverInfo?.byProtocol && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(discoverInfo.byProtocol).map(([proto, count]) => (
                <span key={proto} className={`text-xs px-3 py-1 rounded-full border ${protocolColors[proto]}`}>
                  {proto.toUpperCase()}: {count}台
                </span>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discovered.map((dev) => (
              <div key={dev.id} className="p-4 bg-slate-900/50 rounded-lg border border-dashed border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Cpu className="text-green-400" size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{dev.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded border ${protocolColors[dev.protocol]}`}>
                          {dev.protocol.toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          dev.securityLevel === 'high' ? 'bg-green-500/20 text-green-400' :
                          dev.securityLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          安全等级: {dev.securityLevel === 'high' ? '高' : dev.securityLevel === 'medium' ? '中' : '标准'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-slate-400 mb-3">
                  <div className="flex justify-between">
                    <span>厂商ID:</span>
                    <span className="text-slate-300 font-mono">{dev.vendorId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>厂商名称:</span>
                    <span className="text-slate-300">{dev.vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>固件版本:</span>
                    <span className="text-slate-300">{dev.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>信号强度:</span>
                    <span className={`${dev.signalStrength > 80 ? 'text-green-400' : dev.signalStrength > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {dev.signalStrength}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>握手耗时:</span>
                    <span className="text-slate-300">{dev.handshakeDuration}ms</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDiscovered(dev)}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    查看能力
                  </button>
                  <button
                    onClick={() => handleAddDevice(dev)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    添加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索设备名称或ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
          </select>
          <select
            value={filter.protocol}
            onChange={(e) => setFilter({ ...filter, protocol: e.target.value })}
            className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">全部协议</option>
            <option value="matter">Matter</option>
            <option value="thread">Thread</option>
            <option value="zigbee">Zigbee</option>
            <option value="wifi">Wi-Fi</option>
          </select>
          <button
            onClick={loadDevices}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-4 text-slate-400 font-medium text-sm">设备</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">协议</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">状态</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">固件</th>
              <th className="text-left p-4 text-slate-400 font-medium text-sm">最后心跳</th>
              <th className="text-right p-4 text-slate-400 font-medium text-sm">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((device) => (
              <tr key={device.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      device.status === 'online' ? 'bg-green-500/10' : 'bg-slate-700'
                    }`}>
                      <Cpu className={device.status === 'online' ? 'text-green-400' : 'text-slate-500'} size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{device.name}</p>
                      <p className="text-xs text-slate-500">{device.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${protocolColors[device.protocol] || 'bg-slate-700 text-slate-300'}`}>
                    {device.protocol.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {device.status === 'online' ? (
                      <CheckCircle className="text-green-400" size={16} />
                    ) : (
                      <XCircle className="text-red-400" size={16} />
                    )}
                    <span className={device.status === 'online' ? 'text-green-400' : 'text-red-400'}>
                      {device.status === 'online' ? '在线' : '离线'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-slate-300">{device.firmware_version}</span>
                </td>
                <td className="p-4">
                  <span className="text-slate-400 text-sm">
                    {device.last_heartbeat ? new Date(device.last_heartbeat).toLocaleString() : '-'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleTogglePower(device)}
                      className={`p-2 rounded-lg transition-colors ${
                        device.status === 'online' 
                          ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                      title={device.status === 'online' ? '关闭' : '开启'}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <Cpu size={48} className="mx-auto mb-3 opacity-50" />
            <p>没有找到设备</p>
          </div>
        )}
      </div>

      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">设备控制 - {selectedDevice.name}</h3>
              <button
                onClick={() => setSelectedDevice(null)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">设备信息</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">ID:</span> <span className="text-white">{selectedDevice.id}</span></div>
                  <div><span className="text-slate-500">厂商:</span> <span className="text-white">{selectedDevice.vendor_id}</span></div>
                  <div><span className="text-slate-500">固件:</span> <span className="text-white">{selectedDevice.firmware_version}</span></div>
                  <div><span className="text-slate-500">协议:</span> <span className="text-white">{selectedDevice.protocol.toUpperCase()}</span></div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-3">快速控制</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleControl(selectedDevice.id, { power: true })}
                    className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    开启设备
                  </button>
                  <button
                    onClick={() => handleControl(selectedDevice.id, { power: false })}
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    关闭设备
                  </button>
                </div>
              </div>

              {selectedDevice.capability_schema?.properties && (
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-3">能力描述 Schema</p>
                  <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedDevice.capability_schema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDiscovered && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">设备能力详情 - {selectedDiscovered.name}</h3>
              <button
                onClick={() => setSelectedDiscovered(null)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-3">协议握手结果</p>
                {discoverInfo?.handshakeResults?.find(h => h.deviceId === selectedDiscovered.id)?.steps?.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className={`w-2 h-2 rounded-full ${step.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-white text-sm flex-1">{step.step}</span>
                    <span className="text-slate-400 text-xs">{Math.round(step.duration)}ms</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-3">设备基础信息</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">设备ID:</span> <span className="text-white font-mono">{selectedDiscovered.id}</span></div>
                  <div><span className="text-slate-500">设备类型:</span> <span className="text-white">{selectedDiscovered.type}</span></div>
                  <div><span className="text-slate-500">厂商ID:</span> <span className="text-white font-mono">{selectedDiscovered.vendorId}</span></div>
                  <div><span className="text-slate-500">厂商名称:</span> <span className="text-white">{selectedDiscovered.vendorName}</span></div>
                  <div><span className="text-slate-500">固件版本:</span> <span className="text-white">{selectedDiscovered.firmwareVersion}</span></div>
                  <div><span className="text-slate-500">协议:</span> <span className="text-white">{selectedDiscovered.protocol.toUpperCase()}</span></div>
                  <div><span className="text-slate-500">信号强度:</span> <span className="text-white">{selectedDiscovered.signalStrength}%</span></div>
                  <div><span className="text-slate-500">安全等级:</span> <span className="text-white">{selectedDiscovered.securityLevel === 'high' ? '高' : selectedDiscovered.securityLevel === 'medium' ? '中' : '标准'}</span></div>
                </div>
              </div>

              {selectedDiscovered.capability_schema && (
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-3">能力描述 JSON Schema</p>
                  <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedDiscovered.capability_schema, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleAddDevice(selectedDiscovered);
                    setSelectedDiscovered(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  添加此设备
                </button>
                <button
                  onClick={() => setSelectedDiscovered(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
