import { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Check, X, Eye, FileText, ShieldCheck, AlertTriangle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Doctor } from '@/types';

const complianceMap = {
  compliant: { label: '合规', class: 'border-green-200 bg-green-50 text-green-700' },
  pending: { label: '待审核', class: 'border-amber-200 bg-amber-50 text-amber-700' },
  non_compliant: { label: '不合规', class: 'border-red-200 bg-red-50 text-red-700' },
};

interface ComplianceRecord {
  id: number;
  doctorId: number;
  doctorName: string;
  action: string;
  result: string;
  remark: string;
  operator: string;
  createdAt: string;
}

export default function Compliance() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([
    {
      id: 1,
      doctorId: 1,
      doctorName: '张医生',
      action: '资质审核',
      result: '通过',
      remark: '执业资质验证通过，证书有效期至2026年',
      operator: '系统管理员',
      createdAt: '2024-01-15 10:30:00',
    },
    {
      id: 2,
      doctorId: 2,
      doctorName: '李医生',
      action: '执业范围检查',
      result: '驳回',
      remark: '执业范围与申请科室不符',
      operator: '系统管理员',
      createdAt: '2024-01-14 14:20:00',
    },
    {
      id: 3,
      doctorId: 3,
      doctorName: '王医生',
      action: '资质审核',
      result: '通过',
      remark: '主任医师资质验证通过',
      operator: '系统管理员',
      createdAt: '2024-01-13 09:15:00',
    },
  ]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.doctors.list();
      setDoctors(data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.includes(searchTerm) ||
      doctor.licenseNo.includes(searchTerm) ||
      doctor.specialty.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || doctor.complianceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const total = doctors.length;
    const compliant = doctors.filter((d) => d.complianceStatus === 'compliant').length;
    const pending = doctors.filter((d) => d.complianceStatus === 'pending' || !d.complianceStatus).length;
    const nonCompliant = doctors.filter((d) => d.complianceStatus === 'non_compliant').length;
    return { total, compliant, pending, nonCompliant };
  }, [doctors]);

  function handleViewDetail(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  }

  function handleApprove(id: number) {
    if (confirm('确定要通过该医生的合规审核吗？')) {
      api.doctors.update(id, { complianceStatus: 'compliant' }).then(() => {
        loadData();
      });
    }
  }

  function handleReject(id: number) {
    const reason = prompt('请输入驳回原因：');
    if (reason) {
      api.doctors.update(id, { complianceStatus: 'non_compliant' }).then(() => {
        loadData();
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">合规审核管理</h1>
          <p className="mt-1 text-sm text-gray-500">医生资质审核与合规记录管理</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-gray-50 p-2 text-gray-700">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">医生总数</p>
              <strong className="text-2xl text-gray-900">{stats.total}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-green-50 p-2 text-green-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">已合规</p>
              <strong className="text-2xl text-green-600">{stats.compliant}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">待审核</p>
              <strong className="text-2xl text-amber-600">{stats.pending}</strong>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-red-50 p-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-gray-500">不合规</p>
              <strong className="text-2xl text-red-600">{stats.nonCompliant}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索医生姓名、执业证号、专业..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="compliant">已合规</option>
            <option value="non_compliant">不合规</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">医生资质审核列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">医生信息</th>
                <th className="px-4 py-3 font-medium text-gray-500">执业证号</th>
                <th className="px-4 py-3 font-medium text-gray-500">专业/职称</th>
                <th className="px-4 py-3 font-medium text-gray-500">执业范围</th>
                <th className="px-4 py-3 font-medium text-gray-500">资质有效期</th>
                <th className="px-4 py-3 font-medium text-gray-500">合规状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    加载中...
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    暂无医生数据
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {doctor.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          <div className="text-xs text-gray-500">ID: {doctor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">{doctor.licenseNo}</td>
                    <td className="px-4 py-4">
                      <div className="text-gray-900">{doctor.specialty}</div>
                      <div className="text-xs text-gray-500">{doctor.title}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{doctor.practiceScope}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {doctor.practiceCertExpiry || '未设置'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                        complianceMap[doctor.complianceStatus as keyof typeof complianceMap]?.class ||
                        complianceMap.pending.class
                      }`}>
                        {complianceMap[doctor.complianceStatus as keyof typeof complianceMap]?.label ||
                          '待审核'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetail(doctor)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {doctor.complianceStatus !== 'compliant' && (
                          <button
                            onClick={() => handleApprove(doctor.id)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                            title="审核通过"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {doctor.complianceStatus !== 'non_compliant' && (
                          <button
                            onClick={() => handleReject(doctor.id)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="审核驳回"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">合规审核记录</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {complianceRecords.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">暂无审核记录</div>
          ) : (
            complianceRecords.map((record) => (
              <div key={record.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-lg p-2 ${
                      record.result === '通过' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{record.doctorName}</span>
                        <span className={`rounded px-2 py-0.5 text-xs ${
                          record.result === '通过'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.result}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{record.action}</p>
                      <p className="mt-1 text-sm text-gray-500">{record.remark}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>{record.operator}</p>
                    <p>{record.createdAt}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">医生资质详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-medium text-blue-600">
                  {selectedDoctor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDoctor.name}</h3>
                  <p className="text-gray-500">
                    {selectedDoctor.title} · {selectedDoctor.specialty}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">执业证号</p>
                  <p className="font-mono text-gray-900">{selectedDoctor.licenseNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">出诊价格</p>
                  <p className="font-medium text-gray-900">¥{selectedDoctor.visitPrice}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">执业范围</p>
                  <p className="text-gray-900">{selectedDoctor.practiceScope}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">资质有效期</p>
                  <p className="text-gray-900">{selectedDoctor.practiceCertExpiry || '未设置'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">合规状态</p>
                  <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                    complianceMap[selectedDoctor.complianceStatus as keyof typeof complianceMap]?.class ||
                    complianceMap.pending.class
                  }`}>
                    {complianceMap[selectedDoctor.complianceStatus as keyof typeof complianceMap]?.label ||
                      '待审核'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                关闭
              </button>
              {selectedDoctor.complianceStatus !== 'compliant' && (
                <button
                  onClick={() => {
                    handleApprove(selectedDoctor.id);
                    setShowDetailModal(false);
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  审核通过
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
