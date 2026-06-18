import { useState } from 'react';
import { Plus, X, Settings as SettingsIcon, BookOpen, Tag, Users } from 'lucide-react';
import { mockUsers } from '@/mock/users';
import { SUBJECT_TAGS } from '@/constants/config';
import { CREDIT_STANDARDS } from '@/constants/config';
import { UserRole } from '@/constants/enums';

export default function Settings() {
  const [tags, setTags] = useState<string[]>([...SUBJECT_TAGS]);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const creditEntries = Object.entries(CREDIT_STANDARDS);
  const typeLabels: Record<string, string> = {
    sanxiaxiang: '三下乡',
    activity: '活动',
    volunteer: '志愿者',
    other: '其他',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-surface-700" />
        <h1 className="text-2xl font-bold text-surface-900">系统设置</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">学分标准配置</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学分类型</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">标准学时</th>
              </tr>
            </thead>
            <tbody>
              {creditEntries.map(([key, hours]) => (
                <tr key={key} className="border-b border-surface-100">
                  <td className="py-3 px-4 text-surface-700 font-medium">{typeLabels[key] || key}</td>
                  <td className="py-3 px-4 text-surface-700 font-mono">{hours} 学时</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">主题标签管理</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="status-badge bg-primary-100 text-primary-700 flex items-center gap-1.5 py-1 px-3">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-danger-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 max-w-xs">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="添加新标签"
            className="flex-1 px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button onClick={addTag} className="btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-surface-900">用户管理</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left py-3 px-4 text-surface-500 font-medium">姓名</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">用户名</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">院系</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">角色</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr key={user.id} className="border-b border-surface-100 hover:bg-surface-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-xs text-surface-600">
                          {user.name[0]}
                        </div>
                      )}
                      <span className="text-surface-700 font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-surface-600 font-mono text-xs">{user.username}</td>
                  <td className="py-3 px-4 text-surface-600">{user.department || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${UserRole[user.role as keyof typeof UserRole]?.color}`}>
                      {UserRole[user.role as keyof typeof UserRole]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
