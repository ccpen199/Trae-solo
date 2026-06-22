import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  Paperclip,
  User,
  X,
  FolderKanban,
  ArrowLeft,
  Clock,
  Tag as TagIcon,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Avatar,
  Tag,
  message,
  Empty,
  Tooltip,
} from 'antd';
import { TASK_STATUS_CONFIG, WORK_CASE_STATUS_CONFIG } from '@/constants';
import { mockTasks, mockWorkCases, mockUser } from '@/mock/data';
import { formatDate, isOverdue, isUpcoming } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, Priority, CreateTaskParams } from '@/types/workspace';

const columns: { id: TaskStatus; title: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { id: 'todo', title: '待办', icon: <Clock className="w-4 h-4" />, color: 'text-neutral-ink-500', bgColor: 'bg-neutral-ink-100' },
  { id: 'in_progress', title: '进行中', icon: <FolderKanban className="w-4 h-4" />, color: 'text-primary-500', bgColor: 'bg-primary-50' },
  { id: 'review', title: '审核中', icon: <AlertCircle className="w-4 h-4" />, color: 'text-accent-gold', bgColor: 'bg-yellow-50' },
  { id: 'done', title: '已完成', icon: <Calendar className="w-4 h-4" />, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'archived', title: '已归档', icon: <FolderKanban className="w-4 h-4" />, color: 'text-neutral-ink-400', bgColor: 'bg-neutral-ink-50' },
];

