import { useState } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Sparkles,
  Baby,
  ChefHat,
  X,
  Save,
  Filter,
  Search,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useAdminStore } from '@/store/useAdminStore';
import type { SopDocument, ServiceType } from '@/types';
import { cn } from '@/lib/utils';

const serviceTypeFilters: { value: ServiceType | 'all'; label: string; icon: typeof Sparkles }[] = [
  { value: 'all', label: '全部', icon: Filter },
  { value: 'cleaning', label: '日常保洁', icon: Sparkles },
  { value: 'babysitting', label: '育儿陪护', icon: Baby },
  { value: 'cooking', label: '上门烹饪', icon: ChefHat },
];

interface SopFormData {
  service_type: ServiceType;
  service_type_label: string;
  title: string;
  content: string;
  version: string;
  steps: { title: string; description: string; tips?: string }[];
}

const emptyForm: SopFormData = {
  service_type: 'cleaning',
  service_type_label: '日常保洁',
  title: '',
  content: '',
  version: 'v1.0',
  steps: [{ title: '', description: '', tips: '' }],
};

export default function AdminSop() {
  const sopDocuments = useAdminStore((state) => state.sopDocuments);
  const addSopDocument = useAdminStore((state) => state.addSopDocument);
  const updateSopDocument = useAdminStore((state) => state.updateSopDocument);
  const deleteSopDocument = useAdminStore((state) => state.deleteSopDocument);

  const [filter, setFilter] = useState<ServiceType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<SopDocument | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SopDocument | null>(null);
  const [formData, setFormData] = useState<SopFormData>(emptyForm);

  const filteredDocs = sopDocuments.filter((doc) => {
    const matchType = filter === 'all' || doc.service_type === filter;
    const matchSearch =
      !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.content.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCreate = () => {
    setEditingDoc(null);
    setFormData(emptyForm);
    setShowEditor(true);
  };

  const handleEdit = (doc: SopDocument) => {
    setEditingDoc(doc);
    setFormData({
      service_type: doc.service_type,
      service_type_label: doc.service_type_label,
      title: doc.title,
      content: doc.content,
      version: doc.version,
      steps: doc.steps.map((s) => ({ ...s })),
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    if (editingDoc) {
      updateSopDocument(editingDoc.id, formData);
    } else {
      addSopDocument(formData);
    }
    setShowEditor(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定删除该SOP文档吗？此操作不可恢复。')) {
      deleteSopDocument(id);
      if (selectedDoc?.id === id) setSelectedDoc(null);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', description: '', tips: '' }],
    });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) return;
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (
    index: number,
    field: 'title' | 'description' | 'tips',
    value: string
  ) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="SOP文档库" subtitle="标准化作业流程管理，统一服务质量标准" />
        <main className="flex-1 p-6 space-y-5 overflow-auto">
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary-50 rounded-xl p-1">
              {serviceTypeFilters.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter === f.value
                        ? 'bg-white text-secondary-700 shadow-sm'
                        : 'text-secondary-500 hover:text-secondary-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索文档标题或内容..."
                className="w-full pl-9 pr-4 py-2 bg-secondary-50 border border-transparent rounded-xl text-sm focus:outline-none focus:border-secondary-300 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleCreate}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建文档
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {filteredDocs.map((doc) => {
                const Icon =
                  serviceTypeFilters.find((f) => f.value === doc.service_type)?.icon || FileText;
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      'card p-5 cursor-pointer transition-all',
                      selectedDoc?.id === doc.id && 'ring-2 ring-secondary-500 ring-offset-2'
                    )}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary-600 flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-secondary-800 truncate">
                              {doc.title}
                            </h3>
                            <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full">
                              {doc.version}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                              {doc.service_type_label}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-500 mt-1.5 line-clamp-2">
                            {doc.content}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-secondary-400">
                            <span>{doc.steps.length} 个步骤</span>
                            <span>
                              更新于{' '}
                              {new Date(doc.updated_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                          className="p-2 rounded-lg hover:bg-secondary-50 text-secondary-500 transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(doc);
                          }}
                          className="p-2 rounded-lg hover:bg-secondary-50 text-secondary-500 transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredDocs.length === 0 && (
                <div className="card p-16 text-center">
                  <FileText className="w-14 h-14 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">暂无符合条件的SOP文档</p>
                </div>
              )}
            </div>

            <div className="card p-5 h-fit sticky top-20">
              {selectedDoc ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-secondary-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-secondary-600" />
                      文档预览
                    </h3>
                    <button
                      onClick={() => handleEdit(selectedDoc)}
                      className="flex items-center gap-1 text-sm text-secondary-600 hover:text-secondary-800 font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      编辑
                    </button>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-secondary-800">{selectedDoc.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full">
                        {selectedDoc.version}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                        {selectedDoc.service_type_label}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mt-3 leading-relaxed">
                      {selectedDoc.content}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {selectedDoc.steps.map((step, i) => (
                      <div key={i} className="relative pl-8">
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-secondary-500 text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </div>
                        {i < selectedDoc.steps.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-[-12px] w-px bg-secondary-200" />
                        )}
                        <h5 className="font-semibold text-secondary-800 text-sm">
                          {step.title}
                        </h5>
                        <p className="text-sm text-secondary-600 mt-1 leading-relaxed">
                          {step.description}
                        </p>
                        {step.tips && (
                          <div className="mt-2 flex items-start gap-1.5 p-2.5 bg-amber-50 rounded-lg">
                            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">{step.tips}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-secondary-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">点击左侧文档查看预览</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-800">
                {editingDoc ? '编辑SOP文档' : '新建SOP文档'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    服务类型
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => {
                      const label =
                        serviceTypeFilters.find(
                          (f) => f.value === e.target.value
                        )?.label || '';
                      setFormData({
                        ...formData,
                        service_type: e.target.value as ServiceType,
                        service_type_label: label,
                      });
                    }}
                    className="input-field py-2 text-sm"
                  >
                    <option value="cleaning">日常保洁</option>
                    <option value="babysitting">育儿陪护</option>
                    <option value="cooking">上门烹饪</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    版本号
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="input-field py-2 text-sm"
                    placeholder="v1.0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  文档标题
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field py-2 text-sm"
                  placeholder="请输入文档标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  文档概述
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={3}
                  className="input-field py-2 text-sm resize-none"
                  placeholder="简要描述文档内容和适用范围"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    作业步骤
                  </label>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-800 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加步骤
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-3 border border-gray-100 rounded-xl bg-gray-50/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-4 h-4 text-secondary-500" />
                        <span className="text-sm font-medium text-secondary-700">
                          步骤 {index + 1}
                        </span>
                        {formData.steps.length > 1 && (
                          <button
                            onClick={() => removeStep(index)}
                            className="ml-auto text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        className="input-field py-2 text-sm mb-2"
                        placeholder="步骤标题"
                      />
                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        rows={2}
                        className="input-field py-2 text-sm resize-none mb-2"
                        placeholder="步骤详细描述"
                      />
                      <input
                        type="text"
                        value={step.tips || ''}
                        onChange={(e) => updateStep(index, 'tips', e.target.value)}
                        className="input-field py-2 text-sm"
                        placeholder="操作提示（可选）"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="flex-1 py-2.5 bg-white text-secondary-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                className="flex-1 py-2.5 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存文档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
