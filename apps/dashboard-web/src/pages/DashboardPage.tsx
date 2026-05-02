import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_PORT = 18443;

const DashboardPage: React.FC = () => {
  const [queues, setQueues] = useState<Record<string, any[]>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departments] = useState([
    { id: 'dept_001', name: '内科', code: 'INTERNAL' },
    { id: 'dept_002', name: '外科', code: 'SURGERY' },
    { id: 'dept_003', name: '眼科', code: 'OPHTHALMOLOGY' },
    { id: 'dept_004', name: '耳鼻喉科', code: 'ENT' },
    { id: 'dept_005', name: '口腔科', code: 'DENTAL' },
    { id: 'dept_006', name: '放射科', code: 'RADIOLOGY' },
    { id: 'dept_007', name: '超声科', code: 'ULTRASOUND' },
    { id: 'dept_008', name: '检验科', code: 'LAB' },
    { id: 'dept_009', name: '心电图', code: 'ECG' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = io(`http://localhost:${API_PORT}`);
    
    socket.on('connect', () => {
      console.log('Dashboard connected to socket server');
    });

    socket.on('queue:update', (data: any) => {
      console.log('Queue update:', data);
      setQueues(prev => ({
        ...prev,
        [data.departmentId]: data.queue,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
    const waiting = queue.filter((q: any) => q.status === 'waiting').length;
    const inProgress = queue.filter((q: any) => q.status === 'in_examination').length;
    
    return { waiting, inProgress, total: queue.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <header className="bg-black bg-opacity-30 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-wider">体检中心导检大屏</h1>
            <p className="text-blue-300 text-lg mt-1">实时排队状态显示</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-mono font-bold text-yellow-400">
              {formatTime(currentTime)}
            </div>
            <div className="text-lg text-blue-300 mt-1">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">当前等待</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {Object.values(queues).reduce((sum: number, q: any[]) => 
                    sum + q.filter((item: any) => item.status === 'waiting').length, 0)}
                </p>
              </div>
              <div className="w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">正在检查</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {Object.values(queues).reduce((sum: number, q: any[]) => 
                    sum + q.filter((item: any) => item.status === 'in_examination').length, 0)}
                </p>
              </div>
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">已完成检查</p>
                <p className="text-4xl font-bold text-white mt-2">
                  {Object.values(queues).reduce((sum: number, q: any[]) => 
                    sum + q.filter((item: any) => item.status === 'completed').length, 0)}
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {departments.map((dept) => {
            const status = getQueueStatus(dept.id);
            const queue = queues[dept.id] || [];
            const inProgressPatient = queue.find((q: any) => q.status === 'in_examination');
            const waitingPatients = queue.filter((q: any) => q.status === 'waiting').slice(0, 5);

            return (
              <div key={dept.id} className="bg-white bg-opacity-10 rounded-2xl overflow-hidden backdrop-blur">
                <div className="bg-blue-600 bg-opacity-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{dept.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-500 bg-opacity-30 text-yellow-300 px-3 py-1 rounded-full text-sm">
                        等待: {status.waiting}
                      </span>
                      <span className="bg-green-500 bg-opacity-30 text-green-300 px-3 py-1 rounded-full text-sm">
                        检查中: {status.inProgress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {inProgressPatient && (
                    <div className="mb-4 p-4 bg-green-500 bg-opacity-20 border border-green-500 border-opacity-40 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 font-medium text-sm">正在检查</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {inProgressPatient.patientName}
                      </div>
                      <div className="text-sm text-blue-300 mt-1">
                        预约码: {inProgressPatient.reservationCode}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-300">等待队列</h4>
                      {waitingPatients.length > 0 && (
                        <span className="text-xs text-blue-400">
                          前{Math.min(waitingPatients.length, 5)}位
                        </span>
                      )}
                    </div>

                    {waitingPatients.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        暂无等待患者
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {waitingPatients.map((patient: any, index: number) => (
                          <div
                            key={patient.id}
                            className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-500 bg-opacity-30 rounded-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-white">{patient.patientName}</div>
                                <div className="text-xs text-blue-300">
                                  预计等待: {patient.estimatedWaitTime}分钟
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {patient.reservationCode}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-50 py-4 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-blue-300">
          <div>
            <span className="font-medium">体检中心管理系统</span> | 智能导检大屏显示系统
          </div>
          <div>
            数据实时更新中...
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
