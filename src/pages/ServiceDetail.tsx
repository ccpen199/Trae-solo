import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Building2, CheckCircle, AlertCircle, HelpCircle, ChevronRight, ListChecks, UserCheck, Upload, PenLine, Send } from 'lucide-react';
import { mockServices } from '../mock/data';

const handlingSteps = [
  { step: 1, title: '在线填报', description: '填写申请信息，系统自动校验', icon: UserCheck },
  { step: 2, title: '提交材料', description: '上传或调用电子证照', icon: Upload },
  { step: 3, title: '电子签名', description: '在线签署电子确认书', icon: PenLine },
  { step: 4, title: '提交审核', description: '部门后台审核办理', icon: Send },
];

const faqs = [
  {
    question: '办理该事项需要多长时间？',
    answer: '根据不同事项，办理时限有所不同。一般在承诺时限内完成，您可以在"我的办件"中实时查看办理进度。',
  },
  {
    question: '材料上传后还能修改吗？',
    answer: '在审核人员受理前，您可以撤回申请并修改材料。一旦受理，如需修改请联系办理部门。',
  },
  {
    question: '电子证照和纸质材料具有同等效力吗？',
    answer: '是的，根据《电子证照管理办法》，电子证照与纸质证照具有同等法律效力，可以直接使用。',
  },
  {
    question: '办理失败怎么办？',
    answer: '如办理被驳回，系统会告知具体原因。您可以根据提示补充材料或修改信息后重新申请。',
  },
];

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const service = mockServices.find(s => s.id === id);

  if (!service) {
    return (
      <div className="min-h-screen bg-gov-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gov-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gov-gray-600 mb-2">事项不存在</h2>
          <p className="text-gov-gray-400 mb-4">您访问的事项可能已下架或不存在</p>
          <button
            onClick={() => navigate('/services')}
            className="gov-btn-primary"
          >
            返回事项列表
          </button>
        </div>
      </div>
    );
  }

  const handleApply = () => {
    navigate(`/services/${service.id}/apply`);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gov-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-gov-gray-500 hover:text-primary-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回事项列表</span>
        </button>

        <div className="gov-card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gov-gray-700">{service.name}</h1>
                {service.hotLevel > 900 && (
                  <span className="gov-badge-danger">热门</span>
                )}
                {service.isOnline && (
                  <span className="gov-badge-success">可在线办理</span>
                )}
              </div>
              <p className="text-gov-gray-400 mb-4">{service.description}</p>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-sm text-gov-gray-500">
                  <Building2 className="w-4 h-4" />
                  {service.department}
                </span>
                <span className="flex items-center gap-2 text-sm text-gov-gray-500">
                  <Clock className="w-4 h-4" />
                  承诺时限：{service.handlingTime}
                </span>
                <span className="flex items-center gap-2 text-sm text-gov-gray-500">
                  <FileText className="w-4 h-4" />
                  {service.hotLevel}人已办理
                </span>
              </div>
            </div>
            <button
              onClick={handleApply}
              className="gov-btn-primary px-8 py-3 text-lg flex items-center gap-2"
            >
              <PenLine className="w-5 h-5" />
              立即办理
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="gov-card p-6">
              <h2 className="text-lg font-semibold text-gov-gray-700 mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-500" />
                所需材料
              </h2>
              {service.requiredMaterials.length > 0 ? (
                <div className="space-y-3">
                  {service.requiredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start justify-between p-4 bg-gov-gray-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gov-gray-700">{material.name}</span>
                          {material.required && (
                            <span className="text-xs text-gov-red">*必填</span>
                          )}
                          {material.isElectronic && (
                            <span className="gov-tag">支持电子证照</span>
                          )}
                        </div>
                        <p className="text-sm text-gov-gray-400">{material.description}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-gov-green flex-shrink-0 ml-4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gov-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>该事项无需提交材料</p>
                </div>
              )}
            </div>

            <div className="gov-card p-6">
              <h2 className="text-lg font-semibold text-gov-gray-700 mb-6 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-500" />
                办理流程
              </h2>
              <div className="relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gov-gray-200" />
                <div className="space-y-6">
                  {handlingSteps.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="relative flex items-start gap-4 pl-2">
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center z-10 flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="pt-1">
                          <h3 className="font-medium text-gov-gray-700 mb-1">
                            步骤{item.step}：{item.title}
                          </h3>
                          <p className="text-sm text-gov-gray-400">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="gov-card p-6">
              <h2 className="text-lg font-semibold text-gov-gray-700 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                常见问题
              </h2>
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gov-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gov-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gov-gray-700">{faq.question}</span>
                      <ChevronRight
                        className={`w-5 h-5 text-gov-gray-400 transition-transform ${
                          expandedFaq === index ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gov-gray-500 leading-relaxed pl-8">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="gov-card p-6 sticky top-6">
              <h3 className="font-semibold text-gov-gray-700 mb-4">温馨提示</h3>
              <div className="space-y-3 text-sm text-gov-gray-500">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gov-green flex-shrink-0 mt-0.5" />
                  <span>请确保填写的信息真实有效</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gov-green flex-shrink-0 mt-0.5" />
                  <span>上传的材料需清晰可辨</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gov-green flex-shrink-0 mt-0.5" />
                  <span>电子签名需本人签署</span>
                </div>
              </div>
              <div className="gov-divider my-4" />
              <button
                onClick={handleApply}
                className="w-full gov-btn-primary py-3 flex items-center justify-center gap-2"
              >
                <PenLine className="w-5 h-5" />
                立即办理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
