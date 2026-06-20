import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Eye, Edit, Ban, UserPlus,
  Loader2, ChevronLeft, ChevronRight,
  Phone, MapPin, Award, TrendingUp
} from 'lucide-react';
import dayjs from 'dayjs';
import { Table } from '@/components/ui';
import { get as apiGet, post as apiPost } from '@/utils/api';
import type { User } from 'shared/types';
import { cn } from '@/lib/utils';

interface Courier extends User {
  outletName: string;
  todayCompleted: number;
  monthRevenue: number;
  certificationStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

const mockCouriers: Courier[] = [
  {
    id: '1',
    username: 'courier001',
    name: '张建国',
    role: 'courier',
    phone: '13800138001',
    avatar: '',
    outletId: '1',
    outletName: '朝阳区建国路网点',
    certificationStatus: 'approved',
    todayCompleted: 15,
    monthRevenue: 12580,
    isActive: true,
    createdAt: '2023-06-15T00:00:00Z',
    lastLoginAt: '2024-01-15T08:30:00Z'
  },
  {
    id: '2',
    username: 'courier002',
    name: '李明华',
    role: 'courier',
    phone: '13800138002',
    avatar: '',
    outletId: '1',
    outletName: '朝阳区建国路网点',
    certificationStatus: 'approved',
    todayCompleted: 12,
    monthRevenue: 9860,
    isActive: true,
    createdAt: '2023-08-20T00:00:00Z',
    lastLoginAt: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    username: 'courier003',
    name: '王志强',
    role: 'courier',
    phone: '13800138003',
    avatar: '',
    outletId: '2',
    outletName: '海淀区中关村网点',
    certificationStatus: 'pending',
    todayCompleted: 8,
    monthRevenue: 6540,
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z',
    lastLoginAt: '2024-01-15T07:45:00Z'
  },
  {
    id: '4',
    username: 'courier004',
    name: '赵晓东',
    role: 'courier',
    phone: '13800138004',
    avatar: '',
    outletId: '2',
    outletName: '海淀区中关村网点',
    certificationStatus: 'approved',
    todayCompleted: 18,
    monthRevenue: 15230,
    isActive: true,
    createdAt: '2023-03-10T00:00:00Z',
    lastLoginAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '5',
    username: 'courier005',
    name: '陈大伟',
    role: 'courier',
    phone: '13800138005',
    avatar: '',
    outletId: '3',
    outletName: '西城区金融街网点',
    certificationStatus: 'rejected',
    todayCompleted: 0,
    monthRevenue: 0,
    isActive: false,
    createdAt: '2023-11-05T00:00:00Z',
    lastLoginAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '6',
    username: 'courier006',
    name: '刘晓明',
    role: 'courier',
    phone: '13800138006',
    avatar: '',
    outletId: '3',
    outletName: '西城区金融街网点',
    certificationStatus: 'approved',
    todayCompleted: 10,
    monthRevenue: 8750,
    isActive: true,
    createdAt: '2023-09-18T00:00:00Z',
    lastLoginAt: '2024-01-15T08:20:00Z'
  }
];

const certificationConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已认证', className: 'bg-green-100 text-green-800' },
  rejected: { label: '未通过', className: 'bg-red-100 text-red-800' }
};

