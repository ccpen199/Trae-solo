import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Eye,
  FileText,
  FolderOpen,
  FileDown,
  Clock,
  Star,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { Card, Input, Tag, Button, Empty, Spin, Modal, message } from 'antd';
import { DocumentTemplate } from '@/types';
import { toolsApi } from '@/services/tools';
import { formatFileSize, formatDate } from '@/utils/format';
import { saveAs } from 'file-saver';

const categories = [
  { key: 'all', name: '全部模板', icon: <FolderOpen className="w-4 h-4" /> },
  { key: '诉讼文书', name: '诉讼文书', icon: <FileText className="w-4 h-4" /> },
  { key: '合同范本', name: '合同范本', icon: <FileText className="w-4 h-4" /> },
  { key: '法律文书', name: '法律文书', icon: <FileText className="w-4 h-4" /> },
  { key: '公司法律', name: '公司法律', icon: <FileText className="w-4 h-4" /> },
  { key: '知识产权', name: '知识产权', icon: <FileText className="w-4 h-4" /> },
  { key: '劳动人事', name: '劳动人事', icon: <FileText className="w-4 h-4" /> },
];

const fileTypeColors: Record<string, string> = {
  docx: 'bg-blue-50 text-blue-600 border-blue-200',
  pdf: 'bg-red-50 text-red-600 border-red-200',
};

