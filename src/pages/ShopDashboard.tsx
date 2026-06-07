import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Printer,
  Bell,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flower2,
  Image as ImageIcon,
  User,
  XCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import { api } from '@/utils/api';
import type { Order, OrderItem } from '../../shared/types';

const SHOP_ID = 1;

interface PrintRecord {
  orderId: string;
  printedAt: string;
  success: boolean;
  printerName: string;
}

interface WastageRecord {
  orderId: string;
  productId: number;
  productName: string;
  quantity: number;
  reason: string;
  recordedAt: string;
  recordedBy: string;
}

interface ExceptionRecord {
  orderId: string;
  type: string;
  description: string;
  evidence: string;
  reportedAt: string;
  reportedBy: string;
}

interface ReviewRecord {
  orderId: string;
  action: string;
  remark: string;
  reviewedAt: string;
  reviewedBy: string;
}

const mockPrintRecords: Record<string, PrintRecord> = {
  'ORD202401001': { orderId: 'ORD202401001', printedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), success: true, printerName: '前台热敏打印机' },
  'ORD202401003': { orderId: 'ORD202401003', printedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), success: true, printerName: '前台热敏打印机' },
  'ORD202401004': { orderId: 'ORD202401004', printedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), success: true, printerName: '前台热敏打印机' },
};

const mockWastageRecords: Record<string, WastageRecord> = {
  'ORD202401003': { 
    orderId: 'ORD202401003', 
    productId: 7, 
    productName: '蓝色妖姬花束', 
    quantity: 2, 
    reason: '花材轻微破损，挑选时淘汰', 
    recordedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), 
    recordedBy: '李花艺师' 
  },
};

const mockExceptionRecords: Record<string, ExceptionRecord> = {
  'ORD202401004': { 
    orderId: 'ORD202401004', 
    type: 'damaged', 
    description: '配送途中外包装轻微挤压', 
    evidence: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 
    reportedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), 
    reportedBy: '王骑手' 
  },
};

const mockReviewRecords: Record<string, ReviewRecord[]> = {
  'ORD202401001': [
    { orderId: 'ORD202401001', action: '订单创建', remark: '用户下单完成', reviewedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401001', action: '自动打印', remark: '订单已自动打印到前台打印机', reviewedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), reviewedBy: '系统' },
  ],
  'ORD202401003': [
    { orderId: 'ORD202401003', action: '订单创建', remark: '用户下单完成', reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401003', action: '自动打印', remark: '订单已自动打印到前台打印机', reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401003', action: '开始备货', remark: '花艺师开始备货', reviewedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(), reviewedBy: '李花艺师' },
    { orderId: 'ORD202401003', action: '损耗登记', remark: '2支蓝色妖姬轻微破损，已登记损耗', reviewedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), reviewedBy: '李花艺师' },
  ],
  'ORD202401004': [
    { orderId: 'ORD202401004', action: '订单创建', remark: '用户下单完成', reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401004', action: '自动打印', remark: '订单已自动打印到前台打印机', reviewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401004', action: '开始备货', remark: '花艺师开始备货', reviewedAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString(), reviewedBy: '张花艺师' },
    { orderId: 'ORD202401004', action: '骑手取货', remark: '骑手已取货开始配送', reviewedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), reviewedBy: '赵骑手' },
    { orderId: 'ORD202401004', action: '异常上报', remark: '外包装轻微挤压，已上报异常并上传凭证', reviewedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), reviewedBy: '王骑手' },
  ],
  'ORD202401005': [
    { orderId: 'ORD202401005', action: '订单创建', remark: '用户下单完成', reviewedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401005', action: '自动打印', remark: '订单已自动打印到前台打印机', reviewedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), reviewedBy: '系统' },
    { orderId: 'ORD202401005', action: '开始备货', remark: '花艺师开始备货', reviewedAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(), reviewedBy: '李花艺师' },
    { orderId: 'ORD202401005', action: '骑手取货', remark: '骑手已取货开始配送', reviewedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), reviewedBy: '张骑手' },
    { orderId: 'ORD202401005', action: '确认送达', remark: '客户已签收，订单完成', reviewedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), reviewedBy: '钱七' },
  ],
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  paid: { label: '待接单', color: 'text-rose', bgColor: 'bg-rose-50', icon: Bell },
  accepted: { label: '已接单', color: 'text-sprout', bgColor: 'bg-sprout-50', icon: CheckCircle },
  preparing: { label: '备货中', color: 'text-warmgold', bgColor: 'bg-warmgold-50', icon: Package },
  picked: { label: '待骑手取货', color: 'text-warmgold', bgColor: 'bg-warmgold-50', icon: Truck },
  delivering: { label: '配送中', color: 'text-sprout', bgColor: 'bg-sprout-50', icon: Truck },
  completed: { label: '已完成', color: 'text-sprout', bgColor: 'bg-sprout-50', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: AlertCircle },
  refunded: { label: '已退款', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: RefreshCw },
};

