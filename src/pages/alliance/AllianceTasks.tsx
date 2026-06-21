import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Empty } from '@/components/Empty';
import {
  ListTodo, Plus, RefreshCw, Clock, CheckCircle, AlertCircle,
  User, Calendar, ArrowUpRight, MoreHorizontal, X, Send,
  Filter, ChevronDown, TrendingUp
} from 'lucide-react';
import { allianceAPI } from '@/services/api';
import type { AllianceTask, TaskStatus } from '../../../shared/types';

const AllianceTasks: React.FC = () => {
  const [tasks, setTasks] = useState<AllianceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await allianceAPI.getTasks();
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = '请输入任务标题';
    if (!formData.description.trim()) newErrors.description = '请输入任务描述';
    if (!formData.assigneeId) newErrors.assigneeId = '请选择负责人';
    if (!formData.deadline) newErrors.deadline = '请选择截止时间';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await allianceAPI.createTask(
        formData.title,
        formData.description,
        formData.assigneeId,
        formData.deadline
      );

      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          assigneeId: '',
          deadline: '',
          priority: 'medium',
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('创建任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const response = await allianceAPI.updateTaskStatus(taskId, status);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status } : t
        ));
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> 待处理</Badge>;
      case 'in_progress':
        return <Badge variant="info" className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> 进行中</Badge>;
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 已完成</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 已取消</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const filteredTasks = statusFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === statusFilter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">协作任务</h1>
            <p className="text-slate-500 mt-1">跨区域协作任务派发与跟踪</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchTasks} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              派发任务
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">全部任务</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              本周新增 +{Math.floor(Math.random() * 10) + 3}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">待处理</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
            <p className="text-xs text-slate-400">需要及时处理</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">进行中</p>
            <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
            <p className="text-xs text-slate-400">正在推进中</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">已完成</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
            <p className="text-xs text-green-600">完成率 {stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {[
              { value: 'all', label: '全部' },
              { value: 'pending', label: '待处理' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-green-100 text-green-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">排序:</span>
            <select className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>最新发布</option>
              <option>截止时间</option>
              <option>优先级</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <Empty
          title="暂无任务数据"
          description="还没有符合条件的任务，点击派发新任务"
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              派发任务
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} hoverable>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={`${task.priority} 优先级`} />
                    </div>
                    
                    <p className="text-slate-600 mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>派单人: <strong className="text-slate-700">{task.assignerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>负责人: <strong className="text-slate-700">{task.assigneeName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>截止: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>创建于: {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="info">{task.allianceName}</Badge>
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, 'in_progress')}>
                            开始处理
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(task.id, 'cancelled')}>
                            取消
                          </Button>
                        </>
                      )}
                      {task.status === 'in_progress' && (
                        <Button variant="primary" size="sm" onClick={() => handleStatusChange(task.id, 'completed')}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          完成
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">派发新任务</h2>
                <p className="text-sm text-slate-500 mt-1">向联盟成员派发协作任务</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-5">
                <Input
                  label="任务标题 *"
                  placeholder="请输入任务标题，简明扼要描述任务内容"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                />

                <Textarea
                  label="任务描述 *"
                  placeholder="请详细描述任务要求、交付标准、时间节点等..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  error={errors.description}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="负责人 *"
                    options={[
                      { value: '', label: '请选择负责人' },
                      { value: '1', label: '张三 - 华东分盟盟主' },
                      { value: '2', label: '李四 - 华南分盟盟主' },
                      { value: '3', label: '王五 - 深圳回收站站长' },
                      { value: '4', label: '赵六 - 广州回收站站长' },
                    ]}
                    value={formData.assigneeId}
                    onChange={(e) => handleChange('assigneeId', e.target.value)}
                    error={errors.assigneeId}
                  />

                  <Select
                    label="优先级"
                    options={[
                      { value: 'low', label: '低优先级' },
                      { value: 'medium', label: '中优先级' },
                      { value: 'high', label: '高优先级' },
                    ]}
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                  />
                </div>

                <Input
                  label="截止时间 *"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  error={errors.deadline}
                />

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>任务派发后，负责人将收到短信和站内信双重通知，请确保任务描述清晰准确。</span>
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={loading}>
                  取消
                </Button>
                <Button type="submit" isLoading={loading}>
                  {loading ? '派发中...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      立即派发
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllianceTasks;
