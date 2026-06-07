import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Home,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import { apiFetch, formatCurrency, formatPercent, formatDate } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface DashboardSummary {
  total_properties: number;
  total_value: number;
  active_leases: number;
  vacancy_rate: number;
  annual_yield: number;
  total_rental_income: number;
  total_expenses: number;
  net_income: number;
  upcoming_repayments: number;
  upcoming_lease_expiries: number;
  pending_tax_returns: number;
  pending_payments: number;
}

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface VacancyData {
  city: string;
  rate: number;
  count: number;
}

interface ExpenseData {
  type: string;
  amount: number;
  percentage: number;
}

interface Reminder {
  id: number;
  type: string;
  title: string;
  due_date: string;
  status: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [rentalData, setRentalData] = useState<ChartDataPoint[]>([]);
  const [vacancyData, setVacancyData] = useState<VacancyData[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, rentalRes, vacancyRes, expenseRes, remindersRes] = await Promise.all([
        apiFetch<{ data: DashboardSummary }>('/dashboard/summary'),
        apiFetch<{ data: ChartDataPoint[] }>('/dashboard/rental-income-chart?months=12'),
        apiFetch<{ data: VacancyData[] }>('/dashboard/vacancy-rate-chart'),
        apiFetch<{ data: ExpenseData[] }>('/dashboard/expense-breakdown'),
        apiFetch<{ data: Reminder[] }>('/dashboard/upcoming-reminders?limit=5'),
      ]);

      setSummary(summaryRes.data);
      setRentalData(rentalRes.data);
      setVacancyData(vacancyRes.data);
      setExpenseData(expenseRes.data);
      setReminders(remindersRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statCards = summary ? [
    {
      title: t('total_properties', 'dashboard'),
      value: summary.total_properties,
      icon: Building2,
      color: 'bg-blue-500',
      subValue: formatCurrency(summary.total_value),
      subLabel: t('total_value', 'dashboard'),
    },
    {
      title: t('active_leases', 'dashboard'),
      value: summary.active_leases,
      icon: Home,
      color: 'bg-green-500',
      subValue: formatPercent(summary.vacancy_rate),
      subLabel: t('vacancy_rate', 'dashboard'),
    },
    {
      title: t('rental_income', 'dashboard'),
      value: formatCurrency(summary.total_rental_income),
      icon: DollarSign,
      color: 'bg-yellow-500',
      subValue: formatPercent(summary.annual_yield),
      subLabel: t('annual_yield', 'dashboard'),
    },
    {
      title: t('net_income', 'dashboard'),
      value: formatCurrency(summary.net_income),
      icon: TrendingUp,
      color: 'bg-purple-500',
      subValue: formatCurrency(summary.total_expenses),
      subLabel: t('total_expenses', 'dashboard'),
    },
  ] : [];

  const alertCards = summary ? [
    { title: t('upcoming_repayments', 'dashboard'), value: summary.upcoming_repayments, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
    { title: t('lease_expiries', 'dashboard'), value: summary.upcoming_lease_expiries, icon: Calendar, color: 'text-orange-500 bg-orange-50' },
    { title: t('pending_tax_returns', 'dashboard'), value: summary.pending_tax_returns, icon: FileText, color: 'text-yellow-500 bg-yellow-50' },
    { title: t('pending_payments', 'dashboard'), value: summary.pending_payments, icon: Clock, color: 'text-blue-500 bg-blue-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-2">{card.subLabel}: <span className="text-gray-600">{card.subValue}</span></p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map((card, index) => (
          <div key={index} className={`rounded-lg p-4 ${card.color}`}>
            <div className="flex items-center space-x-3">
              <card.icon size={20} />
              <div>
                <p className="text-sm font-medium">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('rental_vs_expenses', 'dashboard')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rentalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" name={t('income', 'dashboard')} stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expenses" name={t('expenses', 'dashboard')} stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('expense_breakdown', 'dashboard')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                label={(entry: any) => `${entry.type} ${(entry.percentage * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vacancy_by_city', 'dashboard')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={vacancyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} />
              <YAxis type="category" dataKey="city" stroke="#6B7280" fontSize={12} width={80} />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Bar dataKey="rate" name={t('vacancy_rate', 'dashboard')} fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('upcoming_reminders', 'dashboard')}</h3>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">{t('no_reminders', 'dashboard')}</p>
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      reminder.status === 'pending' ? 'bg-yellow-500' :
                      reminder.status === 'sent' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{reminder.title}</p>
                      <p className="text-xs text-gray-500">{reminder.type}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(reminder.due_date, user?.timezone)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
