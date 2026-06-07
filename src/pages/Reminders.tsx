import { useState, useEffect } from 'react';
import { Bell, Calendar, DollarSign, FileText, Clock, CheckCircle, Send, RefreshCw } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface Reminder {
  id: number;
  type: string;
  title: string;
  title_en: string;
  description: string;
  due_date: string;
  status: string;
  notification_methods: string[];
  related_type: string;
  related_id: number;
  created_at: string;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadReminders();
  }, [filter]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      let url = '/reminders?limit=50';
      if (filter !== 'all') url += `&status=${filter}`;
      const res = await apiFetch<{ data: Reminder[] }>(url);
      setReminders(res.data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async (type: string) => {
    try {
      await apiFetch(`/reminders/generate-${type}`, { method: 'POST' });
      await loadReminders();
    } catch (error) {
      console.error('Failed to generate reminders:', error);
    }
  };

  const checkDueReminders = async () => {
    try {
      await apiFetch('/reminders/check-due', { method: 'POST' });
      await loadReminders();
    } catch (error) {
      console.error('Failed to check due reminders:', error);
    }
  };

  const typeIcons: Record<string, any> = {
    lease_renewal: Calendar,
    loan_repayment: DollarSign,
    tax_filing: FileText,
    insurance_renewal: FileText,
    maintenance: Clock,
  };

  const typeColors: Record<string, string> = {
    lease_renewal: 'bg-blue-100 text-blue-700',
    loan_repayment: 'bg-green-100 text-green-700',
    tax_filing: 'bg-purple-100 text-purple-700',
    insurance_renewal: 'bg-yellow-100 text-yellow-700',
    maintenance: 'bg-orange-100 text-orange-700',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const stats = [
    { label: t('pending', 'common'), value: reminders.filter(r => r.status === 'pending').length, color: 'text-yellow-600 bg-yellow-50' },
    { label: t('sent', 'common'), value: reminders.filter(r => r.status === 'sent').length, color: 'text-blue-600 bg-blue-50' },
    { label: t('completed', 'common'), value: reminders.filter(r => r.status === 'completed').length, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('reminders', 'common')}</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => generateReminders('lease-renewal')}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Calendar size={16} className="mr-2" />
            {t('gen_lease_reminders', 'common')}
          </button>
          <button
            onClick={() => generateReminders('loan-reminders')}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <DollarSign size={16} className="mr-2" />
            {t('gen_loan_reminders', 'common')}
          </button>
          <button
            onClick={() => generateReminders('tax-reminders')}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <FileText size={16} className="mr-2" />
            {t('gen_tax_reminders', 'common')}
          </button>
          <button
            onClick={checkDueReminders}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            {t('check_due', 'common')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-lg p-4 ${stat.color}`}>
            <p className="text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['all', 'pending', 'sent', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t(f, 'common')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">{t('no_reminders', 'dashboard')}</p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const Icon = typeIcons[reminder.type] || Bell;
              return (
                <div key={reminder.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${typeColors[reminder.type] || 'bg-gray-100 text-gray-700'}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{reminder.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{reminder.description}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="flex items-center text-sm text-gray-600">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            {formatDate(reminder.due_date, user?.timezone)}
                          </span>
                          <span className="flex items-center text-sm text-gray-600">
                            <Bell size={14} className="mr-1 text-gray-400" />
                            {reminder.notification_methods.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[reminder.status] || 'bg-gray-100 text-gray-700'}`}>
                        {reminder.status === 'sent' && <Send size={10} className="mr-1" />}
                        {reminder.status === 'completed' && <CheckCircle size={10} className="mr-1" />}
                        {t(`status_${reminder.status}`, 'common')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
