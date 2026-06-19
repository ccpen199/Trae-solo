import { useEffect, useState } from 'react';
import { Building2, Search, Filter, RefreshCw, Upload, Check, X, Settings, Database, CheckCircle, Clock, AlertCircle, Download, RotateCw } from 'lucide-react';
import { useProvincialStore } from '../stores/provincialStore';
import { DataTable } from '../components/common/DataTable';
import { StatCard } from '../components/common/StatCard';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/common/FormInput';
import dayjs from 'dayjs';
import type { ProvincialSettlementRecord, ProvincialPlatformConfig } from '@shared/types';

export default function Provincial() {
  const { settlements, config, isLoading, isSyncing, pagination, fetchSettlements, fetchConfig, updateConfig, syncBatch, confirmBatch, batchSync } = useProvincialStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'settlements' | 'sync' | 'config'>('settlements');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<ProvincialPlatformConfig>>({
    apiUrl: '',
    appId: '',
    cityCode: '',
    publicKey: '',
    enabled: true,
  });
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  useEffect(() => {
    fetchSettlements({ page: currentPage, pageSize: 10 });
    fetchConfig();
  }, [currentPage]);

  useEffect(() => {
    if (config) {
      setConfigForm(config);
    }
  }, [config]);

  const handleFilter = () => {
    const params: any = { page: 1, pageSize: 10 };
    if (statusFilter !== 'all') params.status = statusFilter;
    fetchSettlements(params);
    setCurrentPage(1);
  };

  const handleSyncBatch = async (batchId: string) => {
    await syncBatch(batchId);
    fetchSettlements({ page: currentPage, pageSize: 10 });
  };

  const handleConfirmBatch = async (batchId: string) => {
    await confirmBatch(batchId);
    fetchSettlements({ page: currentPage, pageSize: 10 });
  };

  const handleBatchSync = async () => {
    setSyncModalOpen(true);
    try {
      const result = await batchSync();
      setSyncResult(result);
      fetchSettlements({ page: currentPage, pageSize: 10 });
    } catch (err) {
      console.error('批量同步失败', err);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig(configForm);
      setConfigModalOpen(false);
    } catch (err) {
      console.error('保存配置失败', err);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: '待同步', className: 'bg-warning-50 text-warning-600', icon: Clock },
      synced: { label: '已同步', className: 'bg-primary-50 text-primary-600', icon: RotateCw },
      confirmed: { label: '已确认', className: 'bg-success-50 text-success-600', icon: CheckCircle },
      paid: { label: '已付款', className: 'bg-success-100 text-success-700', icon: Database },
    };
    return configs[status] || { label: status, className: 'bg-gray-100 text-gray-600', icon: AlertCircle };
  };

  const columns = [
    {
      key: 'batchId',
      header: '批次号',
      width: '180px',
      render: (item: ProvincialSettlementRecord) => (
        <span className="font-mono text-sm font-medium text-gray-900">{item.batchId}</span>
      ),
    },
    {
      key: 'cityCode',
      header: '城市编码',
      width: '120px',
      render: (item: ProvincialSettlementRecord) => (
        <span className="font-mono text-sm">{item.cityCode}</span>
      ),
    },
    {
      key: 'merchantCount',
      header: '商户数量',
      width: '100px',
      render: (item: ProvincialSettlementRecord) => (
        <span className="font-medium">{item.merchantCount} 家</span>
      ),
    },
    {
      key: 'totalAmount',
      header: '交易总额',
      width: '140px',
      render: (item: ProvincialSettlementRecord) => (
        <span className="font-medium">¥{item.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'subsidyAmount',
      header: '补贴金额',
      width: '140px',
      render: (item: ProvincialSettlementRecord) => (
        <span className="font-medium text-primary-600">¥{item.subsidyAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      width: '120px',
      render: (item: ProvincialSettlementRecord) => {
        const statusConfig = getStatusConfig(item.status);
        const Icon = statusConfig.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
            <Icon className="w-3 h-3" />
            {statusConfig.label}
          </span>
        );
      },
    },
    {
      key: 'times',
      header: '时间节点',
      width: '200px',
      render: (item: ProvincialSettlementRecord) => (
        <div className="text-xs text-gray-500">
          {item.syncTime && <p>同步: {dayjs(item.syncTime).format('MM-DD HH:mm')}</p>}
          {item.confirmTime && <p>确认: {dayjs(item.confirmTime).format('MM-DD HH:mm')}</p>}
          {item.paidTime && <p>付款: {dayjs(item.paidTime).format('MM-DD HH:mm')}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      width: '180px',
      render: (item: ProvincialSettlementRecord) => (
        <div className="flex gap-2">
          {item.status === 'pending' && (
            <button
              onClick={() => handleSyncBatch(item.batchId)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
              disabled={isSyncing}
            >
              <RotateCw className="w-3 h-3" />
              同步
            </button>
          )}
          {item.status === 'synced' && (
            <button
              onClick={() => handleConfirmBatch(item.batchId)}
              className="text-success-600 hover:text-success-700 text-sm font-medium flex items-center gap-1"
              disabled={isSyncing}
            >
              <Check className="w-3 h-3" />
              确认
            </button>
          )}
          <button
            onClick={() => {}}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            凭证
          </button>
        </div>
      ),
    },
  ];

  const filteredSettlements = settlements.filter((s) =>
    s.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const totalSubsidy = settlements.reduce((sum, s) => sum + s.subsidyAmount, 0);
  const totalAmount = settlements.reduce((sum, s) => sum + s.totalAmount, 0);

  const syncStats = [
    { label: '待同步', count: pendingCount, color: 'warning' },
    { label: '已同步', count: settlements.filter((s) => s.status === 'synced').length, color: 'primary' },
    { label: '已确认', count: settlements.filter((s) => s.status === 'confirmed').length, color: 'success' },
    { label: '已付款', count: settlements.filter((s) => s.status === 'paid').length, color: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">省级平台对接</h1>
          <p className="text-gray-500 mt-1">管理与省级平台的结算数据同步和配置</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSettlements({ page: currentPage, pageSize: 10 });
              fetchConfig();
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={handleBatchSync}
            className="btn-accent flex items-center gap-2"
            disabled={isSyncing}
          >
            <Upload className="w-4 h-4" />
            批量同步
          </button>
          <button
            onClick={() => setConfigModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            平台配置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="结算批次总数"
          value={pagination.total}
          color="blue"
          icon={<Database className="w-5 h-5" />}
        />
        <StatCard
          title="交易总额"
          value={`¥${totalAmount.toLocaleString()}`}
          color="green"
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatCard
          title="补贴总额"
          value={`¥${totalSubsidy.toLocaleString()}`}
          color="orange"
          icon={<Upload className="w-5 h-5" />}
          trend={8.5}
          trendLabel="较上月"
        />
        <StatCard
          title="待同步批次"
          value={pendingCount}
          color="red"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="card">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settlements'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            结算记录
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'sync'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            批量同步状态
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            平台配置
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'settlements' && (
            <>
              <div className="flex flex-wrap gap-4 items-center mb-4">
                <div className="flex-1 min-w-[200px] max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索批次号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-32"
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待同步</option>
                    <option value="synced">已同步</option>
                    <option value="confirmed">已确认</option>
                    <option value="paid">已付款</option>
                  </select>
                  <button onClick={handleFilter} className="btn-primary">
                    筛选
                  </button>
                </div>
              </div>

              {isLoading ? (
                <Loading />
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredSettlements}
                  loading={isLoading}
                  pagination={{
                    page: currentPage,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    onPageChange: (page) => setCurrentPage(page),
                  }}
                />
              )}
            </>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {syncStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`p-4 rounded-lg border-2 ${
                      stat.color === 'warning'
                        ? 'border-warning-200 bg-warning-50'
                        : stat.color === 'primary'
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-success-200 bg-success-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        stat.color === 'warning'
                          ? 'text-warning-600'
                          : stat.color === 'primary'
                          ? 'text-primary-600'
                          : 'text-success-600'
                      }`}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        stat.color === 'warning'
                          ? 'text-warning-700'
                          : stat.color === 'primary'
                          ? 'text-primary-700'
                          : 'text-success-700'
                      }`}
                    >
                      {stat.count}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">同步进度</h3>
                <div className="space-y-4">
                  {settlements.slice(0, 5).map((item) => {
                    const progress = item.status === 'paid' ? 100 : item.status === 'confirmed' ? 75 : item.status === 'synced' ? 50 : 25;
                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{item.batchId}</span>
                            <span className="text-gray-500 text-sm ml-2">
                              {item.merchantCount} 家商户，¥{item.subsidyAmount.toLocaleString()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleBatchSync}
                  className="btn-accent px-8 flex items-center gap-2"
                  disabled={isSyncing || pendingCount === 0}
                >
                  <RotateCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? '同步中...' : `同步 ${pendingCount} 个待同步批次`}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'config' && config && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">省级平台对接配置</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      config.enabled
                        ? 'bg-success-50 text-success-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {config.enabled ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        已启用
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        已停用
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500">API 地址</label>
                    <p className="text-gray-900 font-mono mt-1">{config.apiUrl}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-500">应用ID</label>
                      <p className="text-gray-900 font-mono mt-1">{config.appId}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-500">城市编码</label>
                      <p className="text-gray-900 font-mono mt-1">{config.cityCode}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500">公钥</label>
                    <p className="text-gray-900 font-mono mt-1 text-xs break-all">{config.publicKey}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setConfigModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    修改配置
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">同步日志</h3>
                <div className="space-y-3">
                  {[
                    { time: '2024-01-15 14:30:25', action: '批量同步', status: 'success', message: '成功同步 5 个批次，共 128 家商户' },
                    { time: '2024-01-15 10:15:32', action: '单批次确认', status: 'success', message: '批次 BATCH-20240115-001 已确认' },
                    { time: '2024-01-14 16:45:10', action: '批量同步', status: 'warning', message: '成功同步 4 个批次，1 个批次失败' },
                    { time: '2024-01-14 09:00:00', action: '配置更新', status: 'success', message: '省级平台配置已更新' },
                  ].map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          log.status === 'success'
                            ? 'bg-success-100'
                            : log.status === 'warning'
                            ? 'bg-warning-100'
                            : 'bg-danger-100'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <Check className="w-4 h-4 text-success-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-warning-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">{log.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        visible={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="省级平台配置"
        size="lg"
      >
        <div className="space-y-4">
          <FormInput
            label="API 地址"
            value={configForm.apiUrl || ''}
            onChange={(e) => setConfigForm({ ...configForm, apiUrl: e.target.value })}
            placeholder="https://api.provincial.gov.cn/welfare"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="应用ID"
              value={configForm.appId || ''}
              onChange={(e) => setConfigForm({ ...configForm, appId: e.target.value })}
              placeholder="APPID123456"
              required
            />
            <FormInput
              label="城市编码"
              value={configForm.cityCode || ''}
              onChange={(e) => setConfigForm({ ...configForm, cityCode: e.target.value })}
              placeholder="210100"
              required
            />
          </div>
          <FormTextarea
            label="平台公钥"
            value={configForm.publicKey || ''}
            onChange={(e) => setConfigForm({ ...configForm, publicKey: e.target.value })}
            placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
            rows={4}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={configForm.enabled}
              onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              启用省级平台对接
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveConfig} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              保存配置
            </button>
            <button onClick={() => setConfigModalOpen(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={syncModalOpen}
        onClose={() => {
          setSyncModalOpen(false);
          setSyncResult(null);
        }}
        title="批量同步结果"
        size="md"
      >
        <div className="space-y-6 text-center py-6">
          {isSyncing ? (
            <>
              <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">正在同步数据...</h3>
                <p className="text-gray-500 mt-2">请稍候，正在同步结算批次到省级平台</p>
              </div>
            </>
          ) : syncResult ? (
            <>
              <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">同步完成</h3>
                <p className="text-gray-500 mt-2">已完成批量同步操作</p>
              </div>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-success-600">{syncResult.success}</p>
                  <p className="text-sm text-gray-500">成功</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-danger-600">{syncResult.failed}</p>
                  <p className="text-sm text-gray-500">失败</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSyncModalOpen(false);
                  setSyncResult(null);
                }}
                className="btn-primary px-8"
              >
                确定
              </button>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
