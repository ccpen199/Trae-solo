import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { tourApi, groupApi, orderApi } from '../../services/api';
import { Tour, TourGroup, UserRole, OrderStatus } from '../../types';
import dayjs from 'dayjs';

export const ToursPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    keyword: '',
    destination: '',
    category: '',
  });

  const isPublicView = !isAuthenticated || user?.role === UserRole.TOURIST;

  useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filters,
        };

        const result = isPublicView
          ? await tourApi.getPublicList(params)
          : await tourApi.getList(params);

        setTours(result.data);
        setPagination({
          ...pagination,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (error) {
        console.error('获取线路列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [pagination.page, pagination.pageSize, filters, isPublicView]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">旅游线路</h1>
          <p className="text-gray-500 mt-1">
            {isPublicView ? '浏览精选旅游线路' : '管理所有旅游线路'}
          </p>
        </div>

        {!isPublicView && (
          <Link to="/tours/create" className="btn btn-primary">
            + 创建新线路
          </Link>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">关键词</label>
              <input
                type="text"
                className="input"
                placeholder="搜索线路名称..."
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">目的地</label>
              <input
                type="text"
                className="input"
                placeholder="目的地"
                value={filters.destination}
                onChange={(e) => setFilters((prev) => ({ ...prev, destination: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                搜索
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : tours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              to={`/tours/${tour.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center">
                <span className="text-5xl">🌍</span>
              </div>
              <div className="card-body">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {tour.name}
                  </h3>
                  <span className="badge badge-primary text-xs">
                    {tour.days}天{tour.nights}晚
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span>📍 {tour.destination}</span>
                  {tour._count?.groups !== undefined && (
                    <span className="ml-4">📅 {tour._count.groups} 个团期</span>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {tour.description || '暂无描述'}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 text-sm">成人价</span>
                    <p className="text-xl font-bold text-primary-600">
                      ¥{tour.basePrice.toLocaleString()}
                    </p>
                  </div>

                  {!isPublicView && (
                    <span className={`badge ${
                      tour.status === 'PUBLISHED' ? 'badge-success' :
                      tour.status === 'DRAFT' ? 'badge-secondary' : 'badge-warning'
                    }`}>
                      {tour.status === 'PUBLISHED' ? '已发布' :
                       tour.status === 'DRAFT' ? '草稿' : '已归档'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <span className="text-6xl mb-4 block">🗺️</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无线路</h3>
            <p className="text-gray-500">
              {isPublicView ? '暂无可用线路，请稍后再来' : '点击上方按钮创建第一条线路'}
            </p>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn btn-secondary"
          >
            上一页
          </button>
          <span className="text-gray-600">
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="btn btn-secondary"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [tour, setTour] = useState<Tour | null>(null);
  const [groups, setGroups] = useState<TourGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<TourGroup | null>(null);
  const [bookingForm, setBookingForm] = useState({
    adultCount: 1,
    childCount: 0,
    contactName: '',
    contactPhone: '',
    specialRequests: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const isPublicView = !isAuthenticated || user?.role === UserRole.TOURIST;

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const tourData = isPublicView
          ? await tourApi.getPublicTour(id)
          : await tourApi.get(id, true);

        setTour(tourData);

        try {
          const groupsData = isPublicView
            ? await groupApi.getPublicList({ tourId: id, status: 'PUBLISHED' })
            : await groupApi.getList({ tourId: id, status: 'PUBLISHED' });

          setGroups(groupsData.data);

          if (groupsData.data.length > 0) {
            setSelectedGroup(groupsData.data[0]);
          }
        } catch (groupsError) {
          console.error('获取团期列表失败:', groupsError);
          setGroups([]);
        }
      } catch (error) {
        console.error('获取线路详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id, isPublicView]);

  const handleBooking = async () => {
    if (!selectedGroup) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const result = await orderApi.create({
        groupId: selectedGroup.id,
        contactName: bookingForm.contactName,
        contactPhone: bookingForm.contactPhone,
        adultCount: bookingForm.adultCount,
        childCount: bookingForm.childCount,
        specialRequests: bookingForm.specialRequests,
      });

      navigate(`/my-orders/${result.id}`);
    } catch (error: any) {
      alert(error.message || '报名失败');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-gray-500">线路不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-primary-600 hover:text-primary-700 font-medium"
      >
        ← 返回列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="h-64 bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center">
              <span className="text-8xl">🌍</span>
            </div>
            <div className="card-body">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{tour.name}</h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📍</span>
                  <span className="text-gray-900">{tour.destination}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📅</span>
                  <span className="text-gray-900">{tour.days}天{tour.nights}晚</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">👥</span>
                  <span className="text-gray-900">{tour.minGroupSize}-{tour.maxGroupSize}人成团</span>
                </div>
                {!isPublicView && (
                  <span className={`badge ${
                    tour.status === 'PUBLISHED' ? 'badge-success' :
                    tour.status === 'DRAFT' ? 'badge-secondary' : 'badge-warning'
                  }`}>
                    {tour.status === 'PUBLISHED' ? '已发布' :
                     tour.status === 'DRAFT' ? '草稿' : '已归档'}
                  </span>
                )}
              </div>

              {tour.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">产品介绍</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{tour.description}</p>
                </div>
              )}

              {tour.routeDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">行程安排</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{tour.routeDetails}</p>
                </div>
              )}

              {tour.includeItems && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">费用包含</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{tour.includeItems}</p>
                </div>
              )}

              {tour.excludeItems && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">费用不含</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{tour.excludeItems}</p>
                </div>
              )}

              {tour.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">注意事项</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{tour.notes}</p>
                </div>
              )}
            </div>
          </div>

          {groups.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">可报名团期</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedGroup?.id === group.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {dayjs(group.startDate).format('YYYY-MM-DD')} - {dayjs(group.endDate).format('YYYY-MM-DD')}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            团号: {group.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary-600">
                            ¥{group.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500">/成人</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            剩余 {group.totalStock - group.soldStock} 个名额
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {isPublicView && selectedGroup && (
          <div className="space-y-6">
            <div className="card sticky top-6">
              <div className="card-header">
                <h2 className="text-lg font-semibold">立即报名</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">出发日期</p>
                  <p className="font-medium text-gray-900">
                    {dayjs(selectedGroup.startDate).format('YYYY年MM月DD日')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">成人数量</label>
                    <select
                      className="select"
                      value={bookingForm.adultCount}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, adultCount: parseInt(e.target.value) }))}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">儿童数量</label>
                    <select
                      className="select"
                      value={bookingForm.childCount}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, childCount: parseInt(e.target.value) }))}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">联系人姓名 *</label>
                  <input
                    type="text"
                    className="input"
                    value={bookingForm.contactName}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, contactName: e.target.value }))}
                    placeholder="请输入联系人姓名"
                  />
                </div>

                <div>
                  <label className="form-label">联系电话 *</label>
                  <input
                    type="tel"
                    className="input"
                    value={bookingForm.contactPhone}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="请输入联系电话"
                  />
                </div>

                <div>
                  <label className="form-label">特殊要求</label>
                  <textarea
                    className="input h-24 resize-none"
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="如有特殊饮食需求、健康状况等请在此说明"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">成人 x{bookingForm.adultCount}</span>
                    <span className="text-gray-900">
                      ¥{(selectedGroup.price * bookingForm.adultCount).toLocaleString()}
                    </span>
                  </div>
                  {bookingForm.childCount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">儿童 x{bookingForm.childCount}</span>
                      <span className="text-gray-900">
                        ¥{(selectedGroup.childPrice * bookingForm.childCount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium text-gray-900">总价</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ¥{(
                        selectedGroup.price * bookingForm.adultCount +
                        selectedGroup.childPrice * bookingForm.childCount
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || bookingForm.adultCount + bookingForm.childCount === 0}
                  className="w-full btn btn-primary py-3"
                >
                  {bookingLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="loading-spinner mr-2"></span>
                      提交中...
                    </span>
                  ) : (
                    '立即报名'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
