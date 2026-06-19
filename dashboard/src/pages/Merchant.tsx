import { useEffect, useState } from 'react';
import { Store, Search, Filter, Plus, Eye, Edit, Check, X, Building2, MapPin, Phone, FileText, CreditCard } from 'lucide-react';
import { useMerchantStore } from '../stores/merchantStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable } from '../components/common/DataTable';
import { StatCard } from '../components/common/StatCard';
import { Loading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/common/FormInput';
import dayjs from 'dayjs';
import type { Merchant, SettlementRecord } from '@shared/types';

export default function Merchant() {
  const { merchants, settlements, isLoading, pagination, settlementPagination, fetchMerchants, fetchSettlements, createMerchant, updateMerchant, setSelectedMerchant, selectedMerchant } = useMerchantStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'list' | 'settlement'>('list');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Merchant>>({
    name: '',
    licenseNo: '',
    contactName: '',
    contactPhone: '',
    address: '',
    district: '',
    category: '',
    status: 'pending',
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMerchants({ page: currentPage, pageSize: 10 });
    } else {
      fetchSettlements({ page: currentPage, pageSize: 10 });
    }
  }, [currentPage, activeTab]);

  const handleFilter = () => {
    if (activeTab === 'list') {
      const params: any = { page: 1, pageSize: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (districtFilter !== 'all') params.district = districtFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      fetchMerchants(params);
    }
    setCurrentPage(1);
  };

  const handleViewDetail = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setDetailModalOpen(true);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      name: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      district: '',
      category: '',
      status: 'pending',
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (merchant: Merchant) => {
    setFormMode('edit');
    setFormData({ ...merchant });
    setFormModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (formMode === 'create') {
        await createMerchant(formData);
      } else if (formMode === 'edit' && formData.id) {
        await updateMerchant(formData.id, formData);
      }
      fetchMerchants({ page: currentPage, pageSize: 10 });
      setFormModalOpen(false);
    } catch (err) {
      console.error('保存商户失败', err);
    }
  };

  const columns = [
    {
      key: 'name',
      header: '商户名称',
      width: '200px',
      render: (item: Merchant) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.licenseNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: '行业分类',
      width: '120px',
      render: (item: Merchant) => item.category,
    },
    {
      key: 'district',
      header: '所属行政区',
      width: '120px',
      render: (item: Merchant) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          {item.district}
        </div>
      ),
    },
    {
      key: 'contact',
      header: '联系人',
      width: '150px',
      render: (item: Merchant) => (
        <div>
          <p className="font-medium text-gray-900">{item.contactName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {item.contactPhone}
          </p>
        </div>
      ),
    },
    {
      key: 'address',
      header: '地址',
      render: (item: Merchant) => <span className="text-gray-600">{item.address}</span>,
    },
    {
      key: 'status',
      header: '状态',
      width: '100px',
      render: (item: Merchant) => <StatusBadge status={item.status} type="merchant" />,
    },
    {
      key: 'createdAt',
      header: '创建时间',
      width: '160px',
      render: (item: Merchant) => dayjs(item.createdAt).format('YYYY-MM-DD'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '150px',
      render: (item: Merchant) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetail(item)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            详情
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="text-accent-500 hover:text-accent-600 text-sm font-medium flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            编辑
          </button>
        </div>
      ),
    },
  ];

  const settlementColumns = [
    {
      key: 'period',
      header: '结算周期',
      width: '200px',
      render: (item: SettlementRecord) => (
        <div>
          <p className="font-medium text-gray-900">
            {dayjs(item.periodStart).format('YYYY-MM-DD')} ~ {dayjs(item.periodEnd).format('YYYY-MM-DD')}
          </p>
          <p className="text-xs text-gray-500">创建于 {dayjs(item.createdAt).format('YYYY-MM-DD')}</p>
        </div>
      ),
    },
    {
      key: 'merchant',
      header: '商户',
      width: '150px',
      render: (item: SettlementRecord) => item.merchant?.name || '-',
    },
    {
      key: 'totalVerifications',
      header: '核销笔数',
      width: '100px',
      render: (item: SettlementRecord) => <span className="font-medium">{item.totalVerifications}</span>,
    },
    {
      key: 'totalAmount',
      header: '交易总额',
      width: '120px',
      render: (item: SettlementRecord) => <span className="font-medium">¥{item.totalAmount.toFixed(2)}</span>,
    },
    {
      key: 'subsidyAmount',
      header: '补贴金额',
      width: '120px',
      render: (item: SettlementRecord) => <span className="font-medium text-primary-600">¥{item.subsidyAmount.toFixed(2)}</span>,
    },
    {
      key: 'actualAmount',
      header: '实际结算',
      width: '120px',
      render: (item: SettlementRecord) => <span className="font-medium text-success-600">¥{item.actualAmount.toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: '状态',
      width: '100px',
      render: (item: SettlementRecord) => <StatusBadge status={item.status} type="settlement" />,
    },
    {
      key: 'transferTime',
      header: '转账时间',
      width: '160px',
      render: (item: SettlementRecord) => item.transferTime ? dayjs(item.transferTime).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  const filteredMerchants = merchants.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.contactPhone.includes(searchTerm)
  );

  const activeCount = merchants.filter((m) => m.status === 'active').length;
  const pendingCount = merchants.filter((m) => m.status === 'pending').length;
  const totalSettlementAmount = settlements.reduce((sum, s) => sum + s.actualAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商户管理</h1>
          <p className="text-gray-500 mt-1">管理平台入驻商户信息</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增商户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="入驻商户总数"
          value={pagination.total}
          color="blue"
          icon={<Store className="w-5 h-5" />}
          trend={15}
          trendLabel="较上月"
        />
        <StatCard
          title="正常营业商户"
          value={activeCount}
          color="green"
          icon={<Check className="w-5 h-5" />}
        />
        <StatCard
          title="待审核商户"
          value={pendingCount}
          color="orange"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="累计结算金额"
          value={`¥${totalSettlementAmount.toLocaleString()}`}
          color="green"
          icon={<CreditCard className="w-5 h-5" />}
        />
      </div>

      <div className="card">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => {
              setActiveTab('list');
              setCurrentPage(1);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            商户列表
          </button>
          <button
            onClick={() => {
              setActiveTab('settlement');
              setCurrentPage(1);
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'settlement'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            结算记录
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'list' ? (
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex-1 min-w-[200px] max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索商户名称、联系人或电话..."
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
                  <option value="active">正常营业</option>
                  <option value="pending">待审核</option>
                  <option value="inactive">已停用</option>
                </select>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="input w-32"
                >
                  <option value="all">全部行政区</option>
                  <option value="和平区">和平区</option>
                  <option value="沈河区">沈河区</option>
                  <option value="皇姑区">皇姑区</option>
                  <option value="大东区">大东区</option>
                  <option value="铁西区">铁西区</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-32"
                >
                  <option value="all">全部行业</option>
                  <option value="餐饮">餐饮</option>
                  <option value="零售">零售</option>
                  <option value="住宿">住宿</option>
                  <option value="娱乐">娱乐</option>
                  <option value="其他">其他</option>
                </select>
                <button onClick={handleFilter} className="btn-primary">
                  筛选
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-4">
              <select className="input w-40">
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
                <option value="transferred">已转账</option>
              </select>
            </div>
          )}

          {isLoading ? (
            <Loading />
          ) : activeTab === 'list' ? (
            <DataTable
              columns={columns}
              data={filteredMerchants}
              loading={isLoading}
              pagination={{
                page: currentPage,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onPageChange: (page) => setCurrentPage(page),
              }}
            />
          ) : (
            <DataTable
              columns={settlementColumns}
              data={settlements}
              loading={isLoading}
              pagination={{
                page: currentPage,
                pageSize: settlementPagination.pageSize,
                total: settlementPagination.total,
                onPageChange: (page) => setCurrentPage(page),
              }}
            />
          )}
        </div>
      </div>

      <Modal
        visible={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="商户详情"
        size="lg"
      >
        {selectedMerchant && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{selectedMerchant.name}</h3>
                <p className="text-gray-500">营业执照: {selectedMerchant.licenseNo}</p>
              </div>
              <StatusBadge status={selectedMerchant.status} type="merchant" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">行业分类</label>
                <p className="text-gray-900 mt-1">{selectedMerchant.category}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">所属行政区</label>
                <p className="text-gray-900 mt-1">{selectedMerchant.district}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">联系人</label>
                <p className="text-gray-900 mt-1">{selectedMerchant.contactName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-500">联系电话</label>
                <p className="text-gray-900 mt-1">{selectedMerchant.contactPhone}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">经营地址</label>
              <p className="text-gray-900 mt-1">{selectedMerchant.address}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">创建时间</label>
                  <p className="text-gray-900 mt-1">{dayjs(selectedMerchant.createdAt).format('YYYY-MM-DD')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">门店数量</label>
                  <p className="text-gray-900 mt-1">3 家</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">POS终端数</label>
                  <p className="text-gray-900 mt-1">8 台</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEdit(selectedMerchant);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑信息
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        visible={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={formMode === 'create' ? '新增商户' : '编辑商户'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="商户名称"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入商户名称"
              required
            />
            <FormInput
              label="营业执照号"
              value={formData.licenseNo || ''}
              onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
              placeholder="请输入营业执照号"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="行业分类"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '餐饮', label: '餐饮' },
                { value: '零售', label: '零售' },
                { value: '住宿', label: '住宿' },
                { value: '娱乐', label: '娱乐' },
                { value: '其他', label: '其他' },
              ]}
              required
            />
            <FormSelect
              label="所属行政区"
              value={formData.district || ''}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              options={[
                { value: '和平区', label: '和平区' },
                { value: '沈河区', label: '沈河区' },
                { value: '皇姑区', label: '皇姑区' },
                { value: '大东区', label: '大东区' },
                { value: '铁西区', label: '铁西区' },
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="联系人姓名"
              value={formData.contactName || ''}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="请输入联系人姓名"
              required
            />
            <FormInput
              label="联系电话"
              value={formData.contactPhone || ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="请输入联系电话"
              required
            />
          </div>
          <FormTextarea
            label="经营地址"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="请输入详细经营地址"
            rows={3}
            required
          />
          {formMode === 'edit' && (
            <FormSelect
              label="商户状态"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'active', label: '正常营业' },
                { value: 'inactive', label: '已停用' },
                { value: 'pending', label: '待审核' },
              ]}
            />
          )}
          <div className="flex gap-3 pt-4">
            <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {formMode === 'create' ? '创建商户' : '保存修改'}
            </button>
            <button onClick={() => setFormModalOpen(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
