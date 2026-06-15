import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TemplateCategory, ResumeTemplate } from '../types';
import { useResumeStore } from '../store/resumeStore';
import { resumeTemplates } from '../data/templates';

type FilterCategory = TemplateCategory | 'all' | 'blank';

const categoryMap: Record<string, FilterCategory> = {
  '全部': 'all',
  '技术岗': 'tech',
  '设计岗': 'design',
  '职能岗': 'function',
};

const categoryLabelMap: Record<string, string> = {
  tech: '技术岗',
  design: '设计岗',
  function: '职能岗',
  blank: '空白',
};

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const navigate = useNavigate();
  const createAndSaveResume = useResumeStore(state => state.createAndSaveResume);

  const categories = ['全部', '技术岗', '设计岗', '职能岗'];

  const filteredTemplates = activeCategory === 'all'
    ? resumeTemplates
    : resumeTemplates.filter(t => t.category === activeCategory);

  const handleUseTemplate = async (template: ResumeTemplate) => {
    const category = template.category === 'blank' ? 'tech' : template.category;
    const resume = await createAndSaveResume(template.id, category, template.modules, template.theme);
    if (resume) navigate(`/editor/${resume.id}`);
  };

  const renderPreview = (template: ResumeTemplate) => {
    const moduleLabels = template.modules
      .filter(m => m.visible)
      .map(m => {
        switch (m.type) {
          case 'basic': return '基本信息';
          case 'education': return '教育背景';
          case 'experience': return '工作经历';
          case 'project': return '项目经验';
          case 'skills': return '专业技能';
          case 'selfEvaluation': return '自我评价';
          default: return m.type;
        }
      });

    return (
      <div className="aspect-[210/297] rounded-lg overflow-hidden relative bg-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor} 100%)`,
          }}
        />
        <div className="relative z-10 p-4 h-full flex flex-col gap-2">
          <div
            className="h-8 rounded"
            style={{ backgroundColor: template.theme.primaryColor }}
          />
          {moduleLabels.slice(0, 4).map((label, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div
                className="h-3 w-1/3 rounded"
                style={{ backgroundColor: template.theme.primaryColor }}
              />
              <div className="h-2 w-full rounded bg-gray-200" />
              <div className="h-2 w-5/6 rounded bg-gray-200" />
              <div className="h-2 w-4/6 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            选择行业模板
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            根据求职方向，选择最适合你的简历模板，内容结构与表达风格已为你优化
          </p>
        </div>

        <div className="flex justify-center gap-2 md:gap-4 mb-10 flex-wrap">
          {categories.map((cat) => {
            const value = categoryMap[cat];
            const isActive = activeCategory === value;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(value)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-amber-400 group"
            >
              <div className="p-4 pb-2">
                {renderPreview(template)}
              </div>
              <div className="p-5 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">
                    {template.name}
                  </h3>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${template.theme.primaryColor}15`,
                      color: template.theme.primaryColor,
                    }}
                  >
                    {categoryLabelMap[template.category]}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {template.description}
                </p>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 active:scale-95"
                >
                  使用此模板
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
