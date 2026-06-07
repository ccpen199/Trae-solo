import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate, formatPercent } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Loan {
  id: number;
  contract_no: string;
  property_title: string;
  lender: string;
  loan_amount: number;
  interest_rate: number;
  loan_term: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  status: string;
  next_payment_date: string | null;
  remaining_amount: number;
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadLoans();
  }, [search]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      let url = '/loans?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiFetch<{ data: Loan[] }>(url);
      setLoans(res.data);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultLoan = async () => {
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setFullYear(maturityDate.getFullYear() + 30);
    const nextRepaymentDate = new Date(startDate);
    nextRepaymentDate.setMonth(nextRepaymentDate.getMonth() + 1);

    try {
      setSaving(true);
      await apiFetch('/loans', {
        method: 'POST',
        body: JSON.stringify({
          property_id: 1,
          owner_id: 1,
          lender: 'ANZ Bank',
          loan_amount: 640000,
          interest_rate: 5.95,
          rate_type: 'variable',
          loan_term: 30,
          start_date: startDate.toISOString().slice(0, 10),
          maturity_date: maturityDate.toISOString().slice(0, 10),
          monthly_repayment: 3818,
          repayment_day: 15,
          loan_type: 'principal_and_interest',
          loan_purpose: 'investment',
          valuation_amount: 920000,
          lvr: 69.6,
          remaining_balance: 640000,
          next_repayment_date: nextRepaymentDate.toISOString().slice(0, 10),
          status: 'active',
          notes: '演示新增贷款合同',
        }),
      });
      setNotice('贷款合同已新增');
      await loadLoans();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '新增贷款失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('loans', 'property')}</h1>
        <button
          onClick={createDefaultLoan}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" />
          {saving ? '提交中' : t('add_loan', 'property')}
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search_loans', 'property')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract_no', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('property', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lender', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('amount', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payment', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('next_payment', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      {t('no_loans', 'property')}
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign size={16} className="text-green-500" />
                          <span className="font-medium text-gray-800">{loan.contract_no}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.property_title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.lender}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{formatCurrency(loan.loan_amount)}</p>
                        <p className="text-xs text-gray-500">{formatPercent(loan.interest_rate / 100)} · {loan.loan_term} {t('years', 'common')}</p>
                        <p className="text-xs text-gray-400">{t('remaining', 'property')}: {formatCurrency(loan.remaining_amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{formatCurrency(loan.monthly_payment)}/mo</p>
                      </td>
                      <td className="px-6 py-4">
                        {loan.next_payment_date ? (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatDate(loan.next_payment_date, user?.timezone)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          loan.status === 'active' ? 'bg-green-100 text-green-700' :
                          loan.status === 'paid_off' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {t(`status_${loan.status}`, 'property')}
                        </span>
                      </td>
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
