import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PawPrint,
  MessageCircle,
  MapPin,
  ShoppingBag,
  Users,
  Calendar,
  ChevronRight,
  Sparkles,
  Search,
  Stethoscope,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  Package,
  Pill,
  ShieldCheck,
  FileText,
  ListChecks,
  ShoppingCart,
  Check,
  X,
  Navigation,
  Activity,
  Heart,
  Syringe,
  ClipboardList,
  Receipt,
  History,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PetCard from '@/components/PetCard';
import DoctorCard from '@/components/DoctorCard';
import HospitalCard from '@/components/HospitalCard';
import ProductCard from '@/components/ProductCard';
import PostCard from '@/components/PostCard';
import HealthCalendar from '@/components/HealthCalendar';
import { cn } from '@/lib/utils';
import type {
  Pet,
  Doctor,
  Hospital,
  Product,
  CommunityPost,
  HealthCalendarEvent,
} from '@shared/types';

interface OperationRecord {
  id: string;
  time: string;
  type: string;
  content: string;
  status: 'completed' | 'inProgress' | 'appointed' | 'added';
  result: string;
}

interface AppointmentType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  price: number;
  timeSlots: string[];
}

interface ConsultationStatus {
  [doctorId: string]: 'idle' | 'calling' | 'connected';
}

interface AppointmentSelection {
  [typeId: string]: {
    expanded: boolean;
    selectedTime: string | null;
  };
}

interface SupervisionDetail {
  id: string;
  title: string;
  date: string;
  status: string;
  amount?: number;
}

interface SupervisionCategory {
  id: string;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  details: SupervisionDetail[];
}

const mockPets: Pet[] = [
  {
    id: '1',
    ownerId: '1',
    name: '豆豆',
    species: 'dog',
    breed: '金毛寻回犬',
    gender: 'male',
    birthday: '2022-03-15',
    weight: 28.5,
    healthStatus: 'healthy',
    vaccineRecords: [
      { id: 'v1', petId: '1', vaccineName: '狂犬疫苗', date: '2025-01-15', nextDate: '2026-01-15' },
    ],
    dewormingRecords: [
      { id: 'd1', petId: '1', type: 'internal', productName: '拜宠清', date: '2025-03-01', nextDate: '2025-06-01' },
    ],
  },
  {
    id: '2',
    ownerId: '1',
    name: '咪咪',
    species: 'cat',
    breed: '英国短毛猫',
    gender: 'female',
    birthday: '2023-07-20',
    weight: 4.2,
    healthStatus: 'healthy',
    vaccineRecords: [],
    dewormingRecords: [],
  },
];

const mockDoctors: Doctor[] = [
  {
    id: '1',
    userId: 'd1',
    hospitalId: 'h1',
    name: '王医生',
    title: '主任医师',
    department: '内科',
    licenseNumber: 'VET20200001',
    licenseVerified: true,
    rating: 4.9,
    consultationCount: 1256,
    isOnline: true,
  },
  {
    id: '2',
    userId: 'd2',
    hospitalId: 'h1',
    name: '李医生',
    title: '副主任医师',
    department: '外科',
    licenseNumber: 'VET20200002',
    licenseVerified: true,
    rating: 4.8,
    consultationCount: 892,
    isOnline: true,
  },
  {
    id: '3',
    userId: 'd3',
    hospitalId: 'h2',
    name: '张医生',
    title: '执业兽医师',
    department: '皮肤科',
    licenseNumber: 'VET20210015',
    licenseVerified: true,
    rating: 4.7,
    consultationCount: 534,
    isOnline: false,
  },
];

