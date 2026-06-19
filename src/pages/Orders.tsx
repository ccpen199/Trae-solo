import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  User,
  Phone,
  Clock,
  Package,
  Navigation,
  Route,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Circle,
  ArrowRight,
  Download,
  Sparkles,
  Bike,
  RefreshCw,
  Zap,
  Star,
  Sun,
  CloudRain,
  Thermometer,
  Snowflake,
  ShieldCheck,
  ShieldAlert,
  Send,
  TrendingUp,
  UserCheck,
  Gift,
  FileCheck,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { FareBreakdown } from '@/components/common/FareBreakdown';
import { ETAPredictor } from '@/components/common/ETAPredictor';
import { cn } from '@/lib/utils';
import type { Order, TableColumn, TableAction } from '@/types';

const mockOrders: Order[] = [
  {
    id: '1',
    order_no: 'DD202406110001',
    customerName: '张先生',
    customerPhone: '138****1234',
    riderName: '李骑手',
    pickup_address: '朝阳区建国路88号SOHO现代城A座1层',
    delivery_address: '海淀区中关村大街1号清华科技园B栋1203',
    goods_type: '餐饮',
    goods_weight: 2.5,
    distance_km: 8.5,
    estimated_price: 28,
    status: 'delivering',
    created_at: '2024-06-11T09:30:00Z',
    assigned_at: '2024-06-11T09:32:00Z',
    picked_up_at: '2024-06-11T09:45:00Z',
    estimated_delivery_at: '2024-06-11T10:10:00Z',
    pickup_lat: 39.9042,
    pickup_lng: 116.4074,
    delivery_lat: 39.9842,
    delivery_lng: 116.3074,
  },
  {
    id: '2',
    order_no: 'DD202406110002',
    customerName: '王女士',
    customerPhone: '139****5678',
    riderName: '赵骑手',
    pickup_address: '东城区王府井大街138号新东安市场',
    delivery_address: '西城区金融街7号英蓝国际金融中心',
    goods_type: '文件',
    goods_weight: 0.5,
    distance_km: 5.2,
    estimated_price: 18,
    status: 'picked_up',
    created_at: '2024-06-11T09:45:00Z',
    assigned_at: '2024-06-11T09:47:00Z',
    picked_up_at: '2024-06-11T10:00:00Z',
    estimated_delivery_at: '2024-06-11T10:20:00Z',
    pickup_lat: 39.9142,
    pickup_lng: 116.4174,
    delivery_lat: 39.9242,
    delivery_lng: 116.3574,
  },
  {
    id: '3',
    order_no: 'DD202406110003',
    customerName: '刘先生',
    customerPhone: '137****9012',
    pickup_address: '丰台区方庄路2号方庄购物中心',
    delivery_address: '朝阳区三里屯路19号太古里北区',
    goods_type: '生鲜',
    goods_weight: 5.0,
    distance_km: 12.3,
    estimated_price: 42,
    status: 'pending',
    created_at: '2024-06-11T10:05:00Z',
    estimated_delivery_at: '2024-06-11T10:50:00Z',
    pickup_lat: 39.8642,
    pickup_lng: 116.4374,
    delivery_lat: 39.9342,
    delivery_lng: 116.4574,
  },
  {
    id: '4',
    order_no: 'DD202406110004',
    customerName: '陈女士',
    customerPhone: '136****3456',
    riderName: '孙骑手',
    pickup_address: '海淀区学院路15号北京科技大学',
    delivery_address: '朝阳区望京SOHO T3',
    goods_type: '数码',
    goods_weight: 1.2,
    distance_km: 15.8,
    estimated_price: 52,
    status: 'in_transit',
    created_at: '2024-06-11T09:15:00Z',
    assigned_at: '2024-06-11T09:18:00Z',
    picked_up_at: '2024-06-11T09:40:00Z',
    estimated_delivery_at: '2024-06-11T10:30:00Z',
    pickup_lat: 39.9942,
    pickup_lng: 116.3474,
    delivery_lat: 39.9992,
    delivery_lng: 116.4774,
  },
  {
    id: '5',
    order_no: 'DD202406110005',
    customerName: '周先生',
    customerPhone: '135****7890',
    pickup_address: '西城区西直门北大街甲43号',
    delivery_address: '东城区东直门南大街1号',
    goods_type: '医药',
    goods_weight: 0.3,
    distance_km: 6.5,
    estimated_price: 22,
    status: 'exception',
    exception_type: 'address_unclear',
    exception_reason: '收货地址门牌号模糊，无法定位',
    created_at: '2024-06-11T09:00:00Z',
    assigned_at: '2024-06-11T09:03:00Z',
    pickup_lat: 39.9442,
    pickup_lng: 116.3574,
    delivery_lat: 39.9442,
    delivery_lng: 116.4274,
  },
  {
    id: '6',
    order_no: 'DD202406110006',
    customerName: '吴女士',
    customerPhone: '134****2345',
    riderName: '郑骑手',
    pickup_address: '石景山区万达广场',
    delivery_address: '海淀区五道口华清嘉园',
    goods_type: '服装',
    goods_weight: 1.8,
    distance_km: 18.2,
    estimated_price: 62,
    status: 'delivered',
    created_at: '2024-06-11T08:30:00Z',
    assigned_at: '2024-06-11T08:33:00Z',
    picked_up_at: '2024-06-11T08:55:00Z',
    completed_at: '2024-06-11T09:45:00Z',
    pickup_lat: 39.9042,
    pickup_lng: 116.2274,
    delivery_lat: 39.9942,
    delivery_lng: 116.3374,
  },
  {
    id: '7',
    order_no: 'DD202406110007',
    customerName: '郑先生',
    customerPhone: '133****6789',
    riderName: '吴骑手',
    pickup_address: '通州区新华大街',
    delivery_address: '朝阳区CBD万达广场',
    goods_type: '餐饮',
    goods_weight: 3.2,
    distance_km: 22.5,
    estimated_price: 72,
    status: 'cancelled',
    created_at: '2024-06-11T08:00:00Z',
    assigned_at: '2024-06-11T08:02:00Z',
    cancelled_at: '2024-06-11T08:15:00Z',
    cancel_reason: '骑手车辆故障，无法继续配送',
    cancel_role: 'rider',
    cancel_role_name: '吴骑手(系统触发)',
    fuse_triggered: true,
    fuse_reason: '地址超范围(22.5km>20km) + 骑手异常，自动触发熔断转人工',
    manual_operator: '张调度(运营中心)',
    manual_note: '联系客户致歉，已重新派单(DD202406110007-R)',
    compensation_triggered: true,
    compensation_type: 'voucher',
    compensation_amount: 15,
    compensation_voucher_code: 'CP20240611-SORRY',
    compensation_status: 'issued',
    waybill_exported: true,
    waybill_no: 'WB202406110007',
    waybill_invoice: '已开具(票号:FP202406118876)',
    pickup_lat: 39.9042,
    pickup_lng: 116.6574,
    delivery_lat: 39.9042,
    delivery_lng: 116.4674,
  },
  {
    id: 'cancel-2',
    order_no: 'DD202406110017',
    customerName: '何女士',
    customerPhone: '136****2341',
    pickup_address: '海淀区中关村大街SOHO',
    delivery_address: '海淀区学院路15号',
    goods_type: '生鲜',
    goods_weight: 2.5,
    distance_km: 4.8,
    estimated_price: 28,
    status: 'cancelled',
    created_at: '2024-06-11T09:30:00Z',
    cancelled_at: '2024-06-11T09:42:00Z',
    cancel_reason: '客户临时取消，无需配送',
    cancel_role: 'customer',
    cancel_role_name: '何女士(主动发起)',
    fuse_triggered: false,
    compensation_triggered: false,
    compensation_status: 'not_applicable',
    waybill_exported: false,
    waybill_invoice: '未开具',
    pickup_lat: 39.9842,
    pickup_lng: 116.3174,
    delivery_lat: 39.9942,
    delivery_lng: 116.3474,
  },
  {
    id: 'cancel-3',
    order_no: 'DD202406110027',
    customerName: '冯先生',
    customerPhone: '137****9988',
    riderName: '王骑手',
    pickup_address: '朝阳区大望路合生汇',
    delivery_address: '朝阳区望京SOHO',
    goods_type: '医药',
    goods_weight: 0.5,
    distance_km: 12.3,
    estimated_price: 45,
    status: 'cancelled',
    created_at: '2024-06-11T11:20:00Z',
    assigned_at: '2024-06-11T11:22:00Z',
    picked_up_at: '2024-06-11T11:35:00Z',
    cancelled_at: '2024-06-11T11:58:00Z',
    cancel_reason: '客户地址模糊，多次联系无果',
    cancel_role: 'system',
    cancel_role_name: '风控系统(自动触发)',
    fuse_triggered: true,
    fuse_reason: '地址解析失败率>60% + 3次未接通电话，触发熔断保护',
    manual_operator: '李主管(客服)',
    manual_note: '短信告知客户取件点，货品已返回药房，原订单已关闭',
    compensation_triggered: true,
    compensation_type: 'refund',
    compensation_amount: 45,
    compensation_status: 'refunded',
    waybill_exported: true,
    waybill_no: 'WB202406110027',
    waybill_invoice: '已红冲(原票FP202406119123)',
    pickup_lat: 39.9062,
    pickup_lng: 116.4685,
    delivery_lat: 40.0012,
    delivery_lng: 116.4774,
  },
  {
    id: '8',
    order_no: 'DD202406110008',
    customerName: '孙女士',
    customerPhone: '132****0123',
    riderName: '钱骑手',
    pickup_address: '昌平区回龙观',
    delivery_address: '海淀区上地信息路',
    goods_type: '文件',
    goods_weight: 0.8,
    distance_km: 10.5,
    estimated_price: 32,
    status: 'assigned',
    created_at: '2024-06-11T10:00:00Z',
    assigned_at: '2024-06-11T10:02:00Z',
    estimated_delivery_at: '2024-06-11T10:40:00Z',
    pickup_lat: 40.0742,
    pickup_lng: 116.3374,
    delivery_lat: 40.0342,
    delivery_lng: 116.3074,
  },
  {
    id: '9',
    order_no: 'DD202406110009',
    customerName: '李先生',
    customerPhone: '131****4567',
    pickup_address: '朝阳区建国路89号华贸中心3号楼',
    delivery_address: '朝阳区建国路93号万达广场8号楼',
    goods_type: '餐饮',
    goods_weight: 1.8,
    distance_km: 1.2,
    estimated_price: 15,
    status: 'pending',
    created_at: '2024-06-11T10:30:00Z',
    estimated_delivery_at: '2024-06-11T10:55:00Z',
    pickup_lat: 39.9085,
    pickup_lng: 116.4612,
    delivery_lat: 39.9098,
    delivery_lng: 116.4658,
  },
  {
    id: '10',
    order_no: 'DD202406110010',
    customerName: '王女士',
    customerPhone: '135****8901',
    pickup_address: '朝阳区建国路88号SOHO现代城B座',
    delivery_address: '朝阳区光华路9号世贸天阶',
    goods_type: '生鲜',
    goods_weight: 3.5,
    distance_km: 2.1,
    estimated_price: 22,
    status: 'pending',
    created_at: '2024-06-11T10:32:00Z',
    estimated_delivery_at: '2024-06-11T11:00:00Z',
    pickup_lat: 39.9078,
    pickup_lng: 116.4598,
    delivery_lat: 39.9142,
    delivery_lng: 116.4542,
  },
  {
    id: '11',
    order_no: 'DD202406110011',
    customerName: '张先生',
    customerPhone: '139****2345',
    pickup_address: '朝阳区建国路81号华贸中心写字楼1座',
    delivery_address: '朝阳区建国门外大街1号国贸商城',
    goods_type: '文件',
    goods_weight: 0.5,
    distance_km: 2.8,
    estimated_price: 18,
    status: 'pending',
    created_at: '2024-06-11T10:35:00Z',
    estimated_delivery_at: '2024-06-11T11:05:00Z',
    pickup_lat: 39.9092,
    pickup_lng: 116.4625,
    delivery_lat: 39.9085,
    delivery_lng: 116.4582,
  },
  {
    id: '12',
    order_no: 'DD202406110012',
    customerName: '刘女士',
    customerPhone: '136****6789',
    pickup_address: '朝阳区大望路1号温特莱中心',
    delivery_address: '朝阳区建国路88号SOHO现代城A座',
    goods_type: '数码',
    goods_weight: 1.2,
    distance_km: 1.8,
    estimated_price: 20,
    status: 'pending',
    created_at: '2024-06-11T10:38:00Z',
    estimated_delivery_at: '2024-06-11T10:58:00Z',
    pickup_lat: 39.9125,
    pickup_lng: 116.4678,
    delivery_lat: 39.9072,
    delivery_lng: 116.4595,
  },
  {
    id: '13',
    order_no: 'DD202406110013',
    customerName: '陈先生',
    customerPhone: '137****0123',
    pickup_address: '朝阳区建国路93号万达广场12号楼',
    delivery_address: '朝阳区光华路2号阳光100国际公寓',
    goods_type: '医药',
    goods_weight: 0.3,
    distance_km: 2.5,
    estimated_price: 19,
    status: 'pending',
    created_at: '2024-06-11T10:40:00Z',
    estimated_delivery_at: '2024-06-11T11:02:00Z',
    pickup_lat: 39.9105,
    pickup_lng: 116.4642,
    delivery_lat: 39.9158,
    delivery_lng: 116.4685,
  },
  {
    id: '14',
    order_no: 'DD202406110014',
    customerName: '赵女士',
    customerPhone: '134****3456',
    pickup_address: '海淀区中关村大街27号中关村大厦',
    delivery_address: '海淀区苏州街18号长远天地大厦',
    goods_type: '餐饮',
    goods_weight: 2.0,
    distance_km: 3.2,
    estimated_price: 25,
    status: 'pending',
    created_at: '2024-06-11T10:25:00Z',
    estimated_delivery_at: '2024-06-11T11:00:00Z',
    pickup_lat: 39.9842,
    pickup_lng: 116.3174,
    delivery_lat: 39.9825,
    delivery_lng: 116.3058,
  },
  {
    id: '15',
    order_no: 'DD202406110015',
    customerName: '孙先生',
    customerPhone: '133****7890',
    pickup_address: '海淀区中关村大街19号新中关购物中心',
    delivery_address: '海淀区海淀大街38号银科大厦',
    goods_type: '文件',
    goods_weight: 0.6,
    distance_km: 2.8,
    estimated_price: 22,
    status: 'pending',
    created_at: '2024-06-11T10:28:00Z',
    estimated_delivery_at: '2024-06-11T10:55:00Z',
    pickup_lat: 39.9828,
    pickup_lng: 116.3152,
    delivery_lat: 39.9805,
    delivery_lng: 116.3085,
  },
];

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'assigned', label: '已分配' },
  { key: 'picked_up', label: '已取件' },
  { key: 'in_transit', label: '运输中' },
  { key: 'delivering', label: '配送中' },
  { key: 'delivered', label: '已送达' },
  { key: 'completed', label: '已完成' },
  { key: 'exception', label: '异常' },
  { key: 'cancelled', label: '已取消' },
];

