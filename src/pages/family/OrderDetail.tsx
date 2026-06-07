import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/stores/orderStore';
import { api } from '@/lib/api';
import { MapPin, Camera, Clock, User, CheckCircle, X } from 'lucide-react';

const statusFlow = ['pending', 'dispatched', 'accepted', 'in_progress', 'completed'];
const statusLabels: Record<string, string> = {
  pending: '待处理',
  dispatched: '已派单',
  accepted: '已接单',
  in_progress: '进行中',
  completed: '已完成',
};

export default function FamilyOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, fetchOrder } = useOrderStore();
  const [showSignature, setShowSignature] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (id) fetchOrder(Number(id));
  }, [id, fetchOrder]);

  const order = currentOrder;
  if (!order) {
    return <div className="text-center text-gray-400 py-12">加载中...</div>;
  }

  const currentStep = statusFlow.indexOf(order.status);
  const lastGps = order.gps_points?.[order.gps_points.length - 1];

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    setDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setSignatureData(null);
  };

  const confirmOrder = async () => {
    if (!signatureData) return;
    try {
      await api(`/orders/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ signature: signatureData }),
      });
      setShowSignature(false);
      fetchOrder(Number(id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-[#0F6CBD] hover:underline">
        ← 返回订单列表
      </button>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="font-semibold text-[#1E293B] mb-4">订单状态</h2>
        <div className="flex items-center justify-between">
          {statusFlow.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center ${i <= currentStep ? 'text-[#0F6CBD]' : 'text-gray-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  i < currentStep ? 'bg-[#0F6CBD] border-[#0F6CBD] text-white' : i === currentStep ? 'border-[#0F6CBD] text-[#0F6CBD]' : 'border-gray-300 text-gray-300'
                }`}>
                  {i < currentStep ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <span className="text-xs mt-1">{statusLabels[s]}</span>
              </div>
              {i < statusFlow.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${i < currentStep ? 'bg-[#0F6CBD]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-3">
            <User className="w-4 h-4 inline mr-1" />
            护士信息
          </h2>
          <div className="text-sm space-y-2">
            <p><span className="text-gray-500">姓名：</span>{order.nurse_name || '待分配'}</p>
            <p><span className="text-gray-500">服务项目：</span>{order.service_name}</p>
            <p className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {new Date(order.scheduled_time).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            护士位置
          </h2>
          {lastGps ? (
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">纬度：</span>{lastGps.lat.toFixed(6)}</p>
              <p><span className="text-gray-500">经度：</span>{lastGps.lng.toFixed(6)}</p>
              <p className="text-xs text-gray-400">
                更新时间：{new Date(lastGps.timestamp).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无位置信息</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-3">
            <Camera className="w-4 h-4 inline mr-1" />
            服务照片
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">服务前</p>
              {order.before_photo ? (
                <img src={order.before_photo} alt="before" className="w-full h-24 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">暂无</div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">服务后</p>
              {order.after_photo ? (
                <img src={order.after_photo} alt="after" className="w-full h-24 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">暂无</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-3">家属确认</h2>
          {order.family_confirmed ? (
            <div className="flex items-center gap-2 text-[#108043]">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">已确认服务完成</span>
            </div>
          ) : order.status === 'completed' ? (
            <button
              onClick={() => setShowSignature(true)}
              className="bg-[#108043] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D6A36]"
            >
              确认服务并签名
            </button>
          ) : (
            <p className="text-sm text-gray-400">服务完成后可确认</p>
          )}
        </div>
      </div>

      {showSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[460px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E293B]">家属签名确认</h3>
              <button onClick={() => setShowSignature(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              className="border border-gray-300 rounded-lg cursor-crosshair w-full"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={clearSignature} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">
                清除
              </button>
              <button onClick={confirmOrder} disabled={!signatureData} className="px-4 py-2 rounded-lg text-sm bg-[#108043] text-white hover:bg-[#0D6A36] disabled:opacity-50">
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
