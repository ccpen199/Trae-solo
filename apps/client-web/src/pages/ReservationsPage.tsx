import React, { useState, useEffect } from 'react';
import { reservationApi } from '../services/api';

const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await reservationApi.getMyReservations(status);
      setReservations(response.data);
    } catch (error) {
      console.error('获取预约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    created: { text: '已创建', color: 'bg-gray-100 text-gray-600' },
    reserved: { text: '已预约', color: 'bg-blue-100 text-blue-600' },
    checked_in: { text: '已签到', color: 'bg-green-100 text-green-600' },
    in_examination: { text: '体检中', color: 'bg-yellow-100 text-yellow-600' },
    examination_completed: { text: '体检完成', color: 'bg-purple-100 text-purple-600' },
    report_generated: { text: '已出报告', color: 'bg-green-100 text-green-700' },
    cancelled: { text: '已取消', color: 'bg-red-100 text-red-600' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">我的预约</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === 'reserved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            已预约
          </button>
          <button
            onClick={() => setStatusFilter('in_examination')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === 'in_examination'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            体检中
          </button>
          <button
            onClick={() => setStatusFilter('report_generated')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              statusFilter === 'report_generated'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            已出报告
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">加载中...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">暂无预约记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const status = statusLabels[reservation.status] || statusLabels.created;

            return (
              <div
                key={reservation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {reservation.packageName}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">预约码：</span>
                        <span className="font-medium text-gray-800">{reservation.reservationCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">订单号：</span>
                        <span className="font-medium text-gray-800">{reservation.orderNo}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">预约日期：</span>
                        <span className="font-medium text-gray-800">
                          {formatDate(reservation.reservationDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">预约时段：</span>
                        <span className="font-medium text-gray-800">{reservation.timeSlot}</span>
                      </div>
                    </div>

                    {reservation.patientName && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">体检人：</span>
                        <span className="font-medium text-gray-800">{reservation.patientName}</span>
                        {reservation.patientPhone && (
                          <span className="text-gray-500 ml-4">电话：{reservation.patientPhone}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">¥{reservation.price}</div>
                    </div>

                    <div className="flex gap-2">
                      {reservation.status === 'reserved' && (
                        <button
                          onClick={() => reservationApi.cancel(reservation.id).then(() => fetchReservations())}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                        >
                          取消预约
                        </button>
                      )}

                      {reservation.status === 'report_generated' && (
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          查看报告
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
