import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SupplyCard } from '@/components/supplies/SupplyCard';
import { Empty } from '@/components/Empty';
import {
  ArrowLeft, MapPin, Phone, Star, Navigation, CheckCircle,
  Clock, User, Award, FileCheck, Shield, Calendar, Eye,
  MessageCircle, Send, Upload, Plus, TrendingUp, Edit3
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationsAPI, suppliesAPI } from '@/services/api';
import type { Station, Supply, Certification } from '../../../shared/types';

const StationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<Station | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'supplies' | 'certs'>('info');
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [stationResponse, suppliesResponse] = await Promise.all([
          stationsAPI.getDetail(id),
          suppliesAPI.getList({ page: 1, pageSize: 8 }),
        ]);

        if (stationResponse.success && stationResponse.data) {
          setStation(stationResponse.data);
        }

        if (suppliesResponse.success && suppliesResponse.data) {
          const stationSupplies = suppliesResponse.data.filter(s => s.stationId === id).slice(0, 4);
          setSupplies(stationSupplies);
        }
      } catch (error) {
        console.error('获取回收站详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!station) {
    return (
      <Layout requireAuth>
        <Empty
          title="回收站不存在"
          description="该回收站可能已被移除或不存在"
          action={
            <Button onClick={() => navigate('/stations')}>
              返回回收站列表
            </Button>
          }
        />
      </Layout>
    );
  }

  const validCerts = station.certifications.filter(c => c.status === 'valid');
  const expiredCerts = station.certifications.filter(c => c.status === 'expired');
  const pendingCerts = station.certifications.filter(c => c.status === 'pending');

  const getCertStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="success">有效</Badge>;
      case 'expired':
        return <Badge variant="danger">已过期</Badge>;
      case 'pending':
        return <Badge variant="warning">审核中</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <button
          onClick={() => navigate('/stations')}
          className="flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回回收站列表
        </button>
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-green-600 to-green-500">
          <img
            src={station.coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=recycling%20station%20aerial%20view&image_size=landscape_16_9'}
            alt={station.name}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white -mb-12">
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-3xl font-bold">
                  {station.name.charAt(0)}
                </div>
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{station.name}</h1>
                  {validCerts.length > 0 && (
                    <Badge variant="gold" className="flex items-center gap-1 bg-yellow-400/90 text-yellow-900">
                      <CheckCircle className="w-3.5 h-3.5" />
                      资质认证
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    {renderStars(station.rating)}
                    <span className="font-semibold ml-1">{station.rating.toFixed(1)}</span>
                  </div>
                  <span>|</span>
                  <span>{station.dealCount} 笔交易</span>
                  <span>|</span>
                  <span>入驻 {new Date(station.createdAt).getFullYear()} 年</span>
                </div>
              </div>

              <div className="flex gap-3 pb-2">
                <Button variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑资料
                </Button>
                <Button className="bg-white text-green-600 hover:bg-green-50">
                  <Phone className="w-4 h-4 mr-2" />
                  联系我们
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">在供货源</p>
              <p className="text-2xl font-bold text-slate-800">{supplies.length}</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">服务半径</p>
              <p className="text-2xl font-bold text-green-600">{station.serviceRadius} 公里</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">资质证书</p>
              <p className="text-2xl font-bold text-blue-600">{validCerts.length} 项</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">响应率</p>
              <p className="text-2xl font-bold text-orange-500">98%</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6">
          <div className="flex gap-8">
            {[
              { key: 'info', label: '基本信息', icon: User },
              { key: 'supplies', label: '在供货源', icon: TrendingUp },
              { key: 'certs', label: '资质证书', icon: FileCheck },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-500 text-green-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'info' && (
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    基本信息
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">详细地址</p>
                        <p className="text-slate-800">{station.province} {station.city} {station.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">联系电话</p>
                        <p className="text-slate-800">{station.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">服务半径</p>
                        <p className="text-slate-800">{station.serviceRadius} 公里（{station.city}及周边城市）</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">入驻时间</p>
                        <p className="text-slate-800">{new Date(station.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2">回收站简介</h4>
                    <p className="text-slate-600 leading-relaxed">{station.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-green-600" />
                    服务范围
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" viewBox="0 0 400 200">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22c55e" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                    
                    <div className="relative">
                      <div 
                        className="w-48 h-48 rounded-full bg-green-500/20 border-2 border-green-500/40 border-dashed animate-pulse"
                        style={{ animationDuration: '3s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {station.serviceRadius}km
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    以回收站为中心，覆盖 {station.serviceRadius} 公里服务半径范围，支持上门回收
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'supplies' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  在供货源
                </h2>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  发布货源
                </Button>
              </CardHeader>
              <CardContent>
                {supplies.length === 0 ? (
                  <Empty
                    title="暂无在供货源"
                    description="该回收站还未发布货源信息"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplies.map((supply) => (
                      <SupplyCard key={supply.id} supply={supply} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'certs' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  资质证书
                </h2>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  上传资质
                </Button>
              </CardHeader>
              <CardContent>
                {station.certifications.length === 0 ? (
                  <Empty
                    title="暂无资质证书"
                    description="上传营业执照、经营许可证等资质证书，获得平台认证标识"
                    action={
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        立即上传
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {station.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-green-300 transition-colors"
                      >
                        <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img
                            src={cert.imageUrl}
                            alt={cert.typeName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `<div class="flex flex-col items-center justify-center w-full h-full"><FileCheck class="w-6 h-6 text-green-500 mb-1" /><span class="text-xs text-slate-400">${cert.typeName}</span></div>`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800">{cert.typeName}</h4>
                            {getCertStatusBadge(cert.status)}
                          </div>
                          <p className="text-sm text-slate-500">证件编号: {cert.number}</p>
                          <p className="text-sm text-slate-500">有效期至: {cert.expiryDate}</p>
                        </div>
                        <Button variant="outline" size="sm">查看详情</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-800">在线询价</h2>
              <p className="text-sm text-slate-500">向该回收站发送您的需求</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Clock className="w-4 h-4" />
                  <span>平均响应时间 <strong>30分钟</strong> 内</span>
                </div>
              </div>

              <textarea
                placeholder="请描述您的采购需求，如需要的品类、数量、质量要求、交货地点等..."
                rows={5}
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              />

              <Button
                className="w-full text-lg py-4"
                size="lg"
                disabled={!inquiryMessage.trim()}
                onClick={() => setShowInquiry(true)}
              >
                <Send className="w-5 h-5 mr-2" />
                发送询价
              </Button>

              <div className="space-y-2 text-xs text-slate-400">
                <p>• 发送后将通过短信和站内信通知回收站</p>
                <p>• 您的联系方式仅对该回收站可见</p>
                <p>• 如24小时未收到回复，可联系平台客服介入</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-800">交易保障</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">平台认证</p>
                  <p className="text-xs text-slate-500">资质审核，身份认证</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">保证金保障</p>
                  <p className="text-xs text-slate-500">缴纳保证金，违约赔付</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">交易担保</p>
                  <p className="text-xs text-slate-500">验货确认后再付款</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">确认发送询价</h3>
              <p className="text-sm text-slate-500 mt-1">您的询价内容将发送给 {station.name}</p>
            </div>
            <div className="p-6">
              <div className="p-4 bg-slate-50 rounded-lg mb-4">
                <p className="text-sm text-slate-600">{inquiryMessage}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowInquiry(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={() => {
                  setShowInquiry(false);
                  setInquiryMessage('');
                }}>
                  确认发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StationDetail;
