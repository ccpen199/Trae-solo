import React, { useState, useMemo, useRef } from 'react';
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
  UserCheck,
  Flag,
  GripVertical,
  History,
  AlertOctagon,
} from 'lucide-react';
import { Tabs, Select, DatePicker, Tooltip as AntTooltip, Switch, Modal, message } from 'antd';
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

const statusLabelMap: Record<TaskStatus, string> = {
  not_started: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '延期',
  milestone: '里程碑',
};

type PhaseType = 'demolition' | 'plumbing' | 'masonry' | 'paint' | 'installation' | 'acceptance' | 'other';
const phaseColorMap: Record<PhaseType, { bar: string; bg: string; border: string; text: string; label: string }> = {
  demolition:   { bar: 'bg-gradient-to-r from-rose-500 to-rose-600',     bg: 'bg-rose-100',     border: 'border-rose-400',     text: 'text-rose-700',     label: '拆改' },
  plumbing:     { bar: 'bg-gradient-to-r from-orange-500 to-orange-600', bg: 'bg-orange-100',   border: 'border-orange-400',   text: 'text-orange-700',   label: '水电' },
  masonry:      { bar: 'bg-gradient-to-r from-amber-400 to-amber-500',   bg: 'bg-amber-100',    border: 'border-amber-400',    text: 'text-amber-700',    label: '泥木' },
  paint:        { bar: 'bg-gradient-to-r from-emerald-500 to-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-400',  text: 'text-emerald-700',  label: '油漆' },
  installation: { bar: 'bg-gradient-to-r from-blue-500 to-blue-600',     bg: 'bg-blue-100',     border: 'border-blue-400',     text: 'text-blue-700',     label: '安装' },
  acceptance:   { bar: 'bg-gradient-to-r from-purple-500 to-purple-600', bg: 'bg-purple-100',   border: 'border-purple-400',   text: 'text-purple-700',   label: '验收' },
  other:        { bar: 'bg-gradient-to-r from-haze-500 to-haze-600',     bg: 'bg-haze-100',     border: 'border-haze-400',     text: 'text-haze-700',     label: '其他' },
};
const detectPhaseType = (name: string): PhaseType => {
  if (/拆|砸|改|demolition/i.test(name)) return 'demolition';
  if (/水|电|管|线|plumb|electric/i.test(name)) return 'plumbing';
  if (/泥|瓦|砖|木|吊顶|maso|tile|carpenter/i.test(name)) return 'masonry';
  if (/油|漆|墙|面|paint/i.test(name)) return 'paint';
  if (/安装|橱柜|地板|门|灯|install/i.test(name)) return 'installation';
  if (/验收|竣工|交接|accept/i.test(name)) return 'acceptance';
  return 'other';
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

  const [phaseDetailModal, setPhaseDetailModal] = useState<{ open: boolean; project: Project | null; phase: Phase | null; level: number }>({ open: false, project: null, phase: null, level: 0 });
  const [dragging, setDragging] = useState<{ taskId: string; startX: number; startLeft: number; startWidth: number; mode: 'move' | 'resize' } | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

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
    extra?: { project?: Project; phase?: Phase },
  ) => {
    const statusColors = statusColorMap[task.status];
    const phaseType = detectPhaseType(task.name);
    const phaseColors = phaseColorMap[phaseType];
    const usePhaseColors = rowLevel >= 1;
    const barColors = usePhaseColors ? phaseColors : statusColors;
    const isDelayed = task.status === 'delayed';
    const planPos = getTaskPosition(task.start, task.end, true);
    const isToday = startDate.add(35, 'day').isAfter(task.start) && startDate.add(35, 'day').isBefore(task.end);

    return (
      <div
        key={task.id}
        ref={dragRef}
        className={`relative h-[42px] border-b border-ivory-100 hover:bg-ivory-50/60 transition-colors group ${isDelayed ? 'bg-rose-50/20' : ''}`}
        style={{ paddingLeft: rowLevel * 16 }}
      >
        {isDelayed && (
          <div
            className="absolute top-0 bottom-0 w-0.5 z-20"
            style={{
              left: planPos.left + planPos.width,
              background: `repeating-linear-gradient(to bottom, #F43F5E 0, #F43F5E 4px, transparent 4px, transparent 8px)`,
              animation: 'ganttBlink 1s ease-in-out infinite',
            }}
          />
        )}
        <div
          className="absolute inset-0 flex items-center pointer-events-none"
          style={{ width: TIMELINE_WIDTH }}
        >
          {task.status !== 'milestone' ? (
            <>
              {showPlan && (
                <div
                  className={`h-3 rounded-full border-2 border-dashed ${isDelayed ? 'border-rose-400' : phaseColors.border} ${isDelayed ? 'opacity-90' : 'opacity-60'}`}
                  style={{
                    marginLeft: planPos.left,
                    width: planPos.width,
                  }}
                />
              )}
              <AntTooltip
                title={
                  <div className="space-y-1.5 text-xs p-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {usePhaseColors && <span className={`inline-block w-2 h-2 rounded ${phaseColors.bar.replace('bg-gradient-to-r ', 'bg-').split(' ')[0]}`} />}
                      {task.name}
                    </div>
                    <div className="text-ivory-200">计划: {task.start.format('MM/DD')} ~ {task.end.format('MM/DD')}（{task.end.diff(task.start, 'day') + 1}天）</div>
                    {task.actualStart && <div className="text-ivory-200">实际: {task.actualStart.format('MM/DD')} ~</div>}
                    <div className="text-ivory-200">完成度: {task.progress}%</div>
                    {task.assignee && <div className="text-ivory-200">负责人: {task.assignee}</div>}
                    {task.remark && <div className="text-amber-300">⚠️ {task.remark}</div>}
                    {isDelayed && <div className="text-rose-300 font-semibold">🚨 延期预警！进度落后于计划</div>}
                    <div className="pt-1 mt-1 border-t border-white/10 text-ivory-300 text-[10px]">💡 点击查看详情 · 拖动调整时间 · 拖右边缘改工期</div>
                  </div>
                }
              >
                <div
                  className={`relative h-7 rounded-lg shadow-sm cursor-grab active:cursor-grabbing
                    hover:brightness-110 hover:shadow-lg transition-all border overflow-hidden
                    ${isDelayed ? 'ring-2 ring-rose-400/70 ring-offset-1' : ''}
                    ${dragging?.taskId === task.id ? 'ring-2 ring-terracotta-500 shadow-xl z-30 scale-[1.02]' : ''}
                    ${barColors.bar} ${barColors.border}`}
                  style={{
                    marginLeft: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).left : planPos.left,
                    width: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).width : planPos.width,
                    animation: isDelayed ? 'ganttBlink 1.2s ease-in-out infinite' : undefined,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDragging({ taskId: task.id, startX: e.clientX, startLeft: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).left : planPos.left, startWidth: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).width : planPos.width, mode: 'move' });
                  }}
                  onMouseMove={(e) => {
                    if (!dragging || dragging.taskId !== task.id) return;
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragging) { setDragging(null); return; }
                    if (rowLevel === 1 && extra?.project && extra?.phase) {
                      setPhaseDetailModal({ open: true, project: extra.project, phase: extra.phase, level: rowLevel });
                      message.info(`已打开「${task.name}」阶段详情`);
                    } else {
                      const next = new Set(selectedTasks);
                      if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                      setSelectedTasks(next);
                    }
                  }}
                >
                  {isToday && (
                    <div className="absolute -left-1 -top-1 z-20">
                      <div className="w-4 h-4 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-md animate-pulse">
                        <Flag className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                  <div
                    className="absolute left-0 top-0 h-full bg-black/20"
                    style={{ width: `${task.progress}%` }}
                  />
                  <div className="absolute left-0 top-0 w-1.5 h-full cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragging({ taskId: task.id, startX: e.clientX, startLeft: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).left : planPos.left, startWidth: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).width : planPos.width, mode: 'move' });
                    }}
                  >
                    <GripVertical className="w-3 h-3 text-white/70" />
                  </div>
                  <div className="relative z-10 h-full flex items-center px-2 gap-1 text-white">
                    {selectedTasks.has(task.id) && (
                      <div className="w-4 h-4 rounded bg-white/90 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-haze-600" />
                      </div>
                    )}
                    <span className="text-[11px] font-semibold truncate drop-shadow-sm">
                      {task.name}
                    </span>
                    {task.progress > 0 && task.progress < 100 && (
                      <span className="text-[10px] font-mono font-bold ml-auto shrink-0 bg-white/25 backdrop-blur px-1.5 py-0.5 rounded">
                        {task.progress}%
                      </span>
                    )}
                    {task.progress === 100 && (
                      <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" />
                    )}
                  </div>
                  <div
                    className="absolute right-0 top-0 w-2.5 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 transition-all flex items-center justify-center"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragging({ taskId: task.id, startX: e.clientX, startLeft: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).left : planPos.left, startWidth: task.actualStart ? getTaskPosition(task.actualStart, task.actualEnd ?? task.end, false).width : planPos.width, mode: 'resize' });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-0.5 h-4 rounded-full bg-white/70" />
                  </div>
                </div>
              </AntTooltip>
            </>
          ) : (
            <div
              className="absolute flex items-center justify-center"
              style={{ left: planPos.left + planPos.width / 2 - 8 }}
            >
              <AntTooltip title={`里程碑: ${task.name} (${task.start.format('MM/DD')})`}>
                <Diamond className={`w-4 h-4 ${statusColors.text} fill-current drop-shadow-sm cursor-pointer hover:scale-125 transition-transform`} />
              </AntTooltip>
            </div>
          )}
        </div>
      </div>
    );
  };

  const visibleProjects = mockProjects.filter(project => statusFilter === 'all' || project.status === statusFilter);
  const visiblePhaseCount = visibleProjects.reduce((sum, project) => sum + project.phases.length, 0);
  const visibleTaskCount = visibleProjects.reduce(
    (sum, project) => sum + project.phases.reduce((phaseSum, phase) => phaseSum + phase.subtasks.length, 0),
    0,
  );
  const delayedProjectCount = visibleProjects.filter(project => project.status === 'delayed').length;

  const treeRows: { type: string; data: any; level: number; project?: Project; phase?: Phase }[] = [];
  visibleProjects.forEach((project) => {
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

                <div
                  className="relative"
                  onMouseUp={(e) => {
                    if (dragging) {
                      const dx = e.clientX - dragging.startX;
                      const days = Math.round(dx / DAY_WIDTH);
                      const actionText = dragging.mode === 'move'
                        ? (days === 0 ? '位置未变' : `移动 ${days > 0 ? '+' : ''}${days} 天`)
                        : `工期调整 ${days > 0 ? '+' : ''}${days} 天`;
                      message.success(`已${dragging.mode === 'move' ? '移动' : '调整'}「${dragging.taskId}」: ${actionText}`);
                      setDragging(null);
                    }
                  }}
                  onMouseLeave={() => { if (dragging) setDragging(null); }}
                >
                  {treeRows.map((row) => {
                    if (row.type === 'project') {
                      return renderGanttBar({
                        id: row.data.id,
                        name: row.data.name,
                        start: row.data.start,
                        end: row.data.end,
                        progress: row.data.progress,
                        status: row.data.status,
                      }, row.level, { project: row.project });
                    }
                    if (row.type === 'phase') {
                      return renderGanttBar({
                        id: row.data.id,
                        name: row.data.name,
                        start: row.data.start,
                        end: row.data.end,
                        progress: row.data.progress,
                        status: row.data.status,
                      }, row.level, { project: row.project, phase: row.phase });
                    }
                    return renderGanttBar(row.data as SubTask, row.level, { phase: row.phase, project: row.project });
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin bg-ivory-50/50">
            <div className="sticky top-0 z-10 grid grid-cols-4 gap-3 border-b border-ivory-200 bg-white/95 p-4 backdrop-blur">
              {[
                ['项目数', visibleProjects.length],
                ['阶段数', visiblePhaseCount],
                ['任务数', visibleTaskCount],
                ['延期预警', delayedProjectCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-ivory-200 bg-ivory-50 px-4 py-3">
                  <div className="font-mono text-xl font-semibold text-carbon-800">{value}</div>
                  <div className="text-xs text-ivory-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {visibleProjects.map((project) => {
                const colors = statusColorMap[project.status];
                const duration = project.end.diff(project.start, 'day') + 1;
                return (
                  <div
                    key={project.id}
                    className="rounded-xl border border-ivory-200 bg-white p-5 shadow-sm hover:shadow-card transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedProject(project);
                      setDetailPanelOpen(true);
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-serif text-lg text-carbon-800">{project.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.border} border ${colors.text}`}>
                            {project.status === 'delayed' && <AlertTriangle className="w-3 h-3" />}
                            {statusLabelMap[project.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-ivory-600">
                          <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4" />{project.owner}</span>
                          <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" />{project.provider}</span>
                          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{project.city}</span>
                          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{project.start.format('MM/DD')} - {project.end.format('MM/DD')} · {duration}天</span>
                        </div>
                      </div>
                      <div className="w-44">
                        <div className="flex items-center justify-between text-xs text-ivory-600 mb-1.5">
                          <span>整体进度</span>
                          <span className={`font-mono font-semibold ${colors.text}`}>{project.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-ivory-200 overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </div>

                    {project.warning && project.warning.length > 0 && (
                      <div className="mt-4 grid gap-2">
                        {project.warning.map((warning, index) => (
                          <div key={`${warning.type}-${index}`} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{warning.type}：{warning.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 grid gap-3">
                      {project.phases.length > 0 ? (
                        project.phases.map((phase) => {
                          const phaseColors = statusColorMap[phase.status];
                          return (
                            <div key={phase.id} className="rounded-lg border border-ivory-200 bg-ivory-50 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${phaseColors.bar}`} />
                                    <span className="font-medium text-carbon-700">{phase.name}</span>
                                    <span className={`text-xs ${phaseColors.text}`}>{statusLabelMap[phase.status]}</span>
                                  </div>
                                  <div className="mt-1 text-xs text-ivory-500">
                                    {phase.start.format('MM/DD')} - {phase.end.format('MM/DD')} · {phase.subtasks.length} 个任务
                                  </div>
                                </div>
                                <span className={`font-mono text-sm font-semibold ${phaseColors.text}`}>{phase.progress}%</span>
                              </div>
                              <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
                                <div className={`h-full ${phaseColors.bar}`} style={{ width: `${phase.progress}%` }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-lg border border-dashed border-ivory-300 bg-ivory-50 p-4 text-sm text-ivory-600">
                          已建立项目主计划，待服务商同步详细阶段任务。
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleProjects.length === 0 && (
                <div className="rounded-xl border border-ivory-200 bg-white p-10 text-center">
                  <LayoutList className="w-10 h-10 mx-auto mb-3 text-ivory-400" />
                  <h3 className="font-serif text-xl text-carbon-800 mb-2">没有符合条件的项目</h3>
                  <p className="text-sm text-ivory-600">请切换项目状态筛选后查看。</p>
                </div>
              )}
            </div>
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
                      {statusLabelMap[selectedProject.status]}
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

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() =>
                      Modal.confirm({
                        title: '确认标记项目阶段更新？',
                        content: `将更新「${selectedProject.name}」的进度并同步通知项目经理和业主。`,
                        okText: '确认更新',
                        cancelText: '取消',
                        okButtonProps: { style: { background: '#22C55E', borderColor: '#22C55E' } },
                        onOk: () => message.success(`已更新「${selectedProject.name}」的进度状态`),
                      })
                    }
                    className="flex-1 btn-primary text-sm min-w-[120px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    标记进度更新
                  </button>
                  <button
                    onClick={() => message.info(`正在打开「${selectedProject.name}」的工期调整面板...`)}
                    className="btn-secondary text-sm"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    调整工期
                  </button>
                  {selectedProject.warning && selectedProject.warning.length > 0 && (
                    <button
                      onClick={() => message.warning(`已升级「${selectedProject.name}」的延期预警，将通知运营主管介入`)}
                      className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-btn text-sm font-medium
                        bg-rose-50 text-rose-700 border border-rose-200
                        hover:bg-rose-100 transition-all"
                    >
                      <AlertOctagon className="w-4 h-4" />
                      升级延期预警，通知主管介入
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Modal
          open={phaseDetailModal.open}
          onCancel={() => setPhaseDetailModal({ ...phaseDetailModal, open: false })}
          footer={null}
          width={720}
          destroyOnClose
          title={
            phaseDetailModal.phase ? (
              <div className="flex items-center gap-3 pr-12">
                <div className={`w-10 h-10 rounded-xl ${phaseColorMap[detectPhaseType(phaseDetailModal.phase.name)].bar} text-white flex items-center justify-center shadow-md`}>
                  {(() => { const Icon = phaseDetailModal.phase!.status === 'completed' ? CheckCircle2 : phaseDetailModal.phase!.status === 'delayed' ? AlertTriangle : Calendar; return <Icon className="w-5 h-5" />; })()}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-carbon-800">{phaseDetailModal.phase.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-ivory-500 font-mono">{phaseDetailModal.phase.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColorMap[phaseDetailModal.phase.status].bg} ${statusColorMap[phaseDetailModal.phase.status].text} ${statusColorMap[phaseDetailModal.phase.status].border}`}>
                      {{ not_started: '未开始', in_progress: '进行中', delayed: '延期', completed: '已完成', milestone: '里程碑' }[phaseDetailModal.phase.status]}
                    </span>
                  </div>
                </div>
              </div>
            ) : null
          }
        >
          {phaseDetailModal.project && phaseDetailModal.phase && (
            <div className="pt-2 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '计划开始', value: phaseDetailModal.phase.start.format('YYYY-MM-DD'), icon: Calendar, color: 'haze' },
                  { label: '计划完成', value: phaseDetailModal.phase.end.format('YYYY-MM-DD'), icon: Flag, color: 'terracotta' },
                  { label: '工期', value: `${phaseDetailModal.phase.end.diff(phaseDetailModal.phase.start, 'day') + 1} 天`, icon: Clock, color: 'wood' },
                ].map((m) => (
                  <div key={m.label} className="rounded-card p-3 bg-ivory-50 border border-ivory-200">
                    <div className="flex items-center gap-1.5 text-xs text-ivory-500 mb-1.5">
                      <m.icon className={`w-3.5 h-3.5 text-${m.color}-500`} />
                      {m.label}
                    </div>
                    <div className="font-mono text-base font-bold text-carbon-800">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-card p-4 bg-gradient-to-r from-ivory-50 to-white border border-ivory-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-carbon-700 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-terracotta-500" />
                    阶段总进度
                  </span>
                  <span className="font-mono text-2xl font-bold text-terracotta-600">{phaseDetailModal.phase.progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-ivory-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${phaseDetailModal.phase.progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${phaseColorMap[detectPhaseType(phaseDetailModal.phase.name)].bar}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-card p-4 bg-haze-50/60 border border-haze-200/60">
                  <h5 className="text-xs font-semibold text-haze-700 mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    阶段负责人
                  </h5>
                  <div className="space-y-2">
                    {phaseDetailModal.project.members?.slice(0, 2).map((m) => (
                      <div key={m.name} className="flex items-center gap-2">
                        <img src={m.avatar} className="w-8 h-8 rounded-full border border-haze-200" alt={m.name} />
                        <div>
                          <div className="text-sm font-medium text-carbon-700">{m.name}</div>
                          <div className="text-[10px] text-haze-500">{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-card p-4 bg-wood-50/60 border border-wood-200/60">
                  <h5 className="text-xs font-semibold text-wood-700 mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    最近更新
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-1.5 p-2 rounded bg-white/60 border border-ivory-100">
                      <span className="font-mono text-wood-500 shrink-0">10:32</span>
                      <span className="text-carbon-700">墙砖完成第4面，项目经理已打卡确认</span>
                    </div>
                    <div className="flex items-start gap-1.5 p-2 rounded bg-white/60 border border-ivory-100">
                      <span className="font-mono text-wood-500 shrink-0">昨日</span>
                      <span className="text-carbon-700">材料验收：瓷砖批次 #T2024合格入库</span>
                    </div>
                  </div>
                </div>
              </div>

              {phaseDetailModal.phase.status === 'delayed' && (
                <div className="rounded-card p-4 bg-rose-50 border border-rose-200">
                  <h5 className="text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    风险提示
                  </h5>
                  <ul className="space-y-1.5 text-sm text-rose-800">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                      <span>当前进度落后 <b>2-3 天</b>，主要原因：防水工程返工</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                      <span>后续油漆阶段可通过加班追赶，预计整体延期 <b>≤1天</b></span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="rounded-card overflow-hidden border border-ivory-200">
                <div className="px-4 py-2.5 bg-ivory-50 border-b border-ivory-200 flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-carbon-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-haze-500" />
                    子任务进度
                  </h5>
                  <span className="text-[10px] text-ivory-500">共 {phaseDetailModal.phase.subtasks.length} 项</span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-ivory-100">
                  {phaseDetailModal.phase.subtasks.map((st, i) => (
                    <div key={st.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-ivory-50 transition-colors">
                      <span className="font-mono text-[10px] text-ivory-400 w-6">#{String(i + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-carbon-700 truncate">{st.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-ivory-500 mt-0.5">
                          <span>{st.start.format('MM/DD')}-{st.end.format('MM/DD')}</span>
                          <span>· {st.assignee}</span>
                        </div>
                      </div>
                      <div className="w-24 shrink-0">
                        <div className="h-1.5 rounded-full bg-ivory-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${phaseColorMap[detectPhaseType(phaseDetailModal.phase!.name)].bar}`}
                            style={{ width: `${st.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className={`font-mono text-xs font-bold w-10 text-right ${st.progress === 100 ? 'text-emerald-600' : st.progress > 0 ? 'text-terracotta-600' : 'text-ivory-500'}`}>
                        {st.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {phaseDetailModal.phase.progress < 100 ? (
                  <button
                    onClick={() =>
                      Modal.confirm({
                        title: `标记「${phaseDetailModal.phase!.name}」为已完成？`,
                        content: (
                          <div className="pt-2 space-y-3">
                            <p className="text-sm">该操作将：</p>
                            <ul className="text-xs space-y-1 text-carbon-600">
                              <li>✅ 更新所有子任务为 100% 完成</li>
                              <li>📧 通知业主和监理阶段验收</li>
                              <li>📊 自动触发下一阶段的排期提醒</li>
                              <li>💰 阶段款项进入结算流程</li>
                            </ul>
                          </div>
                        ),
                        okText: '确认标记完成',
                        cancelText: '取消',
                        okButtonProps: { style: { background: '#22C55E', borderColor: '#22C55E' } },
                        onOk: () => {
                          message.success(`✅「${phaseDetailModal.phase!.name}」已标记为完成，已通知相关人员`);
                          setPhaseDetailModal({ ...phaseDetailModal, open: false });
                        },
                      })
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn
                      bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-sm
                      hover:from-emerald-600 hover:to-emerald-700 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    标记阶段完成
                  </button>
                ) : (
                  <div className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn
                    bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    此阶段已完成
                  </div>
                )}
                <button
                  onClick={() => { message.info('正在打开工期调整对话框...'); }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-btn
                    bg-haze-50 text-haze-700 font-medium border border-haze-200
                    hover:bg-haze-100 transition-all"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  调整起止时间
                </button>
                <button
                  onClick={() => message.warning(`已升级「${phaseDetailModal.phase!.name}」的风险`)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn
                    bg-white text-carbon-600 border border-ivory-300
                    hover:bg-ivory-50 transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>

      <div className="card-base px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="text-ivory-600 font-medium shrink-0">阶段类型：</span>
        {Object.entries(phaseColorMap).filter(([k]) => k !== 'other').map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-5 h-3 rounded ${cfg.bar}`} />
            <span className="text-ivory-700">{cfg.label}</span>
          </div>
        ))}
        <span className="mx-1 w-px h-4 bg-ivory-200 shrink-0" />
        <span className="text-ivory-600 font-medium shrink-0">状态：</span>
        {Object.entries({
          not_started: '未开始',
          in_progress: '进行中',
          completed: '已完成',
          delayed: '延期',
        }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${statusColorMap[key as TaskStatus].bg} ${statusColorMap[key as TaskStatus].border} border`}>
              <div className={`w-2 h-2 rounded-full ${statusColorMap[key as TaskStatus].bar}`} />
            </div>
            <span className="text-ivory-700">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Diamond className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-ivory-700">里程碑</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-3 rounded border-2 border-dashed border-rose-400 bg-rose-100/50" style={{ animation: 'ganttBlink 1.2s ease-in-out infinite' }} />
          <span className="text-rose-600 font-medium">延期预警</span>
        </div>
        <div className="ml-auto text-ivory-500 flex items-center gap-3">
          <span>选中: <span className="font-mono font-semibold text-terracotta-600">{selectedTasks.size}</span> 项</span>
          {selectedTasks.size >= 2 && (
            <button
              onClick={() => message.success(`已对 ${selectedTasks.size} 个任务建立依赖链`)}
              className="text-haze-600 hover:text-haze-800 underline underline-offset-2"
            >
              批量调整依赖
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ganttBlink {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
          50% { opacity: 0.55; box-shadow: 0 0 0 6px rgba(244, 63, 94, 0); }
        }
      `}</style>
    </div>
  );
};

export default ProjectGantt;
