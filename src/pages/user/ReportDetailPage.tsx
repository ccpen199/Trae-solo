import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText, Database, GitCompare, ChevronRight, CheckCircle2, AlertCircle, TrendingUp, Building2, Store, MessageSquare, FlaskConical } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { DataSourceTag } from '@/components/ui/DataSourceTag';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RadarChart } from '@/components/charts/RadarChart';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface TimelineItem {
  time: string;
  stage: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  operator?: string;
}

const mockReport = {
  id: 1,
  title: '蒙牛乳业综合可信评价报告',
  targetName: '蒙牛乳业',
  category: '消费品牌',
  city: '全国',
  period: '2025年Q1',
  overallScore: 92,
  status: 'published',
  summary: '本报告基于电商平台评论、政府抽检数据、消费者投诉、专业评测等多源数据，对蒙牛乳业进行了全面的可信评价。综合评分为92分，在消费品牌领域处于领先水平。产品质量和品牌信誉表现突出，服务体验和价格公道方面仍有提升空间。',
  reviewer: { name: '张明', qualifications: ['食品科学硕士', '注册营养师'] },
  publishedAt: '2025-06-10',
  dimensionScores: [
    { dimension: '产品质量', score: 94, weight: 0.35 },
    { dimension: '服务体验', score: 88, weight: 0.25 },
    { dimension: '品牌信誉', score: 92, weight: 0.25 },
    { dimension: '价格公道', score: 86, weight: 0.15 },
  ],
  indicatorScores: [
    { indicatorName: '原料品质', indicatorCode: 'I001', score: 95, weight: 0.12, dataSources: [{ type: 'sampling' as const, name: '市场监管总局抽检', count: 42, verified: true }] },
    { indicatorName: '生产工艺', indicatorCode: 'I002', score: 93, weight: 0.10, dataSources: [{ type: 'government' as const, name: '食品生产许可审核', count: 18, verified: true }] },
    { indicatorName: '产品合格率', indicatorCode: 'I003', score: 94, weight: 0.13, dataSources: [{ type: 'sampling' as const, name: '各级抽检数据', count: 156, verified: true }] },
    { indicatorName: '客服响应', indicatorCode: 'I004', score: 85, weight: 0.10, dataSources: [{ type: 'review' as const, name: '电商平台评价', count: 8900, verified: true }] },
    { indicatorName: '售后处理', indicatorCode: 'I005', score: 88, weight: 0.08, dataSources: [{ type: 'complaint' as const, name: '12315投诉平台', count: 156, verified: true }] },
    { indicatorName: '品牌知名度', indicatorCode: 'I006', score: 94, weight: 0.12, dataSources: [{ type: 'review' as const, name: '全网品牌提及', count: 45000, verified: true }] },
    { indicatorName: '消费者满意度', indicatorCode: 'I007', score: 90, weight: 0.13, dataSources: [{ type: 'ecommerce' as const, name: '主流电商平台', count: 12450, verified: true }] },
    { indicatorName: '性价比评价', indicatorCode: 'I008', score: 86, weight: 0.10, dataSources: [{ type: 'ecommerce' as const, name: '电商平台价格对比', count: 3200, verified: true }] },
    { indicatorName: '促销透明度', indicatorCode: 'I009', score: 87, weight: 0.12, dataSources: [{ type: 'review' as const, name: '用户评论分析', count: 5600, verified: true }] },
  ],
  timeline: [
    { time: '2025-03-01', stage: '计划立项', description: '评测计划制定并通过审核', status: 'completed' as const, operator: '系统' },
    { time: '2025-03-15', stage: '任务分配', description: '任务分配给评测员张明', status: 'completed' as const, operator: '管理员李华' },
    { time: '2025-04-20', stage: '数据采集', description: '完成多源数据采集与清洗', status: 'completed' as const, operator: '评测员张明' },
    { time: '2025-05-05', stage: '报告撰写', description: '初版报告提交审核', status: 'completed' as const, operator: '评测员张明' },
    { time: '2025-05-15', stage: '初审通过', description: '初审合格，进入交叉验证', status: 'completed' as const, operator: '审核员王芳' },
    { time: '2025-05-25', stage: '交叉验证', description: '两名交叉验证员确认数据无误', status: 'completed' as const, operator: '评测员刘伟、陈静' },
    { time: '2025-06-05', stage: '终审通过', description: '终审合格，准予发布', status: 'completed' as const, operator: '审核主管赵强' },
    { time: '2025-06-10', stage: '报告发布', description: '报告正式对外发布', status: 'current' as const, operator: '系统' },
  ] as TimelineItem[],
};

