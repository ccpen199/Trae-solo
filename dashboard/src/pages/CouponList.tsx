import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { useCouponStore } from '../stores/couponStore';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type { CouponActivity } from '@shared/types';

export default function CouponList() {
  const navigate = useNavigate();
  const { coupons, pagination, isLoading, fetchCoupons, deleteCoupon } =
    useCouponStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    coupon: CouponActivity | null;
  }>({ open: false, coupon: null });

  useEffect(() => {
    fetchCoupons({
      page: 1,
      pageSize: 10,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    });
  }, [fetchCoupons, statusFilter, typeFilter]);

  const filteredCoupons = coupons.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteModal.coupon) {
      await deleteCoupon(deleteModal.coupon.id);
      fetchCoupons({
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setDeleteModal({ open: false, coupon: null });
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '100px',
      render: (row: CouponActivity) => (
        <span className="font-mono text-xs text-gray-500">{row.id}</span>
      ),
    },
    {
      key: 'name',
      header: '优惠券名称',
      render: (row: CouponActivity) => (
        <div>
          <p className="font-medium text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {row.type === 'fixed'
              ? '满减券'
              : row.type === 'discount'
              ? '折扣券'
              : '门槛券'}
            {' · '}
            {row.type === 'discount'
              ? `${row.value * 10}折`
              : `满${row.threshold}减${row.value}`}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '库存',
      align: 'right' as const,
      render: (row: CouponActivity) => (
        <div>
          <p className="font-medium text-gray-800">
            {row.usedQuantity.toLocaleString()} / {row.totalQuantity.toLocaleString()}
          </p>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 ml-auto">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(row.usedQuantity / row.totalQuantity) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'validity',
      header: '有效期',
      render: (row: CouponActivity) => (
        <div className="text-sm">
          <p>{dayjs(row.startTime).format('YYYY-MM-DD')}</p>
          <p className="text-gray-400">
            至 {dayjs(row.endTime).format('YYYY-MM-DD')}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      align: 'center' as const,
      render: (row: CouponActivity) => (
        <StatusBadge status={row.status} type="coupon" />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      width: '120px',
      align: 'center' as const,
      render: (row: CouponActivity) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => navigate(`/coupons/${row.id}`)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="查看"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => navigate(`/coupons/edit/${row.id}`)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setDeleteModal({ open: true, coupon: row })}
            className="p-1.5 hover:bg-danger-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-danger-500" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading && coupons.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">优惠券管理</h1>
          <p className="text-gray-500 mt-1">管理所有优惠券活动</p>
        </div>
        <Link to="/coupons/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建优惠券
        </Link>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索优惠券名称或ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="active">进行中</option>
              <option value="paused">已暂停</option>
              <option value="expired">已过期</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">全部类型</option>
              <option value="fixed">满减券</option>
              <option value="discount">折扣券</option>
              <option value="threshold">门槛券</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCoupons}
          loading={isLoading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) =>
              fetchCoupons({
                page,
                pageSize: pagination.pageSize,
                status: statusFilter || undefined,
                type: typeFilter || undefined,
              }),
          }}
          rowKey={(row) => row.id}
        />
      </div>

      <Modal
        visible={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, coupon: null })}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => setDeleteModal({ open: false, coupon: null })}
            >
              取消
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              确认删除
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要删除优惠券{' '}
          <span className="font-medium text-gray-800">
            {deleteModal.coupon?.name}
          </span>{' '}
          吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  );
}
