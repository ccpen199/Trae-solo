import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, AlertTriangle, Download } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface TaxReturn {
  id: number;
  filing_no: string;
  property_title: string;
  owner_name: string;
  financial_year: string;
  tax_year: number;
  total_income: number;
  total_expenses: number;
  taxable_income: number;
  tax_payable: number;
  status: string;
  due_date: string;
  lodged_date: string | null;
  days_until_due: number;
}

export default function Tax() {
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadTaxReturns();
  }, [search]);

  const loadTaxReturns = async () => {
    try {
      setLoading(true);
      let url = '/tax?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiFetch<{ data: TaxReturn[] }>(url);
      setTaxReturns(res.data);
    } catch (error) {
      console.error('Failed to load tax returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (tr: TaxReturn) => {
    if (tr.status === 'pending' && tr.days_until_due <= 30 && tr.days_until_due > 0) {
      return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full"><AlertTriangle size={10} className="mr-1" />{tr.days_until_due} {t('days_left', 'property')}</span>;
    }
    if (tr.status === 'pending' && tr.days_until_due <= 0) {
      return <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">{t('overdue', 'property')}</span>;
    }
    return (
      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
        tr.status === 'lodged' ? 'bg-green-100 text-green-700' :
        tr.status === 'pending' ? 'bg-blue-100 text-blue-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {t(`status_${tr.status}`, 'property')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('tax_returns', 'property')}</h1>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <Download size={18} className="mr-2" />
            {t('export_ato_template', 'property')}
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={18} className="mr-2" />
            {t('add_tax_return', 'property')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search_tax_returns', 'property')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('filing_no', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('property', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('financial_year', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('income_expense', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tax_payable', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('due_date', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taxReturns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      {t('no_tax_returns', 'property')}
                    </td>
                  </tr>
                ) : (
                  taxReturns.map((tr) => (
                    <tr key={tr.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-purple-500" />
                          <span className="font-medium text-gray-800">{tr.filing_no}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{tr.property_title}</p>
                        <p className="text-xs text-gray-500">{tr.owner_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{tr.financial_year}</p>
                        <p className="text-xs text-gray-500">FY {tr.tax_year}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-green-600">{formatCurrency(tr.total_income)}</p>
                        <p className="text-sm text-red-600">-{formatCurrency(tr.total_expenses)}</p>
                        <p className="text-xs text-gray-500">= {formatCurrency(tr.taxable_income)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{formatCurrency(tr.tax_payable)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(tr.due_date, user?.timezone)}</span>
                        </div>
                        {tr.lodged_date && (
                          <p className="text-xs text-green-600 mt-1">{t('lodged', 'property')}: {formatDate(tr.lodged_date, user?.timezone)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(tr)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
