import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { groupApi, settlementApi, businessApi } from '../../services/api';
import { TourGroup, Settlement, UserRole, TourGroupStatus, SettlementStatus } from '../../types';
import dayjs from 'dayjs';

const groupStatusLabel: Record<TourGroupStatus, string> = {
  [TourGroupStatus.DRAFT]: '草稿',
  [TourGroupStatus.PUBLISHED]: '已发布',
  [TourGroupStatus.FULL]: '已满',
  [TourGroupStatus.CONFIRMED]: '已确认',
  [TourGroupStatus.IN_PROGRESS]: '进行中',
  [TourGroupStatus.COMPLETED]: '已完成',
  [TourGroupStatus.CANCELLED]: '已取消',
};

const groupStatusBadgeClass: Record<TourGroupStatus, string> = {
  [TourGroupStatus.DRAFT]: 'badge-secondary',
  [TourGroupStatus.PUBLISHED]: 'badge-primary',
  [TourGroupStatus.FULL]: 'badge-warning',
  [TourGroupStatus.CONFIRMED]: 'badge-success',
  [TourGroupStatus.IN_PROGRESS]: 'badge-primary',
  [TourGroupStatus.COMPLETED]: 'badge-success',
  [TourGroupStatus.CANCELLED]: 'badge-danger',
};

const settlementStatusLabel: Record<SettlementStatus, string> = {
  [SettlementStatus.PENDING]: '待处理',
  [SettlementStatus.IN_PROGRESS]: '处理中',
  [SettlementStatus.COMPLETED]: '已完成',
};

const settlementStatusBadgeClass: Record<SettlementStatus, string> = {
  [SettlementStatus.PENDING]: 'badge-warning',
  [SettlementStatus.IN_PROGRESS]: 'badge-primary',
  [SettlementStatus.COMPLETED]: 'badge-success',
};

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<TourGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          status: filters.status || undefined,
        };

        const result = await groupApi.getList(params);
        setGroups(result.data);
        setPagination({
          ...pagination,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (error) {
        console.error('获取团期列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [pagination.page, pagination.pageSize, filters.status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">团期管理</h1>
          <p className="text-gray-500 mt-1">管理所有出团计划</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <label className="form-label">团期状态</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">全部状态</option>
                {Object.entries(groupStatusLabel).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : groups.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">团号</th>
                  <th className="table-header-cell">线路名称</th>
                  <th className="table-header-cell">出发日期</th>
                  <th className="table-header-cell">价格</th>
                  <th className="table-header-cell">库存</th>
                  <th className="table-header-cell">导游</th>
                  <th className="table-header-cell">状态</th>
                  <th className="table-header-cell">操作</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {groups.map((group) => (
                  <tr key={group.id} className="table-row">
                    <td className="table-cell font-medium text-primary-600">
                      {group.code}
                    </td>
                    <td className="table-cell">
                      {group.tour?.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {dayjs(group.startDate).format('MM-DD')} - {dayjs(group.endDate).format('MM-DD')}
                    </td>
                    <td className="table-cell">
                      ¥{group.price.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      {group.soldStock}/{group.totalStock}
                    </td>
                    <td className="table-cell">
                      {group.guide?.name || '未分配'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${groupStatusBadgeClass[group.status]}`}>
                        {groupStatusLabel[group.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/groups/${group.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          查看
                        </Link>
                        {group.status === TourGroupStatus.DRAFT && (
                          <button
                            onClick={async () => {
                              try {
                                await groupApi.publish(group.id);
                                alert('发布成功');
                                window.location.reload();
                              } catch (error: any) {
                                alert(error.message || '操作失败');
                              }
                            }}
                            className="text-success-600 hover:text-success-700 text-sm"
                          >
                            发布
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无团期</h3>
            <p className="text-gray-500">暂无团期数据</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettlementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
  });

  useEffect(() => {
    const fetchSettlements = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          status: filters.status || undefined,
        };

        const result = await businessApi.getSettlements(params);
        setSettlements(result.data);
        setPagination({
          ...pagination,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (error) {
        console.error('获取结算单列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettlements();
  }, [pagination.page, pagination.pageSize, filters.status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算管理</h1>
          <p className="text-gray-500 mt-1">管理团期结算和成本核算</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <label className="form-label">结算状态</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">全部状态</option>
                {Object.entries(settlementStatusLabel).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : settlements.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">结算单号</th>
                  <th className="table-header-cell">团号</th>
                  <th className="table-header-cell">营收</th>
                  <th className="table-header-cell">成本</th>
                  <th className="table-header-cell">佣金</th>
                  <th className="table-header-cell">利润</th>
                  <th className="table-header-cell">游客数</th>
                  <th className="table-header-cell">状态</th>
                  <th className="table-header-cell">操作</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="table-row">
                    <td className="table-cell font-medium text-primary-600">
                      {settlement.settlementNo}
                    </td>
                    <td className="table-cell">
                      {settlement.group?.code || 'N/A'}
                    </td>
                    <td className="table-cell">
                      ¥{settlement.totalRevenue.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      ¥{settlement.totalCost.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      ¥{settlement.commission.toLocaleString()}
                    </td>
                    <td className="table-cell font-medium">
                      <span className={settlement.profit >= 0 ? 'text-success-600' : 'text-danger-600'}>
                        ¥{settlement.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell">
                      {settlement.touristCount}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${settlementStatusBadgeClass[settlement.status]}`}>
                        {settlementStatusLabel[settlement.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => navigate(`/settlements/${settlement.id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <span className="text-6xl mb-4 block">💰</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无结算单</h3>
            <p className="text-gray-500">完成的团期将自动生成结算单</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(formData);
      alert('更新成功');
    } catch (error: any) {
      alert(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-500 mt-1">管理您的个人信息</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-bold mx-auto mb-4">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{user?.name}</h3>
            <p className="text-gray-500 mb-4">{user?.username}</p>
            <div className="inline-block badge badge-primary">
              {user?.role === 'TOURIST' ? '游客' :
               user?.role === 'SALES' ? '销售' :
               user?.role === 'GUIDE' ? '导游' :
               user?.role === 'AGENCY' ? '地接社' : '管理员'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">个人信息</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">用户名</label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={user?.username || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">用户名不可修改</p>
                </div>

                <div>
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="请输入姓名"
                  />
                </div>

                <div>
                  <label className="form-label">手机号</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="请输入手机号"
                  />
                </div>

                <div>
                  <label className="form-label">邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="请输入邮箱"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="loading-spinner mr-2"></span>
                      保存中...
                    </span>
                  ) : (
                    '保存修改'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
