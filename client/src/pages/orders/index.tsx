import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { orderApi, groupApi, businessApi } from '../../services/api';
import { Order, UserRole, OrderStatus, TourGroup } from '../../types';
import dayjs from 'dayjs';

const statusBadgeClass: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'badge-secondary',
  [OrderStatus.PENDING_PAYMENT]: 'badge-warning',
  [OrderStatus.PAID]: 'badge-primary',
  [OrderStatus.CONFIRMED]: 'badge-success',
  [OrderStatus.CANCELLED]: 'badge-secondary',
  [OrderStatus.REFUNDED]: 'badge-danger',
};

const statusLabel: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: '草稿',
  [OrderStatus.PENDING_PAYMENT]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.CONFIRMED]: '已确认',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDED]: '已退款',
};

export const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
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

  const isTouristView = user?.role === UserRole.TOURIST;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          status: filters.status || undefined,
        };

        const result = await orderApi.getList(params);
        setOrders(result.data);
        setPagination({
          ...pagination,
          total: result.total,
          totalPages: result.totalPages,
        });
      } catch (error) {
        console.error('获取订单列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [pagination.page, pagination.pageSize, filters.status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isTouristView ? '我的订单' : '订单管理'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isTouristView ? '查看您的所有订单' : '管理所有订单和报名'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-64">
              <label className="form-label">订单状态</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">全部状态</option>
                {Object.entries(statusLabel).map(([key, label]) => (
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
      ) : orders.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">订单编号</th>
                  <th className="table-header-cell">线路名称</th>
                  <th className="table-header-cell">团期</th>
                  <th className="table-header-cell">人数</th>
                  <th className="table-header-cell">金额</th>
                  <th className="table-header-cell">状态</th>
                  <th className="table-header-cell">创建时间</th>
                  <th className="table-header-cell">操作</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {orders.map((order) => (
                  <tr key={order.id} className="table-row">
                    <td className="table-cell font-medium text-primary-600">
                      {order.orderNo}
                    </td>
                    <td className="table-cell">
                      {order.group?.tour?.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {order.group ? (
                        <span>
                          {dayjs(order.group.startDate).format('MM-DD')} - {dayjs(order.group.endDate).format('MM-DD')}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="table-cell">
                      {order.adultCount} 成人
                      {order.childCount > 0 && `, ${order.childCount} 儿童`}
                    </td>
                    <td className="table-cell font-medium">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusBadgeClass[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        查看详情
                      </Link>
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
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无订单</h3>
            <p className="text-gray-500">
              {isTouristView ? '您还没有任何订单，去浏览线路吧' : '暂无订单数据'}
            </p>
            {isTouristView && (
              <Link to="/tours" className="btn btn-primary mt-4">
                浏览线路
              </Link>
            )}
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

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [group, setGroup] = useState<TourGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  const [insuranceContent, setInsuranceContent] = useState('');

  const isTouristView = user?.role === UserRole.TOURIST;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const orderData = await orderApi.get(id);
        setOrder(orderData);
      } catch (error) {
        console.error('获取订单详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handlePayment = async () => {
    if (!order) return;
    try {
      const remaining = order.totalAmount - order.paidAmount;
      if (remaining > 0) {
        await orderApi.payment(order.id, remaining, 'ALIPAY');
        alert('支付成功！');
        const updated = await orderApi.get(id);
        setOrder(updated);
      }
    } catch (error: any) {
      alert(error.message || '支付失败');
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    const reason = window.prompt('请输入取消原因：');
    if (reason !== null) {
      try {
        await orderApi.cancel(order.id, reason);
        alert('订单已取消');
        const updated = await orderApi.get(id);
        setOrder(updated);
      } catch (error: any) {
        alert(error.message || '取消失败');
      }
    }
  };

  const handleConfirm = async () => {
    if (!order) return;
    try {
      await orderApi.confirm(order.id);
      alert('订单已确认');
      const updated = await orderApi.get(id);
      setOrder(updated);
    } catch (error: any) {
      alert(error.message || '确认失败');
    }
  };

  const loadNotice = async () => {
    if (!order) return;
    try {
      const content = await businessApi.getNotice(order.id);
      setNoticeContent(content);
      setShowNotice(true);
    } catch (error: any) {
      alert(error.message || '获取出行通知失败');
    }
  };

  const loadInsurance = async () => {
    if (!order) return;
    try {
      const content = await businessApi.getInsuranceList(order.id);
      setInsuranceContent(content);
      setShowInsurance(true);
    } catch (error: any) {
      alert(error.message || '获取保险清单失败');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <p className="text-gray-500">订单不存在</p>
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
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">订单详情</h2>
                <p className="text-sm text-gray-500 mt-1">订单编号: {order.orderNo}</p>
              </div>
              <span className={`badge ${statusBadgeClass[order.status]}`}>
                {statusLabel[order.status]}
              </span>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">线路名称</p>
                  <p className="font-medium">{order.group?.tour?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">团期</p>
                  <p className="font-medium">
                    {order.group ? (
                      <span>
                        {dayjs(order.group.startDate).format('YYYY年MM月DD日')} - {dayjs(order.group.endDate).format('YYYY年MM月DD日')}
                      </span>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系人</p>
                  <p className="font-medium">{order.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系电话</p>
                  <p className="font-medium">{order.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">人数</p>
                  <p className="font-medium">
                    {order.adultCount} 成人
                    {order.childCount > 0 && `, ${order.childCount} 儿童`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">创建时间</p>
                  <p className="font-medium">
                    {dayjs(order.createdAt).format('YYYY年MM月DD日 HH:mm')}
                  </p>
                </div>
              </div>

              {order.specialRequests && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">特殊要求</p>
                  <p className="font-medium">{order.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {order.passengers && order.passengers.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">游客名单</h2>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">#</th>
                        <th className="table-header-cell">姓名</th>
                        <th className="table-header-cell">类型</th>
                        <th className="table-header-cell">证件类型</th>
                        <th className="table-header-cell">证件号码</th>
                        <th className="table-header-cell">手机号</th>
                        <th className="table-header-cell">特殊需求</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {order.passengers.map((p, index) => (
                        <tr key={p.id} className="table-row">
                          <td className="table-cell">{index + 1}</td>
                          <td className="table-cell font-medium">{p.name}</td>
                          <td className="table-cell">
                            <span className={`badge ${p.isChild ? 'badge-warning' : 'badge-primary'}`}>
                              {p.isChild ? '儿童' : '成人'}
                            </span>
                          </td>
                          <td className="table-cell">{p.idType}</td>
                          <td className="table-cell">{p.idNumber}</td>
                          <td className="table-cell">{p.phone || '-'}</td>
                          <td className="table-cell">{p.specialNeeds || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {order.payments && order.payments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">支付记录</h2>
              </div>
              <div className="card-body">
                <div className="table-container">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">支付编号</th>
                        <th className="table-header-cell">支付方式</th>
                        <th className="table-header-cell">金额</th>
                        <th className="table-header-cell">状态</th>
                        <th className="table-header-cell">支付时间</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {order.payments.map((payment) => (
                        <tr key={payment.id} className="table-row">
                          <td className="table-cell font-medium">{payment.paymentNo}</td>
                          <td className="table-cell">{payment.method}</td>
                          <td className="table-cell font-medium">¥{payment.amount.toLocaleString()}</td>
                          <td className="table-cell">
                            <span className={`badge ${payment.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                              {payment.status === 'COMPLETED' ? '已完成' : '处理中'}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500">
                            {payment.paidAt ? dayjs(payment.paidAt).format('YYYY-MM-DD HH:mm') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold">订单金额</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">订单总金额</span>
                <span className="font-medium">¥{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">已支付</span>
                <span className="font-medium text-success-600">¥{order.paidAmount.toLocaleString()}</span>
              </div>
              {order.totalAmount - order.paidAmount > 0 && (
                <div className="flex justify-between text-warning-600">
                  <span>待支付</span>
                  <span className="font-medium">¥{(order.totalAmount - order.paidAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">应付金额</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{(order.totalAmount - order.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {order.status === OrderStatus.PENDING_PAYMENT && order.totalAmount - order.paidAmount > 0 && (
                  <button onClick={handlePayment} className="w-full btn btn-primary">
                    立即支付
                  </button>
                )}

                {order.status === OrderStatus.PAID && !isTouristView && (
                  <button onClick={handleConfirm} className="w-full btn btn-success">
                    确认订单
                  </button>
                )}

                {[OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT].includes(order.status) && (
                  <button onClick={handleCancel} className="w-full btn btn-danger">
                    取消订单
                  </button>
                )}

                {[OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.status) && (
                  <>
                    <button onClick={loadNotice} className="w-full btn btn-secondary">
                      📄 出行通知
                    </button>
                    <button onClick={loadInsurance} className="w-full btn btn-secondary">
                      🛡️ 保险清单
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {order.group && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">团期信息</h2>
              </div>
              <div className="card-body space-y-3">
                <div>
                  <p className="text-sm text-gray-500">团号</p>
                  <p className="font-medium">{order.group.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">出发日期</p>
                  <p className="font-medium">{dayjs(order.group.startDate).format('YYYY年MM月DD日')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">集合地点</p>
                  <p className="font-medium">{order.group.departurePoint || '待定'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">集合时间</p>
                  <p className="font-medium">{order.group.meetingTime || '待定'}</p>
                </div>
                {order.group.guide && (
                  <div>
                    <p className="text-sm text-gray-500">导游</p>
                    <p className="font-medium">
                      {order.group.guide.name} - {order.group.guide.phone || '暂无电话'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNotice && (
        <div className="modal-overlay" onClick={() => setShowNotice(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">出行通知</h3>
              <button onClick={() => setShowNotice(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                {noticeContent}
              </pre>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNotice(false)} className="btn btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showInsurance && (
        <div className="modal-overlay" onClick={() => setShowInsurance(false)}>
          <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold">保险清单</h3>
              <button onClick={() => setShowInsurance(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                {insuranceContent}
              </pre>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowInsurance(false)} className="btn btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
