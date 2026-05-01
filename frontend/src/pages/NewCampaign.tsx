import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Users,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function NewCampaignPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    audienceId: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    scheduledAt: '',
    enableTracking: true,
    enableAbtesting: false,
    abTestType: 'subject',
    abTestVariations: [
      { id: 'A', subject: '', percent: 50 },
      { id: 'B', subject: '', percent: 50 },
    ],
    priority: 0,
    tags: [] as string[],
  });
  
  const steps = [
    { id: 1, name: '基本信息', icon: FileText },
    { id: 2, name: '选择模板', icon: FileText },
    { id: 3, name: '选择受众', icon: Users },
    { id: 4, name: '发送设置', icon: Clock },
    { id: 5, name: '预览确认', icon: Eye },
  ];
  
  const [templates] = useState([
    { id: '1', name: '促销邮件模板', category: '促销', subject: '{{name}}，限时优惠不容错过！' },
    { id: '2', name: '欢迎邮件模板', category: '通知', subject: '欢迎加入{{company}}！' },
    { id: '3', name: '产品更新通知', category: '通知', subject: '新功能上线：{{feature}}现已推出' },
  ]);
  
  const [audiences] = useState([
    { id: '1', name: '潜在客户列表', totalCount: 2500, description: '从官网表单收集的潜在客户' },
    { id: '2', name: '新注册用户', totalCount: 800, description: '最近30天内注册的新用户' },
    { id: '3', name: 'VIP会员', totalCount: 500, description: '付费VIP会员用户' },
  ]);
  
  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.templateId.length > 0;
      case 3:
        return formData.audienceId.length > 0;
      default:
        return true;
    }
  };
  
  const handleSaveDraft = async () => {
    alert('保存为草稿成功！');
    navigate('/campaigns');
  };
  
  const handleSubmitReview = async () => {
    alert('提交审核成功！');
    navigate('/campaigns');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/campaigns')}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">新建营销活动</h1>
            <p className="text-neutral-500 mt-1">创建新的邮件营销活动</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} className="btn-secondary">
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          {currentStep === 5 && (
            <button onClick={handleSubmitReview} className="btn-primary">
              <Send className="w-4 h-4" />
              提交审核
            </button>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    className={cn(
                      'flex items-center gap-2',
                      step.id < currentStep ? 'cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isActive
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : isCompleted
                          ? 'bg-success-500 border-success-500 text-white'
                          : 'bg-white border-neutral-300 text-neutral-400'
                      )}
                    >
                      {isCompleted ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium ml-2 hidden md:block',
                        isActive
                          ? 'text-primary-600'
                          : isCompleted
                          ? 'text-success-600'
                          : 'text-neutral-400'
                      )}
                    >
                      {step.name}
                    </span>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-8 md:w-16 h-0.5 mx-2',
                        isCompleted ? 'bg-success-500' : 'bg-neutral-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="label">活动名称 <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：2024春季促销活动"
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">活动描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="简要描述活动目的和内容..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
              
              <div>
                <label className="label">邮件主题</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="留空则使用模板主题"
                  className="input"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  支持变量占位符，例如: {{name}}、{{company}}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">发件人名称</label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => handleInputChange('fromName', e.target.value)}
                    placeholder="例如：市场部"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">发件人邮箱</label>
                  <input
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                    placeholder="留空使用系统默认"
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="label">回复邮箱</label>
                <input
                  type="email"
                  value={formData.replyTo}
                  onChange={(e) => handleInputChange('replyTo', e.target.value)}
                  placeholder="用户回复时接收的邮箱"
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  className="input max-w-xs"
                >
                  <option value={2}>高优先级</option>
                  <option value={1}>中优先级</option>
                  <option value={0}>普通优先级</option>
                  <option value={-1}>低优先级</option>
                </select>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <p className="text-sm text-primary-700">
                  选择一个邮件模板作为活动内容。模板支持动态变量渲染，将根据用户画像自动替换。
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleInputChange('templateId', template.id)}
                    className={cn(
                      'card text-left p-4 transition-all',
                      formData.templateId === template.id
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'hover:border-neutral-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-neutral-600" />
                      </div>
                      {formData.templateId === template.id && (
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-neutral-900">{template.name}</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      <span className="badge badge-default">{template.category}</span>
                    </p>
                    <p className="text-sm text-neutral-600 mt-2 font-mono">
                      {template.subject}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-success-50 border border-success-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                <p className="text-sm text-success-700">
                  选择目标受众分组。系统将根据受众筛选条件拉取用户画像数据。
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {audiences.map((audience) => (
                  <button
                    key={audience.id}
                    onClick={() => handleInputChange('audienceId', audience.id)}
                    className={cn(
                      'card text-left p-4 transition-all',
                      formData.audienceId === audience.id
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'hover:border-neutral-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-neutral-600" />
                      </div>
                      {formData.audienceId === audience.id && (
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-neutral-900">{audience.name}</h4>
                    <p className="text-sm text-neutral-500 mt-1">{audience.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-900">
                        {audience.totalCount.toLocaleString()} 位成员
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="label">调度时间</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  className="input"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  留空则审核通过后立即开始发送
                </p>
              </div>
              
              <div>
                <label className="label">追踪选项</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableTracking}
                      onChange={(e) => handleInputChange('enableTracking', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-neutral-900">启用点击追踪</p>
                      <p className="text-sm text-neutral-500">追踪邮件打开和链接点击，用于统计分析</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="label">A/B测试</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableAbtesting}
                      onChange={(e) => handleInputChange('enableAbtesting', e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-neutral-900">启用A/B测试</p>
                      <p className="text-sm text-neutral-500">测试不同邮件版本的效果，自动选择最优版本</p>
                    </div>
                  </label>
                  
                  {formData.enableAbtesting && (
                    <div className="p-4 border border-neutral-200 rounded-lg space-y-4">
                      <div>
                        <label className="label">测试类型</label>
                        <select
                          value={formData.abTestType}
                          onChange={(e) => handleInputChange('abTestType', e.target.value)}
                          className="input max-w-xs"
                        >
                          <option value="subject">主题行测试</option>
                          <option value="content">内容测试</option>
                          <option value="sender">发件人测试</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.abTestVariations.map((variation) => (
                          <div key={variation.id} className="p-4 bg-neutral-50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-neutral-900">版本 {variation.id}</span>
                              <span className="text-sm text-neutral-500">{variation.percent}%</span>
                            </div>
                            <input
                              type="text"
                              value={variation.subject}
                              onChange={(e) => {
                                const newVariations = formData.abTestVariations.map((v) =>
                                  v.id === variation.id ? { ...v, subject: e.target.value } : v
                                );
                                handleInputChange('abTestVariations', newVariations);
                              }}
                              placeholder={`输入版本 ${variation.id} 的主题...`}
                              className="input"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-900">活动基本信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">活动名称</span>
                      <span className="font-medium text-neutral-900">{formData.name || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">描述</span>
                      <span className="font-medium text-neutral-900">{formData.description || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">邮件主题</span>
                      <span className="font-medium text-neutral-900">{formData.subject || '使用模板主题'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">发件人</span>
                      <span className="font-medium text-neutral-900">{formData.fromName || '系统默认'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">调度时间</span>
                      <span className="font-medium text-neutral-900">{formData.scheduledAt || '审核通过后立即发送'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">点击追踪</span>
                      <span className={`font-medium ${formData.enableTracking ? 'text-success-600' : 'text-neutral-400'}`}>
                        {formData.enableTracking ? '已启用' : '未启用'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-neutral-100">
                      <span className="text-neutral-500">A/B测试</span>
                      <span className={`font-medium ${formData.enableAbtesting ? 'text-primary-600' : 'text-neutral-400'}`}>
                        {formData.enableAbtesting ? '已启用' : '未启用'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-neutral-900">关联资源</h3>
                  
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-neutral-900">邮件模板</span>
                    </div>
                    {formData.templateId ? (
                      <div>
                        <p className="text-sm text-neutral-900">
                          {templates.find((t) => t.id === formData.templateId)?.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {templates.find((t) => t.id === formData.templateId)?.subject}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-danger-600">未选择模板</p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-success-600" />
                      <span className="font-medium text-neutral-900">目标受众</span>
                    </div>
                    {formData.audienceId ? (
                      <div>
                        <p className="text-sm text-neutral-900">
                          {audiences.find((a) => a.id === formData.audienceId)?.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {audiences.find((a) => a.id === formData.audienceId)?.totalCount.toLocaleString()} 位成员
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-danger-600">未选择受众</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-warning-800">提交审核前请确认</p>
                  <p className="text-sm text-warning-700">
                    活动提交审核后，需要审核通过才能发送。审核通过后，邮件将按照设定的时间发送给目标受众。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="card-footer flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>
          
          {currentStep < steps.length && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewCampaignPage;
