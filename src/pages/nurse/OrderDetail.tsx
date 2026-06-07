import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore, Order } from '@/stores/orderStore';
import { api, apiUpload } from '@/lib/api';
import { MapPin, Camera, PenTool, Navigation, Clock, User, CheckCircle } from 'lucide-react';

const statusFlow = ['pending', 'dispatched', 'accepted', 'in_progress', 'completed'];
const statusLabels: Record<string, string> = {
  pending: '待处理',
  dispatched: '已派单',
  accepted: '已接单',
  in_progress: '进行中',
  completed: '已完成',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, fetchOrder, acceptOrder, updateOrderStatus } = useOrderStore();
  const [gpsCount, setGpsCount] = useState(0);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchOrder(Number(id));
  }, [id, fetchOrder]);

  useEffect(() => {
    if (currentOrder?.gps_points) {
      setGpsCount(currentOrder.gps_points.length);
    }
  }, [currentOrder]);

  const order = currentOrder;
  if (!order) {
    return <div className="text-center text-gray-400 py-12">加载中...</div>;
  }

  const currentStep = statusFlow.indexOf(order.status);

  const handleReportLocation = async () => {
    try {
      await api(`/orders/${id}/gps`, {
        method: 'POST',
        body: JSON.stringify({ lat: 31.2304 + Math.random() * 0.01, lng: 121.4737 + Math.random() * 0.01 }),
      });
      setGpsCount((c) => c + 1);
    } catch {}
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'before') setBeforePreview(preview);
    else setAfterPreview(preview);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);
      await apiUpload(`/orders/${id}/photos`, formData);
    } catch {}
  };

  const handleAccept = async () => {
    try {
      await acceptOrder(order.id);
      fetchOrder(order.id);
    } catch {}
  };

  const handleStartService = async () => {
    try {
      await updateOrderStatus(order.id, 'in_progress');
      fetchOrder(order.id);
    } catch {}
  };

  const handleComplete = async () => {
    try {
      await updateOrderStatus(order.id, 'completed');
      fetchOrder(order.id);
    } catch {}
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1E293B';
    ctx.lineCap = 'round';
  };

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

  const submitSignature = async () => {
    if (!signatureData) return;
    try {
      await api(`/orders/${id}/signature`, {
        method: 'POST',
        body: JSON.stringify({ signature: signatureData }),
      });
    } catch {}
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-[#0F6CBD] hover:underline">
        ← 返回订单列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-[#1E293B] mb-3">订单信息</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">服务项目：</span><span className="font-medium">{order.service_name}</span></div>
              <div><span className="text-gray-500">患者姓名：</span><span className="font-medium">{order.patient_name}</span></div>
              <div><span className="text-gray-500">服务地址：</span><span className="font-medium">{order.patient_address}</span></div>
              <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /><span className="font-medium">{new Date(order.scheduled_time).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-[#1E293B] mb-3">服务进度</h2>
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

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-[#1E293B] mb-3">
              <MapPin className="w-4 h-4 inline mr-1" />
              GPS轨迹
            </h2>
            <p className="text-sm text-gray-500 mb-3">已上报轨迹点：{gpsCount} 个</p>
            <button onClick={handleReportLocation} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
              <Navigation className="w-4 h-4" />
              上报当前位置
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-[#1E293B] mb-3">
              <Camera className="w-4 h-4 inline mr-1" />
              服务照片
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">服务前</p>
                <label className="block cursor-pointer">
                  {beforePreview ? (
                    <img src={beforePreview} alt="before" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm hover:border-[#0F6CBD]">
                      上传照片
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'before')} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">服务后</p>
                <label className="block cursor-pointer">
                  {afterPreview ? (
                    <img src={afterPreview} alt="after" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm hover:border-[#0F6CBD]">
                      上传照片
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-[#1E293B] mb-3">
              <PenTool className="w-4 h-4 inline mr-1" />
              电子签名
            </h2>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={clearSignature} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">
                清除
              </button>
              <button onClick={submitSignature} disabled={!signatureData} className="px-4 py-2 rounded-lg text-sm bg-[#0F6CBD] text-white hover:bg-[#0D5DA8] disabled:opacity-50">
                提交签名
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-semibold text-[#1E293B] mb-3">操作</h3>
            <div className="space-y-2">
              {order.status === 'pending' && (
                <button onClick={handleAccept} className="w-full bg-[#0F6CBD] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0D5DA8]">
                  接单
                </button>
              )}
              {order.status === 'accepted' && (
                <button onClick={handleStartService} className="w-full bg-[#108043] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0D6A36]">
                  开始服务
                </button>
              )}
              {order.status === 'in_progress' && (
                <button onClick={handleComplete} className="w-full bg-[#108043] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0D6A36]">
                  完成服务
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-semibold text-[#1E293B] mb-2">家属确认状态</h3>
            <div className={`flex items-center gap-2 text-sm ${order.family_confirmed ? 'text-[#108043]' : 'text-gray-400'}`}>
              <CheckCircle className="w-4 h-4" />
              {order.family_confirmed ? '家属已确认' : '待家属确认'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