const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    userId: 'hu1',
    name: '爱宠动物医院（总院）',
    address: '北京市朝阳区建国路88号',
    latitude: 39.9087,
    longitude: 116.4978,
    phone: '010-12345678',
    businessHours: '08:00 - 22:00',
    rating: 4.8,
    reviewCount: 2356,
    verified: true,
    services: [
      { id: 's1', hospitalId: 'h1', name: '常规体检', description: '', price: 199, duration: 30 },
      { id: 's2', hospitalId: 'h1', name: '疫苗接种', description: '', price: 80, duration: 15 },
      { id: 's3', hospitalId: 'h1', name: '绝育手术', description: '', price: 880, duration: 120 },
    ],
  },
  {
    id: 'h2',
    userId: 'hu2',
    name: '宠物之家诊疗中心',
    address: '北京市海淀区中关村大街1号',
    latitude: 39.9847,
    longitude: 116.3046,
    phone: '010-87654321',
    businessHours: '24小时',
    rating: 4.6,
    reviewCount: 1089,
    verified: true,
    services: [],
  },
  {
    id: 'h3',
    userId: 'hu3',
    name: '瑞鹏宠物医院（望京店）',
    address: '北京市朝阳区望京西路45号',
    latitude: 39.9987,
    longitude: 116.4678,
    phone: '010-56781234',
    businessHours: '09:00 - 21:00',
    rating: 4.7,
    reviewCount: 1567,
    verified: true,
    services: [],
  },
];

