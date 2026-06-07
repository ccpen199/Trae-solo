import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Scan, Filter } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import DataTable from '../../components/UI/DataTable';
import StatusBadge from '../../components/UI/StatusBadge';
import Modal from '../../components/UI/Modal';
import { packageApi, cabinetApi, compartmentApi } from '../../lib/api';
import type { PackageItem, Cabinet, Compartment } from '../../lib/api';
import { useCabinetStore } from '../../store/cabinetStore';
import { cn } from '../../lib/utils';

export default function PackageList() {
  const navigate = useNavigate();
  const { packages, setPackages, addPackage } = useCabinetStore();
  const [loading, setLoading] = useState(true);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    type: 'receive' as 'send' | 'receive' | 'storage',
    trackingNumber: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    cabinetId: '',
    compartmentId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packagesRes, cabinetsRes, compartmentsRes] = await Promise.all([
        packageApi.getAll(),
        cabinetApi.getAll(),
        compartmentApi.getAll(),
      ]);

      if (packagesRes.success && packagesRes.data) {
        setPackages(packagesRes.data as PackageItem[]);
      }

      if (cabinetsRes.success && cabinetsRes.data) {
        setCabinets(cabinetsRes.data as Cabinet[]);
      }

      if (compartmentsRes.success && compartmentsRes.data) {
        setCompartments(compartmentsRes.data as Compartment[]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newPackage.trackingNumber.trim())
      errors.trackingNumber = '请输入运单号';
    if (!newPackage.senderName.trim())
      errors.senderName = '请输入寄件人姓名';
    if (!newPackage.senderPhone.trim())
      errors.senderPhone = '请输入寄件人电话';
    if (!newPackage.receiverName.trim())
      errors.receiverName = '请输入收件人姓名';
    if (!newPackage.receiverPhone.trim())
      errors.receiverPhone = '请输入收件人电话';
    if (!newPackage.cabinetId) errors.cabinetId = '请选择柜子';
    if (!newPackage.compartmentId) errors.compartmentId = '请选择格子';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePackage = async () => {
    if (!validateForm()) return;

    try {
      const result = await packageApi.create(newPackage);
      if (result.success && result.data) {
        addPackage(result.data as PackageItem);
        setShowCreateModal(false);
        setNewPackage({
          type: 'receive',
          trackingNumber: '',
          senderName: '',
          senderPhone: '',
          receiverName: '',
          receiverPhone: '',
          cabinetId: '',
          compartmentId: '',
        });
        setFormErrors({});
      }
    } catch (error) {
      console.error('Failed to create package:', error);
    }
  };

  const filteredPackages = (packages as PackageItem[]).filter((pkg) => {
    const matchesSearch =
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.receiverName.includes(searchTerm) ||
      pkg.senderName.includes(searchTerm);
    const matchesType = typeFilter === 'all' || pkg.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'send':
        return '寄件';
      case 'receive':
        return '收件';
      case 'storage':
        return '存储';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'trackingNumber',
      title: '运单号',
      render: (item: PackageItem) => (
        <span className="font-medium text-sky-600">{item.trackingNumber}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (item: PackageItem) => (
        <span className="text-slate-600">{getTypeLabel(item.type)}</span>
      ),
    },
    {
      key: 'senderName',
      title: '寄件人',
      render: (item: PackageItem) => (
        <div>
          <p className="text-slate-700">{item.senderName}</p>
          <p className="text-xs text-slate-400">{item.senderPhone}</p>
        </div>
      ),
    },
    {
      key: 'receiverName',
      title: '收件人',
      render: (item: PackageItem) => (
        <div>
          <p className="text-slate-700">{item.receiverName}</p>
          <p className="text-xs text-slate-400">{item.receiverPhone}</p>
        </div>
      ),
    },
    {
      key: 'cabinetName',
      title: '柜子',
      render: (item: PackageItem) => (
        <span className="text-slate-600">
          {cabinets.find((c) => c.id === item.cabinetId)?.name || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (item: PackageItem) => (
        <StatusBadge
          status={
            (item.status as 'pending' | 'processing' | 'completed') || 'pending'
          }
        />
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (item: PackageItem) => (
        <span className="text-slate-500 text-sm">
          {new Date(item.createdAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
  ];

  const availableCompartments = compartments.filter(
    (c) =>
      c.cabinetId === newPackage.cabinetId &&
      (c.status === 'empty' || c.status === 'maintenance')
  );

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">包裹管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理所有包裹信息</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          扫描入库
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索运单号、寄件人、收件人..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部类型</option>
            <option value="send">寄件</option>
            <option value="receive">收件</option>
            <option value="storage">存储</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <DataTable
          columns={columns}
          data={filteredPackages}
          loading={loading}
          onRowClick={(item) => navigate(`/packages/${item.id}`)}
        />
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormErrors({});
        }}
        title="扫描入库"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                包裹类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={newPackage.type}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    type: e.target.value as 'send' | 'receive' | 'storage',
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="receive">收件</option>
                <option value="send">寄件</option>
                <option value="storage">存储</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                运单号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPackage.trackingNumber}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, trackingNumber: e.target.value })
                }
                placeholder="请输入运单号"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.trackingNumber
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.trackingNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.trackingNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                寄件人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPackage.senderName}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, senderName: e.target.value })
                }
                placeholder="请输入姓名"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.senderName ? 'border-red-300' : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.senderName && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.senderName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                寄件人电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newPackage.senderPhone}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, senderPhone: e.target.value })
                }
                placeholder="请输入电话"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.senderPhone ? 'border-red-300' : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.senderPhone && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.senderPhone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                收件人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPackage.receiverName}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, receiverName: e.target.value })
                }
                placeholder="请输入姓名"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.receiverName
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.receiverName && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.receiverName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                收件人电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newPackage.receiverPhone}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, receiverPhone: e.target.value })
                }
                placeholder="请输入电话"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.receiverPhone
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.receiverPhone && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.receiverPhone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择柜子 <span className="text-red-500">*</span>
              </label>
              <select
                value={newPackage.cabinetId}
                onChange={(e) =>
                  setNewPackage({
                    ...newPackage,
                    cabinetId: e.target.value,
                    compartmentId: '',
                  })
                }
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.cabinetId ? 'border-red-300' : 'border-slate-200 bg-slate-50'
                )}
              >
                <option value="">请选择柜子</option>
                {cabinets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.cabinetId && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.cabinetId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择格子 <span className="text-red-500">*</span>
              </label>
              <select
                value={newPackage.compartmentId}
                onChange={(e) =>
                  setNewPackage({ ...newPackage, compartmentId: e.target.value })
                }
                disabled={!newPackage.cabinetId}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50',
                  formErrors.compartmentId
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              >
                <option value="">请选择格子</option>
                {availableCompartments.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
              {formErrors.compartmentId && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.compartmentId}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormErrors({});
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreatePackage}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              确认入库
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </Layout>
  );
}
