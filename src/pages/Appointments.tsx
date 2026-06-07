import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Phone, Mail, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch, formatDate, formatDateTime } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Provider {
  id: number;
  name: string;
  name_en: string;
  profession: string;
  specialization: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  availability: string;
}

interface Appointment {
  id: number;
  provider_name: string;
  provider_profession: string;
  title: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  type: string;
  location: string;
}

export default function Appointments() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('providers');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'providers') {
        const res = await apiFetch<{ data: Provider[] }>('/appointments/providers');
        setProviders(res.data);
      } else {
        const res = await apiFetch<{ data: Appointment[] }>('/appointments?limit=20');
        setAppointments(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const professionColors: Record<string, string> = {
    lawyer: 'bg-purple-100 text-purple-700',
    inspector: 'bg-blue-100 text-blue-700',
    accountant: 'bg-green-100 text-green-700',
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('appointments', 'common')}</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={18} className="mr-2" />
          {t('new_appointment', 'common')}
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'providers' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {t('service_providers', 'common')}
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'appointments' ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {t('my_appointments', 'common')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : activeTab === 'providers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                    <p className="text-sm text-gray-500">{provider.name_en}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${professionColors[provider.profession] || 'bg-gray-100 text-gray-700'}`}>
                  {provider.profession}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600"><span className="font-medium">{t('specialization', 'common')}:</span> {provider.specialization}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400" />
                  {provider.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  {provider.email}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin size={14} className="mr-2 text-gray-400 mt-0.5" />
                  {provider.address}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(provider.rating) ? 'fill-current' : ''}>★</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">{provider.rating}</span>
                </div>
                <button className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  {t('book', 'common')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('service', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('provider', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date_time', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location', 'common')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status', 'property')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions', 'common')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      {t('no_appointments', 'common')}
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{apt.title}</p>
                        <p className="text-sm text-gray-500">{apt.type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">{apt.provider_name}</p>
                        <p className="text-xs text-gray-500">{apt.provider_profession}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(apt.appointment_date, user?.timezone)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          <span>{apt.appointment_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{apt.location}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[apt.status] || 'bg-gray-100 text-gray-700'}`}>
                          {apt.status === 'confirmed' && <CheckCircle size={12} className="mr-1" />}
                          {apt.status === 'cancelled' && <XCircle size={12} className="mr-1" />}
                          {t(`status_${apt.status}`, 'common')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {apt.status === 'pending' && (
                          <button className="text-sm text-red-600 hover:text-red-700">
                            {t('cancel', 'common')}
                          </button>
                        )}
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