const priorityConfig: Record<Priority, { label: string; color: string; dot: string; bg: string }> = {
  high: { label: '高', color: 'text-accent-red', dot: 'bg-accent-red', bg: 'bg-red-50' },
  medium: { label: '中', color: 'text-accent-gold', dot: 'bg-accent-gold', bg: 'bg-yellow-50' },
  low: { label: '低', color: 'text-green-600', dot: 'bg-green-500', bg: 'bg-green-50' },
};

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'lc-card p-4 cursor-pointer group hover:shadow-card-hover transition-all',
        isDragging && 'opacity-50 shadow-card-hover rotate-2'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="p-1 -ml-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-ink-100 rounded transition-all cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-neutral-ink-400" />
          </button>
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityConfig[task.priority].dot)} />
        </div>
        <Tag
          color={priorityConfig[task.priority].color === 'text-accent-red' ? 'error' : priorityConfig[task.priority].color === 'text-accent-gold' ? 'warning' : 'success'}
          className="!m-0 !text-xs"
        >
          {priorityConfig[task.priority].label}
        </Tag>
      </div>

      <h4 className="text-sm font-medium text-neutral-ink-900 line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center gap-2 text-xs text-neutral-ink-500 mb-3">
        <FolderKanban className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{task.caseTitle}</span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag) => (
            <Tag key={tag} className="!m-0 !text-xs !px-2 !py-0.5">
              {tag}
            </Tag>
          ))}
          {task.tags.length > 2 && (
            <Tag className="!m-0 !text-xs !px-2 !py-0.5">+{task.tags.length - 2}</Tag>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-neutral-ink-100">
        <div className="flex items-center gap-3">
          <Avatar size={20} src={task.assigneeAvatar} className="flex-shrink-0" />
          {task.dueDate && (
            <span className={cn(
              'text-xs flex items-center gap-1',
              isOverdue(task.dueDate) ? 'text-accent-red' : isUpcoming(task.dueDate, 3) ? 'text-accent-gold' : 'text-neutral-ink-500'
            )}>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {formatDate(task.dueDate, 'MM-DD')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-ink-400">
          {task.comments > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {task.comments}
            </span>
          )}
          {task.attachments > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              {task.attachments}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => (
  <div
    className="lc-card p-4 cursor-pointer group hover:shadow-card-hover transition-all"
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityConfig[task.priority].dot)} />
      </div>
      <Tag
        color={priorityConfig[task.priority].color === 'text-accent-red' ? 'error' : priorityConfig[task.priority].color === 'text-accent-gold' ? 'warning' : 'success'}
        className="!m-0 !text-xs"
      >
        {priorityConfig[task.priority].label}
      </Tag>
    </div>

    <h4 className="text-sm font-medium text-neutral-ink-900 line-clamp-2 mb-2 group-hover:text-primary-500 transition-colors">
      {task.title}
    </h4>

    <div className="flex items-center gap-2 text-xs text-neutral-ink-500 mb-3">
      <FolderKanban className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{task.caseTitle}</span>
    </div>

    {task.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.slice(0, 2).map((tag) => (
          <Tag key={tag} className="!m-0 !text-xs !px-2 !py-0.5">
            {tag}
          </Tag>
        ))}
        {task.tags.length > 2 && (
          <Tag className="!m-0 !text-xs !px-2 !py-0.5">+{task.tags.length - 2}</Tag>
        )}
      </div>
    )}

    <div className="flex items-center justify-between pt-3 border-t border-neutral-ink-100">
      <div className="flex items-center gap-3">
        <Avatar size={20} src={task.assigneeAvatar} className="flex-shrink-0" />
        {task.dueDate && (
          <span className={cn(
            'text-xs flex items-center gap-1',
            isOverdue(task.dueDate) ? 'text-accent-red' : isUpcoming(task.dueDate, 3) ? 'text-accent-gold' : 'text-neutral-ink-500'
          )}>
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {formatDate(task.dueDate, 'MM-DD')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-ink-400">
        {task.comments > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {task.comments}
          </span>
        )}
        {task.attachments > 0 && (
          <span className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {task.attachments}
          </span>
        )}
      </div>
    </div>
  </div>
);

const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createColumnStatus, setCreateColumnStatus] = useState<TaskStatus>('todo');
  const [form] = Form.useForm<CreateTaskParams>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnTasks = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      archived: [],
    };
    tasks.forEach((task) => {
      if (result[task.status]) {
        result[task.status].push(task);
      }
    });
    return result;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) || null,
    [tasks, activeId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: overColumn.id } : task
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: overColumn.id } : task
        )
      );
      message.success('任务状态已更新');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateColumnStatus(status);
    setCreateModalVisible(true);
  };

  const handleCreateTask = async (values: CreateTaskParams) => {
    message.success('任务创建成功');
    setCreateModalVisible(false);
    form.resetFields();
  };

  const caseOptions = mockWorkCases.map((c) => ({
    value: c.id,
    label: c.title,
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workspace')}
            className="p-2 hover:bg-neutral-ink-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-ink-600" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary-900">任务看板</h1>
            <p className="text-neutral-ink-500 mt-1">
              可视化管理案件任务，拖拽卡片更新状态
            </p>
          </div>
        </div>
        <button
          onClick={() => handleAddTask('todo')}
          className="lc-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 flex flex-col bg-neutral-ink-50/50 rounded-xl"
            >
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-lg', column.bgColor)}>
                    <span className={column.color}>{column.icon}</span>
                  </div>
                  <span className="font-semibold text-sm text-neutral-ink-900">
                    {column.title}
                  </span>
                  <span className="text-xs text-neutral-ink-500 bg-neutral-ink-200 px-2 py-0.5 rounded-full">
                    {columnTasks[column.id].length}
                  </span>
                </div>
                <Tooltip title="添加任务">
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="p-1.5 hover:bg-neutral-ink-200 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-neutral-ink-500" />
                  </button>
                </Tooltip>
              </div>

              <SortableContext
                items={columnTasks[column.id].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={column.id}
              >
                <div
                  data-column-id={column.id}
                  className="flex-1 space-y-3 p-4 pt-0 min-h-[200px]"
                >
                  {columnTasks[column.id].length > 0 ? (
                    columnTasks[column.id].map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-neutral-ink-400">
                      <Empty
                        description={
                          <span className="text-xs text-neutral-ink-400">暂无任务</span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-80 opacity-90">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Modal
        title={<span className="font-serif text-lg font-semibold">任务详情</span>}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedTask(null);
          }}>
            关闭
          </Button>,
          <Button key="edit" type="primary">
            编辑任务
          </Button>,
        ]}
        width={560}
      >
        {selectedTask && (
          <div className="space-y-5 mt-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', priorityConfig[selectedTask.priority].dot)} />
                  <Tag color={priorityConfig[selectedTask.priority].color === 'text-accent-red' ? 'error' : priorityConfig[selectedTask.priority].color === 'text-accent-gold' ? 'warning' : 'success'}>
                    {priorityConfig[selectedTask.priority].label}优先级
                  </Tag>
                  <Tag color={TASK_STATUS_CONFIG[selectedTask.status].color}>
                    {TASK_STATUS_CONFIG[selectedTask.status].label}
                  </Tag>
                </div>
                <h3 className="text-lg font-semibold text-neutral-ink-900">
                  {selectedTask.title}
                </h3>
              </div>
              <button className="p-2 hover:bg-neutral-ink-100 rounded-lg transition-colors flex-shrink-0">
                <MoreHorizontal className="w-5 h-5 text-neutral-ink-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-ink-50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FolderKanban className="w-4 h-4 text-neutral-ink-400 flex-shrink-0" />
                  <span className="text-neutral-ink-500">关联案件：</span>
                  <span className="text-neutral-ink-900 font-medium truncate">{selectedTask.caseTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-neutral-ink-400 flex-shrink-0" />
                  <span className="text-neutral-ink-500">负责人：</span>
                  <div className="flex items-center gap-1.5">
                    <Avatar size={20} src={selectedTask.assigneeAvatar} />
                    <span className="text-neutral-ink-900 font-medium">{selectedTask.assigneeName}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {selectedTask.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className={cn(
                      'w-4 h-4 flex-shrink-0',
                      isOverdue(selectedTask.dueDate) ? 'text-accent-red' : isUpcoming(selectedTask.dueDate, 3) ? 'text-accent-gold' : 'text-neutral-ink-400'
                    )} />
                    <span className="text-neutral-ink-500">截止日期：</span>
                    <span className={cn(
                      'font-medium',
                      isOverdue(selectedTask.dueDate) ? 'text-accent-red' : isUpcoming(selectedTask.dueDate, 3) ? 'text-accent-gold' : 'text-neutral-ink-900'
                    )}>
                      {formatDate(selectedTask.dueDate)}
                      {isOverdue(selectedTask.dueDate) && '（已逾期）'}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-neutral-ink-400 flex-shrink-0" />
                  <span className="text-neutral-ink-500">创建时间：</span>
                  <span className="text-neutral-ink-900 font-medium">{formatDate(selectedTask.createdAt)}</span>
                </div>
              </div>
            </div>

            {selectedTask.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-neutral-ink-500">
                  <TagIcon className="w-4 h-4" />
                  <span>标签</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map((tag) => (
                    <Tag key={tag} className="!m-0">{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-neutral-ink-500 mb-2">任务描述</div>
              <p className="text-sm text-neutral-ink-700 leading-relaxed">
                {selectedTask.description}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-neutral-ink-100">
              <span className="flex items-center gap-1.5 text-sm text-neutral-ink-500">
                <MessageSquare className="w-4 h-4" />
                {selectedTask.comments} 条评论
              </span>
              <span className="flex items-center gap-1.5 text-sm text-neutral-ink-500">
                <Paperclip className="w-4 h-4" />
                {selectedTask.attachments} 个附件
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<span className="font-serif text-lg font-semibold">新建任务</span>}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
          className="mt-4"
        >
          <Form.Item
            label="任务标题"
            name="title"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            label="关联案件"
            name="caseId"
            rules={[{ required: true, message: '请选择关联案件' }]}
          >
            <Select
              placeholder="选择关联案件"
              showSearch
              optionFilterProp="label"
              options={caseOptions}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="负责人"
              name="assigneeId"
              rules={[{ required: true, message: '请选择负责人' }]}
              initialValue={mockUser.id}
            >
              <Select
                options={[
                  {
                    value: mockUser.id,
                    label: (
                      <span className="flex items-center gap-2">
                        <Avatar size={20} src={mockUser.avatar} />
                        {mockUser.name}
                      </span>
                    ),
                  },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
              initialValue="medium"
            >
              <Select
                options={[
                  { value: 'high', label: '高优先级' },
                  { value: 'medium', label: '中优先级' },
                  { value: 'low', label: '低优先级' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="截止日期"
            name="dueDate"
          >
            <DatePicker className="w-full" placeholder="选择截止日期" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <Input.TextArea
              placeholder="请详细描述任务内容"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
            initialValue={[]}
          >
            <Select
              mode="tags"
              placeholder="输入标签后回车添加"
              options={[
                { value: '证据', label: '证据' },
                { value: '开庭准备', label: '开庭准备' },
                { value: '法律文书', label: '法律文书' },
                { value: '会见', label: '会见' },
                { value: '阅卷', label: '阅卷' },
                { value: '合同审查', label: '合同审查' },
                { value: '法律顾问', label: '法律顾问' },
              ]}
            />
          </Form.Item>

          <Form.Item label="任务状态" hidden initialValue={createColumnStatus} name="status">
            <Input />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-ink-100">
            <Button onClick={() => {
              setCreateModalVisible(false);
              form.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建任务
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
