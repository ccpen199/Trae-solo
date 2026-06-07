import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Star, Award, Users, CheckCircle } from 'lucide-react';

interface PendingOrder {
  id: number;
  service_name: string;
  patient_name: string;
  patient_address: string;
  scheduled_time: string;
}

interface NurseScore {
  id: number;
  name: string;
  qualification: string;
  distance: number;
  rating: number;
  current_load: number;
  qualification_score: number;
  distance_score: number;
  rating_score: number;
  load_score: number;
  total_score: number;
}

export default function Dispatch() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [nurses, setNurses] = useState<NurseScore[]>([]);
  const [nursesLoading, setNursesLoading] = useState(false);

  useEffect(() => {
    api<PendingOrder[]>('/admin/dispatch/pending')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSmartDispatch = async (orderId: number) => {
    setSelectedOrder(orderId);
    setNursesLoading(true);
    try {
      const data = await api<NurseScore[]>(`/admin/dispatch/recommend/${orderId}`);
      setNurses(data);
    } catch {
      setNurses([]);
    } finally {
      setNursesLoading(false);
    }
  };

  const handleAssign = async (orderId: number, nurseId: number) => {
    try {
      await api(`/admin/dispatch/assign`, {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId, nurse_id: nurseId }),
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setSelectedOrder(null);
      setNurses([]);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">智能派单</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1E293B]">待派单订单</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无待派单订单</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-[#1E293B]">{order.service_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          患者：{order.patient_name} · {order.patient_address}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          预约：{new Date(order.scheduled_time).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSmartDispatch(order.id)}
                        className="bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8] flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        智能派单
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1E293B]">推荐护士</h2>
            </div>
            {selectedOrder === null ? (
              <div className="p-8 text-center text-gray-400 text-sm">请选择订单进行派单</div>
            ) : nursesLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (<div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />))}
              </div>
            ) : nurses.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">暂无推荐护士</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {nurses.map((nurse) => (
                  <div key={nurse.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-[#1E293B]">{nurse.name}</p>
                      <span className="text-sm font-bold text-[#0F6CBD]">{nurse.total_score.toFixed(1)}分</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />资质: {nurse.qualification_score}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />距离: {nurse.distance_score}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" />评分: {nurse.rating_score}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />负荷: {nurse.load_score}</span>
                    </div>
                    <button
                      onClick={() => handleAssign(selectedOrder, nurse.id)}
                      className="mt-2 w-full flex items-center justify-center gap-1 bg-[#108043] text-white py-1.5 rounded-lg text-xs hover:bg-[#0D6A36]"
                    >
                      <CheckCircle className="w-3 h-3" /> 指派
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