const TemplateCard: React.FC<{
  template: DocumentTemplate;
  onPreview: (tpl: DocumentTemplate) => void;
  onDownload: (tpl: DocumentTemplate) => void;
}> = ({ template, onPreview, onDownload }) => {
  return (
    <Card
      className="lc-card border-0 hover:shadow-card-hover transition-all duration-300 group"
      bodyStyle={{ padding: 0 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${fileTypeColors[template.fileType] || fileTypeColors.docx}`}>
            <FileText className="w-6 h-6" />
          </div>
          <Tag color="gold" className="!text-xs !py-0.5 !m-0 flex-shrink-0">
            {template.category}
          </Tag>
        </div>

        <h3 className="font-serif text-base font-semibold text-primary-900 mb-1.5 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {template.name}
        </h3>
        <p className="text-sm text-neutral-ink-500 line-clamp-2 mb-4 min-h-[40px]">
          {template.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-neutral-ink-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(template.createdAt)}
          </span>
          <span>·</span>
          <span>{formatFileSize(template.fileSize)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {template.downloadCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-neutral-ink-100">
          <Button
            type="text"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => onPreview(template)}
            className="!flex-1 !h-9 !text-sm hover:!bg-primary-50 hover:!text-primary-600"
          >
            预览
          </Button>
          <Button
            type="primary"
            icon={<FileDown className="w-4 h-4" />}
            onClick={() => onDownload(template)}
            className="!flex-1 !h-9 !text-sm"
          >
            下载
          </Button>
        </div>
      </div>
    </Card>
  );
};

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewTpl, setPreviewTpl] = useState<DocumentTemplate | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await toolsApi.getTemplateList({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          keyword: searchText || undefined,
        });
        setTemplates(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [selectedCategory, searchText]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = { all: 0 };
    templates.forEach(t => {
      stats.all++;
      stats[t.category] = (stats[t.category] || 0) + 1;
    });
    return stats;
  }, [templates]);

  const handlePreview = (tpl: DocumentTemplate) => {
    setPreviewTpl(tpl);
  };

  const handleDownload = async (tpl: DocumentTemplate) => {
    setDownloading(tpl.id);
    try {
      const blob = await toolsApi.downloadTemplate(tpl.id);
      saveAs(blob, `${tpl.name}.${tpl.fileType}`);
      message.success('下载成功');
    } catch {
      message.error('下载失败');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">法律文书模板</h1>
          <p className="text-neutral-ink-500 mt-1">海量专业法律文书模板，一键下载使用</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-ink-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-ink-500 hover:text-primary-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-ink-500 hover:text-primary-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Card className="lc-card border-0 p-2">
            <div className="px-3 py-2 mb-1">
              <div className="text-sm font-semibold text-neutral-ink-700 flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-primary-500" />
                模板分类
              </div>
            </div>
            <div className="space-y-0.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedCategory === cat.key
                      ? 'bg-primary-900 text-white'
                      : 'hover:bg-primary-900/5 text-neutral-ink-700'
                  }`}
                >
                  <span className={selectedCategory === cat.key ? 'text-white/80' : 'text-primary-500'}>
                    {cat.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === cat.key
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-ink-100 text-neutral-ink-500'
                  }`}>
                    {categoryStats[cat.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lc-card border-0 mt-6">
            <div className="text-sm font-semibold text-neutral-ink-700 flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-accent-gold" />
              热门下载
            </div>
            <div className="space-y-3">
              {templates
                .sort((a, b) => b.downloadCount - a.downloadCount)
                .slice(0, 5)
                .map((tpl, idx) => (
                  <div
                    key={tpl.id}
                    onClick={() => handlePreview(tpl)}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-ink-50 cursor-pointer transition-colors"
                  >
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-accent-gold text-white' :
                      idx === 1 ? 'bg-neutral-ink-400 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      'bg-neutral-ink-100 text-neutral-ink-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-ink-900 line-clamp-1">{tpl.name}</div>
                      <div className="text-xs text-neutral-ink-500 mt-0.5 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {tpl.downloadCount.toLocaleString()} 次下载
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-9">
          <div className="mb-4">
            <Input
              size="large"
              prefix={<Search className="w-4 h-4 text-neutral-ink-400" />}
              placeholder="搜索模板名称、描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="lc-input !pl-4"
            />
          </div>

          <Spin spinning={loading}>
            {templates.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              ) : (
                <Card className="lc-card border-0" bodyStyle={{ padding: 0 }}>
                  {templates.map((tpl, idx) => (
                    <div
                      key={tpl.id}
                      className={`flex items-center gap-4 p-4 hover:bg-neutral-ink-50 transition-colors ${
                        idx !== templates.length - 1 ? 'border-b border-neutral-ink-100' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0 ${fileTypeColors[tpl.fileType] || fileTypeColors.docx}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-ink-900">{tpl.name}</span>
                          <Tag color="gold" className="!text-xs !py-0 !m-0">{tpl.category}</Tag>
                        </div>
                        <p className="text-sm text-neutral-ink-500 line-clamp-1">{tpl.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-ink-500 flex-shrink-0">
                        <span>{formatFileSize(tpl.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {tpl.downloadCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button type="text" icon={<Eye className="w-4 h-4" />} onClick={() => handlePreview(tpl)}>
                          预览
                        </Button>
                        <Button
                          type="primary"
                          icon={<FileDown className="w-4 h-4" />}
                          loading={downloading === tpl.id}
                          onClick={() => handleDownload(tpl)}
                        >
                          下载
                        </Button>
                      </div>
                    </div>
                  ))}
                </Card>
              )
            ) : (
              <Card className="lc-card border-0">
                <Empty description="暂无匹配的模板" className="py-16" />
              </Card>
            )}
          </Spin>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${fileTypeColors[previewTpl?.fileType || 'docx']}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-primary-900">{previewTpl?.name}</div>
              <div className="text-xs text-neutral-ink-500">{previewTpl?.category}</div>
            </div>
          </div>
        }
        open={!!previewTpl}
        onCancel={() => setPreviewTpl(null)}
        footer={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-neutral-ink-500">
              <span>{formatDate(previewTpl?.createdAt)}</span>
              <span>·</span>
              <span>{formatFileSize(previewTpl?.fileSize)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {previewTpl?.downloadCount.toLocaleString()} 次下载
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPreviewTpl(null)}>关闭</Button>
              <Button
                type="primary"
                icon={<FileDown className="w-4 h-4" />}
                loading={!!previewTpl && downloading === previewTpl.id}
                onClick={() => previewTpl && handleDownload(previewTpl)}
              >
                下载模板
              </Button>
            </div>
          </div>
        }
        width={720}
      >
        {previewTpl && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-ivory rounded-lg">
              <p className="text-sm text-neutral-ink-700 mb-0">{previewTpl.description}</p>
            </div>
            <div className="p-6 bg-white border border-neutral-ink-200 rounded-lg min-h-[300px]">
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif font-bold text-primary-900">{previewTpl.name}</h2>
              </div>
              <div className="space-y-4 text-sm text-neutral-ink-700 leading-relaxed">
                <p>【说明】以下为模板内容预览，完整内容请下载后使用。</p>
                <p>一、当事人信息</p>
                <p className="pl-4">原告：___________，性别____，____年____月____日出生，民族____，住址________________，身份证号________________，联系电话________________。</p>
                <p className="pl-4">被告：___________，性别____，____年____月____日出生，民族____，住址________________，身份证号________________，联系电话________________。</p>
                <p>二、诉讼请求</p>
                <p className="pl-4">1. 请求判令被告________________；</p>
                <p className="pl-4">2. 请求判令被告承担本案诉讼费用。</p>
                <p>三、事实与理由</p>
                <p className="pl-4">________________（简述案件事实与理由）</p>
                <p className="text-right mt-8">此致</p>
                <p className="text-right">________人民法院</p>
                <p className="text-right mt-8">具状人：________</p>
                <p className="text-right">____年____月____日</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplatesPage;
