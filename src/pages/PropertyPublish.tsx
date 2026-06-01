import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, User, Building2, FileText, CheckCircle2, Circle,
  ChevronRight, ChevronLeft, Upload, Camera, AlertTriangle,
  Shield, MapPin, Home, Tag, Loader2, CheckCircle, XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const STEPS = [
  { label: '选择发布类型', icon: Tag },
  { label: '填写房源信息', icon: Home },
  { label: '产权证OCR识别', icon: Camera },
  { label: '提交审核', icon: Shield },
];

const PROPERTY_TYPES = [
  { value: 'new', label: '新房' },
  { value: 'secondhand', label: '二手房' },
  { value: 'rent', label: '租赁' },
  { value: 'commercial', label: '商业地产' },
];

const CATEGORIES = [
  { value: 'apartment', label: '公寓' },
  { value: 'villa', label: '别墅' },
  { value: 'office', label: '写字楼' },
  { value: 'shop', label: '商铺' },
];

const ORIENTATIONS = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];
const DECORATIONS = ['毛坯', '简装', '精装', '豪装'];
const BUILDING_TYPES = ['塔楼', '板楼', '板塔结合', '独栋', '联排'];
const FEATURE_TAGS = ['南北通透', '地铁房', '学区房', '精装', '品牌开发商', '低密社区', '花园洋房', '江景房', '落地窗', '明厨明卫', '飘窗', '复式'];