const clusterOrders = [
  {
    id: 'c1',
    orders: ['DD202406110003', 'DD202406110008'],
    distance: 2.1,
    rider: '王骑手',
    eta: 38,
    route: [
      { name: '丰台区方庄路2号', type: 'pickup', time: '10:15' },
      { name: '朝阳区三里屯路19号', type: 'delivery', time: '10:35' },
      { name: '昌平区回龙观', type: 'pickup', time: '10:50' },
      { name: '海淀区上地信息路', type: 'delivery', time: '11:10' },
    ],
  },
];

interface DispatchRiderCandidate {
  id: string;
  name: string;
  creditScore: number;
  currentOrders: number;
  maxCapacity: number;
  distanceToCenter: number;
  onTimeRate: number;
  isRecommended: boolean;
}

type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'snow';
type GoodsType = '餐饮' | '生鲜' | '医药' | '数码' | '文件' | '服装';

interface DispatchPricingBasis {
  timeSlot: {
    label: string;
    multiplier: number;
    description: string;
  };
  weather: {
    type: WeatherType;
    label: string;
    multiplier: number;
  };
  goodsFees: Array<{
    type: GoodsType;
    count: number;
    fee: number;
    reason: string;
  }>;
  distanceFee: {
    ratePerKm: number;
    distance: number;
    total: number;
  };
  basePrice: number;
}

