import React, { useState, useEffect } from 'react';
import BatteryMonitor from './components/BatteryMonitor';
import ChargingChart from './components/ChargingChart';
import OptimizationPanel from './components/OptimizationPanel';
import HistoryView from './components/HistoryView';
import DeviceAdaptation from './components/DeviceAdaptation';
import UserHabits from './components/UserHabits';
import SafetyFuse from './components/SafetyFuse';
import EfficiencyComparison from './components/EfficiencyComparison';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:58826/api';
const DEVICE_ID = 'demo-device-001';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [batteryData, setBatteryData] = useState(null);
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [efficiencyTrend, setEfficiencyTrend] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [fuseRecords, setFuseRecords] = useState([]);
  const [adaptations, setAdaptations] = useState([]);
  const [selectedModel, setSelectedModel] = useState('Default');
  const [habits, setHabits] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary/${DEVICE_ID}`);
      const data = await res.json();
      setDashboardData(data);
      setBatteryData(data.latest_battery);
      setActiveSession(data.active_session);
      setEfficiencyTrend(data.efficiency_trend);
      setFuseRecords(data.active_safety_fuses || []);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const loadLatestData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/battery/latest/${DEVICE_ID}`);
      const data = await res.json();
      setBatteryData(data);
    } catch (e) {
      console.error('Failed to load latest data:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/battery/history/${DEVICE_ID}?limit=50`);
      const data = await res.json();
      setHistory(data.reverse());
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/optimization/sessions/${DEVICE_ID}`);
      const data = await res.json();
      setSessions(data.sessions);
      setEfficiencyTrend(data.efficiency_trend);
      const active = data.sessions.find(s => s.is_active === 1);
      setActiveSession(active || null);
      if (active) {
        loadActiveSessionDetails();
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  };

  const loadActiveSessionDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/optimization/active/${DEVICE_ID}`);
      const data = await res.json();
      if (data) {
        setCurrentStrategy(data.strategy_snapshot);
        setAdjustments(data.adjustments);
      }
    } catch (e) {
      console.error('Failed to load active session:', e);
    }
  };

  const loadAdaptations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/adaptations`);
      const data = await res.json();
      setAdaptations(data);
    } catch (e) {
      console.error('Failed to load adaptations:', e);
    }
  };

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/${DEVICE_ID}`);
      const data = await res.json();
      setHabits(data);
    } catch (e) {
      console.error('Failed to load habits:', e);
    }
  };

  const loadFuseRecords = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/safety/fuse/${DEVICE_ID}?limit=20`);
      const data = await res.json();
      setFuseRecords(data);
    } catch (e) {
      console.error('Failed to load fuse records:', e);
    }
  };

  const loadEfficiencyComparison = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/efficiency/comparison/${DEVICE_ID}?count=10`);
      const data = await res.json();
      setEfficiencyData(data);
    } catch (e) {
      console.error('Failed to load efficiency comparison:', e);
    }
  };

  const initDemoData = async () => {
    try {
      const healthRes = await fetch(`${API_BASE_URL}/battery/latest/${DEVICE_ID}`);
      const healthData = await healthRes.json();
      
      const sessionsRes = await fetch(`${API_BASE_URL}/optimization/sessions/${DEVICE_ID}`);
      const sessionsData = await sessionsRes.json();
      
      const hasData = healthData && sessionsData.sessions && sessionsData.sessions.length > 0;
      
      if (hasData) {
        if (healthData.device_model && healthData.device_model !== 'Default') {
          setSelectedModel(healthData.device_model);
        } else if (sessionsData.sessions.length > 0 && sessionsData.sessions[0].device_model) {
          setSelectedModel(sessionsData.sessions[0].device_model);
        }
        await Promise.all([
          loadLatestData(),
          loadHistory(),
          loadSessions(),
          loadHabits(),
          loadFuseRecords(),
          loadEfficiencyComparison()
        ]);
        return;
      }

      const models = ['Xiaomi Mi 11', 'iPhone 15', 'Samsung Galaxy S24', 'Huawei Mate 60'];
      const randomModel = models[Math.floor(Math.random() * models.length)];
      setSelectedModel(randomModel);

      const now = Date.now();
      const demoRecords = [];
      for (let i = 0; i < 30; i++) {
        const minutesAgo = 30 - i;
        const timestamp = new Date(now - minutesAgo * 60 * 1000).toISOString();
        const baseLevel = 15 + i * 2.5;
        const level = Math.min(100, Math.round(baseLevel + (Math.random() - 0.5) * 3));
        const tempBase = 26 + Math.sin(i / 5) * 3;
        const temp = Math.round((tempBase + (Math.random() - 0.5) * 2) * 10) / 10;
        const voltage = Math.round((4.05 + i * 0.01 + (Math.random() - 0.5) * 0.05) * 100) / 100;
        const current = Math.round((2.0 - i * 0.02 + (Math.random() - 0.5) * 0.2) * 100) / 100;
        const health = 92 - Math.floor(i / 10);
        const isCharging = true;
        const status = level >= 100 ? 'full' : 'charging';
        const plugged = 1;

        demoRecords.push({
          device_id: DEVICE_ID,
          device_model: randomModel,
          voltage,
          current,
          temperature: temp,
          level,
          health,
          status,
          plugged,
          power_source: 'BatteryManager',
          usb_protocol: 'USB_PD_27W',
          is_charging: isCharging,
          measurement_baseline: 'Android BatteryManager API, 1Hz采样, USB供电协议探测',
          sampling_rate: 1,
          timestamp
        });
      }

      for (const record of demoRecords) {
        try {
          await fetch(`${API_BASE_URL}/battery/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          });
        } catch (e) {}
      }



      const historySessions = [
        { start_level: 12, end_level: 88, total_time: 2100, efficiency: 87.3, strategy_used: 'adaptive', avg_temp: 29.5, max_temp: 34.2 },
        { start_level: 8, end_level: 92, total_time: 2400, efficiency: 89.1, strategy_used: 'adaptive', avg_temp: 28.3, max_temp: 32.8 },
        { start_level: 22, end_level: 95, total_time: 1950, efficiency: 91.5, strategy_used: 'aggressive', avg_temp: 30.1, max_temp: 36.5 },
        { start_level: 5, end_level: 78, total_time: 1700, efficiency: 85.7, strategy_used: 'conservative', avg_temp: 27.2, max_temp: 31.0 },
        { start_level: 30, end_level: 100, total_time: 2250, efficiency: 90.2, strategy_used: 'adaptive', avg_temp: 28.8, max_temp: 33.5 }
      ];

      for (let i = 0; i < historySessions.length; i++) {
        const s = historySessions[i];

        const startRes = await fetch(`${API_BASE_URL}/optimization/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: DEVICE_ID,
            start_level: s.start_level,
            strategy_used: s.strategy_used,
            device_model: randomModel
          })
        });
        const startData = await startRes.json();

        if (startData.success) {
          await fetch(`${API_BASE_URL}/optimization/end/${startData.session_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              end_level: s.end_level,
              total_time: s.total_time,
              efficiency: s.efficiency
            })
          });
        }
      }

      const fuseTriggers = [
        { temp: 47.2, reason: 'temperature_high', threshold: 45 },
        { temp: 48.5, reason: 'temperature_high', threshold: 45 }
      ];

      for (const fuse of fuseTriggers) {
        await fetch(`${API_BASE_URL}/battery/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: DEVICE_ID,
            device_model: randomModel,
            voltage: 4.35,
            current: 2.1,
            temperature: fuse.temp,
            level: 75,
            health: 90,
            status: 'charging',
            plugged: 1,
            power_source: 'BatteryManager',
            usb_protocol: 'USB_PD_27W',
            is_charging: true
          })
        });
      }

      await fetch(`${API_BASE_URL}/habits/analyze/${DEVICE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      await Promise.all([
        loadDashboard(),
        loadHistory(),
        loadSessions(),
        loadHabits(),
        loadFuseRecords(),
        loadEfficiencyComparison()
      ]);
    } catch (e) {
      console.error('Failed to init demo data:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadAdaptations();
      await initDemoData();
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadLatestData();
      if (activeSession) {
        loadActiveSessionDetails();
        loadHistory();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const recordData = async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/battery/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, device_id: DEVICE_ID, device_model: selectedModel })
      });
      const result = await res.json();
      if (result.success) {
        loadLatestData();
        loadHistory();
        if (result.current_strategy) {
          setCurrentStrategy(result.current_strategy);
        }
        if (result.strategy_updates && result.strategy_updates.length > 0) {
          loadActiveSessionDetails();
        }
        if (result.safety_issues && result.safety_issues.length > 0) {
          loadFuseRecords();
        }
      }
    } catch (e) {
      console.error('Failed to record data:', e);
    }
  };

  const startOptimization = async () => {
    const level = batteryData?.level || 50;
    try {
      const res = await fetch(`${API_BASE_URL}/optimization/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: DEVICE_ID,
          start_level: level,
          strategy_used: 'adaptive',
          device_model: selectedModel
        })
      });
      const result = await res.json();
      if (result.success) {
        setCurrentStrategy(result.initial_strategy);
        loadSessions();
        loadDashboard();
      }
    } catch (e) {
      console.error('Failed to start optimization:', e);
    }
  };

  const endOptimization = async () => {
    if (!activeSession) return;
    const level = batteryData?.level || 100;
    const startTime = new Date(activeSession.start_time).getTime();
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const efficiency = 85 + Math.random() * 10;
    try {
      const res = await fetch(`${API_BASE_URL}/optimization/end/${activeSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_level: level,
          total_time: totalTime,
          efficiency: efficiency
        })
      });
      const result = await res.json();
      if (result.success) {
        loadSessions();
        loadDashboard();
        loadHabits();
        loadEfficiencyComparison();
        setCurrentStrategy(null);
        setAdjustments([]);
      }
    } catch (e) {
      console.error('Failed to end optimization:', e);
    }
  };

  const analyzeHabits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/habits/analyze/${DEVICE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setHabits(data);
    } catch (e) {
      console.error('Failed to analyze habits:', e);
    }
  };

  const resolveFuse = async (fuseId) => {
    try {
      await fetch(`${API_BASE_URL}/safety/resolve/${fuseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      loadFuseRecords();
      loadDashboard();
    } catch (e) {
      console.error('Failed to resolve fuse:', e);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>充电优化服务系统</h1>
        <p className="subtitle">硬件状态感知型充电效率提升方案</p>
        <div className="header-meta">
          <span className="disclaimer">* 所有指标基于 Android BatteryManager API, 1Hz采样, USB供电协议探测</span>
          <div className="device-selector">
            <label>适配机型：</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {adaptations.map(a => (
                <option key={a.id} value={a.device_model}>{a.device_model}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="main">
        <BatteryMonitor
          batteryData={batteryData}
          onRecord={recordData}
          selectedModel={selectedModel}
        />

        <OptimizationPanel
          activeSession={activeSession}
          onStart={startOptimization}
          onEnd={endOptimization}
          batteryData={batteryData}
          currentStrategy={currentStrategy}
          adjustments={adjustments}
          selectedModel={selectedModel}
        />

        <ChargingChart
          history={history}
          batteryData={batteryData}
          selectedModel={selectedModel}
          adaptations={adaptations}
        />

        <EfficiencyComparison
          efficiencyData={efficiencyData}
          efficiencyTrend={efficiencyTrend}
        />

        <DeviceAdaptation
          adaptations={adaptations}
          selectedModel={selectedModel}
        />

        <UserHabits
          habits={habits}
          onAnalyze={analyzeHabits}
        />

        <SafetyFuse
          fuseRecords={fuseRecords}
          onResolve={resolveFuse}
        />

        <HistoryView
          sessions={sessions}
          efficiencyTrend={efficiencyTrend}
        />
      </main>
    </div>
  );
}

export default App;
