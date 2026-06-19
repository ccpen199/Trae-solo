import { useState, useMemo } from 'react';
import type { PracticeBase, CheckInRecord } from '../../types';
import { mockBases, mockCheckIns, mockStats } from '../../data/mockData';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Star,
  Briefcase,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  Image,
  Map,
  Camera,
  ChevronUp,
  CalendarRange,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'info';
}

interface BaseFormData {
  name: string;
  type: 'enterprise' | 'village' | 'community';
  address: string;
  contactPerson: string;
  contactPhone: string;
  positionCount: number;
  description: string;
}

interface PositionFormData {
  name: string;
  majorRequirement: string;
  headcount: number;
  subsidy: number;
  startDate: string;
  endDate: string;
}

interface Review {
  id: string;
  studentAlias: string;
  rating: number;
  content: string;
  timestamp: string;
}

const mockRatingDistribution = {
  5: 68,
  4: 22,
  3: 7,
  2: 2,
  1: 1,
};

const mockReviews: Review[] = [
  { id: '1', studentAlias: '小明', rating: 5, content: '基地环境很好，指导老师很负责，学到了很多东西', timestamp: '2024-06-15 14:30' },
  { id: '2', studentAlias: '小红', rating: 5, content: '实践内容丰富，收获满满，强烈推荐', timestamp: '2024-06-14 10:20' },
  { id: '3', studentAlias: '小华', rating: 4, content: '整体不错，希望能增加更多实操机会', timestamp: '2024-06-13 16:45' },
  { id: '4', studentAlias: '小李', rating: 5, content: '工作人员很热情，住宿条件也很好', timestamp: '2024-06-12 09:15' },
  { id: '5', studentAlias: '小王', rating: 4, content: '实习内容与专业匹配度高，很有价值', timestamp: '2024-06-11 11:30' },
  { id: '6', studentAlias: '小张', rating: 5, content: '学到了很多书本上学不到的知识', timestamp: '2024-06-10 15:20' },
  { id: '7', studentAlias: '小刘', rating: 3, content: '还行，部分环节可以再优化', timestamp: '2024-06-09 13:40' },
  { id: '8', studentAlias: '小陈', rating: 5, content: '非常棒的实践经历，受益匪浅', timestamp: '2024-06-08 10:00' },
  { id: '9', studentAlias: '小周', rating: 4, content: '指导老师专业水平高，耐心细致', timestamp: '2024-06-07 16:25' },
  { id: '10', studentAlias: '小吴', rating: 5, content: '机会难得，值得每一位同学参与', timestamp: '2024-06-06 09:50' },
];

