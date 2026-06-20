import { useState } from 'react';
import {
  Image, Video, Mic, FileText, Palette, Search, Grid, List, Tag, Lock, Eye, Download, Upload, X, Copy, Edit,
  CheckCheck, XCircle, RotateCcw, FileCheck, UserCheck, Gavel, Clock3, Paperclip, Share2, QrCode, BadgeCheck, CircleDot, Circle, FileWarning, FileX,
  CheckCircle, AlertCircle, Calendar, Shield, Clock, Plus, ChevronRight, User, Folder as FileIcon
} from 'lucide-react';
import { assets } from '../data/mockData';
import type { Asset } from '../types';

const typeIcons: Record<string, any> = {
  image: Image,
  video: Video,
  audio: Mic,
  document: FileText,
  graphic: Palette
};

type CopyrightStatus = 'original' | 'authorized' | 'pending_auth' | 'restricted' | 'reviewing';

const copyrightStatusConfig: Record<CopyrightStatus, { bg: string; text: string; label: string; dot: string }> = {
  original: { bg: 'bg-green-100', text: 'text-green-700', label: '原创', dot: 'bg-green-500' },
  authorized: { bg: 'bg-blue-100', text: 'text-blue-700', label: '授权转载', dot: 'bg-blue-500' },
  pending_auth: { bg: 'bg-orange-100', text: 'text-orange-700', label: '待授权', dot: 'bg-orange-500' },
  restricted: { bg: 'bg-red-100', text: 'text-red-700', label: '受限使用', dot: 'bg-red-500' },
  reviewing: { bg: 'bg-purple-100', text: 'text-purple-700', label: '复查中', dot: 'bg-purple-500' },
};

const getAssetStatus = (asset: Asset): CopyrightStatus => {
  if (asset.status === 'pending') return 'reviewing';
  if ((asset.status as string) === 'restricted') return 'restricted';
  if (asset.copyright === 'original') return 'original';
  if (asset.copyright === 'authorized') return 'authorized';
  if (asset.copyright === 'public') return 'authorized';
  return (asset.status as string) === 'restricted' ? 'restricted' : 'pending_auth';
};

type AuthStatus = 'pending' | 'approved' | 'rejected' | 'need_material';
type ReuseStatus = 'submitted' | 'ownership' | 'compliance' | 'chief_sign' | 'authorized';
type ReviewTrigger = 'random' | 'complaint' | 'regular' | 'pre_use';
type ReviewConclusion = 'compliant' | 'need_revision' | 'infringement';

const authStatusConfig: Record<AuthStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: '待处理' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: '已同意' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已拒绝' },
  need_material: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待补充' },
};

const reuseStatusConfig: Record<ReuseStatus, { label: string }> = {
  submitted: { label: '已提交' },
  ownership: { label: '素材权属确认' },
  compliance: { label: '合规审核' },
  chief_sign: { label: '总编签字' },
  authorized: { label: '授权完成' },
};

