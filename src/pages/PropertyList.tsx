import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  Database,
  Clock,
  TrendingUp,
  Users,
  Building2,
  AlertCircle,
  PhoneCall,
  Shield,
  FileCheck,
  Wallet,
  FileSignature,
  Building,
  MessageCircle,
  History,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Tag,
  Calendar,
  User,
  Eye,
  FileText,
  Plus,
  Zap,
  Target,
  BookOpen,
  Send,
  Flame,
  Clock8,
  BarChart3,
  AudioLines,
  Video,
  Tags,
  Bell,
  ShoppingBag,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import api, { ApiResponse, Property, PriceChangeLog, CityStrategy, CustomerTag, Reminder, PurchaseOrder } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

const mockProperties: Property[] = [
  { id: 1, projectName: '金域华府', city: '上海', district: '浦东新区', address: '张江高科技园区博云路2号', status: 'available', price: 6800000, area: 120, bedrooms: 3, bathrooms: 2, floor: '中', orientation: '南', decoration: '精装修', discount: 95, promotion: '限时优惠，认购立减10万', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: 'vr2', vrPanoramaUrl: 'vr3', vrStreetViewUrl: 'vr4', erpSource: '万科ERP', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:30:00', erpSyncCount: 156, supplyBatch: '2026年第2批', cityStrategy: '浦东新区金融精英策略，面向金融从业者和高净值人群，定价策略为江景资源溢价20%', createdAt: '2024-01-15', updatedAt: '2024-01-20' },
  { id: 2, projectName: '滨江壹号', city: '上海', district: '徐汇区', address: '滨江大道88号', status: 'available', price: 12500000, area: 180, bedrooms: 4, bathrooms: 3, floor: '高', orientation: '南北通', decoration: '豪华装修', discount: 100, promotion: '送价值50万智能家居', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: '', vrPanoramaUrl: 'vr3', vrStreetViewUrl: '', erpSource: '恒大销控系统', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:28:00', erpSyncCount: 203, supplyBatch: '一期A批次', cityStrategy: '徐汇区高端改善策略，面向改善型需求客户，定价策略为区域均价上浮8%', createdAt: '2024-01-10', updatedAt: '2024-01-18' },
  { id: 3, projectName: '阳光花园', city: '北京', district: '朝阳区', address: '建国路99号', status: 'locked', price: 5200000, area: 95, bedrooms: 2, bathrooms: 2, floor: '低', orientation: '东南', decoration: '简装修', discount: 98, promotion: '', vrShowroomUrl: '', vrSalesOfficeUrl: '', vrPanoramaUrl: '', vrStreetViewUrl: '', erpSource: '碧桂园营销云', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:25:00', erpSyncCount: 89, supplyBatch: '2026年第1批', cityStrategy: '朝阳区高端改善型房源，面向改善型需求客户，定价策略为区域均价上浮5%', createdAt: '2024-01-08', updatedAt: '2024-01-15' },
  { id: 4, projectName: '翠湖天地', city: '上海', district: '黄浦区', address: '淮海中路333号', status: 'available', price: 9800000, area: 150, bedrooms: 3, bathrooms: 2, floor: '中', orientation: '南', decoration: '精装修', discount: 92, promotion: '新春特惠，折上折', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: 'vr2', vrPanoramaUrl: 'vr3', vrStreetViewUrl: 'vr4', erpSource: '融创EPR', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:20:00', erpSyncCount: 278, supplyBatch: '二期B批次', cityStrategy: '黄浦区核心商圈策略，面向高端商务人士，定价策略为核心区位溢价15%', createdAt: '2024-01-05', updatedAt: '2024-01-12' },
  { id: 5, projectName: '万科翡翠', city: '深圳', district: '南山区', address: '科技园南路16号', status: 'sold', price: 8600000, area: 110, bedrooms: 3, bathrooms: 2, floor: '高', orientation: '南', decoration: '精装修', discount: 100, promotion: '', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: '', vrPanoramaUrl: 'vr3', vrStreetViewUrl: '', erpSource: '保利销控平台', erpSyncStatus: 'pending', erpLastSyncAt: '2026-06-06 18:00:00', erpSyncCount: 45, supplyBatch: '2026年第1批', cityStrategy: '南山区科技创新策略，面向科创企业员工，定价策略匹配科技人才购买力', createdAt: '2024-01-03', updatedAt: '2024-01-10' },
  { id: 6, projectName: '保利中央公园', city: '广州', district: '天河区', address: '珠江新城花城大道', status: 'available', price: 7200000, area: 130, bedrooms: 3, bathrooms: 2, floor: '中', orientation: '南北通', decoration: '精装修', discount: 95, promotion: '老带新享额外优惠', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: 'vr2', vrPanoramaUrl: 'vr3', vrStreetViewUrl: 'vr4', erpSource: '万科ERP', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:30:00', erpSyncCount: 156, supplyBatch: '二期B批次', cityStrategy: '天河区商务核心策略，面向企业高管和商务人士，定价策略为CBD核心区均价', createdAt: '2024-01-01', updatedAt: '2024-01-08' },
  { id: 7, projectName: '龙湖天街', city: '杭州', district: '西湖区', address: '文三路478号', status: 'available', price: 5800000, area: 105, bedrooms: 3, bathrooms: 2, floor: '中', orientation: '南', decoration: '精装修', discount: 96, promotion: '', vrShowroomUrl: 'vr1', vrSalesOfficeUrl: '', vrPanoramaUrl: 'vr3', vrStreetViewUrl: '', erpSource: '恒大销控系统', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:28:00', erpSyncCount: 203, supplyBatch: '2026年第3批', cityStrategy: '西湖区文旅宜居策略，面向文旅爱好者和宜居需求客户，定价策略为景区周边溢价10%', createdAt: '2024-01-02', updatedAt: '2024-01-09' },
  { id: 8, projectName: '碧桂园凤凰城', city: '南京', district: '建邺区', address: '江东中路100号', status: 'available', price: 4500000, area: 98, bedrooms: 2, bathrooms: 1, floor: '高', orientation: '东南', decoration: '简装修', discount: 99, promotion: '新盘首开', vrShowroomUrl: '', vrSalesOfficeUrl: '', vrPanoramaUrl: '', vrStreetViewUrl: '', erpSource: '碧桂园营销云', erpSyncStatus: 'synced', erpLastSyncAt: '2026-06-07 10:25:00', erpSyncCount: 89, supplyBatch: '2026年第2批', cityStrategy: '建邺区新城发展策略，面向年轻刚需客户，定价策略为新城起步价', createdAt: '2024-01-04', updatedAt: '2024-01-11' },
  { id: 9, projectName: '中海国际', city: '成都', district: '高新区', address: '天府大道中段199号', status: 'offline', price: 3800000, area: 88, bedrooms: 2, bathrooms: 1, floor: '低', orientation: '南', decoration: '毛坯', discount: 100, promotion: '', vrShowroomUrl: '', vrSalesOfficeUrl: '', vrPanoramaUrl: '', vrStreetViewUrl: '', erpSource: '融创EPR', erpSyncStatus: 'pending', erpLastSyncAt: '2026-06-06 18:00:00', erpSyncCount: 45, supplyBatch: '2026年第1批', cityStrategy: '高新区科技人才策略，面向科创企业员工，定价策略为人才优惠价', createdAt: '2024-01-06', updatedAt: '2024-01-13' },
];

const cities = ['上海', '北京', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆'];
const priceRanges = [
  { label: '不限', min: 0, max: Infinity },
  { label: '300万以下', min: 0, max: 3000000 },
  { label: '300-500万', min: 3000000, max: 5000000 },
  { label: '500-800万', min: 5000000, max: 8000000 },
  { label: '800-1000万', min: 8000000, max: 10000000 },
  { label: '1000万以上', min: 10000000, max: Infinity },
];
const bedroomOptions = [
  { label: '不限', value: 0 },
  { label: '1室', value: 1 },
  { label: '2室', value: 2 },
  { label: '3室', value: 3 },
  { label: '4室及以上', value: 4 },
];
const statusOptions = [
  { label: '不限', value: '' },
  { label: '可售', value: 'available' },
  { label: '锁定', value: 'locked' },
  { label: '已售', value: 'sold' },
  { label: '下架', value: 'offline' },
];

interface RegionalInventory {
  city: string;
  district: string;
  total: number;
  available: number;
  locked: number;
  sold: number;
  avgPrice: number;
}

interface UpcomingProject {
  id: number;
  projectName: string;
  district: string;
  launchDate: string;
  expectedPrice: string;
  bedrooms: string;
  area: string;
  totalUnits: number;
  developer: string;
  hotLevel: 'high' | 'medium' | 'low';
}

interface DisplayFollowUpRecord {
  id: number;
  date: string;
  content: string;
  type: 'call' | 'visit' | 'im' | 'subscribe';
  advisorName: string;
  result: string;
}

interface SelectableCustomerTag {
  id: number;
  name: string;
  color: string;
}

interface SOPTemplate {
  id: number;
  title: string;
  category: string;
  usageCount: number;
  content: string;
}

const upcomingProjects: UpcomingProject[] = [
  { id: 1, projectName: '陆家嘴滨江天际', district: '浦东新区', launchDate: '2026-06-15', expectedPrice: '85000元/㎡', bedrooms: '1-4室', area: '68-180㎡', totalUnits: 320, developer: '融创中国', hotLevel: 'high' },
  { id: 2, projectName: '徐汇滨江壹号', district: '徐汇区', launchDate: '2026-06-20', expectedPrice: '92000元/㎡', bedrooms: '2-5室', area: '95-220㎡', totalUnits: 268, developer: '绿地集团', hotLevel: 'high' },
  { id: 3, projectName: '虹桥金茂府', district: '闵行区', launchDate: '2026-06-28', expectedPrice: '72000元/㎡', bedrooms: '1-3室', area: '60-140㎡', totalUnits: 450, developer: '金茂地产', hotLevel: 'medium' },
  { id: 4, projectName: '宝山四季花城', district: '宝山区', launchDate: '2026-07-05', expectedPrice: '58000元/㎡', bedrooms: '1-2室', area: '55-90㎡', totalUnits: 520, developer: '万科集团', hotLevel: 'medium' },
];

const defaultFollowUpRecords: DisplayFollowUpRecord[] = [
  { id: 1, date: '2026-06-05 14:30', content: '客户咨询1室小户型房源，预算300万以内', type: 'im', advisorName: '张三', result: '已推荐周边2个相似楼盘，客户表示考虑中' },
  { id: 2, date: '2026-06-03 10:15', content: '电话回访客户购房意向', type: 'call', advisorName: '张三', result: '客户仍在寻找合适房源，希望关注新盘' },
  { id: 3, date: '2026-05-30 16:00', content: '客户到店咨询购房政策', type: 'visit', advisorName: '李四', result: '已详细解释限购政策，协助完成资格预审' },
  { id: 4, date: '2026-05-25 09:45', content: '客户首次咨询房源信息', type: 'im', advisorName: '李四', result: '了解客户需求：1室、300万预算、浦东区域' },
];

const availableTags: SelectableCustomerTag[] = [
  { id: 1, name: '刚需首套', color: 'bg-blue-100 text-blue-700' },
  { id: 2, name: '投资保值', color: 'bg-amber-100 text-amber-700' },
  { id: 3, name: '学区优先', color: 'bg-green-100 text-green-700' },
  { id: 4, name: '交通便利', color: 'bg-purple-100 text-purple-700' },
  { id: 5, name: '医疗配套', color: 'bg-red-100 text-red-700' },
  { id: 6, name: '商圈成熟', color: 'bg-indigo-100 text-indigo-700' },
  { id: 7, name: '全款支付', color: 'bg-pink-100 text-pink-700' },
  { id: 8, name: '需要贷款', color: 'bg-cyan-100 text-cyan-700' },
];

const sopTemplates: SOPTemplate[] = [
  { id: 1, title: '空房源安抚话术', category: '客户关怀', usageCount: 256, content: '您好，目前您关注的1室小户型暂时没有符合条件的房源。不过我们有几个即将开盘的项目非常适合您，其中有60-70㎡的1室户型，预计价格在您的预算范围内。我可以先为您登记意向，开盘第一时间通知您。另外，我也可以为您推荐周边类似的房源供您参考。' },
  { id: 2, title: '新盘推荐话术', category: '房源推荐', usageCount: 189, content: '根据您的需求，我为您精选了几个即将开盘的优质项目。首先是位于XX板块的XX楼盘，这个项目交通便利，周边配套成熟，而且有您需要的1室户型。预计开盘价格在XX万左右，非常符合您的预算。您看什么时候方便，我带您去实地了解一下？' },
  { id: 3, title: '资格预审引导话术', category: '流程引导', usageCount: 142, content: '为了让您购房更顺利，建议您先做一下购房资格预审。这个过程很简单，只需要您提供一些基本信息，我们会在1个工作日内给您反馈结果。预审通过后，您就可以更有针对性地看房选房了。现在我帮您发起预审可以吗？' },
  { id: 4, title: '预约登记话术', category: '客户留存', usageCount: 98, content: '既然您对这个项目比较感兴趣，我建议您可以先做个意向登记。这样开盘时我们会第一时间通知您，还能享受优先选房和额外的开盘优惠。登记只需要您的姓名和联系方式，不会产生任何费用，您看可以吗？' },
];

const typeIconMap: Record<string, any> = {
  call: PhoneCall,
  visit: Users,
  im: MessageCircle,
  subscribe: FileCheck,
};

export default function PropertyList() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showErpPanel, setShowErpPanel] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [priceLogs, setPriceLogs] = useState<PriceChangeLog[]>([]);
  const [showPriceLogs, setShowPriceLogs] = useState(false);
  const [regionalInventory, setRegionalInventory] = useState<RegionalInventory[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [selectedSop, setSelectedSop] = useState<SOPTemplate | null>(null);
  const [showSopModal, setShowSopModal] = useState(false);
  const [copiedSopId, setCopiedSopId] = useState<number | null>(null);
  const [cityStrategies, setCityStrategies] = useState<CityStrategy[]>([]);
  const [followUpRecords, setFollowUpRecords] = useState<DisplayFollowUpRecord[]>(defaultFollowUpRecords);
  const [customerTags, setCustomerTags] = useState<CustomerTag[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    priceRange: 0,
    bedrooms: parseInt(searchParams.get('bedrooms') || '0'),
    status: searchParams.get('status') || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.city) params.append('city', filters.city);
        if (filters.status) params.append('status', filters.status);

        const requests: Promise<any>[] = [
          api.get<ApiResponse<{ list: Property[]; total: number }>>(`/properties?${params.toString()}`),
          api.get<ApiResponse<RegionalInventory[]>>('/properties/inventory'),
          api.get<ApiResponse<CityStrategy[]>>('/properties/strategies'),
        ];

        if (isAuthenticated && user?.id) {
          requests.push(
            api.get<ApiResponse<any[]>>(`/properties/users/${user.id}/follow-ups`),
            api.get<ApiResponse<CustomerTag[]>>(`/properties/users/${user.id}/tags`),
            api.get<ApiResponse<Reminder[]>>(`/properties/users/${user.id}/reminders`)
          );
        }

        const results = await Promise.all(requests);
        const [propertyRes, inventoryRes, strategiesRes, followUpsRes, tagsRes, remindersRes] = results;

        const propertyResult = propertyRes?.code !== undefined ? propertyRes : propertyRes?.data;
        const propertyPayload = propertyResult?.data;
        const propertyList = Array.isArray(propertyPayload) ? propertyPayload : propertyPayload?.list || [];
        if (propertyResult?.code === 200) {
          setProperties(propertyList);
        } else {
          setProperties(mockProperties);
        }

        const inventoryResult = inventoryRes?.code !== undefined ? inventoryRes : inventoryRes?.data;
        if (inventoryResult?.code === 200) {
          setRegionalInventory(inventoryResult.data || []);
        }

        const strategiesResult = strategiesRes?.code !== undefined ? strategiesRes : strategiesRes?.data;
        if (strategiesResult?.code === 200) {
          setCityStrategies(strategiesResult.data || []);
        }

        if (followUpsRes) {
          const followUpsResult = followUpsRes?.code !== undefined ? followUpsRes : followUpsRes?.data;
          if (followUpsResult?.code === 200) {
            const normalized = (followUpsResult.data || []).map((record: any) => ({
              id: record.id,
              date: record.date || record.createdAt || record.created_at || '',
              content: record.content,
              type: record.type || 'im',
              advisorName: record.advisorName || record.advisor?.name || '张顾问',
              result: record.result || '已记录跟进结果',
            }));
            setFollowUpRecords(normalized.length ? normalized : defaultFollowUpRecords);
          }
        }

        if (tagsRes) {
          const tagsResult = tagsRes?.code !== undefined ? tagsRes : tagsRes?.data;
          if (tagsResult?.code === 200) {
            setCustomerTags(tagsResult.data || []);
          }
        }

        if (remindersRes) {
          const remindersResult = remindersRes?.code !== undefined ? remindersRes : remindersRes?.data;
          if (remindersResult?.code === 200) {
            setReminders(remindersResult.data || []);
          }
        }
      } catch (err) {
        setProperties(mockProperties);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters.city, filters.status, isAuthenticated, user?.id]);

  const loadPriceLogs = async (propertyId: number) => {
    try {
      const res = await api.get<ApiResponse<PriceChangeLog[]>>(`/properties/${propertyId}/price-logs`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setPriceLogs(result.data || []);
      }
    } catch (err) {
      console.error('加载价格变更记录失败:', err);
      setPriceLogs([]);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (filters.city && p.city !== filters.city) return false;
    const pr = priceRanges[filters.priceRange];
    if (p.price < pr.min || p.price >= pr.max) return false;
    if (filters.bedrooms > 0) {
      if (filters.bedrooms === 4) {
        if (p.bedrooms < 4) return false;
      } else if (p.bedrooms !== filters.bedrooms) {
        return false;
      }
    }
    if (filters.status && p.status !== filters.status) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      return (
        p.projectName.toLowerCase().includes(search) ||
        p.address.toLowerCase().includes(search) ||
        p.district.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const params = new URLSearchParams(searchParams);
    if (key === 'city' || key === 'status' || key === 'bedrooms') {
      if (value) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
      setSearchParams(params);
    }
  };

  const clearFilters = () => {
    setFilters({ city: '', priceRange: 0, bedrooms: 0, status: '' });
    setSearchText('');
    setSearchParams({});
  };

  const handleStartPurchase = (property: Property) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `/purchase?propertyId=${property.id}`;
  };

  const handleStartIM = (property: Property) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `/im?propertyId=${property.id}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return price.toLocaleString();
  };

  const activeFilterCount = [
    filters.city ? 1 : 0,
    filters.priceRange > 0 ? 1 : 0,
    filters.bedrooms > 0 ? 1 : 0,
    filters.status ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const getRegionalInventoryForCity = (city: string) => {
    return regionalInventory.filter((i) => i.city === city);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim()) {
      const newTag: SelectableCustomerTag = {
        id: Date.now(),
        name: customTagInput.trim(),
        color: 'bg-primary-100 text-primary-700',
      };
      availableTags.push(newTag);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setCustomTagInput('');
      setShowCustomTagInput(false);
    }
  };

  const handleCopySop = async (sop: SOPTemplate) => {
    try {
      await navigator.clipboard.writeText(sop.content);
      setCopiedSopId(sop.id);
      setTimeout(() => setCopiedSopId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSendSopToIM = (sop: SOPTemplate) => {
    setSelectedSop(sop);
    setShowSopModal(false);
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `/im?sopId=${sop.id}`;
  };

  const getEmptyStateReasons = () => {
    const reasons = [];
    if (filters.bedrooms === 1) {
      reasons.push('当前区域小户型房源供应紧张，开发商正加紧推盘');
      reasons.push('建议考虑2室户型或扩大搜索范围');
    }
    if (filters.city) {
      const inventory = getRegionalInventoryForCity(filters.city);
      if (inventory.length > 0) {
        const total = inventory.reduce((sum, i) => sum + i.total, 0);
        const available = inventory.reduce((sum, i) => sum + i.available, 0);
        reasons.push(`${filters.city}当前总库存 ${total} 套，可售 ${available} 套`);
        if (filters.bedrooms > 0) {
          reasons.push(`${filters.city}${bedroomOptions.find((o) => o.value === filters.bedrooms)?.label}户型暂无可售房源`);
        }
      }
    }
    if (filters.status === 'available') {
      reasons.push('可售房源紧张，建议关注锁定房源释放');
    }
    return reasons.length > 0 ? reasons : ['当前筛选条件下暂无房源', '建议调整筛选条件或扩大搜索范围'];
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          筛选条件
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-sm text-primary-700 hover:text-primary-800">
            清除全部
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">城市</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 appearance-none bg-white"
          >
            <option value="">不限城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">价格范围</label>
        <div className="grid grid-cols-2 gap-2">
          {priceRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => handleFilterChange('priceRange', index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.priceRange === index
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">户型</label>
        <div className="flex flex-wrap gap-2">
          {bedroomOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterChange('bedrooms', option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                filters.bedrooms === option.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.value > 0 && <BedDouble className="w-4 h-4" />}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">房源状态</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilterChange('status', option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === option.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const processSteps = [
    { key: 'eligibility', label: '限购核验', icon: Shield, color: 'blue' },
    { key: 'lock', label: '锁房', icon: Clock, color: 'amber' },
    { key: 'subscribe', label: '认购', icon: FileCheck, color: 'green' },
    { key: 'sign', label: '签约', icon: FileSignature, color: 'purple' },
    { key: 'supervise', label: '资金监管', icon: Wallet, color: 'indigo' },
    { key: 'loan', label: '贷款预审', icon: Building, color: 'pink' },
  ];

  const getProcessStatus = (property: Property, stepKey: string) => {
    if (property.status === 'sold') {
      return 'completed';
    }
    if (property.status === 'locked') {
      if (stepKey === 'eligibility') return 'completed';
      if (stepKey === 'lock') return 'current';
      return 'pending';
    }
    if (property.status === 'available') {
      if (stepKey === 'eligibility') return 'available';
      return 'pending';
    }
    return 'pending';
  };

  const ProcessStatusBadge = ({ status }: { status: string }) => {
    if (status === 'completed') {
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    }
    if (status === 'current') {
      return <Clock className="w-3 h-3 text-amber-500 animate-pulse" />;
    }
    if (status === 'available') {
      return <span className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500" />;
    }
    return <span className="w-3 h-3 rounded-full bg-gray-200" />;
  };

  const getStepDetail = (property: Property, stepKey: string) => {
    const order = property.order;
    if (!order) return null;

    const details: Record<string, { status: string; feedback: string; certificateNo: string; progress: number }> = {
      eligibility: {
        status: order.eligibilityStatus,
        feedback: order.eligibilityFeedback,
        certificateNo: '',
        progress: order.eligibilityStatus === 'pass' ? 100 : order.eligibilityStatus === 'pending' ? 50 : 0
      },
      lock: {
        status: order.lockStatus,
        feedback: '',
        certificateNo: '',
        progress: order.lockStatus === 'completed' ? 100 : order.lockStatus === 'pending' ? 50 : 0
      },
      subscribe: {
        status: order.subscribeStatus,
        feedback: '',
        certificateNo: order.subscribeCertificateNo,
        progress: order.subscribeStatus === 'completed' ? 100 : order.subscribeStatus === 'pending' ? 50 : 0
      },
      sign: {
        status: order.signStatus,
        feedback: '',
        certificateNo: order.signContractNo,
        progress: order.signStatus === 'completed' ? 100 : order.signStatus === 'pending' ? 50 : 0
      },
      supervise: {
        status: order.superviseStatus,
        feedback: `监管银行：${order.superviseBank}`,
        certificateNo: order.superviseAccountNo,
        progress: order.superviseStatus === 'completed' ? 100 : order.superviseStatus === 'pending' ? 50 : 0
      },
      loan: {
        status: order.loanStatus,
        feedback: order.loanFeedback || `贷款银行：${order.loanBank}`,
        certificateNo: '',
        progress: order.loanStatus === 'approved' ? 100 : order.loanStatus === 'pending' ? 50 : 0
      }
    };

    return details[stepKey];
  };

  const QuickActions = ({ property }: { property: Property }) => {
    const [showProcessDetail, setShowProcessDetail] = useState(false);
    const stepDetail = property.order ? getStepDetail(property, 'eligibility') : null;

    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        {property.order && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">订单编号：{property.order.orderNo}</span>
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {property.order.status === 'subscribed' ? '已认购' :
                 property.order.status === 'signed' ? '已签约' :
                 property.order.status === 'fund_supervised' ? '资金监管中' :
                 property.order.status === 'loan_pending' ? '贷款审批中' :
                 property.order.status === 'completed' ? '已完成' : '进行中'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">监管银行：</span>
                <span className="text-gray-900">{property.order.superviseBank}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">贷款银行：</span>
                <span className="text-gray-900">{property.order.loanBank}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <button
            onClick={() => setShowProcessDetail(!showProcessDetail)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">购房流程进度</span>
            </div>
            {showProcessDetail ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <div className="flex items-center gap-1 px-2 mt-2">
            {processSteps.map((step, index) => {
              const status = getProcessStatus(property, step.key);
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <ProcessStatusBadge status={status} />
                    <span className={`text-xs mt-1 ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'current' ? 'text-amber-600' :
                      status === 'available' ? 'text-blue-600' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${
                      status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showProcessDetail && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {processSteps.map((step) => {
                const status = getProcessStatus(property, step.key);
                const StepIcon = step.icon;
                const detail = property.order ? getStepDetail(property, step.key) : null;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      status === 'completed' ? 'bg-green-100' :
                      status === 'current' ? 'bg-amber-100' :
                      status === 'available' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 className={`w-4 h-4 text-green-600`} />
                      ) : (
                        <StepIcon className={`w-4 h-4 ${
                          status === 'current' ? 'text-amber-600' :
                          status === 'available' ? 'text-blue-600' :
                          'text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          status === 'completed' || status === 'current' || status === 'available'
                            ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                        <span className={`text-xs ${
                          status === 'completed' ? 'text-green-600' :
                          status === 'current' ? 'text-amber-600' :
                          status === 'available' ? 'text-blue-600' :
                          'text-gray-400'
                        }`}>
                          {status === 'completed' ? '已完成' :
                           status === 'current' ? '进行中' :
                           status === 'available' ? '可办理' :
                           '待办理'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.key === 'eligibility' && '提交材料进行购房资格审核，约1个工作日'}
                        {step.key === 'lock' && '支付意向金，锁定房源7天'}
                        {step.key === 'subscribe' && '支付定金，签署电子认购书'}
                        {step.key === 'sign' && 'CA认证，线上签署购房合同'}
                        {step.key === 'supervise' && '房款存入第三方监管账户'}
                        {step.key === 'loan' && '银行贷款预审，最快3个工作日出批复'}
                      </p>
                      {detail && (
                        <div className="mt-2 space-y-1">
                          {detail.status && detail.status !== 'pending' && detail.status !== 'completed' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-gray-600">状态：</span>
                              <span className={`text-xs ${
                                detail.status === 'pass' || detail.status === 'approved' ? 'text-green-600' :
                                detail.status === 'reject' || detail.status === 'failed' ? 'text-red-600' :
                                'text-amber-600'
                              }`}>
                                {detail.status === 'pass' ? '通过' :
                                 detail.status === 'reject' ? '拒绝' :
                                 detail.status === 'approved' ? '已批准' :
                                 detail.status === 'failed' ? '失败' : detail.status}
                              </span>
                            </div>
                          )}
                          {detail.feedback && (
                            <div className="flex items-start gap-1">
                              <span className="text-xs font-medium text-gray-600">反馈：</span>
                              <span className={`text-xs ${
                                detail.status === 'reject' || detail.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {detail.feedback}
                              </span>
                            </div>
                          )}
                          {detail.certificateNo && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-gray-600">存证编号：</span>
                              <span className="text-xs text-gray-900 font-mono">{detail.certificateNo}</span>
                            </div>
                          )}
                          {detail.progress > 0 && (
                            <div className="mt-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs text-gray-500">监管进度</span>
                                <span className="text-xs text-gray-600">{detail.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${detail.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {status === 'available' && (
                      <button
                        onClick={() => handleStartPurchase(property)}
                        className="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        办理
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          {property.status === 'available' && (
            <>
              <button
                onClick={() => handleStartPurchase(property)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                title="限购核验"
              >
                <Shield className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-600">核验</span>
              </button>
              <button
                onClick={() => handleStartPurchase(property)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                title="立即认购"
              >
                <FileCheck className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-600">认购</span>
              </button>
              <button
                onClick={() => handleStartPurchase(property)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                title="线上签约"
              >
                <FileSignature className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-600">签约</span>
              </button>
              <button
                onClick={() => handleStartPurchase(property)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                title="资金监管"
              >
                <Wallet className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-600">监管</span>
              </button>
              <button
                onClick={() => handleStartIM(property)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                title="咨询顾问"
              >
                <MessageCircle className="w-4 h-4 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs text-gray-600">咨询</span>
              </button>
            </>
          )}
          {property.status === 'locked' && (
            <button
              onClick={() => handleStartIM(property)}
              className="col-span-5 flex items-center justify-center gap-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">房源已锁定，点击联系顾问了解释放时间</span>
            </button>
          )}
          {property.status === 'sold' && (
            <button
              onClick={() => handleStartIM(property)}
              className="col-span-5 flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">房源已售出，点击查看同类型房源</span>
            </button>
          )}
          {property.status === 'offline' && (
            <button
              onClick={() => handleStartIM(property)}
              className="col-span-5 flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">房源已下架，点击咨询相似房源</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const ErpSyncInfo = ({ property }: { property: Property }) => (
    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">ERP销控系统同步</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          property.erpSyncStatus === 'synced' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {property.erpSyncStatus === 'synced' ? '已同步' : '同步中'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">数据来源：</span>
          <span className="text-gray-900">{property.erpSource}</span>
        </div>
        <div>
          <span className="text-gray-500">同步次数：</span>
          <span className="text-gray-900">{property.erpSyncCount}次</span>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">最后同步：</span>
          <span className="text-gray-900">{property.erpLastSyncAt}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-serif text-3xl font-bold text-gray-900">房源列表</h1>
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="btn-secondary flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              开发商直连工作台
            </Link>
          )}
        </div>
        <p className="text-gray-500">为您找到 {filteredProperties.length} 套优质房源</p>
      </div>

      {isAuthenticated && (user?.role === 'admin' || user?.role === 'advisor') && (
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">开发商直连工作台</h3>
                <p className="text-sm text-gray-600">实时房源状态同步、一房一价管理、销售数据看板</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/admin/dashboard" className="btn-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                销售看板
              </Link>
              <Link to="/admin/properties" className="btn-secondary flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                楼盘管理
              </Link>
              <Link to="/admin/tickets" className="btn-secondary flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                工单处理
              </Link>
              <Link to="/admin/commission" className="btn-secondary flex items-center gap-2">
                <Users className="w-4 h-4" />
                分佣规则
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg"
        >
          <Filter className="w-5 h-5" />
          筛选条件
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-primary-700 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">筛选</h3>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <FilterSidebar />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full btn-primary mt-6"
              >
                应用筛选
              </button>
            </div>
          </div>
        )}

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="card p-6 sticky top-24">
            <FilterSidebar />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="card p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索楼盘名称、地址..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700/20"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.city && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  {filters.city}
                  <button onClick={() => handleFilterChange('city', '')} className="hover:text-primary-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.priceRange > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  💰 {priceRanges[filters.priceRange].label}
                  <button onClick={() => handleFilterChange('priceRange', 0)} className="hover:text-primary-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.bedrooms > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  <BedDouble className="w-4 h-4" />
                  {bedroomOptions.find((o) => o.value === filters.bedrooms)?.label}
                  <button onClick={() => handleFilterChange('bedrooms', 0)} className="hover:text-primary-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  🏠 {statusOptions.find((o) => o.value === filters.status)?.label}
                  <button onClick={() => handleFilterChange('status', '')} className="hover:text-primary-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-12" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProperties.map((property) => (
                <div key={property.id} className="card-hover">
                  <PropertyCard property={property} />
                  <div className="px-4 pb-4">
                    <QuickActions property={property} />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowErpPanel(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Database className="w-4 h-4" />
                        ERP同步信息
                      </button>
                      <button
                        onClick={async () => {
                          setSelectedProperty(property);
                          await loadPriceLogs(property.id);
                          setShowPriceLogs(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        价格变更记录
                      </button>
                    </div>
                    {showErpPanel && selectedProperty?.id === property.id && (
                      <div className="mt-3">
                        <ErpSyncInfo property={property} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Maximize2 className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-semibold text-xl text-gray-900 mb-2">暂无符合条件的房源</h3>
                <p className="text-gray-500 mb-6">当前筛选条件下没有找到合适的房源</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  缺房原因分析
                </h4>
                <ul className="space-y-3">
                  {getEmptyStateReasons().map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-amber-800">
                      <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {filters.city && getRegionalInventoryForCity(filters.city).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {filters.city}区域库存情况
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getRegionalInventoryForCity(filters.city).map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-sm text-gray-500">{item.district}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-bold text-blue-900">{item.available}</span>
                          <span className="text-sm text-gray-500">/ {item.total}套</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          均价：¥{formatPrice(Math.round(item.avgPrice))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filters.bedrooms === 2 && cityStrategies.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-teal-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    城市策略推荐
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cityStrategies.map((strategy) => (
                      <div key={strategy.id} className="bg-white rounded-lg p-4 border border-teal-100">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{strategy.city} {strategy.district}</h5>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            strategy.priority === 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            优先级{strategy.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{strategy.strategy}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                            目标价：{strategy.targetPriceMin}-{strategy.targetPriceMax}万
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    window.location.href = '/im';
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">预约顾问跟进</h4>
                  <p className="text-sm text-gray-500 text-center">专属置业顾问1对1服务，为您寻找合适房源</p>
                  <span className="text-sm text-primary-600 flex items-center gap-1 mt-2">
                    立即预约 <ArrowRight className="w-4 h-4" />
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    window.location.href = '/purchase';
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">限购资格核验</h4>
                  <p className="text-sm text-gray-500 text-center">提前核验购房资格，避免后期风险</p>
                  <span className="text-sm text-primary-600 flex items-center gap-1 mt-2">
                    开始核验 <ArrowRight className="w-4 h-4" />
                  </span>
                </button>

                <button
                  onClick={clearFilters}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">清除筛选条件</h4>
                  <p className="text-sm text-gray-500 text-center">查看所有房源，扩大选择范围</p>
                  <span className="text-sm text-primary-600 flex items-center gap-1 mt-2">
                    查看全部 <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  开发商推盘计划
                  <span className="ml-auto text-xs font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    即将开盘 · 优先登记
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg p-4 border border-orange-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                            {project.projectName}
                            {project.hotLevel === 'high' && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3" /> 热门
                              </span>
                            )}
                          </h5>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {project.developer}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{project.expectedPrice}</p>
                          <p className="text-xs text-gray-500">预计均价</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {project.district}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <BedDouble className="w-3 h-3" />
                          {project.bedrooms}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Maximize2 className="w-3 h-3" />
                          {project.area}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Building className="w-3 h-3" />
                          共{project.totalUnits}套
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <Clock8 className="w-3 h-3" />
                          开盘时间：{project.launchDate}
                        </span>
                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              window.location.href = '/login';
                              return;
                            }
                            window.location.href = `/im?projectId=${project.id}&action=register`;
                          }}
                          className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          预约登记
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-cyan-900 mb-4 flex items-center gap-2">
                  <AudioLines className="w-5 h-5 text-cyan-600" />
                  会话存档
                  <span className="ml-auto text-xs font-normal text-cyan-600 bg-cyan-100 px-2 py-1 rounded-full">
                    合规留痕
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/login';
                        return;
                      }
                      window.location.href = '/im?archive=call';
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PhoneCall className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">电话录音</span>
                    <span className="text-xs text-gray-500">通话全程录音存档</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/login';
                        return;
                      }
                      window.location.href = '/im?archive=im';
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">IM聊天记录</span>
                    <span className="text-xs text-gray-500">消息不可撤回删除</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/login';
                        return;
                      }
                      window.location.href = '/im?archive=video';
                    }}
                    className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-cyan-100 hover:border-cyan-300 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">带看视频</span>
                    <span className="text-xs text-gray-500">全程录像云端存储</span>
                  </button>
                </div>
              </div>

              {customerTags.length > 0 && (
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-pink-900 mb-4 flex items-center gap-2">
                    <Tags className="w-5 h-5 text-pink-600" />
                    客户标签
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {customerTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-pink-700 border border-pink-200 flex items-center gap-1"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  顾问跟进记录
                </h4>
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-purple-200" />
                  <div className="space-y-4">
                    {followUpRecords.map((record, index) => {
                      const TypeIcon = typeIconMap[record.type] || MessageCircle;
                      return (
                        <div key={record.id} className="relative pl-10">
                          <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                          }`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{record.content}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.date}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{record.result}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                跟进顾问：{record.advisorName}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                record.type === 'call' ? 'bg-blue-100 text-blue-700' :
                                record.type === 'visit' ? 'bg-green-100 text-green-700' :
                                record.type === 'subscribe' ? 'bg-amber-100 text-amber-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {record.type === 'call' ? '电话跟进' :
                                 record.type === 'visit' ? '到店咨询' :
                                 record.type === 'subscribe' ? '预约登记' :
                                 'IM咨询'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  客户打标
                  {selectedTags.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      已选择 {selectedTags.length} 个标签
                    </span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        selectedTags.includes(tag.id)
                          ? `${tag.color} ring-2 ring-offset-1 ring-current`
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {selectedTags.includes(tag.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {tag.name}
                    </button>
                  ))}
                  {showCustomTagInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="输入自定义标签"
                        className="px-3 py-1.5 text-sm border border-green-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 w-32"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                        autoFocus
                      />
                      <button
                        onClick={handleAddCustomTag}
                        className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomTagInput(false);
                          setCustomTagInput('');
                        }}
                        className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomTagInput(true)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-dashed border-gray-300 hover:border-green-400 hover:text-green-600 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      自定义标签
                    </button>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-green-200">
                    <p className="text-sm text-gray-600">
                      已为客户打上意向标签，顾问将根据标签精准推荐房源
                    </p>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          window.location.href = '/login';
                          return;
                        }
                        window.location.href = `/im?tags=${selectedTags.join(',')}`;
                      }}
                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      同步给顾问
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  IM咨询SOP承接
                  <span className="ml-auto text-xs font-normal text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    快速话术
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sopTemplates.map((sop) => (
                    <div
                      key={sop.id}
                      className="bg-white rounded-lg p-4 border border-indigo-100 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedSop(sop);
                        setShowSopModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {sop.title}
                        </h5>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {sop.usageCount}次使用
                        </span>
                      </div>
                      <p className="text-xs text-indigo-600 mb-2">{sop.category}</p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{sop.content}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySop(sop);
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        >
                          {copiedSopId === sop.id ? (
                            <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 已复制</>
                          ) : (
                            <><FileText className="w-3.5 h-3.5" /> 复制话术</>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSopToIM(sop);
                          }}
                          className="flex-1 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          发送至IM
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {reminders.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600" />
                    提醒记录
                    <span className="ml-auto text-xs font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {reminders.length}条待办
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {reminders.map((reminder) => {
                      const remindAt = reminder.remindAt || (reminder as any).remindTime;
                      const isOverdue = new Date(remindAt) < new Date();
                      return (
                        <div key={reminder.id} className={`bg-white rounded-lg p-4 border ${
                          isOverdue ? 'border-red-200' : 'border-orange-100'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isOverdue ? 'bg-red-100' : 'bg-orange-100'
                              }`}>
                                {reminder.type === 'sale' ? (
                                  <ShoppingBag className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                                ) : reminder.type === 'verify' ? (
                                  <Shield className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                                ) : (
                                  <FileText className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                                )}
                              </div>
                              <div>
                                <h5 className={`font-medium ${
                                  isOverdue ? 'text-red-900' : 'text-gray-900'
                                }`}>
                                  {reminder.title}
                                </h5>
                                <p className="text-sm text-gray-600 mt-1">{reminder.content}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className={`flex items-center gap-1 ${
                                    isOverdue ? 'text-red-600' : 'text-gray-500'
                                  }`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {remindAt}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-red-600 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      已逾期
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (!isAuthenticated) {
                                  window.location.href = '/login';
                                  return;
                                }
                                window.location.href = `/im?reminder=${reminder.id}`;
                              }}
                              className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              去处理
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button onClick={clearFilters} className="btn-primary px-8">
                  清除筛选条件
                </button>
                <Link to="/properties" className="btn-secondary px-8">
                  返回房源列表
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPriceLogs && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">一房一价变更记录</h3>
                <p className="text-sm text-gray-500 mt-1">完整审计痕迹，每笔调价均可追溯</p>
              </div>
              <button onClick={() => setShowPriceLogs(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{selectedProperty.projectName}</h4>
                  <p className="text-sm text-blue-700">{selectedProperty.city} {selectedProperty.district} {selectedProperty.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      ERP来源: {selectedProperty.erpSource}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      最后同步: {selectedProperty.erpLastSyncAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3" />
                      累计同步: {selectedProperty.erpSyncCount}次
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {priceLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无价格变更记录</p>
            ) : (
              <div className="space-y-4">
                {priceLogs.map((log, index) => {
                  const priceDiff = log.newPrice - log.oldPrice;
                  const isPriceUp = priceDiff > 0;
                  return (
                    <div key={log.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">#{priceLogs.length - index}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 line-through">¥{formatPrice(log.oldPrice)}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-lg text-primary-600">¥{formatPrice(log.newPrice)}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isPriceUp
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-green-50 text-green-600'
                              }`}>
                                {isPriceUp ? '上涨' : '下降'} ¥{formatPrice(Math.abs(priceDiff))}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{log.changeReason}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {log.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-200">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600 mb-1">ERP系统来源</p>
                            <p className="text-sm font-medium text-blue-900 flex items-center gap-1">
                              <Database className="w-4 h-4" />
                              {log.erpSource}
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs text-purple-600 mb-1">折扣率</p>
                            <p className="text-sm font-medium text-purple-900 flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {log.discountRate}折
                            </p>
                          </div>
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600 mb-1">优惠生效条件</p>
                            <p className="text-sm font-medium text-amber-900 flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {log.promotionCondition}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600 mb-1">有效期限</p>
                            <p className="text-sm font-medium text-green-900 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {log.effectiveDate} ~ {log.expiryDate}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">操作人</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {log.changedByUser?.name || '系统自动'}
                              <span className="text-xs text-gray-500 ml-1">
                                ({log.changedByUser?.role === 'admin' ? '管理员' : '销售顾问'})
                              </span>
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">复核人</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {log.reviewedByUser?.name || '系统自动'}
                              <span className={`text-xs ml-1 ${
                                log.reviewStatus === 'approved' ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                ({log.reviewStatus === 'approved' ? '已通过' : '待复核'})
                              </span>
                            </p>
                          </div>
                        </div>

                        {log.reviewComment && (
                          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                            <p className="text-xs text-indigo-600 mb-1">复核意见</p>
                            <p className="text-sm text-indigo-900">"{log.reviewComment}"</p>
                            <p className="text-xs text-indigo-500 mt-1 text-right">
                              复核时间: {log.reviewedAt}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-500">
                共 {priceLogs.length} 条调价记录，所有操作均已上链存证，不可篡改
              </p>
              <button onClick={() => setShowPriceLogs(false)} className="btn-primary px-6">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showSopModal && selectedSop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedSop.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {selectedSop.category}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    累计使用 {selectedSop.usageCount} 次
                  </span>
                </div>
              </div>
              <button onClick={() => setShowSopModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 mb-6">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedSop.content}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCopySop(selectedSop)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                {copiedSopId === selectedSop.id ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-600" /> 已复制到剪贴板</>
                ) : (
                  <><FileText className="w-4 h-4" /> 复制话术</>
                )}
              </button>
              <button
                onClick={() => handleSendSopToIM(selectedSop)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                发送至IM咨询
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
