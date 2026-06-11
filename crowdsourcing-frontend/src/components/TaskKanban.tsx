import React, { useState } from 'react';
import { Card, Tag, Avatar, Empty, Spin, message } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Task, TaskStatus, KanbanColumn } from '@/types';
import dayjs from 'dayjs';
import { taskApi } from '@/api';
import { useNavigate } from 'react-router-dom';

interface TaskKanbanProps {
  columns: KanbanColumn[];
  loading?: boolean;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  allowDrag?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  draft: 'default',
  pending: 'warning',
  published: 'blue',
  bidding: 'cyan',
  selected: 'geekblue',
  in_progress: 'processing',
  submitted: 'purple',
  reviewing: 'gold',
  revising: 'orange',
  completed: 'success',
  cancelled: 'default',
  disputed: 'red'
};


const categoryColors: Record<string, string> = {
  government: 'magenta',
  livelihood: 'blue',
  community: 'green',
  market: 'orange',
  safety: 'red',
  data: 'purple'
};

const TaskKanban: React.FC<TaskKanbanProps> = ({ columns, loading = false, onTaskMove, allowDrag = true }) => {
  const navigate = useNavigate();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleDragStart = (task: Task) => {
    if (!allowDrag) return;
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      setUpdating(true);
      await taskApi.updateStatus(draggedTask.id, newStatus);
      message.success('状态更新成功');
      if (onTaskMove) {
        onTaskMove(draggedTask.id, newStatus);
      }
    } catch (error) {
      console.error('Update status error:', error);
    } finally {
      setUpdating(false);
      setDraggedTask(null);
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/admin/tasks`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((column) => (
        <div
          key={column.key}
          className={`flex-shrink-0 w-72 min-w-[288px] bg-gray-100 rounded-lg p-3 transition-colors ${
            dragOverColumn === column.key ? 'bg-blue-100 ring-2 ring-primary-500' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, column.key)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.key)}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-800">{column.title}</h3>
              <Tag color={statusColors[column.key]} className="m-0">
                {column.tasks.length}
              </Tag>
            </div>
          </div>

          <div className="space-y-3 min-h-[100px]">
            {column.tasks.length === 0 ? (
              <Empty description="暂无办件" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
            ) : (
              column.tasks.map((task) => (
                <Card
                  key={task.id}
                 
                  className={`card-hover cursor-move ${
                    draggedTask?.id === task.id ? 'opacity-50' : ''
                  } ${updating ? 'pointer-events-none' : ''}`}
                  draggable={allowDrag}
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag color={categoryColors[task.category] || 'default'} className="m-0 text-xs">
                        {task.categoryName}
                      </Tag>
                      <Tag color={statusColors[task.status]} className="m-0 text-xs">
                        {task.statusName}
                      </Tag>
                    </div>

                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 m-0">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Avatar size={18} src={task.employerAvatar} icon={<UserOutlined />}>
                          {task.employerName?.charAt(0)}
                        </Avatar>
                        <span className="truncate max-w-[80px]">{task.categoryName || '政务服务'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockCircleOutlined />
                        <span>{task.deadline ? dayjs(task.deadline).format('MM-DD') : '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <CalendarOutlined />
                        <span>{dayjs(task.deadline).format('MM-DD')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TeamOutlined />
                        <span>{task.bidCount || 0}人申请</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskKanban;