const reviewConclusionConfig: Record<ReviewConclusion, { label: string; bg: string; text: string; icon: any }> = {
  compliant: { label: '合规', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  need_revision: { label: '需修订', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: FileWarning },
  infringement: { label: '侵权下架', bg: 'bg-red-100', text: 'text-red-700', icon: FileX },
};

const reviewTriggerConfig: Record<ReviewTrigger, { label: string; icon: any; color: string }> = {
  random: { label: '随机抽查', icon: CircleDot, color: 'text-blue-500' },
  complaint: { label: '投诉举报', icon: AlertCircle, color: 'text-red-500' },
  regular: { label: '定期排查', icon: Calendar, color: 'text-purple-500' },
  pre_use: { label: '使用前复核', icon: Shield, color: 'text-green-500' },
};

const authRequests = [
  {
    id: 'ar1',
    assetTitle: '昌平草莓宣传图',
    assetThumbnail: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=200&h=150&fit=crop',
    assetType: 'image' as const,
    applicant: '王记者',
    department: '文旅新闻部',
    purpose: '微信公众号推文配图',
    channel: '微信公众号、微博',
    copyrightHolder: '某摄影工作室',
    applyTime: '2026-06-18 10:30',
    status: 'pending' as AuthStatus,
    contract: { term: '2026-06-18 至 2026-12-31', scope: '新媒体平台宣传使用', credit: '需标注"图源：XX工作室"' },
  },
  {
    id: 'ar2',
    assetTitle: '明十三陵景区宣传片',
    assetThumbnail: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=200&h=150&fit=crop',
    assetType: 'video' as const,
    applicant: '李编辑',
    department: '视频部',
    purpose: '抖音短视频制作素材',
    channel: '抖音、快手',
    copyrightHolder: '十三陵特区办事处',
    applyTime: '2026-06-17 14:20',
    status: 'approved' as AuthStatus,
    contract: { term: '2026-06-17 至 2027-06-17', scope: '短视频平台全渠道', credit: '视频末尾鸣谢单位' },
  },
  {
    id: 'ar3',
    assetTitle: '居庸关长城航拍素材',
    assetThumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=200&h=150&fit=crop',
    assetType: 'image' as const,
    applicant: '张记者',
    department: '新闻中心',
    purpose: '头版新闻配图',
    channel: '报纸、网站',
    copyrightHolder: '航拍公司',
    applyTime: '2026-06-16 09:15',
    status: 'need_material' as AuthStatus,
    contract: { term: '2026-06-16 至 2026-08-16', scope: '官方出版物', credit: '署名摄影师' },
  },
  {
    id: 'ar4',
    assetTitle: '商业图库-城市风光',
    assetThumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f1?w=200&h=150&fit=crop',
    assetType: 'image' as const,
    applicant: '赵美编',
    department: '美编部',
    purpose: '宣传海报背景',
    channel: '印刷品',
    copyrightHolder: '视觉中国',
    applyTime: '2026-06-15 16:40',
    status: 'rejected' as AuthStatus,
    rejectReason: '费用超出预算，请选用免费替代素材',
    contract: { term: '单次使用', scope: '内部宣传海报', credit: '按标准署名格式' },
  },
];

const reuseRequests = [
  {
    id: 'rr1',
    assetTitle: '昌平区政府大楼航拍图',
    assetThumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f1?w=200&h=150&fit=crop',
    assetType: 'image' as const,
    applicant: '刘记者',
    applyTime: '2026-06-18 11:00',
    description: '用于"昌平区半年经济发展"专题报道封面图，需在微信公众号、报纸、网站三个渠道同步使用',
    status: 'ownership' as ReuseStatus,
    timeline: [
      { status: 'submitted' as ReuseStatus, time: '2026-06-18 11:00', operator: '刘记者' },
      { status: 'ownership' as ReuseStatus, time: '2026-06-18 14:30', operator: '素材管理员' },
    ],
  },
  {
    id: 'rr2',
    assetTitle: '回天地区社区活动照片集',
    assetThumbnail: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=150&fit=crop',
    assetType: 'image' as const,
    applicant: '王记者',
    applyTime: '2026-06-17 09:30',
    description: '用于回天行动计划五周年系列报道，多图组合呈现社区变化',
    status: 'compliance' as ReuseStatus,
    timeline: [
      { status: 'submitted' as ReuseStatus, time: '2026-06-17 09:30', operator: '王记者' },
      { status: 'ownership' as ReuseStatus, time: '2026-06-17 11:00', operator: '素材管理员' },
      { status: 'compliance' as ReuseStatus, time: '2026-06-17 15:00', operator: '合规专员' },
    ],
  },
  {
    id: 'rr3',
    assetTitle: '经济工作会议现场视频',
    assetThumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=150&fit=crop',
    assetType: 'video' as const,
    applicant: '陈编辑',
    applyTime: '2026-06-15 14:00',
    description: '制作经济工作会议总结短视频，计划在抖音平台发布',
    status: 'authorized' as ReuseStatus,
    timeline: [
      { status: 'submitted' as ReuseStatus, time: '2026-06-15 14:00', operator: '陈编辑' },
      { status: 'ownership' as ReuseStatus, time: '2026-06-15 15:30', operator: '素材管理员' },
      { status: 'compliance' as ReuseStatus, time: '2026-06-16 09:00', operator: '合规专员' },
      { status: 'chief_sign' as ReuseStatus, time: '2026-06-16 14:00', operator: '总编辑' },
      { status: 'authorized' as ReuseStatus, time: '2026-06-16 16:30', operator: '系统' },
    ],
  },
  {
    id: 'rr4',
    assetTitle: '未来科学城规划图',
    assetThumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&h=150&fit=crop',
    assetType: 'graphic' as const,
    applicant: '赵记者',
    applyTime: '2026-06-12 10:00',
    description: '科技企业孵化基地专题报道配图，需放大细节展示规划区域',
    status: 'chief_sign' as ReuseStatus,
    timeline: [
      { status: 'submitted' as ReuseStatus, time: '2026-06-12 10:00', operator: '赵记者' },
      { status: 'ownership' as ReuseStatus, time: '2026-06-12 11:30', operator: '素材管理员' },
      { status: 'compliance' as ReuseStatus, time: '2026-06-13 09:00', operator: '合规专员' },
      { status: 'chief_sign' as ReuseStatus, time: '2026-06-14 10:00', operator: '待处理' },
    ],
  },
];

const reviewRecords = [
  {
    id: 'rv1',
    trigger: 'complaint' as ReviewTrigger,
    triggerTime: '2026-06-18 15:20',
    reviewer: '版权专员-李明',
    conclusion: 'need_revision' as ReviewConclusion,
    reason: '收到摄影师投诉，文章配图超出约定使用范围，需补充授权范围',
    relatedAssets: [
      { id: '3', title: '昌平草莓宣传图', type: 'image' as const, thumbnail: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100&h=75&fit=crop' },
    ],
    attachments: [{ name: '整改通知书.pdf', type: 'pdf' }, { name: '授权补充协议模板.docx', type: 'doc' }],
  },
  {
    id: 'rv2',
    trigger: 'regular' as ReviewTrigger,
    triggerTime: '2026-06-15 09:00',
    reviewer: '版权审核组',
    conclusion: 'compliant' as ReviewConclusion,
    reason: '6月第二周定期排查，抽查30份素材全部符合版权使用规范',
    relatedAssets: [
      { id: '1', title: '昌平区政府大楼航拍图', type: 'image' as const, thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f1?w=100&h=75&fit=crop' },
      { id: '2', title: '居庸关长城宣传片', type: 'video' as const, thumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=100&h=75&fit=crop' },
    ],
    attachments: [{ name: '6月版权排查报告.pdf', type: 'pdf' }],
  },
  {
    id: 'rv3',
    trigger: 'pre_use' as ReviewTrigger,
    triggerTime: '2026-06-12 14:30',
    reviewer: '合规专员-王芳',
    conclusion: 'infringement' as ReviewConclusion,
    reason: '使用前复核发现"商业图库"素材未获得完整授权，存在侵权风险，已下架处理',
    relatedAssets: [
      { id: 'temp1', title: '未授权商业素材-城市风光', type: 'image' as const, thumbnail: '' },
    ],
    attachments: [{ name: '侵权风险预警单.pdf', type: 'pdf' }, { name: '下架处理记录.xlsx', type: 'xlsx' }],
  },
  {
    id: 'rv4',
    trigger: 'random' as ReviewTrigger,
    triggerTime: '2026-06-10 11:00',
    reviewer: '版权专员-李明',
    conclusion: 'compliant' as ReviewConclusion,
    reason: '随机抽查15份已发布稿件素材，授权链路完整、使用规范',
    relatedAssets: [
      { id: '5', title: '2026昌平统计年鉴', type: 'document' as const, thumbnail: '' },
    ],
    attachments: [{ name: '抽查记录表.pdf', type: 'pdf' }],
  },
  {
    id: 'rv5',
    trigger: 'complaint' as ReviewTrigger,
    triggerTime: '2026-06-05 16:40',
    reviewer: '版权审核组',
    conclusion: 'need_revision' as ReviewConclusion,
    reason: '被投诉使用未署名图片，已补充署名并联系原作者致歉',
    relatedAssets: [
      { id: '7', title: '明十三陵景区高清照片集', type: 'image' as const, thumbnail: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=100&h=75&fit=crop' },
    ],
    attachments: [{ name: '沟通邮件截图.png', type: 'image' }, { name: '更正声明.docx', type: 'doc' }],
  },
];

export default function Assets() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCopyright, setFilterCopyright] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'auth' | 'reuse' | 'review'>('browse');

  const filteredAssets = assets.filter(asset => {
    const matchSearch = asset.title.includes(searchText) || asset.tags.some(tag => tag.includes(searchText));
    const matchType = filterType === 'all' || asset.type === filterType;
    const matchCopyright = filterCopyright === 'all' || asset.copyright === filterCopyright;
    return matchSearch && matchType && matchCopyright;
  });

  const copyrightStats = [
    { type: 'original', count: assets.filter(a => getAssetStatus(a) === 'original').length, label: '原创' },
    { type: 'authorized', count: assets.filter(a => getAssetStatus(a) === 'authorized').length, label: '授权转载' },
    { type: 'pending_auth', count: assets.filter(a => getAssetStatus(a) === 'pending_auth').length, label: '待授权' },
    { type: 'restricted', count: assets.filter(a => getAssetStatus(a) === 'restricted').length, label: '受限使用' },
    { type: 'reviewing', count: assets.filter(a => getAssetStatus(a) === 'reviewing').length, label: '复查中' },
  ];

  const subTabs = [
    { id: 'browse', label: '资产浏览', icon: Image },
    { id: 'auth', label: '授权审批', icon: Gavel },
    { id: 'reuse', label: '复用申请', icon: RotateCcw },
    { id: 'review', label: '复查留痕', icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{assets.length}</div>
          <div className="text-sm text-slate-500 mt-1">素材总数</div>
        </div>
        {copyrightStats.map(stat => {
          const info = copyrightStatusConfig[stat.type as CopyrightStatus];
          return (
            <div key={stat.type} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${info.dot}`}></div>
                <div className={`text-2xl font-bold ${info.text}`}>{stat.count}</div>
              </div>
              <div className="text-sm text-slate-500 mt-1">{info.label}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-white rounded-xl p-1 inline-flex border border-slate-200">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'auth' && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    {authRequests.filter(a => a.status === 'pending' || a.status === 'need_material').length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Upload className="w-4 h-4" />
          上传素材
        </button>
      </div>

      {activeSubTab === 'browse' && (
        <AssetBrowse
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchText={searchText}
          setSearchText={setSearchText}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCopyright={filterCopyright}
          setFilterCopyright={setFilterCopyright}
          filteredAssets={filteredAssets}
          onSelectAsset={setSelectedAsset}
        />
      )}
      {activeSubTab === 'auth' && <AuthApprovalPanel />}
      {activeSubTab === 'reuse' && <ReuseRequestPanel />}
      {activeSubTab === 'review' && <ReviewRecordsPanel />}

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}

function AssetBrowse(props: {
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  searchText: string;
  setSearchText: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterCopyright: string;
  setFilterCopyright: (v: string) => void;
  filteredAssets: Asset[];
  onSelectAsset: (a: Asset) => void;
}) {
  const {
    viewMode, setViewMode, searchText, setSearchText,
    filterType, setFilterType, filterCopyright, setFilterCopyright,
    filteredAssets, onSelectAsset
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索素材标题、标签..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部类型</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="document">文档</option>
              <option value="graphic">图形</option>
            </select>
            <select
              value={filterCopyright}
              onChange={(e) => setFilterCopyright(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部版权</option>
              <option value="original">原创</option>
              <option value="authorized">授权</option>
              <option value="public">公有</option>
            </select>
          </div>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} onClick={() => onSelectAsset(asset)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">素材</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">版权状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">格式</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">大小</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">上传者</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">下载量</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAssets.map(asset => {
                const TypeIcon = typeIcons[asset.type];
                const statusInfo = copyrightStatusConfig[getAssetStatus(asset)];
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectAsset(asset)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {asset.thumbnail ? (
                          <img src={asset.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">{asset.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-600 flex items-center gap-1">
                        <TypeIcon className="w-4 h-4" />
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text} flex items-center gap-1.5 w-fit`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.format}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.fileSize}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.uploader}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{asset.downloads}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-slate-400 hover:text-primary-500"><Eye className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-green-500"><Download className="w-4 h-4" /></button>
                        <button className="p-1 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const TypeIcon = typeIcons[asset.type];
  const statusInfo = copyrightStatusConfig[getAssetStatus(asset)];

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-video bg-slate-100 relative overflow-hidden">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text} backdrop-blur flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
            {statusInfo.label}
          </span>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-8 h-8 bg-black/50 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-black/70">
            <Eye className="w-4 h-4" />
          </button>
        </div>
        {getAssetStatus(asset) === 'restricted' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <span className="text-xs">需授权使用</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-slate-800 text-sm line-clamp-1 mb-2">{asset.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {asset.downloads}
          </span>
          <span>{asset.fileSize}</span>
        </div>
      </div>
    </div>
  );
}

function AuthApprovalPanel() {
  const pendingCount = authRequests.filter(a => a.status === 'pending').length;
  const approvedCount = authRequests.filter(a => a.status === 'approved').length;
  const rejectedCount = authRequests.filter(a => a.status === 'rejected').length;
  const needMaterialCount = authRequests.filter(a => a.status === 'need_material').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{pendingCount + needMaterialCount}</div>
              <div className="text-xs text-slate-500">待处理</div>
            </div>
          </div>
          {needMaterialCount > 0 && (
            <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {needMaterialCount}份需补充材料
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{approvedCount}</div>
              <div className="text-xs text-slate-500">已同意</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{rejectedCount}</div>
              <div className="text-xs text-slate-500">已拒绝</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{authRequests.length}</div>
              <div className="text-xs text-slate-500">申请总数</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {authRequests.map(req => {
          const statusInfo = authStatusConfig[req.status];
          const TypeIcon = typeIcons[req.assetType];
          return (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-4 border-b border-slate-100">
                <div className="w-20 h-14 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                  {req.assetThumbnail ? (
                    <img src={req.assetThumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{req.assetTitle}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 text-xs">
                    <div className="text-slate-500">申请人：<span className="text-slate-700">{req.applicant}</span></div>
                    <div className="text-slate-500">部门：<span className="text-slate-700">{req.department}</span></div>
                    <div className="text-slate-500 col-span-2">申请用途：<span className="text-slate-700">{req.purpose}</span></div>
                    <div className="text-slate-500 col-span-2">渠道：<span className="text-slate-700">{req.channel}</span></div>
                    <div className="text-slate-500">版权方：<span className="text-slate-700">{req.copyrightHolder}</span></div>
                    <div className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{req.applyTime}</div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />授权合同预览
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex"><span className="text-slate-500 w-20 shrink-0">使用期限：</span><span className="text-slate-700">{req.contract.term}</span></div>
                  <div className="flex"><span className="text-slate-500 w-20 shrink-0">使用范围：</span><span className="text-slate-700">{req.contract.scope}</span></div>
                  <div className="flex"><span className="text-slate-500 w-20 shrink-0">署名要求：</span><span className="text-slate-700">{req.contract.credit}</span></div>
                </div>
                {req.status === 'rejected' && req.rejectReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-600">
                    <span className="font-medium">拒绝原因：</span>{req.rejectReason}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 flex gap-2">
                <button className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />查看详情
                </button>
                {req.status === 'pending' && (
                  <>
                    <button className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />同意授权
                    </button>
                    <button className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />拒绝
                    </button>
                  </>
                )}
                {req.status === 'need_material' && (
                  <>
                    <button className="flex-1 py-1.5 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition-colors flex items-center justify-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />补充材料
                    </button>
                    <button className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />材料已齐
                    </button>
                  </>
                )}
                {(req.status === 'approved' || req.status === 'rejected') && (
                  <button className="flex-1 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors">
                    查看审批记录
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReuseRequestPanel() {
  const reuseSteps: ReuseStatus[] = ['submitted', 'ownership', 'compliance', 'chief_sign', 'authorized'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">复用申请进度总览</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs hover:bg-primary-600 transition-colors">
            <Plus className="w-3.5 h-3.5" />新建申请
          </button>
        </div>
        <div className="flex items-center gap-2">
          {reuseSteps.map((step, idx) => {
            const info = reuseStatusConfig[step];
            const count = reuseRequests.filter(r => reuseSteps.indexOf(r.status) >= idx).length;
            const isLast = idx === reuseSteps.length - 1;
            return (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className="flex-1 min-w-0">
                  <div className={`text-center py-2 rounded-lg ${idx === 0 ? 'bg-blue-50' : idx === reuseSteps.length - 1 ? 'bg-green-50' : 'bg-slate-50'}`}>
                    <div className={`text-lg font-bold ${idx === 0 ? 'text-blue-600' : idx === reuseSteps.length - 1 ? 'text-green-600' : 'text-slate-700'}`}>{count}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{info.label}</div>
                  </div>
                </div>
                {!isLast && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {reuseRequests.map(req => {
          const TypeIcon = typeIcons[req.assetType];
          const currentStepIdx = reuseSteps.indexOf(req.status);
          return (
            <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-4 border-b border-slate-100">
                <div className="w-20 h-14 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                  {req.assetThumbnail ? (
                    <img src={req.assetThumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{req.assetTitle}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.applicant}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.applyTime}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {req.status !== 'authorized' && (
                        <>
                          <button className="px-2.5 py-1 border border-slate-200 text-slate-600 rounded text-xs hover:bg-slate-50 transition-colors">修改</button>
                          <button className="px-2.5 py-1 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 transition-colors">撤回</button>
                        </>
                      )}
                      <button className="px-2.5 py-1 border border-primary-200 text-primary-600 rounded text-xs hover:bg-primary-50 transition-colors flex items-center gap-1">
                        <Eye className="w-3 h-3" />进度
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{req.description}</p>
                </div>
              </div>

              <div className="px-4 py-4 bg-slate-50/30">
                <div className="text-xs font-medium text-slate-700 mb-3">审批流程</div>
                <div className="flex items-start gap-1">
                  {reuseSteps.map((step, idx) => {
                    const info = reuseStatusConfig[step];
                    const isDone = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const timelineItem = req.timeline.find(t => t.status === step);
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center relative">
                        <div className="flex items-center w-full">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-green-500' : isCurrent ? 'bg-primary-500 ring-2 ring-primary-200' : 'bg-slate-200'
                          }`}>
                            {isDone ? (<CheckCircle className="w-4 h-4 text-white" />) : isCurrent ? (<CircleDot className="w-4 h-4 text-white" />) : (<span className="text-xs text-slate-400">{idx + 1}</span>)}
                          </div>
                          {idx < reuseSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-0.5 ${isDone ? 'bg-green-300' : 'bg-slate-200'}`}></div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div className={`text-[10px] font-medium ${isDone || isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>{info.label}</div>
                          {timelineItem && (
                            <>
                              <div className="text-[9px] text-slate-400 mt-1">{timelineItem.time}</div>
                              <div className="text-[9px] text-slate-500">{timelineItem.operator}</div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewRecordsPanel() {
  const monthTotal = reviewRecords.length;
  const monthCompliant = reviewRecords.filter(r => r.conclusion === 'compliant').length;
  const monthIssue = reviewRecords.filter(r => r.conclusion !== 'compliant').length;
  const monthClosed = reviewRecords.filter(r => r.conclusion !== 'need_revision').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{monthTotal}</div>
              <div className="text-xs text-slate-500">本月复查</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{monthCompliant}</div>
              <div className="text-xs text-slate-500">合规</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{monthIssue}</div>
              <div className="text-xs text-slate-500">问题</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{monthClosed}</div>
              <div className="text-xs text-slate-500">已闭环</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">复查留痕时间线</h3>
          <p className="text-xs text-slate-500 mt-0.5">按时间倒序展示所有版权复查记录</p>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
            <div className="space-y-6">
              {reviewRecords.map(record => {
                const triggerInfo = reviewTriggerConfig[record.trigger];
                const TriggerIcon = triggerInfo.icon;
                const conclusionInfo = reviewConclusionConfig[record.conclusion];
                const ConclusionIcon = conclusionInfo.icon;
                return (
                  <div key={record.id} className="relative pl-10">
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                      record.conclusion === 'compliant' ? 'bg-green-100' :
                      record.conclusion === 'need_revision' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <ConclusionIcon className={`w-4 h-4 ${conclusionInfo.text}`} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700`}>
                            <TriggerIcon className={`w-3.5 h-3.5 ${triggerInfo.color}`} />
                            {triggerInfo.label}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${conclusionInfo.bg} ${conclusionInfo.text}`}>
                            <ConclusionIcon className="w-3.5 h-3.5" />
                            {conclusionInfo.label}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{record.triggerTime}</div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 justify-end"><UserCheck className="w-3 h-3" />{record.reviewer}</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mb-3">{record.reason}</p>
                      {record.relatedAssets.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1"><Image className="w-3.5 h-3.5" />相关资产 ({record.relatedAssets.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {record.relatedAssets.map((a, idx) => {
                              const ATypeIcon = typeIcons[a.type];
                              return (
                                <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                  {a.thumbnail ? (
                                    <img src={a.thumbnail} alt="" className="w-8 h-6 rounded object-cover" />
                                  ) : (
                                    <div className="w-8 h-6 rounded bg-slate-100 flex items-center justify-center">
                                      <ATypeIcon className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                  )}
                                  <span className="text-xs text-slate-700 max-w-[150px] truncate">{a.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {record.attachments.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1"><Paperclip className="w-3.5 h-3.5" />处理记录附件 ({record.attachments.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {record.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors">
                                <FileText className="w-3.5 h-3.5 text-primary-500" />
                                <span className="text-xs text-primary-700">{att.name}</span>
                                <Download className="w-3 h-3 text-primary-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDetailModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const TypeIcon = typeIcons[asset.type];
  const statusInfo = copyrightStatusConfig[getAssetStatus(asset)];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">素材详情</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>{statusInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="bg-slate-900 aspect-video flex items-center justify-center">
              {asset.thumbnail ? (
                <img src={asset.thumbnail} alt="" className="max-w-full max-h-full object-contain" />
              ) : (<TypeIcon className="w-20 h-20 text-slate-600" />)}
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{asset.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{asset.format}</span>
                  <span className="text-sm text-slate-500">{asset.fileSize}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">版权持有者</div>
                  <div className="text-sm font-medium text-slate-700">{asset.copyrightHolder}</div>
                </div>
                {asset.licenseType && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">授权类型</div>
                    <div className="text-sm font-medium text-slate-700">{asset.licenseType}</div>
                  </div>
                )}
                {asset.expirationDate && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">有效期至</div>
                    <div className="text-sm font-medium text-slate-700">{asset.expirationDate}</div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">上传时间</div>
                  <div className="text-sm font-medium text-slate-700">{asset.createdAt}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">元数据</div>
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  {Object.entries(asset.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Eye className="w-4 h-4" /><span>{asset.views} 浏览</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Download className="w-4 h-4" /><span>{asset.downloads} 下载</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
              <Copy className="w-4 h-4" />复制链接
            </button>
            <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
              <Tag className="w-4 h-4" />编辑标签
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-primary-200 text-primary-600 rounded-lg text-sm hover:bg-primary-50 flex items-center gap-2">
              <Gavel className="w-4 h-4" />申请授权
            </button>
            <button className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 flex items-center gap-2">
              <Download className="w-4 h-4" />下载使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">上传素材</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-1">点击或拖拽文件到此处上传</p>
            <p className="text-xs text-slate-400">支持 JPG、PNG、MP4、MP3、PDF 等格式</p>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">素材标题</label>
            <input
              type="text"
              placeholder="请输入素材标题"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">版权状态</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="original">原创 - 本单位自有版权</option>
              <option value="authorized">授权转载 - 已获得使用授权</option>
              <option value="pending_auth">待授权 - 正在申请使用授权</option>
              <option value="restricted">受限使用 - 仅限内部特定场景</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">版权持有者</label>
            <input
              type="text"
              placeholder="请输入版权持有者名称"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">标签</label>
            <div className="flex flex-wrap gap-2">
              {['新闻', '宣传', '活动'].map(tag => (
                <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                  {tag}
                  <X className="w-3 h-3 inline ml-1 cursor-pointer" />
                </span>
              ))}
              <span className="px-2 py-1 border border-dashed border-slate-300 rounded text-xs text-slate-400 cursor-pointer hover:border-primary-500 hover:text-primary-500">
                + 添加标签
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm">
            取消
          </button>
          <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
            开始上传
          </button>
        </div>
      </div>
    </div>
  );
}
