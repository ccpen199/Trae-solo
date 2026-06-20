import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  Calendar, Phone, Package, Loader2, Eye
} from 'lucide-react';
import dayjs from 'dayjs';
import { Table, StatusBadge } from '@/components/ui';
import { get as apiGet } from '@/utils/api';
import type { Order, OrderStatus } from 'shared/types';
import { cn } from '@/lib/utils';

interface OrderListFilter {
  orderNo: string;
  senderPhone: string;
  startDate: string;
  endDate: string;
  status: OrderStatus | '';
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNo: 'ORD202401150001',
    sender: {
      name: '张三',
      phone: '13800138001',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      address: '建国路88号',
      fullAddress: '北京市朝阳区建国路88号'
    },
    receiver: {
      name: '李四',
      phone: '13900139001',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      address: '陆家嘴金融中心',
      fullAddress: '上海市浦东新区陆家嘴金融中心'
    },
    itemType: '电子产品',
    estimatedWeight: 2.5,
    appointmentTime: '2024-01-15T14:00:00Z',
    pickupCode: 'A1B2C3',
    status: 'created',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z'
  },
  {
    id: '2',
    orderNo: 'ORD202401150002',
    sender: {
      name: '王五',
      phone: '13800138002',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      address: '中关村大街1号',
      fullAddress: '北京市海淀区中关村大街1号'
    },
    receiver: {
      name: '赵六',
      phone: '13900139002',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      address: '科技园南区',
      fullAddress: '广东省深圳市南山区科技园南区'
    },
    itemType: '服装',
    estimatedWeight: 1.2,
    appointmentTime: '2024-01-15T15:30:00Z',
    pickupCode: 'D4E5F6',
    status: 'assigned',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    orderNo: 'ORD202401150003',
    sender: {
      name: '孙七',
      phone: '13800138003',
      province: '北京市',
      city: '北京市',
      district: '西城区',
      address: '金融街15号',
      fullAddress: '北京市西城区金融街15号'
    },
    receiver: {
      name: '周八',
      phone: '13900139003',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      address: '文三路',
      fullAddress: '浙江省杭州市西湖区文三路'
    },
    itemType: '文件',
    estimatedWeight: 0.5,
    appointmentTime: '2024-01-15T11:00:00Z',
    pickupCode: 'G7H8I9',
    status: 'picked',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T11:15:00Z'
  },
  {
    id: '4',
    orderNo: 'ORD202401150004',
    sender: {
      name: '吴九',
      phone: '13800138004',
      province: '北京市',
      city: '北京市',
      district: '东城区',
      address: '王府井大街100号',
      fullAddress: '北京市东城区王府井大街100号'
    },
    receiver: {
      name: '郑十',
      phone: '13900139004',
      province: '江苏省',
      city: '南京市',
      district: '鼓楼区',
      address: '中山路',
      fullAddress: '江苏省南京市鼓楼区中山路'
    },
    itemType: '食品',
    estimatedWeight: 3.8,
    appointmentTime: '2024-01-15T16:00:00Z',
    pickupCode: 'J0K1L2',
    status: 'completed',
    createdAt: '2024-01-15T07:30:00Z',
    updatedAt: '2024-01-15T16:30:00Z'
  },
  {
    id: '5',
    orderNo: 'ORD202401150005',
    sender: {
      name: '冯十一',
      phone: '13800138005',
      province: '北京市',
      city: '北京市',
      district: '丰台区',
      address: '丰台路5号',
      fullAddress: '北京市丰台区丰台路5号'
    },
    receiver: {
      name: '陈十二',
      phone: '13900139005',
      province: '四川省',
      city: '成都市',
      district: '高新区',
      address: '天府大道',
      fullAddress: '四川省成都市高新区天府大道'
    },
    itemType: '家居用品',
    estimatedWeight: 5.0,
    appointmentTime: '2024-01-15T17:00:00Z',
    pickupCode: 'M3N4O5',
    status: 'cancelled',
    createdAt: '2024-01-15T06:00:00Z',
    updatedAt: '2024-01-15T06:30:00Z'
  },
  {
    id: '6',
    orderNo: 'ORD202401150006',
    sender: {
      name: '褚十三',
      phone: '13800138006',
      province: '北京市',
      city: '北京市',
      district: '通州区',
      address: '新华大街',
      fullAddress: '北京市通州区新华大街'
    },
    receiver: {
      name: '卫十四',
      phone: '13900139006',
      province: '湖北省',
      city: '武汉市',
      district: '武昌区',
      address: '东湖路',
      fullAddress: '湖北省武汉市武昌区东湖路'
    },
    itemType: '书籍',
    estimatedWeight: 1.8,
    appointmentTime: '2024-01-15T13:00:00Z',
    pickupCode: 'P6Q7R8',
    status: 'printed',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  {
    id: '7',
    orderNo: 'ORD202401150007',
    sender: {
      name: '蒋十五',
      phone: '13800138007',
      province: '北京市',
      city: '北京市',
      district: '昌平区',
      address: '回龙观',
      fullAddress: '北京市昌平区回龙观'
    },
    receiver: {
      name: '沈十六',
      phone: '13900139007',
      province: '陕西省',
      city: '西安市',
      district: '雁塔区',
      address: '长安路',
      fullAddress: '陕西省西安市雁塔区长安路'
    },
    itemType: '化妆品',
    estimatedWeight: 0.8,
    appointmentTime: '2024-01-15T10:30:00Z',
    pickupCode: 'S9T0U1',
    status: 'shipped',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T14:00:00Z'
  },
  {
    id: '8',
    orderNo: 'ORD202401150008',
    sender: {
      name: '韩十七',
      phone: '13800138008',
      province: '北京市',
      city: '北京市',
      district: '石景山区',
      address: '古城大街',
      fullAddress: '北京市石景山区古城大街'
    },
    receiver: {
      name: '杨十八',
      phone: '13900139008',
      province: '湖南省',
      city: '长沙市',
      district: '岳麓区',
      address: '麓山南路',
      fullAddress: '湖南省长沙市岳麓区麓山南路'
    },
    itemType: '数码配件',
    estimatedWeight: 1.5,
    appointmentTime: '2024-01-15T14:30:00Z',
    pickupCode: 'V2W3X4',
    status: 'created',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'created', label: '已创建' },
  { value: 'assigned', label: '已分配' },
  { value: 'picked', label: '已揽收' },
  { value: 'printed', label: '已打印' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderListFilter>({
    orderNo: '',
    senderPhone: '',
    startDate: '',
    endDate: '',
    status: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.orderNo) params.append('orderNo', filter.orderNo);
      if (filter.senderPhone) params.append('senderPhone', filter.senderPhone);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.status) params.append('status', filter.status);
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));

      const data = await apiGet<any>(`/orders?${params.toString()}`);
      setOrders(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Fetch orders error:', error);
      let filtered = [...mockOrders];
      
      if (filter.orderNo) {
        filtered = filtered.filter(o => o.orderNo.toLowerCase().includes(filter.orderNo.toLowerCase()));
      }
      if (filter.senderPhone) {
        filtered = filtered.filter(o => o.sender.phone.includes(filter.senderPhone));
      }
      if (filter.status) {
        filtered = filtered.filter(o => o.status === filter.status);
      }
      if (filter.startDate) {
        filtered = filtered.filter(o => dayjs(o.createdAt).isAfter(filter.startDate));
      }
      if (filter.endDate) {
        filtered = filtered.filter(o => dayjs(o.createdAt).isBefore(filter.endDate));
      }
      
      setTotal(filtered.length);
      const start = (page - 1) * pageSize;
      setOrders(filtered.slice(start, start + pageSize));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filter.status]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleReset = () => {
    setFilter({
      orderNo: '',
      senderPhone: '',
      startDate: '',
      endDate: '',
      status: '',
    });
    setPage(1);
  };

  const handleRowClick = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns = [
    {
      key: 'orderNo',
      title: '订单号',
      render: (row: Order) => (
        <span className="font-medium text-blue-600">{row.orderNo}</span>
      ),
    },
    {
      key: 'sender',
      title: '寄件人',
      render: (row: Order) => (
        <div>
          <p className="font-medium text-gray-900">{row.sender.name}</p>
          <p className="text-sm text-gray-500">{row.sender.phone}</p>
        </div>
      ),
    },
    {
      key: 'receiver',
      title: '收件人',
      render: (row: Order) => (
        <div>
          <p className="font-medium text-gray-900">{row.receiver.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{row.receiver.fullAddress}</p>
        </div>
      ),
    },
    {
      key: 'itemType',
      title: '物品类型',
      render: (row: Order) => (
        <span className="text-gray-700">{row.itemType}</span>
      ),
    },
    {
      key: 'estimatedWeight',
      title: '预估重量',
      render: (row: Order) => (
        <span className="text-gray-700">{row.estimatedWeight}kg</span>
      ),
    },
    {
      key: 'appointmentTime',
      title: '预约时间',
      render: (row: Order) => (
        <span className="text-gray-500 text-sm">
          {dayjs(row.appointmentTime).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: Order) => (
        <StatusBadge status={row.status} type="order" />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${row.id}`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            查看
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">寄件订单管理</h1>
            <p className="text-gray-500 mt-1">查看和管理所有寄件订单</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-900">{total}</span> 条记录
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px] max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索订单号..."
                    value={filter.orderNo}
                    onChange={(e) => setFilter({ ...filter, orderNo: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
                    showFilter
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  搜索
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  重置
                </button>
              </div>
            </div>

            {showFilter && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1" />
                    寄件人电话
                  </label>
                  <input
                    type="text"
                    placeholder="请输入手机号"
                    value={filter.senderPhone}
                    onChange={(e) => setFilter({ ...filter, senderPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Package className="w-4 h-4 inline mr-1" />
                    订单状态
                  </label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value as OrderStatus | '' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={orders}
                rowKey="id"
                onRowClick={handleRowClick}
                emptyText="暂无订单数据"
              />

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，
                    共 {total} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={cn(
                              'w-10 h-10 text-sm rounded-lg transition-colors',
                              page === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