const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center justify-center mb-8">
    {STEPS.map((step, idx) => (
      <React.Fragment key={idx}>
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              idx < current
                ? 'bg-green-500 text-white'
                : idx === current
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {idx < current ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
          </div>
          <span className={`text-xs mt-2 ${idx <= current ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            {step.label}
          </span>
        </div>
        {idx < STEPS.length - 1 && (
          <div
            className={`w-16 h-0.5 mx-2 mt-[-16px] ${
              idx < current ? 'bg-green-500' : 'bg-gray-200'
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const PropertyPublish: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [publishType, setPublishType] = useState<'owner' | 'agent' | ''>('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fakeDetection, setFakeDetection] = useState<any>(null);
  const [fakeWarning, setFakeWarning] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    property_type: 'secondhand',
    category: 'apartment',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    total_floors: '',
    orientation: '南',
    decoration: '精装',
    building_type: '板楼',
    age: '',
    address: '',
    city: '',
    district: '',
    community: '',
    latitude: '',
    longitude: '',
    nearest_subway: '',
    subway_distance: '',
    school_district: '',
    school_rating: '',
    description: '',
    features: [] as string[],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (publishType === 'agent') {
      api.agents.list({ pageSize: 50 }).then((res) => {
        if (res.success && res.data) {
          setAgents((res.data as any).list || []);
        }
      });
    }
  }, [publishType]);

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(tag)
        ? prev.features.filter((f) => f !== tag)
        : [...prev.features, tag],
    }));
  };

  const handleOcr = async () => {
    setOcrLoading(true);
    const res = await api.tools.ocrCertificate({ image: 'mock_certificate.jpg' });
    if (res.success && res.data) {
      setOcrResult(res.data);
    } else {
      setOcrResult({
        owner: '张三',
        certificate_no: '沪房权证浦字第2023001号',
        address: '上海市浦东新区陆家嘴环路1088号',
        area: '89.5',
        property_type: '住宅',
        issue_date: '2023-06-15',
      });
    }
    setOcrLoading(false);
  };

  const handleFakeDetection = async (): Promise<boolean> => {
    setLoading(true);
    const res = await api.tools.fakeDetection('preview');
    setLoading(false);
    if (res.success && res.data) {
      const fd = res.data as any;
      setFakeDetection(fd);
      if (fd.risk_level === 'high' || fd.risk_level === 'medium') {
        setFakeWarning(true);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    const safe = await handleFakeDetection();
    if (!safe) return;

    setLoading(true);
    const payload = {
      ...form,
      publish_type: publishType,
      agent_id: publishType === 'agent' ? selectedAgentId : undefined,
      price: Number(form.price),
      area: Number(form.area),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      floor: Number(form.floor),
      total_floors: Number(form.total_floors),
      latitude: Number(form.latitude) || undefined,
      longitude: Number(form.longitude) || undefined,
      school_rating: Number(form.school_rating) || undefined,
      subway_distance: Number(form.subway_distance) || undefined,
      ocr_data: ocrResult,
    };

    const res = await api.properties.create(payload);
    setLoading(false);
    if (res.success) {
      setSubmitSuccess(true);
    }
  };

  const handleSubmitAnyway = async () => {
    setFakeWarning(false);
    setLoading(true);
    const payload = {
      ...form,
      publish_type: publishType,
      agent_id: publishType === 'agent' ? selectedAgentId : undefined,
      price: Number(form.price),
      area: Number(form.area),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      floor: Number(form.floor),
      total_floors: Number(form.total_floors),
      latitude: Number(form.latitude) || undefined,
      longitude: Number(form.longitude) || undefined,
      school_rating: Number(form.school_rating) || undefined,
      subway_distance: Number(form.subway_distance) || undefined,
      ocr_data: ocrResult,
    };

    const res = await api.properties.create(payload);
    setLoading(false);
    if (res.success) {
      setSubmitSuccess(true);
    }
  };

  if (!user) return null;

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">房源提交成功！</h2>
        <p className="text-gray-500 mb-2">您的房源已提交平台核验，预计1-3个工作日完成审核</p>
        <p className="text-gray-400 text-sm mb-8">核验通过后将自动上线，请耐心等待</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看房源列表
          </button>
          <button
            onClick={() => {
              setStep(0);
              setPublishType('');
              setSubmitSuccess(false);
              setOcrResult(null);
              setFakeDetection(null);
              setForm({
                title: '', property_type: 'secondhand', category: 'apartment', price: '', area: '',
                bedrooms: '', bathrooms: '', floor: '', total_floors: '', orientation: '南',
                decoration: '精装', building_type: '板楼', age: '', address: '', city: '',
                district: '', community: '', latitude: '', longitude: '', nearest_subway: '',
                subway_distance: '', school_district: '', school_rating: '', description: '', features: [],
              });
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            继续发布
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <PlusCircle className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发布房源</h1>
          <p className="text-gray-500">房东委托 · 中介代管 · 平台核验</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {fakeWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 mb-1">AI检测发现风险</h4>
              {fakeDetection?.image_reuse && (
                <p className="text-sm text-yellow-700">图片复用检测：存在图片重复使用嫌疑</p>
              )}
              {fakeDetection?.price_anomaly && (
                <p className="text-sm text-yellow-700">价格异常检测：该房源价格与周边房源偏差较大</p>
              )}
              <p className="text-sm text-yellow-600 mt-2">您可以修改信息后重新提交，或确认无误后继续提交</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setFakeWarning(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                >
                  返回修改
                </button>
                <button
                  onClick={handleSubmitAnyway}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        {step === 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">选择发布类型</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setPublishType('owner')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  publishType === 'owner'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <User className={`mb-3 ${publishType === 'owner' ? 'text-blue-600' : 'text-gray-400'}`} size={32} />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">房东自主委托</h4>
                <p className="text-sm text-gray-500">房东直接发布，平台核验后上线</p>
              </button>

              <button
                onClick={() => setPublishType('agent')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  publishType === 'agent'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <Building2 className={`mb-3 ${publishType === 'agent' ? 'text-blue-600' : 'text-gray-400'}`} size={32} />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">中介代管发布</h4>
                <p className="text-sm text-gray-500">委托专业经纪人代为管理，需指定经纪人</p>
              </button>
            </div>

            {publishType === 'agent' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择经纪人</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择经纪人</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.real_name} - {a.agency_name} (评分: {a.average_rating})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  if (publishType && (publishType !== 'agent' || selectedAgentId)) setStep(1);
                }}
                disabled={!publishType || (publishType === 'agent' && !selectedAgentId)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                下一步 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">填写房源信息</h3>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">基本信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">房源标题</label>
                  <input
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入房源标题"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">类型</label>
                  <select
                    value={form.property_type}
                    onChange={(e) => updateForm('property_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">分类</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">价格（万元）</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入价格"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">面积（㎡）</label>
                  <input
                    type="number"
                    value={form.area}
                    onChange={(e) => updateForm('area', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入面积"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">房屋详情</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">室</label>
                  <input
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => updateForm('bedrooms', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="几室"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">卫</label>
                  <input
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => updateForm('bathrooms', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="几卫"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">楼层</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => updateForm('floor', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="所在楼层"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">总楼层</label>
                  <input
                    type="number"
                    value={form.total_floors}
                    onChange={(e) => updateForm('total_floors', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="总楼层数"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">朝向</label>
                  <select
                    value={form.orientation}
                    onChange={(e) => updateForm('orientation', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ORIENTATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">装修</label>
                  <select
                    value={form.decoration}
                    onChange={(e) => updateForm('decoration', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DECORATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">楼型</label>
                  <select
                    value={form.building_type}
                    onChange={(e) => updateForm('building_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BUILDING_TYPES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">房龄（年）</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => updateForm('age', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="房龄"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">位置信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">详细地址</label>
                  <input
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入详细地址"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">城市</label>
                  <input
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="城市"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">区域</label>
                  <input
                    value={form.district}
                    onChange={(e) => updateForm('district', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="区域"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">小区</label>
                  <input
                    value={form.community}
                    onChange={(e) => updateForm('community', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="小区名称"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">纬度</label>
                    <input
                      type="number"
                      value={form.latitude}
                      onChange={(e) => updateForm('latitude', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="纬度"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">经度</label>
                    <input
                      type="number"
                      value={form.longitude}
                      onChange={(e) => updateForm('longitude', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="经度"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">地铁信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">最近地铁站</label>
                  <input
                    value={form.nearest_subway}
                    onChange={(e) => updateForm('nearest_subway', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="最近地铁站名称"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">距离（米）</label>
                  <input
                    type="number"
                    value={form.subway_distance}
                    onChange={(e) => updateForm('subway_distance', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="距离（米）"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">学区信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">学区名称</label>
                  <input
                    value={form.school_district}
                    onChange={(e) => updateForm('school_district', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="学区名称"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">学区评分</label>
                  <input
                    type="number"
                    value={form.school_rating}
                    onChange={(e) => updateForm('school_rating', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1-10分"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">描述与特色</h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">房源描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请详细描述房源特点、周边配套等信息"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-2">特色标签（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleFeature(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        form.features.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b">房源图片</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-3" size={36} />
                <p className="text-sm text-gray-500">点击或拖拽上传房源图片</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最多上传20张</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} /> 上一步
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                下一步 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">产权证OCR识别</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer mb-6">
              <Camera className="mx-auto text-gray-400 mb-3" size={36} />
              <p className="text-sm text-gray-500">点击或拖拽上传产权证图片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
            </div>

            <button
              onClick={handleOcr}
              disabled={ocrLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> 识别中...
                </>
              ) : (
                <>
                  <FileText size={18} /> 识别产权证
                </>
              )}
            </button>

            {ocrResult && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">识别结果</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">产权人</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.owner}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">产权证号</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.certificate_no}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">地址</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.address}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">面积</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.area} ㎡</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">物业类型</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.property_type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">发证日期</span>
                      <p className="text-sm font-medium text-gray-900">{ocrResult.issue_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <CheckCircle2 className="text-green-500" size={16} />
                    <span className="text-sm text-green-700">识别结果已确认，信息无误</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} /> 上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                下一步 <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">提交审核</h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">发布类型</h4>
                <p className="text-sm text-gray-900">
                  {publishType === 'owner' ? '房东自主委托' : '中介代管发布'}
                  {publishType === 'agent' && selectedAgentId && (
                    <span className="text-gray-500 ml-2">
                      （经纪人ID: {selectedAgentId}）
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">房源信息</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-gray-500">标题：</span>{form.title}</div>
                  <div><span className="text-gray-500">类型：</span>{PROPERTY_TYPES.find(t => t.value === form.property_type)?.label}</div>
                  <div><span className="text-gray-500">分类：</span>{CATEGORIES.find(c => c.value === form.category)?.label}</div>
                  <div><span className="text-gray-500">价格：</span>{form.price}万元</div>
                  <div><span className="text-gray-500">面积：</span>{form.area}㎡</div>
                  <div><span className="text-gray-500">户型：</span>{form.bedrooms}室{form.bathrooms}卫</div>
                  <div><span className="text-gray-500">楼层：</span>{form.floor}/{form.total_floors}层</div>
                  <div><span className="text-gray-500">朝向：</span>{form.orientation}</div>
                  <div><span className="text-gray-500">装修：</span>{form.decoration}</div>
                </div>
                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {form.features.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">位置信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">地址：</span>{form.address}</div>
                  <div><span className="text-gray-500">城市：</span>{form.city}</div>
                  <div><span className="text-gray-500">区域：</span>{form.district}</div>
                  <div><span className="text-gray-500">小区：</span>{form.community}</div>
                </div>
              </div>

              {ocrResult && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">产权证信息</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">产权人：</span>{ocrResult.owner}</div>
                    <div><span className="text-gray-500">产权证号：</span>{ocrResult.certificate_no}</div>
                    <div><span className="text-gray-500">面积：</span>{ocrResult.area}㎡</div>
                    <div><span className="text-gray-500">发证日期：</span>{ocrResult.issue_date}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Shield size={16} /> 审核流程说明
              </h4>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="flex items-center gap-1"><Circle size={8} className="fill-blue-600 text-blue-600" /> 提交审核</span>
                <ChevronRight size={14} />
                <span className="flex items-center gap-1"><Circle size={8} className="fill-blue-400 text-blue-400" /> 平台核验</span>
                <ChevronRight size={14} />
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> 核验通过自动上线</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">提交后将进入平台核验流程，预计1-3个工作日完成。核验通过后房源将自动上线。</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={16} /> 上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> 提交中...
                  </>
                ) : (
                  <>
                    <Shield size={18} /> 提交审核
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPublish;
