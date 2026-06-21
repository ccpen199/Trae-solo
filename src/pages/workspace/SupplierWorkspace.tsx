import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/Empty';
import {
  User, Building2, MessageSquare, Clock, DollarSign, Package,
  Edit, Eye, Trash2, RefreshCw, PlusCircle, Upload, TrendingUp,
  Bell, Star, Award, MapPin, CheckCircle, XCircle, ArrowRight,
  Briefcase, Shield, Activity, Layers, FileText, ChevronRight
} from 'lucide-react';
import { suppliesAPI, stationsAPI, marketAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Supply, Station } from '@/../shared/types';

interface TodayOverview {
  todayInquiries: number;
  pendingInquiries: number;
  todayTransaction: number;
  totalDealVolume: number;
}

interface SupplierInquiry {
  id: string;
  buyerName: string;
  categoryName: string;
  quantity: number;
  expectedPrice: number;
  message: string;
  createdAt: string;
  status: 'pending' | 'replied' | 'accepted' | 'rejected';
}

const SupplierWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [inquiries, setInquiries] = useState<SupplierInquiry[]>([]);
  const [overview, setOverview] = useState<TodayOverview>({
    todayInquiries: 0,
    pendingInquiries: 0,
    todayTransaction: 0,
    totalDealVolume: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suppliesRes, stationRes] = await Promise.allSettled([
        suppliesAPI.getList({ page: 1, pageSize: 5 }),
        stationsAPI.getList(undefined, undefined, 1, 1),
      ]);

      if (suppliesRes.status === 'fulfilled' && suppliesRes.value.success) {
        setSupplies((suppliesRes.value.data as Supply[]) || []);
      } else {
        setSupplies(getMockSupplies());
      }

      if (stationRes.status === 'fulfilled' && stationRes.value.success && stationRes.value.data) {
        const stations = (stationRes.value.data as Station[]);
        setStation(stations[0] || getMockStation());
      } else {
        setStation(getMockStation());
      }

      setInquiries(getMockInquiries());
      setOverview(getMockOverview());
    } catch (error) {
      console.error('获取工作台数据失败:', error);
      setSupplies(getMockSupplies());
      setStation(getMockStation());
      setInquiries(getMockInquiries());
      setOverview(getMockOverview());
    } finally {
      setLoading(false);
    }
  };

  const getMockSupplies = (): Supply[] => [
    {
      id: '1',
      categoryId: '1',
      categoryName: '废铜',
      supplierId: 's1',
      supplierName: user?.companyName || '绿色回收站',
      tonnage: 50,
      purity: 95,
      price: 68500,
      unit: '元/吨',
      province: '浙江',
      city: '杭州',
      address: '余杭区瓶窑镇',
      description: '优质紫铜废料，货源充足',
      images: [],
      certified: true,
      status: 'active',
      createdAt: '2026-06-18 10:30',
      viewCount: 128,
      inquiryCount: 15,
    },
    {
      id: '2',
      categoryId: '2',
      categoryName: '废铝',
      supplierId: 's1',
      supplierName: user?.companyName || '绿色回收站',
      tonnage: 120,
      purity: 92,
      price: 18200,
      unit: '元/吨',
      province: '浙江',
      city: '杭州',
      address: '余杭区瓶窑镇',
      description: '干净铝合金废料，无杂质',
      images: [],
      certified: true,
      status: 'active',
      createdAt: '2026-06-17 14:20',
      viewCount: 95,
      inquiryCount: 8,
    },
    {
      id: '3',
      categoryId: '3',
      categoryName: '不锈钢',
      supplierId: 's1',
      supplierName: user?.companyName || '绿色回收站',
      tonnage: 35,
      purity: 98,
      price: 12800,
      unit: '元/吨',
      province: '浙江',
      city: '杭州',
      address: '余杭区瓶窑镇',
      description: '304不锈钢废料，成色好',
      images: [],
      certified: false,
      status: 'active',
      createdAt: '2026-06-16 09:15',
      viewCount: 62,
      inquiryCount: 5,
    },
    {
      id: '4',
      categoryId: '8',
      categoryName: '废钢铁',
      supplierId: 's1',
      supplierName: user?.companyName || '绿色回收站',
      tonnage: 200,
      purity: 85,
      price: 3200,
      unit: '元/吨',
      province: '浙江',
      city: '杭州',
      address: '余杭区瓶窑镇',
      description: '重型废钢，品质优良',
      images: [],
      certified: true,
      status: 'sold',
      createdAt: '2026-06-10 16:45',
      viewCount: 210,
      inquiryCount: 22,
    },
    {
      id: '5',
      categoryId: '9',
      categoryName: '废塑料',
      supplierId: 's1',
      supplierName: user?.companyName || '绿色回收站',
      tonnage: 80,
      purity: 90,
      price: 4500,
      unit: '元/吨',
      province: '浙江',
      city: '杭州',
      address: '余杭区瓶窑镇',
      description: 'PET塑料瓶砖，分类清晰',
      images: [],
      certified: false,
      status: 'expired',
      createdAt: '2026-05-28 11:00',
      viewCount: 88,
      inquiryCount: 6,
    },
  ];

  const getMockStation = (): Station => ({
    id: 'st1',
    ownerId: user?.id || 'u1',
    name: user?.companyName || '绿色再生资源回收站',
    address: '浙江省杭州市余杭区瓶窑镇凤都路88号',
    serviceRadius: 50,
    province: '浙江',
    city: '杭州',
    longitude: 120.0,
    latitude: 30.4,
    phone: '13888888888',
    description: '专业回收站，经营废铜、废铝、不锈钢等各类再生资源，诚信经营，量大价优。',
    certifications: [
      { id: 'c1', stationId: 'st1', type: 'business_license', typeName: '营业执照', number: '91330110XXXXXXXXXX', expiryDate: '2028-12-31', imageUrl: '', status: 'valid' },
      { id: 'c2', stationId: 'st1', type: 'operation_permit', typeName: '经营许可证', number: 'HZ-HS-2024-0088', expiryDate: '2027-06-30', imageUrl: '', status: 'valid' },
    ],
    rating: 4.8,
    dealCount: 256,
    createdAt: '2024-03-15',
  });

  const getMockInquiries = (): SupplierInquiry[] => [
    {
      id: 'inq1',
      buyerName: '杭州鑫达金属制品有限公司',
      categoryName: '废铜',
      quantity: 30,
      expectedPrice: 67000,
      message: '长期合作，每月采购50-80吨，可月结，价格能否优惠？',
      createdAt: '2026-06-20 09:15',
      status: 'pending',
    },
    {
      id: 'inq2',
      buyerName: '宁波恒泰再生资源有限公司',
      categoryName: '废铝',
      quantity: 100,
      expectedPrice: 17500,
      message: '现款现货，上门自提，今日可签合同。',
      createdAt: '2026-06-20 08:42',
      status: 'pending',
    },
    {
      id: 'inq3',
      buyerName: '上海浦东废旧物资回收中心',
      categoryName: '不锈钢',
      quantity: 25,
      expectedPrice: 12000,
      message: '需要提供质检报告，可承担运费。',
      createdAt: '2026-06-19 17:30',
      status: 'pending',
    },
    {
      id: 'inq4',
      buyerName: '苏州金诚金属材料有限公司',
      categoryName: '废铜',
      quantity: 50,
      expectedPrice: 68000,
      message: '已报参考价，接受请联系看货。',
      createdAt: '2026-06-19 15:20',
      status: 'replied',
    },
    {
      id: 'inq5',
      buyerName: '温州宏达五金制造厂',
      categoryName: '废钢铁',
      quantity: 150,
      expectedPrice: 3100,
      message: '订单取消，感谢配合，下次再合作。',
      createdAt: '2026-06-19 11:08',
      status: 'rejected',
    },
  ];

  const getMockOverview = (): TodayOverview => ({
    todayInquiries: 12,
    pendingInquiries: 3,
    todayTransaction: 156800,
    totalDealVolume: 3280,
  });

  const getSupplyStatusBadge = (status: Supply['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">在售</Badge>;
      case 'sold':
        return <Badge variant="default">已下架</Badge>;
      case 'expired':
        return <Badge variant="warning">待审核</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getInquiryStatusBadge = (status: SupplierInquiry['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待回复</Badge>;
      case 'replied':
        return <Badge variant="info">已报价</Badge>;
      case 'accepted':
        return <Badge variant="success">已接受</Badge>;
      case 'rejected':
        return <Badge variant="danger">已拒绝</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getCertStatus = (station: Station) => {
    const hasValid = station.certifications.some(c => c.status === 'valid');
    const hasPending = station.certifications.some(c => c.status === 'pending');
    if (hasPending) return { label: '审核中', variant: 'warning' as const };
    if (hasValid) return { label: '已认证', variant: 'success' as const };
    return { label: '未认证', variant: 'danger' as const };
  };

  const handleAcceptInquiry = (id: string) => {
    console.log('接受报价:', id);
  };

  const handleRejectInquiry = (id: string) => {
    console.log('暂不考虑:', id);
  };

  const handleEditSupply = (id: string) => {
    console.log('编辑货源:', id);
  };

  const handleOffShelfSupply = (id: string) => {
    console.log('下架货源:', id);
  };

  const handleViewSupply = (id: string) => {
    console.log('查看货源:', id);
  };

  const StatCard = ({ 
    title, value, unit, icon: Icon, color, change, changeLabel 
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    color: string;
    change?: number;
    changeLabel?: string;
  }) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{value}</span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                change >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {change >= 0 ? (
                  <ArrowRight className="w-3 h-3 rotate-[-45deg]" />
                ) : (
                  <ArrowRight className="w-3 h-3 rotate-45" />
                )}
                <span className="font-medium">{change >= 0 ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-slate-400 ml-1">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  const certStatus = station ? getCertStatus(station) : null;

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-2xl p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-inner border border-white/30">
                  {user?.companyName?.charAt(0) || '绿'}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    您好，{user?.companyName || '供应商'}
                    <span className="text-lg bg-white/20 px-3 py-1 rounded-full font-normal">
                      货源方
                    </span>
                  </h1>
                  <p className="text-green-100 mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {station?.name || '绿色再生资源回收站'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新数据
                </Button>
                <Button size="sm" className="bg-white text-green-600 hover:bg-green-50 shadow-md">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  发布货源
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="今日询价数"
                value={overview.todayInquiries}
                unit="条"
                icon={MessageSquare}
                color="bg-blue-500/80"
                change={25}
                changeLabel="较昨日"
              />
              <StatCard
                title="待处理询价"
                value={overview.pendingInquiries}
                unit="条"
                icon={Clock}
                color="bg-orange-500/80"
                change={-10}
                changeLabel="较昨日"
              />
              <StatCard
                title="今日交易额"
                value={`¥${(overview.todayTransaction / 10000).toFixed(1)}`}
                unit="万"
                icon={DollarSign}
                color="bg-green-700/80"
                change={18}
                changeLabel="较昨日"
              />
              <StatCard
                title="累计成交量"
                value={overview.totalDealVolume.toLocaleString()}
                unit="吨"
                icon={Package}
                color="bg-purple-500/80"
                change={12}
                changeLabel="本月"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    我的货源
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-green-600">
                      查看全部 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button size="sm">
                      <PlusCircle className="w-4 h-4 mr-1" />
                      发布新货源
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {supplies.length === 0 ? (
                  <div className="py-12">
                    <Empty title="暂无货源" description="点击发布新货源开始交易" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">品类</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">吨位</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">纯度</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">价格</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">状态</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">创建时间</th>
                          <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supplies.map((supply) => (
                          <tr key={supply.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                  <Layers className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-medium text-slate-800">{supply.categoryName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{supply.tonnage} 吨</td>
                            <td className="px-4 py-4 text-slate-600">{supply.purity}%</td>
                            <td className="px-4 py-4">
                              <span className="font-semibold text-slate-800">¥{supply.price.toLocaleString()}</span>
                              <span className="text-xs text-slate-400 ml-1">/吨</span>
                            </td>
                            <td className="px-4 py-4">{getSupplyStatusBadge(supply.status)}</td>
                            <td className="px-4 py-4 text-sm text-slate-500">{supply.createdAt}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditSupply(supply.id)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="编辑"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOffShelfSupply(supply.id)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                                  title="下架"
                                  disabled={supply.status !== 'active'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewSupply(supply.id)}
                                  className="p-2 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                                  title="查看"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-green-500 to-emerald-600 relative">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-2 left-4 w-16 h-16 rounded-full bg-white"></div>
                  <div className="absolute bottom-0 right-8 w-24 h-24 rounded-full bg-white"></div>
                </div>
              </div>
              <CardContent className="-mt-10 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl font-bold text-green-600">
                    {station?.name.charAt(0) || '绿'}
                  </div>
                  {certStatus && (
                    <Badge variant={certStatus.variant} size="md" className="mt-3">
                      <Shield className="w-3 h-3 mr-1" />
                      {certStatus.label}
                    </Badge>
                  )}
                </div>

                <h4 className="font-bold text-lg text-slate-800 mb-1">{station?.name}</h4>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {station?.address}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-xl text-slate-800">{station?.rating}</span>
                    </div>
                    <p className="text-xs text-slate-500">综合评分</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-xl text-slate-800">{station?.dealCount}</span>
                    </div>
                    <p className="text-xs text-slate-500">累计交易</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-xl text-slate-800">{station?.certifications.filter(c => c.status === 'valid').length}</span>
                    </div>
                    <p className="text-xs text-slate-500">有效资质</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xl text-slate-800">{station?.serviceRadius}</span>
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                    <p className="text-xs text-slate-500">服务半径</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                待处理询价
                <Badge variant="warning" size="sm" className="ml-2">
                  {inquiries.filter(i => i.status === 'pending').length} 条待回复
                </Badge>
              </h3>
              <Button variant="ghost" size="sm" className="text-green-600">
                查看全部 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {inquiries.length === 0 ? (
              <div className="py-12">
                <Empty title="暂无询价" description="等待采购方向您发起询价" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">采购方</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">品类</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">数量</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">目标价</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">留言</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">询价时间</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">状态</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {inquiry.buyerName.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800 text-sm">{inquiry.buyerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="info">{inquiry.categoryName}</Badge>
                        </td>
                        <td className="px-4 py-4 text-slate-700 font-medium">{inquiry.quantity} 吨</td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-orange-600">¥{inquiry.expectedPrice.toLocaleString()}</span>
                          <span className="text-xs text-slate-400 ml-1">/吨</span>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="text-sm text-slate-600 truncate" title={inquiry.message}>
                            {inquiry.message}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{inquiry.createdAt}</td>
                        <td className="px-4 py-4">{getInquiryStatusBadge(inquiry.status)}</td>
                        <td className="px-6 py-4">
                          {inquiry.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptInquiry(inquiry.id)}
                                className="px-3 py-1.5"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                接受报价
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectInquiry(inquiry.id)}
                                className="text-slate-500 hover:text-red-500 px-3 py-1.5"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                暂不考虑
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-slate-400 px-3 py-1.5">
                              <FileText className="w-4 h-4 mr-1" />
                              详情
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-green-600" />
              快捷入口
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="group flex flex-col items-center p-6 rounded-xl border-2 border-slate-100 hover:border-green-300 hover:bg-green-50/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors">发布货源</span>
                <span className="text-xs text-slate-400 mt-1">快速上架新货源</span>
              </button>

              <button className="group flex flex-col items-center p-6 rounded-xl border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">上传资质</span>
                <span className="text-xs text-slate-400 mt-1">完善认证资料</span>
              </button>

              <button className="group flex flex-col items-center p-6 rounded-xl border-2 border-slate-100 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 group-hover:text-orange-700 transition-colors">查看行情</span>
                <span className="text-xs text-slate-400 mt-1">实时掌握价格走势</span>
              </button>

              <button className="group flex flex-col items-center p-6 rounded-xl border-2 border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                  <Bell className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">设置预警</span>
                <span className="text-xs text-slate-400 mt-1">价格变动智能提醒</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SupplierWorkspace;
