import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Steps, Form, Input, Select, DatePicker, Upload, Modal, message } from 'antd';
import { ArrowLeft, Upload as UploadIcon, Camera, CreditCard, CheckCircle, AlertCircle, RotateCcw, Send, PenLine, FileText } from 'lucide-react';
import type { UploadProps } from 'antd';
import { mockServices, mockUser, mockCertificates } from '../mock/data';
import { useAuthStore } from '../store/authStore';
import type { UploadedMaterial } from '../shared/types';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

const steps = [
  { title: '填写信息' },
  { title: '上传材料' },
  { title: '电子签名' },
  { title: '提交完成' },
];

export default function ServiceApply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const currentUser = user || mockUser;

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedMaterials, setUploadedMaterials] = useState<Record<string, UploadedMaterial>>({});
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const service = mockServices.find(s => s.id === id);

  useEffect(() => {
    if (service && currentUser) {
      const initialValues: Record<string, any> = {};
      service.formFields.forEach(field => {
        if (field.prefillSource === 'id_card') {
          if (field.name === 'name') {
            initialValues[field.name] = currentUser.name;
          } else if (field.name === 'idCard') {
            initialValues[field.name] = currentUser.idCard;
          }
        }
        if (field.name === 'phone') {
          initialValues[field.name] = currentUser.phone;
        }
      });
      form.setFieldsValue(initialValues);
    }
  }, [service, currentUser, form]);

  useEffect(() => {
    if (currentStep === 2 && canvasRef.current && canvasContainerRef.current) {
      const canvas = canvasRef.current;
      const container = canvasContainerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
      }
    }
  }, [currentStep]);

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

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields();
        setCurrentStep(1);
      } catch {
        message.error('请填写完整的申请信息');
      }
    } else if (currentStep === 1) {
      const allRequired = service.requiredMaterials.filter(m => m.required);
      const allUploaded = allRequired.every(m => uploadedMaterials[m.id]);
      if (!allUploaded) {
        message.error('请上传所有必填材料');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!signatureData) {
        message.error('请完成电子签名');
        return;
      }
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setCurrentStep(3);
    message.success('申请提交成功！');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
      }
    }
    setSignatureData(null);
  };

  const openCertModal = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setShowCertModal(true);
  };

  const handleUseCert = (certId: string) => {
    if (!selectedMaterialId) return;
    const cert = mockCertificates.find(c => c.id === certId);
    const material = service.requiredMaterials.find(m => m.id === selectedMaterialId);
    if (cert && material) {
      setUploadedMaterials(prev => ({
        ...prev,
        [selectedMaterialId]: {
          id: `um_${Date.now()}`,
          materialId: selectedMaterialId,
          name: material.name,
          type: 'electronic',
          url: cert.imageUrl,
          verified: true,
        },
      }));
      message.success(`已调用电子证照：${cert.name}`);
    }
    setShowCertModal(false);
    setSelectedMaterialId(null);
  };

  const handleOcr = (materialId: string) => {
    const material = service.requiredMaterials.find(m => m.id === materialId);
    if (material) {
      setUploadedMaterials(prev => ({
        ...prev,
        [materialId]: {
          id: `um_${Date.now()}`,
          materialId,
          name: material.name,
          type: 'ocr',
          url: '',
          ocrResult: { name: currentUser.name, idCard: currentUser.idCard },
          verified: true,
        },
      }));
      message.success('OCR识别成功，信息已自动填充');
      if (material.type === 'id_card') {
        form.setFieldsValue({
          name: currentUser.name,
          idCard: currentUser.idCard,
        });
      }
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: () => {
      return false;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      }
    },
  };

  const handleFileUpload = (materialId: string, file: File) => {
    const material = service.requiredMaterials.find(m => m.id === materialId);
    if (material) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedMaterials(prev => ({
          ...prev,
          [materialId]: {
            id: `um_${Date.now()}`,
            materialId,
            name: material.name,
            type: 'upload',
            url: e.target?.result as string,
            verified: false,
          },
        }));
        message.success(`${material.name} 上传成功`);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderFormField = () => {
    return service.formFields.map(field => {
      const formItemProps = {
        name: field.name,
        label: field.label,
        rules: field.required ? [{ required: true, message: `请输入${field.label}` }] : [],
      };

      switch (field.type) {
        case 'textarea':
          return (
            <Form.Item key={field.id} {...formItemProps}>
              <TextArea rows={3} placeholder={`请输入${field.label}`} />
            </Form.Item>
          );
        case 'select':
          return (
            <Form.Item key={field.id} {...formItemProps}>
              <Select placeholder={`请选择${field.label}`}>
                {field.options?.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          );
        case 'date':
          return (
            <Form.Item key={field.id} {...formItemProps}>
              <DatePicker className="w-full" placeholder={`请选择${field.label}`} />
            </Form.Item>
          );
        case 'number':
          return (
            <Form.Item key={field.id} {...formItemProps}>
              <Input type="number" placeholder={`请输入${field.label}`} />
            </Form.Item>
          );
        default:
          return (
            <Form.Item key={field.id} {...formItemProps}>
              <Input placeholder={`请输入${field.label}`} />
            </Form.Item>
          );
      }
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="gov-card p-6">
            <h2 className="text-lg font-semibold text-gov-gray-700 mb-6">填写申请信息</h2>
            <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary-700">系统已自动填充您的个人信息</p>
                  <p className="text-xs text-primary-500 mt-1">
                    姓名：{currentUser.name} | 身份证号：{currentUser.idCard} | 手机号：{currentUser.phone}
                  </p>
                </div>
              </div>
            </div>
            <Form form={form} layout="vertical">
              {renderFormField()}
            </Form>
          </div>
        );
      case 1:
        return (
          <div className="gov-card p-6">
            <h2 className="text-lg font-semibold text-gov-gray-700 mb-6">上传办理材料</h2>
            {service.requiredMaterials.length > 0 ? (
              <div className="space-y-4">
                {service.requiredMaterials.map(material => {
                  const uploaded = uploadedMaterials[material.id];
                  return (
                    <div key={material.id} className="border border-gov-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gov-gray-700">{material.name}</span>
                            {material.required && (
                              <span className="text-xs text-gov-red">*必填</span>
                            )}
                          </div>
                          <p className="text-sm text-gov-gray-400">{material.description}</p>
                        </div>
                        {uploaded && (
                          <span className="flex items-center gap-1 text-sm text-gov-green">
                            <CheckCircle className="w-4 h-4" />
                            {uploaded.type === 'ocr' ? 'OCR识别' : uploaded.type === 'electronic' ? '电子证照' : '已上传'}
                          </span>
                        )}
                      </div>
                      {!uploaded ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleOcr(material.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-gov-gray-200 rounded-lg text-sm text-gov-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            OCR识别
                          </button>
                          <Upload
                            {...uploadProps}
                            customRequest={({ file }) => {
                              handleFileUpload(material.id, file as File);
                            }}
                            showUploadList={false}
                          >
                            <button className="flex items-center gap-2 px-4 py-2 border border-gov-gray-200 rounded-lg text-sm text-gov-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors">
                              <UploadIcon className="w-4 h-4" />
                              本地上传
                            </button>
                          </Upload>
                          {material.isElectronic && (
                            <button
                              onClick={() => openCertModal(material.id)}
                              className="flex items-center gap-2 px-4 py-2 border border-primary-200 bg-primary-50 rounded-lg text-sm text-primary-600 hover:bg-primary-100 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                              调用电子证照
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          {uploaded.url && (
                            <div className="w-20 h-20 bg-gov-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              <img src={uploaded.url} alt={material.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gov-gray-600">
                              {uploaded.type === 'ocr' ? 'OCR识别成功' : uploaded.type === 'electronic' ? '电子证照已调用' : '文件已上传'}
                            </p>
                            {uploaded.ocrResult && (
                              <p className="text-xs text-gov-gray-400 mt-1">
                                识别信息：{Object.entries(uploaded.ocrResult).map(([k, v]) => `${k}: ${v}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newMaterials = { ...uploadedMaterials };
                              delete newMaterials[material.id];
                              setUploadedMaterials(newMaterials);
                            }}
                            className="text-sm text-gov-red hover:underline"
                          >
                            重新上传
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gov-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gov-green" />
                <p>该事项无需提交材料</p>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="gov-card p-6">
            <h2 className="text-lg font-semibold text-gov-gray-700 mb-6">电子签名</h2>
            <div className="mb-6 p-4 bg-gov-orange-50 rounded-xl border border-gov-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gov-orange flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gov-orange">请确认以下信息后签署您的姓名</p>
                  <p className="text-xs text-gov-orange/70 mt-1">
                    本人确认所提交的信息真实有效，同意授权相关部门核查本人信息，并承担相应的法律责任。
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gov-gray-600 mb-2">申请人：{currentUser.name}</p>
              <p className="text-sm text-gov-gray-600">身份证号：{currentUser.idCard}</p>
            </div>
            <div ref={canvasContainerRef} className="border-2 border-dashed border-gov-gray-300 rounded-xl bg-white">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full rounded-xl cursor-crosshair"
              />
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gov-gray-400">请在上方签名区域手写您的姓名</p>
              <button
                onClick={handleClearSignature}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gov-gray-500 hover:text-gov-red transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                清除重签
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="gov-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gov-green/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gov-green" />
            </div>
            <h2 className="text-2xl font-bold text-gov-gray-700 mb-2">提交成功</h2>
            <p className="text-gov-gray-400 mb-6">您的申请已成功提交，我们将尽快为您办理</p>
            <div className="max-w-md mx-auto bg-gov-gray-50 rounded-xl p-6 mb-8 text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gov-gray-500">申请编号</span>
                  <span className="text-gov-gray-700 font-medium">APP{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gov-gray-500">申请事项</span>
                  <span className="text-gov-gray-700 font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gov-gray-500">申请人</span>
                  <span className="text-gov-gray-700 font-medium">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gov-gray-500">预计办理时间</span>
                  <span className="text-gov-gray-700 font-medium">{service.handlingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gov-gray-500">提交时间</span>
                  <span className="text-gov-gray-700 font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/services')}
                className="px-6 py-3 border border-gov-gray-200 rounded-xl text-gov-gray-600 hover:bg-gov-gray-50 transition-colors"
              >
                返回事项列表
              </button>
              <button
                onClick={() => navigate('/my-applications')}
                className="gov-btn-primary px-6 py-3 flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                查看办件进度
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gov-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/services/${service.id}`)}
          className="flex items-center gap-2 text-gov-gray-500 hover:text-primary-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回详情页</span>
        </button>

        <div className="gov-card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gov-gray-700">{service.name}</h1>
              <p className="text-sm text-gov-gray-400">{service.department}</p>
            </div>
          </div>
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Step key={index} title={step.title} />
            ))}
          </Steps>
        </div>

        {renderStepContent()}

        {currentStep < 3 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 border border-gov-gray-200 rounded-xl text-gov-gray-600 hover:bg-gov-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一步
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="gov-btn-primary px-8 py-3 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : currentStep === 2 ? (
                <>
                  <Send className="w-5 h-5" />
                  提交申请
                </>
              ) : (
                <>
                  <PenLine className="w-5 h-5" />
                  下一步
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <Modal
        title="选择电子证照"
        open={showCertModal}
        onCancel={() => setShowCertModal(false)}
        footer={null}
        width={500}
      >
        <div className="space-y-3">
          {mockCertificates.filter(c => c.isValid).map(cert => (
            <div
              key={cert.id}
              onClick={() => handleUseCert(cert.id)}
              className="flex items-center justify-between p-4 border border-gov-gray-200 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium text-gov-gray-700">{cert.name}</p>
                  <p className="text-xs text-gov-gray-400">
                    证号：{cert.certificateNumber.slice(0, 6)}****{cert.certificateNumber.slice(-4)}
                  </p>
                </div>
              </div>
              <span className="gov-badge-success">有效</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
