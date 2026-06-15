import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Send, Eye, EyeOff, Trash2, Star, Users } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'reviewing', label: '审核中' },
  { key: 'published', label: '已发布' },
  { key: 'rejected', label: '已驳回' },
];

export default function CourseList() {
  const navigate = useNavigate();
  const { courses, coursesLoading, courseTotal, activeTab, setActiveTab, fetchCourses, submitCourseForReview, updateCourse } = useWorkspaceStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses({ status: activeTab === 'all' ? undefined : activeTab });
  }, [activeTab, fetchCourses]);

  const handleCreateCourse = () => {
    navigate('/workspace/courses/new');
  };

  const handleEdit = (id: string) => {
    navigate(`/workspace/courses/${id}/edit`);
  };

  const handleSubmitReview = async (id: string) => {
    try {
      await submitCourseForReview(id);
    } catch (error) {
      console.error('Failed to submit course for review:', error);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await updateCourse(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const filteredCourses = activeTab === 'all' 
    ? courses 
    : courses.filter(c => c.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">
                ({tab.key === 'all' ? courseTotal : courses.filter(c => c.status === tab.key).length})
              </span>
            </button>
          ))}
        </div>
        <button onClick={handleCreateCourse} className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          新建课程
        </button>
      </div>

      {coursesLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card p-12">
          <Empty />
          <p className="mt-4 text-center text-zinc-500">暂无课程，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-500">课程信息</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500">学生数</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500">评分</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500">定价</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-500">状态</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-20 overflow-hidden rounded-lg bg-gradient-to-r from-primary-100 to-accent-100">
                          {course.coverImage && (
                            <img
                              src={course.coverImage}
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{course.title}</p>
                          <p className="text-xs text-zinc-500">{course.category || '未分类'}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            更新于 {new Date(course.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-zinc-600">
                        <Users className="h-4 w-4" />
                        {course.studentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        {course.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-primary-600">¥{course.price}</span>
                      {course.isSubscription && (
                        <span className="ml-1 text-xs text-zinc-400">/月</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(course.id)}
                          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {course.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitReview(course.id)}
                            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-green-50 hover:text-green-600"
                            title="提交审核"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        {(course.status === 'published' || course.status === 'draft') && (
                          <button
                            onClick={() => handleTogglePublish(course.id, course.status)}
                            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title={course.status === 'published' ? '下架' : '上架'}
                          >
                            {course.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-500">删除后无法恢复，确定要删除这个课程吗？</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                }}
                className="btn-primary px-4 py-2 text-sm bg-red-500 hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
