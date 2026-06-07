import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Home } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';

interface Tenant {
  id: number;
  name: string;
  name_en: string;
  email: string;
  phone: string;
  id_type: string;
  id_number: string;
  nationality: string;
  active_lease: string | null;
  property_title: string | null;
  lease_end_date: string | null;
  created_at: string;
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useI18nStore();

  useEffect(() => {
    loadTenants();
  }, [search]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      let url = '/tenants?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiFetch<{ data: Tenant[] }>(url);
      setTenants(res.data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('tenants', 'property')}</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} className="mr-2" />
          {t('add_tenant', 'property')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('search_tenants', 'property')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('nationality', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('property', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lease_end', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      {t('no_tenants', 'property')}
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-medium">{tenant.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{tenant.name}</p>
                            <p className="text-sm text-gray-500">{tenant.name_en}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{tenant.email}</p>
                        <p className="text-sm text-gray-500">{tenant.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{tenant.nationality}</p>
                        <p className="text-xs text-gray-400">{tenant.id_type}: {tenant.id_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.property_title ? (
                          <div className="flex items-center">
                            <Home size={14} className="mr-2 text-green-500" />
                            <span className="text-sm text-gray-600">{tenant.property_title}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">{t('no_property', 'property')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.lease_end_date ? (
                          <span className="text-sm text-gray-600">{formatDate(tenant.lease_end_date)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
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
