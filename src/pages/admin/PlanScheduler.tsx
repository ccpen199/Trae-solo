import { useState } from 'react';
import { CheckSquare, Plus, Calendar, Users, MapPin, Clock, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PlanItem {
  id: number;
  name: string;
  category: string;
  city: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  taskCount: number;
  assignedCount: number;
  reviewerIds: number[];
}

const mockPlans: PlanItem[] = [
  {
    id: 1, name: '2025Q2乳制品行业评测计划', category: '消费品牌', city: '全国',
    startDate: '2025-06-01', endDate: '2025-06-30', status: 'active',
    taskCount: 12, assignedCount: 8, reviewerIds: [1, 2, 3, 4],
  },
  {
    id: 2, name: '在线教育平台服务质量评测', category: '教育服务', city: '北京',
    startDate: '2025-06-10', endDate: '2025-07-10', status: 'active',
    taskCount: 8, assignedCount: 5, reviewerIds: [2, 5, 6],
  },
  {
    id: 3, name: '三甲医院患者满意度调研', category: '医疗健康', city: '全国',
    startDate: '2025-07-01', endDate: '2025-07-31', status: 'draft',
    taskCount: 15, assignedCount: 0, reviewerIds: [],
  },
  {
    id: 4, name: '连锁酒店服务品质调查', category: '旅游出行', city: '上海',
    startDate: '2025-05-01', endDate: '2025-05-31', status: 'completed',
    taskCount: 10, assignedCount: 10, reviewerIds: [1, 3, 7, 8],
  },
  {
    id: 5, name: '婴幼儿奶粉安全专项评测', category: '消费品牌', city: '全国',
    startDate: '2025-06-15', endDate: '2025-07-15', status: 'active',
    taskCount: 6, assignedCount: 6, reviewerIds: [1, 2, 9],
  },
];

const categories = [
  { code: 'all', name: '全部' },
  { code: 'consumer', name: '消费品牌' },
  { code: 'education', name: '教育服务' },
  { code: 'medical', name: '医疗健康' },
  { code: 'travel', name: '旅游出行' },
];

const reviewers = [
  { id: 1, name: '张明', field: '食品科学', score: 94 },
  { id: 2, name: '李华', field: '数据分析', score: 91 },
  { id: 3, name: '王芳', field: '旅游行业', score: 88 },
  { id: 4, name: '刘伟', field: '教育行业', score: 92 },
  { id: 5, name: '陈静', field: '医疗健康', score: 95 },
  { id: 6, name: '赵强', field: '食品科学', score: 87 },
];

export function PlanScheduler() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);

  const filteredPlans = mockPlans.filter(
    (p) => activeCategory === 'all' || p.category === categories.find(c => c.code === activeCategory)?.name
  );

  const openAssignModal = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setSelectedReviewers(plan.reviewerIds);
    setShowAssignModal(plan.id);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            评测计划排期
          </h1>
          <p className="text-slate-400 text-sm">创建和管理评测计划，分配任务给评测员</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          新建计划
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400 mr-2">分类：</span>
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

      {/* Plan List */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="card p-5">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge status={plan.status as any} />
                  <span className="badge bg-slate-700/50 text-slate-300 border-slate-600">{plan.category}</span>
                  <span className="badge bg-slate-700/50 text-slate-300 border-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {plan.city}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-3">{plan.name}</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      开始日期
                    </span>
                    <div className="text-white mt-0.5">{plan.startDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      截止日期
                    </span>
                    <div className="text-white mt-0.5">{plan.endDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      任务数
                    </span>
                    <div className="text-white mt-0.5">{plan.assignedCount}/{plan.taskCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      评测员
                    </span>
                    <div className="text-white mt-0.5">{plan.reviewerIds.length} 人</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>任务分配进度</span>
                    <span>{Math.round((plan.assignedCount / plan.taskCount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        plan.status === 'completed' ? 'bg-primary' : plan.status === 'active' ? 'bg-accent' : 'bg-warning'
                      }`}
                      style={{ width: `${(plan.assignedCount / plan.taskCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex lg:flex-col gap-2">
                {plan.status === 'active' && (
                  <button
                    onClick={() => openAssignModal(plan)}
                    className="btn btn-outline text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    分配任务
                  </button>
                )}
                <button className="btn btn-ghost text-sm">
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </button>
                <button className="btn btn-ghost text-sm text-danger hover:bg-danger/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-fade-in">
            <h3 className="font-serif font-semibold text-white text-lg mb-4">分配评测员 - {selectedPlan.name}</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {reviewers.map((reviewer) => (
                <label
                  key={reviewer.id}
                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                    selectedReviewers.includes(reviewer.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface-light/30 hover:bg-surface-light/50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedReviewers.includes(reviewer.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReviewers([...selectedReviewers, reviewer.id]);
                      } else {
                        setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{reviewer.name}</div>
                    <div className="text-xs text-slate-500">{reviewer.field} · 质量分 {reviewer.score}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(null)}
                className="btn btn-outline flex-1"
              >
                取消
              </button>
              <button
                onClick={() => setShowAssignModal(null)}
                className="btn btn-primary flex-1"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg animate-fade-in">
            <h3 className="font-serif font-semibold text-white text-lg mb-4">新建评测计划</h3>
            <div className="space-y-4">
              <div>
                <label className="label">计划名称</label>
                <input type="text" placeholder="请输入计划名称" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">所属领域</label>
                  <select className="input">
                    <option value="">请选择</option>
                    {categories.filter(c => c.code !== 'all').map(cat => (
                      <option key={cat.code} value={cat.code}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">评测城市</label>
                  <input type="text" placeholder="全国/城市名" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始日期</label>
                  <input type="date" className="input" />
                </div>
                <div>
                  <label className="label">截止日期</label>
                  <input type="date" className="input" />
                </div>
              </div>
              <div>
                <label className="label">任务数量</label>
                <input type="number" placeholder="请输入任务数量" className="input" min="1" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline flex-1"
              >
                取消
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-primary flex-1"
              >
                创建计划
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanScheduler;