interface DispatchDecision {
  recommendedRiderName: string;
  recommendedRiderCredit: number;
  recommendedRiderDistance: number;
  canCarry: boolean;
  dispatchTime: string;
  savedTimeMinutes: number;
  savedCostYuan: number;
}

interface DispatchGroup {
  id: string;
  name: string;
  orderIds: string[];
  totalDistance: number;
  totalTime: number;
  savedTime: number;
  savedCost: number;
  savedPercentage: number;
  totalFare: number;
  area: string;
  route: Array<{
    label: string;
    name: string;
    type: 'pickup' | 'delivery';
    time: string;
    distanceFromPrev: number;
    cumulativeTime: number;
  }>;
  optimizationNote: string;
  riders: DispatchRiderCandidate[];
  pricingBasis: DispatchPricingBasis;
  decision: DispatchDecision;
}

const dispatchGroups: DispatchGroup[] = [
  {
    id: 'group-a',
    name: 'A组 · 朝阳CBD片区',
    orderIds: ['9', '10', '11'],
    totalDistance: 5.2,
    totalTime: 35,
    savedTime: 18,
    savedCost: 12,
    savedPercentage: 22,
    totalFare: 55,
    area: '朝阳区CBD 3公里内',
    route: [
      { label: 'P1', name: '朝阳区建国路89号华贸中心', type: 'pickup', time: '10:45', distanceFromPrev: 0, cumulativeTime: 0 },
      { label: 'P2', name: '朝阳区建国路88号SOHO现代城', type: 'pickup', time: '10:50', distanceFromPrev: 0.5, cumulativeTime: 5 },
      { label: 'P3', name: '朝阳区建国路81号华贸中心1座', type: 'pickup', time: '10:55', distanceFromPrev: 0.8, cumulativeTime: 10 },
      { label: 'D1', name: '朝阳区建国路93号万达广场', type: 'delivery', time: '11:00', distanceFromPrev: 1.2, cumulativeTime: 15 },
      { label: 'D2', name: '朝阳区光华路9号世贸天阶', type: 'delivery', time: '11:10', distanceFromPrev: 1.5, cumulativeTime: 25 },
      { label: 'D3', name: '朝阳区建国门外大街1号国贸商城', type: 'delivery', time: '11:20', distanceFromPrev: 1.2, cumulativeTime: 35 },
    ],
    optimizationNote: '基于Haversine距离最近邻算法，路径减少回头率35%',
    riders: [
      {
        id: 'r-001',
        name: '李建国',
        creditScore: 98,
        currentOrders: 2,
        maxCapacity: 5,
        distanceToCenter: 0.8,
        onTimeRate: 98.5,
        isRecommended: true,
      },
      {
        id: 'r-002',
        name: '王志强',
        creditScore: 95,
        currentOrders: 0,
        maxCapacity: 5,
        distanceToCenter: 1.2,
        onTimeRate: 96.2,
        isRecommended: false,
      },
      {
        id: 'r-003',
        name: '张伟明',
        creditScore: 91,
        currentOrders: 3,
        maxCapacity: 5,
        distanceToCenter: 2.1,
        onTimeRate: 92.1,
        isRecommended: false,
      },
    ],
    pricingBasis: {
      timeSlot: {
        label: '午高峰(11:00-13:00)',
        multiplier: 1.2,
        description: '+20%',
      },
      weather: {
        type: 'sunny',
        label: '晴',
        multiplier: 1.0,
      },
      goodsFees: [
        { type: '餐饮', count: 1, fee: 0, reason: '普通保温配送' },
        { type: '生鲜', count: 1, fee: 3, reason: '冷链需求' },
        { type: '文件', count: 1, fee: 0, reason: '标准配送' },
      ],
      distanceFee: {
        ratePerKm: 2.5,
        distance: 5.2,
        total: 13,
      },
      basePrice: 8,
    },
    decision: {
      recommendedRiderName: '李建国',
      recommendedRiderCredit: 98.5,
      recommendedRiderDistance: 0.8,
      canCarry: true,
      dispatchTime: '立即',
      savedTimeMinutes: 18,
      savedCostYuan: 12,
    },
  },
  {
    id: 'group-b',
    name: 'B组 · 海淀中关村片区',
    orderIds: ['14', '15'],
    totalDistance: 4.8,
    totalTime: 28,
    savedTime: 12,
    savedCost: 8,
    savedPercentage: 18,
    totalFare: 47,
    area: '海淀区中关村 3公里内',
    route: [
      { label: 'P1', name: '海淀区中关村大街27号中关村大厦', type: 'pickup', time: '10:50', distanceFromPrev: 0, cumulativeTime: 0 },
      { label: 'P2', name: '海淀区中关村大街19号新中关购物中心', type: 'pickup', time: '10:55', distanceFromPrev: 0.6, cumulativeTime: 5 },
      { label: 'D1', name: '海淀区苏州街18号长远天地大厦', type: 'delivery', time: '11:08', distanceFromPrev: 2.0, cumulativeTime: 18 },
      { label: 'D2', name: '海淀区海淀大街38号银科大厦', type: 'delivery', time: '11:18', distanceFromPrev: 2.2, cumulativeTime: 28 },
    ],
    optimizationNote: '基于Haversine距离最近邻算法，路径减少回头率35%',
    riders: [
      {
        id: 'r-004',
        name: '赵海涛',
        creditScore: 97,
        currentOrders: 1,
        maxCapacity: 5,
        distanceToCenter: 0.6,
        onTimeRate: 97.8,
        isRecommended: true,
      },
      {
        id: 'r-005',
        name: '孙晓峰',
        creditScore: 94,
        currentOrders: 2,
        maxCapacity: 5,
        distanceToCenter: 1.5,
        onTimeRate: 95.4,
        isRecommended: false,
      },
      {
        id: 'r-006',
        name: '周磊',
        creditScore: 90,
        currentOrders: 0,
        maxCapacity: 5,
        distanceToCenter: 2.5,
        onTimeRate: 91.8,
        isRecommended: false,
      },
    ],
    pricingBasis: {
      timeSlot: {
        label: '午高峰(11:00-13:00)',
        multiplier: 1.2,
        description: '+20%',
      },
      weather: {
        type: 'rain',
        label: '小雨',
        multiplier: 1.15,
      },
      goodsFees: [
        { type: '餐饮', count: 1, fee: 0, reason: '普通保温配送' },
        { type: '文件', count: 1, fee: 0, reason: '标准配送' },
      ],
      distanceFee: {
        ratePerKm: 2.5,
        distance: 4.8,
        total: 12,
      },
      basePrice: 8,
    },
    decision: {
      recommendedRiderName: '赵海涛',
      recommendedRiderCredit: 97.8,
      recommendedRiderDistance: 0.6,
      canCarry: true,
      dispatchTime: '立即',
      savedTimeMinutes: 12,
      savedCostYuan: 8,
    },
  },
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'dispatch-group-a': true,
    'dispatch-group-b': true,
  });
  const [detailTab, setDetailTab] = useState<'timeline' | 'fare'>('timeline');

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          order.order_no.toLowerCase().includes(kw) ||
          (order.customerName && order.customerName.toLowerCase().includes(kw)) ||
          order.delivery_address.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [statusFilter, keyword]);

  const columns: TableColumn<Order>[] = [
    {
      key: 'order_no',
      title: '订单号',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-mono-code text-sm text-amber-accent-400">{row.order_no}</span>
          <span className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      title: '客户信息',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-200">{row.customerName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">{row.customerPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'goods',
      title: '物品信息',
      render: (_, row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-sm text-gray-200">{row.goods_type}</span>
          </div>
          <span className="text-xs text-gray-500 mt-0.5">{row.goods_weight}kg · {row.distance_km}km</span>
        </div>
      ),
    },
    {
      key: 'address',
      title: '配送地址',
      render: (_, row) => (
        <div className="flex flex-col gap-1 max-w-xs">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-warning-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-400 line-clamp-1">{row.pickup_address}</span>
          </div>
          <div className="flex items-center gap-1 ml-5">
            <ArrowRight className="w-3 h-3 text-gray-600" />
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-success-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-300 line-clamp-1">{row.delivery_address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'rider',
      title: '骑手',
      render: (_, row) => row.riderName ? (
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-space-blue-600 flex items-center justify-center">
            <Bike className="w-3.5 h-3.5 text-amber-accent-400" />
          </div>
          <span className="text-sm text-gray-200">{row.riderName}</span>
        </div>
      ) : (
        <span className="text-xs text-warning-400">待派单</span>
      ),
    },
    {
      key: 'price',
      title: '运费',
      sortable: true,
      render: (_, row) => (
        <span className="text-sm font-semibold text-amber-accent-400 font-mono-code">¥{row.estimated_price}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_, row) => (
        <StatusBadge status={row.status} pulse={['pending', 'assigned'].includes(row.status)} />
      ),
    },
  ];

  const actions: TableAction<Order>[] = [
    {
      key: 'view',
      label: '查看详情',
      onClick: (row) => {
        setSelectedOrder(row);
        setDetailOpen(true);
      },
    },
    {
      key: 'dispatch',
      label: '派单',
      onClick: () => setDispatchOpen(true),
    },
  ];

  const getTimeline = (order: Order) => {
    const events = [];
    if (order.created_at) {
      events.push({
        status: '订单创建',
        time: order.created_at,
        icon: Circle,
        color: 'text-gray-400',
        completed: true,
      });
    }
    if (order.assigned_at) {
      events.push({
        status: '骑手已接单',
        time: order.assigned_at,
        icon: Bike,
        color: 'text-info-400',
        completed: true,
      });
    }
    if (order.picked_up_at) {
      events.push({
        status: '已取件',
        time: order.picked_up_at,
        icon: Package,
        color: 'text-warning-400',
        completed: true,
      });
    }
    if (['delivering', 'in_transit'].includes(order.status)) {
      events.push({
        status: '配送中',
        time: new Date().toISOString(),
        icon: Navigation,
        color: 'text-info-400',
        completed: false,
        active: true,
      });
    }
    if (order.completed_at) {
      events.push({
        status: '已送达',
        time: order.completed_at,
        icon: CheckCircle2,
        color: 'text-success-400',
        completed: true,
      });
    }
    if (order.status === 'exception') {
      events.push({
        status: '异常处理中',
        time: new Date().toISOString(),
        icon: AlertTriangle,
        color: 'text-danger-400',
        completed: false,
        active: true,
      });
    }
    if (order.status === 'cancelled') {
      const cancelTime = (order as any).cancelled_at || order.created_at;
      // 1. 取消事件（含原因和触发角色）
      events.push({
        status: `已取消 · ${(order as any).cancel_reason || '未填写原因'}`,
        subStatus: `触发：${(order as any).cancel_role_name || '未知'}`,
        time: cancelTime,
        icon: XCircle,
        color: 'text-danger-400',
        completed: true,
      });
      // 2. 熔断判断
      if ((order as any).fuse_triggered) {
        events.push({
          status: `熔断触发 · ${(order as any).fuse_reason || '自动转人工'}`,
          subStatus: '风控系统规则',
          time: new Date(new Date(cancelTime).getTime() + 10000).toISOString(),
          icon: ShieldAlert,
          color: 'text-warning-400',
          completed: true,
        });
      }
      // 3. 人工介入
      if ((order as any).manual_operator) {
        events.push({
          status: `人工介入 · ${(order as any).manual_operator}`,
          subStatus: (order as any).manual_note || '',
          time: new Date(new Date(cancelTime).getTime() + 60000).toISOString(),
          icon: UserCheck,
          color: 'text-info-400',
          completed: true,
        });
      }
      // 4. 赔付处理
      if ((order as any).compensation_triggered) {
        const comp = order as any;
        const compLabel = comp.compensation_type === 'voucher'
          ? `发放补偿券 ¥${comp.compensation_amount} (${comp.compensation_voucher_code || ''})`
          : comp.compensation_type === 'refund'
          ? `原路退款 ¥${comp.compensation_amount}`
          : `赔付 ¥${comp.compensation_amount}`;
        events.push({
          status: `赔付完成 · ${compLabel}`,
          subStatus: comp.compensation_status === 'issued' ? '券已发放/用户未使用' : comp.compensation_status === 'refunded' ? '退款已到账' : '',
          time: new Date(new Date(cancelTime).getTime() + 180000).toISOString(),
          icon: Gift,
          color: 'text-success-400',
          completed: true,
        });
      }
      // 5. 运单留痕
      if ((order as any).waybill_exported || (order as any).waybill_no) {
        events.push({
          status: `税务留痕 · 运单${(order as any).waybill_no || '已归档'}`,
          subStatus: (order as any).waybill_invoice || '',
          time: new Date(new Date(cancelTime).getTime() + 300000).toISOString(),
          icon: FileCheck,
          color: 'text-gray-300',
          completed: true,
        });
      }
    }
    return events;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">订单管理</h1>
          <p className="text-sm text-gray-400 mt-1">查看、筛选和处理所有配送订单</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDispatchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            智能调度
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索订单号、客户姓名、地址..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50 transition-colors cursor-pointer"
            >
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="week">近7天</option>
              <option value="month">近30天</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm transition-colors',
              showFilters
                ? 'bg-amber-accent-500/20 border-amber-accent-500/50 text-amber-accent-400'
                : 'bg-space-blue-700 border-space-blue-500 text-gray-300 hover:bg-space-blue-600'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-space-blue-600 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    statusFilter === item.key
                      ? 'bg-amber-accent-500 text-space-blue-900'
                      : 'bg-space-blue-700 text-gray-400 hover:bg-space-blue-600 hover:text-gray-200'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.slice(0, 6).map((item) => {
          const count = item.key === 'all'
            ? mockOrders.length
            : mockOrders.filter((o) => o.status === item.key).length;
          return (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                statusFilter === item.key
                  ? 'bg-amber-accent-500/15 border-amber-accent-500/40 text-amber-accent-400'
                  : 'bg-space-blue-800 border-space-blue-600 text-gray-400 hover:bg-space-blue-700 hover:text-gray-200'
              )}
            >
              {item.label}
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                statusFilter === item.key
                  ? 'bg-amber-accent-500/30'
                  : 'bg-space-blue-600'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {statusFilter === 'pending' && dispatchGroups.length > 0 && (
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-accent-500/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-accent-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">智能聚合调度建议</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                AI 识别到 {dispatchGroups.length} 组可聚合订单，优化后可显著提升配送效率
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dispatchGroups.map((group) => {
              const isExpanded = expandedGroups[group.id];
              const groupOrders = mockOrders.filter((o) => group.orderIds.includes(o.id));
              return (
                <div
                  key={group.id}
                  className="bg-space-blue-900/50 border border-space-blue-600 rounded-xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-accent-500/20 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-accent-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-100">{group.name}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-success-500/15 text-success-400 rounded-full">
                        {group.orderIds.length}单可聚合
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-accent-400" />
                      {group.area}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-space-blue-700/50 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-amber-accent-400 font-mono-code">{group.totalDistance}</div>
                        <div className="text-[10px] text-gray-500">总里程(km)</div>
                      </div>
                      <div className="bg-space-blue-700/50 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-info-400 font-mono-code">{group.totalTime}</div>
                        <div className="text-[10px] text-gray-500">总耗时(分)</div>
                      </div>
                      <div className="bg-space-blue-700/50 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-success-400 font-mono-code">-{group.savedTime}</div>
                        <div className="text-[10px] text-gray-500">节省时间</div>
                      </div>
                      <div className="bg-space-blue-700/50 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-warning-400 font-mono-code">-¥{group.savedCost}</div>
                        <div className="text-[10px] text-gray-500">节省费用</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="text-success-400 font-medium">省 {group.savedPercentage}%</span>
                        <span>比单独派送</span>
                      </div>
                      <button
                        onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-accent-400 transition-colors"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-3.5 h-3.5" />收起详情</>
                        ) : (
                          <><ChevronDown className="w-3.5 h-3.5" />展开详情</>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-space-blue-600 p-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          组内订单
                        </h4>
                        <div className="space-y-2">
                          {groupOrders.map((order, idx) => (
                            <div
                              key={order.id}
                              className="flex items-center gap-3 p-2 bg-space-blue-700/30 rounded-lg hover:bg-space-blue-700/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDetailOpen(true);
                              }}
                            >
                              <span className="text-xs px-1.5 py-0.5 bg-amber-accent-500/20 text-amber-accent-400 rounded font-mono-code">
                                第{idx + 1}单
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-200 font-mono-code truncate">{order.order_no}</div>
                                <div className="text-xs text-gray-500 truncate">{order.goods_type} · {order.distance_km}km</div>
                              </div>
                              <span className="text-sm text-amber-accent-400 font-semibold font-mono-code">¥{order.estimated_price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" />
                          路径规划
                        </h4>
                        <div className="relative h-[180px] bg-space-blue-900 rounded-lg overflow-hidden">
                          <svg className="absolute inset-0 w-full h-full">
                            <defs>
                              <pattern id={`grid-${group.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#grid-${group.id})`} />
                          </svg>

                          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="xMidYMid meet">
                            {group.route.map((point, idx) => {
                              if (idx === 0) return null;
                              const prevPoint = group.route[idx - 1];
                              const x1 = 50 + (idx - 1) * (500 / (group.route.length - 1));
                              const y1 = point.type === 'pickup' ? 50 + (idx % 3) * 20 : 120 - (idx % 3) * 15;
                              const x2 = 50 + idx * (500 / (group.route.length - 1));
                              const y2 = point.type === 'pickup' ? 50 + ((idx + 1) % 3) * 20 : 120 - ((idx + 1) % 3) * 15;
                              const midX = (x1 + x2) / 2;
                              const midY = (y1 + y2) / 2 - 10;
                              return (
                                <g key={`line-${idx}`}>
                                  <path
                                    d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                                    fill="none"
                                    stroke={point.type === 'pickup' ? '#F59E0B' : '#10B981'}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray="6 3"
                                    opacity="0.8"
                                  />
                                  <text
                                    x={(x1 + x2) / 2}
                                    y={(y1 + y2) / 2 - 15}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="10"
                                    fontFamily="monospace"
                                  >
                                    {point.distanceFromPrev}km · {point.cumulativeTime - prevPoint.cumulativeTime}分
                                  </text>
                                </g>
                              );
                            })}

                            {group.route.map((point, idx) => {
                              const x = 50 + idx * (500 / (group.route.length - 1));
                              const y = point.type === 'pickup' ? 50 + ((idx + 1) % 3) * 20 : 120 - ((idx + 1) % 3) * 15;
                              return (
                                <g key={`point-${idx}`}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="12"
                                    fill={point.type === 'pickup' ? '#F59E0B' : '#10B981'}
                                    stroke={point.type === 'pickup' ? '#FCD34D' : '#6EE7B7'}
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={x}
                                    y={y + 1}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#fff"
                                    fontSize="9"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                  >
                                    {point.label}
                                  </text>
                                  <text
                                    x={x}
                                    y={y + 25}
                                    textAnchor="middle"
                                    fill="#64748b"
                                    fontSize="9"
                                  >
                                    {point.time}
                                  </text>
                                  <text
                                    x={x}
                                    y={y - 18}
                                    textAnchor="middle"
                                    fill={point.type === 'pickup' ? '#F59E0B' : '#10B981'}
                                    fontSize="9"
                                    fontWeight="500"
                                  >
                                    {point.cumulativeTime}分
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[10px]">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-warning-500" />
                              <span className="text-gray-400">取件点</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-success-500" />
                              <span className="text-gray-400">送件点</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <h5 className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-info-400" />
                            路径顺序详情
                          </h5>
                          <div className="space-y-1.5">
                            {group.route.map((point, idx) => {
                              if (idx === 0) return null;
                              const prevPoint = group.route[idx - 1];
                              const segmentTime = point.cumulativeTime - prevPoint.cumulativeTime;
                              return (
                                <div
                                  key={`seg-${idx}`}
                                  className="flex items-center gap-2 text-[11px] bg-space-blue-700/30 rounded px-2.5 py-1.5"
                                >
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded font-mono-code font-bold text-white',
                                    prevPoint.type === 'pickup' ? 'bg-warning-500' : 'bg-success-500'
                                  )}>
                                    {prevPoint.label}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded font-mono-code font-bold text-white',
                                    point.type === 'pickup' ? 'bg-warning-500' : 'bg-success-500'
                                  )}>
                                    {point.label}
                                  </span>
                                  <span className="text-gray-400 font-mono-code ml-auto">
                                    {point.distanceFromPrev}km · {segmentTime}分
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-2 bg-info-500/10 border border-info-500/30 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-info-400 flex-shrink-0" />
                            <span className="text-[11px] text-info-400">{group.optimizationNote}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />
                          候选骑手
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {group.riders.map((rider) => (
                            <div
                              key={rider.id}
                              className={cn(
                                'relative rounded-lg p-3 transition-all border-2',
                                rider.isRecommended
                                  ? 'bg-amber-accent-500/10 border-amber-accent-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]'
                                  : 'bg-space-blue-700/30 border-transparent hover:border-space-blue-500'
                              )}
                            >
                              {rider.isRecommended && (
                                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-accent-500 text-space-blue-900 rounded text-[9px] font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  推荐
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                  'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                                  rider.isRecommended
                                    ? 'bg-amber-accent-500/20 ring-2 ring-amber-accent-500/40'
                                    : 'bg-space-blue-600'
                                )}>
                                  <User className={cn(
                                    'w-5 h-5',
                                    rider.isRecommended ? 'text-amber-accent-400' : 'text-gray-400'
                                  )} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-100 truncate">{rider.name}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="w-3 h-3 text-success-400 fill-success-400" />
                                    <span className="text-[11px] font-semibold text-success-400 font-mono-code">
                                      {rider.creditScore}
                                    </span>
                                    <span className="text-[10px] text-gray-500">/100</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">承载状态</span>
                                  <span className="text-gray-300">
                                    当前{rider.currentOrders}单 · 可再加{rider.maxCapacity - rider.currentOrders}单
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">距聚合中心</span>
                                  <span className="text-amber-accent-400 font-mono-code">{rider.distanceToCenter}km</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">历史准时率</span>
                                  <span className="text-info-400 font-mono-code">{rider.onTimeRate}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          定价依据
                        </h4>
                        <div className="bg-space-blue-700/30 rounded-lg p-3 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-warning-400" />
                              <span className="text-gray-400">时段</span>
                              <span className="text-gray-200">{group.pricingBasis.timeSlot.label}</span>
                            </div>
                            <span className={cn(
                              'font-mono-code',
                              group.pricingBasis.timeSlot.multiplier > 1
                                ? 'text-warning-400'
                                : 'text-gray-500'
                            )}>
                              {group.pricingBasis.timeSlot.multiplier > 1
                                ? group.pricingBasis.timeSlot.description
                                : '0%'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              {group.pricingBasis.weather.type === 'sunny' ? (
                                <Sun className="w-3 h-3 text-warning-400" />
                              ) : group.pricingBasis.weather.type === 'rain' ? (
                                <CloudRain className="w-3 h-3 text-info-400" />
                              ) : group.pricingBasis.weather.type === 'snow' ? (
                                <Snowflake className="w-3 h-3 text-info-300" />
                              ) : (
                                <CloudRain className="w-3 h-3 text-gray-400" />
                              )}
                              <span className="text-gray-400">天气</span>
                              <span className="text-gray-200">{group.pricingBasis.weather.label}</span>
                            </div>
                            <span className={cn(
                              'font-mono-code',
                              group.pricingBasis.weather.multiplier > 1
                                ? 'text-warning-400'
                                : 'text-gray-500'
                            )}>
                              {group.pricingBasis.weather.multiplier > 1
                                ? `+${Math.round((group.pricingBasis.weather.multiplier - 1) * 100)}%`
                                : '0%'}
                            </span>
                          </div>

                          <div className="border-t border-space-blue-500/50 pt-2">
                            <div className="flex items-center gap-1.5 text-[11px] mb-1.5">
                              <Package className="w-3 h-3 text-info-400" />
                              <span className="text-gray-400">货品类型</span>
                            </div>
                            <div className="space-y-1">
                              {group.pricingBasis.goodsFees.map((goods, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] pl-4">
                                  <div className="flex items-center gap-1.5">
                                    {goods.type === '生鲜' && <Snowflake className="w-2.5 h-2.5 text-info-400" />}
                                    {goods.type === '医药' && <Thermometer className="w-2.5 h-2.5 text-danger-400" />}
                                    {goods.type === '数码' && <ShieldCheck className="w-2.5 h-2.5 text-warning-400" />}
                                    <span className="text-gray-200">{goods.type}</span>
                                    {goods.count > 1 && (
                                      <span className="text-gray-500">×{goods.count}</span>
                                    )}
                                    <span className="text-gray-500">({goods.reason})</span>
                                  </div>
                                  <span className={cn(
                                    'font-mono-code',
                                    goods.fee > 0 ? 'text-warning-400' : 'text-gray-500'
                                  )}>
                                    {goods.fee > 0 ? `+¥${goods.fee}` : '¥0'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-success-400" />
                              <span className="text-gray-400">里程费</span>
                              <span className="text-gray-500">
                                ¥{group.pricingBasis.distanceFee.ratePerKm}/km × {group.pricingBasis.distanceFee.distance}km
                              </span>
                            </div>
                            <span className="text-gray-200 font-mono-code">
                              ¥{group.pricingBasis.distanceFee.total}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Circle className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-400">基础价</span>
                            </div>
                            <span className="text-gray-200 font-mono-code">¥{group.pricingBasis.basePrice}</span>
                          </div>

                          <div className="border-t border-space-blue-500 pt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-300 font-medium">合计金额</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] text-gray-500 line-through font-mono-code">
                                ¥{group.totalFare + group.savedCost}
                              </span>
                              <span className="text-base font-bold text-amber-accent-400 font-mono-code">
                                ¥{group.totalFare}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-amber-accent-500/10 via-amber-accent-500/5 to-transparent border border-amber-accent-500/30 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-amber-accent-400 mb-2.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          调度决策结论
                        </h4>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">推荐骑手：</span>
                            <span className="text-gray-100 font-medium">{group.decision.recommendedRiderName}</span>
                            <span className="text-gray-500">
                              （信用{group.decision.recommendedRiderCredit} · 距离{group.decision.recommendedRiderDistance}km · {group.decision.canCarry ? '可承载' : '已满载'}）
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Send className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">建议派单时间：</span>
                            <span className="text-success-400 font-medium">{group.decision.dispatchTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400">预计节省：</span>
                            <span className="text-success-400 font-mono-code font-semibold">
                              {group.decision.savedTimeMinutes}分钟 · ¥{group.decision.savedCostYuan}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-space-blue-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-400">合并运费</span>
                          <span className="text-amber-accent-400 font-bold font-mono-code">¥{group.totalFare}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">原总价</span>
                          <span className="text-gray-500 line-through font-mono-code">
                            ¥{group.totalFare + group.savedCost}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-space-blue-600 p-3">
                    <button
                      onClick={() => setDispatchOpen(true)}
                      className="w-full py-2.5 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Bike className="w-4 h-4" />
                      一键派单
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredOrders}
        actions={actions}
        pagination={{ page: 1, pageSize: 10, total: filteredOrders.length }}
        onRowClick={(row) => {
          setSelectedOrder(row);
          setDetailOpen(true);
        }}
        emptyText="暂无订单数据"
      />

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="订单详情"
        drawer
        width="w-[520px]"
        drawerPosition="right"
        footer={
          selectedOrder && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDetailOpen(false)}
                className="px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors"
              >
                关闭
              </button>
              {selectedOrder.status === 'pending' && (
                <button className="px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
                  立即派单
                </button>
              )}
              {selectedOrder.status === 'exception' && (
                <button className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg text-sm font-medium transition-colors">
                  处理异常
                </button>
              )}
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-100 font-mono-code">{selectedOrder.order_no}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  创建于 {new Date(selectedOrder.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
              <StatusBadge status={selectedOrder.status} pulse={['pending', 'delivering'].includes(selectedOrder.status)} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">物品类型</div>
                <div className="text-sm text-gray-200">{selectedOrder.goods_type}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">重量</div>
                <div className="text-sm text-gray-200">{selectedOrder.goods_weight} kg</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">距离</div>
                <div className="text-sm text-gray-200">{selectedOrder.distance_km} km</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">预估运费</div>
                <div className="text-sm text-amber-accent-400 font-semibold">¥{selectedOrder.estimated_price}</div>
              </div>
            </div>

            {selectedOrder.exception_reason && (
              <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-danger-400" />
                  <span className="text-sm font-medium text-danger-400">异常原因</span>
                </div>
                <p className="text-sm text-gray-300">{selectedOrder.exception_reason}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-accent-400" />
                配送轨迹
              </h3>
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-0.5">取件地址</div>
                      <div className="text-sm text-gray-200">{selectedOrder.pickup_address}</div>
                    </div>
                  </div>
                  <div className="h-6 ml-2 border-l-2 border-dashed border-space-blue-500" />
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-success-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-0.5">收件地址</div>
                      <div className="text-sm text-gray-200">{selectedOrder.delivery_address}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder.riderName && (
              <div>
                <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-info-400" />
                  骑手信息
                </h3>
                <div className="bg-space-blue-700/50 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-space-blue-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-accent-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">{selectedOrder.riderName}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        138****8888
                      </span>
                      <span className="text-xs text-success-400">准时率 98.5%</span>
                    </div>
                  </div>
                  <button className="p-2 bg-space-blue-600 hover:bg-space-blue-500 rounded-lg transition-colors">
                    <Phone className="w-4 h-4 text-amber-accent-400" />
                  </button>
                </div>
              </div>
            )}

            {selectedOrder.status === 'pending' && selectedOrder.estimated_delivery_at && (
              <ETAPredictor
                estimatedMinutes={Math.round(
                  (new Date(selectedOrder.estimated_delivery_at).getTime() - new Date(selectedOrder.created_at).getTime()) / 60000
                )}
                historicalAverageMinutes={Math.round(
                  (new Date(selectedOrder.estimated_delivery_at).getTime() - new Date(selectedOrder.created_at).getTime()) / 60000
                ) - (selectedOrder.id === '10' ? 8 : selectedOrder.id === '13' ? 6 : 2)}
                deliveryTime={new Date(selectedOrder.estimated_delivery_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                showHistory
              />
            )}

            {selectedOrder.status === 'cancelled' && (
              <div className="space-y-4">
                {/* 取消原因卡 */}
                <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-danger-500/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-danger-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-danger-400">订单已取消</span>
                        <StatusBadge variant="danger" size="sm" showDot={false}>
                          {(() => {
                            const role = (selectedOrder as any).cancel_role;
                            return role === 'rider' ? '骑手发起' : role === 'customer' ? '客户发起' : role === 'merchant' ? '商家发起' : '系统自动';
                          })()}
                        </StatusBadge>
                        <span className="text-xs text-gray-500">
                          {(selectedOrder as any).cancel_role_name || ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200">{(selectedOrder as any).cancel_reason || '无取消原因'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        取消时间：{new Date((selectedOrder as any).cancelled_at || selectedOrder.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 熔断与人工介入 */}
                {((selectedOrder as any).fuse_triggered || (selectedOrder as any).manual_operator) && (
                  <div className="rounded-lg border border-warning-500/30 bg-warning-500/5 p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-warning-400" />
                      熔断与人工处理
                    </h4>
                    <div className="space-y-2.5">
                      {(selectedOrder as any).fuse_triggered && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-warning-400">已触发熔断保护</div>
                            <div className="text-xs text-gray-400 mt-0.5">{(selectedOrder as any).fuse_reason || '风控系统规则命中'}</div>
                          </div>
                        </div>
                      )}
                      {(selectedOrder as any).manual_operator && (
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-info-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-info-400">人工介入：{(selectedOrder as any).manual_operator}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{(selectedOrder as any).manual_note || '无备注'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 赔付处理 */}
                {(selectedOrder as any).compensation_triggered && (
                  <div className="rounded-lg border border-success-500/30 bg-success-500/5 p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-success-400" />
                      赔付处理结果
                    </h4>
                    {(() => {
                      const comp = selectedOrder as any;
                      const isVoucher = comp.compensation_type === 'voucher';
                      const isRefund = comp.compensation_type === 'refund';
                      return (
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center',
                              isVoucher ? 'bg-amber-accent-500/20' : 'bg-success-500/20'
                            )}>
                              {isVoucher
                                ? <span className="text-xl font-bold text-amber-accent-400">¥</span>
                                : <span className="text-xl font-bold text-success-400">↩</span>}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-100">
                                {isVoucher ? `补偿券 ¥${comp.compensation_amount}` : isRefund ? `原路退款 ¥${comp.compensation_amount}` : `赔付 ¥${comp.compensation_amount}`}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {comp.compensation_status === 'issued' ? `券码：${comp.compensation_voucher_code} · 已发放/未使用` :
                                 comp.compensation_status === 'refunded' ? '款项已原路退回支付账户' :
                                 comp.compensation_status === 'pending' ? '处理中' : '已完成'}
                              </div>
                            </div>
                          </div>
                          <StatusBadge variant={comp.compensation_status === 'pending' ? 'warning' : 'success'} size="sm" showDot={false}>
                            {comp.compensation_status === 'issued' ? '已发放' :
                             comp.compensation_status === 'refunded' ? '已到账' :
                             comp.compensation_status === 'pending' ? '处理中' : '已完成'}
                          </StatusBadge>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 税务运单留痕 */}
                {(((selectedOrder as any).waybill_exported || (selectedOrder as any).waybill_no) && (
                  <div className="rounded-lg border border-space-blue-600 bg-space-blue-800/30 p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-amber-accent-400" />
                      税务运单留痕
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-md bg-space-blue-900/50 px-3 py-2">
                        <div className="text-gray-500">运单编号</div>
                        <div className="mt-0.5 font-mono-code text-gray-200">{(selectedOrder as any).waybill_no || '-'}</div>
                      </div>
                      <div className="rounded-md bg-space-blue-900/50 px-3 py-2">
                        <div className="text-gray-500">发票状态</div>
                        <div className="mt-0.5 text-gray-200">{(selectedOrder as any).waybill_invoice || '-'}</div>
                      </div>
                      <div className="sm:col-span-2 rounded-md bg-space-blue-900/50 px-3 py-2">
                        <div className="text-gray-500">合规留痕</div>
                        <div className="mt-0.5 text-gray-400">
                          订单取消记录已同步至税务中台，运单数据按《电子运单管理规范》归档留存期限 5 年
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1 mb-3 border-b border-space-blue-600">
                <button
                  onClick={() => setDetailTab('timeline')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    detailTab === 'timeline'
                      ? 'text-amber-accent-400 border-amber-accent-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    时间线
                  </span>
                </button>
                <button
                  onClick={() => setDetailTab('fare')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    detailTab === 'fare'
                      ? 'text-amber-accent-400 border-amber-accent-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    运费明细
                  </span>
                </button>
              </div>

              {detailTab === 'timeline' && (
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-space-blue-600" />
                  <div className="space-y-4">
                    {getTimeline(selectedOrder).map((event, idx) => {
                      const Icon = event.icon;
                      return (
                        <div key={idx} className="flex items-start gap-3 relative">
                          <div className={cn(
                            'w-4 h-4 rounded-full flex items-center justify-center z-10',
                            event.active
                              ? 'bg-info-500 animate-pulse'
                              : event.completed
                              ? 'bg-space-blue-700 border-2'
                              : 'bg-space-blue-600'
                          )}>
                            <Icon className={cn('w-2.5 h-2.5', event.color)} />
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                'text-sm',
                                event.active ? 'text-info-400 font-medium' : 'text-gray-200'
                              )}>
                                {event.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(event.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {(event as any).subStatus && (
                              <p className="mt-0.5 text-xs text-gray-500">{(event as any).subStatus}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailTab === 'fare' && (
                <FareBreakdown
                  basePrice={8}
                  distancePrice={Math.max(0, Math.round((selectedOrder.distance_km || 0) * 2.5))}
                  peakSurcharge={Math.round(selectedOrder.estimated_price * 0.2)}
                  weatherMultiplier={selectedOrder.id === '10' ? 1.15 : 1}
                  goodsSurcharge={selectedOrder.goods_type === '生鲜' ? 3 : selectedOrder.goods_type === '医药' ? 2 : 0}
                  totalAmount={selectedOrder.estimated_price}
                  compact={false}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        title="智能聚合调度"
        width="max-w-4xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDispatchOpen(false)}
              className="px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors"
            >
              关闭
            </button>
            <button className="px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              确认派单
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3 bg-info-500/10 border border-info-500/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-info-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-info-400 font-medium">AI 智能路径规划已就绪</p>
              <p className="text-xs text-gray-400 mt-0.5">
                检测到 3 公里内 2 个可聚合订单，优化后可节省约 15% 配送时间和 20% 里程
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-amber-accent-400" />
                路径规划可视化
              </h3>
              <div className="relative h-[320px] bg-space-blue-900/50 rounded-lg overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="dispatchGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dispatchGrid)" />
                  </svg>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="dispatchPath" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 60 260 Q 120 180 180 200 T 320 140 Q 380 120 440 80 T 560 60"
                    fill="none"
                    stroke="url(#dispatchPath)"
                    strokeWidth="3"
                    strokeDasharray="0"
                    strokeLinecap="round"
                  />
                  <circle r="4" fill="#F59E0B">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 60 260 Q 120 180 180 200 T 320 140 Q 380 120 440 80 T 560 60" />
                  </circle>
                </svg>

                {[
                  { x: '10%', y: '80%', label: 'P1', type: 'pickup', name: '方庄路2号', time: '10:15' },
                  { x: '30%', y: '60%', label: 'D1', type: 'delivery', name: '三里屯路', time: '10:35' },
                  { x: '55%', y: '42%', label: 'P2', type: 'pickup', name: '回龙观', time: '10:50' },
                  { x: '85%', y: '18%', label: 'D2', type: 'delivery', name: '上地信息路', time: '11:10' },
                ].map((point, idx) => (
                  <div
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: point.x, top: point.y }}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-lg',
                        point.type === 'pickup'
                          ? 'bg-warning-500 border-warning-300 text-white'
                          : 'bg-success-500 border-success-300 text-white'
                      )}>
                        {point.label}
                      </div>
                      <div className="mt-1 bg-space-blue-700 border border-space-blue-500 rounded px-2 py-1 text-xs shadow-lg">
                        <div className="text-gray-100 whitespace-nowrap">{point.name}</div>
                        <div className="text-gray-500">{point.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-accent-400 font-mono-code">38</div>
                  <div className="text-xs text-gray-500">总耗时(分钟)</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-info-400 font-mono-code">12.5</div>
                  <div className="text-xs text-gray-500">总里程(km)</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-success-400 font-mono-code">¥74</div>
                  <div className="text-xs text-gray-500">合并运费</div>
                </div>
                <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-warning-400 font-mono-code">20%</div>
                  <div className="text-xs text-gray-500">节省比例</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-accent-400" />
                聚合订单
              </h3>

              {clusterOrders[0].orders.map((orderNo, idx) => (
                <div key={idx} className="bg-space-blue-700/50 border border-space-blue-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-code text-sm text-amber-accent-400">{orderNo}</span>
                    <span className="text-xs px-2 py-0.5 bg-info-500/15 text-info-400 rounded-full">
                      第{idx + 1}单
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-warning-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-400">
                        {clusterOrders[0].route[idx * 2].name}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-success-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        {clusterOrders[0].route[idx * 2 + 1].name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-space-blue-700/50 border border-space-blue-600 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">分配骑手</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-space-blue-600 flex items-center justify-center">
                    <Bike className="w-5 h-5 text-amber-accent-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">{clusterOrders[0].rider}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>距离 1.2km</span>
                      <span>·</span>
                      <span>信用分 96</span>
                    </div>
                  </div>
                  <RefreshCw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-amber-accent-400 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
