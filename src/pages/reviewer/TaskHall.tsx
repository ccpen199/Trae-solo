import { useState } from 'react';
import { ClipboardList, Filter, Search, Clock, Award, CheckCircle2, MapPin, Tag } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceTag } from '@/components/ui/DataSourceTag';

interface TaskItem {
  id: number;
  title: string;
  targetName: string;
  category: string;
  description: string;
  deadline: string;
  reward: number;
  status: 'open' | 'assigned' | 'completed';
  requiredQualifications: string[];
  dataSources: ('ecommerce' | 'government' | 'complaint' | 'review' | 'sampling')[];
  city: string;
}

const mockTasks: TaskItem[] = [
  {
    id: 1, title: '2025Q2液态奶品质评测', targetName: '伊利集团', category: '消费品牌',
    description: '对伊利旗下主要液态奶产品进行多维度评测，包括原料品质、生产工艺、市场抽检等指标。',
    deadline: '2025-06-25', reward: 680, status: 'open',
    requiredQualifications: ['食品科学相关专业', '熟悉乳制品行业'],
    dataSources: ['ecommerce', 'government', 'sampling', 'review'],
    city: '呼和浩特',
  },
  {
    id: 2, title: '婴幼儿奶粉安全指标评测', targetName: '飞鹤乳业', category: '消费品牌',
    description: '针对飞鹤星飞帆等主力产品进行安全指标评测，重点关注添加剂、营养成分、抽检合格率等。',
    deadline: '2025-06-30', reward: 850, status: 'open',
    requiredQualifications: ['注册营养师', '婴幼儿食品经验'],
    dataSources: ['government', 'sampling', 'complaint'],
    city: '齐齐哈尔',
  },
  {
    id: 3, title: '功能饮料用户满意度调查', targetName: '东鹏特饮', category: '消费品牌',
    description: '收集和分析电商平台用户评价，进行满意度统计和情感分析。',
    deadline: '2025-07-05', reward: 520, status: 'open',
    requiredQualifications: ['数据分析能力'],
    dataSources: ['ecommerce', 'review'],
    city: '深圳',
  },
  {
    id: 4, title: 'K12在线教育平台服务质量评测', targetName: '猿辅导', category: '教育服务',
    description: '从师资力量、课程质量、服务水平、性价比等维度进行综合评价。',
    deadline: '2025-07-10', reward: 750, status: 'open',
    requiredQualifications: ['教育行业经验', '在线教育背景'],
    dataSources: ['review', 'complaint', 'ecommerce'],
    city: '北京',
  },
  {
    id: 5, title: '连锁酒店服务品质调查', targetName: '全季酒店', category: '旅游出行',
    description: '对全国主要城市全季酒店进行服务品质调查，包含卫生、服务、设施等维度。',
    deadline: '2025-07-15', reward: 980, status: 'open',
    requiredQualifications: ['旅游行业经验', '实地考察能力'],
    dataSources: ['review', 'complaint', 'ecommerce', 'sampling'],
    city: '全国',
  },
  {
    id: 6, title: '三甲医院患者满意度调研', targetName: '北京协和医院', category: '医疗健康',
    description: '通过线上问卷和患者评价数据，调研患者就医体验和满意度。',
    deadline: '2025-07-20', reward: 620, status: 'open',
    requiredQualifications: ['医疗行业背景', '调研经验'],
    dataSources: ['review', 'complaint', 'sampling'],
    city: '北京',
  },
];

const categories = [
  { code: 'all', name: '全部' },
  { code: 'consumer', name: '消费品牌' },
  { code: 'education', name: '教育服务' },
  { code: 'medical', name: '医疗健康' },
  { code: 'travel', name: '旅游出行' },
];

export function TaskHall() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedTask, setAppliedTask] = useState<number | null>(null);

  const filteredTasks = mockTasks.filter((task) => {
    if (activeCategory !== 'all' && task.category !== (categories.find(c => c.code === activeCategory)?.name)) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.targetName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApply = (taskId: number) => {
    setAppliedTask(taskId);
    setTimeout(() => setAppliedTask(null), 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          任务大厅
        </h1>
        <p className="text-slate-400 text-sm">选择您感兴趣并符合资质的评测任务</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 mr-2">分类：</span>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setActiveCategory(cat.code)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    activeCategory === cat.code
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-slate-400 hover:text-white hover:bg-surface-light'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-56 px-3 py-1.5 pl-9 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="card p-5 hover:border-primary/30 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge status={task.status} />
                  <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{task.category}</span>
                  <span className="badge bg-slate-700/50 text-slate-300 border-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {task.city}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-1">{task.title}</h3>
                <p className="text-sm text-slate-400 mb-3">{task.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Tag className="w-4 h-4" />
                    评测对象：<span className="text-slate-200">{task.targetName}</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-warning">截止 {task.deadline}</span>
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">数据来源：</span>
                    {task.dataSources.map((ds) => (
                      <DataSourceTag key={ds} type={ds} />
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-xs text-slate-500">资质要求：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.requiredQualifications.map((q) => (
                      <span key={q} className="inline-flex items-center px-2 py-0.5 rounded bg-accent/10 text-accent text-xs border border-accent/30">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:w-40 flex flex-col items-center justify-center gap-3 lg:border-l lg:border-slate-700/50 lg:pl-6">
                <div className="text-center">
                  <div className="text-xs text-slate-500">任务奖励</div>
                  <div className="text-2xl font-bold text-primary">¥{task.reward}</div>
                </div>
                <button
                  onClick={() => handleApply(task.id)}
                  disabled={appliedTask === task.id}
                  className={`w-full btn ${
                    appliedTask === task.id
                      ? 'btn-secondary text-primary'
                      : 'btn-primary'
                  }`}
                >
                  {appliedTask === task.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      已报名
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-1" />
                      报名接取
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskHall;
