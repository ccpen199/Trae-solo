import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { webSocketService } from '../services/webSocketService';
import { Pond, Device, PowerStatus } from '../types';
import { Settings, Zap, Droplets, Thermometer, Activity, Fish, Server, ToggleLeft, ToggleRight } from 'lucide-react';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN');
};

const getDeviceStatusStyle = (status: Device['status']): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'online':
      return { bg: 'bg-green-100', text: 'text-green-700', label: '在线' };
    case 'offline':
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: '离线' };
    case 'error':
      return { bg: 'bg-red-100', text: 'text-red-700', label: '故障' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: '未知' };
  }
};

const getPondStatusStyle = (status: Pond['currentStatus']): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'normal':
      return { bg: 'bg-green-100', text: 'text-green-700', label: '正常' };
    case 'warning':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '警告' };
    case 'emergency':
      return { bg: 'bg-red-100', text: 'text-red-700', label: '紧急' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: '未知' };
  }
};

const getPowerStatusDot = (status: PowerStatus['backupPowerStatus']): string => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'ready':
      return 'bg-yellow-500';
    case 'idle':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

const getDeviceTypeName = (type: Device['type']): string => {
  switch (type) {
    case 'aerator': return '增氧机';
    case 'feeder': return '投饵机';
    case 'gate': return '闸机';
    default: return '传感器';
  }
};

const ControlPanel: React.FC = () => {
  const ponds = useAppStore((state) => state.ponds);
  const devices = useAppStore((state) => state.devices);
  const powerStatus = useAppStore((state) => state.powerStatus);
  const isConnected = useAppStore((state) => state.isConnected);

  const [selectedPond, setSelectedPond] = useState<string>('pond-001');
  const [simulationMode, setSimulationMode] = useState(false);

  const [sensorDataForm, setSensorDataForm] = useState({
    dissolvedOxygen: 6.5,
    temperature: 25,
    ammoniaNitrogen: 0.3,
    nitrite: 0.08
  });

  const handleSimulateSensorData = () => {
    webSocketService.simulateSensorData({
      pondId: selectedPond,
      ...sensorDataForm
    });
  };

  const handleSimulatePowerLoss = () => {
    webSocketService.simulatePowerLoss();
  };

  const handleSimulatePowerRestore = () => {
    webSocketService.simulatePowerRestore();
  };

  const handleGenerateAerationPlan = () => {
    webSocketService.generateAerationPlan({
      pondId: selectedPond,
      currentDO: sensorDataForm.dissolvedOxygen,
      temperature: sensorDataForm.temperature,
      fishBiomass: 5000,
      waterVolume: 10000
    });
  };

  const handleGenerateFeedingPlan = () => {
    webSocketService.generateFeedingPlan({
      pondId: selectedPond,
      fishWeight: 5000,
      waterTemperature: sensorDataForm.temperature,
      waterQualityScore: 85
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">控制中心</h3>
            <p className="text-sm text-gray-500">实时监控与控制设备</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium">{isConnected ? '实时连接中' : '连接断开'}</span>
          </div>
          
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              simulationMode 
                ? 'bg-yellow-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {simulationMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            模拟模式
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800">电源状态</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    powerStatus.isPowered ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Zap className={`w-5 h-5 ${powerStatus.isPowered ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">主电源</p>
                    <p className="text-sm text-gray-500">电网供电状态</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                  powerStatus.isPowered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${powerStatus.isPowered ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {powerStatus.isPowered ? '正常' : '断电'}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    powerStatus.backupPowerStatus === 'active' ? 'bg-yellow-100' : 
                    powerStatus.backupPowerStatus === 'ready' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Zap className={`w-5 h-5 ${
                      powerStatus.backupPowerStatus === 'active' ? 'text-yellow-600' : 
                      powerStatus.backupPowerStatus === 'ready' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">备用电源</p>
                    <p className="text-sm text-gray-500">UPS / 发电机</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                  powerStatus.backupPowerStatus === 'active' ? 'bg-yellow-100 text-yellow-700' : 
                  powerStatus.backupPowerStatus === 'ready' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${getPowerStatusDot(powerStatus.backupPowerStatus)}`}></span>
                  {powerStatus.backupPowerStatus === 'active' ? '运行中' : 
                   powerStatus.backupPowerStatus === 'ready' ? '就绪' : '待机'}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-1">系统提示</p>
                <p className="text-sm text-blue-600">{powerStatus.nextAction}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-600" />
              </div>
              <h4 className="font-semibold text-gray-800">塘口状态</h4>
            </div>
            
            <div className="space-y-3">
              {ponds.map((pond) => {
                const statusStyle = getPondStatusStyle(pond.currentStatus);
                const isSelected = selectedPond === pond.id;
                
                return (
                  <div
                    key={pond.id}
                    onClick={() => setSelectedPond(pond.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-blue-50 border-2 border-blue-400 ring-2 ring-blue-100' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <Fish className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{pond.name}</p>
                          <p className="text-xs text-gray-500">面积: {pond.area}㎡ | 水深: {pond.depth}m</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{pond.nextAction}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800">设备列表</h4>
              <span className="ml-auto text-sm text-gray-500">{devices.length} 台设备</span>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {devices.map((device) => {
                const statusStyle = getDeviceStatusStyle(device.status);
                
                return (
                  <div key={device.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusStyle.bg}`}>
                          <Activity className={`w-4 h-4 ${statusStyle.text}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{device.name}</p>
                          <p className="text-xs text-gray-500">{getDeviceTypeName(device.type)}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {simulationMode && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg border-2 border-yellow-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800">模拟控制面板</h4>
                  <p className="text-sm text-yellow-600">用于测试系统功能</p>
                </div>
                <span className="ml-auto w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-5">
                  <h5 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    模拟传感器数据
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">溶氧 (mg/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={sensorDataForm.dissolvedOxygen}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, dissolvedOxygen: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">水温 (℃)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="40"
                        value={sensorDataForm.temperature}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">氨氮 (mg/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={sensorDataForm.ammoniaNitrogen}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, ammoniaNitrogen: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">亚盐 (mg/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={sensorDataForm.nitrite}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, nitrite: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSimulateSensorData}
                    disabled={!isConnected}
                    className="mt-4 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    发送传感器数据
                  </button>
                </div>

                <div className="bg-white rounded-xl p-5">
                  <h5 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    电源模拟
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleSimulatePowerLoss}
                      disabled={!isConnected || !powerStatus.isPowered}
                      className="py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      模拟断电
                    </button>
                    <button
                      onClick={handleSimulatePowerRestore}
                      disabled={!isConnected || powerStatus.isPowered}
                      className="py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      恢复供电
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5">
                  <h5 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-teal-500" />
                    智能计划
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleGenerateAerationPlan}
                      disabled={!isConnected}
                      className="py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      生成增氧计划
                    </button>
                    <button
                      onClick={handleGenerateFeedingPlan}
                      disabled={!isConnected}
                      className="py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Fish className="w-4 h-4" />
                      生成投喂计划
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!simulationMode && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">开启模拟模式</p>
              <p className="text-gray-400 text-sm mt-2">正常运行时，系统将自动处理传感器数据和设备控制</p>
              <button
                onClick={() => setSimulationMode(true)}
                className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                启用模拟模式
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
