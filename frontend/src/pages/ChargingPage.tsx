import { useState, useEffect } from 'react';
import { chargingApi, stationApi, userApi } from '../api';
import { ChargingSession, ChargingStation, Vehicle } from '../types';

const DEMO_USER_ID = 'demo-user';

const ChargingPage = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'code' | 'voice'>('scan');
  const [pileCode, setPileCode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeSession, setActiveSession] = useState<ChargingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUserVehicles();
    checkActiveSession();

    const interval = setInterval(() => {
      checkActiveSession();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadUserVehicles = async () => {
    try {
      const mockUser = await ensureDemoUser();
      const data = await userApi.getVehicles(mockUser.id);
      setVehicles(data);
      if (data.length > 0) {
        const defaultVehicle = data.find((v: Vehicle) => v.is_default) || data[0];
        setSelectedVehicle(defaultVehicle);
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const ensureDemoUser = async () => {
    try {
      const user = await userApi.getUser('user-demo-001');
      return user;
    } catch {
      return { id: 'user-demo-001' };
    }
  };

  const checkActiveSession = async () => {
    try {
      const mockUserId = 'demo-user';
      const sessions = await chargingApi.getActiveSessions(mockUserId);
      if (sessions && sessions.length > 0) {
        setActiveSession(sessions[0]);
      }
    } catch (err) {
    }
  };

  const handleCodeInput = async () => {
    if (!pileCode.trim()) {
      setMessage('请输入充电桩编号');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const pile = await stationApi.getPileByCode(pileCode.trim().toUpperCase());
      if (pile) {
        const station = await stationApi.getStationById(pile.station_id);
        setSelectedStation(station);
        setMessage(`找到充电桩：${pile.pile_code}，请选择车辆后启动充电`);
      }
    } catch (err: any) {
      setMessage('未找到该充电桩，请检查编号是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleScanDemo = () => {
    const demoCodes = ['PILE-BEIJING-001-01', 'PILE-SHANGHAI-002-01', 'PILE-GUANGZHOU-003-01'];
    const randomCode = demoCodes[Math.floor(Math.random() * demoCodes.length)];
    setPileCode(randomCode);
    handleCodeInput();
  };

  const handleVoiceStart = () => {
    setIsListening(true);
    setVoiceText('正在聆听...');

    const phrases = [
      '我要充电',
      '开始充电',
      '启动充电桩',
      'PILE-BEIJING-001-01',
    ];

    setTimeout(() => {
      const result = phrases[Math.floor(Math.random() * phrases.length)];
      setVoiceText(result);
      setIsListening(false);

      if (result.startsWith('PILE-')) {
        setPileCode(result);
        handleCodeInput();
      } else {
        setMessage('语音识别成功，请输入或扫描充电桩编号');
      }
    }, 2000);
  };

  const startCharging = async () => {
    if (!selectedStation || !selectedVehicle) {
      setMessage('请选择充电桩和车辆');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const piles = await stationApi.getPilesByStation(selectedStation.id);
      const availablePile = piles.find((p: any) => p.status === 'available');

      if (!availablePile) {
        setMessage('该场站暂无空闲充电桩');
        setLoading(false);
        return;
      }

      const session = await chargingApi.startCharging(
        'demo-user',
        availablePile.id,
        selectedVehicle.id
      );
      setActiveSession(session);
      setMessage('充电已启动！');
    } catch (err: any) {
      setMessage(err.response?.data?.error || '启动充电失败');
    } finally {
      setLoading(false);
    }
  };

  const stopCharging = async () => {
    if (!activeSession) return;

    setLoading(true);
    try {
      await chargingApi.stopCharging(activeSession.id);
      setActiveSession(null);
      setMessage('充电已结束');
      checkActiveSession();
    } catch (err: any) {
      setMessage('结束充电失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">启动充电</h1>

      {activeSession ? (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 20, textAlign: 'center' }}>
            ⚡ 充电进行中
          </h3>

          <div className="vehicle-card" style={{ marginBottom: 20 }}>
            <div className="vehicle-header">
              <div className="vehicle-info">
                <div className="vehicle-brand">
                  {selectedVehicle?.brand || '我的车辆'}
                  {selectedVehicle?.model ? ` ${selectedVehicle.model}` : ''}
                </div>
                <div className="vehicle-plate">{selectedVehicle?.plate_number}</div>
              </div>
              <span className="status-badge status-charging">充电中</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="soc-text">
                <span>电量</span>
                <span>{activeSession.start_soc ? Math.min(100, activeSession.start_soc + (activeSession.energy_charged / 60) * 100 * 0.6).toFixed(1) : '--'}%</span>
              </div>
              <div className="soc-bar">
                <div
                  className={`soc-fill ${
                    (activeSession.start_soc || 50) > 60 ? 'high' :
                    (activeSession.start_soc || 50) > 30 ? 'medium' : 'low'
                  }`}
                  style={{
                    width: `${Math.min(100, (activeSession.start_soc || 50) + (activeSession.energy_charged / 60) * 100 * 0.6)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid-3">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                  {activeSession.energy_charged.toFixed(1)}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>kWh</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                  ¥{activeSession.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>费用</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>
                  {Math.floor(Math.random() * 30 + 10)}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>分钟</div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-danger btn-large"
            onClick={stopCharging}
            disabled={loading}
          >
            {loading ? '处理中...' : '结束充电'}
          </button>
        </div>
      ) : (
        <div className="grid-2">
          <div className="charging-panel">
            <div className="charging-tabs">
              <div
                className={`charging-tab ${activeTab === 'scan' ? 'active' : ''}`}
                onClick={() => setActiveTab('scan')}
              >
                📷 扫码充电
              </div>
              <div
                className={`charging-tab ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                🔢 编号充电
              </div>
              <div
                className={`charging-tab ${activeTab === 'voice' ? 'active' : ''}`}
                onClick={() => setActiveTab('voice')}
              >
                🎤 语音充电
              </div>
            </div>

            {activeTab === 'scan' && (
              <div>
                <div className="scan-area" onClick={handleScanDemo}>
                  <div className="scan-line"></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
                    <div>点击模拟扫码</div>
                  </div>
                </div>
                <p style={{ textAlign: 'center', color: '#666', fontSize: 13 }}>
                  将摄像头对准充电桩二维码，点击模拟识别
                </p>
              </div>
            )}

            {activeTab === 'code' && (
              <div>
                <div className="input-group">
                  <label className="input-label">充电桩编号</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="请输入充电桩编号，如 PILE-BEIJING-001-01"
                    value={pileCode}
                    onChange={(e) => setPileCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCodeInput()}
                  />
                </div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleCodeInput}
                  disabled={loading}
                >
                  {loading ? '查询中...' : '查询充电桩'}
                </button>
                <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                  提示：充电桩编号通常位于设备正面或侧面
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={handleVoiceStart}
                >
                  🎤
                </div>
                <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
                  {voiceText || '点击麦克风开始语音控制'}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  支持语音指令："我要充电"、"开始充电"、充电桩编号等
                </div>
              </div>
            )}

            {message && (
              <div style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 6,
                background: '#f6ffed',
                color: '#52c41a',
                fontSize: 14,
              }}>
                {message}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>选择车辆</h3>

            {vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无绑定车辆
              </div>
            ) : (
              <div>
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className={`pile-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderColor: selectedVehicle?.id === vehicle.id ? '#0077b6' : '#f0f0f0',
                      background: selectedVehicle?.id === vehicle.id ? '#f0f8ff' : 'white',
                    }}
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <div className="pile-info">
                      <div className="pile-code">
                        {vehicle.brand} {vehicle.model}
                      </div>
                      <div className="pile-detail">
                        车牌号：{vehicle.plate_number} | 电量：{vehicle.current_soc.toFixed(0)}%
                      </div>
                    </div>
                    {vehicle.is_default ? (
                      <span className="status-badge status-charging">默认</span>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {selectedStation && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                <h4 style={{ marginBottom: 12 }}>当前充电站</h4>
                <div style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>
                  {selectedStation.name}
                </div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>
                  {selectedStation.address}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <span className="status-badge status-available">
                    空闲 {selectedStation.available_piles}/{selectedStation.total_piles}
                  </span>
                </div>
                <button
                  className="btn btn-success btn-large"
                  onClick={startCharging}
                  disabled={loading || !selectedVehicle}
                >
                  {loading ? '启动中...' : '🚗 开始充电'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingPage;
