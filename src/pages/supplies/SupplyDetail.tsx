import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InquiryForm } from '@/components/supplies/InquiryForm';
import { SupplyCard } from '@/components/supplies/SupplyCard';
import { Empty } from '@/components/Empty';
import { 
  ArrowLeft, MapPin, Weight, Droplets, Eye, MessageCircle, 
  CheckCircle, Phone, Send, Share2, Bookmark, Clock, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { suppliesAPI } from '@/services/api';
import type { Supply } from '../../../shared/types';

const SupplyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedSupplies, setRelatedSupplies] = useState<Supply[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detailResponse, listResponse] = await Promise.all([
          suppliesAPI.getDetail(id),
          suppliesAPI.getList({ page: 1, pageSize: 8 }),
        ]);

        if (detailResponse.success && detailResponse.data) {
          setSupply(detailResponse.data);
        }

        if (listResponse.success && listResponse.data) {
          const related = listResponse.data.filter(s => s.id !== id).slice(0, 4);
          setRelatedSupplies(related);
        }
      } catch (error) {
        console.error('获取货源详情失败:', error);
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

  if (!supply) {
    return (
      <Layout requireAuth>
        <Empty
          title="货源不存在"
          description="该货源可能已被删除或已成交"
          action={
            <Button onClick={() => navigate('/supplies')}>
              返回货源列表
            </Button>
          }
        />
      </Layout>
    );
  }

  const pricePerTon = Math.round(supply.price / supply.tonnage);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % supply.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + supply.images.length) % supply.images.length);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="md">在售中</Badge>;
      case 'sold':
        return <Badge variant="info" size="md">已成交</Badge>;
      case 'expired':
        return <Badge variant="default" size="md">已过期</Badge>;
      default:
        return <Badge variant="default" size="md">{status}</Badge>;
    }
  };

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <button
          onClick={() => navigate('/supplies')}
          className="flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回货源列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="relative h-96 bg-slate-100">
                <img
                  src={supply.images[currentImageIndex] || supply.images[0]}
                  alt={supply.categoryName}
                  className="w-full h-full object-contain"
                />
                {supply.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-slate-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {supply.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  {supply.certified && (
                    <Badge variant="gold" className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      认证货源
                    </Badge>
                  )}
                  {getStatusBadge(supply.status)}
                </div>
              </div>

              {supply.images.length > 1 && (
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {supply.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                          idx === currentImageIndex
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-800">货源详情</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {supply.supplierName} - {supply.categoryName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {supply.viewCount} 次浏览
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {supply.inquiryCount} 次询价
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(supply.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">单价</p>
                  <p className="text-2xl font-bold text-green-600">
                    ¥{pricePerTon.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">元/吨</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">总吨位</p>
                  <p className="text-2xl font-bold text-slate-800">{supply.tonnage}</p>
                  <p className="text-xs text-slate-400">吨</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">纯度</p>
                  <p className="text-2xl font-bold text-slate-800">{supply.purity}%</p>
                  <p className="text-xs text-slate-400">纯度</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-500 mb-1">总价</p>
                  <p className="text-2xl font-bold text-orange-500">
                    ¥{supply.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">元</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3">货源描述</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {supply.description}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3">地理位置</h4>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-4 rounded-xl">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>{supply.province} {supply.city} {supply.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {relatedSupplies.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">相关推荐</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedSupplies.map((s) => (
                    <SupplyCard key={s.id} supply={s} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-800">供应商信息</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl font-bold">
                  {supply.supplierName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{supply.supplierName}</h3>
                  {supply.stationName && (
                    <p className="text-sm text-slate-500">{supply.stationName}</p>
                  )}
                </div>
                {supply.certified && (
                  <Badge variant="gold" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已认证
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>会员等级: VIP 会员</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>入驻时间: {new Date(supply.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Weight className="w-4 h-4 text-slate-400" />
                  <span>累计交易: 128 笔</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  电话联系
                </Button>
                <Button variant="outline" className="w-full">
                  <Bookmark className="w-4 h-4 mr-2" />
                  收藏
                </Button>
              </div>

              <Button 
                className="w-full text-lg py-4" 
                size="lg"
                onClick={() => setShowInquiry(true)}
                disabled={supply.status !== 'active'}
              >
                <Send className="w-5 h-5 mr-2" />
                {supply.status === 'active' ? '立即询价' : '该货源已下架'}
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm text-slate-400 pt-2">
                <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
                <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                  举报
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-800">交易须知</h3>
            </CardHeader>
            <CardContent className="text-sm text-slate-500 space-y-2">
              <p>• 请通过平台进行交易，保障资金安全</p>
              <p>• 建议现场验货后再付款</p>
              <p>• 确认货品质量、数量无误后再确认收货</p>
              <p>• 如遇纠纷，请联系平台客服介入</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showInquiry && supply && (
        <InquiryForm
          supply={supply}
          onClose={() => setShowInquiry(false)}
          onSuccess={() => {
            setSupply(prev => prev ? { ...prev, inquiryCount: prev.inquiryCount + 1 } : null);
          }}
        />
      )}
    </Layout>
  );
};

export default SupplyDetail;