export function ReportDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'indicators' | 'timeline'>('overview');

  const radarData = mockReport.dimensionScores.map((d) => ({
    dimension: d.dimension,
    实际得分: d.score,
    行业均值: Math.round(d.score * 0.88),
    加权得分: Math.round(d.score * d.weight * 4),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/" className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <span className="text-slate-600">/</span>
        <Link to="/rankings" className="text-slate-400 hover:text-slate-200 text-sm">排行榜</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 text-sm">报告详情</span>
      </div>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <ScoreRing score={mockReport.overallScore} size={140} strokeWidth={10} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <StatusBadge status={mockReport.status as any} />
              <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{mockReport.category}</span>
              <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{mockReport.period}</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">{mockReport.title}</h1>
            <p className="text-slate-400 leading-relaxed mb-4">{mockReport.summary}</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                发布于 {mockReport.publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                评测员 {mockReport.reviewer.name}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                报告编号 #{String(mockReport.id).padStart(6, '0')}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <Link to={`/compare?ids=${mockReport.id}`} className="btn btn-outline text-sm">
                <GitCompare className="w-4 h-4 mr-2" />
                加入对比
              </Link>
              <button className="btn btn-primary text-sm">
                <FileText className="w-4 h-4 mr-2" />
                下载PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-700/50">
        <div className="flex gap-6">
          {[
            { key: 'overview', label: '评分总览' },
            { key: 'indicators', label: '指标详情' },
            { key: 'timeline', label: '数据溯源时间线' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Radar Chart */}
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-white mb-4">维度雷达图</h3>
            <RadarChart
              data={radarData}
              series={[
                { key: '实际得分', color: '#10B981', name: '实际得分' },
                { key: '行业均值', color: '#F59E0B', name: '行业均值' },
                { key: '加权得分', color: '#6366F1', name: '加权得分' },
              ]}
              height={320}
            />
            <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-500 mb-1">实际得分</div>
                <div className="text-lg font-bold text-primary">90.0</div>
                <div className="text-xs text-slate-500">4维度平均</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">行业均值</div>
                <div className="text-lg font-bold text-warning">79.2</div>
                <div className="text-xs text-slate-500">同品类平均</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">领先幅度</div>
                <div className="text-lg font-bold text-accent">+13.6%</div>
                <div className="text-xs text-slate-500">超行业均值</div>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-white mb-4">维度分解</h3>
            <div className="space-y-4">
              {mockReport.dimensionScores.map((dim) => (
                <div key={dim.dimension}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300">{dim.dimension}</span>
                    <span className="text-sm text-slate-400">权重 {(dim.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${
                      dim.score >= 85 ? 'text-primary' : dim.score >= 70 ? 'text-warning' : 'text-danger'
                    }`}>
                      {dim.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advantages */}
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              优势分析
            </h3>
            <ul className="space-y-3">
              {[
                '产品质量指标突出，连续三年抽检合格率保持在98%以上',
                '品牌知名度和消费者认可度高，全网正面评价占比达89%',
                '售后服务响应及时，投诉解决率达95%',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Disadvantages */}
          <div className="card p-6">
            <h3 className="font-serif font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              待改进方面
            </h3>
            <ul className="space-y-3">
              {[
                '部分高端产品线性价比评价有待提升',
                '促销活动透明度可进一步加强',
                '偏远地区配送服务体验需改善',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'indicators' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">指标名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">编码</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">权重</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">得分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">数据来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {mockReport.indicatorScores.map((ind) => (
                  <tr key={ind.indicatorCode} className="hover:bg-surface-light/30">
                    <td className="px-4 py-3 text-sm text-white">{ind.indicatorName}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{ind.indicatorCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{(ind.weight * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-light rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ind.score >= 85 ? 'bg-primary' : ind.score >= 70 ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${ind.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">{ind.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ind.dataSources.map((ds, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <DataSourceTag type={ds.type} />
                            <span className="text-xs text-slate-500">{ds.count.toLocaleString()}条</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card p-6 animate-fade-in">
          <h3 className="font-serif font-semibold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            评测流程与数据溯源
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-700"></div>
            <div className="space-y-6">
              {mockReport.timeline.map((item, idx) => (
                <div key={idx} className="relative pl-12">
                  <div className={`absolute left-2 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    item.status === 'completed' ? 'bg-primary border-primary' :
                    item.status === 'current' ? 'bg-warning border-warning animate-pulse-soft' :
                    'bg-surface border-slate-600'
                  }`}>
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : item.status === 'current' ? (
                      <TrendingUp className="w-3 h-3 text-white" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{item.stage}</h4>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                  {item.operator && (
                    <p className="text-xs text-slate-500 mt-1">操作人：{item.operator}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Sources Summary */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <h4 className="font-medium text-white mb-4">数据来源统计</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { type: 'ecommerce' as const, label: '电商平台', count: 15650, icon: Store },
                { type: 'government' as const, label: '政府数据', count: 216, icon: Building2 },
                { type: 'complaint' as const, label: '投诉数据', count: 156, icon: MessageSquare },
                { type: 'review' as const, label: '用户评价', count: 78500, icon: FileText },
                { type: 'sampling' as const, label: '抽检数据', count: 312, icon: FlaskConical },
              ].map((ds) => (
                <div key={ds.type} className="p-4 bg-surface-light/30 rounded-md">
                  <DataSourceTag type={ds.type} className="mb-2" />
                  <div className="text-xl font-bold text-white mt-2">{ds.count.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">条数据</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ReportDetailPage;
