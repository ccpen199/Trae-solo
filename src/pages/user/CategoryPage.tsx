import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Scale, FileText, BarChart3, Database, Clock, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { DataSourceTag } from '@/components/ui/DataSourceTag';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

type CategoryCode = 'consumer' | 'education' | 'medical' | 'travel';

const categoryMeta: Record<CategoryCode, { name: string; icon: string; description: string; dims: { name: string; weight: number; description: string }[]; rules: string[] }> = {
  consumer: {
    name: '消费品牌', icon: '🛒', description: '涵盖食品饮料、美妆个护、家居日用等消费领域的客观评价',
    dims: [
      { name: '产品质量', weight: 0.30, description: '原料品质、生产工艺、产品合格率' },
      { name: '服务体验', weight: 0.25, description: '客服响应、售后处理、物流配送' },
      { name: '品牌信誉', weight: 0.25, description: '品牌知名度、消费者满意度、口碑评价' },
      { name: '价格公道', weight: 0.20, description: '性价比评价、促销透明度、价格稳定性' },
    ],
    rules: ['采样来源：电商平台用户评论+政府抽检+消费者投诉', '交叉验证：至少3个独立数据源交叉比对', '评测周期：季度评测+年度总评', '权重说明：产品质量侧重抽检合格率，服务体验侧重投诉处理率'],
  },
  education: {
    name: '教育服务', icon: '🎓', description: '培训机构、在线课程、教育机构的专业评估报告',
    dims: [
      { name: '教学质量', weight: 0.30, description: '课程设计、教学效果、学员进步率' },
      { name: '师资力量', weight: 0.30, description: '教师资质、教学经验、学员评价' },
      { name: '服务水平', weight: 0.20, description: '课程服务、售后支持、学习体验' },
      { name: '性价比', weight: 0.20, description: '课程定价、退费政策、增值服务' },
    ],
    rules: ['采样来源：学员评价+教育部门许可+投诉数据', '交叉验证：教学成果与学员满意度交叉比对', '评测周期：学期评测+年度总评', '权重说明：教学质量与师资力量合计权重60%'],
  },
  medical: {
    name: '医疗健康', icon: '🏥', description: '医疗美容机构、健康服务的可信评价',
    dims: [
      { name: '资质安全', weight: 0.65, description: '执业许可证、医师资质、设备合规' },
      { name: '服务效果', weight: 0.30, description: '治疗效果、患者满意度、术后跟踪' },
      { name: '价格透明', weight: 0.05, description: '收费公示、价格对比、隐性消费' },
    ],
    rules: ['采样来源：卫健委许可+专业医疗评估+患者评价', '资质安全权重极高(65%)：任何资质不合规直接降级', '交叉验证：医疗资质与患者反馈必须同时达标', '评测周期：半年评测+年度总评', '特殊规则：涉及医疗事故的品牌自动进入观察期'],
  },
  travel: {
    name: '旅游出行', icon: '✈️', description: '景区、酒店、旅行社的综合评分',
    dims: [
      { name: '产品丰富度', weight: 0.25, description: '线路选择、酒店覆盖、增值服务' },
      { name: '服务质量', weight: 0.30, description: '客服响应、导游素质、行程执行' },
      { name: '价格优势', weight: 0.20, description: '价格竞争力、促销力度、隐性消费' },
      { name: '售后保障', weight: 0.25, description: '退改政策、投诉处理、赔付机制' },
    ],
    rules: ['采样来源：用户评价+旅游部门许可+投诉数据', '交叉验证：用户体验与官方资质交叉比对', '评测周期：季度评测+旅游旺季加评', '权重说明：服务质量侧重投诉处理率和响应速度'],
  },
};

