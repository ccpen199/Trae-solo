import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Code2,
  Palette,
  Briefcase,
  FileText,
  Sparkles,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { resumeTemplates } from '../data/templates';
import { addAuditLog } from '../utils/audit';
import type { ResumeTemplate, TemplateCategory } from '../types';
import { cn } from '../lib/utils';

type FilterCategory = TemplateCategory | 'all';

const categoryHighlightFields: Record<string, string[]> = {
  tech: ['项目指标', '技术栈标签', 'GitHub链接', 'STAR成果表达'],
  design: ['作品集链接', 'Behance/Dribbble', '设计工具列', '视觉规范组件'],
  function: ['流程优化成果', '供应商管理', '预算节省数据', 'SLA指标'],
  blank: ['完全自定义'],
};

const categoryConfig: Record<string, { icon: typeof Code2; label: string; badgeClass: string }> = {
  tech: { icon: Code2, label: '技术岗', badgeClass: 'bg-navy-50 text-navy-600' },
  design: { icon: Palette, label: '设计岗', badgeClass: 'bg-emerald-50 text-emerald-600' },
  function: { icon: Briefcase, label: '职能岗', badgeClass: 'bg-gold-50 text-gold-600' },
  blank: { icon: FileText, label: '空白模板', badgeClass: 'bg-slate-50 text-slate-600' },
};

const filterCategories: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'tech', label: '技术岗' },
  { key: 'design', label: '设计岗' },
  { key: 'function', label: '职能岗' },
];

export default function Templates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') as FilterCategory | null;
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(urlCategory || 'all');
  const navigate = useNavigate();
  const createAndSaveResume = useResumeStore((state) => state.createAndSaveResume);

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  const handleFilterChange = (category: FilterCategory) => {
    setActiveCategory(category);
    if (category === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category });
    }
  };

  const filteredTemplates =
    activeCategory === 'all'
      ? resumeTemplates
      : resumeTemplates.filter((t) => t.category === activeCategory);

  const handleUseTemplate = async (template: ResumeTemplate) => {
    const category =
      template.category === 'blank' ? 'tech' : (template.category as TemplateCategory);
    const resume = await createAndSaveResume(
      template.id,
      category,
      template.modules,
      template.theme,
    );
    if (resume) {
      await addAuditLog('template.use', { templateId: template.id, templateName: template.name, resumeId: resume.id });
      navigate(`/editor/${resume.id}`);
    }
  };

  const renderPreview = (template: ResumeTemplate) => {
    return (
      <div className="aspect-[210/297] rounded-lg overflow-hidden relative bg-white">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor} 100%)`,
          }}
        />
        <div className="relative z-10 p-3 h-full flex flex-col gap-2">
          <div
            className="h-6 rounded"
            style={{ backgroundColor: template.theme.primaryColor }}
          />
          <div className="flex items-center gap-2 mt-1">
            <div
              className="h-2 w-16 rounded-full"
              style={{ backgroundColor: template.theme.secondaryColor }}
            />
            <div className="h-2 w-12 rounded-full bg-gray-200" />
            <div className="h-2 w-10 rounded-full bg-gray-200" />
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <div
              className="h-2.5 w-1/3 rounded"
              style={{ backgroundColor: template.theme.primaryColor }}
            />
            <div className="h-2 w-full rounded bg-gray-200" />
            <div className="h-2 w-5/6 rounded bg-gray-200" />
            <div className="h-2 w-4/6 rounded bg-gray-200" />
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            <div
              className="h-2.5 w-1/3 rounded"
              style={{ backgroundColor: template.theme.primaryColor }}
            />
            <div className="h-2 w-full rounded bg-gray-200" />
            <div className="h-2 w-5/6 rounded bg-gray-200" />
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            <div
              className="h-2.5 w-1/4 rounded"
              style={{ backgroundColor: template.theme.primaryColor }}
            />
            <div className="flex gap-1.5 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-4 rounded px-2"
                  style={{ backgroundColor: `${template.theme.secondaryColor}30` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-gold-50/40">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-50 border border-gold-200/60 mb-6">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-medium text-gold-700">智能语义匹配</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700 mb-4">
            选择行业语义模板
          </h1>
          <p className="text-navy-400 max-w-2xl mx-auto text-base md:text-lg">
            根据求职方向，选择最适合你的简历模板。每个模板内置行业专属语义字段，
            让你的简历表达更专业、更有说服力
          </p>
        </div>

        <div className="flex justify-center gap-2 md:gap-3 mb-10 flex-wrap">
          {filterCategories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleFilterChange(cat.key)}
                className={cn(
                  'px-5 py-2.5 rounded-full font-medium transition-all duration-300',
                  isActive
                    ? 'bg-navy-600 text-white shadow-glow scale-105 border border-gold-500/50'
                    : 'bg-white text-navy-500 hover:bg-navy-50 border border-navy-100 hover:border-gold-300',
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => {
            const config = categoryConfig[template.category];
            const Icon = config.icon;
            const highlights = categoryHighlightFields[template.category] || [];

            return (
              <div
                key={template.id}
                className="card card-hover overflow-hidden group"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-2/5 p-4 pb-0 sm:p-4 bg-gradient-to-br from-gray-50 to-white">
                    {renderPreview(template)}
                  </div>

                  <div className="sm:w-3/5 p-5 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${template.theme.primaryColor}12`,
                          }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: template.theme.primaryColor }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-navy-700">
                            {template.name}
                          </h3>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full font-medium',
                          config.badgeClass,
                        )}
                      >
                        {config.label}
                      </span>
                    </div>

                    <p className="text-sm text-navy-400 leading-relaxed mb-4">
                      {template.description}
                    </p>

                    <div className="mb-5">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                        <span className="text-xs font-medium text-navy-500">
                          语义字段亮点
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {highlights.map((field, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-sm"
                          >
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${template.theme.primaryColor}15`,
                              }}
                            >
                              <Check
                                className="w-2.5 h-2.5"
                                style={{ color: template.theme.primaryColor }}
                              />
                            </div>
                            <span className="text-navy-600 text-sm">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="btn-primary w-full inline-flex items-center justify-center gap-2"
                      >
                        {template.category === 'blank' ? (
                          <Plus className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        使用此模板
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
