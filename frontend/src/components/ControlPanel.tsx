import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { webSocketService } from '../services/webSocketService';
import { Pond, Device, PowerStatus } from '../types';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN');
};

const getDeviceStatusColor = (status: Device['status']): string => {
  switch (status) {
    case 'online':
      return 'bg-green-100 text-green-800';
    case 'offline':
      return 'bg-gray-100 text-gray-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDeviceStatusLabel = (status: Device['status']): string => {
  switch (status) {
    case 'online':
      return '在线';
    case 'offline':
      return '离线';
    case 'error':
      return '故障';
    default:
      return '未知';
  }
};

const getPondStatusColor = (status: Pond['currentStatus']): string => {
  switch (status) {
    case 'normal':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'emergency':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPondStatusLabel = (status: Pond['currentStatus']): string => {
  switch (status) {
    case 'normal':
      return '正常';
    case 'warning':
      return '警告';
    case 'emergency':
      return '紧急';
    default:
      return '未知';
  }
};

const getPowerStatusColor = (status: PowerStatus['backupPowerStatus']): string => {
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

export const ControlPanel: React.FC = () => {
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
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          控制中心
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-600">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={(e) => setSimulationMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">模拟模式</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-medium text-gray-800 mb-3">电源状态</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">主电源:</span>
                <span className={`flex items-center gap-2 px-3 py-1 rounded ${
                  powerStatus.isPowered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    powerStatus.isPowered ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {powerStatus.isPowered ? '正常' : '断电'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">备用电源:</span>
                <span className={`flex items-center gap-2 px-3 py-1 rounded ${
                  powerStatus.backupPowerStatus === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : powerStatus.backupPowerStatus === 'ready'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    getPowerStatusColor(powerStatus.backupPowerStatus)
                  }`}></span>
                  {powerStatus.backupPowerStatus === 'active' 
                    ? '运行中' 
                    : powerStatus.backupPowerStatus === 'ready'
                      ? '就绪'
                      : '待机'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                {powerStatus.nextAction}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-medium text-gray-800 mb-3">塘口状态</h4>
            <div className="space-y-2">
              {ponds.map((pond) => (
                <div
                  key={pond.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPond === pond.id 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedPond(pond.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{pond.name}</span>
                      <p className="text-xs text-gray-500">
                        面积: {pond.area}㎡ | 水深: {pond.depth}m
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getPondStatusColor(pond.currentStatus)}`}>
                      {getPondStatusLabel(pond.currentStatus)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{pond.nextAction}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-medium text-gray-800 mb-3">设备列表</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {devices.map((device) => (
                <div key={device.id} className="p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{device.name}</span>
                      <p className="text-xs text-gray-500">
                        类型: {device.type === 'aerator' ? '增氧机' : 
                               device.type === 'feeder' ? '投饵机' :
                               device.type === 'gate' ? '闸机' : '传感器'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getDeviceStatusColor(device.status)}`}>
                      {getDeviceStatusLabel(device.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {simulationMode && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                模拟控制面板
              </h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">模拟传感器数据</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">溶氧 (mg/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorDataForm.dissolvedOxygen}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, dissolvedOxygen: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">水温 (℃)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={sensorDataForm.temperature}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">氨氮 (mg/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={sensorDataForm.ammoniaNitrogen}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, ammoniaNitrogen: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">亚盐 (mg/L)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={sensorDataForm.nitrite}
                        onChange={(e) => setSensorDataForm(prev => ({ ...prev, nitrite: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSimulateSensorData}
                    disabled={!isConnected}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    发送传感器数据
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">电源模拟</h5>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulatePowerLoss}
                      disabled={!isConnected || !powerStatus.isPowered}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      模拟断电
                    </button>
                    <button
                      onClick={handleSimulatePowerRestore}
                      disabled={!isConnected || powerStatus.isPowered}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      模拟恢复供电
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">智能计划</h5>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateAerationPlan}
                      disabled={!isConnected}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      生成增氧计划
                    </button>
                    <button
                      onClick={handleGenerateFeedingPlan}
                      disabled={!isConnected}
                      className="flex-1 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      生成投喂计划
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!simulationMode && (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              <p>请开启"模拟模式"以使用模拟控制功能</p>
              <p className="text-xs mt-2">正常运行时，系统将自动处理传感器数据和设备控制</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