const BaseManagement = () => {
  const [bases, setBases] = useState<PracticeBase[]>(mockBases);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedBaseId, setExpandedBaseId] = useState<string | null>(null);
  const [showAddBaseModal, setShowAddBaseModal] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [showCheckInDetailModal, setShowCheckInDetailModal] = useState(false);
  const [selectedBase, setSelectedBase] = useState<PracticeBase | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckInRecord | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [baseFormData, setBaseFormData] = useState<BaseFormData>({
    name: '',
    type: 'enterprise',
    address: '',
    contactPerson: '',
    contactPhone: '',
    positionCount: 0,
    description: '',
  });
  const [positionFormData, setPositionFormData] = useState<PositionFormData>({
    name: '',
    majorRequirement: '',
    headcount: 0,
    subsidy: 0,
    startDate: '',
    endDate: '',
  });

  const typeMap: Record<string, { label: string; color: string; icon: string }> = {
    enterprise: { label: '企业', color: 'bg-blue-100 text-blue-700', icon: '🏢' },
    village: { label: '乡村', color: 'bg-green-100 text-green-700', icon: '🌾' },
    community: { label: '社区', color: 'bg-orange-100 text-orange-700', icon: '🏘️' },
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const filteredBases = useMemo(() => {
    return bases.filter((base) => {
      const matchesSearch =
        base.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || base.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [bases, searchTerm, typeFilter]);

  const getBaseCheckIns = (baseName: string) => {
    return mockCheckIns.filter((checkIn) =>
      checkIn.location.includes(baseName.replace('实践基地', '').replace('有限公司', ''))
    );
  };

  const totalPositions = bases.reduce((sum, b) => sum + b.positionCount, 0);
  const avgSatisfaction =
    bases.reduce((sum, b) => sum + b.satisfaction, 0) / bases.length;

  const satisfactionTrendData = mockStats.baseSatisfaction.map((item) => ({
    name: item.name,
    满意度: item.score,
  }));

  const handleAddBase = () => {
    if (!baseFormData.name || !baseFormData.address || !baseFormData.contactPerson || !baseFormData.contactPhone) {
      showToast('请填写完整信息', 'info');
      return;
    }
    const newBase: PracticeBase = {
      id: String(Date.now()),
      ...baseFormData,
      satisfaction: 0,
      totalCheckIns: 0,
      totalTeams: 0,
      totalStudents: 0,
    };
    setBases((prev) => [...prev, newBase]);
    setShowAddBaseModal(false);
    setBaseFormData({
      name: '',
      type: 'enterprise',
      address: '',
      contactPerson: '',
      contactPhone: '',
      positionCount: 0,
      description: '',
    });
    showToast('基地添加成功');
  };

  const handleAddPosition = () => {
    if (!positionFormData.name || !positionFormData.majorRequirement || !positionFormData.headcount) {
      showToast('请填写完整信息', 'info');
      return;
    }
    if (selectedBase) {
      setBases((prev) =>
        prev.map((b) =>
          b.id === selectedBase.id
            ? { ...b, positionCount: b.positionCount + positionFormData.headcount }
            : b
        )
      );
    }
    setShowAddPositionModal(false);
    setPositionFormData({
      name: '',
      majorRequirement: '',
      headcount: 0,
      subsidy: 0,
      startDate: '',
      endDate: '',
    });
    showToast('岗位发布成功');
  };

  const handleOpenAddPosition = (base: PracticeBase) => {
    setSelectedBase(base);
    setShowAddPositionModal(true);
  };

  const handleOpenSatisfaction = (base: PracticeBase) => {
    setSelectedBase(base);
    setShowSatisfactionModal(true);
  };

  const handleToggleExpand = (baseId: string) => {
    setExpandedBaseId((prev) => (prev === baseId ? null : baseId));
  };

  const handleOpenCheckInDetail = (checkIn: CheckInRecord) => {
    setSelectedCheckIn(checkIn);
    setShowCheckInDetailModal(true);
  };

  const modalOverlayClass = "fixed inset-0 bg-black/50 flex items-center justify-center z-50";
  const modalContainerClass = "bg-white rounded-2xl shadow-xl w-full mx-4 overflow-hidden";

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {showAddBaseModal && (
        <div className={modalOverlayClass}>
          <div className={`${modalContainerClass} max-w-2xl`}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">添加实践基地</h3>
              <button
                onClick={() => setShowAddBaseModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">基地名称</label>
                  <input
                    type="text"
                    value={baseFormData.name}
                    onChange={(e) => setBaseFormData({ ...baseFormData, name: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入基地名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">基地类型</label>
                  <select
                    value={baseFormData.type}
                    onChange={(e) => setBaseFormData({ ...baseFormData, type: e.target.value as 'enterprise' | 'village' | 'community' })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="enterprise">企业</option>
                    <option value="village">乡村</option>
                    <option value="community">社区</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">详细地址</label>
                <input
                  type="text"
                  value={baseFormData.address}
                  onChange={(e) => setBaseFormData({ ...baseFormData, address: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入详细地址"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">联系人</label>
                  <input
                    type="text"
                    value={baseFormData.contactPerson}
                    onChange={(e) => setBaseFormData({ ...baseFormData, contactPerson: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">联系电话</label>
                  <input
                    type="tel"
                    value={baseFormData.contactPhone}
                    onChange={(e) => setBaseFormData({ ...baseFormData, contactPhone: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位数</label>
                <input
                  type="number"
                  min="0"
                  value={baseFormData.positionCount}
                  onChange={(e) => setBaseFormData({ ...baseFormData, positionCount: parseInt(e.target.value) || 0 })}
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入岗位数量"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">基地简介</label>
                <textarea
                  value={baseFormData.description}
                  onChange={(e) => setBaseFormData({ ...baseFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入基地简介"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddBaseModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddBase}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPositionModal && (
        <div className={modalOverlayClass}>
          <div className={`${modalContainerClass} max-w-2xl`}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">发布岗位</h3>
                <p className="text-xs text-gray-500 mt-1">
                  基地：{selectedBase?.name}
                </p>
              </div>
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位名称</label>
                <input
                  type="text"
                  value={positionFormData.name}
                  onChange={(e) => setPositionFormData({ ...positionFormData, name: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入岗位名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">专业要求</label>
                <input
                  type="text"
                  value={positionFormData.majorRequirement}
                  onChange={(e) => setPositionFormData({ ...positionFormData, majorRequirement: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="如：计算机相关专业、农业相关专业等"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">招聘人数</label>
                  <input
                    type="number"
                    min="1"
                    value={positionFormData.headcount}
                    onChange={(e) => setPositionFormData({ ...positionFormData, headcount: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入招聘人数"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">实习补贴（元/月）</label>
                  <input
                    type="number"
                    min="0"
                    value={positionFormData.subsidy}
                    onChange={(e) => setPositionFormData({ ...positionFormData, subsidy: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入补贴金额"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">开始日期</label>
                  <input
                    type="date"
                    value={positionFormData.startDate}
                    onChange={(e) => setPositionFormData({ ...positionFormData, startDate: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
                  <input
                    type="date"
                    value={positionFormData.endDate}
                    onChange={(e) => setPositionFormData({ ...positionFormData, endDate: e.target.value })}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddPosition}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发布岗位
              </button>
            </div>
          </div>
        </div>
      )}

      {showSatisfactionModal && selectedBase && (
        <div className={modalOverlayClass}>
          <div className={`${modalContainerClass} max-w-2xl max-h-[80vh] flex flex-col`}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">满意度详情</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedBase.name}</p>
              </div>
              <button
                onClick={() => setShowSatisfactionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-yellow-600">{selectedBase.satisfaction}</span>
                      <span className="text-gray-500">/100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(Math.round(selectedBase.satisfaction / 20), 'md')}
                      <span className="text-sm text-gray-500">综合评分</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-gray-800">{mockReviews.length}</p>
                    <p className="text-xs text-gray-500">条评价</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-800 mb-4">评分分布</h4>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm text-gray-600">{star}星</span>
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                          style={{ width: `${mockRatingDistribution[star as keyof typeof mockRatingDistribution]}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {mockRatingDistribution[star as keyof typeof mockRatingDistribution]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-4">最近评价</h4>
                <div className="space-y-3">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{review.studentAlias.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{review.studentAlias}</p>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-xs text-gray-400">{review.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckInDetailModal && selectedCheckIn && (
        <div className={modalOverlayClass}>
          <div className={`${modalContainerClass} max-w-xl`}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">打卡详情</h3>
              <button
                onClick={() => setShowCheckInDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-gray-300" />
                </div>
                {selectedCheckIn.hasWatermark && selectedCheckIn.watermarkInfo && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/60 text-white text-xs p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedCheckIn.watermarkInfo.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedCheckIn.watermarkInfo.gps}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{selectedCheckIn.watermarkInfo.team}</span>
                    </div>
                  </div>
                )}
                {!selectedCheckIn.hasWatermark && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    无水印
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">{selectedCheckIn.authorName?.charAt(0) || '学'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{selectedCheckIn.authorName}</p>
                    <p className="text-xs text-gray-500">{selectedCheckIn.teamName}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{selectedCheckIn.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Map className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">GPS位置</p>
                      <p className="text-xs font-medium text-gray-800">
                        {selectedCheckIn.latitude.toFixed(4)}, {selectedCheckIn.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">打卡时间</p>
                      <p className="text-xs font-medium text-gray-800">{selectedCheckIn.timestamp}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">打卡地点</p>
                    <p className="text-xs font-medium text-gray-800">{selectedCheckIn.location}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowCheckInDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索基地名称、地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类型</option>
              <option value="enterprise">企业</option>
              <option value="village">乡村</option>
              <option value="community">社区</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowAddBaseModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加基地
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{bases.length}</p>
              <p className="text-xs text-gray-500">基地总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalPositions}</p>
              <p className="text-xs text-gray-500">岗位总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {avgSatisfaction.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">平均满意度</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {Object.keys(typeMap).length}
              </p>
              <p className="text-xs text-gray-500">基地类型</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {bases.reduce((sum, b) => sum + (b.totalStudents || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">服务学生</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-base font-semibold text-gray-800">评分趋势</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={satisfactionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="满意度"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredBases.map((base) => {
          const baseCheckIns = getBaseCheckIns(base.name);
          const isExpanded = expandedBaseId === base.id;

          return (
            <div
              key={base.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {base.name}
                      </h3>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                          typeMap[base.type].color
                        }`}
                      >
                        {typeMap[base.type].icon} {typeMap[base.type].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddPosition(base)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="新增岗位"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleExpand(base.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看打卡记录"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4 line-clamp-2">
                  {base.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">
                      {base.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {base.contactPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {base.contactPerson}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {base.positionCount}个岗位
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 pt-4 border-t border-gray-100 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  onClick={() => handleOpenSatisfaction(base)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {base.satisfaction}分
                      </span>
                    </div>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                        style={{ width: `${base.satisfaction}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                      <CalendarRange className="w-4 h-4 text-blue-600" />
                      打卡记录（{baseCheckIns.length}条）
                    </h4>
                  </div>
                  {baseCheckIns.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {baseCheckIns.map((checkIn) => (
                        <div
                          key={checkIn.id}
                          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <Image className="w-6 h-6 text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">
                                  {checkIn.authorName}
                                </span>
                                {checkIn.hasWatermark ? (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    有水印
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                    无水印
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleOpenCheckInDetail(checkIn)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看详情
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{checkIn.timestamp}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{checkIn.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarRange className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">暂无打卡记录</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BaseManagement;
