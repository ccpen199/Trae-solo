import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Flag } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Owner {
  id: number;
  name: string;
  name_en: string;
  email: string;
  phone: string;
  citizenship: string;
  dual_citizenship: boolean;
  tfn: string;
  arbn: string;
  address: string;
  property_count: number;
  total_value: number;
  created_at: string;
}

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadOwners();
  }, [search]);

  const loadOwners = async () => {
    try {
      setLoading(true);
      let url = '/owners?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiFetch<{ data: Owner[] }>(url);
      setOwners(res.data);
    } catch (error) {
      console.error('Failed to load owners:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('owners', 'property')}</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} className="mr-2" />
          {t('add_owner', 'property')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search_owners', 'property')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contact', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('citizenship', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('properties', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total_value', 'dashboard')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {owners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      {t('no_owners', 'property')}
                    </td>
                  </tr>
                ) : (
                  owners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">{owner.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{owner.name}</p>
                            <p className="text-sm text-gray-500">{owner.name_en}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{owner.email}</p>
                        <p className="text-sm text-gray-500">{owner.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{owner.citizenship}</span>
                          {owner.dual_citizenship && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              <Flag size={10} className="mr-1" />
                              {t('dual_citizenship', 'property')}
                            </span>
                          )}
                        </div>
                        {owner.tfn && <p className="text-xs text-gray-400 mt-1">TFN: {owner.tfn}</p>}
                        {owner.arbn && <p className="text-xs text-gray-400">ARBN: {owner.arbn}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{owner.property_count}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{formatCurrency(owner.total_value)}</span>
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
