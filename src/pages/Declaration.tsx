import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';

const DEDUCTION_TYPES = [
  { key: 'children_education', name: '子女教育', amount: 12000, icon: '👶' },
  { key: 'continuing_education', name: '继续教育', amount: 4800, icon: '📚' },
  { key: 'serious_illness', name: '大病医疗', amount: 80000, icon: '🏥' },
  { key: 'housing_loan', name: '住房贷款利息', amount: 12000, icon: '🏠' },
  { key: 'housing_rent', name: '住房租金', amount: 18000, icon: '🏘️' },
  { key: 'elderly_support', name: '赡养老人', amount: 24000, icon: '👴' },
];

export default function Declaration() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [selectedDeclaration, setSelectedDeclaration] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<string>('');
  const [deductionDetails, setDeductionDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadDeclarations();
  }, [token, navigate]);

  const loadDeclarations = async () => {
    try {
      const result = await api.declaration.list();
      if (result.success) {
        setDeclarations(result.data || []);
      }
    } catch (e) {
      console.error('Load declarations failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const createDeclaration = async () => {
    setCreating(true);
    try {
      const result = await api.declaration.create();
      if (result.success) {
        await loadDeclarations();
        if (result.data?.declarationId) {
          viewDeclaration(result.data.declarationId);
        }
      } else {
        alert(result.error || '创建失败');
      }
    } catch (e) {
      alert('创建失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const viewDeclaration = async (id: number) => {
    try {
      const result = await api.declaration.get(id);
      if (result.success) {
        setSelectedDeclaration(result.data);
        setActiveTab('detail');
        calculateTax(id);
      }
    } catch (e) {
      console.error('Load declaration failed:', e);
    }
  };

  const calculateTax = async (id: number) => {
    try {
      const result = await api.declaration.calculate(id);
      if (result.success) {
        setCalculation(result.data);
      }
    } catch (e) {
      console.error('Calculate tax failed:', e);
    }
  };

  const addDeduction = async () => {
    if (!selectedDeduction) {
      alert('请选择扣除项目');
      return;
    }

    try {
      const result = await api.declaration.addDeduction(selectedDeclaration.id, {
        deductionType: selectedDeduction,
        details: deductionDetails,
      });

      if (result.success) {
        alert('扣除项目添加成功');
        setShowDeductionModal(false);
        setSelectedDeduction('');
        setDeductionDetails({});
        viewDeclaration(selectedDeclaration.id);
      } else {
        alert(result.error || '添加失败');
      }
    } catch (e) {
      alert('添加失败，请重试');
    }
  };

  const submitDeclaration = async () => {
    if (!user?.faceVerified || !user?.bankCardVerified) {
      alert('请先完成人脸识别和银行卡验证后再提交申报');
      navigate('/verify');
      return;
    }

    if (!confirm('确认提交年度汇算申报？提交后将进入税务审核流程。')) {
      return;
    }

    try {
      const result = await api.declaration.submit(selectedDeclaration.id);
      if (result.success) {
        alert('申报提交成功！请等待税务机关审核');
        loadDeclarations();
        setActiveTab('list');
      } else {
        alert(result.error || '提交失败');
      }
    } catch (e) {
      alert('提交失败，请重试');
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已审核',
      rejected: '已驳回',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800">年度汇算申报</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700">我的申报记录</h2>
              <button
                onClick={createDeclaration}
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creating ? '创建中...' : '+ 创建2025年度申报'}
              </button>
            </div>

            {declarations.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">暂无申报记录</p>
                <p className="text-sm text-gray-400 mb-6">
                  点击上方按钮创建您的年度汇算申报
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {declarations.map((dec: any) => (
                  <div
                    key={dec.id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => viewDeclaration(dec.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{dec.tax_year}年度个人所得税综合所得年度汇算</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          创建时间：{dec.created_at}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          dec.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          dec.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                          dec.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getStatusText(dec.status)}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          应退/补税额：
                          <span className={dec.tax_refund > 0 ? 'text-green-600 font-semibold' : dec.tax_supplement > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {dec.tax_refund > 0 ? ` 退税 ¥${dec.tax_refund}` :
                             dec.tax_supplement > 0 ? ` 补税 ¥${dec.tax_supplement}` : ' ¥0'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'detail' && selectedDeclaration && (
          <div>
            <button
              onClick={() => setActiveTab('list')}
              className="text-blue-600 text-sm mb-4 hover:underline"
            >
              ← 返回列表
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">收入纳税明细</h3>
                  {selectedDeclaration.incomeDetails?.map((income: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-800">{income.income_type}</p>
                        <p className="text-sm text-gray-500">{income.payer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">¥{income.income_amount?.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">已扣税 ¥{income.tax_withheld}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">收入合计</span>
                      <span className="font-semibold text-gray-800">¥{selectedDeclaration.total_income?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">已缴税额合计</span>
                      <span className="font-semibold text-gray-800">¥{selectedDeclaration.total_tax_paid?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">专项附加扣除</h3>
                    {selectedDeclaration.status === 'draft' && (
                      <button
                        onClick={() => setShowDeductionModal(true)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        + 添加扣除
                      </button>
                    )}
                  </div>
                  {(!selectedDeclaration.deductions || selectedDeclaration.deductions.length === 0) ? (
                    <p className="text-gray-400 text-center py-8">暂无专项附加扣除</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDeclaration.deductions.map((ded: any, idx: number) => {
                        const type = DEDUCTION_TYPES.find(t => t.key === ded.deduction_type);
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{type?.icon || '📋'}</span>
                              <div>
                                <p className="font-medium text-gray-800">{type?.name || ded.deduction_type}</p>
                                <p className="text-xs text-gray-500">已验证</p>
                              </div>
                            </div>
                            <span className="font-semibold text-green-600">¥{ded.amount?.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-gray-600">专项附加扣除合计</span>
                    <span className="font-semibold text-green-600">¥{selectedDeclaration.total_deduction?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">应纳税额计算</h3>
                  {calculation && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">综合所得收入额</span>
                        <span className="text-gray-800">¥{calculation.totalIncome?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">减除费用</span>
                        <span className="text-gray-800">-¥{calculation.standardDeduction?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">专项附加扣除</span>
                        <span className="text-gray-800">-¥{calculation.specialDeduction?.toLocaleString() || 0}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">应纳税所得额</span>
                          <span className="text-gray-800">¥{calculation.taxableIncome?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">应纳税额</span>
                          <span className="text-gray-800">¥{calculation.taxPayable?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">已缴税额</span>
                          <span className="text-gray-800">¥{calculation.taxPaid?.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        {calculation.taxRefund > 0 && (
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-600 mb-1">应退税额</p>
                            <p className="text-2xl font-bold text-green-600">¥{calculation.taxRefund?.toLocaleString()}</p>
                          </div>
                        )}
                        {calculation.taxSupplement > 0 && (
                          <div className="bg-red-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-red-600 mb-1">应补税额</p>
                            <p className="text-2xl font-bold text-red-600">¥{calculation.taxSupplement?.toLocaleString()}</p>
                          </div>
                        )}
                        {calculation.taxRefund === 0 && calculation.taxSupplement === 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600">无需退补税</p>
                            <p className="text-2xl font-bold text-gray-600">¥0</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedDeclaration.status === 'draft' && (
                    <button
                      onClick={submitDeclaration}
                      className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      提交申报
                    </button>
                  )}
                  
                  {selectedDeclaration.status !== 'draft' && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-500">
                        申报状态：{getStatusText(selectedDeclaration.status)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showDeductionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">添加专项附加扣除</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择扣除项目</label>
                <div className="grid grid-cols-2 gap-2">
                  {DEDUCTION_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelectedDeduction(type.key)}
                      className={`p-3 rounded-lg border text-left transition ${
                        selectedDeduction === type.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <p className="font-medium text-gray-800 text-sm mt-1">{type.name}</p>
                      <p className="text-xs text-gray-500">¥{type.amount.toLocaleString()}/年</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDeduction === 'children_education' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">子女出生年份</label>
                  <input
                    type="text"
                    value={deductionDetails.childBirthYear || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, childBirthYear: e.target.value })}
                    placeholder="例如：2015"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-400 mt-1">子女年龄需在3-25岁之间</p>
                </div>
              )}

              {selectedDeduction === 'elderly_support' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">老人出生年份</label>
                  <input
                    type="text"
                    value={deductionDetails.elderBirthYear || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, elderBirthYear: e.target.value })}
                    placeholder="例如：1955"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-400 mt-1">被赡养老人需年满60周岁</p>
                </div>
              )}

              {selectedDeduction === 'continuing_education' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">继续教育类型</label>
                  <select
                    value={deductionDetails.educationType || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, educationType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">请选择</option>
                    <option value="degree">学历继续教育</option>
                    <option value="skill">职业资格继续教育</option>
                  </select>
                </div>
              )}

              {selectedDeduction === 'housing_loan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">贷款起始日期</label>
                  <input
                    type="month"
                    value={deductionDetails.loanStartDate || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, loanStartDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {selectedDeduction === 'housing_rent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">租赁城市</label>
                  <input
                    type="text"
                    value={deductionDetails.city || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, city: e.target.value })}
                    placeholder="例如：北京市"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              {selectedDeduction === 'serious_illness' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">医疗费用金额（元）</label>
                  <input
                    type="number"
                    value={deductionDetails.medicalAmount || ''}
                    onChange={(e) => setDeductionDetails({ ...deductionDetails, medicalAmount: e.target.value })}
                    placeholder="请填写医保目录范围内自付金额"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-400 mt-1">超过15000元的部分可在80000元限额内扣除</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex space-x-3">
              <button
                onClick={() => {
                  setShowDeductionModal(false);
                  setSelectedDeduction('');
                  setDeductionDetails({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={addDeduction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
