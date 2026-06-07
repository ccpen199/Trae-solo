import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Box, MapPin, Thermometer, Clock, Search } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import StatusBadge from '../../components/UI/StatusBadge';
import Modal from '../../components/UI/Modal';
import { cabinetApi } from '../../lib/api';
import type { Cabinet } from '../../lib/api';
import { useCabinetStore } from '../../store/cabinetStore';
import { cn } from '../../lib/utils';

export default function CabinetList() {
  const navigate = useNavigate();
  const { cabinets, setCabinets, addCabinet } = useCabinetStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newCabinet, setNewCabinet] = useState({
    name: '',
    location: '',
    totalCompartments: 20,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCabinets();
  }, []);

  const loadCabinets = async () => {
    setLoading(true);
    try {
      const result = await cabinetApi.getAll();
      if (result.success && result.data) {
        setCabinets(result.data as Cabinet[]);
      }
    } catch (error) {
      console.error('Failed to load cabinets:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newCabinet.name.trim()) errors.name = '请输入柜子名称';
    if (!newCabinet.location.trim()) errors.location = '请输入位置信息';
    if (newCabinet.totalCompartments < 1)
      errors.totalCompartments = '格子数量必须大于0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCabinet = async () => {
    if (!validateForm()) return;

    try {
      const result = await cabinetApi.create(newCabinet);
      if (result.success && result.data) {
        addCabinet(result.data as Cabinet);
        setShowCreateModal(false);
        setNewCabinet({ name: '', location: '', totalCompartments: 20 });
        setFormErrors({});
      }
    } catch (error) {
      console.error('Failed to create cabinet:', error);
    }
  };

  const filteredCabinets = (cabinets as Cabinet[]).filter((cabinet) => {
    const matchesSearch =
      cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cabinet.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || cabinet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">柜子管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理所有智能柜设备</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加柜子
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索柜子名称或位置..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
          <option value="maintenance">维护中</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 text-sm">加载中...</span>
          </div>
        </div>
      ) : filteredCabinets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-100">
          <Box className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-500">暂无柜子数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCabinets.map((cabinet) => {
            const occupancyRate =
              cabinet.totalCompartments > 0
                ? Math.round(
                    (cabinet.occupiedCompartments / cabinet.totalCompartments) *
                      100
                  )
                : 0;

            return (
              <div
                key={cabinet.id}
                onClick={() => navigate(`/cabinets/${cabinet.id}`)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-sky-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        cabinet.status === 'online'
                          ? 'bg-emerald-100'
                          : cabinet.status === 'maintenance'
                          ? 'bg-amber-100'
                          : 'bg-slate-100'
                      )}
                    >
                      <Box
                        className={cn(
                          'w-6 h-6',
                          cabinet.status === 'online'
                            ? 'text-emerald-600'
                            : cabinet.status === 'maintenance'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {cabinet.name}
                      </h3>
                      <StatusBadge status={cabinet.status} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{cabinet.location}</span>
                  </div>

                  {cabinet.temperature && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Thermometer className="w-4 h-4 text-slate-400" />
                      <span>{cabinet.temperature}°C</span>
                    </div>
                  )}

                  {cabinet.lastHeartbeat && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>最后心跳: {cabinet.lastHeartbeat}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">占用率</span>
                    <span className="text-sm font-medium text-slate-800">
                      {cabinet.occupiedCompartments}/{cabinet.totalCompartments} ({occupancyRate}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        occupancyRate > 80
                          ? 'bg-red-500'
                          : occupancyRate > 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      )}
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormErrors({});
        }}
        title="添加新柜子"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              柜子名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCabinet.name}
              onChange={(e) =>
                setNewCabinet({ ...newCabinet, name: e.target.value })
              }
              placeholder="例如：A栋1号柜"
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                formErrors.name ? 'border-red-300' : 'border-slate-200'
              )}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              位置信息 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCabinet.location}
              onChange={(e) =>
                setNewCabinet({ ...newCabinet, location: e.target.value })
              }
              placeholder="例如：A栋1楼大厅"
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                formErrors.location ? 'border-red-300' : 'border-slate-200'
              )}
            />
            {formErrors.location && (
              <p className="mt-1 text-xs text-red-500">
                {formErrors.location}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              格子数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={newCabinet.totalCompartments}
              onChange={(e) =>
                setNewCabinet({
                  ...newCabinet,
                  totalCompartments: parseInt(e.target.value) || 0,
                })
              }
              min="1"
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                formErrors.totalCompartments ? 'border-red-300' : 'border-slate-200'
              )}
            />
            {formErrors.totalCompartments && (
              <p className="mt-1 text-xs text-red-500">
                {formErrors.totalCompartments}
              </p>
            )}
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
              onClick={handleCreateCabinet}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              创建
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </Layout>
  );
}
