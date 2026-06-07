import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Property {
  id: number;
  title: string;
  title_en: string;
  address: string;
  address_en: string;
  city: string;
  state: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: number;
  purchase_price: number;
  current_value: number;
  status: string;
  owner_name: string;
  active_lease: string | null;
  active_loan: string | null;
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadProperties();
  }, [search, statusFilter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      let url = '/properties?limit=50';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      const res = await apiFetch<{ data: Property[] }>(url);
      setProperties(res.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    vacant: 'bg-yellow-100 text-yellow-700',
    maintenance: 'bg-red-100 text-red-700',
    sold: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('properties', 'property')}</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} className="mr-2" />
          {t('add_property', 'property')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('search_properties', 'property')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">{t('all_status', 'property')}</option>
              <option value="active">{t('status_active', 'property')}</option>
              <option value="vacant">{t('status_vacant', 'property')}</option>
              <option value="maintenance">{t('status_maintenance', 'property')}</option>
              <option value="sold">{t('status_sold', 'property')}</option>
            </select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('property', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('city', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('owner', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('value', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {t('no_properties', 'property')}
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{property.title}</p>
                          <p className="text-sm text-gray-500">{property.address}</p>
                          <p className="text-xs text-gray-400">
                            {property.bedrooms}b {property.bathrooms}b {property.parking}p · {property.area}m²
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{property.city}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{property.property_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{property.owner_name}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{formatCurrency(property.current_value)}</p>
                        <p className="text-xs text-gray-400">{t('purchase', 'property')}: {formatCurrency(property.purchase_price)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[property.status] || 'bg-gray-100 text-gray-700'}`}>
                          {t(`status_${property.status}`, 'property')}
                        </span>
                        {property.active_lease && (
                          <p className="text-xs text-green-600 mt-1">{t('leased', 'property')}</p>
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
