import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Search,
  Filter,
  LayoutList,
  BarChart3,
  Building2,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowLeftRight,
  Layers,
  MapPin,
  Phone,
  Diamond,
} from 'lucide-react';
import { Tabs, Select, DatePicker, Tooltip as AntTooltip, Switch } from 'antd';
import type { TabsProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'milestone';

interface SubTask {
  id: string;
  name: string;
  start: Dayjs;
  end: Dayjs;
  actualStart?: Dayjs;
  actualEnd?: Dayjs;
  progress: number;
  status: TaskStatus;
  assignee: string;
  remark?: string;
}

interface Phase {
  id: string;
  name: string;
  start: Dayjs;
  end: Dayjs;
  progress: number;
  status: TaskStatus;
  subtasks: SubTask[];
}

interface Project {
  id: string;
  name: string;
  owner: string;
  status: TaskStatus;
  start: Dayjs;
  end: Dayjs;
  progress: number;
  city: string;
  provider: string;
  phases: Phase[];
  warning?: { type: string; content: string }[];
  milestones?: { date: Dayjs; name: string }[];
  members?: { name: string; role: string; avatar: string }[];
}

const startDate = dayjs('2024-05-01');
const endDate = dayjs('2024-08-31');

const mockProjects: Project[] = [
  {
    id: 'P001',
    name: '和谐家园·张府',
    owner: '张先生',
    status: 'in_progress',
    city: '上海',
    provider: '筑美装饰',
    start: startDate.add(3, 'day'),
    end: startDate.add(85, 'day'),
    progress: 62,
    warning: [
      { type: '延期预警', content: '泥瓦阶段较计划滞后2天' },
      { type: '材料预警', content: '瓷砖批次待确认' },
    ],
    milestones: [
      { date: startDate.add(25, 'day'), name: '水电验收' },
      { date: startDate.add(55, 'day'), name: '中期验收' },
    ],
    members: [
      { name: '王工', role: '项目经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang' },
      { name: '李工', role: '设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li' },
      { name: '张师傅', role: '工长', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang' },
    ],
    phases: [
      {
        id: 'P001-1',
        name: '拆改阶段',
        start: startDate.add(3, 'day'),
        end: startDate.add(12, 'day'),
        progress: 100,
        status: 'completed',
        subtasks: [
          { id: 'T001-1', name: '保护工程', start: startDate.add(3, 'day'), end: startDate.add(5, 'day'), progress: 100, status: 'completed', assignee: '张师傅' },
          { id: 'T001-2', name: '墙体拆除', start: startDate.add(5, 'day'), end: startDate.add(9, 'day'), progress: 100, status: 'completed', assignee: '张师傅' },
          { id: 'T001-3', name: '垃圾清运', start: startDate.add(9, 'day'), end: startDate.add(12, 'day'), progress: 100, status: 'completed', assignee: '外包团队' },
        ],
      },
      {
        id: 'P001-2',
        name: '水电阶段',
        start: startDate.add(12, 'day'),
        end: startDate.add(28, 'day'),
        progress: 100,
        status: 'completed',
        subtasks: [
          { id: 'T002-1', name: '水电定位', start: startDate.add(12, 'day'), end: startDate.add(14, 'day'), progress: 100, status: 'completed', assignee: '王工' },
          { id: 'T002-2', name: '开槽布线', start: startDate.add(14, 'day'), end: startDate.add(22, 'day'), progress: 100, status: 'completed', assignee: '陈师傅' },
          { id: 'T002-3', name: '水电验收', start: startDate.add(25, 'day'), end: startDate.add(25, 'day'), progress: 100, status: 'milestone', assignee: '监理' },
        ],
      },
      {
        id: 'P001-3',
        name: '泥瓦阶段',
        start: startDate.add(25, 'day'),
        end: startDate.add(48, 'day'),
        progress: 72,
        status: 'delayed',
        subtasks: [
          { id: 'T003-1', name: '防水工程', start: startDate.add(25, 'day'), end: startDate.add(32, 'day'), actualStart: startDate.add(27, 'day'), progress: 100, status: 'completed', assignee: '刘师傅', remark: '晚进场2天' },
          { id: 'T003-2', name: '墙砖铺贴', start: startDate.add(32, 'day'), end: startDate.add(42, 'day'), progress: 85, status: 'in_progress', assignee: '赵师傅' },
          { id: 'T003-3', name: '地砖铺贴', start: startDate.add(40, 'day'), end: startDate.add(48, 'day'), progress: 35, status: 'in_progress', assignee: '赵师傅' },
        ],
      },
      {
        id: 'P001-4',
        name: '木工阶段',
        start: startDate.add(46, 'day'),
        end: startDate.add(65, 'day'),
        progress: 15,
        status: 'in_progress',
        subtasks: [
          { id: 'T004-1', name: '吊顶龙骨', start: startDate.add(46, 'day'), end: startDate.add(52, 'day'), progress: 40, status: 'in_progress', assignee: '孙师傅' },
          { id: 'T004-2', name: '柜体制作', start: startDate.add(52, 'day'), end: startDate.add(62, 'day'), progress: 0, status: 'not_started', assignee: '孙师傅' },
          { id: 'T004-3', name: '中期验收', start: startDate.add(55, 'day'), end: startDate.add(55, 'day'), progress: 0, status: 'milestone', assignee: '监理' },
        ],
      },
      {
        id: 'P001-5',
        name: '油漆阶段',
        start: startDate.add(63, 'day'),
        end: startDate.add(78, 'day'),
        progress: 0,
        status: 'not_started',
        subtasks: [
          { id: 'T005-1', name: '墙面批灰', start: startDate.add(63, 'day'), end: startDate.add(70, 'day'), progress: 0, status: 'not_started', assignee: '周师傅' },
          { id: 'T005-2', name: '乳胶漆', start: startDate.add(70, 'day'), end: startDate.add(78, 'day'), progress: 0, status: 'not_started', assignee: '周师傅' },
        ],
      },
      {
        id: 'P001-6',
        name: '安装阶段',
        start: startDate.add(76, 'day'),
        end: startDate.add(88, 'day'),
        progress: 0,
        status: 'not_started',
        subtasks: [
          { id: 'T006-1', name: '橱柜安装', start: startDate.add(76, 'day'), end: startDate.add(80, 'day'), progress: 0, status: 'not_started', assignee: '厂商' },
          { id: 'T006-2', name: '地板安装', start: startDate.add(80, 'day'), end: startDate.add(83, 'day'), progress: 0, status: 'not_started', assignee: '厂商' },
          { id: 'T006-3', name: '竣工验收', start: startDate.add(88, 'day'), end: startDate.add(88, 'day'), progress: 0, status: 'milestone', assignee: '监理' },
        ],
      },
    ],
  },
  {
    id: 'P002',
    name: '翠湖天地·李宅',
    owner: '李女士',
    status: 'in_progress',
    city: '上海',
    provider: '和盛装饰',
    start: startDate.add(8, 'day'),
    end: startDate.add(95, 'day'),
    progress: 38,
    phases: [],
  },
  {
    id: 'P003',
    name: '万科翡翠·王府',
    owner: '王先生',
    status: 'delayed',
    city: '北京',
    provider: '优家装饰',
    start: startDate,
    end: startDate.add(80, 'day'),
    progress: 55,
    warning: [{ type: '严重延期', content: '整体进度滞后7天' }],
    phases: [],
  },
  {
    id: 'P004',
    name: '保利天汇·陈宅',
    owner: '陈先生',
    status: 'completed',
    city: '深圳',
    provider: '匠心营造',
    start: startDate.subtract(20, 'day'),
    end: startDate.add(60, 'day'),
    progress: 100,
    phases: [],
  },
  {
    id: 'P005',
    name: '融创壹号院·刘宅',
    owner: '刘女士',
    status: 'not_started',
    city: '杭州',
    provider: '华庭装饰',
    start: startDate.add(20, 'day'),
    end: startDate.add(105, 'day'),
    progress: 0,
    phases: [],
  },
];

const statusColorMap: Record<TaskStatus, { bg: string; border: string; text: string; bar: string }> = {
  not_started: { bg: 'bg-carbon-100', border: 'border-carbon-300', text: 'text-carbon-600', bar: 'bg-carbon-300' },
  in_progress: { bg: 'bg-haze-100', border: 'border-haze-400', text: 'text-haze-700', bar: 'bg-haze-500' },
  completed: { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  delayed: { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', bar: 'bg-rose-500' },
  milestone: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', bar: 'bg-amber-500' },
};

const DAY_WIDTH = 32;
const TOTAL_DAYS = endDate.diff(startDate, 'day') + 1;
const TIMELINE_WIDTH = TOTAL_DAYS * DAY_WIDTH;

const ProjectGantt: React.FC = () => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['P001']));
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['P001-1', 'P001-2', 'P001-3']));
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'gantt' | 'list'>('gantt');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([startDate, endDate]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showPlan, setShowPlan] = useState(true);

  const toggleProject = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedProjects(next);
  };

  const togglePhase = (id: string) => {
    const next = new Set(expandedPhases);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedPhases(next);
  };

  const timelineDays = useMemo(() => {
    const days: { date: Dayjs; month: number; week: number }[] = [];
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = startDate.add(i, 'day');
      days.push({
        date: d,
        month: d.month(),
        week: Math.floor((d.date() - 1 + d.startOf('month').day()) / 7),
      });
    }
    return days;
  }, []);

  const months = useMemo(() => {
    const m: { label: string; start: number; span: number }[] = [];
    let lastMonth = -1;
    timelineDays.forEach((d, idx) => {
      if (d.month !== lastMonth) {
        lastMonth = d.month;
        m.push({ label: `${d.date.year()}年${d.date.month() + 1}月`, start: idx, span: 1 });
      } else {
        m[m.length - 1].span++;
      }
    });
    return m;
  }, [timelineDays]);

  const getTaskPosition = (taskStart: Dayjs, taskEnd: Dayjs, plan = true) => {
    const s = plan ? taskStart : taskStart;
    const e = plan ? taskEnd : taskEnd;
    const left = s.diff(startDate, 'day') * DAY_WIDTH;
    const width = Math.max(DAY_WIDTH, (e.diff(s, 'day') + 1) * DAY_WIDTH);
    return { left, width };
  };

  const renderGanttBar = (
    task: { id: string; name: string; start: Dayjs; end: Dayjs; actualStart?: Dayjs; actualEnd?: Dayjs; progress: number; status: TaskStatus; assignee?: string; remark?: string },
    rowLevel: number,
  ) => {
    const colors = statusColorMap[task.status];
    const planPos = getTaskPosition(task.start, task.end, true);

    return (
      <div
        key={task.id}
        className="relative h-[42px] border-b border-ivory-100 hover:bg-ivory-50/60 transition-colors group"
        style={{ paddingLeft: rowLevel * 16 }}
      >
        <div
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ width: TIMELINE_WIDTH }}
        >
          {task.status !== 'milestone' ? (
            <>
              {showPlan && task.actualStart && (
                <div
                  className={`h-3 rounded-full border-2 border-dashed ${colors.border} opacity-60`}
                  style={{
                    marginLeft: planPos.left,
                    width: planPos.width,
                  }}
                />
              )}
              {task.actualStart && !showPlan ? null : (
                <AntTooltip
                  title={
                    <div className="space-y-1.5 text-xs p-1">
                      <div className="font-semibold text-white">{task.name}</div>
                      <div className="text-ivory-200">计划: {task.start.format('MM/DD')} ~ {task.end.format('MM/DD')}</div>
                      {task.actualStart && <div className="text-ivory-200">实际: {task.actualStart.format('MM/DD')} ~</div>}
                      <div className="text-ivory-200">完成度: {task.progress}%</div>
                      {task.assignee && <div className="text-ivory-200">负责人: {task.assignee}</div>}
                      {task.remark && <div className="text-amber-300">⚠️ {task.remark}</div>}
                    </div>
                  }
                >
                  <div
                    className={`relative h-7 rounded-lg ${colors.bar} shadow-sm cursor-pointer
                      hover:brightness-110 transition-all border ${colors.border} overflow-hidden`}
                    style={{
                      marginLeft: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).left : planPos.left,
                      width: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).width : planPos.width,
                    }}
                    onClick={() => {
                      const next = new Set(selectedTasks);
                      if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                      setSelectedTasks(next);
                    }}
                  >
                    <div
                      className={`absolute left-0 top-0 h-full ${statusColorMap[task.status].bg} opacity-50`}
                      style={{ width: `${task.progress}%` }}
                    />
                    <div className="relative z-10 h-full flex items-center px-2 gap-1">
                      {selectedTasks.has(task.id) && (
                        <div className="w-4 h-4 rounded bg-white/90 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-haze-600" />
                        </div>
                      )}
                      <span className={`text-[11px] font-medium truncate ${selectedTasks.has(task.id) ? '' : ''}`}>
                        {task.name}
                      </span>
                      {task.progress > 0 && task.progress < 100 && (
                        <span className="text-[10px] font-mono font-semibold ml-auto shrink-0 bg-white/30 px-1.5 py-0.5 rounded">
                          {task.progress}%
                        </span>
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 w-1.5 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </AntTooltip>
              )}
            </>
          ) : (
            <div
              className="absolute flex items-center justify-center"
              style={{ left: planPos.left + planPos.width / 2 - 8 }}
            >
              <AntTooltip title={`里程碑: ${task.name} (${task.start.format('MM/DD')})`}>
                <Diamond className={`w-4 h-4 ${colors.text} fill-current drop-shadow-sm cursor-pointer`} />
              </AntTooltip>
            </div>
          )}
        </div>
      </div>
    );
  };

  const treeRows: { type: string; data: any; level: number; project?: Project; phase?: Phase }[] = [];
  mockProjects.forEach((project) => {
    treeRows.push({ type: 'project', data: project, level: 0 });
    if (expandedProjects.has(project.id)) {
      project.phases.forEach((phase) => {
        treeRows.push({ type: 'phase', data: phase, level: 1, project });
        if (expandedPhases.has(phase.id)) {
          phase.subtasks.forEach((st) => {
            treeRows.push({ type: 'task', data: st, level: 2, phase, project });
          });
        }
      });
    }
  });

  return (
    <div className="space-y-5 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">全局进度甘特图</h1>
          <p className="text-sm text-ivory-600 mt-1">所有在建项目进度可视化管理 · 支持拖拽调整工期</p>
        </div>
        <div className="flex items-center gap-3 p-1 bg-ivory-100 rounded-xl">
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              viewMode === 'gantt' ? 'bg-white text-terracotta-700 shadow-sm' : 'text-carbon-600 hover:text-carbon-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            甘特图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              viewMode === 'list' ? 'bg-white text-terracotta-700 shadow-sm' : 'text-carbon-600 hover:text-carbon-800'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            列表
          </button>
        </div>
      </div>

      <div className="card-base p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 p-1 bg-ivory-100 rounded-lg">
          {['月度', '季度', '年度'].map((t) => (
            <button key={t} className="px-3 py-1.5 text-xs font-medium rounded-md text-carbon-600 hover:bg-white hover:text-terracotta-700 transition-all">
              {t}
            </button>
          ))}
          <div className="w-px h-4 bg-ivory-300 mx-1" />
          <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-terracotta-700 shadow-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            自定义
          </button>
        </div>
        <RangePicker
          size="middle"
          value={dateRange}
          onChange={(v) => v && setDateRange(v as [Dayjs, Dayjs])}
          style={{ borderRadius: 8 }}
        />
        <Select
          placeholder="项目状态"
          className="w-36"
          allowClear
          value={statusFilter === 'all' ? undefined : statusFilter}
          onChange={(v) => setStatusFilter(v ?? 'all')}
          style={{ borderRadius: 8 }}
        >
          <Option value="all">全部状态</Option>
          <Option value="not_started">规划中</Option>
          <Option value="in_progress">进行中</Option>
          <Option value="delayed">延期</Option>
          <Option value="completed">已完成</Option>
        </Select>
        <Select placeholder="服务商" className="w-40" allowClear style={{ borderRadius: 8 }}>
          <Option value="zhumei">筑美装饰</Option>
          <Option value="hesheng">和盛装饰</Option>
          <Option value="youjia">优家装饰</Option>
        </Select>
        <Select placeholder="城市" className="w-32" allowClear style={{ borderRadius: 8 }}>
          <Option value="sh">上海</Option>
          <Option value="bj">北京</Option>
          <Option value="sz">深圳</Option>
        </Select>
        <div className="flex items-center bg-white border border-ivory-300 rounded-btn px-3 py-2 gap-2 w-56">
          <Search className="w-4 h-4 text-ivory-500 shrink-0" />
          <input type="text" placeholder="搜索项目名/业主..." className="bg-transparent outline-none flex-1 text-sm" />
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Switch size="small" checked={showPlan} onChange={setShowPlan} />
            <span className="text-ivory-600">显示计划线</span>
          </div>
          <button className="btn-secondary text-sm !py-2">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      </div>

      <div className="relative flex-1 card-base overflow-hidden">
        {viewMode === 'gantt' ? (
          <div className="h-full flex">
            <div className="w-72 shrink-0 border-r border-ivory-200 flex flex-col bg-white z-10">
              <div className="h-[84px] border-b border-ivory-200 px-4 flex items-end pb-3 bg-ivory-50/80">
                <span className="text-xs font-semibold text-ivory-600 uppercase tracking-wider">项目 / 任务</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {treeRows.map((row, idx) => {
                  const { type, data, level } = row;
                  if (type === 'project') {
                    const colors = statusColorMap[data.status];
                    return (
                      <div
                        key={data.id}
                        className={`h-[42px] border-b border-ivory-100 flex items-center gap-2 px-3 cursor-pointer hover:bg-ivory-50 transition-colors ${
                          selectedProject?.id === data.id ? 'bg-terracotta-50/60' : ''
                        }`}
                        onClick={() => {
                          setSelectedProject(data);
                          setDetailPanelOpen(true);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProject(data.id);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-ivory-200 transition-colors shrink-0"
                        >
                          {data.phases.length > 0 && (
                            expandedProjects.has(data.id)
                              ? <ChevronDown className="w-3.5 h-3.5 text-ivory-600" />
                              : <ChevronRight className="w-3.5 h-3.5 text-ivory-600" />
                          )}
                        </button>
                        <div className={`w-1 h-8 rounded-full ${colors.bar} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-carbon-800 truncate">{data.name}</div>
                          <div className="text-[11px] text-ivory-500 truncate">{data.owner} · {data.city}</div>
                        </div>
                        <span className={`text-[11px] font-mono font-semibold ${colors.text} shrink-0`}>
                          {data.progress}%
                        </span>
                      </div>
                    );
                  }
                  if (type === 'phase') {
                    const colors = statusColorMap[data.status];
                    return (
                      <div key={data.id} className={`h-[42px] border-b border-ivory-100 flex items-center gap-2 px-3 hover:bg-ivory-50 transition-colors cursor-pointer`} style={{ paddingLeft: 12 + level * 20 }}>
                        <button
                          onClick={() => togglePhase(data.id)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-ivory-200 transition-colors shrink-0"
                        >
                          {data.subtasks.length > 0 && (
                            expandedPhases.has(data.id)
                              ? <ChevronDown className="w-3.5 h-3.5 text-ivory-600" />
                              : <ChevronRight className="w-3.5 h-3.5 text-ivory-600" />
                          )}
                        </button>
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.bar} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-carbon-700 truncate">{data.name}</div>
                        </div>
                        <span className={`text-[11px] font-mono ${colors.text} shrink-0`}>
                          {data.progress}%
                        </span>
                      </div>
                    );
                  }
                  const colors = statusColorMap[data.status];
                  return (
                    <div key={data.id} className="h-[42px] border-b border-ivory-100 flex items-center gap-2 px-3 hover:bg-ivory-50 transition-colors" style={{ paddingLeft: 12 + level * 20 }}>
                      <div className="w-5 h-5 shrink-0" />
                      <div className={`w-1 h-1 rounded-full ${data.status === 'milestone' ? '' : colors.bar} shrink-0`}>
                        {data.status === 'milestone' && <Diamond className={`w-2.5 h-2.5 ${colors.text} fill-current -ml-1 -mt-0.5`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs truncate ${data.status === 'milestone' ? 'text-amber-700 font-medium' : 'text-carbon-600'}`}>
                          {data.name}
                        </div>
                        <div className="text-[10px] text-ivory-500 truncate">{data.assignee}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin relative">
              <div style={{ width: TIMELINE_WIDTH, minWidth: '100%' }}>
                <div className="sticky top-0 z-20 bg-ivory-50/80 backdrop-blur border-b border-ivory-200">
                  <div className="flex border-b border-ivory-200 h-7">
                    {months.map((m, i) => (
                      <div
                        key={i}
                        className="border-r border-ivory-200 text-[11px] font-semibold text-carbon-700 flex items-center justify-center bg-gradient-to-b from-ivory-100 to-white"
                        style={{ width: m.span * DAY_WIDTH }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-7 border-b border-ivory-100">
                    {timelineDays.map((d, i) => (
                      <div
                        key={i}
                        className={`border-r border-ivory-100 text-[10px] flex items-center justify-center ${
                          d.date.day() === 0 || d.date.day() === 6 ? 'bg-haze-50/50 text-haze-600' : 'text-ivory-600'
                        } ${d.date.date() === 1 ? 'border-l border-ivory-300' : ''}`}
                        style={{ width: DAY_WIDTH }}
                      >
                        {d.date.date()}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-[40px] bg-white/80">
                    {timelineDays.map((d, i) => (
                      <div
                        key={i}
                        className={`border-r border-ivory-100 text-[10px] flex items-end justify-center pb-1 ${
                          d.date.day() === 0 ? 'bg-haze-50/50' : ''
                        } ${d.date.isSame(dayjs(), 'day') ? 'bg-terracotta-50' : ''}`}
                        style={{ width: DAY_WIDTH }}
                      >
                        {d.date.day() === 1 && (
                          <span className="font-medium text-carbon-500">{['日', '一', '二', '三', '四', '五', '六'][d.date.day()]}</span>
                        )}
                        {d.date.isSame(dayjs(), 'day') && (
                          <div className="absolute w-0.5 top-0 bottom-0 bg-terracotta-500 animate-pulse" style={{ width: 2 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {treeRows.map((row) => {
                    if (row.type === 'project') {
                      return renderGanttBar({
                        id: row.data.id,
                        name: row.data.name,
                        start: row.data.start,
                        end: row.data.end,
                        progress: row.data.progress,
                        status: row.data.status,
                      }, row.level);
                    }
                    if (row.type === 'phase') {
                      return renderGanttBar({
                        id: row.data.id,
                        name: row.data.name,
                        start: row.data.start,
                        end: row.data.end,
                        progress: row.data.progress,
                        status: row.data.status,
                      }, row.level);
                    }
                    return renderGanttBar(row.data as SubTask, row.level);
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-ivory-600">
            <LayoutList className="w-12 h-12 mx-auto mb-3 text-ivory-400" />
            <p>列表视图开发中...</p>
          </div>
        )}

        <AnimatePresence>
          {detailPanelOpen && selectedProject && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-ivory-200 shadow-2xl z-30 overflow-y-auto scrollbar-thin"
            >
              <div className="sticky top-0 bg-white border-b border-ivory-200 px-5 py-4 flex items-center justify-between z-10">
                <h3 className="font-serif text-lg font-semibold text-carbon-800">项目详情</h3>
                <button
                  onClick={() => setDetailPanelOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-ivory-100 flex items-center justify-center text-ivory-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-carbon-800 text-lg">{selectedProject.name}</h4>
                      <p className="text-sm text-ivory-600 mt-0.5 font-mono">{selectedProject.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColorMap[selectedProject.status].bg} ${statusColorMap[selectedProject.status].border} border ${statusColorMap[selectedProject.status].text}`}>
                      {selectedProject.status === 'delayed' ? <AlertTriangle className="w-3 h-3" /> : null}
                      {{ not_started: '规划中', in_progress: '进行中', delayed: '延期', completed: '已完成', milestone: '里程碑' }[selectedProject.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-ivory-600"><User className="w-4 h-4" />业主：{selectedProject.owner}</div>
                    <div className="flex items-center gap-2 text-ivory-600"><Building2 className="w-4 h-4" />{selectedProject.provider}</div>
                    <div className="flex items-center gap-2 text-ivory-600"><MapPin className="w-4 h-4" />{selectedProject.city}</div>
                    <div className="flex items-center gap-2 text-ivory-600"><Clock className="w-4 h-4" />{selectedProject.start.format('MM/DD')} ~ {selectedProject.end.format('MM/DD')}</div>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-ivory-600">整体进度</span>
                      <span className="font-mono text-sm font-bold text-terracotta-600">{selectedProject.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ivory-200 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedProject.progress}%` }}
                        className="h-full bg-gradient-to-r from-wood-400 to-terracotta-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {selectedProject.warning && selectedProject.warning.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-carbon-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      延期预警
                    </h5>
                    {selectedProject.warning.map((w, i) => (
                      <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-amber-700 mb-0.5">{w.type}</div>
                          <div className="text-sm text-amber-900">{w.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedProject.milestones && (
                  <div>
                    <h5 className="text-sm font-semibold text-carbon-700 mb-3 flex items-center gap-2">
                      <Diamond className="w-4 h-4 text-amber-500 fill-amber-500" />
                      关键节点
                    </h5>
                    <div className="space-y-2">
                      {selectedProject.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-ivory-50 border border-ivory-200/60">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <span className="text-amber-700 font-mono text-xs font-bold">{m.date.format('DD')}</span>
                          </div>
                          <div>
                            <div className="text-sm text-carbon-700 font-medium">{m.name}</div>
                            <div className="text-xs text-ivory-500">{m.date.format('YYYY年MM月')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.members && (
                  <div>
                    <h5 className="text-sm font-semibold text-carbon-700 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-haze-500" />
                      参与人员
                    </h5>
                    <div className="space-y-2">
                      {selectedProject.members.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-ivory-50 transition-colors">
                          <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full bg-ivory-100 border border-ivory-200" />
                          <div className="flex-1">
                            <div className="text-sm text-carbon-700 font-medium">{m.name}</div>
                            <div className="text-xs text-ivory-500">{m.role}</div>
                          </div>
                          <button className="w-7 h-7 rounded-lg hover:bg-haze-100 flex items-center justify-center text-haze-500 transition-colors">
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 btn-primary text-sm">
                    <ArrowLeftRight className="w-4 h-4" />
                    调整工期
                  </button>
                  <button className="btn-secondary text-sm">查看完整进度</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card-base px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <span className="text-ivory-600 font-medium shrink-0">图例：</span>
        {Object.entries({
          not_started: '未开始',
          in_progress: '进行中',
          completed: '已完成',
          delayed: '延期',
        }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-5 h-3 rounded ${statusColorMap[key as TaskStatus].bar}`} />
            <span className="text-ivory-700">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Diamond className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-ivory-700">里程碑</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded border-2 border-dashed border-carbon-400" />
          <span className="text-ivory-700">计划线</span>
        </div>
        <div className="ml-auto text-ivory-500 flex items-center gap-2">
          <span>选中任务数: <span className="font-mono font-semibold text-terracotta-600">{selectedTasks.size}</span></span>
          {selectedTasks.size >= 2 && (
            <button className="text-haze-600 hover:text-haze-800 underline underline-offset-2">
              批量调整依赖关系
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectGantt;
