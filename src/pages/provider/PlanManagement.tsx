import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Eye, Edit2, Copy, Send, Trash2, LayoutGrid,
  Filter, MoreVertical, Calendar, Clock, MapPin, Building,
} from 'lucide-react';
import { Input, Select, Dropdown, Avatar, Tag, Empty, message } from 'antd';
import type { MenuProps } from 'antd';

const { Option } = Select;

type PlanStatus = 'draft' | 'submitted' | 'won' | 'lost';

interface Plan {
  id: number;
  name: string;
  cover: string;
  projectName: string;
  ownerName: string;
  ownerAvatar: string;
  address: string;
  price: number;
  style: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

const mockPlans: Plan[] = [
  {
    id: 1,
    name: '现代简约·阳光花园全屋方案',
    cover: 'modern',
    projectName: '阳光花园3栋全屋整装',
    ownerName: '张女士',
    ownerAvatar: 'Z',
    address: '阳光花园·3栋·2301',
    price: 286000,
    style: '现代简约',
    status: 'submitted',
    createdAt: '2024-05-18',
    updatedAt: '2024-06-10',
    tags: ['LDK一体', '收纳优化', '环保材料'],
  },
  {
    id: 2,
    name: '新中式·滨江壹号大平层',
    cover: 'chinese',
    projectName: '滨江壹号5栋大平层',
    ownerName: '王先生',
    ownerAvatar: 'W',
    address: '滨江壹号·5栋·1202',
    price: 688000,
    style: '新中式',
    status: 'draft',
    createdAt: '2024-06-01',
    updatedAt: '2024-06-11',
    tags: ['实木家具', '园林景观', '茶室设计'],
  },
  {
    id: 3,
    name: '北欧原木·绿城春江月',
    cover: 'nordic',
    projectName: '绿城春江月三居室',
    ownerName: '李先生',
    ownerAvatar: 'L',
    address: '绿城春江月·7栋·803',
    price: 198000,
    style: '北欧风格',
    status: 'won',
    createdAt: '2024-04-20',
    updatedAt: '2024-06-08',
    tags: ['原木色系', '亲子友好', '智能预留'],
  },
  {
    id: 4,
    name: '轻奢风·江南府四居方案',
    cover: 'luxury',
    projectName: '江南府10栋精装改造',
    ownerName: '刘女士',
    ownerAvatar: 'L',
    address: '江南府·10栋·1806',
    price: 456000,
    style: '轻奢风格',
    status: 'lost',
    createdAt: '2024-05-10',
    updatedAt: '2024-06-05',
    tags: ['大理石饰面', '无主灯', '酒柜定制'],
  },
  {
    id: 5,
    name: '日式侘寂·春风十里花园',
    cover: 'japanese',
    projectName: '春风十里3栋改造',
    ownerName: '陈先生',
    ownerAvatar: 'C',
    address: '春风十里花园·3栋·1102',
    price: 328000,
    style: '日式侘寂',
    status: 'draft',
    createdAt: '2024-06-08',
    updatedAt: '2024-06-12',
    tags: ['微水泥', '榻榻米', '储物间'],
  },
  {
    id: 6,
    name: '美式复古·保利时光印象',
    cover: 'american',
    projectName: '保利时光印象三居室',
    ownerName: '周女士',
    ownerAvatar: 'Z',
    address: '保利时光印象·6栋·905',
    price: 268000,
    style: '美式复古',
    status: 'submitted',
    createdAt: '2024-05-28',
    updatedAt: '2024-06-09',
    tags: ['护墙板', '复古地砖', '壁炉造型'],
  },
];

const statusConfig: Record<PlanStatus, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: '草稿', color: 'text-ivory-700', bg: 'bg-ivory-100', border: 'border-ivory-300' },
  submitted: { label: '已提交', color: 'text-haze-700', bg: 'bg-haze-50', border: 'border-haze-300' },
  won: { label: '已中标', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  lost: { label: '未中标', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300' },
};

const coverGradients: Record<string, string> = {
  modern: 'from-haze-300 via-haze-400 to-terracotta-300',
  chinese: 'from-wood-300 via-wood-400 to-wood-500',
  nordic: 'from-ivory-200 via-wood-200 to-haze-200',
  luxury: 'from-terracotta-300 via-wood-300 to-haze-300',
  japanese: 'from-ivory-300 via-ivory-400 to-wood-300',
  american: 'from-terracotta-400 via-wood-400 to-carbon-500',
};

const coverIcons: Record<string, string> = {
  modern: '🪟',
  chinese: '🏯',
  nordic: '🌲',
  luxury: '✨',
  japanese: '🎋',
  american: '🏠',
};

const PlanManagement = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'all'>('all');
  const [styleFilter, setStyleFilter] = useState<string | undefined>(undefined);

  const filteredPlans = useMemo(() => {
    return mockPlans.filter(
      (p) =>
        (statusFilter === 'all' || p.status === statusFilter) &&
        (!styleFilter || p.style === styleFilter) &&
        (!searchText ||
          p.name.includes(searchText) ||
          p.ownerName.includes(searchText) ||
          p.projectName.includes(searchText))
    );
  }, [statusFilter, styleFilter, searchText]);

  const getMenuItems = (plan: Plan): MenuProps['items'] => [
    {
      key: 'view',
      icon: <Eye className="w-4 h-4" />,
      label: '查看详情',
    },
    {
      key: 'edit',
      icon: <Edit2 className="w-4 h-4" />,
      label: '编辑方案',
    },
    {
      key: 'copy',
      icon: <Copy className="w-4 h-4" />,
      label: '复制方案',
    },
    { type: 'divider' },
    {
      key: 'submit',
      icon: <Send className="w-4 h-4" />,
      label: plan.status === 'draft' ? '提交报价' : '更新报价',
      disabled: plan.status === 'won',
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      label: <span className="text-rose-500">删除方案</span>,
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    switch (key) {
      case 'edit':
        navigate('/provider/plans/create');
        break;
      case 'delete':
        message.success('已删除方案');
        break;
      case 'copy':
        message.success('已复制方案');
        break;
      case 'submit':
        message.success('报价已提交');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="section-title">装修方案管理</h1>
          <p className="text-ivory-600">共 {mockPlans.length} 个方案 · 已中标 {mockPlans.filter(p => p.status === 'won').length} 个</p>
        </div>
        <button
          onClick={() => navigate('/provider/plans/create')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          创建新方案
        </button>
      </div>

      <div className="card-base p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ivory-50/80 border border-ivory-200">
            <LayoutGrid className="w-4 h-4 text-ivory-600" />
            <span className="text-sm font-medium text-carbon-700">卡片视图</span>
          </div>
          <div className="h-6 w-px bg-ivory-200" />
          <div className="flex-1 min-w-64 flex items-center gap-3">
            <Input
              prefix={<Search className="w-4 h-4 text-ivory-400" />}
              placeholder="搜索方案名/业主/项目"
              className="!rounded-btn"
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Select
            placeholder="状态筛选"
            className="!w-36"
            size="middle"
            allowClear
            defaultValue="all"
            onChange={(v: PlanStatus | 'all' | undefined) => setStatusFilter(v ?? 'all')}
            suffixIcon={<Filter className="w-4 h-4 text-ivory-400" />}
          >
            <Option value="all">全部状态</Option>
            <Option value="draft">草稿</Option>
            <Option value="submitted">已提交</Option>
            <Option value="won">已中标</Option>
            <Option value="lost">未中标</Option>
          </Select>
          <Select
            placeholder="风格筛选"
            className="!w-36"
            size="middle"
            allowClear
            onChange={(v) => setStyleFilter(v)}
          >
            {['现代简约', '新中式', '北欧风格', '轻奢风格', '日式侘寂', '美式复古'].map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlans.map((plan, idx) => {
            const config = statusConfig[plan.status];
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="card-base overflow-hidden group"
              >
                <div className={`relative aspect-[16/10] bg-gradient-to-br ${coverGradients[plan.cover]} overflow-hidden`}>
                  <div className="absolute inset-0 bg-grain" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500">
                      {coverIcons[plan.cover]}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`badge ${config.color} ${config.bg} ${config.border} backdrop-blur-sm`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Dropdown
                      menu={{ items: getMenuItems(plan), onClick: handleMenuClick }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center text-carbon-600 hover:bg-white transition-colors shadow-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Dropdown>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                    {plan.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-carbon-700 border border-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-serif font-semibold text-carbon-800 line-clamp-1 mb-1 group-hover:text-terracotta-600 transition-colors">
                    {plan.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar size={20} className="!bg-terracotta-400 !text-white !text-[10px]">
                      {plan.ownerAvatar}
                    </Avatar>
                    <span className="text-sm text-carbon-700 font-medium">{plan.ownerName}</span>
                    <span className="text-xs text-ivory-400">·</span>
                    <span className="text-xs text-ivory-600 line-clamp-1">{plan.projectName}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-ivory-100">
                    <div>
                      <p className="text-[11px] text-ivory-500 mb-0.5">报价金额</p>
                      <p className="font-mono text-xl font-bold text-terracotta-600">
                        ¥{(plan.price / 10000).toFixed(1)}
                        <span className="text-sm font-normal text-terracotta-500 ml-0.5">万</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 rounded-lg bg-haze-50 text-haze-700 text-xs font-medium border border-haze-200/70">
                        {plan.style}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ivory-500 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {plan.address}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ivory-500 mb-4 pt-3 border-t border-ivory-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      创建 {plan.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      更新 {plan.updatedAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-ivory-50 text-ivory-600 hover:text-haze-600 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px]">查看</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-ivory-50 text-ivory-600 hover:text-wood-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                      <span className="text-[10px]">编辑</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-ivory-50 text-ivory-600 hover:text-terracotta-600 transition-colors">
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px]">复制</span>
                    </button>
                    <button
                      disabled={plan.status === 'won'}
                      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                        plan.status === 'won'
                          ? 'opacity-40 cursor-not-allowed text-ivory-400'
                          : 'hover:bg-terracotta-50 text-ivory-600 hover:text-terracotta-600'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-[10px]">报价</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card-base py-20">
          <Empty
            description={
              <div>
                <p className="text-carbon-600 font-medium mb-1">没有找到匹配的方案</p>
                <p className="text-xs text-ivory-500">试试调整筛选条件或创建新方案</p>
              </div>
            }
          >
            <button
              onClick={() => navigate('/provider/plans/create')}
              className="btn-primary mt-4"
            >
              <Plus className="w-4 h-4" />
              创建新方案
            </button>
          </Empty>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
