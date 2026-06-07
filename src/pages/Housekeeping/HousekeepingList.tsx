import { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Clock,
  MapPin,
  User,
  Star,
  Check,
  Calendar,
  Tag,
  Users,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { housekeepingApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HousekeepingOrder {
  id: string;
  orderNumber: string;
  cleaningType: string;
  duration: string;
  scheduleTime: string;
  address: string;
  skillTags: string[];
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  staffId?: string;
  staffName?: string;
  review?: {
    rating: number;
    comment: string;
  };
  createdAt: string;
}

interface Staff {
  id: string;
  name: string;
  avatar: string;
  skills: string[];
  rating: number;
  matchScore: number;
}

const cleaningTypes = [
  { value: 'regular', label: '日常保洁' },
  { value: 'deep', label: '深度清洁' },
  { value: 'move', label: '开荒保洁' },
  { value: 'window', label: '擦玻璃' },
  { value: 'kitchen', label: '厨房清洁' },
  { value: 'bathroom', label: '卫生间清洁' },
];

const skillOptions = [
  { value: 'experienced', label: '经验丰富' },
  { value: 'efficient', label: '高效快捷' },
  { value: 'careful', label: '细致认真' },
  { value: 'friendly', label: '态度友好' },
  { value: 'professional', label: '专业工具' },
];

const staffCandidates: Staff[] = [
  { id: '1', name: '张阿姨', avatar: '👩', skills: ['experienced', 'careful'], rating: 4.9, matchScore: 95 },
  { id: '2', name: '李阿姨', avatar: '👩‍🦰', skills: ['efficient', 'professional'], rating: 4.8, matchScore: 88 },
  { id: '3', name: '王叔叔', avatar: '👨', skills: ['friendly', 'efficient'], rating: 4.7, matchScore: 82 },
];

export default function HousekeepingList() {
  const [orders, setOrders] = useState<HousekeepingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<HousekeepingOrder | null>(null);
  const [newOrder, setNewOrder] = useState({
    cleaningType: 'regular',
    duration: '2',
    scheduleDate: '',
    scheduleTime: '',
    address: '',
    skillTags: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await housekeepingApi.getAll();
      if (result.success && result.data) {
        setOrders(result.data as HousekeepingOrder[]);
      } else {
        setOrders([
          {
            id: '1',
            orderNumber: 'HK20240115001',
            cleaningType: '日常保洁',
            duration: '2小时',
            scheduleTime: '2024-01-16 09:00',
            address: 'A栋101室',
            skillTags: ['experienced', 'careful'],
            status: 'completed',
            staffName: '张阿姨',
            review: { rating: 5, comment: '打扫得非常干净，很满意！' },
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            orderNumber: 'HK20240115002',
            cleaningType: '深度清洁',
            duration: '4小时',
            scheduleTime: '2024-01-17 14:00',
            address: 'B栋203室',
            skillTags: ['professional', 'efficient'],
            status: 'assigned',
            staffName: '李阿姨',
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            orderNumber: 'HK20240115003',
            cleaningType: '擦玻璃',
            duration: '3小时',
            scheduleTime: '2024-01-18 10:00',
            address: 'C栋305室',
            skillTags: ['experienced'],
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!newOrder.address.trim()) errors.address = '请输入服务地址';
    if (!newOrder.scheduleDate) errors.scheduleDate = '请选择服务日期';
    if (!newOrder.scheduleTime) errors.scheduleTime = '请选择服务时间';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    try {
      const result = await housekeepingApi.create({
        ...newOrder,
        scheduleTime: `${newOrder.scheduleDate} ${newOrder.scheduleTime}`,
      });
      if (result.success) {
        setShowCreateModal(false);
        setNewOrder({
          cleaningType: 'regular',
          duration: '2',
          scheduleDate: '',
          scheduleTime: '',
          address: '',
          skillTags: [],
        });
        setFormErrors({});
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setShowCreateModal(false);
      loadOrders();
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!selectedOrder) return;
    try {
      const result = await housekeepingApi.assignStaff(selectedOrder.id, staffId);
      if (result.success) {
        const staff = staffCandidates.find((s) => s.id === staffId);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id
              ? { ...o, status: 'assigned', staffName: staff?.name }
              : o
          )
        );
        setShowAssignModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Failed to assign staff:', error);
      setShowAssignModal(false);
    }
  };

  const toggleSkillTag = (tag: string) => {
    setNewOrder((prev) => ({
      ...prev,
      skillTags: prev.skillTags.includes(tag)
        ? prev.skillTags.filter((t) => t !== tag)
        : [...prev.skillTags, tag],
    }));
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'orderNumber',
      title: '订单号',
      render: (item: HousekeepingOrder) => (
        <span className="font-medium text-sky-600">{item.orderNumber}</span>
      ),
    },
    {
      key: 'cleaningType',
      title: '服务类型',
      render: (item: HousekeepingOrder) => (
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-slate-700">{item.cleaningType}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      title: '时长',
      render: (item: HousekeepingOrder) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{item.duration}</span>
        </div>
      ),
    },
    {
      key: 'address',
      title: '地址',
      render: (item: HousekeepingOrder) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 text-sm">{item.address}</span>
        </div>
      ),
    },
    {
      key: 'staff',
      title: '服务人员',
      render: (item: HousekeepingOrder) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-700">{item.staffName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (item: HousekeepingOrder) => (
        <StatusBadge
          status={
            (item.status === 'completed'
              ? 'completed'
              : item.status === 'pending'
              ? 'pending'
              : 'processing') as 'pending' | 'processing' | 'completed'
          }
          text={
            item.status === 'pending'
              ? '待分配'
              : item.status === 'assigned'
              ? '已分配'
              : item.status === 'in_progress'
              ? '进行中'
              : item.status === 'completed'
              ? '已完成'
              : '已取消'
          }
        />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (item: HousekeepingOrder) => (
        <div className="flex items-center gap-2">
          {item.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(item);
                setShowAssignModal(true);
              }}
              className="p-1.5 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
              title="分配人员"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
          {item.status === 'completed' && !item.review && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(item);
                setShowReviewModal(true);
              }}
              className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
              title="评价"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">家政服务</h1>
          <p className="text-slate-500 text-sm mt-1">管理家政服务订单</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建订单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号或地址..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待分配</option>
            <option value="assigned">已分配</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <DataTable columns={columns} data={filteredOrders} loading={loading} />
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormErrors({});
        }}
        title="创建家政订单"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                服务类型
              </label>
              <select
                value={newOrder.cleaningType}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, cleaningType: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {cleaningTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                服务时长 (小时)
              </label>
              <input
                type="number"
                value={newOrder.duration}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, duration: e.target.value })
                }
                min="1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                服务日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newOrder.scheduleDate}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, scheduleDate: e.target.value })
                }
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.scheduleDate
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.scheduleDate && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.scheduleDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                服务时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={newOrder.scheduleTime}
                onChange={(e) =>
                  setNewOrder({ ...newOrder, scheduleTime: e.target.value })
                }
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                  formErrors.scheduleTime
                    ? 'border-red-300'
                    : 'border-slate-200 bg-slate-50'
                )}
              />
              {formErrors.scheduleTime && (
                <p className="mt-1 text-xs text-red-500">
                  {formErrors.scheduleTime}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              服务地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newOrder.address}
              onChange={(e) =>
                setNewOrder({ ...newOrder, address: e.target.value })
              }
              placeholder="请输入服务地址"
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                formErrors.address ? 'border-red-300' : 'border-slate-200 bg-slate-50'
              )}
            />
            {formErrors.address && (
              <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              技能标签
            </label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill.value}
                  onClick={() => toggleSkillTag(skill.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    newOrder.skillTags.includes(skill.value)
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {skill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setFormErrors({});
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateOrder}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              创建订单
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedOrder(null);
        }}
        title="匹配服务人员"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            根据订单需求，为您推荐以下服务人员
          </p>
          {staffCandidates.map((staff) => (
            <div
              key={staff.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer"
              onClick={() => handleAssignStaff(staff.id)}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{staff.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {staff.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-slate-600">
                        {staff.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {staff.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-sky-100 text-sky-600 text-xs rounded-full"
                      >
                        {skillOptions.find((o) => o.value === s)?.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    {staff.matchScore}%
                  </div>
                  <p className="text-xs text-slate-500">匹配度</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedOrder(null);
        }}
        title="服务评价"
        size="sm"
      >
        <div className="space-y-5">
          {selectedOrder?.review && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-8 h-8',
                      star <= selectedOrder.review!.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    )}
                  />
                ))}
              </div>
              <p className="text-slate-700">{selectedOrder.review.comment}</p>
            </div>
          )}
          <button
            onClick={() => {
              setShowReviewModal(false);
              setSelectedOrder(null);
            }}
            className="w-full px-4 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </Modal>
    </div>
  );
}
