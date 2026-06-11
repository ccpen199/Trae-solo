import { useState, useEffect } from 'react';
import { userApi } from '../api';
import { Vehicle } from '../types';

const VehiclePage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<string, any>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      vehicles.forEach(vehicle => {
        loadVehicleStatus(vehicle.id);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [vehicles]);

  const loadVehicles = async () => {
    try {
      const data = await userApi.getVehicles('demo-user');
      setVehicles(data);
      data.forEach((v: Vehicle) => {
        loadVehicleStatus(v.id);
      });
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      const mockVehicles = [
        {
          id: 'v1',
          user_id: 'demo',
          plate_number: '京A12345',
          brand: '特斯拉',
          model: 'Model 3',
          battery_capacity: 60,
          current_soc: 68,
          current_mileage: 12580,
          energy_consumption: 14.2,
          fault_codes: '[]',
          is_default: 1,
          created_at: '2024-01-01',
        },
        {
          id: 'v2',
          user_id: 'demo',
          plate_number: '京B67890',
          brand: '比亚迪',
          model: '汉EV',
          battery_capacity: 76.9,
          current_soc: 45,
          current_mileage: 8900,
          energy_consumption: 15.8,
          fault_codes: JSON.stringify([{ code: 'P1234', desc: '电池温度偏高', level: 'warning' }]),
          is_default: 0,
          created_at: '2024-02-01',
        },
        {
          id: 'v3',
          user_id: 'demo',
          plate_number: '京C54321',
          brand: '蔚来',
          model: 'ES6',
          battery_capacity: 75,
          current_soc: 82,
          current_mileage: 25600,
          energy_consumption: 16.5,
          fault_codes: '[]',
          is_default: 0,
          created_at: '2024-03-01',
        },
      ];
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleStatus = async (vehicleId: string) => {
    try {
      const status = await userApi.getVehicleStatus(vehicleId);
      setVehicleStatuses(prev => ({ ...prev, [vehicleId]: status }));
    } catch (err) {
    }
  };

  const getSocClass = (soc: number) => {
    if (soc > 60) return 'high';
    if (soc > 30) return 'medium';
    return 'low';
  };

  const getRange = (vehicle: Vehicle) => {
    const status = vehicleStatuses[vehicle.id];
    const soc = status?.current_soc ?? vehicle.current_soc;
    const consumption = status?.energy_consumption ?? vehicle.energy_consumption;
    return Math.round((soc / 100) * vehicle.battery_capacity / consumption * 100);
  };

  const getFaultCodes = (vehicle: Vehicle) => {
    const status = vehicleStatuses[vehicle.id];
    const faultCodes = status?.fault_codes ?? vehicle.fault_codes;
    if (typeof faultCodes === 'string') {
      try {
        return JSON.parse(faultCodes);
      } catch {
        return [];
      }
    }
    return faultCodes || [];
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>我的车辆</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + 添加车辆
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          加载中...
        </div>
      ) : (
        <div className="grid-2">
          {vehicles.map(vehicle => {
            const status = vehicleStatuses[vehicle.id];
            const currentSoc = status?.current_soc ?? vehicle.current_soc;
            const currentMileage = status?.current_mileage ?? vehicle.current_mileage;
            const energyConsumption = status?.energy_consumption ?? vehicle.energy_consumption;
            const faultCodes = getFaultCodes(vehicle);

            return (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-header">
                  <div className="vehicle-info">
                    <div className="vehicle-brand">
                      🚗 {vehicle.brand} {vehicle.model}
                      {vehicle.is_default ? (
                        <span className="status-badge status-charging" style={{ marginLeft: 8 }}>
                          默认
                        </span>
                      ) : null}
                    </div>
                    <div className="vehicle-plate">{vehicle.plate_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: currentSoc > 60 ? '#52c41a' : currentSoc > 30 ? '#faad14' : '#ff4d4f' }}>
                      {currentSoc.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>剩余电量</div>
                  </div>
                </div>

                <div className="soc-bar" style={{ marginBottom: 16 }}>
                  <div
                    className={`soc-fill ${getSocClass(currentSoc)}`}
                    style={{ width: `${currentSoc}%` }}
                  />
                </div>

                <div className="grid-3" style={{ marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {getRange(vehicle)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>预估续航 (km)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {(currentMileage / 10000).toFixed(1)}万
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>总里程</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {energyConsumption.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>能耗 kWh/100km</div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                    电池容量：{vehicle.battery_capacity} kWh
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    故障状态：
                    {faultCodes.length === 0 ? (
                      <span style={{ color: '#52c41a' }}>正常</span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>有 {faultCodes.length} 个故障码</span>
                    )}
                  </div>
                </div>

                {faultCodes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {faultCodes.map((fault: any, idx: number) => (
                      <div key={idx} className="fault-item">
                        ⚠️ {fault.code} - {fault.desc}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" style={{ flex: 1 }}>
                    查看详情
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }}>
                    远程监控
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAddModal(false)}>
          <div className="card" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 20 }}>添加车辆</h3>
            <div className="input-group">
              <label className="input-label">车牌号</label>
              <input type="text" className="input-field" placeholder="请输入车牌号" />
            </div>
            <div className="input-group">
              <label className="input-label">品牌</label>
              <input type="text" className="input-field" placeholder="请输入品牌" />
            </div>
            <div className="input-group">
              <label className="input-label">型号</label>
              <input type="text" className="input-field" placeholder="请输入型号" />
            </div>
            <div className="input-group">
              <label className="input-label">电池容量 (kWh)</label>
              <input type="number" className="input-field" placeholder="请输入电池容量" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclePage;
