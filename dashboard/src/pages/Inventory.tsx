import React, { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  History,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Bell,
  FileText,
  TrendingUp,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { useInventoryStore } from '../stores/inventoryStore';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { FormInput, FormTextarea } from '../components/common/FormInput';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PieChart } from '../components/common/PieChart';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type {
  Inventory,
  InventoryLog,
  ReplenishmentRecord,
  InventoryAlert,
  ReconciliationRecord,
  InventoryAlertStatus,
} from '@shared/types';

type TabType = 'inventory' | 'replenishment' | 'alerts';

export default function Inventory() {
  const {
    inventoryList,
    inventoryLogs,
    replenishmentRecords,
    inventoryAlerts,
    reconciliationRecords,
    verificationSourceDistribution,
    inventoryTrend,
    isLoading,
    pagination,
    replenishmentPagination,
    fetchInventory,
    fetchInventoryLogs,
    replenishInventory,
    fetchVerificationSourceDistribution,
    fetchInventoryTrend,
    fetchReplenishmentRecords,
    createReplenishment,
    approveReplenishment,
    cancelReplenishment,
    fetchReconciliationRecords,
    fetchInventoryAlerts,
    handleInventoryAlert,
  } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

  const [replenishModal, setReplenishModal] = useState<{
    open: boolean;
    inventory: Inventory | null;
  }>({ open: false, inventory: null });
  const [logsModal, setLogsModal] = useState<{
    open: boolean;
    inventory: Inventory | null;
  }>({ open: false, inventory: null });
  const [reconDetailModal, setReconDetailModal] = useState<{
    open: boolean;
    inventory: Inventory | null;
  }>({ open: false, inventory: null });
  const [alertDetailModal, setAlertDetailModal] = useState<{
    open: boolean;
    alert: InventoryAlert | null;
  }>({ open: false, alert: null });

  const [replenishQuantity, setReplenishQuantity] = useState(100);
  const [replenishUnitCost, setReplenishUnitCost] = useState(0);
  const [replenishSupplier, setReplenishSupplier] = useState('');
  const [replenishRemark, setReplenishRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replenishStatusFilter, setReplenishStatusFilter] = useState<string>('');
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('');
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchInventory({
      page: 1,
      pageSize: 10,
      lowStock: lowStockOnly || undefined,
    });
  }, [fetchInventory, lowStockOnly]);

  useEffect(() => {
    if (activeTab === 'replenishment') {
      fetchReplenishmentRecords({
        page: 1,
        pageSize: 10,
        status: replenishStatusFilter || undefined,
      });
    }
  }, [activeTab, fetchReplenishmentRecords, replenishStatusFilter]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchInventoryAlerts({
        page: 1,
        pageSize: 10,
        level: alertLevelFilter || undefined,
        status: alertStatusFilter || undefined,
      });
    }
  }, [activeTab, fetchInventoryAlerts, alertLevelFilter, alertStatusFilter]);

  const toggleRowExpand = async (inventory: Inventory) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(inventory.id)) {
      newExpanded.delete(inventory.id);
    } else {
      newExpanded.add(inventory.id);
      setSelectedInventory(inventory);
      await Promise.all([
        fetchVerificationSourceDistribution(inventory.id),
        fetchInventoryTrend(inventory.id, 7),
        fetchReconciliationRecords({ inventoryId: inventory.id, page: 1, pageSize: 5 }),
      ]);
    }
    setExpandedRows(newExpanded);
  };

  const filteredInventory = inventoryList.filter(
    (i) =>
      i.activity?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.batchNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventoryList.filter((i) => i.availableQuantity < 100).length;
  const totalValue = inventoryList.reduce(
    (sum, i) => sum + (i.unitCost || 0) * i.availableQuantity,
    0
  );

  const pendingReplenishCount = replenishmentRecords.filter((r) => r.status === 'pending').length;
  const activeAlertCount = inventoryAlerts.filter(
    (a) => a.status === 'pending' || a.status === 'processing'
  ).length;

  const handleReplenish = async () => {
    if (!replenishModal.inventory || replenishQuantity <= 0) return;
    setSubmitting(true);
    try {
      if (activeTab === 'inventory') {
        await replenishInventory(
          replenishModal.inventory.id,
          replenishQuantity,
          replenishRemark
        );
        await fetchInventory({
          page: pagination.page,
          pageSize: pagination.pageSize,
          lowStock: lowStockOnly || undefined,
        });
      } else {
        await createReplenishment({
          inventoryId: replenishModal.inventory.id,
          batchNo: replenishModal.inventory.batchNo,
          quantity: replenishQuantity,
          unitCost: replenishUnitCost,
          supplier: replenishSupplier,
          remark: replenishRemark,
        });
        await fetchReplenishmentRecords({
          page: replenishmentPagination.page,
          pageSize: replenishmentPagination.pageSize,
          status: replenishStatusFilter || undefined,
        });
      }
      setReplenishModal({ open: false, inventory: null });
      setReplenishQuantity(100);
      setReplenishUnitCost(0);
      setReplenishSupplier('');
      setReplenishRemark('');
    } finally {
      setSubmitting(false);
    }
  };

  const openLogsModal = async (inventory: Inventory) => {
    setLogsModal({ open: true, inventory });
    await fetchInventoryLogs(inventory.id);
  };

  const openReconDetailModal = async (inventory: Inventory) => {
    setReconDetailModal({ open: true, inventory });
    await fetchReconciliationRecords({ inventoryId: inventory.id, page: 1, pageSize: 20 });
  };

  const handleApproveReplenish = async (id: string) => {
    await approveReplenishment(id);
    await fetchReplenishmentRecords({
      page: replenishmentPagination.page,
      pageSize: replenishmentPagination.pageSize,
      status: replenishStatusFilter || undefined,
    });
  };

  const handleCancelReplenish = async (id: string) => {
    await cancelReplenishment(id);
    await fetchReplenishmentRecords({
      page: replenishmentPagination.page,
      pageSize: replenishmentPagination.pageSize,
      status: replenishStatusFilter || undefined,
    });
  };

  const handleAlertStatus = async (id: string, status: InventoryAlertStatus) => {
    await handleInventoryAlert(id, status);
    await fetchInventoryAlerts({
      page: 1,
      pageSize: 10,
      level: alertLevelFilter || undefined,
      status: alertStatusFilter || undefined,
    });
    setAlertDetailModal({ open: false, alert: null });
  };

  const getDetailTypeLabel = (detailType: string) => {
    const labels: Record<string, string> = {
      receive_in: '发放入库',
      verify_out: '核销扣减',
      adjust: '调账',
      expire_loss: '过期损耗',
      system_adjust: '系统调整',
    };
    return labels[detailType] || detailType;
  };

  const getTerminalLabel = (terminal?: string) => {
    const labels: Record<string, string> = {
      pos: 'POS机具',
      miniapp: '小程序码',
      citycode: '城市码',
    };
    return terminal ? labels[terminal] || terminal : '-';
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      merchant: '商户管理员',
      cashier: '收银员',
      risk_officer: '风控专员',
    };
    return role ? labels[role] || role : '-';
  };

  const sourcePieData = verificationSourceDistribution
    ? [
        { name: 'POS机具', value: verificationSourceDistribution.pos },
        { name: '小程序码', value: verificationSourceDistribution.miniapp },
        { name: '城市码', value: verificationSourceDistribution.citycode },
      ]
    : [];

  const trendChartData = inventoryTrend.map((t) => ({
    date: t.date,
    count: t.quantity,
    amount: 0,
  }));

  const stockColumns = [
    {
      key: 'expand',
      header: '',
      width: '40px',
      render: (row: Inventory) => (
        <button
          onClick={() => toggleRowExpand(row)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {expandedRows.has(row.id) ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      ),
    },
    {
      key: 'batchNo',
      header: '批次号',
      render: (row: Inventory) => (
        <span className="font-mono text-xs">{row.batchNo}</span>
      ),
    },
    {
      key: 'coupon',
      header: '优惠券',
      render: (row: Inventory) => (
        <div>
          <p className="font-medium text-gray-800">{row.activity?.name}</p>
          <p className="text-xs text-gray-500">ID: {row.activityId}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '库存情况',
      render: (row: Inventory) => {
        const percentage = (row.availableQuantity / row.quantity) * 100;
        const isLow = row.availableQuantity < 100;
        return (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">
                {row.availableQuantity.toLocaleString()} /{' '}
                {row.quantity.toLocaleString()}
              </span>
              {isLow && (
                <span className="flex items-center gap-1 text-xs text-danger-600">
                  <AlertTriangle className="w-3 h-3" />
                  低库存
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isLow
                    ? 'bg-danger-500'
                    : percentage < 50
                    ? 'bg-warning-500'
                    : 'bg-success-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'reconciliation',
      header: '对账状态',
      render: (row: Inventory) => {
        const recon = reconciliationRecords.find((r) => r.inventoryId === row.id);
        return recon ? (
          <div>
            <StatusBadge status={recon.status} type="reconciliation" />
            {recon.lastReconciledAt && (
              <p className="text-xs text-gray-400 mt-1">
                {dayjs(recon.lastReconciledAt).format('MM-DD HH:mm')}
              </p>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        );
      },
    },
    {
      key: 'expiry',
      header: '有效期',
      render: (row: Inventory) => (
        <div className="text-sm">
          {row.expiryDate ? (
            <>
              <p>{dayjs(row.expiryDate).format('YYYY-MM-DD')}</p>
              <p className="text-gray-400 text-xs">
                {dayjs(row.expiryDate).diff(dayjs(), 'day')} 天后过期
              </p>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'unitCost',
      header: '单价',
      align: 'right' as const,
      render: (row: Inventory) =>
        row.unitCost ? `¥${row.unitCost.toFixed(2)}` : '-',
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center' as const,
      width: '120px',
      render: (row: Inventory) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openLogsModal(row)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="库存日志"
          >
            <History className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setReplenishModal({ open: true, inventory: row })}
            className="p-1.5 hover:bg-primary-50 rounded transition-colors"
            title="补货"
          >
            <Plus className="w-4 h-4 text-primary-600" />
          </button>
        </div>
      ),
    },
  ];

  const replenishColumns = [
    {
      key: 'batchNo',
      header: '批次号',
      render: (row: ReplenishmentRecord) => (
        <span className="font-mono text-xs">{row.batchNo}</span>
      ),
    },
    {
      key: 'quantity',
      header: '补货数量',
      align: 'right' as const,
      render: (row: ReplenishmentRecord) => (
        <span className="font-medium">{row.quantity.toLocaleString()}</span>
      ),
    },
    {
      key: 'unitCost',
      header: '单价',
      align: 'right' as const,
      render: (row: ReplenishmentRecord) => `¥${row.unitCost.toFixed(2)}`,
    },
    {
      key: 'supplier',
      header: '供应商',
      render: (row: ReplenishmentRecord) => row.supplier,
    },
    {
      key: 'operator',
      header: '操作人',
      render: (row: ReplenishmentRecord) => (
        <div>
          <p className="text-sm">{row.operatorName}</p>
          <p className="text-xs text-gray-400">{getRoleLabel(row.operatorRole)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ReplenishmentRecord) => (
        <StatusBadge status={row.status} type="replenishment" />
      ),
    },
    {
      key: 'createdAt',
      header: '申请时间',
      render: (row: ReplenishmentRecord) =>
        dayjs(row.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center' as const,
      width: '120px',
      render: (row: ReplenishmentRecord) => (
        <div className="flex items-center justify-center gap-1">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveReplenish(row.id)}
                className="p-1.5 hover:bg-success-50 rounded transition-colors"
                title="批准"
              >
                <Check className="w-4 h-4 text-success-600" />
              </button>
              <button
                onClick={() => handleCancelReplenish(row.id)}
                className="p-1.5 hover:bg-danger-50 rounded transition-colors"
                title="取消"
              >
                <X className="w-4 h-4 text-danger-600" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const alertColumns = [
    {
      key: 'type',
      header: '预警类型',
      render: (row: InventoryAlert) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning-500" />
          <span className="font-medium text-gray-800">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'batchNo',
      header: '关联批次',
      render: (row: InventoryAlert) => (
        <span className="font-mono text-xs">{row.batchNo}</span>
      ),
    },
    {
      key: 'level',
      header: '预警等级',
      render: (row: InventoryAlert) => (
        <StatusBadge status={row.level} type="inventoryAlertLevel" />
      ),
    },
    {
      key: 'status',
      header: '处理状态',
      render: (row: InventoryAlert) => (
        <StatusBadge status={row.status} type="inventoryAlertStatus" />
      ),
    },
    {
      key: 'value',
      header: '当前值/阈值',
      align: 'right' as const,
      render: (row: InventoryAlert) => (
        <div className="text-sm">
          <p>
            当前: <span className="font-medium">{row.currentValue}</span>
          </p>
          {row.threshold !== undefined && (
            <p className="text-gray-400 text-xs">阈值: {row.threshold}</p>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '触发时间',
      render: (row: InventoryAlert) =>
        dayjs(row.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'actions',
      header: '操作',
      align: 'center' as const,
      width: '80px',
      render: (row: InventoryAlert) => (
        <button
          onClick={() => setAlertDetailModal({ open: true, alert: row })}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="查看详情"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      ),
    },
  ];

  const logColumns = [
    {
      key: 'detailType',
      header: '类型',
      render: (row: InventoryLog) => (
        <div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              row.type === 'in'
                ? 'bg-success-50 text-success-600'
                : row.type === 'out'
                ? 'bg-danger-50 text-danger-600'
                : 'bg-warning-50 text-warning-600'
            }`}
          >
            {getDetailTypeLabel(row.detailType)}
          </span>
        </div>
      ),
    },
    {
      key: 'sourceTerminal',
      header: '来源终端',
      render: (row: InventoryLog) => getTerminalLabel(row.sourceTerminal),
    },
    {
      key: 'relatedOrderNo',
      header: '关联订单',
      render: (row: InventoryLog) =>
        row.relatedOrderNo ? (
          <span className="font-mono text-xs">{row.relatedOrderNo}</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'quantity',
      header: '数量',
      align: 'right' as const,
      render: (row: InventoryLog) => (
        <span
          className={`font-medium ${
            row.quantity > 0 ? 'text-success-600' : 'text-danger-600'
          }`}
        >
          {row.quantity > 0 ? '+' : ''}
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'balance',
      header: '结存',
      align: 'right' as const,
      render: (row: InventoryLog) => row.balance.toLocaleString(),
    },
    {
      key: 'operator',
      header: '操作人',
      render: (row: InventoryLog) => (
        <div>
          <p className="text-sm">{row.operatorName}</p>
          <p className="text-xs text-gray-400">{getRoleLabel(row.operatorRole)}</p>
        </div>
      ),
    },
    {
      key: 'remark',
      header: '备注',
      render: (row: InventoryLog) => row.remark || '-',
    },
    {
      key: 'createdAt',
      header: '操作时间',
      render: (row: InventoryLog) =>
        dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const reconColumns = [
    {
      key: 'period',
      header: '对账周期',
      render: (row: ReconciliationRecord) => (
        <div>
          <p className="text-sm">
            {dayjs(row.periodStart).format('YYYY-MM-DD')} ~{' '}
            {dayjs(row.periodEnd).format('YYYY-MM-DD')}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: ReconciliationRecord) => (
        <StatusBadge status={row.status} type="reconciliation" />
      ),
    },
    {
      key: 'expected',
      header: '预期数量',
      align: 'right' as const,
      render: (row: ReconciliationRecord) => row.expectedQuantity.toLocaleString(),
    },
    {
      key: 'actual',
      header: '实际数量',
      align: 'right' as const,
      render: (row: ReconciliationRecord) => row.actualQuantity.toLocaleString(),
    },
    {
      key: 'diff',
      header: '差异',
      align: 'right' as const,
      render: (row: ReconciliationRecord) => (
        <div>
          <p
            className={`font-medium ${
              row.diffQuantity > 0
                ? 'text-success-600'
                : row.diffQuantity < 0
                ? 'text-danger-600'
                : 'text-gray-600'
            }`}
          >
            {row.diffQuantity > 0 ? '+' : ''}
            {row.diffQuantity}
          </p>
          <p
            className={`text-xs ${
              row.diffAmount > 0
                ? 'text-success-500'
                : row.diffAmount < 0
                ? 'text-danger-500'
                : 'text-gray-400'
            }`}
          >
            ¥{row.diffAmount > 0 ? '+' : ''}
            {row.diffAmount.toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      key: 'reconciledBy',
      header: '对账人',
      render: (row: ReconciliationRecord) => row.reconciledBy || '-',
    },
    {
      key: 'lastReconciledAt',
      header: '对账时间',
      render: (row: ReconciliationRecord) =>
        row.lastReconciledAt
          ? dayjs(row.lastReconciledAt).format('YYYY-MM-DD HH:mm')
          : '-',
    },
  ];

  const renderExpandedRow = (inventory: Inventory) => {
    const recon = reconciliationRecords.find((r) => r.inventoryId === inventory.id);

    return (
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary-500" />
              核销来源分布
            </h4>
            {verificationSourceDistribution ? (
              <PieChart data={sourcePieData} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                加载中...
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success-500" />
              近7天库存变化
            </h4>
            {inventoryTrend.length > 0 ? (
              <div className="h-[180px]">
                <MiniLineChart data={inventoryTrend} />
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
                加载中...
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning-500" />
              对账信息
            </h4>
            {recon ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">对账状态</span>
                  <StatusBadge status={recon.status} type="reconciliation" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">最近对账</span>
                  <span className="text-sm text-gray-800">
                    {recon.lastReconciledAt
                      ? dayjs(recon.lastReconciledAt).format('MM-DD HH:mm')
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">差异金额</span>
                  <span
                    className={`text-sm font-medium ${
                      recon.diffAmount > 0
                        ? 'text-success-600'
                        : recon.diffAmount < 0
                        ? 'text-danger-600'
                        : 'text-gray-600'
                    }`}
                  >
                    ¥{recon.diffAmount > 0 ? '+' : ''}
                    {recon.diffAmount.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => openReconDetailModal(inventory)}
                  className="w-full mt-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  查看对账明细
                </button>
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm">
                暂无对账记录
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MiniLineChart = ({ data }: { data: any[] }) => {
    const max = Math.max(...data.map((d) => d.quantity));
    const min = Math.min(...data.map((d) => d.quantity));
    const range = max - min || 1;
    const width = 100;
    const height = 100;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.quantity - min) / range) * height;
      return `${x},${y}`;
    });
    const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

    return (
      <div className="h-full flex flex-col">
        <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 w-full">
          <defs>
            <linearGradient id="miniGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#miniGradient)" />
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#1E40AF"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          {data.map((d, i) => (
            <span key={i}>{d.date}</span>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading && inventoryList.length === 0 && activeTab === 'inventory') {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">库存管理</h1>
          <p className="text-gray-500 mt-1">管理优惠券库存和补货</p>
        </div>
        <button
          className="btn-outline flex items-center gap-2"
          onClick={() => {
            if (activeTab === 'inventory') {
              fetchInventory({
                page: 1,
                pageSize: 10,
                lowStock: lowStockOnly || undefined,
              });
            } else if (activeTab === 'replenishment') {
              fetchReplenishmentRecords({
                page: 1,
                pageSize: 10,
                status: replenishStatusFilter || undefined,
              });
            } else {
              fetchInventoryAlerts({
                page: 1,
                pageSize: 10,
                level: alertLevelFilter || undefined,
                status: alertStatusFilter || undefined,
              });
            }
          }}
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="库存总价值"
          value={totalValue}
          prefix="¥"
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="库存批次"
          value={inventoryList.length}
          suffix=" 批"
          icon={<Package className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="低库存预警"
          value={lowStockCount}
          suffix=" 批"
          icon={<AlertTriangle className="w-5 h-5" />}
          color={lowStockCount > 0 ? 'red' : 'blue'}
        />
        <StatCard
          title="待处理预警"
          value={activeAlertCount}
          suffix=" 条"
          icon={<Bell className="w-5 h-5" />}
          color={activeAlertCount > 0 ? 'orange' : 'blue'}
        />
      </div>

      <div className="card">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              库存列表
            </button>
            <button
              onClick={() => setActiveTab('replenishment')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === 'replenishment'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              补货流水
              {pendingReplenishCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-danger-500 text-white rounded-full">
                  {pendingReplenishCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === 'alerts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              预警记录
              {activeAlertCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-warning-500 text-white rounded-full">
                  {activeAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'inventory' && (
          <>
            <div className="p-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] max-w-md">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索优惠券名称或批次号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">仅显示低库存</span>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {stockColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                        style={{ width: col.width }}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInventory.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        {stockColumns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-sm text-gray-700 ${
                              col.align === 'center'
                                ? 'text-center'
                                : col.align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                          </td>
                        ))}
                      </tr>
                      {expandedRows.has(row.id) && (
                        <tr>
                          <td colSpan={stockColumns.length} className="p-0">
                            {renderExpandedRow(row)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                共 {pagination.total.toLocaleString()} 条，第 {pagination.page} /{' '}
                {Math.ceil(pagination.total / pagination.pageSize)} 页
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    fetchInventory({
                      page: pagination.page - 1,
                      pageSize: pagination.pageSize,
                      lowStock: lowStockOnly || undefined,
                    })
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <button
                  onClick={() =>
                    fetchInventory({
                      page: pagination.page + 1,
                      pageSize: pagination.pageSize,
                      lowStock: lowStockOnly || undefined,
                    })
                  }
                  disabled={
                    pagination.page >=
                    Math.ceil(pagination.total / pagination.pageSize)
                  }
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'replenishment' && (
          <>
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={replenishStatusFilter}
                  onChange={(e) => setReplenishStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已批准</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setReplenishModal({
                    open: true,
                    inventory: inventoryList[0] || null,
                  })
                }
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                申请补货
              </button>
            </div>

            <DataTable
              columns={replenishColumns}
              data={replenishmentRecords}
              loading={isLoading}
              pagination={{
                page: replenishmentPagination.page,
                pageSize: replenishmentPagination.pageSize,
                total: replenishmentPagination.total,
                onPageChange: (page) =>
                  fetchReplenishmentRecords({
                    page,
                    pageSize: replenishmentPagination.pageSize,
                    status: replenishStatusFilter || undefined,
                  }),
              }}
              rowKey={(row) => row.id}
            />
          </>
        )}

        {activeTab === 'alerts' && (
          <>
            <div className="p-4 flex flex-wrap items-center gap-3">
              <select
                value={alertLevelFilter}
                onChange={(e) => setAlertLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部等级</option>
                <option value="normal">正常</option>
                <option value="attention">关注</option>
                <option value="warning">警告</option>
                <option value="critical">严重</option>
              </select>
              <select
                value={alertStatusFilter}
                onChange={(e) => setAlertStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="ignored">已忽略</option>
              </select>
            </div>

            <DataTable
              columns={alertColumns}
              data={inventoryAlerts}
              loading={isLoading}
              rowKey={(row) => row.id}
            />
          </>
        )}
      </div>

      <Modal
        visible={replenishModal.open}
        onClose={() => setReplenishModal({ open: false, inventory: null })}
        title={`补货申请 - ${replenishModal.inventory?.activity?.name}`}
        size="sm"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => setReplenishModal({ open: false, inventory: null })}
            >
              取消
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleReplenish}
              disabled={submitting || replenishQuantity <= 0}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  确认申请
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">当前库存</p>
            <p className="text-lg font-bold text-gray-800">
              {replenishModal.inventory?.availableQuantity.toLocaleString()} 张
            </p>
          </div>
          <FormInput
            label="补货数量"
            type="number"
            min={1}
            value={replenishQuantity}
            onChange={(e) => setReplenishQuantity(Number(e.target.value))}
            placeholder="请输入补货数量"
            required
          />
          {activeTab !== 'inventory' && (
            <>
              <FormInput
                label="单价 (元)"
                type="number"
                min={0}
                step="0.01"
                value={replenishUnitCost}
                onChange={(e) => setReplenishUnitCost(Number(e.target.value))}
                placeholder="请输入单价"
              />
              <FormInput
                label="供应商"
                type="text"
                value={replenishSupplier}
                onChange={(e) => setReplenishSupplier(e.target.value)}
                placeholder="请输入供应商名称"
              />
            </>
          )}
          <FormTextarea
            label="备注"
            value={replenishRemark}
            onChange={(e) => setReplenishRemark(e.target.value)}
            placeholder="请输入备注信息（选填）"
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        visible={logsModal.open}
        onClose={() => setLogsModal({ open: false, inventory: null })}
        title={`库存日志 - ${logsModal.inventory?.batchNo}`}
        size="xl"
      >
        <DataTable
          columns={logColumns}
          data={inventoryLogs}
          loading={isLoading}
          rowKey={(row) => row.id}
        />
      </Modal>

      <Modal
        visible={reconDetailModal.open}
        onClose={() => setReconDetailModal({ open: false, inventory: null })}
        title={`对账明细 - ${reconDetailModal.inventory?.batchNo}`}
        size="lg"
      >
        <DataTable
          columns={reconColumns}
          data={reconciliationRecords}
          loading={isLoading}
          rowKey={(row) => row.id}
        />
      </Modal>

      <Modal
        visible={alertDetailModal.open}
        onClose={() => setAlertDetailModal({ open: false, alert: null })}
        title="预警详情"
        size="md"
        footer={
          alertDetailModal.alert?.status === 'pending' ||
          alertDetailModal.alert?.status === 'processing' ? (
            <>
              <button
                className="btn-outline"
                onClick={() =>
                  alertDetailModal.alert &&
                  handleAlertStatus(alertDetailModal.alert.id, 'ignored')
                }
              >
                忽略
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  alertDetailModal.alert &&
                  handleAlertStatus(alertDetailModal.alert.id, 'processing')
                }
              >
                开始处理
              </button>
            </>
          ) : alertDetailModal.alert?.status === 'processing' ? (
            <>
              <button
                className="btn-outline"
                onClick={() =>
                  alertDetailModal.alert &&
                  handleAlertStatus(alertDetailModal.alert.id, 'ignored')
                }
              >
                忽略
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  alertDetailModal.alert &&
                  handleAlertStatus(alertDetailModal.alert.id, 'resolved')
                }
              >
                标记已解决
              </button>
            </>
          ) : null
        }
      >
        {alertDetailModal.alert && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge
                status={alertDetailModal.alert.level}
                type="inventoryAlertLevel"
              />
              <StatusBadge
                status={alertDetailModal.alert.status}
                type="inventoryAlertStatus"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800">
                {alertDetailModal.alert.title}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                批次: {alertDetailModal.alert.batchNo}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{alertDetailModal.alert.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">当前值</p>
                <p className="text-lg font-medium text-gray-800">
                  {alertDetailModal.alert.currentValue ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">预警阈值</p>
                <p className="text-lg font-medium text-gray-800">
                  {alertDetailModal.alert.threshold ?? '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">触发时间</p>
              <p className="text-gray-800">
                {dayjs(alertDetailModal.alert.createdAt).format(
                  'YYYY-MM-DD HH:mm:ss'
                )}
              </p>
            </div>
            {alertDetailModal.alert.handlerName && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">处理人</p>
                <p className="text-gray-800">
                  {alertDetailModal.alert.handlerName}
                </p>
                {alertDetailModal.alert.handlerNotes && (
                  <div className="mt-2 p-3 bg-primary-50 rounded-lg">
                    <p className="text-sm text-primary-700">
                      {alertDetailModal.alert.handlerNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
