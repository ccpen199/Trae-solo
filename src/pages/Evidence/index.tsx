import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Upload,
  Grid3x3,
  List,
  ArrowUpDown,
  Home,
  Search,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  Share2,
  Eye,
  X,
  Plus,
  Tag,
  ScanText,
  GripVertical,
} from 'lucide-react';
import {
  Tree,
  Button,
  Input,
  Select,
  Modal,
  Tag as AntTag,
  Tooltip,
  message,
  Dropdown,
  Breadcrumb,
  Empty,
  Card,
  Avatar,
} from 'antd';
import type { MenuProps } from 'antd';
import { mockWorkCases } from '@/mock/data';
import type { WorkCase, EvidenceItem, EvidenceFolder, EvidenceType } from '@/types/workspace';
import { formatFileSize, formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortMode = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';

const mockFolders: EvidenceFolder[] = [
  { id: 'folder-root', caseId: 'wc-001', name: '全部证据', itemCount: 4, createdAt: '2024-03-10' },
  { id: 'folder-001', caseId: 'wc-001', name: '合同文件', parentId: 'folder-root', itemCount: 2, createdAt: '2024-03-10' },
  { id: 'folder-002', caseId: 'wc-001', name: '沟通记录', parentId: 'folder-root', itemCount: 1, createdAt: '2024-03-12' },
  { id: 'folder-003', caseId: 'wc-001', name: '财务凭证', parentId: 'folder-root', itemCount: 1, createdAt: '2024-03-13' },
  { id: 'folder-004', caseId: 'wc-002', name: '全部证据', itemCount: 2, createdAt: '2024-03-18' },
  { id: 'folder-005', caseId: 'wc-003', name: '全部证据', itemCount: 2, createdAt: '2024-02-01' },
  { id: 'folder-006', caseId: 'wc-004', name: '全部证据', itemCount: 1, createdAt: '2024-01-01' },
];

const getTypeIcon = (type: EvidenceType) => {
  switch (type) {
    case 'document':
      return <FileText className="w-5 h-5 text-primary-500" />;
    case 'image':
      return <Image className="w-5 h-5 text-green-600" />;
    case 'video':
      return <Video className="w-5 h-5 text-purple-600" />;
    case 'audio':
      return <Music className="w-5 h-5 text-orange-600" />;
    case 'archive':
      return <Archive className="w-5 h-5 text-yellow-600" />;
    default:
      return <FileText className="w-5 h-5 text-neutral-ink-500" />;
  }
};

const getTypeBgColor = (type: EvidenceType) => {
  switch (type) {
    case 'document':
      return 'bg-blue-50';
    case 'image':
      return 'bg-green-50';
    case 'video':
      return 'bg-purple-50';
    case 'audio':
      return 'bg-orange-50';
    case 'archive':
      return 'bg-yellow-50';
    default:
      return 'bg-neutral-ink-50';
  }
};

const Evidence: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('wc-001');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-root');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['folder-root']);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const [searchText, setSearchText] = useState('');
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadCaseId, setUploadCaseId] = useState('wc-001');
  const [uploadFolderId, setUploadFolderId] = useState<string | undefined>('folder-root');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadTagInput, setUploadTagInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const currentCase = mockWorkCases.find((c) => c.id === selectedCaseId);
  const allEvidence = useMemo(() => mockWorkCases.flatMap((c) => c.evidence), []);

  const caseFolders = mockFolders.filter((f) => f.caseId === selectedCaseId);

  const buildFolderTreeData = (folders: EvidenceFolder[], parentId?: string) => {
    return folders
      .filter((f) => f.parentId === parentId)
      .map((f) => ({
        key: f.id,
        title: (
          <div
            className={cn(
              'flex items-center gap-2 py-1 px-1 rounded cursor-pointer',
              selectedFolderId === f.id ? 'bg-primary-900/10 text-primary-900 font-medium' : 'hover:bg-neutral-ink-50'
            )}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFolderId(f.id);
            }}
          >
            <FolderOpen className="w-4 h-4 text-accent-gold flex-shrink-0" />
            <span className="truncate text-sm">{f.name}</span>
            <span className="text-xs text-neutral-ink-400 ml-auto">{f.itemCount}</span>
          </div>
        ),
        children: buildFolderTreeData(folders, f.id),
      }));
  };

  const folderTreeData = buildFolderTreeData(caseFolders);

  const filteredEvidence = useMemo(() => {
    let items: EvidenceItem[] = [];

    if (selectedFolderId === 'folder-root') {
      items = currentCase?.evidence || [];
    } else {
      items = (currentCase?.evidence || []).filter((e) => e.folderId === selectedFolderId);
    }

    if (searchText) {
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(searchText.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    const sorted = [...items].sort((a, b) => {
      switch (sortMode) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return b.fileSize - a.fileSize;
        case 'size-asc':
          return a.fileSize - b.fileSize;
        default:
          return 0;
      }
    });

    return sorted;
  }, [currentCase, selectedFolderId, searchText, sortMode]);

  const breadcrumbItems = useMemo(() => {
    const items: { title: React.ReactNode }[] = [{ title: <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />全部证据</span> }];
    if (selectedFolderId !== 'folder-root') {
      const folder = caseFolders.find((f) => f.id === selectedFolderId);
      if (folder?.parentId) {
        const parent = caseFolders.find((f) => f.id === folder.parentId);
        if (parent) {
          items.push({ title: <span>{parent.name}</span> });
        }
      }
      if (folder) {
        items.push({ title: <span className="text-primary-900 font-medium">{folder.name}</span> });
      }
    }
    return items;
  }, [selectedFolderId, caseFolders]);

  const sortMenuItems: MenuProps['items'] = [
    { key: 'date-desc', label: '按上传时间 新→旧' },
    { key: 'date-asc', label: '按上传时间 旧→新' },
    { key: 'name-asc', label: '按文件名 A→Z' },
    { key: 'name-desc', label: '按文件名 Z→A' },
    { key: 'size-desc', label: '按文件大小 大→小' },
    { key: 'size-asc', label: '按文件大小 小→大' },
  ];

  const handleFolderExpand = (keys: React.Key[]) => {
    setExpandedFolders(keys as string[]);
  };

  const handleNewFolder = () => {
    if (!newFolderName.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    message.success(`文件夹"${newFolderName}"创建成功`);
    setNewFolderName('');
    setNewFolderModalOpen(false);
  };

  const handleAddUploadTag = () => {
    if (uploadTagInput.trim() && !uploadTags.includes(uploadTagInput.trim())) {
      setUploadTags([...uploadTags, uploadTagInput.trim()]);
      setUploadTagInput('');
    }
  };

  const handleUpload = () => {
    message.success('文件上传成功');
    setUploadModalOpen(false);
    setUploadTags([]);
  };

  const handleDelete = (item: EvidenceItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件"${item.name}"吗？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        message.success('文件已删除');
        setPreviewItem(null);
      },
    });
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)] min-h-[600px]">
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="lc-card border-0 p-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-3">
            <label className="text-xs font-medium text-neutral-ink-500 mb-1.5 block">选择案件</label>
            <Select
              value={selectedCaseId}
              onChange={(v) => {
                setSelectedCaseId(v);
                setSelectedFolderId('folder-root');
                setExpandedFolders(['folder-root']);
              }}
              className="!w-full"
              options={mockWorkCases.map((c) => ({ value: c.id, label: c.title }))}
              size="small"
            />
          </div>
          <div className="lc-divider my-0" />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold text-neutral-ink-700 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-accent-gold" />
              证据文件夹
            </span>
            <Button
              type="text"
              size="small"
              icon={<FolderPlus className="w-4 h-4" />}
              onClick={() => setNewFolderModalOpen(true)}
            >
              新建
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2">
            <Tree
              treeData={folderTreeData}
              expandedKeys={expandedFolders}
              onExpand={handleFolderExpand}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              switcherIcon={({ expanded }) =>
                expanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-ink-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-ink-400" />
              }
              blockNode
              className="lc-tree-custom"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900 flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-accent-gold" />
            证据库
          </h1>
          <p className="text-neutral-ink-500 mt-1">
            {currentCase?.title} - 统一管理案件证据材料，支持 OCR 识别与在线预览
          </p>
        </div>

        <div className="lc-card border-0 p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <Breadcrumb items={breadcrumbItems} className="!text-sm" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-ink-400" />
                <Input
                  placeholder="搜索文件名或标签"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="!w-56 !pl-9"
                  size="small"
                  allowClear
                />
              </div>
              <Dropdown menu={{ items: sortMenuItems, onClick: ({ key }) => setSortMode(key as SortMode), selectedKeys: [sortMode] }}>
                <Button size="small" icon={<ArrowUpDown className="w-3.5 h-3.5" />}>
                  排序
                </Button>
              </Dropdown>
              <div className="flex items-center bg-neutral-ink-50 rounded p-0.5">
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'text'}
                  size="small"
                  icon={<Grid3x3 className="w-3.5 h-3.5" />}
                  onClick={() => setViewMode('grid')}
                  className={viewMode !== 'grid' ? '!text-neutral-ink-500' : ''}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'text'}
                  size="small"
                  icon={<List className="w-3.5 h-3.5" />}
                  onClick={() => setViewMode('list')}
                  className={viewMode !== 'list' ? '!text-neutral-ink-500' : ''}
                />
              </div>
              <Button
                size="small"
                icon={<FolderPlus className="w-3.5 h-3.5" />}
                onClick={() => setNewFolderModalOpen(true)}
              >
                新建文件夹
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => setUploadModalOpen(true)}
              >
                上传文件
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredEvidence.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Empty description="暂无证据文件" />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredEvidence.map((item) => (
                  <Card
                    key={item.id}
                    hoverable
                    className="!rounded-lg !border-neutral-ink-100 overflow-hidden group cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div className={cn('aspect-[4/3] flex items-center justify-center relative', getTypeBgColor(item.type))}>
                      {item.type === 'image' ? (
                        <img
                          src={`https://picsum.photos/seed/${item.id}/400/300`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="scale-150">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                      {item.ocrText && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-900/80 text-white text-xs">
                            <ScanText className="w-3 h-3" />
                            OCR
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Tooltip title="预览">
                          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                        </Tooltip>
                        <Tooltip title="下载">
                          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </Tooltip>
                        <Tooltip title="分享">
                          <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                            <Share2 className="w-4 h-4 text-white" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm text-neutral-ink-900 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-ink-500">
                        <span>{formatFileSize(item.fileSize)}</span>
                        <span>·</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.tags.slice(0, 2).map((tag) => (
                            <AntTag key={tag} className="!m-0 !text-xs !px-2 !py-0">
                              {tag}
                            </AntTag>
                          ))}
                          {item.tags.length > 2 && (
                            <AntTag className="!m-0 !text-xs !px-2 !py-0">+{item.tags.length - 2}</AntTag>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border border-neutral-ink-100 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-ink-50">
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-12"></th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3">文件名</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-24">类型</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-28">大小</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-32">上传日期</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-32">上传人</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3">标签</th>
                      <th className="text-left text-sm font-semibold text-neutral-ink-600 px-4 py-3 w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvidence.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-neutral-ink-100 hover:bg-primary-900/5 cursor-pointer transition-colors"
                        onClick={() => setPreviewItem(item)}
                      >
                        <td className="px-4 py-3 text-neutral-ink-300">
                          <GripVertical className="w-4 h-4" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-9 h-9 rounded flex items-center justify-center', getTypeBgColor(item.type))}>
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-neutral-ink-900 truncate flex items-center gap-2">
                                {item.name}
                                {item.ocrText && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700">
                                    <ScanText className="w-3 h-3" />
                                    OCR
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-ink-600">
                          {item.type === 'document' ? '文档' : item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : item.type === 'audio' ? '音频' : '压缩包'}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-ink-600">{formatFileSize(item.fileSize)}</td>
                        <td className="px-4 py-3 text-sm text-neutral-ink-600">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar size={20} className="!w-5 !h-5 !text-[10px] !bg-primary-500">
                              {item.uploadedByName?.[0]}
                            </Avatar>
                            <span className="text-sm text-neutral-ink-600">{item.uploadedByName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {item.tags.map((tag) => (
                              <AntTag key={tag} className="!m-0 !text-xs !px-2 !py-0">
                                {tag}
                              </AntTag>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="预览">
                              <Button type="text" size="small" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setPreviewItem(item)} />
                            </Tooltip>
                            <Tooltip title="下载">
                              <Button type="text" size="small" icon={<Download className="w-3.5 h-3.5" />} onClick={() => message.success('开始下载')} />
                            </Tooltip>
                            <Tooltip title="分享">
                              <Button type="text" size="small" icon={<Share2 className="w-3.5 h-3.5" />} onClick={() => message.success('分享链接已复制')} />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button type="text" size="small" danger icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDelete(item)} />
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-500" />
            <span className="font-serif font-semibold">文件预览</span>
          </div>
        }
        open={!!previewItem}
        onCancel={() => setPreviewItem(null)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewItem(null)}>
            关闭
          </Button>,
          <Button
            key="share"
            icon={<Share2 className="w-4 h-4" />}
            onClick={() => {
              message.success('分享链接已复制到剪贴板');
            }}
          >
            分享
          </Button>,
          <Button
            key="delete"
            danger
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => previewItem && handleDelete(previewItem)}
          >
            删除
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => message.success('开始下载')}
          >
            下载文件
          </Button>,
        ]}
      >
        {previewItem && (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className={cn('aspect-[4/3] rounded-lg flex items-center justify-center', getTypeBgColor(previewItem.type))}>
                {previewItem.type === 'image' ? (
                  <img
                    src={`https://picsum.photos/seed/${previewItem.id}/800/600`}
                    alt={previewItem.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="scale-[3]">
                    {getTypeIcon(previewItem.type)}
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-lg font-semibold text-neutral-ink-900">{previewItem.name}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-ink-500">文件大小：</span>
                    <span className="text-neutral-ink-700">{formatFileSize(previewItem.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-ink-500">上传日期：</span>
                    <span className="text-neutral-ink-700">{formatDate(previewItem.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-ink-500">上传人：</span>
                    <span className="text-neutral-ink-700">{previewItem.uploadedByName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-ink-500">文件类型：</span>
                    <span className="text-neutral-ink-700">
                      {previewItem.type === 'document' ? '文档' : previewItem.type === 'image' ? '图片' : previewItem.type === 'video' ? '视频' : previewItem.type === 'audio' ? '音频' : '压缩包'}
                    </span>
                  </div>
                </div>
                {previewItem.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-neutral-ink-500 text-sm">标签：</span>
                    <div className="inline-flex gap-1 ml-1 flex-wrap">
                      {previewItem.tags.map((tag) => (
                        <AntTag key={tag} className="!m-0 !text-xs">
                          <Tag className="w-3 h-3 inline mr-0.5" />
                          {tag}
                        </AntTag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-neutral-ink-100">
                <ScanText className="w-4 h-4 text-primary-500" />
                <span className="font-semibold text-sm text-neutral-ink-800">OCR 文字识别</span>
                {previewItem.ocrText ? (
                  <AntTag color="success" className="!m-0 ml-auto !text-xs">已识别</AntTag>
                ) : (
                  <AntTag className="!m-0 ml-auto !text-xs">未识别</AntTag>
                )}
              </div>
              {previewItem.ocrText ? (
                <div className="border border-neutral-ink-100 rounded-lg p-4 bg-neutral-ivory max-h-96 overflow-y-auto">
                  <p className="text-sm leading-relaxed text-neutral-ink-700 whitespace-pre-wrap">
                    {previewItem.ocrText}
                  </p>
                </div>
              ) : (
                <div className="border border-dashed border-neutral-ink-200 rounded-lg p-8 text-center bg-neutral-ivory/50">
                  <ScanText className="w-10 h-10 mx-auto mb-3 text-neutral-ink-300" />
                  <p className="text-sm text-neutral-ink-500 mb-3">该文件暂未进行 OCR 识别</p>
                  <Button type="primary" size="small">开始识别</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-500" />
            <span className="font-serif font-semibold">上传证据文件</span>
          </div>
        }
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        width={560}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalOpen(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleUpload}>
            确认上传
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
              isDragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-ink-200 hover:border-primary-500 hover:bg-neutral-ivory'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              message.success(`已添加 ${e.dataTransfer.files.length} 个文件`);
            }}
            onClick={() => message.info('请选择要上传的文件')}
          >
            <Upload className={cn('w-10 h-10 mx-auto mb-3', isDragOver ? 'text-primary-500' : 'text-neutral-ink-400')} />
            <p className="text-sm font-medium text-neutral-ink-700">
              {isDragOver ? '松开鼠标上传文件' : '将文件拖拽到此处，或点击选择文件'}
            </p>
            <p className="text-xs text-neutral-ink-500 mt-1">
              支持 PDF、Word、Excel、图片、视频等格式，单文件最大 500MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-ink-500 mb-1.5 block">所属案件</label>
              <Select
                value={uploadCaseId}
                onChange={setUploadCaseId}
                className="!w-full"
                options={mockWorkCases.map((c) => ({ value: c.id, label: c.title }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-ink-500 mb-1.5 block">目标文件夹</label>
              <Select
                value={uploadFolderId}
                onChange={setUploadFolderId}
                className="!w-full"
                allowClear
                options={mockFolders
                  .filter((f) => f.caseId === uploadCaseId)
                  .map((f) => ({ value: f.id, label: f.name }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-ink-500 mb-1.5 block">添加标签</label>
            <div className="flex items-center gap-2 flex-wrap">
              {uploadTags.map((tag) => (
                <AntTag
                  key={tag}
                  closable
                  onClose={() => setUploadTags(uploadTags.filter((t) => t !== tag))}
                  className="!m-0"
                >
                  {tag}
                </AntTag>
              ))}
              <Input
                size="small"
                placeholder="输入标签后按回车"
                value={uploadTagInput}
                onChange={(e) => setUploadTagInput(e.target.value)}
                onPressEnter={handleAddUploadTag}
                className="!w-36"
                suffix={
                  <Plus
                    className="w-3.5 h-3.5 text-neutral-ink-400 cursor-pointer hover:text-primary-500"
                    onClick={handleAddUploadTag}
                  />
                }
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-primary-500" />
            <span className="font-serif font-semibold">新建文件夹</span>
          </div>
        }
        open={newFolderModalOpen}
        onCancel={() => {
          setNewFolderModalOpen(false);
          setNewFolderName('');
        }}
        width={420}
        footer={[
          <Button key="cancel" onClick={() => { setNewFolderModalOpen(false); setNewFolderName(''); }}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleNewFolder}>
            创建
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-ink-500 mb-1.5 block">文件夹名称</label>
            <Input
              placeholder="请输入文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onPressEnter={handleNewFolder}
            />
          </div>
          <div className="p-3 bg-neutral-ivory rounded-lg text-xs text-neutral-ink-500">
            <div className="flex items-start gap-2">
              <FolderOpen className="w-4 h-4 flex-shrink-0 text-accent-gold mt-0.5" />
              <span>文件夹将创建在当前案件"{currentCase?.title}"下</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Evidence;
