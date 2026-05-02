import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_PORT = 18443;

const ExaminationPage: React.FC = () => {
  const [currentQueue, setCurrentQueue] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [examValues, setExamValues] = useState<{ name: string; value: string; unit: string; normalRange: string; isAbnormal: boolean }[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    const socket = io(`http://localhost:${API_PORT}`);
    
    socket.on('queue:update', (data: any) => {
      console.log('Queue updated:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const callNextPatient = async () => {
    try {
      setCalling(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/examinations/call-next', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.data.patient) {
        setSelectedPatient(response.data.patient);
        setExamValues([]);
        setConclusion('');
      }
    } catch (error) {
      console.error('Call next patient failed:', error);
      alert('叫号失败');
    } finally {
      setCalling(false);
    }
  };

  const addExamValue = () => {
    setExamValues([...examValues, {
      name: '',
      value: '',
      unit: '',
      normalRange: '',
      isAbnormal: false,
    }]);
  };

  const updateExamValue = (index: number, field: string, value: any) => {
    const newValues = [...examValues];
    newValues[index] = { ...newValues[index], [field]: value };
    setExamValues(newValues);
  };

  const removeExamValue = (index: number) => {
    setExamValues(examValues.filter((_, i) => i !== index));
  };

  const submitResult = async () => {
    if (!selectedPatient) {
      alert('请先选择患者');
      return;
    }

    if (examValues.length === 0) {
      alert('请至少输入一项检查结果');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `/api/examinations/${selectedPatient.id}/submit`,
        {
          values: examValues,
          conclusion,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      alert('提交成功！');
      setSelectedPatient(null);
      setExamValues([]);
      setConclusion('');
    } catch (error: any) {
      console.error('Submit result failed:', error);
      alert(error.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">检查录入</h1>
        <button
          onClick={callNextPatient}
          disabled={calling}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {calling ? '叫号中...' : '叫下一位患者'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">当前患者</h2>
            
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700 mb-2">
                    {selectedPatient.patientName}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>预约码: {selectedPatient.reservationCode}</div>
                    <div>订单号: {selectedPatient.orderId}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    setExamValues([]);
                    setConclusion('');
                  }}
                  className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消当前患者
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p>请点击\"叫下一位患者\"开始检查</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">检查结果录入</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">检查指标</h3>
                    <button
                      onClick={addExamValue}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + 添加指标
                    </button>
                  </div>

                  <div className="space-y-3">
                    {examValues.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateExamValue(index, 'name', e.target.value)}
                            placeholder="指标名称"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => updateExamValue(index, 'value', e.target.value)}
                            placeholder="检测值"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateExamValue(index, 'unit', e.target.value)}
                            placeholder="单位"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.normalRange}
                            onChange={(e) => updateExamValue(index, 'normalRange', e.target.value)}
                            placeholder="参考范围 (如: 3.9-6.1)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={item.isAbnormal}
                              onChange={(e) => updateExamValue(index, 'isAbnormal', e.target.checked)}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-600">异常</span>
                          </label>
                          <button
                            onClick={() => removeExamValue(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}

                    {examValues.length === 0 && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        点击上方\"添加指标\"按钮开始录入检查结果
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">检查结论</h3>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="请输入检查结论..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setExamValues([]);
                      setConclusion('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={submitResult}
                    disabled={submitting}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? '提交中...' : '提交结果'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">请先叫号选择患者</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExaminationPage;
