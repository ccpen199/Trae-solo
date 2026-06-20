import React, { useMemo, useState } from 'react';
import {
  Download,
  Trash2,
  FileJson,
  FileSpreadsheet,
  FileText,
  User,
  Image,
  Calendar,
  MessageSquare,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { cn } from '@/lib/utils';

type ExportFormat = 'json' | 'csv' | 'pdf';

interface DataCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  estimatedSize: string;
}

const DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'profile',
    label: '个人资料',
    description: '基本信息、身体数据、技能标签等',
    icon: <User className="w-5 h-5" />,
    estimatedSize: '~50KB',
  },
  {
    id: 'photos',
    label: '照片资料',
    description: '所有上传的照片、视频、模卡图片',
    icon: <Image className="w-5 h-5" />,
    estimatedSize: '~120MB',
  },
  {
    id: 'castings',
    label: '试镜申请',
    description: '申请记录、试镜结果、沟通记录',
    icon: <Briefcase className="w-5 h-5" />,
    estimatedSize: '~200KB',
  },
  {
    id: 'messages',
    label: '消息记录',
    description: '与经纪公司、品牌的聊天记录',
    icon: <MessageSquare className="w-5 h-5" />,
    estimatedSize: '~500KB',
  },
  {
    id: 'schedule',
    label: '日程安排',
    description: '工作档期、日程规划、历史记录',
    icon: <Calendar className="w-5 h-5" />,
    estimatedSize: '~100KB',
  },
];

interface ExportHistoryItem {
  id: string;
  categories: string[];
  format: ExportFormat;
  createdAt: Date;
  status: 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  fileSize?: string;
}

const mockExportHistory: ExportHistoryItem[] = [
  {
    id: 'exp-1',
    categories: ['profile', 'photos', 'schedule'],
    format: 'json',
    createdAt: new Date('2024-12-01'),
    status: 'expired',
    fileSize: '118.5 MB',
  },
  {
    id: 'exp-2',
    categories: ['profile', 'castings'],
    format: 'csv',
    createdAt: new Date('2024-11-15'),
    status: 'expired',
    fileSize: '186 KB',
  },
];

type DeletionStep = 0 | 1 | 2 | 3 | 4;
const DELETION_REASONS = [
  '不再使用该平台',
  '隐私保护考虑',
  '找到了更好的替代平台',
  '账户数据需要清理',
  '其他原因',
];

