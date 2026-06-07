import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Download, Clock, CheckCircle, AlertTriangle, Settings, ArrowRightLeft } from 'lucide-react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { useI18nStore } from '@/store/i18n';
import { useAuthStore } from '@/store/auth';

interface SyncStatus {
  last_sync: string | null;
  next_sync: string | null;
  sync_status: string;
  total_properties_synced: number;
  total_tenants_synced: number;
  total_leases_synced: number;
  pending_changes: number;
  errors: number;
}

interface SyncLog {
  id: number;
  sync_type: string;
  direction: string;
  status: string;
  records_processed: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export default function Sync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { t } = useI18nStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        apiFetch<{ data: SyncStatus }>('/sync/status'),
        apiFetch<{ data: SyncLog[] }>('/sync/status'),
      ]);
      setStatus(statusRes.data);
      setLogs((logsRes.data as any).logs || []);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSync = async (type: string) => {
    try {
      setSyncing(true);
      await apiFetch(`/sync/${type}`, { method: 'POST' });
      await loadSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const statusColors: Record<string, string> = {
    idle: 'bg-gray-100 text-gray-700',
    syncing: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  };

  const directionColors: Record<string, string> = {
    push: 'bg-blue-100 text-blue-700',
    pull: 'bg-green-100 text-green-700',
    full: 'bg-purple-100 text-purple-700',
  };

  const statCards = status ? [
    { label: t('properties_synced', 'common'), value: status.total_properties_synced, icon: '🏠' },
    { label: t('tenants_synced', 'common'), value: status.total_tenants_synced, icon: '👥' },
    { label: t('leases_synced', 'common'), value: status.total_leases_synced, icon: '📄' },
    { label: t('pending_changes', 'common'), value: status.pending_changes, icon: '⏳', alert: status.pending_changes > 0 },
    { label: t('sync_errors', 'common'), value: status.errors, icon: '⚠️', alert: status.errors > 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('sync', 'common')}</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => runSync('pull')}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            <Download size={18} className="mr-2" />
            {t('pull_data', 'common')}
          </button>
          <button
            onClick={() => runSync('push')}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors"
          >
            <Upload size={18} className="mr-2" />
            {t('push_data', 'common')}
          </button>
          <button
            onClick={() => runSync('full-sync')}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {syncing ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                {t('syncing', 'common')}
              </>
            ) : (
              <>
                <ArrowRightLeft size={18} className="mr-2" />
                {t('full_sync', 'common')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Settings size={20} className="mr-2 text-blue-600" />
            PropertyMe {t('integration', 'common')}
          </h3>
          {status && (
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${statusColors[status.sync_status] || 'bg-gray-100 text-gray-700'}`}>
              {status.sync_status === 'syncing' && <RefreshCw size={14} className="mr-1.5 animate-spin" />}
              {status.sync_status === 'success' && <CheckCircle size={14} className="mr-1.5" />}
              {status.sync_status === 'error' && <AlertTriangle size={14} className="mr-1.5" />}
              {t(`status_${status.sync_status}`, 'common')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className={`p-4 rounded-lg border ${card.alert ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {status && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-8 text-sm">
            {status.last_sync && (
              <div className="flex items-center text-gray-600">
                <Clock size={16} className="mr-2 text-gray-400" />
                {t('last_sync', 'common')}: {formatDateTime(status.last_sync, user?.timezone)}
              </div>
            )}
            {status.next_sync && (
              <div className="flex items-center text-gray-600">
                <RefreshCw size={16} className="mr-2 text-gray-400" />
                {t('next_sync', 'common')}: {formatDateTime(status.next_sync, user?.timezone)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('sync_history', 'common')}</h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t('no_sync_history', 'common')}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${directionColors[log.direction] || 'bg-gray-100 text-gray-700'}`}>
                    {log.direction}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{log.sync_type}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(log.started_at, user?.timezone)}
                      {log.completed_at && ` → ${formatDateTime(log.completed_at, user?.timezone)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-green-600">{log.records_processed} {t('processed', 'common')}</p>
                    {log.records_failed > 0 && (
                      <p className="text-xs text-red-600">{log.records_failed} {t('failed', 'common')}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[log.status] || 'bg-gray-100 text-gray-700'}`}>
                    {log.status === 'success' && <CheckCircle size={12} className="mr-1" />}
                    {log.status === 'error' && <AlertTriangle size={12} className="mr-1" />}
                    {t(`status_${log.status}`, 'common')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('webhook_config', 'common')}</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Webhook URL</p>
            <code className="text-sm text-blue-600 bg-white px-3 py-1.5 rounded border">
              http://127.0.0.1:59053/api/sync/propertyme/webhook
            </code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('supported_events', 'common')}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• property.created</li>
                <li>• property.updated</li>
                <li>• tenant.created</li>
                <li>• tenant.updated</li>
                <li>• lease.created</li>
                <li>• lease.updated</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('field_mapping', 'common')}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PropertyName → title</li>
                <li>• Address → address_en</li>
                <li>• TenantName → tenant_name</li>
                <li>• RentAmount → rent_amount</li>
                <li>• LeaseStart → start_date</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
