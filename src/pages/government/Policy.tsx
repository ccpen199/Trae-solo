import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Filter, Calendar, Tag, ChevronDown, ChevronUp, Sparkles, Users, ClipboardList, Lightbulb, X, ArrowLeft } from 'lucide-react';
import { api } from '@/api/client';
import type { PolicyDocument, PolicySection } from '../../../shared/types';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', name: '全部', icon: FileText },
  { id: 'urban_management', name: '城市管理', icon: FileText },
  { id: 'education', name: '教育服务', icon: FileText },
  { id: 'medical', name: '医疗卫生', icon: FileText },
  { id: 'government', name: '政务服务', icon: FileText },
  { id: 'transportation', name: '交通出行', icon: FileText },
];

interface InterpretationData {
  keyPoints: string[];
  targetAudience: string[];
  processSteps: string[];
}

export default function Policy() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [interpretationPolicy, setInterpretationPolicy] = useState<PolicyDocument | null>(null);
  const [interpretationData, setInterpretationData] = useState<InterpretationData | null>(null);
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPolicies();
  }, [activeCategory]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.government.getPolicies(activeCategory === 'all' ? undefined : activeCategory);
      setPolicies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load policies:', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePolicy = async (policy: PolicyDocument) => {
    if (expandedPolicy === policy.id) {
      setExpandedPolicy(null);
    } else {
      setExpandedPolicy(policy.id);
      try {
        await api.government.getPolicyDetail(policy.id);
      } catch (e) {
        console.error('Failed to load policy detail:', e);
      }
    }
  };

  const handleShowInterpretation = async (policy: PolicyDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setInterpretationPolicy(policy);
    setShowInterpretation(true);
    setInterpretationLoading(true);
    try {
      const data = await api.government.getPolicyInterpretation(policy.id);
      const mockInterpretation: InterpretationData = {
        keyPoints: [
          '政策从2024年3月1日起正式实施',
          '新购电动车必须符合国家标准并取得CCC认证',
          '违规停放电动车将被依法拖移',
          '最高时速不得超过25公里/小时',
        ],
        targetAudience: [
          '电动车车主及驾驶人',
          '电动车销售企业',
          '快递外卖行业从业人员',
          '普通市民',
        ],
        processSteps: [
          '购买符合国家标准的电动车',
          '携带相关材料到车管所办理注册登记',
          '领取电动车号牌和行驶证',
          '按规定在非机动车道行驶',
        ],
      };
      setInterpretationData((data as unknown as InterpretationData) || mockInterpretation);
    } catch (e) {
      console.error('Failed to load interpretation:', e);
      setInterpretationData({
        keyPoints: policy.aiInterpretation ? [policy.aiInterpretation] : ['暂无解读数据'],
        targetAudience: ['全体市民'],
        processSteps: ['请咨询相关部门了解办理流程'],
      });
    } finally {
      setInterpretationLoading(false);
    }
  };

  const closeInterpretation = () => {
    setShowInterpretation(false);
    setInterpretationPolicy(null);
    setInterpretationData(null);
  };

  const getRelatedPolicies = (currentPolicy: PolicyDocument) => {
    return policies
      .filter(p => p.id !== currentPolicy.id && p.category === currentPolicy.category)
      .slice(0, 2);
  };

  const renderStructuredContent = (sections: PolicySection[]) => {
    return sections.map((section) => (
      <div key={section.id} className={cn('mb-4', section.level > 1 && 'ml-4')}>
        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary-500 rounded-full" />
          {section.title}
        </h4>
        <p className="text-gray-600 text-sm mb-2">{section.content}</p>
        {section.keyPoints && section.keyPoints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {section.keyPoints.map((point, idx) => (
              <span key={idx} className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded-lg">
                {point}
              </span>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/government')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">政策解读</h1>
            <p className="text-gray-500 mt-1">最新政策文件，AI智能解读，让政策一目了然</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI智能解读</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">政策分类</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            加载中...
          </div>
        ) : policies.length > 0 ? (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-2xl shadow-card overflow-hidden transition-all duration-300"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePolicy(policy)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
                        {categories.find(c => c.id === policy.category)?.name || policy.category}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {policy.publishDate}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{policy.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {policy.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={(e) => handleShowInterpretation(policy, e)}
                      className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-600 rounded-xl text-sm font-medium hover:from-primary-100 hover:to-primary-200 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI解读
                    </button>
                    {expandedPolicy === policy.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedPolicy === policy.id && (
                <div className="border-t border-gray-100 p-6 bg-gray-50 animate-slide-up">
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-500" />
                      政策内容
                    </h4>
                    {renderStructuredContent(policy.structuredContent)}
                  </div>

                  {getRelatedPolicies(policy).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-warm-500" />
                        相关政策推荐
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {getRelatedPolicies(policy).map((related) => (
                          <div
                            key={related.id}
                            className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 cursor-pointer transition-all"
                            onClick={() => togglePolicy(related)}
                          >
                            <p className="font-medium text-gray-800 text-sm line-clamp-2">{related.title}</p>
                            <p className="text-xs text-gray-500 mt-2">{related.publishDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-card">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无该分类的政策文件</p>
          </div>
        )}
      </div>

      {showInterpretation && interpretationPolicy && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeInterpretation}
        >
          <div
            ref={popoverRef}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">AI 政策解读</span>
                  </div>
                  <h3 className="text-lg font-semibold">{interpretationPolicy.title}</h3>
                </div>
                <button
                  onClick={closeInterpretation}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {interpretationLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">AI 正在解读中...</p>
                </div>
              ) : interpretationData ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-warm-500" />
                      政策要点
                    </h4>
                    <div className="space-y-2">
                      {interpretationData.keyPoints.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-warm-50 rounded-xl">
                          <span className="flex-shrink-0 w-6 h-6 bg-warm-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <p className="text-gray-700 text-sm">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" />
                      适用人群
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {interpretationData.targetAudience.map((audience, idx) => (
                        <span key={idx} className="px-3 py-2 bg-primary-50 text-primary-600 text-sm rounded-xl">
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-eco-500" />
                      办理流程
                    </h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-eco-200" />
                      <div className="space-y-4">
                        {interpretationData.processSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-4 relative">
                            <span className="flex-shrink-0 w-8 h-8 bg-eco-500 text-white rounded-full flex items-center justify-center text-sm font-medium z-10">
                              {idx + 1}
                            </span>
                            <div className="flex-1 p-3 bg-eco-50 rounded-xl">
                              <p className="text-gray-700 text-sm">{step}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