const DataExportDelete: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['profile']);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>(mockExportHistory);

  const [deletionStep, setDeletionStep] = useState<DeletionStep>(0);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionPassword, setDeletionPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [deletionPhase, setDeletionPhase] = useState('');

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    const newExport: ExportHistoryItem = {
      id: `exp-${Date.now()}`,
      categories: selectedCategories,
      format: exportFormat,
      createdAt: new Date(),
      status: 'processing',
    };
    setExportHistory([newExport, ...exportHistory]);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setExportProgress(i);
    }

    setExportHistory((prev) =>
      prev.map((item) =>
        item.id === newExport.id
          ? { ...item, status: 'ready', fileSize: '~45.2 MB', downloadUrl: '#' }
          : item
      )
    );
    setIsExporting(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const phases = [
      '正在验证身份...',
      '正在撤销所有授权...',
      '正在删除个人资料...',
      '正在删除媒体文件...',
      '正在清除消息记录...',
      '正在完成数据清理...',
    ];

    for (let i = 0; i < phases.length; i++) {
      setDeletionPhase(phases[i]);
      setDeletionProgress(Math.round(((i + 1) / phases.length) * 100));
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setIsDeleting(false);
    setDeletionStep(4);
  };

  const deletionSteps = useMemo(
    () => [
      { id: 0, title: '了解后果', description: '确认删除将影响的数据' },
      { id: 1, title: '备份数据', description: '建议先下载您的数据' },
      { id: 2, title: '删除原因', description: '告诉我们为什么要离开' },
      { id: 3, title: '最终确认', description: '输入密码确认删除' },
    ],
    []
  );

  const formatOptions = [
    { id: 'json' as ExportFormat, label: 'JSON', icon: <FileJson className="w-5 h-5" />, description: '结构化数据，适合开发使用' },
    { id: 'csv' as ExportFormat, label: 'CSV', icon: <FileSpreadsheet className="w-5 h-5" />, description: '表格格式，可用Excel打开' },
    { id: 'pdf' as ExportFormat, label: 'PDF', icon: <FileText className="w-5 h-5" />, description: '文档格式，便于阅读和存档' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Download className="w-8 h-8 text-rose-500" />
            数据导出与账户管理
          </h1>
          <p className="text-midnight-300">
            GDPR 第15-17条、第20条 - 数据可携带权与被遗忘权
          </p>
        </div>

        <Tabs defaultValue="export">
          <TabsList className="mb-6">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              下载我的数据
            </TabsTrigger>
            <TabsTrigger value="delete" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              删除我的账户
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card variant="glass" className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-rose-500" />
                      选择导出的数据类别
                    </CardTitle>
                    <CardDescription>选择您希望导出的个人数据类型</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DATA_CATEGORIES.map((category) => (
                      <div
                        key={category.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer',
                          selectedCategories.includes(category.id)
                            ? 'border-rose-500/50 bg-rose-500/5'
                            : 'border-midnight-700 bg-midnight-900/50 hover:border-midnight-600'
                        )}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          selectedCategories.includes(category.id)
                            ? 'bg-gradient-to-r from-rose-500 to-rose-400 text-white'
                            : 'bg-midnight-700 text-midnight-300'
                        )}>
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{category.label}</p>
                          <p className="text-sm text-midnight-400">{category.description}</p>
                        </div>
                        <span className="text-sm text-midnight-500">{category.estimatedSize}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-sapphire-500" />
                      选择导出格式
                    </CardTitle>
                    <CardDescription>选择您希望的数据文件格式</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {formatOptions.map((opt) => (
                          <label
                            key={opt.id}
                            className={cn(
                              'flex flex-col items-center gap-2 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300',
                              exportFormat === opt.id
                                ? 'border-rose-500 bg-rose-500/10'
                                : 'border-midnight-700 bg-midnight-900/50 hover:border-midnight-600'
                            )}
                          >
                            <RadioGroupItem value={opt.id} className="sr-only" />
                            <div className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center mb-1',
                              exportFormat === opt.id
                                ? 'bg-gradient-to-r from-rose-500 to-rose-400 text-white'
                                : 'bg-midnight-700 text-midnight-300'
                            )}>
                              {opt.icon}
                            </div>
                            <span className="font-medium text-white">{opt.label}</span>
                            <span className="text-xs text-midnight-400 text-center">
                              {opt.description}
                            </span>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <CardHeader>
                    <CardTitle>导出示例</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-midnight-400">已选择类别</span>
                        <span className="text-white font-medium">{selectedCategories.length}/{DATA_CATEGORIES.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCategories.length === 0 ? (
                          <span className="text-sm text-midnight-500">未选择</span>
                        ) : (
                          selectedCategories.map((id) => {
                            const cat = DATA_CATEGORIES.find((c) => c.id === id);
                            return cat ? (
                              <Badge key={id} variant="primary" size="sm">{cat.label}</Badge>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-midnight-400">文件格式</span>
                        <span className="text-white font-medium uppercase">{exportFormat}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-midnight-400">预估大小</span>
                        <span className="text-white font-medium">~50 MB</span>
                      </div>
                    </div>

                    {isExporting && (
                      <div className="space-y-2 pt-4 border-t border-midnight-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-midnight-300 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                            正在生成导出文件...
                          </span>
                          <span className="text-rose-400 font-medium">{exportProgress}%</span>
                        </div>
                        <Progress value={exportProgress} />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      leftIcon={<Download className="w-4 h-4" />}
                      loading={isExporting}
                      disabled={selectedCategories.length === 0}
                      onClick={handleExport}
                    >
                      {isExporting ? '生成中...' : '生成下载链接'}
                    </Button>
                  </CardContent>
                </Card>

                <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      历史导出记录
                    </CardTitle>
                    <CardDescription>下载链接7天后自动过期</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {exportHistory.length === 0 ? (
                      <p className="text-sm text-midnight-400 text-center py-4">
                        暂无导出记录
                      </p>
                    ) : (
                      exportHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700"
                        >
                          <div className="w-8 h-8 rounded-lg bg-midnight-700 flex items-center justify-center text-midnight-300">
                            {item.format === 'json' ? (
                              <FileJson className="w-4 h-4" />
                            ) : item.format === 'csv' ? (
                              <FileSpreadsheet className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {item.categories.length} 类数据 · {item.format.toUpperCase()}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-midnight-400">
                              <span>
                                {format(new Date(item.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                              </span>
                              {item.fileSize && <span>· {item.fileSize}</span>}
                            </div>
                          </div>
                          {item.status === 'ready' ? (
                            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                              下载
                            </Button>
                          ) : item.status === 'processing' ? (
                            <Badge variant="warning" size="sm" dot>
                              处理中
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              已过期
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delete">
            <Card variant="glass" className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                  删除我的账户
                </CardTitle>
                <CardDescription>
                  账户删除是不可逆操作，请谨慎操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deletionStep < 4 ? (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      {deletionSteps.map((step, index) => (
                        <React.Fragment key={step.id}>
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                                deletionStep >= step.id
                                  ? 'bg-gradient-primary text-white shadow-button'
                                  : 'bg-midnight-700 text-midnight-400'
                              )}
                            >
                              {deletionStep > step.id ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                step.id + 1
                              )}
                            </div>
                            <div className="text-center">
                              <p className={cn(
                                'text-sm font-medium',
                                deletionStep >= step.id ? 'text-white' : 'text-midnight-400'
                              )}>
                                {step.title}
                              </p>
                              <p className="text-xs text-midnight-500 hidden sm:block">
                                {step.description}
                              </p>
                            </div>
                          </div>
                          {index < deletionSteps.length - 1 && (
                            <div className={cn(
                              'flex-1 h-0.5 mx-2 max-w-20',
                              deletionStep > step.id ? 'bg-gradient-primary' : 'bg-midnight-700'
                            )} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {deletionStep === 0 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-red-300 mb-2">删除账户将导致以下后果</h4>
                              <ul className="space-y-1.5 text-sm text-red-200/80">
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  您的个人资料将被永久删除，无法恢复
                                </li>
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  所有上传的照片、视频和媒体文件将被清除
                                </li>
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  试镜申请记录和历史将被清除
                                </li>
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  所有消息记录将被删除
                                </li>
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  已授予第三方的所有数据访问权限将被撤销
                                </li>
                                <li className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4" />
                                  账户删除后无法通过相同邮箱重新注册（30天冻结期）
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="danger"
                            onClick={() => setDeletionStep(1)}
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            我已了解，继续
                          </Button>
                        </div>
                      </div>
                    )}

                    {deletionStep === 1 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="rounded-xl bg-midnight-800/50 border border-midnight-700 p-5">
                          <div className="flex items-start gap-3">
                            <Download className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-white mb-2">建议：先下载您的数据</h4>
                              <p className="text-sm text-midnight-300 mb-4">
                                删除前建议您下载一份个人数据副本以便留存。
                                您可以在"下载我的数据"标签页中操作。
                              </p>
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Download className="w-4 h-4" />}
                                onClick={() => {
                                  const tabs = document.querySelector('[data-state] [data-value="export"]');
                                  if (tabs) (tabs as HTMLElement).click();
                                }}
                              >
                                前往下载数据
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" onClick={() => setDeletionStep(0)}>
                            上一步
                          </Button>
                          <Button variant="danger" onClick={() => setDeletionStep(2)} rightIcon={<ChevronRight className="w-4 h-4" />}>
                            继续删除流程
                          </Button>
                        </div>
                      </div>
                    )}

                    {deletionStep === 2 && (
                      <div className="space-y-6 animate-fade-in">
                        <div>
                          <label className="block text-sm font-medium text-midnight-200 mb-3">
                            请告诉我们您为什么要删除账户（可选）
                          </label>
                          <div className="space-y-2">
                            {DELETION_REASONS.map((reason) => (
                              <label
                                key={reason}
                                className={cn(
                                  'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300',
                                  deletionReason === reason
                                    ? 'border-rose-500/50 bg-rose-500/5'
                                    : 'border-midnight-700 bg-midnight-900/50 hover:border-midnight-600'
                                )}
                                onClick={() => setDeletionReason(reason)}
                              >
                                <div
                                  className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                                    deletionReason === reason
                                      ? 'border-rose-500'
                                      : 'border-midnight-600'
                                  )}
                                >
                                  {deletionReason === reason && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-primary" />
                                  )}
                                </div>
                                <span className="text-midnight-100">{reason}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" onClick={() => setDeletionStep(1)}>
                            上一步
                          </Button>
                          <Button variant="danger" onClick={() => setDeletionStep(3)} rightIcon={<ChevronRight className="w-4 h-4" />}>
                            继续
                          </Button>
                        </div>
                      </div>
                    )}

                    {deletionStep === 3 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-5 mb-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-red-300 mb-1">最终确认</h4>
                              <p className="text-sm text-red-200/80">
                                此操作不可撤销。输入您的账户密码以确认删除。
                              </p>
                            </div>
                          </div>
                        </div>

                        <Input
                          label="账户密码"
                          type="password"
                          placeholder="请输入密码以确认删除"
                          value={deletionPassword}
                          onChange={(e) => setDeletionPassword(e.target.value)}
                        />

                        {isDeleting && (
                          <div className="space-y-3 p-5 rounded-xl bg-midnight-800/50 border border-midnight-700">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                              <span className="text-white font-medium">{deletionPhase}</span>
                              <span className="text-rose-400 ml-auto">{deletionProgress}%</span>
                            </div>
                            <Progress value={deletionProgress} />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Button variant="outline" onClick={() => setDeletionStep(2)} disabled={isDeleting}>
                            上一步
                          </Button>
                          <Button
                            variant="danger"
                            loading={isDeleting}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            disabled={!deletionPassword || isDeleting}
                            onClick={handleDeleteAccount}
                          >
                            {isDeleting ? '正在删除...' : '确认删除账户'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">账户删除请求已提交</h3>
                    <p className="text-midnight-300 mb-6 max-w-md mx-auto">
                      您的账户删除请求已成功提交。我们将在30天内完成数据清理，
                      在此期间您仍可登录账户撤销删除请求。
                    </p>
                    <div className="rounded-xl bg-midnight-800/50 border border-midnight-700 p-4 max-w-sm mx-auto">
                      <p className="text-sm text-midnight-400">删除确认邮件已发送至</p>
                      <p className="text-white font-medium">user@example.com</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataExportDelete;
