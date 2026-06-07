import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Building2,
  FileText,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Upload,
  Eye,
} from 'lucide-react';
import { serviceApi, applicationApi, licenseApi } from '../api';
import { ServiceItem, License, MaterialItem } from '../types';
import { useAuthStore } from '../store/authStore';

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [service, setService] = useState<ServiceItem | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [scenario, setScenario] = useState<any>(null);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [myLicenses, setMyLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'guide' | 'materials' | 'form'>('guide');
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentScenarioNode, setCurrentScenarioNode] = useState<any>(null);
  const [matchedPath, setMatchedPath] = useState<any>(null);
  const [uploadedMaterials, setUploadedMaterials] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [serviceRes, materialsRes, scenarioRes, formRes, licensesRes] = await Promise.all([
          serviceApi.getById(parseInt(id)),
          serviceApi.getMaterials(parseInt(id)),
          serviceApi.getScenarioGuide(parseInt(id)),
          serviceApi.getFormSchema(parseInt(id)),
          isAuthenticated
            ? licenseApi.getMyLicenses()
            : Promise.resolve({ success: true, data: [] }),
        ]);

        if (serviceRes.success) setService(serviceRes.data || null);
        if (materialsRes.success) setMaterials(materialsRes.data || []);
        if (scenarioRes.success) {
          setScenario(scenarioRes.data);
          setCurrentScenarioNode(scenarioRes.data?.nodes?.[0]);
        }
        if (formRes.success) {
          setFormSchema(formRes.data);
          if (formRes.data?.fields) {
            const initialData: Record<string, any> = {};
            formRes.data.fields.forEach((f: any) => {
              if (f.defaultValue !== undefined) {
                initialData[f.name] = f.defaultValue;
              }
            });
            setFormData(initialData);
          }
        }
        if (licensesRes.success) setMyLicenses(licensesRes.data || []);
      } catch (e) {
        console.error('Load service detail error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isAuthenticated]);

  const handleScenarioAnswer = (option: any) => {
    setScenarioAnswers((prev) => ({
      ...prev,
      [currentScenarioNode.id]: option.value,
    }));

    if (option.result) {
      setMatchedPath(option.result);
      if (option.result.prefillData) {
        setFormData((prev) => ({
          ...prev,
          ...option.result.prefillData,
        }));
      }
      setActiveTab('materials');
    } else if (option.nextNode) {
      const nextNode = scenario.nodes.find((n: any) => n.id === option.nextNode);
      setCurrentScenarioNode(nextNode);
    }
  };

  const resetScenario = () => {
    setScenarioAnswers({});
    setMatchedPath(null);
    setCurrentScenarioNode(scenario.nodes[0]);
    setActiveTab('guide');
  };

  const autoFetchLicense = (material: MaterialItem) => {
    if (material.source !== 'license' || !material.licenseType) return null;
    return myLicenses.find((l) => l.licenseType === material.licenseType && l.status === 'valid');
  };

  const handleMaterialAutoFill = (material: MaterialItem) => {
    const license = autoFetchLicense(material);
    if (license) {
      setUploadedMaterials((prev) => ({
        ...prev,
        [material.code]: {
          ...prev[material.code],
          source: 'license',
          licenseId: license.id,
          licenseType: license.licenseType,
          licenseNumber: license.licenseNumber,
          autoFetched: true,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!service) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);

    try {
      const materialsList = materials.map((m) => ({
        code: m.code,
        name: m.name,
        ...uploadedMaterials[m.code],
      }));

      const res = await applicationApi.create({
        serviceItemId: service.id,
        serviceItemName: service.name,
        formData: formData,
        materials: materialsList,
      });

      if (res.success && res.data) {
        navigate(`/applications/${res.data.id}`);
      }
    } catch (e: any) {
      console.error('Submit application error:', e);
      alert(e.response?.data?.error || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (field: any) => {
    const value = formData[field.name] ?? '';
    const baseInputClass =
      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className={baseInputClass}
            required={field.required}
          >
            <option value="">请选择</option>
            {field.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            rows={4}
            className={baseInputClass}
            required={field.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">服务事项不存在</p>
        <button
          onClick={() => navigate('/services')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/services')}
        className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回事项列表
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-3">
              <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded mr-3">
                {service.category}
              </span>
              <span className="text-xs text-gray-400">{service.code}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{service.name}</h1>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                {service.department}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                法定办结：{service.handlingTimeLimit || service.handlingLimit}个工作日
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                办理形式：线上办理
              </div>
            </div>
          </div>
        </div>
      </div>

      {matchedPath && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">智能匹配成功</p>
              <p className="text-sm text-green-600">{matchedPath.description}</p>
              {matchedPath.prefillData && (
                <p className="text-xs text-green-500 mt-1">已为您智能预填表单信息</p>
              )}
            </div>
            <button
              onClick={resetScenario}
              className="ml-auto text-sm text-green-600 hover:text-green-700"
            >
              重新选择情形
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'guide', label: '情形引导', icon: HelpCircle },
              { key: 'materials', label: '材料清单', icon: FileText },
              { key: 'form', label: '填写申报', icon: CheckCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
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
          {activeTab === 'guide' && (
            <div className="max-w-2xl mx-auto">
              {!matchedPath ? (
                currentScenarioNode ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {currentScenarioNode.question}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      请根据您的实际情况选择，系统将为您匹配最优办理路径
                    </p>
                    <div className="space-y-3">
                      {currentScenarioNode.options?.map((option: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleScenarioAnswer(option)}
                          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                        >
                          <span className="font-medium text-gray-900">{option.label}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">暂无情形引导配置</p>
                )
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">情形匹配完成</h3>
                  <p className="text-gray-500 mb-6">
                    根据您的选择，已匹配到最优办理路径。请继续准备材料并填写表单。
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={resetScenario}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={() => setActiveTab('materials')}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      下一步：准备材料
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">申请材料清单</h3>
              <div className="space-y-4">
                {materials.map((material, index) => {
                  const autoLicense = autoFetchLicense(material);
                  const uploaded = uploadedMaterials[material.code];
                  return (
                    <div
                      key={material.code}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-gray-900">{material.name}</h4>
                            {material.required && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded">
                                必需
                              </span>
                            )}
                          </div>
                          <div className="ml-9 space-y-1">
                            <p className="text-sm text-gray-500">
                              材料格式：{material.format}
                            </p>
                            {material.source === 'license' && (
                              <p className="text-sm text-primary-600">
                                来源：{material.licenseType}（支持证照库自动调取）
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {autoLicense && !uploaded?.autoFetched && (
                            <button
                              onClick={() => handleMaterialAutoFill(material)}
                              className="px-4 py-2 bg-primary-50 text-primary-600 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              免提交 · 自动调取
                            </button>
                          )}
                          {!autoLicense && (
                            <button className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                              <Upload className="w-4 h-4 mr-2" />
                              上传
                            </button>
                          )}
                        </div>
                      </div>
                      {uploaded?.autoFetched && (
                        <div className="ml-9 mt-3 p-3 bg-green-50 rounded-lg flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-700">
                            已自动调取您的{material.licenseType}（{uploaded.licenseNumber}），无需手动上传
                          </span>
                          <Eye className="w-4 h-4 text-green-600 ml-auto cursor-pointer" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center"
                >
                  下一步：填写表单 <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">填写申报信息</h3>
              <div className="space-y-6">
                {formSchema?.fields?.map((field: any) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFormField(field)}
                    {formData[field.name] && field.prefilled && (
                      <p className="text-xs text-green-600 mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        智能预填
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  提交前请仔细核对所填信息的真实性，虚假信息将导致申请被驳回。
                </p>
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('materials')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
                >
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
