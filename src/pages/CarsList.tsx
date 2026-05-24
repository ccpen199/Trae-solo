import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ClipboardCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Car as CarIcon,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getCars } from '@/api/modules/cars';
import type { Car, CarStatus } from '@/types';
import { CAR_BRANDS, STATUS_LABELS } from '@/utils/constants';
import { formatPrice, formatDate } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';

export default function CarsList() {
  const { user, checkRole } = useAuthStore();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    vin: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (filters.brand) params.brand = filters.brand;
      if (filters.status) params.status = filters.status;
      if (filters.minPrice) params.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) params.maxPrice = Number(filters.maxPrice);
      if (filters.vin) params.vin = filters.vin;
      const data = await getCars(params);
      setCars(data);
    } catch (error) {
      console.error('加载车源失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      vin: '',
    });
    setCurrentPage(1);
  };

  const canEdit = (car: Car) => {
    if (!user) return false;
    return checkRole(['admin']) || (checkRole(['dealer']) && car.dealerId === user.id);
  };

  const canCreateInspection = (car: Car) => {
    return checkRole(['inspector', 'admin']) && ['pending_inspection', 'inspection_rejected'].includes(car.status);
  };

  const canAppointment = (car: Car) => {
    return checkRole(['buyer', 'sales', 'admin']) && car.status === 'on_sale';
  };

  const totalPages = Math.ceil(cars.length / pageSize);
  const paginatedCars = cars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusOptions: CarStatus[] = [
    'draft',
    'pending_inspection',
    'inspecting',
    'inspection_rejected',
    'pending_audit',
    'on_sale',
    'locked',
    'sold',
    'off_shelf',
    'exception',
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              车源列表
            </h1>
            <p className="text-sm text-neutral-500">管理和查看所有车源信息</p>
          </div>
          {checkRole(['dealer', 'admin']) && (
            <button
              onClick={() => navigate('/cars/publish')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              快速发布
            </button>
          )}
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">品牌</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="input-field"
              >
                <option value="">全部品牌</option>
                {CAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">全部状态</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS.car[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">最低价格</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="万元"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">最高价格</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="万元"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">VIN搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={filters.vin}
                  onChange={(e) => handleFilterChange('vin', e.target.value)}
                  placeholder="输入VIN码"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    VIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    品牌
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    车型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    年份
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    里程(万公里)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    价格
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    车商
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedCars.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12">
                      <Empty message="暂无车源数据" icon={CarIcon} />
                    </td>
                  </tr>
                ) : (
                  paginatedCars.map((car) => (
                    <tr key={car.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-neutral-700">{car.vin}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{car.brand}</td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{car.model}</td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{car.year}</td>
                      <td className="px-4 py-4 text-sm text-neutral-700">{(car.mileage / 10000).toFixed(1)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-primary-700">
                        {formatPrice(car.price)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={car.status} type="car" />
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-700">
                        {car.dealer?.name || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-500">
                        {formatDate(car.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/cars/${car.id}`}
                            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canEdit(car) && (
                            <button
                              onClick={() => navigate(`/cars/publish?id=${car.id}`)}
                              className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canCreateInspection(car) && (
                            <button
                              onClick={() => navigate(`/inspections/create/${car.id}`)}
                              className="p-2 text-neutral-500 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                              title="发布检测"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </button>
                          )}
                          {canAppointment(car) && (
                            <button
                              onClick={() => navigate(`/appointments/create?carId=${car.id}`)}
                              className="p-2 text-neutral-500 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
                              title="预约看车"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && cars.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                共 {cars.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-700 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
