import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { workers } from '@/data/workers';
import {
  MapPin, Clock, User, Camera, AlertTriangle, Eye,
  Check, AlertCircle, ChevronDown, ChevronRight, ScanFace, Wrench, Zap,
  FileText, Shield, Star, Navigation, Image as ImageIcon,
} from 'lucide-react';

interface TimelineItem {
  id: string;
  time: string;
  type: 'checkin' | 'photo' | 'order' | 'review';
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'done' | 'current' | 'pending';
  subInfo?: string;
  photoUrl?: string;
}

function TrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState('ORD20240614001');
  const { orders } = useAppStore();

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const worker = workers.find(w => w.id === selectedOrder.workerId);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    items.push({
      id: 'order-create',
      time: selectedOrder.createdAt,
      type: 'order',
      title: '订单创建',
      description: `业主${selectedOrder.homeownerName}提交报修申请`,
      icon: FileText,
      status: 'done',
      subInfo: selectedOrder.faultTypeName,
    });

    if (selectedOrder.workerId) {
      items.push({
        id: 'worker-match',
        time: selectedOrder.serviceTime || selectedOrder.createdAt,
        type: 'order',
        title: '师傅接单',
        description: `${selectedOrder.workerName}已接单并前往服务地点`,
        icon: User,
        status: 'done',
        subInfo: worker ? `评分${worker.rating} · ${worker.orderCount}单` : '',
      });
    }

    const gpsCheckin = selectedOrder.checkIns.find(c => c.type === 'gps');
    if (gpsCheckin) {
      items.push({
        id: gpsCheckin.id,
        time: gpsCheckin.time,
        type: 'checkin',
        title: 'GPS定位打卡',
        description: '师傅已到达服务地点',
        icon: MapPin,
        status: 'done',
        subInfo: `定位精度 ${gpsCheckin.location.accuracy}m`,
      });
    }

    const faceCheckin = selectedOrder.checkIns.find(c => c.type === 'face');
    if (faceCheckin) {
      items.push({
        id: faceCheckin.id,
        time: faceCheckin.time,
        type: 'checkin',
        title: '人脸识别验证',
        description: '本人身份验证通过',
        icon: ScanFace,
        status: 'done',
        subInfo: faceCheckin.verified ? '验证通过' : '验证失败',
      });
    }

    selectedOrder.processPhotos
      .filter(p => p.stepIndex > 0)
      .sort((a, b) => a.stepIndex - b.stepIndex)
      .forEach(photo => {
        items.push({
          id: photo.id,
          time: photo.timestamp || '',
          type: 'photo',
          title: `${photo.step}`,
          description: photo.description,
          icon: Camera,
          status: photo.timestamp ? 'done' : 'pending',
          subInfo: photo.isHiddenWork ? '必传·隐蔽工程' : (photo.isRequired ? '必传' : '选传'),
          photoUrl: photo.photoUrl,
        });
      });

    const completeCheckin = selectedOrder.checkIns.find(c => c.type === 'complete');
    if (completeCheckin) {
      items.push({
        id: completeCheckin.id,
        time: completeCheckin.time,
        type: 'checkin',
        title: '完工确认',
        description: '服务完成，等待业主验收',
        icon: Check,
        status: 'done',
        subInfo: completeCheckin.verified ? '已确认完工' : '',
      });
    }

    if (selectedOrder.review) {
      items.push({
        id: 'review',
        time: selectedOrder.review.createdAt,
        type: 'review',
        title: '业主评价',
        description: selectedOrder.review.comment,
        icon: Star,
        status: 'done',
        subInfo: `${selectedOrder.review.rating} 分`,
      });
    }

    if (selectedOrder.status === 'pending' || selectedOrder.status === 'matched') {
      items.push({
        id: 'pending-service',
        time: '',
        type: 'order',
        title: '等待服务',
        description: '师傅将按预约时间上门服务',
        icon: Clock,
        status: 'pending',
      });
    }

    if (items.length > 0 && items[items.length - 1].status === 'done' && selectedOrder.status !== 'reviewed') {
      items[items.length - 1].status = 'current';
    }

    return items.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [selectedOrder, worker]);

  const progressPercent = useMemo(() => {
    const done = timeline.filter(t => t.status === 'done').length;
    const total = timeline.length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [timeline]);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待接单',
      matched: '已匹配',
      quoted: '待报价',
      paid: '已付款',
      in_service: '服务中',
      completed: '已完成',
      reviewed: '已评价',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-600',
      matched: 'bg-blue-100 text-blue-600',
      quoted: 'bg-purple-100 text-purple-600',
      paid: 'bg-green-100 text-green-600',
      in_service: 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
      reviewed: 'bg-emerald-100 text-emerald-600',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

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
          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{selectedOrder.faultTypeName}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedOrder.id} · {selectedOrder.homeownerName}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                {getStatusLabel(selectedOrder.status)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">业主地址</p>
                <p className="text-sm font-medium text-slate-700">{selectedOrder.homeownerAddress}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">联系电话</p>
                <p className="text-sm font-medium text-slate-700">{selectedOrder.homeownerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">创建时间</p>
                <p className="text-sm font-medium text-slate-700">{selectedOrder.createdAt}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-lg">
              <p className="text-xs text-amber-700 font-medium mb-1">故障描述</p>
              <p className="text-sm text-amber-900">{selectedOrder.description}</p>
            </div>

            {worker && (
              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-lg mt-4 border border-blue-200/50">
                <img src={worker.avatar} alt={worker.name} className="w-12 h-12 rounded-full bg-slate-200 ring-2 ring-white shadow-sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{worker.name}</p>
                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">已认证</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">评分 {worker.rating} · {worker.orderCount}单 · 在线</p>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                  联系师傅
                </button>
              </div>
            )}

            {selectedOrder.quote && (
              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-orange-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    报价信息
                  </p>
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">平台担保</span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-white/60 rounded-lg">
                    <p className="text-xs text-slate-500">配件费</p>
                    <p className="text-base font-bold text-slate-700 mt-0.5">¥{selectedOrder.quote.totalParts}</p>
                  </div>
                  <div className="p-2 bg-white/60 rounded-lg">
                    <p className="text-xs text-slate-500">工时费</p>
                    <p className="text-base font-bold text-slate-700 mt-0.5">¥{selectedOrder.quote.totalLabor}</p>
                  </div>
                  <div className="p-2 bg-white/60 rounded-lg">
                    <p className="text-xs text-slate-500">平台费</p>
                    <p className="text-base font-bold text-slate-700 mt-0.5">¥{selectedOrder.quote.platformFee}</p>
                  </div>
                  <div className="p-2 bg-white/60 rounded-lg">
                    <p className="text-xs text-slate-500">合计</p>
                    <p className="text-base font-bold text-orange-600 mt-0.5">¥{selectedOrder.quote.totalAmount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">服务过程时间线</h3>
                <p className="text-xs text-slate-500 mt-0.5">打卡记录与工序照片全程留痕</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">完成进度</span>
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-green-600">{progressPercent}%</span>
              </div>
            </div>

            <div className="relative pl-2">
              {timeline.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === timeline.length - 1;
                return (
                  <div key={item.id} className="flex items-start gap-4 pb-5 last:pb-0 relative">
                    {!isLast && (
                      <div className={`absolute left-[17px] top-8 w-0.5 ${
                        item.status === 'done' ? 'bg-green-300' : 'bg-slate-200'
                      }`} style={{ height: 'calc(100% - 32px)' }} />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === 'done'
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                        : item.status === 'current'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-4 ring-orange-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {item.status === 'done' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm ${
                          item.status === 'pending' ? 'text-slate-400' : 'text-slate-800'
                        }`}>
                          {item.title}
                        </p>
                        {item.time && (
                          <span className="text-xs text-slate-400 font-mono">{item.time.split(' ')[1]?.slice(0, 5) || item.time}</span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${
                        item.status === 'pending' ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {item.description}
                      </p>
                      {item.subInfo && (
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'photo' && item.subInfo.includes('隐蔽')
                            ? 'bg-red-100 text-red-600'
                            : item.status === 'pending'
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.subInfo}
                        </span>
                      )}

                      {item.type === 'photo' && item.status === 'done' && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-slate-600">{item.title}照片</p>
                              <p className="text-xs text-slate-400 mt-0.5">已上传 · 系统已存档</p>
                            </div>
                            <button className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              查看
                            </button>
                          </div>
                        </div>
                      )}

                      {item.type === 'review' && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < (selectedOrder.review?.rating || 0)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-amber-800">{item.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedOrder.checkIns.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4">打卡明细</h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedOrder.checkIns.map(checkin => (
                  <div key={checkin.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        checkin.type === 'gps' ? 'bg-blue-100 text-blue-600' :
                        checkin.type === 'face' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {checkin.type === 'gps' ? <MapPin className="w-4 h-4" /> :
                         checkin.type === 'face' ? <ScanFace className="w-4 h-4" /> :
                         <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {checkin.type === 'gps' ? 'GPS打卡' :
                           checkin.type === 'face' ? '人脸打卡' : '完工打卡'}
                        </p>
                        <p className="text-xs text-slate-400">{checkin.time.split(' ')[1]?.slice(0, 5)}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      <p>精度: {checkin.location.accuracy}m</p>
                      <p>状态: <span className={checkin.verified ? 'text-green-600' : 'text-red-600'}>
                        {checkin.verified ? '验证通过' : '异常'}
                      </span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedOrder.processPhotos.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">工序照片</h3>
                <span className="text-xs text-slate-500">
                  已上传 {selectedOrder.processPhotos.filter(p => p.timestamp).length}/{selectedOrder.processPhotos.length}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {selectedOrder.processPhotos.map(photo => {
                  const hasPhoto = !!photo.timestamp;
                  return (
                    <div
                      key={photo.id}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                        hasPhoto
                          ? 'border-green-300 bg-green-50'
                          : photo.isHiddenWork
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {hasPhoto ? (
                        <div className="text-center">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-1.5">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-green-700">{photo.step}</p>
                        </div>
                      ) : (
                        <>
                          <Camera className={`w-8 h-8 mb-1.5 ${photo.isHiddenWork ? 'text-red-400' : 'text-slate-400'}`} />
                          <p className={`text-xs font-medium ${photo.isHiddenWork ? 'text-red-600' : 'text-slate-500'}`}>
                            {photo.step}
                          </p>
                          {photo.isRequired && (
                            <p className="text-[10px] mt-1">
                              {photo.isHiddenWork ? (
                                <span className="text-red-500 font-medium">必传·隐蔽工程</span>
                              ) : (
                                <span className="text-slate-400">必传</span>
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedOrder.faultCategory.some(c => c.includes('水电改造')) && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">水电改造项目注意</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      隐蔽工程照片必须在封槽前上传，作为质保重要依据。未上传将无法完工。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackingPage;
