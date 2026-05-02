import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_PORT = 18443;

const QueueManagementPage: React.FC = () => {
  const [queues, setQueues] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
    const socket = io(`http://localhost:${API_PORT}`);
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('queue:update', (data: any) => {
      console.log('Queue updated:', data);
      fetchQueues();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const allQueues = [];
      
      for (const dept of departments) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/examinations/${dept.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          allQueues.push({
            department: dept,
            items: response.data,
          });
        } catch (error) {
          console.error(`Failed to fetch queue for ${dept.id}:`, error);
        }
      }
      
      setQueues(allQueues);
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">队列管理</h1>
        <button
          onClick={fetchQueues}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          刷新队列
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {queues.map((queue) => (
            <div key={queue.department.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">{queue.department.name}</h3>
                  <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm">
                    等待: {queue.items.filter((i: any) => i.status === 'waiting').length}
                  </span>
                </div>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {queue.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无等待患者
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.items.map((item: any) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${
                          item.status === 'in_examination'
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-semibold ${
                                item.status === 'in_examination' ? 'text-green-600' : 'text-gray-800'
                              }`}>
                                {item.patientName}
                              </span>
                              {item.status === 'in_examination' && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                                  检查中
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              预约码: {item.reservationCode} | 预约号: {item.orderId}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              排队号: {item.queuePosition}
                            </div>
                            {item.estimatedWaitTime > 0 && (
                              <div className="text-sm text-orange-600">
                                预计等待: {item.estimatedWaitTime}分钟
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueManagementPage;
