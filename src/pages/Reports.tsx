import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Plus, Search, Eye } from 'lucide-react';
import { apiFetch, formatDate, formatCurrency } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Report {
  id: number;
  report_type: string;
  title: string;
  title_en: string;
  language: string;
  period: string;
  generated_at: string;
  generated_by: string;
  status: string;
  file_format: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('monthly_statement');
  const [reportLang, setReportLang] = useState('zh');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ data: Report[] }>('/reports?limit=20');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      await apiFetch('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          report_type: reportType,
          language: reportLang,
          period: '2024-12',
        }),
      });
      await loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (id: number) => {
    try {
      window.open(`/api/reports/download/${id}`, '_blank');
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const typeIcons: Record<string, any> = {
    monthly_statement: FileText,
    annual_analysis: FileText,
    ato_template: FileText,
  };

  const typeColors: Record<string, string> = {
    monthly_statement: 'bg-blue-100 text-blue-700',
    annual_analysis: 'bg-purple-100 text-purple-700',
    ato_template: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports', 'common')}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('generate_report', 'common')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('report_type', 'common')}</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="monthly_statement">{t('monthly_statement', 'common')}</option>
              <option value="annual_analysis">{t('annual_analysis', 'common')}</option>
              <option value="ato_template">{t('ato_template', 'common')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('language', 'auth')}</label>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('period', 'common')}</label>
            <input
              type="month"
              defaultValue="2024-12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('generating', 'common')}
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" />
                  {t('generate', 'common')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('report', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('language', 'auth')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('period', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('generated_at', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {t('no_reports', 'common')}
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const Icon = typeIcons[report.report_type] || FileText;
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${typeColors[report.report_type] || 'bg-gray-100 text-gray-700'}`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{report.title}</p>
                              <p className="text-xs text-gray-500">{report.title_en}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.report_type}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{report.language === 'zh' ? '中文' : 'English'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{report.period}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDate(report.generated_at, user?.timezone)}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{report.generated_by}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            report.status === 'completed' ? 'bg-green-100 text-green-700' :
                            report.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t(`status_${report.status}`, 'common')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => downloadReport(report.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
