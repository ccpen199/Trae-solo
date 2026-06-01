import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Phone, MessageCircle, Heart, Share2, Bed, Square, Compass, Calendar,
  User, Star, TrendingUp, Shield, ShieldCheck, ShieldX, FileText, Eye, AlertTriangle,
  CheckCircle2, Circle, XCircle, Flag, EyeOff, Vibrate, ChevronRight, RotateCcw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const PriceChart: React.FC<{ records: any[] }> = ({ records }) => {
  if (!records || records.length === 0) return null;

  const sorted = [...records].sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());
  const prices = sorted.map((r: any) => r.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const w = 500, h = 200, px = 50, py = 30;
  const chartW = w - px * 2, chartH = h - py * 2;

  const points = sorted.map((r: any, i: number) => {
    const x = px + (i / (sorted.length - 1)) * chartW;
    const y = py + chartH - ((r.price - minP) / range) * chartH;
    return { x, y, price: r.price, date: r.record_date };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${py + chartH} L ${points[0].x} ${py + chartH} Z`;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = py + ratio * chartH;
          const val = maxP - ratio * range;
          return (
            <g key={ratio}>
              <line x1={px} y1={y} x2={w - px} y2={y} stroke="#e5e7eb" strokeDasharray="4 2" />
              <text x={px - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">{Math.round(val)}</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={h - 6} textAnchor="middle" className="text-[9px]" fill="#9ca3af">
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [priceStats, setPriceStats] = useState<any>(null);
  const [priceRecords, setPriceRecords] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [ocrData, setOcrData] = useState<any>(null);
  const [fakeData, setFakeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showVRModal, setShowVRModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: '', phone: '' });
  const [appealForm, setAppealForm] = useState({ reason: '', evidence: '' });
  const { user } = useAuthStore();

  useEffect(() => {
    if (id) loadProperty();
  }, [id]);

  const loadProperty = async () => {
    setLoading(true);
    const response = await api.properties.detail(id!);
    if (response.success && response.data) {
      const d = response.data as any;
      setProperty(d.property);
      setPriceStats(d.priceStats);
      setPriceRecords(d.price_records || []);
      setVerifications(d.property_verifications || []);

      const verRes = await api.properties.verification(id!);
      if (verRes.success && verRes.data) {
        const vd = verRes.data as any;
        setOcrData(vd.ocr);
        setFakeData(vd.fake_detection);
      }

      const fakeRes = await api.tools.fakeDetection(id!);
      if (fakeRes.success && fakeRes.data) {
        setFakeData(fakeRes.data as any);
      }
    }
    setLoading(false);
  };

  const handleFavorite = async () => {
    if (!user) { alert('请先登录'); return; }
    const response = await api.properties.favorite(id!);
    if (response.success && response.data) setIsFavorite((response.data as any).isFavorite);
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('请先登录'); return; }
    const response = await api.properties.inquiry(id!, inquiryForm);
    if (response.success) {
      alert('咨询已提交，经纪人会尽快联系您');
      setShowInquiryModal(false);
      setInquiryForm({ message: '', phone: '' });
    }
  };

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('请先登录'); return; }
    const response = await api.properties.appeal(id!, appealForm);
    if (response.success) {
      alert('举报已提交，我们将尽快核实');
      setShowAppealModal(false);
      setAppealForm({ reason: '', evidence: '' });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { new_house: '新房', second_hand: '二手房', rental: '租赁', commercial: '商业地产' };
    return labels[type] || type;
  };

  const getDeviationRate = () => {
    if (!property || !priceStats) return null;
    const communityTotal = priceStats.avg_price * property.area;
    if (communityTotal === 0) return null;
    return ((property.price * 10000 - communityTotal) / communityTotal * 100);
  };

  const getVerificationSteps = () => {
    if (!property) return [];
    const steps = [
      { label: '房东委托', desc: '房东提交房源信息', status: 'completed' as const },
      { label: '中介代管', desc: '中介核实并代管', status: property.publish_type === 'agent' || property.verify_status !== 'pending' ? 'completed' as const : 'current' as const },
      { label: '平台核验', desc: '平台审核通过', status: property.verify_status === 'approved' ? 'completed' as const : property.verify_status === 'rejected' ? 'rejected' as const : 'pending' as const },
    ];
    return steps;
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', label: '安全' };
    if (score <= 60) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: '预警' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '高风险' };
  };

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>;
  if (!property) return (
    <div className="text-center py-12">
      <div className="text-gray-500 mb-4">房源不存在</div>
      <Link to="/properties" className="text-blue-600 hover:text-blue-700">返回房源列表</Link>
    </div>
  );

  const deviation = getDeviationRate();
  const verifySteps = getVerificationSteps();
  const riskInfo = fakeData ? getRiskColor(fakeData.risk_score) : null;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link to="/" className="hover:text-blue-600">首页</Link>
        <span className="mx-2">/</span>
        <Link to="/properties" className="hover:text-blue-600">房源列表</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{property.title}</span>
      </nav>

      {/* 头图区域 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative h-96 bg-gray-200">
          <img
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20apartment%20interior%20modern%20design%20real%20estate&image_size=landscape_16_9"
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              {getTypeLabel(property.type)}
            </span>
            {property.vr_url && (
              <button onClick={() => setShowVRModal(true)} className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium flex items-center gap-1 hover:bg-purple-700">
                <Eye size={14} /> VR看房
              </button>
            )}
            {property.verify_status === 'approved' && (
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium flex items-center gap-1">
                <ShieldCheck size={14} /> 已核验
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={handleFavorite} className={`p-2 rounded-full bg-white shadow-md transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
              <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-full bg-white shadow-md text-gray-500 hover:text-blue-600">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-500 text-sm">
                <MapPin size={16} className="mr-1" />
                <span>{property.address}</span>
                {property.metro_station && (
                  <span className="ml-4">
                    <span className="text-blue-600">{property.metro_station}</span>
                    <span className="ml-1">{property.metro_distance}米</span>
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">
                ¥{property.price}
                <span className="text-sm font-normal text-gray-500 ml-1">{property.type === 'rental' ? '/月' : '万'}</span>
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(property.price * 10000 / property.area)} 元/㎡
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 py-4 border-y">
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 mb-1"><Bed size={18} className="mr-1" /><span className="text-sm">户型</span></div>
              <div className="text-lg font-semibold text-gray-900">{property.bedrooms}室{property.bathrooms}卫</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 mb-1"><Square size={18} className="mr-1" /><span className="text-sm">面积</span></div>
              <div className="text-lg font-semibold text-gray-900">{property.area}㎡</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 mb-1"><Compass size={18} className="mr-1" /><span className="text-sm">朝向</span></div>
              <div className="text-lg font-semibold text-gray-900">{property.orientation}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-500 mb-1"><Calendar size={18} className="mr-1" /><span className="text-sm">楼层</span></div>
              <div className="text-lg font-semibold text-gray-900">{property.floor}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div className="flex items-center"><span className="text-gray-500 w-20">装修：</span><span className="text-gray-900">{property.decoration || '暂无'}</span></div>
            <div className="flex items-center"><span className="text-gray-500 w-20">楼型：</span><span className="text-gray-900">{property.building_type || '暂无'}</span></div>
            <div className="flex items-center"><span className="text-gray-500 w-20">房龄：</span><span className="text-gray-900">{property.building_age || 0}年</span></div>
            <div className="flex items-center"><span className="text-gray-500 w-20">小区：</span><span className="text-gray-900">{property.community || '暂无'}</span></div>
          </div>

          {property.school_district && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center text-blue-700 mb-2"><Star size={18} className="mr-2" /><span className="font-medium">学区信息</span></div>
              <p className="text-blue-600">{property.school_district}</p>
            </div>
          )}

          <div className="py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">房源描述</h3>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
            {property.features && (
              <div className="flex flex-wrap gap-2 mt-4">
                {property.features.split(',').map((feature: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{feature}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 房价模型区域 - 大幅增强 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><TrendingUp size={20} className="mr-2 text-blue-600" />房价模型</h3>

        {priceRecords.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">成交走势（近12个月）</h4>
            <PriceChart records={priceRecords} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">挂牌均价</div>
            <div className="text-2xl font-bold text-gray-900">
              {property ? Math.round(property.price * 10000 / property.area) : 0} 元/㎡
            </div>
          </div>
          {priceStats && (
            <>
              <div>
                <div className="text-sm text-gray-500 mb-1">小区均价</div>
                <div className="text-2xl font-bold text-gray-900">¥{(priceStats.avg_price / 10000).toFixed(2)}万/㎡</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">在售房源</div>
                <div className="text-2xl font-bold text-gray-900">{priceStats.listing_count}套</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">近月成交</div>
                <div className="text-2xl font-bold text-gray-900">{priceStats.deal_count}套</div>
              </div>
            </>
          )}
        </div>

        {/* 估价偏差率 */}
        {deviation !== null && (
          <div className={`rounded-lg p-4 border ${deviation >= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {deviation >= 0 ? <TrendingUp size={18} className="text-red-500" /> : <TrendingUp size={18} className="text-green-500 rotate-180" />}
                <span className="font-medium text-gray-900">估价偏差率</span>
              </div>
              <div className={`text-2xl font-bold ${deviation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {deviation >= 0 ? '+' : ''}{deviation.toFixed(2)}%
              </div>
            </div>
            <p className={`text-sm mt-1 ${deviation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {deviation >= 0 ? '高于小区估价，需关注定价合理性' : '低于小区估价，性价比较高'}
            </p>
            <p className="text-xs text-gray-500 mt-1">计算公式：(当前价 - 小区均价×面积) / (小区均价×面积) × 100</p>
          </div>
        )}

        {/* 小区房价对比 */}
        {priceStats && (
          <div className="mt-6 border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">小区房价对比</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 mb-1">小区均价</div>
                <div className="text-lg font-bold text-blue-700">¥{(priceStats.avg_price / 10000).toFixed(2)}万/㎡</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 mb-1">在售房源数</div>
                <div className="text-lg font-bold text-purple-700">{priceStats.listing_count}套</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xs text-green-600 mb-1">近月成交数</div>
                <div className="text-lg font-bold text-green-700">{priceStats.deal_count}套</div>
              </div>
              <div className={`rounded-lg p-3 text-center ${priceStats.price_trend >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-xs mb-1 ${priceStats.price_trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>价格走势</div>
                <div className={`text-lg font-bold flex items-center justify-center ${priceStats.price_trend >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                  <TrendingUp size={16} className={`mr-1 ${priceStats.price_trend < 0 ? 'rotate-180' : ''}`} />
                  {priceStats.price_trend >= 0 ? '+' : ''}{priceStats.price_trend}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 房源核验流程展示 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Shield size={20} className="mr-2 text-blue-600" />房源核验流程</h3>
        <div className="flex items-center justify-between mb-6">
          {verifySteps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 size={20} /> :
                   step.status === 'rejected' ? <XCircle size={20} /> :
                   step.status === 'current' ? <Circle size={20} /> :
                   <Circle size={20} />}
                </div>
                <div className="text-sm font-medium text-gray-900">{step.label}</div>
                <div className="text-xs text-gray-500">{step.desc}</div>
                {step.status === 'completed' && <div className="text-xs text-green-600 mt-1">已完成</div>}
                {step.status === 'rejected' && <div className="text-xs text-red-600 mt-1">已驳回</div>}
                {step.status === 'current' && <div className="text-xs text-blue-600 mt-1">进行中</div>}
                {step.status === 'pending' && <div className="text-xs text-gray-400 mt-1">待处理</div>}
              </div>
              {index < verifySteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  verifySteps[index + 1].status === 'completed' || verifySteps[index].status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">核验详情</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">发布类型：</span><span className="text-gray-900">{property.publish_type === 'owner' ? '房东委托' : '中介代管'}</span></div>
            <div><span className="text-gray-500">核验状态：</span>
              <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                property.verify_status === 'approved' ? 'bg-green-100 text-green-700' :
                property.verify_status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {property.verify_status === 'approved' ? '已通过' : property.verify_status === 'rejected' ? '已驳回' : '待核验'}
              </span>
            </div>
            {verifications.length > 0 && (
              <>
                <div><span className="text-gray-500">核验时间：</span><span className="text-gray-900">{verifications[0].verified_at || verifications[0].created_at}</span></div>
                <div><span className="text-gray-500">核验人：</span><span className="text-gray-900">平台审核员 #{verifications[0].verifier_id || '-'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 产权证OCR识别结果 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FileText size={20} className="mr-2 text-blue-600" />产权证核验</h3>
        {ocrData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">产权人</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.owner_name}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">产权证号</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.certificate_number}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">地址</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.property_address}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">面积</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.area}㎡</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">物业类型</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.property_type}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">发证日期</div>
                <div className="text-sm font-medium text-gray-900">{ocrData.issue_date}</div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${ocrData.verified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {ocrData.verified ? <ShieldCheck size={18} /> : <ShieldX size={18} />}
              <span className="font-medium">{ocrData.verified ? '产权证核验通过' : '产权证核验未通过'}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText size={40} className="mx-auto mb-2 opacity-50" />
            <p>暂无产权证核验信息</p>
          </div>
        )}
      </div>

      {/* 虚假房源AI识别结果 */}
      <div className={`rounded-xl shadow-sm p-6 border-2 ${riskInfo ? riskInfo.border : 'border-gray-200'}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle size={20} className="mr-2 text-blue-600" />房源安全检测
        </h3>
        {fakeData ? (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${riskInfo!.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">风险评分</span>
                <span className={`text-2xl font-bold ${riskInfo!.text}`}>{fakeData.risk_score}分</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    fakeData.risk_score <= 30 ? 'bg-green-500' : fakeData.risk_score <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${fakeData.risk_score}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>安全</span><span>预警</span><span>高风险</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 border ${fakeData.image_duplicate ? 'border-yellow-300 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {fakeData.image_duplicate ? <EyeOff size={18} className="text-yellow-600" /> : <Eye size={18} className="text-green-600" />}
                  <span className="font-medium text-gray-900">图片复用检测</span>
                </div>
                <div className={`text-sm ${fakeData.image_duplicate ? 'text-yellow-700' : 'text-green-700'}`}>
                  {fakeData.image_duplicate
                    ? `检测到重复，重复数量：${fakeData.duplicate_count}张`
                    : '未检测到图片复用'
                  }
                </div>
              </div>
              <div className={`rounded-lg p-4 border ${fakeData.price_anomaly ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {fakeData.price_anomaly ? <TrendingUp size={18} className="text-red-600" /> : <TrendingUp size={18} className="text-green-600" />}
                  <span className="font-medium text-gray-900">价格异常检测</span>
                </div>
                <div className={`text-sm ${fakeData.price_anomaly ? 'text-red-700' : 'text-green-700'}`}>
                  {fakeData.price_anomaly
                    ? `偏离百分比：${fakeData.anomaly_percent}%`
                    : '价格正常'
                  }
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${riskInfo!.bg}`}>
              <span className={`text-sm font-medium ${riskInfo!.text}`}>
                检测结果：{riskInfo!.label} — {fakeData.details || '无异常'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle size={40} className="mx-auto mb-2 opacity-50" />
            <p>暂无安全检测信息</p>
          </div>
        )}
      </div>

      {/* VR看房区域 */}
      {property.vr_url && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Vibrate size={20} className="mr-2 text-purple-600" />VR看房
          </h3>
          <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl h-64 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setShowVRModal(true)}>
            <div className="text-center">
              <Eye size={48} className="mx-auto mb-3 text-purple-600" />
              <p className="text-lg font-medium text-purple-700">点击进入VR全景看房</p>
              <p className="text-sm text-purple-500 mt-1">沉浸式体验房源真实场景</p>
            </div>
          </div>
        </div>
      )}

      {/* 经纪人信息增强 */}
      {property.agent_id && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">经纪人信息</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{property.agent_name || '经纪人'}</span>
                <div className="flex items-center text-yellow-500 text-sm">
                  <Star size={14} fill="currentColor" />
                  <span className="ml-1">{property.average_rating || 0}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">{property.agency_name || '房产中介'}</div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">成交 {property.total_deals || 0} 套</span>
                <span className="text-sm text-gray-500">转化率 {property.conversion_rate || 0}%</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                  <ShieldCheck size={12} /> 信用分 {property.credit_score || 100}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                  <TrendingUp size={12} /> 成交转化率 {property.conversion_rate || 0}%
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <a href={`tel:${property.agent_phone}`} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Phone size={18} className="mr-2" />电话咨询
              </a>
              <button onClick={() => setShowInquiryModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <MessageCircle size={18} className="mr-2" />在线咨询
              </button>
            </div>
          </div>
          {property.agent_id && (
            <div className="mt-3 pt-3 border-t">
              <Link to={`/agents`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                查看客户评价与详情 <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 举报此房源按钮 */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAppealModal(true)}
          className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <Flag size={18} /> 举报此房源
        </button>
      </div>

      {/* 在线咨询模态框 */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">在线咨询</h3>
            <form onSubmit={handleInquiry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">咨询内容</label>
                <textarea value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="请输入您想咨询的问题..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input type="tel" value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="请输入您的手机号" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInquiryModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">提交咨询</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 举报申诉模态框 */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Flag size={20} className="mr-2 text-red-600" />举报此房源</h3>
            <form onSubmit={handleAppeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">举报原因</label>
                <textarea value={appealForm.reason} onChange={(e) => setAppealForm({ ...appealForm, reason: e.target.value })} rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="请描述举报原因..." required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">补充证据（选填）</label>
                <input type="text" value={appealForm.evidence} onChange={(e) => setAppealForm({ ...appealForm, evidence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="可提供截图链接等证据" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAppealModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">提交举报</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VR播放器模态框 */}
      {showVRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
              <h3 className="text-white font-medium flex items-center gap-2"><Eye size={18} /> VR全景看房</h3>
              <button onClick={() => setShowVRModal(false)} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
              <div className="text-center">
                <RotateCcw size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 text-lg">VR全景播放器</p>
                <p className="text-gray-500 text-sm mt-2">拖动旋转 · 滚轮缩放 · 点击热点</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-800">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"><Eye size={14} /> 全屏模式</button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 flex items-center gap-2"><RotateCcw size={14} /> 重置视角</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
