import React, { useState, useEffect } from 'react';
import { reportApi } from '../services/api';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
    } catch (error) {
      console.error('获取报告列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const riskLevelColors: Record<string, { text: string; bg: string }> = {
    low: { text: 'text-green-600', bg: 'bg-green-100' },
    medium: { text: 'text-yellow-600', bg: 'bg-yellow-100' },
    high: { text: 'text-orange-600', bg: 'bg-orange-100' },
    critical: { text: 'text-red-600', bg: 'bg-red-100' },
  };

  const riskLevelLabels: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '危急',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">体检报告</h1>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">暂无体检报告</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {reports.map((report) => {
              const colors = riskLevelColors[report.riskLevel] || riskLevelColors.low;
              const isSelected = selectedReport?.id === report.id;

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-800">{report.reportNo}</div>
                      <div className="text-sm text-gray-500">{report.packageName}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {riskLevelLabels[report.riskLevel]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{selectedReport.reportNo}</h2>
                    <p className="text-gray-500 text-sm">
                      生成时间：{new Date(selectedReport.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      下载PDF
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">体检摘要</h3>
                    <p className="text-gray-600">{selectedReport.summary}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">医生结论</h3>
                    <p className="text-gray-600">{selectedReport.conclusions}</p>
                  </div>

                  {selectedReport.abnormalItems && selectedReport.abnormalItems.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-3">异常指标</h3>
                      <div className="space-y-2">
                        {selectedReport.abnormalItems.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                            <div>
                              <span className="font-medium text-gray-800">{item.itemName}</span>
                              {item.isCrisis && (
                                <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                                  危急值
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-red-600 font-medium">{item.value}</div>
                              <div className="text-xs text-gray-500">参考：{item.normalRange}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 mb-3">健康建议</h3>
                      <div className="space-y-2">
                        {selectedReport.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-gray-700">{rec.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-gray-500">请选择一份报告查看详情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
