import { useEffect, useState } from 'react';
import { Archive, Search, RefreshCw, Edit } from 'lucide-react';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { compartmentApi, cabinetApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Compartment {
  id: string;
  cabinetId: string;
  cabinetName?: string;
  code: string;
  size: 'small' | 'medium' | 'large';
  status: 'empty' | 'occupied' | 'locked' | 'maintenance';
  temperatureZone?: 'normal' | 'cool' | 'frozen';
  currentPackageId?: string;
}

interface Cabinet {
  id: string;
  name: string;
}

export default function CompartmentList() {
  const [loading, setLoading] = useState(true);
  const [compartments, setCompartments] = useState<Compartment[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cabinetFilter, setCabinetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [tempFilter, setTempFilter] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompartment, setSelectedCompartment] =
    useState<Compartment | null>(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compartmentsRes, cabinetsRes] = await Promise.all([
        compartmentApi.getAll(),
        cabinetApi.getAll(),
      ]);

      if (compartmentsRes.success && compartmentsRes.data) {
        setCompartments(compartmentsRes.data as Compartment[]);
      }

      if (cabinetsRes.success && cabinetsRes.data) {
        setCabinets(cabinetsRes.data as Cabinet[]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedCompartment || !editStatus) return;

    try {
      const result = await compartmentApi.updateStatus(
        selectedCompartment.id,
        editStatus
      );
      if (result.success) {
        setCompartments((prev) =>
          prev.map((c) =>
            c.id === selectedCompartment.id
              ? { ...c, status: editStatus as Compartment['status'] }
              : c
          )
        );
        setShowEditModal(false);
        setSelectedCompartment(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openEditModal = (compartment: Compartment) => {
    setSelectedCompartment(compartment);
    setEditStatus(compartment.status);
    setShowEditModal(true);
  };

  const filteredCompartments = compartments.filter((c) => {
    const matchesSearch = c.code
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCabinet =
      cabinetFilter === 'all' || c.cabinetId === cabinetFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSize = sizeFilter === 'all' || c.size === sizeFilter;
    const matchesTemp =
      tempFilter === 'all' || c.temperatureZone === tempFilter;
    return matchesSearch && matchesCabinet && matchesStatus && matchesSize && matchesTemp;
  });

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small':
        return '小号';
      case 'medium':
        return '中号';
      case 'large':
        return '大号';
      default:
        return size;
    }
  };

  const getTempLabel = (temp?: string) => {
    switch (temp) {
      case 'normal':
        return '常温';
      case 'cool':
        return '冷藏';
      case 'frozen':
        return '冷冻';
      default:
        return '-';
    }
  };

  const columns = [
    {
      key: 'code',
      title: '格子编号',
      render: (item: Compartment) => (
        <span className="font-medium text-sky-600">{item.code}</span>
      ),
    },
    {
      key: 'cabinetName',
      title: '所属柜子',
      render: (item: Compartment) => (
        <span className="text-slate-600">
          {cabinets.find((c) => c.id === item.cabinetId)?.name || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      title: '尺寸',
      render: (item: Compartment) => (
        <span className="text-slate-600">{getSizeLabel(item.size)}</span>
      ),
    },
    {
      key: 'temperatureZone',
      title: '温区',
      render: (item: Compartment) => (
        <span className="text-slate-600">{getTempLabel(item.temperatureZone)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (item: Compartment) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      render: (item: Compartment) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEditModal(item);
          }}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4 text-slate-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">格子管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理所有柜子的格子</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索格子编号..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={cabinetFilter}
            onChange={(e) => setCabinetFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部柜子</option>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部状态</option>
            <option value="empty">空闲</option>
            <option value="occupied">占用</option>
            <option value="locked">锁定</option>
            <option value="maintenance">维护</option>
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部尺寸</option>
            <option value="small">小号</option>
            <option value="medium">中号</option>
            <option value="large">大号</option>
          </select>

          <select
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部温区</option>
            <option value="normal">常温</option>
            <option value="cool">冷藏</option>
            <option value="frozen">冷冻</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Archive className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {compartments.length}
              </p>
              <p className="text-xs text-slate-500">总格子数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Archive className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {compartments.filter((c) => c.status === 'empty').length}
              </p>
              <p className="text-xs text-slate-500">空闲格子</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg">
              <Archive className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {compartments.filter((c) => c.status === 'occupied').length}
              </p>
              <p className="text-xs text-slate-500">占用格子</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Archive className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {
                  compartments.filter(
                    (c) => c.status === 'maintenance' || c.status === 'locked'
                  ).length
                }
              </p>
              <p className="text-xs text-slate-500">异常格子</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <DataTable
          columns={columns}
          data={filteredCompartments}
          loading={loading}
        />
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCompartment(null);
        }}
        title="更新格子状态"
        size="sm"
      >
        {selectedCompartment && (
          <div className="space-y-5">
            <div className="text-center">
              <div
                className={cn(
                  'w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-xl font-bold',
                  selectedCompartment.status === 'empty'
                    ? 'bg-slate-100 text-slate-600'
                    : selectedCompartment.status === 'occupied'
                    ? 'bg-sky-500 text-white'
                    : selectedCompartment.status === 'locked'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                )}
              >
                {selectedCompartment.code.replace(/[^0-9]/g, '')}
              </div>
              <h3 className="mt-3 font-semibold text-slate-800">
                {selectedCompartment.code}
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                状态
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="empty">空闲</option>
                <option value="occupied">占用</option>
                <option value="locked">锁定</option>
                <option value="maintenance">维护</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCompartment(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
