import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  AlertTriangle,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Plus,
  Trash2,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';
import { useApplicationStore, useUnderwritingStore, useUserStore } from '@/store';
import { statusLabels, statusColors } from '@/components/Layout';

type TabType = 'basic' | 'health' | 'rules' | 'documents' | 'decision' | 'logs';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentApplication, fetchApplicationDetail, loading } = useApplicationStore();
  const { runRules, makeDecision } = useUnderwritingStore();
  const { currentUser, users, fetchUsers } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    decision_type: 'approve',
    decision_notes: '',
    rated_amount: 0,
    rate_percentage: 0,
    excluded_conditions: '',
    postponed_months: 0
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({ type: 'physical_exam', name: '', file: null as File | null });

  useEffect(() => {
    if (id) {
      fetchApplicationDetail(parseInt(id));
      fetchUsers();
    }
  }, [id]);

  const handleRunRules = async () => {
    if (!currentApplication) return;
    try {
      await runRules(currentApplication.id, currentUser?.id);
      alert('规则运行成功！');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleMakeDecision = async () => {
    if (!currentApplication) return;
    if (!decisionForm.decision_notes.trim()) {
      alert('请填写核保意见');
      return;
    }
    try {
      await makeDecision({
        ...decisionForm,
        application_id: currentApplication.id,
        user_id: currentUser?.id
      });
      setShowDecisionModal(false);
      alert('核保结论已提交并锁定！');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleFileUpload = async () => {
    if (!newDoc.name || !newDoc.file || !currentApplication) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', newDoc.file);
      formData.append('application_id', currentApplication.id.toString());
      formData.append('doc_type', newDoc.type);
      formData.append('doc_name', newDoc.name);
      formData.append('uploaded_by', currentUser?.id.toString() || '1');

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewDoc({ type: 'physical_exam', name: '', file: null });
        await fetchApplicationDetail(currentApplication.id);
        alert('文件上传成功！');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRequestSupplement = async () => {
    if (!currentApplication) return;
    const notes = prompt('请输入补充资料要求：');
    if (!notes) return;
    try {
      await fetch('/api/documents/supplement-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: currentApplication.id,
          requested_by: currentUser?.id || 1,
          request_notes: notes,
          required_docs: ['体检报告', '病历资料']
        })
      });
      await fetchApplicationDetail(currentApplication.id);
      alert('补件要求已发送！');
    } catch (error) {
      alert('发送失败');
    }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'basic', label: '基本信息', icon: User },
    { key: 'health', label: '健康告知', icon: FileText },
    { key: 'rules', label: '规则命中', icon: AlertTriangle },
    { key: 'documents', label: '补充资料', icon: Upload },
    { key: 'decision', label: '核保结论', icon: CheckCircle },
    { key: 'logs', label: '操作日志', icon: Clock }
  ];

  if (loading || !currentApplication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const app = currentApplication;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/applications')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{app.application_no}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[app.status]}`}>
                {statusLabels[app.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {app.customer_name} · {app.product_name} · {app.coverage_amount?.toLocaleString()} 元
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {(app.status === 'pending' || app.status === 'underwriting') && !app.decision && (
            <>
              <button
                onClick={handleRequestSupplement}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                发送补件
              </button>
              <button
                onClick={handleRunRules}
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Shield className="w-4 h-4 mr-2" />
                运行规则
              </button>
              <button
                onClick={() => setShowDecisionModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                核保结论
              </button>
            </>
          )}
        </div>
      </div>

      {app.missingFields && app.missingFields.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800">资料缺失提醒</h3>
              <p className="text-sm text-orange-700 mt-1">
                以下信息缺失，请补充：{app.missingFields.join('、')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">客户信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">姓名</span>
                    <span className="font-medium text-gray-900">{app.customer_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">证件号码</span>
                    <span className="font-medium text-gray-900">{app.customer_id_card}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">手机号</span>
                    <span className="font-medium text-gray-900">{app.customer_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">职业</span>
                    <span className="font-medium text-gray-900">{app.occupation || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">职业风险等级</span>
                    <span className="font-medium text-gray-900">{app.occupation_risk_level} 级</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">投保信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">产品名称</span>
                    <span className="font-medium text-gray-900">{app.product_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">保险金额</span>
                    <span className="font-medium text-gray-900">{app.coverage_amount?.toLocaleString()} 元</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">保费</span>
                    <span className="font-medium text-gray-900">{app.premium?.toLocaleString() || '-'} 元</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">提交时间</span>
                    <span className="font-medium text-gray-900">{new Date(app.submitted_at).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">分配核保员</span>
                    <span className="font-medium text-gray-900">{app.assigned_name || '未分配'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">健康告知明细</h3>
              {app.healthDeclarations && app.healthDeclarations.length > 0 ? (
                <div className="space-y-4">
                  {app.healthDeclarations.map((hd: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{hd.question_text}</p>
                          <p className="text-sm text-gray-600 mt-1">回答：{hd.answer || '-'}</p>
                          {hd.answer_details && (
                            <p className="text-sm text-gray-500 mt-1">说明：{hd.answer_details}</p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          hd.has_condition ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {hd.has_condition ? '有异常' : '无异常'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无健康告知数据</p>
                </div>
              )}

              {app.medicalHistories && app.medicalHistories.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mt-8">既往病史</h3>
                  <div className="space-y-4">
                    {app.medicalHistories.map((mh: any, idx: number) => (
                      <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900">{mh.condition_name}</p>
                            <p className="text-sm text-red-700 mt-1">
                              诊断日期：{mh.diagnosis_date || '-'} · 医院：{mh.hospital_name || '-'}
                            </p>
                            {mh.treatment_details && (
                              <p className="text-sm text-red-600 mt-1">诊疗详情：{mh.treatment_details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">规则命中记录</h3>
                <button
                  onClick={handleRunRules}
                  className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  重新运行规则
                </button>
              </div>
              {app.ruleHits && app.ruleHits.length > 0 ? (
                <div className="space-y-4">
                  {app.ruleHits.map((rh: any, idx: number) => (
                    <div key={idx} className={`border rounded-lg p-4 ${
                      rh.risk_level >= 4 ? 'border-red-200 bg-red-50' :
                      rh.risk_level >= 3 ? 'border-orange-200 bg-orange-50' :
                      'border-yellow-200 bg-yellow-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{rh.rule_name}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              rh.risk_level >= 4 ? 'bg-red-200 text-red-800' :
                              rh.risk_level >= 3 ? 'bg-orange-200 text-orange-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              风险等级 {rh.risk_level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">命中原因：{rh.hit_reason}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            命中时间：{new Date(rh.hit_at).toLocaleString('zh-CN')} · 规则版本：{rh.rule_version}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无规则命中记录，可点击右上角按钮运行规则</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">补充资料</h3>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">上传新资料</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="physical_exam">体检报告</option>
                    <option value="medical_record">病历资料</option>
                    <option value="questionnaire">调查问卷</option>
                    <option value="image">影像资料</option>
                    <option value="other">其他</option>
                  </select>
                  <input
                    type="text"
                    placeholder="资料名称"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <div className="flex items-center space-x-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                      />
                      <div className="flex items-center justify-center px-4 py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {newDoc.file ? newDoc.file.name : '选择文件'}
                        </span>
                      </div>
                    </label>
                    <button
                      onClick={handleFileUpload}
                      disabled={uploadingDoc || !newDoc.name || !newDoc.file}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingDoc ? '上传中...' : '上传'}
                    </button>
                  </div>
                </div>
              </div>

              {app.supplementRequests && app.supplementRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">补件要求</h4>
                  <div className="space-y-3">
                    {app.supplementRequests.map((sr: any, idx: number) => (
                      <div key={idx} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-orange-900">补件要求 #{idx + 1}</p>
                            <p className="text-sm text-orange-700 mt-1">{sr.request_notes}</p>
                            <p className="text-xs text-orange-500 mt-2">
                              要求人：{sr.requested_name} · {new Date(sr.created_at).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            sr.status === 'pending' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                          }`}>
                            {sr.status === 'pending' ? '待提交' : '已提交'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {app.supplementaryDocs && app.supplementaryDocs.length > 0 ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">已上传资料</h4>
                  <div className="space-y-3">
                    {app.supplementaryDocs.map((doc: any, idx: number) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{doc.doc_name}</p>
                              <p className="text-xs text-gray-500">
                                上传人：{doc.uploaded_name} · {new Date(doc.uploaded_at).toLocaleString('zh-CN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.status === 'approved' ? '已审核' : doc.status === 'rejected' ? '已拒绝' : '待审核'}
                            </span>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-gray-500" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !uploadingDoc && (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">暂无补充资料</p>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <div className="space-y-6">
              {app.decision ? (
                <div className={`border-2 rounded-xl p-6 ${
                  app.decision.is_locked ? 'border-gray-300 bg-gray-50' : 'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">核保结论</h3>
                        {app.decision.is_locked && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                            <LockIcon className="w-3 h-3 mr-1" />
                            已锁定
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        核保人：{app.decision.decision_maker_name} · {new Date(app.decision.decision_made_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      app.decision.decision_type === 'approve' ? 'bg-green-100 text-green-700' :
                      app.decision.decision_type === 'rate' ? 'bg-purple-100 text-purple-700' :
                      app.decision.decision_type === 'exclude' ? 'bg-orange-100 text-orange-700' :
                      app.decision.decision_type === 'postpone' ? 'bg-gray-100 text-gray-700' :
                      app.decision.decision_type === 'reject' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {app.decision.decision_type === 'approve' ? '标准承保' :
                       app.decision.decision_type === 'rate' ? '加费承保' :
                       app.decision.decision_type === 'exclude' ? '除外承保' :
                       app.decision.decision_type === 'postpone' ? '延期处理' :
                       app.decision.decision_type === 'reject' ? '拒保' :
                       '人工复核'}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">核保意见</h4>
                    <p className="text-gray-700">{app.decision.decision_notes}</p>
                  </div>

                  {app.decision.decision_type === 'rate' && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">加费金额</p>
                        <p className="text-xl font-bold text-purple-600">{app.decision.rated_amount?.toLocaleString()} 元</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">加费比例</p>
                        <p className="text-xl font-bold text-purple-600">{app.decision.rate_percentage}%</p>
                      </div>
                    </div>
                  )}

                  {app.decision.decision_type === 'exclude' && app.decision.excluded_conditions && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500">除外责任</p>
                      <p className="text-orange-600 font-medium mt-1">{app.decision.excluded_conditions}</p>
                    </div>
                  )}

                  {app.decision.decision_type === 'postpone' && (
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-500">延期时长</p>
                      <p className="text-xl font-bold text-gray-600">{app.decision.postponed_months} 个月</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">暂无核保结论</p>
                  {(app.status === 'pending' || app.status === 'underwriting') && (
                    <button
                      onClick={() => setShowDecisionModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      出具核保结论
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">操作日志</h3>
              {app.auditLogs && app.auditLogs.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {app.auditLogs.map((log: any, idx: number) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-2.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{log.action}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">操作人：{log.user_name || '系统'}</p>
                          {log.action_details && (
                            <p className="text-sm text-gray-600 mt-2">{JSON.stringify(log.action_details)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无操作日志</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">出具核保结论</h3>
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">核保结论类型</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'approve', label: '标准承保', color: 'green' },
                    { value: 'rate', label: '加费承保', color: 'purple' },
                    { value: 'exclude', label: '除外承保', color: 'orange' },
                    { value: 'postpone', label: '延期处理', color: 'gray' },
                    { value: 'reject', label: '拒保', color: 'red' },
                    { value: 'manual_review', label: '人工复核', color: 'blue' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDecisionForm({ ...decisionForm, decision_type: option.value })}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        decisionForm.decision_type === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {decisionForm.decision_type === 'rate' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">加费金额（元）</label>
                    <input
                      type="number"
                      value={decisionForm.rated_amount}
                      onChange={(e) => setDecisionForm({ ...decisionForm, rated_amount: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">加费比例（%）</label>
                    <input
                      type="number"
                      value={decisionForm.rate_percentage}
                      onChange={(e) => setDecisionForm({ ...decisionForm, rate_percentage: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {decisionForm.decision_type === 'exclude' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">除外责任说明</label>
                  <textarea
                    value={decisionForm.excluded_conditions}
                    onChange={(e) => setDecisionForm({ ...decisionForm, excluded_conditions: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请详细说明除外责任范围..."
                  />
                </div>
              )}

              {decisionForm.decision_type === 'postpone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">延期时长（月）</label>
                  <input
                    type="number"
                    value={decisionForm.postponed_months}
                    onChange={(e) => setDecisionForm({ ...decisionForm, postponed_months: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">核保意见 *</label>
                <textarea
                  value={decisionForm.decision_notes}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decision_notes: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请详细说明核保结论的依据和理由..."
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">重要提示</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      核保结论提交后将被锁定，无法修改。请确认所有信息无误后再提交。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMakeDecision}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                提交核保结论
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
