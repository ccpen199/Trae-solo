import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '@/store';
import {
  Plus, X, Calendar, Clock, User, Phone, MapPin, Monitor, CheckCircle, XCircle,
  Wifi, WifiOff, Camera, QrCode, Bluetooth, Info, AlertTriangle, RefreshCw,
  Settings, Bell, Search, Filter, Download, ChevronDown, MoreHorizontal,
  CreditCard, KeyRound
} from 'lucide-react';
import { accessApi } from '@/api';
import StatusBadge from '@/components/common/StatusBadge';
import type { VisitorPass, AccessRecord, AccessDevice, CreateVisitorRequest } from '@shared/types';

type TabType = 'methods' | 'passes' | 'records' | 'devices';

const tabLabels: Record<TabType, string> = {
  methods: '通行方式',
  passes: '访客通行证',
  records: '通行记录',
  devices: '设备状态',
};

const accessMethodLabels: Record<string, string> = {
  qr: '二维码',
  face: '人脸识别',
  bluetooth: '蓝牙',
  nfc: 'NFC',
  card: '门禁卡',
};

const deviceTypeLabels: Record<string, string> = {
  gate: '闸机',
  elevator: '电梯',
  door: '门禁',
};

const AccessPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('methods');
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [devices, setDevices] = useState<AccessDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);
  const [passFilter, setPassFilter] = useState<'all' | 'active' | 'expired' | 'used'>('all');
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    startDate: '',
    endDate: '',
    purpose: '',
    times: '1',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, passFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (activeTab === 'passes') {
        const res = await accessApi.getVisitorPasses(passFilter !== 'all' ? passFilter : undefined);
        if (res.success && res.data) {
          setPasses(res.data);
        }
      } else if (activeTab === 'records') {
        const res = await accessApi.getAccessRecords(20, 0);
        if (res.success && res.data) {
          setRecords(res.data);
        }
      } else if (activeTab === 'devices') {
        const res = await accessApi.getAccessDevices();
        if (res.success && res.data) {
          setDevices(res.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const requestData: CreateVisitorRequest = {
        visitorName: formData.visitorName,
        visitorPhone: formData.visitorPhone,
        validFrom: new Date(formData.startDate).toISOString(),
        validTo: new Date(formData.endDate).toISOString(),
        accessAreas: ['小区大门', '单元门'],
      };

      const res = await accessApi.createVisitorPass(requestData);
      if (res.success) {
        setShowModal(false);
        setFormData({
          visitorName: '',
          visitorPhone: '',
          startDate: '',
          endDate: '',
          purpose: '',
          times: '1',
        });
        fetchData();
      } else {
        setError(res.message || '创建失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRecordTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getPassStatusInfo = (pass: VisitorPass) => {
    const now = new Date();
    const validTo = new Date(pass.valid_to);
    const validFrom = new Date(pass.valid_from);
    const diffHours = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (pass.status === 'expired' || now > validTo) {
      return { status: 'expired', label: '已过期', color: 'bg-red-100 text-red-600', icon: XCircle, alert: true };
    }
    if (pass.status === 'used') {
      return { status: 'used', label: '已使用', color: 'bg-gray-100 text-gray-600', icon: CheckCircle, alert: false };
    }
    if (now < validFrom) {
      return { status: 'pending', label: '未生效', color: 'bg-yellow-100 text-yellow-600', icon: Clock, alert: false };
    }
    if (diffHours < 1) {
      return { status: 'expiring', label: `即将过期(${Math.round(diffHours * 60)}分钟)`, color: 'bg-orange-100 text-orange-600', icon: AlertTriangle, alert: true };
    }
    if (diffDays <= 1) {
      return { status: 'active', label: `有效(${diffDays}天后过期)`, color: 'bg-green-100 text-green-600', icon: CheckCircle, alert: false };
    }
    return { status: 'active', label: '有效', color: 'bg-green-100 text-green-600', icon: CheckCircle, alert: false };
  };

  const getRemainingTime = (pass: VisitorPass) => {
    const now = new Date();
    const validTo = new Date(pass.valid_to);
    const diffMs = validTo.getTime() - now.getTime();

    if (diffMs <= 0) return '已过期';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      return `${diffDays}天${remainingHours}小时`;
    }
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${remainingHours}小时${diffMinutes}分钟`;
  };

  const accessMethods = [
    {
      key: 'face',
      name: '人脸识别',
      icon: Camera,
      description: '刷脸开门，无需携带任何物品',
      status: 'active',
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
    },
    {
      key: 'qr',
      name: '二维码',
      icon: QrCode,
      description: '动态二维码，每分钟自动刷新',
      status: 'active',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
    },
    {
      key: 'bluetooth',
      name: '蓝牙感应',
      icon: Bluetooth,
      description: '靠近自动感应，手机揣兜即可',
      status: 'active',
      color: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
    },
    {
      key: 'nfc',
      name: 'NFC碰一碰',
      icon: Wifi,
      description: '手机碰一碰门禁，快速开门',
      status: 'active',
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
    },
    {
      key: 'card',
      name: '门禁卡',
      icon: CreditCard,
      description: '实体门禁卡，刷门禁开门',
      status: 'inactive',
      color: 'from-gray-400 to-slate-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-500',
    },
  ];

  const filteredPasses = passes.filter(pass => {
    if (passFilter === 'all') return true;
    const status = getPassStatusInfo(pass).status;
    return status === passFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const renderAccessMethods = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">无感通行体系</h2>
            <p className="text-blue-100">支持5种通行方式，为您提供便捷、安全的出入体验</p>
          </div>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 text-sm transition-colors">
            <Settings className="w-4 h-4 inline mr-2" />
            通行设置
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {accessMethods.map((method) => (
          <div
            key={method.key}
            className={`${method.bgColor} border ${method.borderColor} rounded-xl p-5 transition-all hover:shadow-md ${method.status === 'active' ? 'cursor-pointer' : 'opacity-70'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center`}>
                <method.icon className="w-6 h-6 text-white" />
              </div>
              {method.status === 'active' ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                  已激活
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                  未激活
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{method.name}</h3>
            <p className="text-xs text-gray-500 mb-3">{method.description}</p>
            {method.status === 'active' ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                可正常使用
              </div>
            ) : (
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                点击激活 →
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          通行说明
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">人脸识别</p>
                <p className="text-xs text-gray-500">站在设备前1-2米处，正视摄像头，识别成功后自动开门</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">二维码通行</p>
                <p className="text-xs text-gray-500">打开小程序二维码，对准扫码区，听到"嘀"声后通行</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">蓝牙感应</p>
                <p className="text-xs text-gray-500">确保手机蓝牙已开启，靠近门禁设备时自动感应开门</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">NFC碰一碰</p>
                <p className="text-xs text-gray-500">将手机NFC区域靠近门禁读卡区，即可快速开门</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVisitorPasses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">访客通行证管理</h2>
          <p className="text-sm text-gray-500">创建和管理访客通行证，支持动态生成与自动过期</p>
        </div>
        {(user?.role === 'owner' || user?.role === 'tenant' || user?.role === 'property') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建通行证
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {(['all', 'active', 'expired', 'used'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPassFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                passFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter === 'all' ? '全部' : filter === 'active' ? '有效' : filter === 'expired' ? '已过期' : '已使用'}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索访客姓名/手机号"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">总通行证</p>
          <p className="text-2xl font-bold text-gray-800">{passes.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">有效通行证</p>
          <p className="text-2xl font-bold text-green-600">
            {passes.filter(p => getPassStatusInfo(p).status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">即将过期</p>
          <p className="text-2xl font-bold text-orange-600">
            {passes.filter(p => getPassStatusInfo(p).status === 'expiring').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">已过期</p>
          <p className="text-2xl font-bold text-red-600">
            {passes.filter(p => getPassStatusInfo(p).status === 'expired').length}
          </p>
        </div>
      </div>

      {filteredPasses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <KeyRound className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无通行证记录</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPasses.map((pass) => {
            const statusInfo = getPassStatusInfo(pass);
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={pass.id}
                className={`bg-white rounded-xl border ${statusInfo.alert ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'} overflow-hidden hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setSelectedPass(pass)}
              >
                {statusInfo.alert && (
                  <div className="bg-red-50 px-4 py-2 flex items-center gap-2 text-red-600 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    {statusInfo.label}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{pass.visitor_name}</h3>
                      <p className="text-sm text-gray-500">{pass.visitor_phone}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-lg">
                    <QRCodeSVG
                      value={pass.qr_code}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">有效期：{formatDate(pass.valid_from)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>至：{formatDate(pass.valid_to)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>通行区域：{pass.access_areas.join('、')}</span>
                    </div>
                  </div>

                  {statusInfo.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">剩余时间</span>
                      <span className="text-sm font-semibold text-blue-600">{getRemainingTime(pass)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">通行记录</h2>
          <p className="text-sm text-gray-500">查看所有人员的进出记录和通行方式</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">今日通行</p>
          <p className="text-2xl font-bold text-gray-800">128</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">人脸识别</p>
          <p className="text-2xl font-bold text-green-600">85</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">二维码</p>
          <p className="text-2xl font-bold text-blue-600">32</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">异常记录</p>
          <p className="text-2xl font-bold text-red-600">3</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无通行记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">人员</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">类型</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">通行方式</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">设备位置</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">结果</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatRecordTime(record.access_time)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{record.person_name}</p>
                          <p className="text-xs text-gray-400">{record.person_type === 'owner' ? '业主' : record.person_type === 'tenant' ? '租户' : '访客'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.person_type === 'visitor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {record.person_type === 'visitor' ? '访客' : '住户'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.access_type === 'qr' && <QrCode className="w-3 h-3" />}
                        {record.access_type === 'face' && <Camera className="w-3 h-3" />}
                        {record.access_type === 'bluetooth' && <Bluetooth className="w-3 h-3" />}
                        {record.access_type === 'nfc' && <Wifi className="w-3 h-3" />}
                        {accessMethodLabels[record.access_type] || record.access_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {record.device_name || '小区大门'}
                    </td>
                    <td className="py-3 px-4">
                      {record.result === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          成功
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          失败
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderDevices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">设备状态监控</h2>
          <p className="text-sm text-gray-500">实时监控所有门禁设备的在线状态和运行情况</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          刷新状态
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">设备总数</p>
          <p className="text-2xl font-bold text-gray-800">{devices.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">在线设备</p>
          <p className="text-2xl font-bold text-green-600">
            {devices.filter(d => d.status === 'online').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">离线设备</p>
          <p className="text-2xl font-bold text-red-600">
            {devices.filter(d => d.status === 'offline').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">在线率</p>
          <p className="text-2xl font-bold text-blue-600">
            {devices.length > 0 ? Math.round(devices.filter(d => d.status === 'online').length / devices.length * 100) : 0}%
          </p>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无设备信息</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`bg-white rounded-xl border ${device.status === 'offline' ? 'border-red-200' : 'border-gray-200'} p-5 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    device.status === 'online' ? 'bg-green-100 text-green-600' :
                    device.status === 'offline' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{device.name}</h3>
                    <p className="text-xs text-gray-500">{deviceTypeLabels[device.type] || device.type}</p>
                  </div>
                </div>
                <StatusBadge status={device.status} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{device.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {device.status === 'online' ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-600">设备在线 · 运行正常</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-600">设备离线 · 请检修</span>
                    </>
                  )}
                </div>
              </div>
              {device.last_heartbeat && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    最后心跳：{formatDate(device.last_heartbeat)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const visibleTabs = (() => {
    if (user?.role === 'property') {
      return ['methods', 'passes', 'records', 'devices'] as TabType[];
    }
    if (user?.role === 'owner' || user?.role === 'tenant') {
      return ['methods', 'passes', 'records'] as TabType[];
    }
    return ['methods'] as TabType[];
  })();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">通行管理</h1>
        <p className="text-gray-500">无感通行体系，支持人脸/二维码/蓝牙/NFC多模识别</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-red-600">
            {error}
          </div>
        )}

        <div className="p-6">
          {activeTab === 'methods' && renderAccessMethods()}
          {activeTab === 'passes' && renderVisitorPasses()}
          {activeTab === 'records' && renderRecords()}
          {activeTab === 'devices' && renderDevices()}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">创建访客通行证</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  访客姓名
                </label>
                <input
                  type="text"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入访客姓名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  联系电话
                </label>
                <input
                  type="tel"
                  value={formData.visitorPhone}
                  onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入联系电话"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    开始时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    结束时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  来访事由
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入来访事由"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  可通行次数
                </label>
                <select
                  value={formData.times}
                  onChange={(e) => setFormData({ ...formData, times: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">1次</option>
                  <option value="3">3次</option>
                  <option value="5">5次</option>
                  <option value="unlimited">不限次数</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">通行证自动失效规则</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                      <li>超过结束时间后自动失效</li>
                      <li>使用完毕后自动标记为已使用</li>
                      <li>可随时手动吊销通行证</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '创建中...' : '创建通行证'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">通行证详情</h2>
              <button
                onClick={() => setSelectedPass(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <QRCodeSVG
                    value={selectedPass.qr_code}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">访客姓名</p>
                    <p className="font-medium text-gray-800">{selectedPass.visitor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">联系电话</p>
                    <p className="font-medium text-gray-800">{selectedPass.visitor_phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">通行区域</p>
                  <p className="font-medium text-gray-800">{selectedPass.access_areas.join('、')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">有效期</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedPass.valid_from)} 至 {formatDate(selectedPass.valid_to)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">当前状态</span>
                  <StatusBadge status={getPassStatusInfo(selectedPass).status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessPage;
