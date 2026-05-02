import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import './styles.css';

const API_BASE = '/api';

interface Department {
  id: string;
  name: string;
  code: string;
  capacity: number;
}

interface QueueItem {
  reservationId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  stepNumber: number;
  estimatedTime: number;
  estimatedWaitTime?: number;
  joinedAt: string;
  priority: number;
  reservationCode: string;
  packageName?: string;
  status?: string;
}

const apiClient = {
  get: async (url: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const response = await fetch(`${API_BASE}${url}`, { headers });
    if (!response.ok) throw new Error('请求失败');
    return response.json();
  },
};

const defaultDepartments: Department[] = [
  { id: 'dept_001', name: '内科', code: 'INTERNAL', capacity: 5 },
  { id: 'dept_002', name: '外科', code: 'SURGERY', capacity: 5 },
  { id: 'dept_003', name: '眼科', code: 'OPHTHALMOLOGY', capacity: 3 },
  { id: 'dept_004', name: '耳鼻喉科', code: 'ENT', capacity: 3 },
  { id: 'dept_005', name: '口腔科', code: 'DENTAL', capacity: 3 },
  { id: 'dept_006', name: '放射科', code: 'RADIOLOGY', capacity: 4 },
  { id: 'dept_007', name: '超声科', code: 'ULTRASOUND', capacity: 4 },
  { id: 'dept_008', name: '检验科', code: 'LAB', capacity: 6 },
  { id: 'dept_009', name: '心电图', code: 'ECG', capacity: 2 },
];

const DashboardPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departments, setDepartments] = useState<Department[]>(defaultDepartments);
  const [queues, setQueues] = useState<Record<string, QueueItem[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        try {
          const deptsData = await apiClient.get('/departments');
          if (Array.isArray(deptsData) && deptsData.length > 0) {
            setDepartments(deptsData);
          }
        } catch (e) {
          console.log('Using default departments');
        }

        try {
          const s = io('http://localhost:18443');
          s.on('connect', () => {
            console.log('Dashboard connected to socket server');
          });
          s.on('queue:update', (data: any) => {
            console.log('Queue update:', data);
            setQueues(prev => ({
              ...prev,
              [data.departmentId]: data.queue || [],
            }));
          });
          setSocket(s);
        } catch (e) {
          console.log('Socket connection failed, using demo mode');
        }

        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getQueueStatus = (deptId: string) => {
    const queue = queues[deptId] || [];
    const waiting = queue.filter((q) => q.status !== 'in_examination').length;
    const inProgress = queue.filter((q) => q.status === 'in_examination').length;
    return { waiting, inProgress, total: queue.length };
  };

  const totalWaiting = Object.values(queues).reduce((sum, q) => {
    return sum + q.filter((item: QueueItem) => item.status !== 'in_examination').length;
  }, 0);

  const totalInProgress = Object.values(queues).reduce((sum, q) => {
    return sum + q.filter((item: QueueItem) => item.status === 'in_examination').length;
  }, 0);

  const totalCompleted = 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">加载大屏数据中...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title-group">
            <div className="dashboard-logo">医</div>
            <div>
              <h1 className="dashboard-title">体检中心导检大屏</h1>
              <p className="dashboard-subtitle">实时排队状态显示系统</p>
            </div>
          </div>
          <div className="dashboard-time-group">
            <div className="dashboard-time">{formatTime(currentTime)}</div>
            <div className="dashboard-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-stats">
          <div className="dashboard-stat-card waiting">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-value waiting">{totalWaiting}</div>
                <div className="dashboard-stat-label">等待检查</div>
              </div>
              <div className="dashboard-stat-icon waiting">⏳</div>
            </div>
          </div>

          <div className="dashboard-stat-card in-progress">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-value in-progress">{totalInProgress}</div>
                <div className="dashboard-stat-label">正在检查</div>
              </div>
              <div className="dashboard-stat-icon in-progress">🏥</div>
            </div>
          </div>

          <div className="dashboard-stat-card completed">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-value completed">{totalCompleted}</div>
                <div className="dashboard-stat-label">已完成</div>
              </div>
              <div className="dashboard-stat-icon completed">✅</div>
            </div>
          </div>
        </div>

        <div className="dashboard-queues">
          <h2 className="dashboard-section-title">科室排队状态</h2>
          <div className="dashboard-queues-grid">
            {departments.map((dept) => {
              const status = getQueueStatus(dept.id);
              const queue = queues[dept.id] || [];
              const inProgressPatient = queue.find((q) => q.status === 'in_examination');
              const waitingPatients = queue.filter((q) => q.status !== 'in_examination').slice(0, 5);

              return (
                <div key={dept.id} className="dashboard-dept-card">
                  <div className="dashboard-dept-header">
                    <h3 className="dashboard-dept-name">{dept.name}</h3>
                    <div className="dashboard-dept-counts">
                      <span className="dashboard-dept-count waiting">
                        等待: {status.waiting}
                      </span>
                      <span className="dashboard-dept-count in-progress">
                        检查中: {status.inProgress}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-dept-body">
                    {inProgressPatient && (
                      <div className="dashboard-current-patient">
                        <div className="dashboard-current-label">
                          <span className="dashboard-current-dot"></span>
                          <span className="dashboard-current-text">正在检查</span>
                        </div>
                        <div className="dashboard-patient-name">{inProgressPatient.patientName}</div>
                        <div className="dashboard-patient-code">
                          预约码: {inProgressPatient.reservationCode}
                        </div>
                      </div>
                    )}

                    <div className="dashboard-waiting-section">
                      <div className="dashboard-waiting-header">
                        <span className="dashboard-waiting-title">等待队列</span>
                        {waitingPatients.length > 0 && (
                          <span className="dashboard-waiting-count">
                            前{Math.min(waitingPatients.length, 5)}位
                          </span>
                        )}
                      </div>

                      {waitingPatients.length === 0 && !inProgressPatient ? (
                        <div className="dashboard-empty">
                          <div className="dashboard-empty-icon">✓</div>
                          <div className="dashboard-empty-text">暂无等待患者</div>
                        </div>
                      ) : (
                        <div className="dashboard-waiting-list">
                          {waitingPatients.map((patient, index) => (
                            <div key={patient.reservationId} className="dashboard-waiting-item">
                              <div className="dashboard-waiting-number">{index + 1}</div>
                              <div className="dashboard-waiting-info">
                                <div className="dashboard-waiting-name">{patient.patientName}</div>
                                <div className="dashboard-waiting-time">
                                  {patient.estimatedWaitTime
                                    ? `预计等待: ${patient.estimatedWaitTime}分钟`
                                    : `预约码: ${patient.reservationCode}`}
                                </div>
                              </div>
                            </div>
                          ))}

                          {queue.filter((q) => q.status !== 'in_examination').length > 5 && (
                            <div style={{ 
                              textAlign: 'center', 
                              padding: '8px', 
                              color: 'rgba(255, 255, 255, 0.4)',
                              fontSize: '12px'
                            }}>
                              ...还有 {queue.filter((q) => q.status !== 'in_examination').length - 5} 位患者
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="dashboard-footer-content">
          <div className="dashboard-footer-left">
            <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
              体检中心管理系统
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            <span>智能导检大屏显示系统 v2.0</span>
          </div>
          <div className="dashboard-footer-right">
            <div className="dashboard-footer-status">
              <span className="dashboard-footer-dot"></span>
              <span>数据实时更新中...</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardPage />
  </React.StrictMode>
);
