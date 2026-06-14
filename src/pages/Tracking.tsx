import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { orders } from '@/data/orders';
import { workers } from '@/data/workers';
import {
  MapPin, Clock, User, Camera, AlertTriangle,
  Check, AlertCircle, Image, Eye, ChevronDown, ChevronRight, ScanFace, Wrench, Zap,
} from 'lucide-react';

function TrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState('ORD20240614001');
  const { orders } = useAppStore();

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const worker = workers.find(w => w.id === selectedOrder.workerId);

  const processSteps = [
    { id: 1, name: '订单创建', time: selectedOrder.createdAt, done: true, icon: Clock },
    { id: 2, name: '师傅接单', time: '2024-06-14 09:00:00', done: true, icon: User },
    { id: 3, name: 'GPS签到', time: selectedOrder.checkIns[0]?.time, done: selectedOrder.checkIns.some(c => c.type === 'gps'), icon: MapPin },
    { id: 4, name: '人脸验证', time: selectedOrder.checkIns[1]?.time, done: selectedOrder.checkIns.some(c => c.type === 'face'), icon: ScanFace },
    { id: 5, name: '服务进行中', time: null, done: selectedOrder.status === 'in_service' || selectedOrder.status === 'completed', icon: Wrench },
    { id: 6, name: '完工验收', time: null, done: selectedOrder.status === 'completed' || selectedOrder.status === 'reviewed', icon: Check },
  ];

  const processPhotos = [
    { id: 'p1', step: '故障检测', time: '09:45', required: true, isHidden: false, hasPhoto: true, photo: '' },
    { id: 'p2', step: '配件更换', time: '10:20', required: true, isHidden: false, hasPhoto: true, photo: '' },
    { id: 'p3', step: '隐蔽工程', time: '—', required: true, isHidden: true, hasPhoto: false, photo: '' },
    { id: 'p4', step: '完工验收', time: '—', required: true, isHidden: false, hasPhoto: false, photo: '' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">服务追踪</h2>
        <p className="text-sm text-slate-500 mt-1">实时监控服务流程、打卡记录与工序照片</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm h-[calc(100vh-180px)] flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">订单列表</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedOrderId === order.id
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{order.faultTypeName}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      order.status === 'pending' ? 'bg-orange-500' :
                      order.status === 'in_service' ? 'bg-blue-500' :
                      order.status === 'completed' ? 'bg-green-500' : 'bg-slate-400'
                    }`} />
                  </div>
                  <p className="text-xs text-slate-500">{order.homeownerName} · {order.id.slice(-4)}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{order.homeownerAddress}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{selectedOrder.faultTypeName}</h3>
                <p className="text-sm text-slate-500">{selectedOrder.id} · {selectedOrder.homeownerName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedOrder.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                selectedOrder.status === 'in_service' ? 'bg-blue-100 text-blue-600' :
                selectedOrder.status === 'completed' ? 'bg-green-100 text-green-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {selectedOrder.status === 'pending' ? '待接单' :
                 selectedOrder.status === 'in_service' ? '服务中' :
                 selectedOrder.status === 'completed' ? '已完成' :
                 selectedOrder.status === 'reviewed' ? '已评价' : '进行中'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
              <div>
                <p className="text-xs text-slate-500">业主地址</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{selectedOrder.homeownerAddress}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">联系电话</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{selectedOrder.homeownerPhone}</p>
              </div>
            </div>

            {worker && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <img src={worker.avatar} alt={worker.name} className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{worker.name}</p>
                  <p className="text-xs text-slate-500">评分 {worker.rating} · {worker.orderCount}单</p>
                </div>
                <button className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
                  联系师傅
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">服务流程</h3>

            <div className="relative pl-6">
              {processSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                    {idx < processSteps.length - 1 && (
                      <div className={`absolute left-[15px] top-8 w-0.5 h-full ${
                        step.done ? 'bg-green-300' : 'bg-slate-200'
                      }`} style={{ height: 'calc(100% - 32px)' }} />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.done
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.name}
                        </p>
                        {step.time && (
                          <span className="text-xs text-slate-400">{step.time.split(' ')[1]?.slice(0, 5)}</span>
                        )}
                      </div>
                      {step.done && (
                        <p className="text-xs text-green-600 mt-0.5">✓ 已完成</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">工序照片</h3>
              <span className="text-xs text-slate-500">{processPhotos.filter(p => p.hasPhoto).length}/{processPhotos.length}</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {processPhotos.map(photo => (
                <div
                  key={photo.id}
                  className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-2 text-center ${
                    photo.hasPhoto
                      ? 'border-green-300 bg-green-50'
                      : photo.isHidden
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {photo.hasPhoto ? (
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-green-700">{photo.step}</p>
                    <p className="text-xs text-green-500 text-[10px]">{photo.time}</p>
                    </div>
                  ) : (
                    <>
                      <Camera className={`w-6 h-6 mb-1 ${photo.isHidden ? 'text-red-400' : 'text-slate-400'}`} />
                      <p className={`text-xs font-medium ${photo.isHidden ? 'text-red-600' : 'text-slate-500'}`}>
                        {photo.step}
                      </p>
                      {photo.required && (
                        <p className="text-[10px] mt-0.5">
                          {photo.isHidden ? (
                            <span className="text-red-500">必传·隐蔽工程</span>
                          ) : (
                            <span className="text-slate-400">必传</span>
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">水电改造项目注意</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  隐蔽工程照片必须在封槽前上传，作为质保重要依据。未上传将无法完工。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">打卡记录</h3>
            <div className="space-y-3">
              {selectedOrder.checkIns.map(checkin => (
                <div key={checkin.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200">
                    {checkin.type === 'gps' ? (
                      <MapPin className="w-5 h-5 text-blue-500" />
                    ) : checkin.type === 'face' ? (
                      <ScanFace className="w-5 h-5 text-green-500" />
                    ) : (
                      <Check className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {checkin.type === 'gps' ? 'GPS定位打卡' :
                       checkin.type === 'face' ? '人脸识别打卡' : '完工确认'}
                    </p>
                    <p className="text-xs text-slate-400">
                      精度 {checkin.location.accuracy}m · {checkin.time}
                    </p>
                  </div>
                  {checkin.verified ? (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      已验证
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      异常
                    </span>
                  )}
                </div>
              ))}
              {selectedOrder.checkIns.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-6">暂无打卡记录</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;