const filterTabs = [
  { key: 'all', label: '全部', statuses: ['paid', 'accepted', 'preparing', 'picked', 'delivering', 'completed'] },
  { key: 'paid', label: '待接单', statuses: ['paid'] },
  { key: 'preparing', label: '备货中', statuses: ['preparing'] },
  { key: 'delivering', label: '配送中', statuses: ['picked', 'delivering'] },
  { key: 'completed', label: '已完成', statuses: ['completed'] },
];

const mockOrders: Order[] = [
  {
    id: 'ORD202401001',
    userId: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 599,
    status: 'paid',
    recipientName: '张三',
    recipientPhone: '13800138000',
    recipientAddress: '北京市朝阳区建国路88号SOHO现代城A座1201',
    recipientLat: 39.9042,
    recipientLng: 116.4074,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    items: [
      {
        id: 1,
        orderId: 'ORD202401001',
        productId: 1,
        productName: '浪漫红玫瑰束 99朵',
        productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&h=100&fit=crop',
        quantity: 1,
        price: 599,
      },
    ],
  },
  {
    id: 'ORD202401002',
    userId: 2,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 268,
    status: 'paid',
    recipientName: '李四',
    recipientPhone: '13900139000',
    recipientAddress: '北京市海淀区中关村大街1号清华科技园B座502',
    recipientLat: 39.9842,
    recipientLng: 116.3074,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    items: [
      {
        id: 2,
        orderId: 'ORD202401002',
        productId: 2,
        productName: '粉色康乃馨花束',
        productImage: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=100&h=100&fit=crop',
        quantity: 1,
        price: 268,
      },
    ],
  },
  {
    id: 'ORD202401003',
    userId: 3,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 468,
    status: 'preparing',
    recipientName: '王五',
    recipientPhone: '13700137000',
    recipientAddress: '北京市西城区金融街15号鑫茂大厦8层',
    recipientLat: 39.9142,
    recipientLng: 116.3574,
    deliveryType: 'next-day',
    expectedDeliveryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 3,
        orderId: 'ORD202401003',
        productId: 7,
        productName: '蓝色妖姬花束',
        productImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
        quantity: 1,
        price: 468,
      },
    ],
  },
  {
    id: 'ORD202401004',
    userId: 4,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 688,
    status: 'delivering',
    recipientName: '赵六',
    recipientPhone: '13600136000',
    recipientAddress: '北京市东城区王府井大街88号银泰中心C座',
    recipientLat: 39.9242,
    recipientLng: 116.4174,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 4,
        orderId: 'ORD202401004',
        productId: 8,
        productName: '婚礼手捧花',
        productImage: 'https://images.unsplash.com/photo-1522684462852-01b24e76b77d?w=100&h=100&fit=crop',
        quantity: 1,
        price: 688,
      },
    ],
  },
  {
    id: 'ORD202401005',
    userId: 5,
    shopId: 1,
    shopName: '繁花似锦花店',
    totalAmount: 599,
    status: 'completed',
    recipientName: '钱七',
    recipientPhone: '13500135000',
    recipientAddress: '北京市丰台区丽泽路18号',
    recipientLat: 39.8542,
    recipientLng: 116.3274,
    deliveryType: 'instant',
    expectedDeliveryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actualDeliveryTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: 5,
        orderId: 'ORD202401005',
        productId: 1,
        productName: '浪漫红玫瑰束 99朵',
        productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&h=100&fit=crop',
        quantity: 1,
        price: 599,
      },
    ],
  },
];