const mockReports: Record<CategoryCode, { id: number; title: string; score: number; date: string; status: string }[]> = {
  consumer: [
    { id: 1, title: '2026年Q2消费品牌综合评价报告', score: 91, date: '2026-06-12', status: 'published' },
    { id: 2, title: '乳制品行业专项评测', score: 89, date: '2026-05-20', status: 'published' },
    { id: 3, title: '调味品安全指标评测', score: 85, date: '2026-06-02', status: 'cross_validating' },
  ],
  education: [
    { id: 4, title: '2026年教育机构服务质量评测', score: 88, date: '2026-06-10', status: 'published' },
    { id: 5, title: '在线教育平台对比评测', score: 86, date: '2026-05-15', status: 'approved' },
  ],
  medical: [
    { id: 6, title: '医美机构资质合规性专项检查', score: 93, date: '2026-06-08', status: 'published' },
    { id: 7, title: '整形外科安全指标评测', score: 87, date: '2026-05-25', status: 'reviewing' },
  ],
  travel: [
    { id: 8, title: '长三角旅游景区满意度横向对比', score: 86, date: '2026-06-05', status: 'published' },
    { id: 9, title: '在线旅游平台服务评测', score: 84, date: '2026-05-18', status: 'approved' },
  ],
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const code = (category as CategoryCode) || 'consumer';
  const meta = categoryMeta[code];
  const reports = mockReports[code] || [];
  const [activeTab, setActiveTab] = useState<'weights' | 'rules' | 'reports'>('weights');

  if (!meta) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center text-slate-400">未知领域</div><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-slate-300">首页</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/rankings" className="hover:text-slate-300">排行榜</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-300">{meta.name}</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">{meta.icon} {meta.name}评测工作台</h1>
            <p className="text-slate-400">{meta.description}</p>
          </div>

          <div className="mb-6 border-b border-slate-700/50">
            <div className="flex gap-6">
              {[
                { key: 'weights', label: '权重配置', icon: Scale },
                { key: 'rules', label: '评测规则', icon: Shield },
                { key: 'reports', label: '评测报告', icon: FileText },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'weights' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-6 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  {meta.name}动态权重配置
                </h3>
                <div className="space-y-4">
                  {meta.dims.map((dim) => (
                    <div key={dim.name} className="bg-surface/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-medium">{dim.name}</span>
                          <span className="ml-3 text-xs text-slate-500">{dim.description}</span>
                        </div>
                        <span className="text-lg font-bold text-primary">{(dim.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-surface-light rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{ width: `${dim.weight * 100}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <Database className="w-3 h-3" />
                        <span>数据来源：{dim.name === '资质安全' ? '卫健委许可+执业资格' : dim.name === '产品质量' ? '抽检+电商评论' : '用户评价+投诉数据'}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>权重更新于 2026-06-01</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-serif font-semibold text-white mb-4">权重分配说明</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {code === 'medical' ? '医美服务领域采用"资质优先"权重模型，资质安全维度权重高达65%，任何资质不合规的品牌将被自动降级处理。服务效果占30%，价格透明仅占5%——这是因为在医疗领域，安全远比价格重要。' :
                   code === 'education' ? '教育服务领域采用"教学核心"权重模型，教学质量与师资力量合计权重60%，强调教学效果的核心地位。服务水平和性价比各占20%，确保教育机构不会以牺牲教学质量来降低成本。' :
                   code === 'consumer' ? '消费品领域采用"均衡侧重"权重模型，产品质量占30%为最高权重，其余三个维度均衡分配。这种配置确保消费者能够获得全面的产品评价，既关注品质也关注性价比。' :
                   '旅游出行领域采用"服务优先"权重模型，服务质量占30%为最高权重，产品丰富度和售后保障各占25%，价格优势占20%。旅游体验的核心在于服务质量，因此给予最高权重。'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="card p-6 animate-fade-in">
              <h3 className="font-serif font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {meta.name}评测规则
              </h3>
              <div className="space-y-4">
                {meta.rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <h4 className="text-sm font-medium text-white mb-3">数据采集规范</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['ecommerce', 'government', 'complaint', 'review', 'sampling'] as const).map((type) => (
                    <div key={type} className="p-3 bg-surface/50 rounded-md text-center">
                      <DataSourceTag type={type} className="mb-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4 animate-fade-in">
              {reports.map((report) => (
                <Link key={report.id} to={`/report/${report.id}`} className="card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors block">
                  <ScoreRing score={report.score} size={56} strokeWidth={4} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{report.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{report.date}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${report.status === 'published' ? 'bg-primary/10 text-primary' : report.status === 'reviewing' ? 'bg-warning/10 text-warning' : 'bg-blue-500/10 text-blue-400'}`}>
                        {report.status === 'published' ? '已发布' : report.status === 'reviewing' ? '审核中' : report.status === 'cross_validating' ? '交叉验证' : '已通过'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </Link>
              ))}
              <Link to={`/rankings/${code}`} className="card p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">查看{meta.name}完整榜单</span>
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
