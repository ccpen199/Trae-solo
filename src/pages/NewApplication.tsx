import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, FileText, Plus, X } from 'lucide-react';
import { useApplicationStore, useUserStore } from '@/store';

export default function NewApplication() {
  const navigate = useNavigate();
  const { createApplication, loading } = useApplicationStore();
  const { currentUser } = useUserStore();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_id_card: '',
    customer_gender: 'male',
    customer_birth_date: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    occupation: '',
    occupation_risk_level: 1,
    product_name: '',
    product_code: '',
    coverage_amount: 0,
    premium: 0,
    policy_term: 20,
    payment_term: 20,
    beneficiary_name: '',
    beneficiary_relationship: '',
    beneficiary_id_card: '',
    healthDeclarations: [] as any[],
    medicalHistories: [] as any[]
  });

  const [healthQuestions, setHealthQuestions] = useState([
    { code: 'Q001', question: '过去2年内是否曾住院或手术治疗？', answer: 'no', has_condition: false },
    { code: 'Q002', question: '是否有高血压、心脏病、糖尿病等慢性疾病？', answer: 'no', has_condition: false },
    { code: 'Q003', question: '是否有甲状腺结节、乳腺结节、肺结节等？', answer: 'no', has_condition: false },
    { code: 'Q004', question: '过去1年内是否有持续超过1周的身体不适？', answer: 'no', has_condition: false },
    { code: 'Q005', question: '是否有家族遗传病史？', answer: 'no', has_condition: false }
  ]);

  const [newMedicalHistory, setNewMedicalHistory] = useState({
    condition_type: '',
    condition_name: '',
    diagnosis_date: '',
    hospital_name: '',
    treatment_details: '',
    is_recovered: false
  });

  const handleHealthQuestionChange = (index: number, answer: string) => {
    const newQuestions = [...healthQuestions];
    newQuestions[index].answer = answer;
    newQuestions[index].has_condition = answer === 'yes';
    setHealthQuestions(newQuestions);
  };

  const addMedicalHistory = () => {
    if (!newMedicalHistory.condition_name) return;
    setFormData({
      ...formData,
      medicalHistories: [...formData.medicalHistories, { ...newMedicalHistory }]
    });
    setNewMedicalHistory({
      condition_type: '',
      condition_name: '',
      diagnosis_date: '',
      hospital_name: '',
      treatment_details: '',
      is_recovered: false
    });
  };

  const removeMedicalHistory = (index: number) => {
    const newHistories = [...formData.medicalHistories];
    newHistories.splice(index, 1);
    setFormData({ ...formData, medicalHistories: newHistories });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        healthDeclarations: healthQuestions.map(q => ({
          question_code: q.code,
          question_text: q.question,
          answer: q.answer,
          has_condition: q.has_condition
        }))
      };
      await createApplication(data);
      alert('投保单创建成功！');
      navigate('/applications');
    } catch (error: any) {
      alert(error.message);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">新建投保单</h1>
            <p className="text-sm text-gray-500 mt-1">录入客户投保信息</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : step > s
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s ? <CheckIcon className="w-5 h-5" /> : s}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                step >= s ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {s === 1 ? '基本信息' : s === 2 ? '健康告知' : '确认提交'}
              </span>
              {s < 3 && <div className={`w-24 h-1 mx-4 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                客户信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">证件号码 *</label>
                  <input
                    type="text"
                    value={formData.customer_id_card}
                    onChange={(e) => setFormData({ ...formData, customer_id_card: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入身份证号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    value={formData.customer_gender}
                    onChange={(e) => setFormData({ ...formData, customer_gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                  <input
                    type="date"
                    value={formData.customer_birth_date}
                    onChange={(e) => setFormData({ ...formData, customer_birth_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入手机号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">住址</label>
                  <input
                    type="text"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入详细地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">职业</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入职业"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">职业风险等级</label>
                  <select
                    value={formData.occupation_risk_level}
                    onChange={(e) => setFormData({ ...formData, occupation_risk_level: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={1}>1级 - 低风险</option>
                    <option value={2}>2级 - 中低风险</option>
                    <option value={3}>3级 - 中风险</option>
                    <option value={4}>4级 - 中高风险</option>
                    <option value={5}>5级 - 高风险</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                投保信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入产品名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品代码</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入产品代码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保险金额（元）*</label>
                  <input
                    type="number"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入保险金额"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保费（元）</label>
                  <input
                    type="number"
                    value={formData.premium}
                    onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入保费"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保险期限（年）</label>
                  <input
                    type="number"
                    value={formData.policy_term}
                    onChange={(e) => setFormData({ ...formData, policy_term: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入保险期限"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">缴费期限（年）</label>
                  <input
                    type="number"
                    value={formData.payment_term}
                    onChange={(e) => setFormData({ ...formData, payment_term: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入缴费期限"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                受益人信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">受益人姓名</label>
                  <input
                    type="text"
                    value={formData.beneficiary_name}
                    onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入受益人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">与被保险人关系</label>
                  <input
                    type="text"
                    value={formData.beneficiary_relationship}
                    onChange={(e) => setFormData({ ...formData, beneficiary_relationship: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="如：配偶、子女、父母"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">受益人证件号码</label>
                  <input
                    type="text"
                    value={formData.beneficiary_id_card}
                    onChange={(e) => setFormData({ ...formData, beneficiary_id_card: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="请输入受益人证件号码"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.customer_name || !formData.customer_id_card || !formData.product_name || !formData.coverage_amount}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">健康告知问卷</h3>
              <div className="space-y-4">
                {healthQuestions.map((q, index) => (
                  <div key={q.code} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-3">{index + 1}. {q.question}</p>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={q.code}
                          value="no"
                          checked={q.answer === 'no'}
                          onChange={() => handleHealthQuestionChange(index, 'no')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">否</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={q.code}
                          value="yes"
                          checked={q.answer === 'yes'}
                          onChange={() => handleHealthQuestionChange(index, 'yes')}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">是</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">既往病史登记</h3>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">疾病类型</label>
                    <input
                      type="text"
                      value={newMedicalHistory.condition_type}
                      onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, condition_type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="如：心血管、内分泌等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">疾病名称 *</label>
                    <input
                      type="text"
                      value={newMedicalHistory.condition_name}
                      onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, condition_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="如：高血压、糖尿病等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">诊断日期</label>
                    <input
                      type="date"
                      value={newMedicalHistory.diagnosis_date}
                      onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, diagnosis_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">就诊医院</label>
                    <input
                      type="text"
                      value={newMedicalHistory.hospital_name}
                      onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, hospital_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="请输入医院名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">治疗详情</label>
                    <input
                      type="text"
                      value={newMedicalHistory.treatment_details}
                      onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, treatment_details: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="请输入治疗详情"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={newMedicalHistory.is_recovered}
                        onChange={(e) => setNewMedicalHistory({ ...newMedicalHistory, is_recovered: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">已痊愈</span>
                    </label>
                    <button
                      onClick={addMedicalHistory}
                      disabled={!newMedicalHistory.condition_name}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </button>
                  </div>
                </div>
              </div>

              {formData.medicalHistories.length > 0 && (
                <div className="space-y-3">
                  {formData.medicalHistories.map((mh, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-4">
                      <div>
                        <p className="font-medium text-red-900">{mh.condition_name} ({mh.condition_type})</p>
                        <p className="text-sm text-red-700">
                          诊断日期：{mh.diagnosis_date || '-'} · 医院：{mh.hospital_name || '-'} · {mh.is_recovered ? '已痊愈' : '未痊愈'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeMedicalHistory(index)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">请确认以下信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">客户姓名：<span className="font-medium text-blue-900">{formData.customer_name}</span></p>
                  <p className="text-blue-700">证件号码：<span className="font-medium text-blue-900">{formData.customer_id_card}</span></p>
                  <p className="text-blue-700">性别：<span className="font-medium text-blue-900">{formData.customer_gender === 'male' ? '男' : '女'}</span></p>
                  <p className="text-blue-700">职业：<span className="font-medium text-blue-900">{formData.occupation || '-'}</span></p>
                  <p className="text-blue-700">职业风险等级：<span className="font-medium text-blue-900">{formData.occupation_risk_level} 级</span></p>
                </div>
                <div>
                  <p className="text-blue-700">产品名称：<span className="font-medium text-blue-900">{formData.product_name}</span></p>
                  <p className="text-blue-700">保险金额：<span className="font-medium text-blue-900">{formData.coverage_amount.toLocaleString()} 元</span></p>
                  <p className="text-blue-700">保费：<span className="font-medium text-blue-900">{formData.premium.toLocaleString()} 元</span></p>
                  <p className="text-blue-700">健康告知异常：<span className="font-medium text-blue-900">
                    {healthQuestions.filter(q => q.has_condition).length} 项
                  </span></p>
                  <p className="text-blue-700">既往病史：<span className="font-medium text-blue-900">{formData.medicalHistories.length} 项</span></p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertIcon className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">重要声明</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    本人确认以上信息真实完整，如有不实，愿意承担相应法律责任和后果。核保结论以保险公司最终审核为准。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '提交中...' : '提交投保单'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