export default function CourierList() {
  const navigate = useNavigate();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    idCard: '',
    outletId: '',
    username: '',
    password: ''
  });

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));

      const data = await apiGet<any>(`/couriers?${params.toString()}`);
      setCouriers(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Fetch couriers error:', error);
      let filtered = [...mockCouriers];
      if (searchKeyword) {
        filtered = filtered.filter(c => 
          c.name.includes(searchKeyword) || 
          c.phone.includes(searchKeyword)
        );
      }
      setTotal(filtered.length);
      const start = (page - 1) * pageSize;
      setCouriers(filtered.slice(start, start + pageSize));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchCouriers();
  };

  const handleAddCourier = async () => {
    try {
      await apiPost('/couriers', addForm);
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', idCard: '', outletId: '', username: '', password: '' });
      fetchCouriers();
    } catch (error) {
      console.error('Add courier error:', error);
      const newCourier: Courier = {
        id: String(Date.now()),
        username: addForm.username,
        name: addForm.name,
        role: 'courier',
        phone: addForm.phone,
        avatar: '',
        outletId: addForm.outletId,
        outletName: '新网点',
        certificationStatus: 'pending',
        todayCompleted: 0,
        monthRevenue: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: undefined
      };
      setCouriers([newCourier, ...couriers]);
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', idCard: '', outletId: '', username: '', password: '' });
    }
  };

  const handleDisableCourier = async (courier: Courier) => {
    if (!confirm(`确定要${courier.isActive ? '禁用' : '启用'}快递员 ${courier.name} 吗？`)) {
      return;
    }
    try {
      await apiPost(`/couriers/${courier.id}/${courier.isActive ? 'disable' : 'enable'}`, {});
      setCouriers(couriers.map(c => 
        c.id === courier.id ? { ...c, isActive: !c.isActive } : c
      ));
    } catch (error) {
      console.error('Disable courier error:', error);
      setCouriers(couriers.map(c => 
        c.id === courier.id ? { ...c, isActive: !c.isActive } : c
      ));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns = [
    {
      key: 'courier',
      title: '快递员',
      render: (row: Courier) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'outlet',
      title: '所属网点',
      render: (row: Courier) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{row.outletName}</span>
        </div>
      ),
    },
    {
      key: 'certification',
      title: '资质状态',
      render: (row: Courier) => {
        const config = certificationConfig[row.certificationStatus];
        return (
          <div className="flex items-center gap-2">
            <Award className={cn(
              'w-4 h-4',
              row.certificationStatus === 'approved' ? 'text-green-500' :
              row.certificationStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'
            )} />
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              config.className
            )}>
              {config.label}
            </span>
            {!row.isActive && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                已禁用
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'todayCompleted',
      title: '今日完成',
      render: (row: Courier) => (
        <span className={cn(
          'font-semibold',
          row.todayCompleted > 10 ? 'text-green-600' : 'text-gray-700'
        )}>
          {row.todayCompleted} 单
        </span>
      ),
    },
    {
      key: 'monthRevenue',
      title: '本月业绩',
      render: (row: Courier) => (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-orange-600">
            ¥{row.monthRevenue.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: Courier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/couriers/${row.id}`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            查看
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            编辑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDisableCourier(row);
            }}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              row.isActive 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-green-600 hover:bg-green-50'
            )}
          >
            <Ban className="w-4 h-4" />
            {row.isActive ? '禁用' : '启用'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">快递员管理</h1>
            <p className="text-gray-500 mt-1">管理和查看所有快递员信息</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            添加快递员
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总快递员数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已认证</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {couriers.filter(c => c.certificationStatus === 'approved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {couriers.filter(c => c.certificationStatus === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日总完成</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {couriers.reduce((sum, c) => sum + c.todayCompleted, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索快递员姓名或手机号..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={couriers}
                rowKey="id"
                onRowClick={(row) => navigate(`/couriers/${row.id}`)}
                emptyText="暂无快递员数据"
              />

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，
                    共 {total} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={cn(
                              'w-10 h-10 text-sm rounded-lg transition-colors',
                              page === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                添加快递员
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                <input
                  type="text"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">身份证号</label>
                <input
                  type="text"
                  value={addForm.idCard}
                  onChange={(e) => setAddForm({ ...addForm, idCard: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入身份证号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">所属网点</label>
                <select
                  value={addForm.outletId}
                  onChange={(e) => setAddForm({ ...addForm, outletId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择网点</option>
                  <option value="1">朝阳区建国路网点</option>
                  <option value="2">海淀区中关村网点</option>
                  <option value="3">西城区金融街网点</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">登录账号</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入登录账号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">初始密码</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入初始密码"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddCourier}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                确定添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