const mockProducts: Product[] = [
  {
    id: 'p1',
    merchantId: 'm1',
    name: '皇家幼犬粮 2kg 全价营养配方',
    category: '主粮',
    species: ['dog'],
    ageRange: '幼年',
    healthCondition: [],
    price: 158.0,
    stock: 156,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p2',
    merchantId: 'm1',
    name: '猫砂膨润土除臭无尘 10L',
    category: '日用品',
    species: ['cat'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 69.9,
    stock: 5,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p3',
    merchantId: 'm2',
    name: '拜宠爽体外驱虫滴剂（犬用）',
    category: '驱虫药',
    species: ['dog'],
    ageRange: '成年',
    healthCondition: [],
    price: 128.0,
    stock: 89,
    isPrescription: true,
    images: [],
    description: '',
  },
  {
    id: 'p4',
    merchantId: 'm1',
    name: '宠物营养膏 猫狗通用 120g',
    category: '营养品',
    species: ['dog', 'cat'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 45.0,
    stock: 234,
    isPrescription: false,
    images: [],
    description: '',
  },
];

const mockPosts: CommunityPost[] = [
  {
    id: 'post1',
    ownerId: 'u1',
    petId: '1',
    content: '今天带豆豆去做了年度体检，各项指标都很正常！医生说它的毛发状态特别好，分享一下我平时的护理心得：\n\n1. 每天梳毛15分钟\n2. 每周洗澡一次，用宠物专用沐浴露\n3. 饮食以优质狗粮为主，偶尔加一些鸡胸肉\n4. 每天保证至少1小时的户外运动\n\n希望对大家有帮助～',
    images: [],
    tags: ['金毛', '宠物护理', '体检日记'],
    vaccineTag: '已接种狂犬疫苗',
    likes: 128,
    comments: 32,
    createdAt: '2025-06-10T10:30:00Z',
  },
  {
    id: 'post2',
    ownerId: 'u2',
    content: '新手养猫求助！我家猫咪最近总是抓耳朵，是不是有耳螨啊？有没有有经验的铲屎官分享一下治疗方法？',
    images: [],
    tags: ['猫咪', '求助', '耳螨'],
    likes: 45,
    comments: 18,
    createdAt: '2025-06-12T15:20:00Z',
  },
];

const mockEvents: HealthCalendarEvent[] = [
  {
    id: 'e1',
    ownerId: '1',
    petId: '1',
    type: 'vaccine',
    title: '豆豆 - 六联疫苗加强针',
    date: '2026-06-20',
    reminderDays: 3,
    completed: false,
  },
  {
    id: 'e2',
    ownerId: '1',
    petId: '1',
    type: 'deworming',
    title: '豆豆 - 体内驱虫',
    date: '2026-06-18',
    reminderDays: 3,
    completed: false,
  },
  {
    id: 'e3',
    ownerId: '1',
    petId: '2',
    type: 'checkup',
    title: '咪咪 - 年度体检',
    date: '2026-07-05',
    reminderDays: 7,
    completed: false,
  },
  {
    id: 'e4',
    ownerId: '1',
    petId: '1',
    type: 'vaccine',
    title: '豆豆 - 狂犬疫苗',
    date: '2026-06-10',
    reminderDays: 3,
    completed: true,
  },
  {
    id: 'e5',
    ownerId: '1',
    petId: '1',
    type: 'deworming',
    title: '豆豆 - 体外驱虫',
    date: '2026-06-08',
    reminderDays: 3,
    completed: true,
  },
  {
    id: 'e6',
    ownerId: '1',
    petId: '1',
    type: 'custom',
    title: '豆豆 - 美容洗澡',
    date: '2026-06-22',
    reminderDays: 1,
    completed: false,
  },
];

const appointmentTypes: AppointmentType[] = [
  {
    id: 'vaccine',
    name: '疫苗接种',
    icon: Syringe,
    color: 'text-forest-600',
    bgColor: 'bg-forest-100',
    description: '多联疫苗、狂犬疫苗等基础免疫',
    price: 80,
    timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  },
  {
    id: 'deworming',
    name: '驱虫服务',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '体内外驱虫、寄生虫防治',
    price: 68,
    timeSlots: ['09:30', '10:30', '11:30', '14:30', '15:30', '16:30'],
  },
  {
    id: 'checkup',
    name: '健康体检',
    icon: Activity,
    color: 'text-warm-600',
    bgColor: 'bg-warm-100',
    description: '年度体检、术前检查、专项检查',
    price: 199,
    timeSlots: ['08:30', '09:30', '10:30', '14:00', '15:00', '16:00'],
  },
];

const supervisionCategories: SupervisionCategory[] = [
  {
    id: 'consultations',
    title: '问诊记录',
    count: 12,
    icon: MessageCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    details: [
      { id: 'c1', title: '豆豆 - 皮肤过敏问诊', date: '2026-06-10', status: '已完成' },
      { id: 'c2', title: '咪咪 - 呕吐症状咨询', date: '2026-06-05', status: '已完成' },
      { id: 'c3', title: '豆豆 - 年度健康咨询', date: '2026-05-20', status: '已完成' },
    ],
  },
  {
    id: 'prescriptions',
    title: '处方记录',
    count: 5,
    icon: FileText,
    color: 'text-forest-600',
    bgColor: 'bg-forest-50',
    details: [
      { id: 'p1', title: '皮肤消炎药方 - 王医生', date: '2026-06-10', status: '已取药', amount: 128 },
      { id: 'p2', title: '益生菌处方 - 李医生', date: '2026-06-05', status: '已取药', amount: 56 },
      { id: 'p3', title: '滴耳液处方 - 张医生', date: '2026-05-28', status: '已取药', amount: 45 },
    ],
  },
  {
    id: 'appointments',
    title: '预约记录',
    count: 8,
    icon: Calendar,
    color: 'text-warm-600',
    bgColor: 'bg-warm-50',
    details: [
      { id: 'a1', title: '疫苗接种 - 六联疫苗', date: '2026-06-20', status: '待就诊' },
      { id: 'a2', title: '年度体检 - 豆豆', date: '2026-06-15', status: '已完成' },
      { id: 'a3', title: '驱虫服务 - 体内外', date: '2026-06-01', status: '已完成' },
    ],
  },
  {
    id: 'orders',
    title: '订单记录',
    count: 24,
    icon: ShoppingBag,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    details: [
      { id: 'o1', title: '皇家幼犬粮 2kg', date: '2026-06-12', status: '已签收', amount: 158 },
      { id: 'o2', title: '猫砂膨润土 10L', date: '2026-06-08', status: '已签收', amount: 69.9 },
      { id: 'o3', title: '宠物营养膏 120g', date: '2026-06-01', status: '已签收', amount: 45 },
    ],
  },
];

const quickActions = [
  { icon: PawPrint, label: '宠物档案', path: '/pets', color: 'from-forest-400 to-forest-600' },
  { icon: MessageCircle, label: '在线问诊', path: '/consultations', color: 'from-blue-400 to-blue-600' },
  { icon: MapPin, label: '附近医院', path: '/hospitals', color: 'from-pink-400 to-pink-600' },
  { icon: ShoppingBag, label: '宠物商城', path: '/shop', color: 'from-warm-300 to-warm-500' },
  { icon: Users, label: '宠物社区', path: '/community', color: 'from-purple-400 to-purple-600' },
  { icon: Calendar, label: '健康日历', path: '/calendar', color: 'from-teal-400 to-teal-600' },
];

const tabItems = [
  { id: 'consultation', label: '在线问诊', icon: MessageCircle },
  { id: 'appointment', label: '预约接种', icon: Calendar },
  { id: 'shop', label: '商城购药', icon: ShoppingBag },
  { id: 'hospital', label: '线下就医', icon: MapPin },
  { id: 'supervision', label: '业务监管', icon: ShieldCheck },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('consultation');
  const [cartCount, setCartCount] = useState(0);
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([]);
  const [consultationStatus, setConsultationStatus] = useState<ConsultationStatus>({});
  const [appointmentSelection, setAppointmentSelection] = useState<AppointmentSelection>({});
  const [expandedSupervision, setExpandedSupervision] = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [hospitalAppointmentStatus, setHospitalAppointmentStatus] = useState<Record<string, boolean>>({});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  const searchResults = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return [];

    return [
      ...mockDoctors.map((item) => ({
        id: item.id,
        type: '医生',
        title: item.name,
        desc: `${item.department} · ${item.title} · 评分 ${item.rating}`,
        action: '发起问诊',
        path: '/consultations',
      })),
      ...mockHospitals.map((item) => ({
        id: item.id,
        type: '医院',
        title: item.name,
        desc: `${item.address} · ${item.businessHours}`,
        action: '查看详情',
        path: '/hospitals',
      })),
      ...mockProducts.map((item) => ({
        id: item.id,
        type: '商品',
        title: item.name,
        desc: `${item.category} · ¥${item.price} · 库存 ${item.stock}`,
        action: item.isPrescription ? '处方购买' : '立即购买',
        path: `/shop/${item.id}`,
      })),
    ].filter((item) =>
      `${item.type} ${item.title} ${item.desc}`.toLowerCase().includes(keyword)
    ).slice(0, 6);
  }, [searchTerm]);

  const addOperationRecord = (
    type: string,
    content: string,
    status: OperationRecord['status'],
    result: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRecord: OperationRecord = {
      id: `rec-${Date.now()}`,
      time: timeStr,
      type,
      content,
      status,
      result,
    };
    setOperationRecords((prev) => [newRecord, ...prev].slice(0, 20));
  };

  const handleConsult = (doctor: Doctor) => {
    if (!doctor.isOnline) return;
    
    setConsultationStatus((prev) => ({ ...prev, [doctor.id]: 'calling' }));
    addOperationRecord('在线问诊', `呼叫 ${doctor.name}（${doctor.department}）`, 'inProgress', '正在呼叫医生...');

    setTimeout(() => {
      setConsultationStatus((prev) => ({ ...prev, [doctor.id]: 'connected' }));
      addOperationRecord('在线问诊', `与 ${doctor.name} 问诊已接通`, 'completed', '问诊已接通');
    }, 3000);
  };

  const toggleAppointmentExpand = (typeId: string) => {
    setAppointmentSelection((prev) => ({
      ...prev,
      [typeId]: {
        expanded: !prev[typeId]?.expanded,
        selectedTime: prev[typeId]?.selectedTime || null,
      },
    }));
  };

  const selectTimeSlot = (typeId: string, time: string) => {
    setAppointmentSelection((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        selectedTime: time,
      },
    }));
  };

  const confirmAppointment = (apptType: AppointmentType) => {
    const selection = appointmentSelection[apptType.id];
    if (!selection?.selectedTime) return;

    addOperationRecord(
      '预约接种',
      `预约${apptType.name} - ${selection.selectedTime}`,
      'appointed',
      `预约成功，¥${apptType.price}`
    );

    setAppointmentSelection((prev) => ({
      ...prev,
      [apptType.id]: {
        expanded: false,
        selectedTime: null,
      },
    }));
  };

  const handleAddToCart = (product: Product) => {
    if (product.isPrescription) {
      navigate(`/shop/${product.id}`);
      return;
    }

    setCartCount((prev) => prev + 1);
    setAddedProducts((prev) => new Set(prev).add(product.id));
    addOperationRecord('商城购药', `加入购物车：${product.name}`, 'added', `¥${product.price.toFixed(2)}`);

    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const handleHospitalAppointment = (hospital: Hospital) => {
    setHospitalAppointmentStatus((prev) => ({ ...prev, [hospital.id]: true }));
    addOperationRecord('线下就医', `预约挂号：${hospital.name}`, 'appointed', '预约成功');

    setTimeout(() => {
      setHospitalAppointmentStatus((prev) => ({ ...prev, [hospital.id]: false }));
    }, 3000);
  };

  const getStatusBadge = (status: OperationRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />已完成
          </span>
        );
      case 'inProgress':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />进行中
          </span>
        );
      case 'appointed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-warm-100 text-warm-700 text-[10px] font-bold flex items-center gap-1">
            <Calendar className="w-3 h-3" />已预约
          </span>
        );
      case 'added':
        return (
          <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />已加入
          </span>
        );
    }
  };

  const toggleSupervisionExpand = (categoryId: string) => {
    setExpandedSupervision((prev) => prev === categoryId ? null : categoryId);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-500 via-forest-600 to-forest-700 p-6 sm:p-8 text-white">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-warm-300" />
            <span className="text-forest-100 text-sm">开启健康守护</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">
                {greeting}，{user?.nickname || '铲屎官'}！
              </h1>
              <p className="text-forest-100 mb-6 max-w-md">
                今天也别忘了照顾你的毛孩子哦～ 你有 {mockEvents.filter((e) => !e.completed).length} 项待办健康事项
              </p>
            </div>
            {cartCount > 0 && (
              <div className="relative mr-2">
                <ShoppingCart className="w-8 h-8 text-white/90" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-warm-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
            )}
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="搜索框"
              placeholder="搜索框：请输入医生、医院、商品关键词"
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-warm-300"
            />
          </div>
        </div>
      </section>

      {searchTerm.trim() && (
        <section className="card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="section-title">搜索筛选结果</h2>
              <p className="section-subtitle">
                关键词：{searchTerm.trim()} · 命中 {searchResults.length} 条医生、医院、商品与购买入口
              </p>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="btn-ghost text-sm"
            >
              清除筛选
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.length > 0 ? searchResults.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(item.path)}
                className="text-left p-4 rounded-2xl border border-forest-100 bg-white hover:border-forest-300 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="tag tag-green">{item.type}</span>
                  <span className="text-sm font-semibold text-forest-600">{item.action}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
              </button>
            )) : (
              <div className="md:col-span-2 rounded-2xl border border-dashed border-forest-100 p-6 text-center text-gray-500">
                暂无匹配结果，可尝试搜索"医生""医院""商品""驱虫药"或"购买"
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">快捷功能</h2>
            <p className="section-subtitle">一站式宠物健康服务入口</p>
          </div>
          {cartCount > 0 && (
            <span className="text-xs text-forest-600 font-semibold flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" />
              购物车 {cartCount} 件
            </span>
          )}
        </div>

        <div className="relative border-b border-forest-100">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-px">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-300 relative',
                    isActive
                      ? 'text-forest-600'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-forest-500 to-emerald-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 min-h-[320px]">
          {activeTab === 'consultation' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockDoctors.slice(0, 3).map((doctor) => {
                  const status = consultationStatus[doctor.id] || 'idle';
                  return (
                    <div key={doctor.id} className="p-4 rounded-2xl border border-forest-100 bg-white hover:shadow-soft transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center">
                            <Stethoscope className="w-6 h-6 text-forest-500" />
                          </div>
                          {doctor.isOnline && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-gray-900 text-sm">{doctor.name}</h3>
                            {doctor.licenseVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                            )}
                          </div>
                          <p className="text-xs text-forest-600 font-medium">{doctor.title}</p>
                          <p className="text-[10px] text-gray-500">{doctor.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-warm-400 fill-warm-400" />
                          <span className="font-semibold text-gray-700">{doctor.rating}</span>
                        </div>
                        <span>接诊 {doctor.consultationCount} 次</span>
                      </div>
                      {status === 'idle' && (
                        <button
                          onClick={() => handleConsult(doctor)}
                          disabled={!doctor.isOnline}
                          className={cn(
                            'w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                            doctor.isOnline
                              ? 'bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-forest-500/20'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          )}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {doctor.isOnline ? '立即问诊' : '医生离线'}
                        </button>
                      )}
                      {status === 'calling' && (
                        <div className="w-full py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </svg>
                          正在呼叫医生...
                        </div>
                      )}
                      {status === 'connected' && (
                        <div className="w-full py-2 rounded-xl bg-green-50 text-green-600 text-sm font-semibold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          问诊已接通
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'appointment' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {appointmentTypes.map((appt) => {
                  const Icon = appt.icon;
                  const selection = appointmentSelection[appt.id];
                  const isExpanded = selection?.expanded;
                  return (
                    <div key={appt.id} className="rounded-2xl border border-forest-100 bg-white overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', appt.bgColor)}>
                            <Icon className={cn('w-6 h-6', appt.color)} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm">{appt.name}</h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">{appt.description}</p>
                            <p className="text-warm-500 font-bold text-sm mt-1">¥{appt.price} 起</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleAppointmentExpand(appt.id)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-forest-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          立即预约
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-forest-50 p-4 bg-forest-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-semibold text-gray-700 mb-3">选择预约时间</p>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {appt.timeSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => selectTimeSlot(appt.id, time)}
                                className={cn(
                                  'py-2 text-xs font-semibold rounded-lg border transition-all',
                                  selection?.selectedTime === time
                                    ? 'bg-forest-500 text-white border-forest-500'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300'
                                )}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => confirmAppointment(appt)}
                            disabled={!selection?.selectedTime}
                            className={cn(
                              'w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                              selection?.selectedTime
                                ? 'bg-warm-500 text-white hover:bg-warm-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            <Check className="w-4 h-4" />
                            确认预约
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockProducts.slice(0, 4).map((product) => {
                  const isAdded = addedProducts.has(product.id);
                  return (
                    <div key={product.id} className="rounded-2xl border border-forest-100 bg-white overflow-hidden hover:shadow-soft transition-all">
                      <div className="aspect-square bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center relative">
                        <Package className="w-12 h-12 text-forest-300" />
                        {product.isPrescription && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-100 text-warm-500 text-[10px] font-medium">
                            <Pill className="w-3 h-3" />
                            处方药
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-xs line-clamp-2 mb-2 h-8">
                          {product.name}
                        </h3>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400">¥</span>
                            <span className="text-lg font-bold text-warm-500">{product.price.toFixed(0)}</span>
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className={cn(
                              'p-2 rounded-xl transition-all shadow-relative',
                              isAdded
                                ? 'bg-green-500 text-white'
                                : product.isPrescription
                                  ? 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                                  : 'bg-forest-500 text-white hover:bg-forest-600'
                            )}
                          >
                            {isAdded ? (
                              <Check className="w-4 h-4" />
                            ) : product.isPrescription ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {isAdded && (
                          <p className="text-[10px] text-green-600 font-semibold mt-2 text-center">
                            ✓ 已加入购物车
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'hospital' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockHospitals.slice(0, 3).map((hospital) => {
                  const isAppointed = hospitalAppointmentStatus[hospital.id];
                  return (
                    <div key={hospital.id} className="p-4 rounded-2xl border border-forest-100 bg-white hover:shadow-soft transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center shrink-0">
                          <MapPin className="w-6 h-6 text-pink-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{hospital.name}</h3>
                            {hospital.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{hospital.address}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-warm-400 fill-warm-400" />
                            <span className="text-xs font-semibold text-gray-700">{hospital.rating}</span>
                            <span className="text-[10px] text-gray-400">({hospital.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
                        <Clock className="w-3 h-3" />
                        <span>{hospital.businessHours}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          导航前往
                        </button>
                        <button
                          onClick={() => handleHospitalAppointment(hospital)}
                          className={cn(
                            'flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1',
                            isAppointed
                              ? 'bg-green-500 text-white'
                              : 'bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-md'
                          )}
                        >
                          {isAppointed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              已预约
                            </>
                          ) : (
                            <>
                              <ClipboardList className="w-3.5 h-3.5" />
                              预约挂号
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'supervision' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-xs text-gray-500 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-forest-500" />
                宠主视角业务监管 · 所有记录均已加密存储，保障您的隐私安全
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {supervisionCategories.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = expandedSupervision === category.id;
                  return (
                    <div key={category.id} className="rounded-2xl border border-forest-100 bg-white overflow-hidden">
                      <button
                        onClick={() => toggleSupervisionExpand(category.id)}
                        className="w-full p-4 text-left hover:bg-forest-50/50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', category.bgColor)}>
                            <Icon className={cn('w-5 h-5', category.color)} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600">{category.title}</p>
                            <p className="text-xl font-bold text-gray-900">{category.count}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>点击查看明细</span>
                          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-90')} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-forest-50 p-3 space-y-2 bg-forest-50/30 animate-in fade-in duration-200">
                          {category.details.map((detail) => (
                            <div
                              key={detail.id}
                              className="p-2 rounded-lg bg-white border border-forest-50 flex items-center justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-gray-700 truncate">{detail.title}</p>
                                <p className="text-[10px] text-gray-400">{detail.date}</p>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                {detail.amount && (
                                  <p className="text-[11px] font-bold text-warm-500">¥{detail.amount}</p>
                                )}
                                <p className="text-[10px] text-forest-600 font-medium">{detail.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white hover:shadow-hover transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {operationRecords.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <History className="w-5 h-5 text-forest-500" />
                我的操作记录
              </h2>
              <p className="section-subtitle">最近的操作留痕，共 {operationRecords.length} 条</p>
            </div>
            <span className="text-xs text-gray-400">最近5条</span>
          </div>
          <div className="space-y-2">
            {operationRecords.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-forest-50/30 border border-forest-50 hover:bg-forest-50 transition-all"
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-[10px] text-gray-400">时间</p>
                  <p className="text-xs font-mono font-semibold text-gray-600">{record.time}</p>
                </div>
                <div className="w-px h-10 bg-forest-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-forest-600 font-semibold border border-forest-100">
                      {record.type}
                    </span>
                    {getStatusBadge(record.status)}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate">{record.content}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-gray-600">{record.result}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">我的宠物</h2>
                <p className="section-subtitle">管理毛孩子的健康档案</p>
              </div>
              <button
                onClick={() => navigate('/pets')}
                className="btn-ghost text-sm"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">在线医生</h2>
                <p className="section-subtitle">专业兽医随时为你解答</p>
              </div>
              <button
                onClick={() => navigate('/consultations')}
                className="btn-ghost text-sm"
              >
                更多医生 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {mockDoctors.slice(0, 2).map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onConsult={() => navigate('/consultations')}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">附近医院</h2>
                <p className="section-subtitle">专业靠谱的宠物诊疗机构</p>
              </div>
              <button
                onClick={() => navigate('/hospitals')}
                className="btn-ghost text-sm"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {mockHospitals.slice(0, 2).map((hospital) => (
                <HospitalCard key={hospital.id} hospital={hospital} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">社区动态</h2>
                <p className="section-subtitle">和铲屎官们一起交流</p>
              </div>
              <button
                onClick={() => navigate('/community')}
                className="btn-ghost text-sm"
              >
                更多动态 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">健康日历</h2>
                <p className="section-subtitle">即将到来的健康事项</p>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="btn-ghost text-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <HealthCalendar events={mockEvents} compact />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">热门商品</h2>
                <p className="section-subtitle">铲屎官都在买</p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="btn-ghost text-sm"
              >
                去商城 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mockProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
