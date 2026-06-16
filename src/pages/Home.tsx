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
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PetCard from '@/components/PetCard';
import DoctorCard from '@/components/DoctorCard';
import HospitalCard from '@/components/HospitalCard';
import ProductCard from '@/components/ProductCard';
import PostCard from '@/components/PostCard';
import HealthCalendar from '@/components/HealthCalendar';
import type {
  Pet,
  Doctor,
  Hospital,
  Product,
  CommunityPost,
  HealthCalendarEvent,
} from '@shared/types';

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

const quickActions = [
  { icon: PawPrint, label: '宠物档案', path: '/pets', color: 'from-forest-400 to-forest-600' },
  { icon: MessageCircle, label: '在线问诊', path: '/consultations', color: 'from-blue-400 to-blue-600' },
  { icon: MapPin, label: '附近医院', path: '/hospitals', color: 'from-pink-400 to-pink-600' },
  { icon: ShoppingBag, label: '宠物商城', path: '/shop', color: 'from-warm-300 to-warm-500' },
  { icon: Users, label: '宠物社区', path: '/community', color: 'from-purple-400 to-purple-600' },
  { icon: Calendar, label: '健康日历', path: '/calendar', color: 'from-teal-400 to-teal-600' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
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
          <h1 className="font-display font-bold text-2xl sm:text-3xl mb-2">
            {greeting}，{user?.nickname || '铲屎官'}！
          </h1>
          <p className="text-forest-100 mb-6 max-w-md">
            今天也别忘了照顾你的毛孩子哦～ 你有 {mockEvents.filter((e) => !e.completed).length} 项待办健康事项
          </p>
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
                暂无匹配结果，可尝试搜索“医生”“医院”“商品”“驱虫药”或“购买”
              </div>
            )}
          </div>
        </section>
      )}

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
