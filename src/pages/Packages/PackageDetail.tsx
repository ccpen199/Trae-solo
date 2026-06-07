import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Circle,
  Bell,
  Edit,
} from 'lucide-react';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { packageApi } from '@/lib/api';
import { useCabinetStore } from '@/store/cabinetStore';
import { cn } from '@/lib/utils';

interface PackageItem {
  id: string;
  trackingNumber: string;
  type: 'send' | 'receive' | 'store';
  status: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  cabinetId: string;
  compartmentId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackingEvent {
  id: string;
  status: string;
  message: string;
  time: string;
  completed: boolean;
}

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { packages } = useCabinetStore();
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<PackageItem | null>(null);
  const [tracking, setTracking] = useState<TrackingEvent[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    loadPackageData();
  }, [id]);

  const loadPackageData = async () => {
    setLoading(true);
    try {
      const foundPackage = (packages as PackageItem[]).find((p) => p.id === id);
      if (foundPackage) {
        setPkg(foundPackage);
      } else {
        const result = await packageApi.getById(id!);
        if (result.success && result.data) {
          setPkg(result.data as PackageItem);
        }
      }

      setTracking([
        {
          id: '1',
          status: 'created',
          message: '包裹已创建',
          time: '2024-01-15 09:00:00',
          completed: true,
        },
        {
          id: '2',
          status: 'scanned',
          message: '包裹已扫描入库',
          time: '2024-01-15 09:30:00',
          completed: true,
        },
        {
          id: '3',
          status: 'stored',
          message: '包裹已存入柜子',
          time: '2024-01-15 10:00:00',
          completed: true,
        },
        {
          id: '4',
          status: 'notified',
          message: '已通知收件人',
          time: '2024-01-15 10:05:00',
          completed: false,
        },
        {
          id: '5',
          status: 'picked',
          message: '包裹已取件',
          time: '',
          completed: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load package data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!pkg) return;
    try {
      const result = await packageApi.sendNotification(pkg.id);
      if (result.success) {
        setNotificationSent(true);
        setTimeout(() => setNotificationSent(false), 3000);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!pkg || !newStatus) return;
    try {
      const result = await packageApi.updateStatus(pkg.id, newStatus);
      if (result.success) {
        setPkg({ ...pkg, status: newStatus });
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'send':
        return '寄件';
      case 'receive':
        return '收件';
      case 'store':
        return '存储';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 mb-4">包裹不存在</p>
        <button
          onClick={() => navigate('/packages')}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/packages')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">包裹详情</h1>
          <p className="text-slate-500 text-sm mt-1">
            运单号: {pkg.trackingNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSendNotification}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              notificationSent
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-sky-500 text-white hover:bg-sky-600'
            )}
          >
            <Bell className="w-4 h-4" />
            {notificationSent ? '已发送' : '发送通知'}
          </button>
          <button
            onClick={() => {
              setNewStatus(pkg.status);
              setShowStatusModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
            更新状态
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              物流追踪
            </h2>
            <div className="relative">
              {tracking.map((event, index) => (
                <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    {event.completed ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 flex-shrink-0" />
                    )}
                    {index < tracking.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 mt-2',
                          event.completed ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        'font-medium',
                        event.completed ? 'text-slate-800' : 'text-slate-400'
                      )}
                    >
                      {event.message}
                    </p>
                    {event.time && (
                      <p className="text-sm text-slate-500 mt-1">{event.time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              包裹信息
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">运单号</p>
                    <p className="text-sm font-medium text-slate-700">
                      {pkg.trackingNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Send className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">类型</p>
                    <p className="text-sm font-medium text-slate-700">
                      {getTypeLabel(pkg.type)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">创建时间</p>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(pkg.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">状态</p>
                    <StatusBadge
                      status={
                        (pkg.status as 'pending' | 'processing' | 'completed') ||
                        'pending'
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">存放位置</p>
                    <p className="text-sm font-medium text-slate-700">
                      柜子 #{pkg.cabinetId.slice(-4)} · 格子 #
                      {pkg.compartmentId.slice(-2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              寄件人信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">{pkg.senderName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">{pkg.senderPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              收件人信息
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {pkg.receiverName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {pkg.receiverPhone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="更新包裹状态"
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              状态
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowStatusModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpdateStatus}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
