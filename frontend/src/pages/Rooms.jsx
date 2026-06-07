import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Plus, ChevronRight, Lightbulb, Thermometer, Monitor, Zap,
  Edit2, Trash2, Save, X, GripVertical, Settings, Battery, Clock
} from 'lucide-react';
import * as api from '../api.js';

const deviceIcons = {
  light: Lightbulb,
  ac: Thermometer,
  projector: Monitor,
  default: Zap
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [topology, setTopology] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', parentId: null });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [roomsRes, topologyRes, groupsRes] = await Promise.all([
        api.getRooms('home-001'),
        api.getTopology('home-001'),
        api.getDeviceGroups()
      ]);
      setRooms(roomsRes.data);
      setTopology(topologyRes.data);
      setGroups(groupsRes.data);
    } catch (e) {
      console.error('Failed to load rooms:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoom() {
    try {
      await api.createRoom('home-001', newRoom);
      setShowAddRoom(false);
      setNewRoom({ name: '', parentId: null });
      loadData();
    } catch (e) {
      alert('创建房间失败');
    }
  }

  async function handleSaveRoom(room) {
    try {
      await api.updateRoom(room.id, { name: room.name, topologyOrder: room.topology_order });
      setEditingRoom(null);
      loadData();
    } catch (e) {
      alert('保存失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">家庭空间</h1>
          <p className="text-slate-400 mt-1">管理房间拓扑、设备分组与能耗计量</p>
        </div>
        <button 
          onClick={() => setShowAddRoom(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          添加房间
        </button>
      </div>

      {showAddRoom && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">添加新房间</h3>
            <button onClick={() => setShowAddRoom(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="房间名称"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <select
              value={newRoom.parentId || ''}
              onChange={(e) => setNewRoom({ ...newRoom, parentId: e.target.value || null })}
              className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">无父房间</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddRoom}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            确认添加
          </button>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <LayoutGrid size={20} />
          房间拓扑与设备分组
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-5 border border-slate-600 hover:border-blue-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <GripVertical className="text-blue-400" size={20} />
                  </div>
                  <div>
                    {editingRoom?.id === room.id ? (
                      <input
                        type="text"
                        value={editingRoom.name}
                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                        className="bg-transparent border-b border-blue-500 text-white font-semibold text-lg focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-white font-semibold text-lg">{room.name}</h4>
                    )}
                    <p className="text-slate-400 text-sm">{room.device_count || 0} 台设备</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {editingRoom?.id === room.id ? (
                    <>
                      <button
                        onClick={() => handleSaveRoom(editingRoom)}
                        className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingRoom(null)}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingRoom(room)}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {topology?.rooms?.find(r => r.id === room.id)?.devices?.slice(0, 3).map((device) => {
                  const Icon = device.name.includes('灯') ? Lightbulb : 
                              device.name.includes('空调') ? Thermometer :
                              device.name.includes('投影') ? Monitor : Zap;
                  return (
                    <div key={device.id} className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg">
                      <div className={`p-1.5 rounded ${
                        device.status === 'online' ? 'bg-green-500/20' : 'bg-slate-700'
                      }`}>
                        <Icon className={device.status === 'online' ? 'text-green-400' : 'text-slate-500'} size={14} />
                      </div>
                      <span className="text-sm text-slate-300 flex-1">{device.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  );
                })}
                {(!topology?.rooms?.find(r => r.id === room.id)?.devices?.length) && (
                  <p className="text-slate-500 text-sm text-center py-2">暂无设备</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">拓扑层级</span>
                  <span className="text-slate-300">第 {room.topology_order || 1} 层</span>
                </div>
                {room.parent_id && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">父房间</span>
                    <span className="text-slate-300">{rooms.find(r => r.id === room.parent_id)?.name || '-'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">设备分组</span>
                  <span className="text-blue-400">
                    {groups.filter(g => g.room_id === room.id).length} 个分组
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="text-amber-400" size={16} />
                    <span className="text-slate-400 text-sm">能耗计量</span>
                  </div>
                  <span className="text-amber-400 font-medium">{(room.energy_usage || 0).toFixed(1)} kWh</span>
                </div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (room.energy_usage || 0) * 10)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>今日: {(room.energy_usage || 0).toFixed(2)} kWh</span>
                  <span>本周: {(room.energy_usage * 7 * 0.8).toFixed(1)} kWh</span>
                </div>
              </div>

              <button className="absolute top-4 right-4 p-1.5 hover:bg-slate-700 rounded-lg text-slate-400">
                <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} />
          设备分组策略
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{group.name}</p>
                  <p className="text-xs text-slate-500">
                    {rooms.find(r => r.id === group.room_id)?.name || '全域'}
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <LayoutGrid className="text-blue-400" size={18} />
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">分组策略</p>
                <code className="text-xs text-purple-300 bg-slate-950 px-2 py-1 rounded block">
                  {group.strategy?.type || '手动分组'}
                </code>
              </div>

              {group.strategy?.rules && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">触发规则</p>
                  <div className="space-y-1">
                    {Object.entries(group.strategy.rules).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-slate-400">{key}</span>
                        <span className="text-slate-300">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>创建时间</span>
                <span>{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          
          <button className="p-4 bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-white">
            <Plus size={24} className="mb-2" />
            <span>创建设备分组</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={20} />
          能耗计量单元记录
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-3 text-slate-400 font-medium text-sm">房间</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">计量单元</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">今日能耗</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">本周能耗</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">本月能耗</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">上次读数</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">状态</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, i) => (
                <tr key={room.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-white">{room.name}</td>
                  <td className="p-3 text-slate-300 text-sm">meter-{room.id.slice(-6)}</td>
                  <td className="p-3 text-amber-400">{(room.energy_usage || 0).toFixed(2)} kWh</td>
                  <td className="p-3 text-slate-300">{(room.energy_usage * 7 * 0.8).toFixed(1)} kWh</td>
                  <td className="p-3 text-slate-300">{(room.energy_usage * 30 * 0.7).toFixed(1)} kWh</td>
                  <td className="p-3 text-slate-500 text-sm">{new Date(Date.now() - i * 3600000).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">正常计量</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">拓扑关系可视化</h3>
        <div className="relative bg-slate-900/50 rounded-xl p-8 min-h-[400px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {rooms.map((room, i) => {
              const angles = rooms.map((_, idx) => (idx / rooms.length) * Math.PI * 2 - Math.PI / 2);
              const x = 50 + 35 * Math.cos(angles[i]);
              const y = 50 + 30 * Math.sin(angles[i]);
              return (
                <line 
                  key={`line-${room.id}`}
                  x1="50%" 
                  y1="50%" 
                  x2={`${x}%`} 
                  y2={`${y}%`}
                  stroke="#475569"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })}
          </svg>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 1 }}>
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center border-4 border-blue-400 shadow-lg shadow-blue-500/30">
              <div className="text-center">
                <p className="text-white font-bold">我的家</p>
                <p className="text-blue-200 text-xs">Home</p>
              </div>
            </div>
          </div>
          
          <div className="relative h-[350px]">
            {rooms.map((room, index) => {
              const total = rooms.length;
              const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
              const radius = 140;
              const x = 50 + (radius / 300) * 100 * Math.cos(angle);
              const y = 50 + (radius / 350) * 100 * Math.sin(angle);
              
              return (
                <div 
                  key={room.id} 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%`, zIndex: 2 }}
                >
                  <div className="bg-slate-700 rounded-xl p-3 border border-slate-600 min-w-[100px] hover:border-blue-500 transition-colors cursor-pointer">
                    <p className="text-white font-medium text-center text-sm">{room.name}</p>
                    <p className="text-slate-400 text-xs text-center">{room.device_count || 0} 台设备</p>
                    <p className="text-amber-400 text-xs text-center mt-1">{(room.energy_usage || 0).toFixed(1)} kWh</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
