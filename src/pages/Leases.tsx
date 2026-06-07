import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Lease {
  id: number;
  agreement_no: string;
  property_title: string;
  tenant_name: string;
  owner_name: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  rent_frequency: string;
  bond_amount: number;
  status: string;
  days_remaining: number;
}

export default function Leases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadLeases();
  }, [search]);

  const loadLeases = async () => {
    try {
      setLoading(true);
      let url = '/leases?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiFetch<{ data: Lease[] }>(url);
      setLeases(res.data);
    } catch (error) {
      console.error('Failed to load leases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (lease: Lease) => {
    if (lease.days_remaining <= 30 && lease.days_remaining > 0) {
      return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full"><AlertTriangle size={10} className="mr-1" />{t('expiring_soon', 'property')}</span>;
    }
    if (lease.days_remaining <= 0) {
      return <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">{t('expired', 'property')}</span>;
    }
    if (lease.status === 'active') {
      return <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">{t('status_active', 'property')}</span>;
    }
    return <span className="inline-flex px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{lease.status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('leases', 'property')}</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} className="mr-2" />
          {t('add_lease', 'property')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search_leases', 'property')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agreement_no', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('property', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenant', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('rent', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('term', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {t('no_leases', 'property')}
                    </td>
                  </tr>
                ) : (
                  leases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText size={16} className="text-blue-500" />
                          <span className="font-medium text-gray-800">{lease.agreement_no}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{lease.property_title}</p>
                        <p className="text-xs text-gray-500">{t('owner', 'property')}: {lease.owner_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lease.tenant_name}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{formatCurrency(lease.rent_amount)}/{lease.rent_frequency}</p>
                        <p className="text-xs text-gray-400">{t('bond', 'property')}: {formatCurrency(lease.bond_amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(lease.start_date, user?.timezone)} → {formatDate(lease.end_date, user?.timezone)}</span>
                        </div>
                        {lease.days_remaining > 0 && (
                          <p className="text-xs text-gray-500 mt-1">{lease.days_remaining} {t('days_remaining', 'property')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(lease)}</td>
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
