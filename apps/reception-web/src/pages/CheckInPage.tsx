import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CheckInPage: React.FC = () => {
  const [reservationCode, setReservationCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const searchReservation = async () => {
    if (!reservationCode.trim()) {
      setError('请输入预约码');
      return;
    }

    try {
      setSearching(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/reservations/code/${reservationCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      setReservation(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '预约不存在');
      setReservation(null);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!reservation) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/reservations/${reservation.id}/check-in`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      alert('签到成功！已为患者生成导检路径并加入队列。');
      setReservation(null);
      setReservationCode('');
    } catch (err: any) {
      alert(err.response?.data?.message || '签到失败');
    }
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    created: { text: '已创建', color: 'bg-gray-100 text-gray-600' },
    reserved: { text: '已预约', color: 'bg-blue-100 text-blue-600' },
    checked_in: { text: '已签到', color: 'bg-green-100 text-green-600' },
    in_examination: { text: '体检中', color: 'bg-yellow-100 text-yellow-600' },
    cancelled: { text: '已取消', color: 'bg-red-100 text-red-600' },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">患者签到</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          预约码查询
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={reservationCode}
            onChange={(e) => setReservationCode(e.target.value.toUpperCase())}
            placeholder="请输入预约码 (如: RSV2604281234)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && searchReservation()}
          />
          <button
            onClick={searchReservation}
            disabled={searching}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {searching ? '查询中...' : '查询'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {reservation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{reservation.patientName}</h3>
                <p className="text-sm text-gray-500">{reservation.packageName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[reservation.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[reservation.status]?.text || reservation.status}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-gray-500 text-sm">预约码</span>
                <p className="font-medium text-gray-800">{reservation.reservationCode}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">订单号</span>
                <p className="font-medium text-gray-800">{reservation.orderNo}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">手机号</span>
                <p className="font-medium text-gray-800">{reservation.patientPhone}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">预约日期</span>
                <p className="font-medium text-gray-800">
                  {new Date(reservation.reservationDate).toLocaleDateString('zh-CN')} {reservation.timeSlot}
                </p>
              </div>
            </div>

            {reservation.status === 'reserved' && (
              <div className="flex gap-3">
                <button
                  onClick={handleCheckIn}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  确认签到
                </button>
                <button
                  onClick={() => setReservation(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            )}

            {reservation.status !== 'reserved' && (
              <button
                onClick={() => {
                  setReservation(null);
                  setReservationCode('');
                }}
                className="w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