export default function ShopDashboard() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState<ExceptionRecord | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.orders.listByShop(SHOP_ID, { pageSize: 50 });
      if (response && response.items) {
        setOrders(response.items);
      } else {
        setOrders(mockOrders);
      }
    } catch (error) {
      console.log('Using mock orders:', error);
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toDateString();
  const stats = useMemo(() => {
    const todayOrders = orders.filter(
      (o) => {
        const orderDate = new Date(o.createdAt).toDateString();
        return orderDate === today;
      }
    );
    const pendingCount = todayOrders.filter((o) => o.status === 'paid').length;
    const preparingCount = todayOrders.filter((o) =>
      ['accepted', 'preparing'].includes(o.status)
    ).length;
    const deliveringCount = todayOrders.filter((o) =>
      ['picked', 'delivering'].includes(o.status)
    ).length;
    const completedCount = todayOrders.filter((o) => o.status === 'completed').length;
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      todayCount: todayOrders.length,
      pendingCount,
      preparingCount,
      deliveringCount,
      completedCount,
      todayRevenue,
    };
  }, [orders, today]);

  const filteredOrders = useMemo(() => {
    const filter = filterTabs.find((f) => f.key === activeFilter);
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );
    const ordersToFilter = activeFilter === 'all' ? todayOrders : orders;
    if (!filter) return ordersToFilter;
    return ordersToFilter
      .filter((o) => filter.statuses.includes(o.status))
      .sort((a, b) => {
        if (a.status === 'paid' && b.status !== 'paid') return -1;
        if (a.status !== 'paid' && b.status === 'paid') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, activeFilter, today]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.orders.updateStatus(orderId, 'accepted');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o))
      );
    } catch (error) {
      console.log('Failed to accept order, updating locally:', error);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o))
      );
    }
  };

  const handlePrintOrder = async (order: Order) => {
    setPrintingOrderId(order.id);
    const printContent = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 400px; margin: 0 auto;">
        <h2 style="text-align: center; color: #E11D48; margin-bottom: 20px;">花时达 - 订单打印</h2>
        <div style="border-bottom: 1px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
          <p style="margin: 5px 0;"><strong>订单号：</strong>${order.id}</p>
          <p style="margin: 5px 0;"><strong>下单时间：</strong>${formatDateTime(order.createdAt)}</p>
          <p style="margin: 5px 0;"><strong>配送类型：</strong>${order.deliveryType === 'instant' ? '立即送' : '预约送'}</p>
        </div>
        <div style="border-bottom: 1px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
          <p style="margin: 5px 0;"><strong>收货人：</strong>${order.recipientName}</p>
          <p style="margin: 5px 0;"><strong>电话：</strong>${order.recipientPhone}</p>
          <p style="margin: 5px 0;"><strong>地址：</strong>${order.recipientAddress}</p>
        </div>
        <div style="border-bottom: 1px dashed #ccc; padding-bottom: 15px; margin-bottom: 15px;">
          <h3 style="margin: 0 0 10px 0;">商品清单</h3>
          ${order.items?.map((item: OrderItem) => `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>${item.productName} x${item.quantity}</span>
              <span>¥${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align: right;">
          <p style="font-size: 18px; margin: 0;">
            <strong>合计：</strong><span style="color: #E11D48;">¥${order.totalAmount.toFixed(2)}</span>
          </p>
        </div>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    setTimeout(() => setPrintingOrderId(null), 1000);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (error) {
      console.log('Failed to update status, updating locally:', error);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    }
  };

  const getNextStatus = (currentStatus: string): { status: string; label: string } | null => {
    const flow: Record<string, { status: string; label: string }> = {
      accepted: { status: 'preparing', label: '开始备货' },
      preparing: { status: 'picked', label: '备货完成' },
      picked: { status: 'delivering', label: '骑手已取货' },
      delivering: { status: 'completed', label: '确认送达' },
    };
    return flow[currentStatus] || null;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getTimeDiff = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    return `${hours}小时前`;
  };

  const statCards = [
    { label: '今日订单', value: stats.todayCount, icon: Package, color: 'bg-rose text-white' },
    { label: '待接单', value: stats.pendingCount, icon: Bell, color: 'bg-warmgold text-white', badge: stats.pendingCount > 0 },
    { label: '配送中', value: stats.deliveringCount, icon: Truck, color: 'bg-sprout text-white' },
    { label: '已完成', value: stats.completedCount, icon: CheckCircle, color: 'bg-gray-700 text-white' },
    { label: '今日营收', value: `¥${stats.todayRevenue.toFixed(0)}`, icon: TrendingUp, color: 'bg-rose-600 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-r from-rose to-rose-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-card flex items-center justify-center">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold">繁花似锦花店</h1>
                <p className="text-sm text-white/80">花店工作台</p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-btn transition-colors text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {statCards.map((card, index) => (
              <div
                key={card.label}
                className={`${card.color} rounded-card p-4 relative overflow-hidden animate-stagger-${index + 1}`}
              >
                {card.badge && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-white text-rose text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {card.value}
                  </span>
                )}
                <card.icon className="h-6 w-6 mb-2 opacity-80" />
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-xs opacity-80">{card.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-gray-800">订单管理</h2>
          <div className="flex gap-2">
            <Link
              to="/shop/inventory"
              className="px-4 py-2 text-sm text-sprout bg-sprout-50 hover:bg-sprout-100 rounded-btn transition-colors"
            >
              库存管理
            </Link>
            <Link
              to="/shop/exception"
              className="px-4 py-2 text-sm text-rose bg-rose-50 hover:bg-rose-100 rounded-btn transition-colors"
            >
              异常上报
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex-1 min-w-max px-6 py-4 text-center font-medium transition-colors relative ${
                  activeFilter === tab.key ? 'text-rose' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.label}
                  {tab.key === 'paid' && stats.pendingCount > 0 && (
                    <span className="w-5 h-5 bg-rose text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {stats.pendingCount}
                    </span>
                  )}
                </span>
                {activeFilter === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-rose border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.paid;
              const StatusIcon = status.icon;
              const nextAction = getNextStatus(order.status);
              const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;
              const isExpanded = expandedOrderId === order.id;
              const printRecord = mockPrintRecords[order.id];
              const wastageRecord = mockWastageRecords[order.id];
              const exceptionRecord = mockExceptionRecords[order.id];
              const reviewRecords = mockReviewRecords[order.id] || [];

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden ${staggerClass} ${
                    order.status === 'paid' ? 'border-l-4 border-l-rose' : ''
                  }`}
                >
                  <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'paid' && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose" />
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-700">{order.id}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(order.createdAt)} · {getTimeDiff(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-btn flex items-center gap-1 ${status.bgColor} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-rose transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              详情
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {(printRecord || wastageRecord || exceptionRecord) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {printRecord && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${printRecord.success ? 'bg-sprout/10 text-sprout' : 'bg-rose/10 text-rose'}`}>
                            <Printer className="h-3 w-3" />
                            {printRecord.success ? '已自动打印' : '打印失败'} · {printRecord.printerName} · {formatTime(printRecord.printedAt)}
                          </span>
                        )}
                        {wastageRecord && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-warmgold/10 text-warmgold">
                            <Flower2 className="h-3 w-3" />
                            损耗登记 · {wastageRecord.productName} · {wastageRecord.quantity}支
                          </span>
                        )}
                        {exceptionRecord && (
                          <button
                            onClick={() => setShowEvidenceModal(exceptionRecord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-rose/10 text-rose hover:bg-rose/20 transition-colors"
                          >
                            <ImageIcon className="h-3 w-3" />
                            异常凭证 · 点击查看
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {order.items && order.items.length > 0 && (
                      <div className="flex gap-4 mb-4">
                        <img
                          src={order.items[0].productImage}
                          alt={order.items[0].productName}
                          className="w-16 h-16 object-cover rounded-btn flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate">
                            {order.items[0].productName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-rose font-semibold">¥{order.items[0].price.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">x{order.items[0].quantity}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-btn p-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{order.recipientName}</span>
                            <span className="text-sm text-gray-500">{order.recipientPhone}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-btn ${order.deliveryType === 'instant' ? 'bg-rose-100 text-rose' : 'bg-sprout-100 text-sprout'}`}>
                              {order.deliveryType === 'instant' ? '立即送' : '预约送'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{order.recipientAddress}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            预计送达：{formatDateTime(order.expectedDeliveryTime)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                      </div>
                    </div>

                    {isExpanded && reviewRecords.length > 0 && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-card border border-gray-100 animate-fade-in-up">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-rose" />
                          状态流转复核记录
                        </h4>
                        <div className="space-y-3">
                          {reviewRecords.map((record, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${idx === reviewRecords.length - 1 ? 'bg-rose' : 'bg-sprout'}`} />
                                {idx < reviewRecords.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-800">{record.action}</span>
                                  <span className="text-xs text-gray-400">{formatDateTime(record.reviewedAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{record.remark}</p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                  <User className="h-3 w-3" />
                                  {record.reviewedBy}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && wastageRecord && (
                      <div className="mb-4 p-4 bg-warmgold/5 rounded-card border border-warmgold/20 animate-fade-in-up">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Flower2 className="h-4 w-4 text-warmgold" />
                          花材损耗登记详情
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">商品名称</span>
                            <p className="font-medium text-gray-800">{wastageRecord.productName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">损耗数量</span>
                            <p className="font-medium text-warmgold">{wastageRecord.quantity} 支</p>
                          </div>
                          <div>
                            <span className="text-gray-500">损耗原因</span>
                            <p className="font-medium text-gray-800">{wastageRecord.reason}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">登记人</span>
                            <p className="font-medium text-gray-800">{wastageRecord.recordedBy}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isExpanded && printRecord && (
                      <div className="mb-4 p-4 bg-sprout/5 rounded-card border border-sprout/20 animate-fade-in-up">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Printer className="h-4 w-4 text-sprout" />
                          自动打印记录
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">打印状态</span>
                            <p className={`font-medium ${printRecord.success ? 'text-sprout' : 'text-rose'}`}>
                              {printRecord.success ? '打印成功' : '打印失败'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">打印机</span>
                            <p className="font-medium text-gray-800">{printRecord.printerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">打印时间</span>
                            <p className="font-medium text-gray-800">{formatDateTime(printRecord.printedAt)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">打印方式</span>
                            <p className="font-medium text-gray-800">系统自动触发</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        合计 <span className="text-rose">¥{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintOrder(order)}
                          disabled={printingOrderId === order.id}
                          className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-btn transition-colors disabled:opacity-50"
                        >
                          <Printer className="h-4 w-4" />
                          {printingOrderId === order.id ? '打印中...' : '补打'}
                        </button>
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="flex items-center gap-1 px-6 py-2 text-sm text-white bg-rose hover:bg-rose-600 rounded-btn transition-colors font-medium"
                          >
                            <CheckCircle className="h-4 w-4" />
                            一键接单
                          </button>
                        )}
                        {nextAction && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, nextAction.status)}
                            className="flex items-center gap-1 px-6 py-2 text-sm text-white bg-sprout hover:bg-sprout-600 rounded-btn transition-colors font-medium"
                          >
                            <Clock className="h-4 w-4" />
                            {nextAction.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-card shadow-sm border border-gray-100 animate-fade-in-up">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-semibold text-gray-600 mb-2">
              暂无订单
            </h3>
            <p className="text-gray-400">当前筛选条件下没有订单</p>
          </div>
        )}
      </main>

      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose" />
                异常凭证详情
              </h3>
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">异常类型</span>
                <p className="font-medium text-gray-800">
                  {showEvidenceModal.type === 'damaged' ? '商品损坏' : 
                   showEvidenceModal.type === 'timeout' ? '配送超时' : 
                   showEvidenceModal.type === 'rejected' ? '收件人拒收' : '其他异常'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">异常描述</span>
                <p className="font-medium text-gray-800">{showEvidenceModal.description}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">上报人</span>
                <p className="font-medium text-gray-800">{showEvidenceModal.reportedBy}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">上报时间</span>
                <p className="font-medium text-gray-800">{formatDateTime(showEvidenceModal.reportedAt)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">凭证照片</span>
                <div className="mt-2 p-4 bg-gray-50 rounded-card border border-gray-200">
                  <img
                    src={showEvidenceModal.evidence}
                    alt="异常凭证"
                    className="w-full h-48 object-cover rounded-btn"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEvidenceModal(null)}
              className="mt-6 w-full py-2.5 bg-rose text-white rounded-btn hover:bg-rose-600 transition-colors font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
