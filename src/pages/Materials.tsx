import { useState, useEffect } from 'react';
import { FolderOpen, Search, Filter, Plus, ArrowRight, Eye, Download, FileText, Tag, Clock, CheckCircle2, Upload } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';

interface Material {
  id: string;
  name: string;
  category: string;
  format: string;
  size: string;
  uploader: string;
  uploadDate: string;
  usageCount: number;
  status: 'active' | 'expired' | 'pending';
  departments: string[];
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: '',
    description: '',
    departments: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/materials');
        const data = await res.json().catch(() => [
          { id: '1', name: '企业营业执照模板', category: '企业资质', format: 'PDF', size: '2.3MB', uploader: '市场监管局', uploadDate: '2024-01-15', usageCount: 1256, status: 'active' as const, departments: ['市场监管局', '税务局', '科技厅'] },
          { id: '2', name: '公司章程范本', category: '企业注册', format: 'DOCX', size: '156KB', uploader: '市场监管局', uploadDate: '2024-01-14', usageCount: 892, status: 'active' as const, departments: ['市场监管局', '工信厅'] },
          { id: '3', name: '高新技术企业认定申请书', category: '资质认定', format: 'DOCX', size: '4.2MB', uploader: '科技厅', uploadDate: '2024-01-13', usageCount: 567, status: 'active' as const, departments: ['科技厅', '财政厅', '税务局'] },
          { id: '4', name: '项目可行性研究报告模板', category: '项目申报', format: 'DOCX', size: '3.8MB', uploader: '发改局', uploadDate: '2024-01-12', usageCount: 423, status: 'active' as const, departments: ['发改局', '工信厅', '科技厅'] },
          { id: '5', name: '财务审计报告模板', category: '财务报表', format: 'XLSX', size: '890KB', uploader: '财政厅', uploadDate: '2024-01-11', usageCount: 1102, status: 'active' as const, departments: ['财政厅', '税务局', '审计厅'] },
          { id: '6', name: '企业信用报告模板', category: '信用档案', format: 'PDF', size: '1.2MB', uploader: '发改委', uploadDate: '2024-01-10', usageCount: 234, status: 'pending' as const, departments: ['发改委', '市场监管局'] },
          { id: '7', name: '专利申请说明书模板', category: '知识产权', format: 'DOCX', size: '560KB', uploader: '知识产权局', uploadDate: '2023-12-15', usageCount: 189, status: 'expired' as const, departments: ['知识产权局'] },
        ]);
        setMaterials(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = materials.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.uploader.includes(searchTerm);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesFormat = !formatFilter || item.format === formatFilter;
    return matchesSearch && matchesCategory && matchesFormat;
  });

  const totalUsage = materials.reduce((sum, m) => sum + m.usageCount, 0);
  const activeCount = materials.filter(m => m.status === 'active').length;

  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material);
    setIsDetailModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!uploadForm.name.trim()) errors.name = '请输入材料名称';
    if (!uploadForm.category) errors.category = '请选择材料类别';
    if (!uploadForm.description.trim()) errors.description = '请输入材料描述';
    if (uploadForm.departments.length === 0) errors.departments = '请至少选择一个适用部门';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpload = () => {
    if (!validateForm()) return;
    const newMaterial: Material = {
      id: String(Date.now()),
      name: uploadForm.name,
      category: uploadForm.category,
      format: 'DOCX',
      size: '0KB',
      uploader: '政务服务中心',
      uploadDate: new Date().toISOString().split('T')[0],
      usageCount: 0,
      status: 'pending',
      departments: uploadForm.departments,
    };
    setMaterials([newMaterial, ...materials]);
    setIsUploadModalOpen(false);
    setUploadForm({ name: '', category: '', description: '', departments: [] });
    setFormErrors({});
  };

  const toggleDepartment = (dept: string) => {
    setUploadForm(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const columns = [
    { key: 'name', label: '材料名称', className: 'min-w-[250px]' },
    { key: 'category', label: '材料类别' },
    { key: 'format', label: '文件格式' },
    { key: 'size', label: '文件大小' },
    { key: 'uploader', label: '上传部门' },
    { key: 'uploadDate', label: '上传日期' },
    {
      key: 'usageCount',
      label: '复用次数',
      render: (row: Material) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
          {row.usageCount} 次
        </span>
      ),
    },
    {
      key: 'departments',
      label: '适用部门',
      render: (row: Material) => (
        <div className="flex flex-wrap gap-1">
          {row.departments.slice(0, 2).map((dept, index) => (
            <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {dept.replace('厅', '').replace('局', '')}
            </span>
          ))}
          {row.departments.length > 2 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              +{row.departments.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: Material) => (
        <StatusBadge status={row.status === 'active' ? 'active' : row.status === 'pending' ? 'pending' : 'expired'}>
          {row.status === 'active' && '有效'}
          {row.status === 'pending' && '待审核'}
          {row.status === 'expired' && '已失效'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: Material) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            复用 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const departments = ['市场监管局', '税务局', '科技厅', '工信厅', '财政厅', '发改局', '商务厅', '知识产权局', '审计厅', '自然资源厅'];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">材料复用</h1>
        <p className="page-description">跨部门材料共享复用库，减少重复提交</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="材料总数" value={materials.length} icon={FolderOpen} iconColor="text-blue-600" />
        <StatsCard title="有效材料" value={activeCount} icon={CheckCircle2} iconColor="text-green-600" />
        <StatsCard title="累计复用次数" value={totalUsage.toLocaleString()} icon={Tag} iconColor="text-purple-600" />
        <StatsCard title="覆盖部门数" value="12" icon={FileText} iconColor="text-orange-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索材料名称或上传部门..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部类别</option>
              <option value="企业资质">企业资质</option>
              <option value="企业注册">企业注册</option>
              <option value="资质认定">资质认定</option>
              <option value="项目申报">项目申报</option>
              <option value="财务报表">财务报表</option>
              <option value="信用档案">信用档案</option>
              <option value="知识产权">知识产权</option>
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部格式</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="XLSX">XLSX</option>
              <option value="JPG">JPG</option>
            </select>
          </div>
          <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Upload className="w-5 h-5" />
            上传材料
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={loading} />

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => { setIsUploadModalOpen(false); setFormErrors({}); }}
        title="上传共享材料"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setIsUploadModalOpen(false); setFormErrors({}); }} className="btn-secondary">取消</button>
            <button onClick={handleUpload} className="btn-primary flex items-center gap-2">
              <Upload className="w-5 h-5" />
              确认上传
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">材料名称</label>
            <input
              type="text"
              value={uploadForm.name}
              onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              placeholder="请输入材料名称"
              className={`input-field ${formErrors.name ? 'border-red-300' : ''}`}
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">材料类别</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                className={`input-field ${formErrors.category ? 'border-red-300' : ''}`}
              >
                <option value="">请选择类别</option>
                <option value="企业资质">企业资质</option>
                <option value="企业注册">企业注册</option>
                <option value="资质认定">资质认定</option>
                <option value="项目申报">项目申报</option>
                <option value="财务报表">财务报表</option>
                <option value="信用档案">信用档案</option>
                <option value="知识产权">知识产权</option>
              </select>
              {formErrors.category && <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>}
            </div>
            <div>
              <label className="form-label">上传文件</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#1a56db] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF、DOCX、XLSX 格式</p>
              </div>
            </div>
          </div>
          <div>
            <label className="form-label">材料描述</label>
            <textarea
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="请简要描述材料用途和适用场景..."
              className={`input-field ${formErrors.description ? 'border-red-300' : ''}`}
            />
            {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
          </div>
          <div>
            <label className="form-label">适用部门（多选）</label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleDepartment(dept)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    uploadForm.departments.includes(dept)
                      ? 'bg-[#1a56db] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            {formErrors.departments && <p className="mt-1 text-sm text-red-600">{formErrors.departments}</p>}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="材料详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">关闭</button>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-5 h-5" />
              下载材料
            </button>
          </div>
        }
      >
        {selectedMaterial && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedMaterial.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>上传部门: {selectedMaterial.uploader}</span>
                <span>上传日期: {selectedMaterial.uploadDate}</span>
                <StatusBadge status={selectedMaterial.status === 'active' ? 'active' : selectedMaterial.status === 'pending' ? 'pending' : 'expired'}>
                  {selectedMaterial.status === 'active' && '有效'}
                  {selectedMaterial.status === 'pending' && '待审核'}
                  {selectedMaterial.status === 'expired' && '已失效'}
                </StatusBadge>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1a56db]">{selectedMaterial.format}</p>
                <p className="text-xs text-gray-500 mt-1">文件格式</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedMaterial.size}</p>
                <p className="text-xs text-gray-500 mt-1">文件大小</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{selectedMaterial.usageCount}</p>
                <p className="text-xs text-gray-500 mt-1">复用次数</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{selectedMaterial.departments.length}</p>
                <p className="text-xs text-gray-500 mt-1">适用部门</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">适用部门</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMaterial.departments.map((dept, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">材料预览</p>
                <button className="btn-secondary flex items-center gap-2 mx-auto">
                  <Download className="w-5 h-5" />
                  下载查看完整内容
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
