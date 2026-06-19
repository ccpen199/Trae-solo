import { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  History,
} from 'lucide-react';
import { useInventoryStore } from '../stores/inventoryStore';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { FormInput, FormTextarea } from '../components/common/FormInput';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type { Inventory, InventoryLog } from '@shared/types';

export default function Inventory() {
  const {
    inventoryList,
    inventoryLogs,
    isLoading,
    pagination,
    fetchInventory,
    fetchInventoryLogs,
    replenishInventory,
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [replenishModal, setReplenishModal] = useState<{
    open: boolean;
    inventory: Inventory | null;
  }>({ open: false, inventory: null });
  const [logsModal, setLogsModal] = useState<{
    open: boolean;
    inventory: Inventory | null;
  }>({ open: false, inventory: null });
  const [replenishQuantity, setReplenishQuantity] = useState(100);
  const [replenishRemark, setReplenishRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory({
      page: 1,
      pageSize: 10,
      lowStock: lowStockOnly || undefined,
    });
  }, [fetchInventory, lowStockOnly]);

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

  const handleReplenish = async () => {
    if (!replenishModal.inventory || replenishQuantity <= 0) return;
    setSubmitting(true);
    try {
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
      setReplenishModal({ open: false, inventory: null });
      setReplenishQuantity(100);
      setReplenishRemark('');
    } finally {
      setSubmitting(false);
    }
  };

  const openLogsModal = async (inventory: Inventory) => {
    setLogsModal({ open: true, inventory });
    await fetchInventoryLogs(inventory.id);
  };

  const stockColumns = [
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

  const logColumns = [
    {
      key: 'type',
      header: '类型',
      render: (row: InventoryLog) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.type === 'in'
              ? 'bg-success-50 text-success-600'
              : row.type === 'out'
              ? 'bg-danger-50 text-danger-600'
              : 'bg-warning-50 text-warning-600'
          }`}
        >
          {row.type === 'in' ? '入库' : row.type === 'out' ? '出库' : '调整'}
        </span>
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
      render: (row: InventoryLog) => row.operatorName,
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

  if (isLoading && inventoryList.length === 0) {
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
          onClick={() =>
            fetchInventory({
              page: 1,
              pageSize: 10,
              lowStock: lowStockOnly || undefined,
            })
          }
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
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

        <DataTable
          columns={stockColumns}
          data={filteredInventory}
          loading={isLoading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) =>
              fetchInventory({
                page,
                pageSize: pagination.pageSize,
                lowStock: lowStockOnly || undefined,
              }),
          }}
          rowKey={(row) => row.id}
        />
      </div>

      <Modal
        visible={replenishModal.open}
        onClose={() => setReplenishModal({ open: false, inventory: null })}
        title={`补货 - ${replenishModal.inventory?.activity?.name}`}
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
                  补货中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  确认补货
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
        size="lg"
      >
        <DataTable
          columns={logColumns}
          data={inventoryLogs}
          loading={isLoading}
          rowKey={(row) => row.id}
        />
      </Modal>
    </div>
  );
}
