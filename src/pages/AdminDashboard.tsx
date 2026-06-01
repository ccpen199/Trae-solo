import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Home, FileCheck, AlertTriangle, UserCheck, Eye,
  CheckCircle, XCircle, Search, ShieldAlert, Flame, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [riskControls, setRiskControls] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectionModal, setInspectionModal] = useState<any>(null);
  const [riskModal, setRiskModal] = useState<any>(null);
  const [handlingInspection, setHandlingInspection] = useState(false);
  const [handlingRisk, setHandlingRisk] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [inspectionForm, setInspectionForm] = useState({ status: 'completed', quality_score: '', issues: '', suggestions: '' });
  const [riskForm, setRiskForm] = useState({ status: 'confirmed', description: '' });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'overview') {
      const response = await api.admin.dashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } else if (activeTab === 'properties') {
      const response = await api.admin.properties({ verifyStatus: 'pending' });
      if (response.success && response.data) {
        setProperties((response.data as any).list || []);
      }
    } else if (activeTab === 'appeals') {
      const response = await api.admin.appeals({ status: 'pending' });
      if (response.success && response.data) {
        setAppeals((response.data as any).list || []);
      }
    } else if (activeTab === 'agents') {
      const response = await api.admin.agents({ status: 'pending' });
      if (response.success && response.data) {
        setAgents((response.data as any).list || []);
      }
    } else if (activeTab === 'inspections') {
      const response = await api.admin.inspections();
      if (response.success && response.data) {
        setInspections(response.data as any);
      }
    } else if (activeTab === 'riskControls') {
      const response = await api.admin.riskControls();
      if (response.success && response.data) {
        setRiskControls(response.data as any);
      }
    } else if (activeTab === 'heatmap') {
      const response = await api.tools.getHeatmap({});
      if (response.success && response.data) {
        setHeatmapData(response.data as any);
      }
    }
    setLoading(false);
  };

  const handleVerifyProperty = async (id: string, status: string) => {
    const reason = status === 'rejected' ? prompt('请输入拒绝原因：') : '';
    if (status === 'rejected' && !reason) return;
    const response = await api.admin.verifyProperty(id, { status, reason });
    if (response.success) loadData();
  };

  const handleAppeal = async (id: string, status: string) => {
    const comment = prompt('请输入处理意见：');
    if (!comment) return;
    const response = await api.admin.handleAppeal(id, { status, comment });
    if (response.success) loadData();
  };

  const handleApproveAgent = async (id: string) => {
    const response = await api.admin.approveAgent(id);
    if (response.success) loadData();
  };

  const handleInspection = async () => {
    if (!inspectionModal) return;
    setHandlingInspection(true);
    const response = await api.admin.handleInspection(inspectionModal.id, {
      status: inspectionForm.status,
      quality_score: inspectionForm.quality_score ? parseInt(inspectionForm.quality_score) : undefined,
      issues: inspectionForm.issues,
      suggestions: inspectionForm.suggestions,
    });
    setHandlingInspection(false);
    if (response.success) {
      setInspectionModal(null);
      setInspectionForm({ status: 'completed', quality_score: '', issues: '', suggestions: '' });
      loadData();
    }
  };

  const handleRiskControl = async () => {
    if (!riskModal) return;
    setHandlingRisk(true);
    const response = await api.admin.handleRiskControl(riskModal.id, {
      status: riskForm.status,
      description: riskForm.description,
    });
    setHandlingRisk(false);
    if (response.success) {
      setRiskModal(null);
      setRiskForm({ status: 'confirmed', description: '' });
      loadData();
    }
  };

  const handleGenerateHeatmap = async () => {
    setLoading(true);
    const response = await api.admin.generateHeatmap();
    if (response.success && response.data) {
      setHeatmapData(response.data as any);
    }
    setLoading(false);
  };

  const openInspectionModal = (inspection: any) => {
    setInspectionModal(inspection);
    setInspectionForm({ status: 'completed', quality_score: '', issues: '', suggestions: '' });
  };

  const openRiskModal = (risk: any) => {
    setRiskModal(risk);
    setRiskForm({ status: 'confirmed', description: '' });
  };

  const tabs = [
    { id: 'overview', label: '数据概览', icon: Eye },
    { id: 'properties', label: '房源审核', icon: FileCheck },
    { id: 'appeals', label: '申诉处理', icon: AlertTriangle },
    { id: 'agents', label: '经纪人审核', icon: UserCheck },
    { id: 'inspections', label: '房源质量巡检', icon: Search },
    { id: 'riskControls', label: '经纪人行为风控', icon: ShieldAlert },
    { id: 'heatmap', label: '区域热度热力图', icon: Flame },
  ];

  const maxHeatScore = Math.max(...heatmapData.map((d: any) => d.heat_score || 0), 1);
  const maxViewCount = Math.max(...heatmapData.map((d: any) => d.view_count || 0), 1);

  const getRiskLevelStyle = (level: string) => {
    if (level === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (level === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getRiskLevelText = (level: string) => {
    if (level === 'high') return '高风险';
    if (level === 'medium') return '中风险';
    return '低风险';
  };

  const getInspectionStatusStyle = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getInspectionStatusText = (status: string) => {
    if (status === 'completed') return '已完成';
    if (status === 'pending') return '待处理';
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Shield className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-500">房源质量巡检、经纪人行为风控、区域热度管理</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : activeTab === 'overview' && dashboardData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center text-blue-600 mb-2">
                    <Users size={20} className="mr-2" />
                    <span className="text-sm font-medium">总用户数</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.totalUsers}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center text-green-600 mb-2">
                    <Home size={20} className="mr-2" />
                    <span className="text-sm font-medium">有效房源</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{dashboardData.stats.totalProperties}</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center text-purple-600 mb-2">
                    <UserCheck size={20} className="mr-2" />
                    <span className="text-sm font-medium">认证经纪人</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.stats.totalAgents}</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center text-orange-600 mb-2">
                    <FileCheck size={20} className="mr-2" />
                    <span className="text-sm font-medium">待审核房源</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{dashboardData.stats.pendingVerifications}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center text-red-600 mb-2">
                    <AlertTriangle size={20} className="mr-2" />
                    <span className="text-sm font-medium">待处理申诉</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{dashboardData.stats.pendingAppeals}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-cyan-50 rounded-xl p-4">
                  <div className="flex items-center text-cyan-600 mb-2">
                    <Search size={20} className="mr-2" />
                    <span className="text-sm font-medium">巡检统计</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xl font-bold text-cyan-600">{dashboardData.inspectionStats?.pending ?? 0}</div>
                      <div className="text-xs text-gray-500">待处理</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-cyan-600">{(dashboardData.inspectionStats?.total ?? 0) - (dashboardData.inspectionStats?.pending ?? 0)}</div>
                      <div className="text-xs text-gray-500">已完成</div>
                    </div>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <div className="flex items-center text-rose-600 mb-2">
                    <ShieldAlert size={20} className="mr-2" />
                    <span className="text-sm font-medium">风控统计</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xl font-bold text-rose-600">{dashboardData.riskControlStats?.pending ?? 0}</div>
                      <div className="text-xs text-gray-500">待处理</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-rose-600">{(dashboardData.riskControlStats?.total ?? 0) - (dashboardData.riskControlStats?.pending ?? 0)}</div>
                      <div className="text-xs text-gray-500">已处理</div>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center text-amber-600 mb-2">
                    <AlertTriangle size={20} className="mr-2" />
                    <span className="text-sm font-medium">虚假房源检测</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xl font-bold text-amber-600">{dashboardData.stats?.fakePropertyCount ?? 0}</div>
                      <div className="text-xs text-gray-500">已标记虚假</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600">{dashboardData.stats?.pendingVerifications ?? 0}</div>
                      <div className="text-xs text-gray-500">待检测</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">最新房源</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">房源标题</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">价格</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">发布者</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">审核状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentProperties.map((p: any) => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{p.title}</td>
                          <td className="py-3 px-4">¥{p.price}万</td>
                          <td className="py-3 px-4">{p.real_name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              p.verify_status === 'approved' ? 'bg-green-100 text-green-700' :
                              p.verify_status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {p.verify_status === 'approved' ? '已通过' :
                               p.verify_status === 'rejected' ? '已拒绝' : '待审核'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'properties' ? (
            <div>
              {properties.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无待审核房源</div>
              ) : (
                <div className="space-y-4">
                  {properties.map((p) => (
                    <div key={p.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{p.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{p.address}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>价格：¥{p.price}万</span>
                            <span>面积：{p.area}㎡</span>
                            <span>发布者：{p.owner_name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleVerifyProperty(p.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
                            <CheckCircle size={16} className="mr-1" />通过
                          </button>
                          <button onClick={() => handleVerifyProperty(p.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm">
                            <XCircle size={16} className="mr-1" />拒绝
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'appeals' ? (
            <div>
              {appeals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无待处理申诉</div>
              ) : (
                <div className="space-y-4">
                  {appeals.map((a) => (
                    <div key={a.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{a.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">申诉人：{a.user_name}</p>
                          <p className="text-sm text-gray-600 mt-2">申诉原因：{a.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAppeal(a.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">同意申诉</button>
                          <button onClick={() => handleAppeal(a.id, 'rejected')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">驳回申诉</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'agents' ? (
            <div>
              {agents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无待审核经纪人</div>
              ) : (
                <div className="space-y-4">
                  {agents.map((a) => (
                    <div key={a.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{a.real_name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{a.agency_name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>邮箱：{a.email}</span>
                            <span>电话：{a.phone}</span>
                          </div>
                        </div>
                        <button onClick={() => handleApproveAgent(a.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm">
                          <UserCheck size={16} className="mr-1" />批准认证
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'inspections' ? (
            <div>
              {inspections.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无巡检记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">房源标题</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">质量评分</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">问题</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">建议</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">巡检时间</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections.map((ins) => (
                        <tr key={ins.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{ins.title || '-'}</div>
                            <div className="text-xs text-gray-400">{ins.address || ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            {ins.quality_score ? (
                              <span className={`font-bold ${ins.quality_score >= 80 ? 'text-green-600' : ins.quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {ins.quality_score}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">{ins.issues || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">{ins.suggestions || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getInspectionStatusStyle(ins.status)}`}>
                              {getInspectionStatusText(ins.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{ins.inspected_at || '-'}</td>
                          <td className="py-3 px-4">
                            {ins.status === 'pending' && (
                              <button onClick={() => openInspectionModal(ins)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                处理
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'riskControls' ? (
            <div>
              {riskControls.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无风控记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">经纪人</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">风险类型</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">风险等级</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskControls.map((rc) => (
                        <tr key={rc.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{rc.agent_name || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{rc.risk_type}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskLevelStyle(rc.risk_level)}`}>
                              {getRiskLevelText(rc.risk_level)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-[300px] line-clamp-2">{rc.description || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              rc.status === 'confirmed' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {rc.status === 'pending' ? '待处理' : rc.status === 'confirmed' ? '已确认' : '已处理'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {rc.status === 'pending' && (
                              <button onClick={() => openRiskModal(rc)} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                                处理
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'heatmap' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Flame size={20} className="text-orange-500" />区域热度分析
                </h3>
                <button onClick={handleGenerateHeatmap} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center text-sm">
                  <Flame size={16} className="mr-2" />生成热力图
                </button>
              </div>

              {heatmapData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无热力图数据，请点击"生成热力图"</div>
              ) : (
                <>
                  <div className="mb-8">
                    <svg viewBox="0 0 800 300" className="w-full h-auto">
                      {heatmapData.map((item: any, index: number) => {
                        const barWidth = Math.max(30, (700 / heatmapData.length) - 10);
                        const barX = 50 + index * (700 / heatmapData.length);
                        const barMaxHeight = 200;
                        const barHeight = (item.heat_score / maxHeatScore) * barMaxHeight;
                        const barY = 230 - barHeight;

                        return (
                          <g key={index}>
                            <rect x={barX} y={barY} width={barWidth} height={barHeight}
                              rx="4" fill={`hsl(${item.heat_score * 1.2}, 70%, 50%)`}
                              className="transition-all hover:opacity-80" />
                            <text x={barX + barWidth / 2} y={barY - 8} textAnchor="middle"
                              className="text-xs fill-gray-600" fontSize="11">
                              {item.heat_score}
                            </text>
                            <text x={barX + barWidth / 2} y={250} textAnchor="middle"
                              className="fill-gray-500" fontSize="10"
                              transform={`rotate(-30, ${barX + barWidth / 2}, 250)`}>
                              {item.region_name || item.district}
                            </text>
                          </g>
                        );
                      })}
                      <line x1="45" y1="230" x2="790" y2="230" stroke="#e5e7eb" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">区域</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">热度评分</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">浏览量</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">咨询量</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">成交量</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">均价（元/㎡）</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">同比均价</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">环比均价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{item.region_name || item.district}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{
                                    width: `${(item.heat_score / 100) * 100}%`,
                                    backgroundColor: `hsl(${item.heat_score * 1.2}, 70%, 50%)`
                                  }} />
                                </div>
                                <span className="text-sm font-medium">{item.heat_score}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">{item.view_count?.toLocaleString() ?? '-'}</td>
                            <td className="py-3 px-4 text-sm">{item.inquiry_count ?? '-'}</td>
                            <td className="py-3 px-4 text-sm">{item.deal_count ?? '-'}</td>
                            <td className="py-3 px-4 text-sm font-medium">{item.avg_price ? `¥${item.avg_price.toLocaleString()}` : '-'}</td>
                            <td className="py-3 px-4 text-sm">
                              {item.yoy?.avg_price_change !== null && item.yoy?.avg_price_change !== undefined ? (
                                <span className={item.yoy.avg_price_change >= 0 ? 'text-red-600' : 'text-green-600'}>
                                  {item.yoy.avg_price_change >= 0 ? '+' : ''}{item.yoy.avg_price_change}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {item.mom?.avg_price_change !== null && item.mom?.avg_price_change !== undefined ? (
                                <span className={item.mom.avg_price_change >= 0 ? 'text-red-600' : 'text-green-600'}>
                                  {item.mom.avg_price_change >= 0 ? '+' : ''}{item.mom.avg_price_change}%
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {inspectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setInspectionModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">处理巡检</h3>
              <button onClick={() => setInspectionModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">房源：<span className="font-medium text-gray-900">{inspectionModal.title}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理状态</label>
                <select value={inspectionForm.status} onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="completed">已完成</option>
                  <option value="pending">继续待审</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">质量评分（0-100）</label>
                <input type="number" min="0" max="100" value={inspectionForm.quality_score}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, quality_score: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="请输入质量评分" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题</label>
                <textarea value={inspectionForm.issues} onChange={(e) => setInspectionForm({ ...inspectionForm, issues: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3} placeholder="请描述发现的问题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">建议</label>
                <textarea value={inspectionForm.suggestions} onChange={(e) => setInspectionForm({ ...inspectionForm, suggestions: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3} placeholder="请输入改进建议" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setInspectionModal(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm">取消</button>
                <button onClick={handleInspection} disabled={handlingInspection}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50">
                  {handlingInspection ? '处理中...' : '确认处理'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {riskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRiskModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">处理风控</h3>
              <button onClick={() => setRiskModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">经纪人：<span className="font-medium text-gray-900">{riskModal.agent_name}</span></p>
                <p className="text-sm text-gray-600 mt-1">风险类型：<span className="font-medium text-gray-900">{riskModal.risk_type}</span></p>
                <p className="text-sm text-gray-600 mt-1">风险等级：
                  <span className={`font-medium ${riskModal.risk_level === 'high' ? 'text-red-600' : riskModal.risk_level === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {getRiskLevelText(riskModal.risk_level)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理状态</label>
                <select value={riskForm.status} onChange={(e) => setRiskForm({ ...riskForm, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="confirmed">确认风险（将扣减信用分）</option>
                  <option value="dismissed">排除风险</option>
                </select>
              </div>
              {riskForm.status === 'confirmed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  确认风险后，该经纪人信用分将自动扣减10分
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
                <textarea value={riskForm.description} onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3} placeholder="请输入处理说明" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setRiskModal(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm">取消</button>
                <button onClick={handleRiskControl} disabled={handlingRisk}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50">
                  {handlingRisk ? '处理中...' : '确认处理'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
