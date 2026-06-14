import React from 'react';
import { Card, Tag, Button, Avatar } from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  TagOutlined,
  RightOutlined
} from '@ant-design/icons';
import { Task, TaskStatus } from '@/types';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onView?: (id: string) => void;
  showEmployer?: boolean;
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

const statusNames: Record<TaskStatus, string> = {
  draft: '草稿',
  pending: '待受理',
  published: '已发布',
  bidding: '待分配',
  selected: '已分配',
  in_progress: '办理中',
  submitted: '已提交',
  reviewing: '审核中',
  revising: '修改中',
  completed: '已办结',
  cancelled: '已撤销',
  disputed: '有异议'
};

const categoryColors: Record<string, string> = {
  government: 'magenta',
  livelihood: 'blue',
  community: 'green',
  market: 'orange',
  safety: 'red',
  data: 'purple'
};


const TaskCard: React.FC<TaskCardProps> = ({ task, onView, showEmployer = false }) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (onView) {
      onView(task.id);
    } else {
      navigate(`/platform/tasks/${task.id}`);
    }
  };

  return (
    <Card className="card-hover h-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Tag color={categoryColors[task.category] || 'default'}>
              {task.categoryName}
            </Tag>
            <Tag color={statusColors[task.status]}>
              {statusNames[task.status]}
            </Tag>
          </div>
          {task.auditStatus === 'pending' && (
            <Tag color="warning">审核中</Tag>
          )}
        </div>

        <h3 
          className="text-lg font-semibold text-gray-800 line-clamp-2 cursor-pointer hover:text-primary-700 transition-colors"
          onClick={handleView}
        >
          {task.title}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
          {task.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {task.skills.slice(0, 4).map((skill, index) => (
            <Tag key={index} className="m-0 bg-gray-100 text-gray-600 border-none">
              {skill}
            </Tag>
          ))}
          {task.skills.length > 4 && (
            <Tag className="m-0 bg-gray-100 text-gray-600 border-none">
              +{task.skills.length - 4}
            </Tag>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <TagOutlined className="text-primary-600" />
            <span>
              {task.categoryName || '政务服务'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarOutlined className="text-primary-600" />
            <span>{dayjs(task.deadline).format('YYYY-MM-DD')}</span>
          </div>
          <div className="flex items-center gap-1">
            <TeamOutlined className="text-primary-600" />
            <span>{task.bidCount || 0} 人申请</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeOutlined className="text-primary-600" />
            <span>{task.viewCount || 0} 次查看</span>
          </div>
        </div>

        {showEmployer && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Avatar size={28} src={task.employerAvatar} icon={<UserOutlined />}>
              {task.employerName?.charAt(0)}
            </Avatar>
            <span className="text-sm text-gray-600">{task.employerName || '申请人'}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button 
            type="primary" 
            onClick={handleView}
            icon={<RightOutlined />}
            iconPosition="end"
           
          >
            查看详情
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
