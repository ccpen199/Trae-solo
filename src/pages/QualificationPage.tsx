import { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  User,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Eye,
  Star,
  CreditCard,
  Calendar,
  Users,
  HelpCircle,
  Camera,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';

const progressSteps = [
  { id: 1, title: '提交材料', desc: '上传证件与信息' },
  { id: 2, title: '平台审核', desc: '1-3个工作日' },
  { id: 3, title: '审核通过', desc: '可发布岗位' },
];

const industryOptions = [
  '互联网/信息技术',
  '金融/银行/投资',
  '教育/培训/科研',
  '医疗/健康/生物',
  '制造业/工业',
  '消费品/零售',
  '文化传媒/广告',
  '房地产/建筑',
  '其他',
];

const scaleOptions = [
  '少于20人',
  '20-99人',
  '100-499人',
  '500-999人',
  '1000-4999人',
  '5000人以上',
];

const mockAgreements = [
  {
    id: 'a1',
    name: '标准实习协议_v3.2.pdf',
    uploadDate: '2026-05-18',
    size: '285 KB',
    isDefault: true,
    pages: 4,
  },
  {
    id: 'a2',
    name: '技术岗专项协议.pdf',
    uploadDate: '2026-05-20',
    size: '312 KB',
    isDefault: false,
    pages: 5,
  },
  {
    id: 'a3',
    name: '远程实习协议.pdf',
    uploadDate: '2026-06-01',
    size: '198 KB',
    isDefault: false,
    pages: 3,
  },
];

const mockMentors = [
  { id: 1, name: '张明远', position: '高级前端工程师', dept: '前端技术部', phone: '138****5678', avatar: '张' },
  { id: 2, name: '李思涵', position: '资深后端架构师', dept: '平台技术部', phone: '139****2345', avatar: '李' },
  { id: 3, name: '王昊然', position: '产品设计总监', dept: '产品设计部', phone: '137****8901', avatar: '王' },
  { id: 4, name: '陈雨欣', position: '数据分析主管', dept: '数据智能部', phone: '136****4567', avatar: '陈' },
];

const faqs = [
  {
    q: '资质审核需要多长时间？',
    a: '正常情况下，材料齐全的企业在提交后 1-3 个工作日内完成审核。高峰时段可能略有延长，审核进度将实时同步至本页面并通过短信通知。',
  },
  {
    q: '营业执照上传失败怎么办？',
    a: '请确保文件格式为 PDF、JPG 或 PNG，大小不超过 10MB。建议使用原件高清扫描件，避免逆光、反光、模糊或裁剪不全。如仍有问题可联系客服 400-888-0088。',
  },
  {
    q: '审核被驳回需要重新上传所有材料吗？',
    a: '不需要。系统会标明具体驳回原因，仅需针对不合格项补充或修改后重新提交即可，已通过的材料无需重复上传。',
  },
  {
    q: '最多可以上传多少份实习协议模板？',
    a: '每个企业最多可上传 10 份不同的实习协议模板，可随时设置默认模板。建议针对不同岗位类型（如技术类、运营类）准备专属协议。',
  },
  {
    q: '带教人信息需要填什么？',
    a: '需要提供带教人姓名、职位、所属部门和联系电话，以便学生入职后直接联系。每位带教人最多可同时带教 5 名实习生。',
  },
];

export default function QualificationPage() {
  const [currentStep, setCurrentStep] = useState(2);

  const [enterpriseInfo, setEnterpriseInfo] = useState({
    companyName: '橙青科技有限公司',
    licenseNo: '91310115MA1K3XXXX',
    legalPerson: '陈志强',
    establishDate: '2018-06-15',
    industry: '互联网/信息技术',
    scale: '500-999人',
    region: '上海市浦东新区',
    hrName: '王静怡',
    hrPhone: '138****6688',
  });

  const [agreements, setAgreements] = useState(mockAgreements);
  const [mentors, setMentors] = useState(mockMentors);
  const [addMentorOpen, setAddMentorOpen] = useState(false);
  const [newMentor, setNewMentor] = useState({ name: '', position: '', dept: '', phone: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [licenseUploaded, setLicenseUploaded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [scaleDropdownOpen, setScaleDropdownOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const setDefaultAgreement = (id: string) => {
    setAgreements((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const removeAgreement = (id: string) => {
    setAgreements((prev) => prev.filter((a) => a.id !== id));
  };

  const removeMentor = (id: number) => {
    setMentors((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddMentor = () => {
    if (newMentor.name && newMentor.position) {
      setMentors((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...newMentor,
          avatar: newMentor.name.charAt(0),
        },
      ]);
      setNewMentor({ name: '', position: '', dept: '', phone: '' });
      setAddMentorOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50/60 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Card className="mb-6 animate-fade-in-up overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-ink-700 via-ink-800 to-ink-900 px-6 py-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl translate-y-1/3" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand-300" />
                    企业资质认证
                  </h1>
                  <p className="text-sm text-ink-300 mt-1">完成认证后即可发布岗位、获取平台推荐流量</p>
                </div>
                <Badge
                  variant="warn"
                  dot
                  size="sm"
                  className="bg-amber-500/20 text-amber-200 border-amber-400/30"
                >
                  <Clock className="w-3.5 h-3.5" />
                  审核中 · 预计 48小时内完成
                </Badge>
              </div>
            </div>

            <div className="px-4 sm:px-10 py-6 bg-gradient-to-b from-cream-50/50 to-white">
              <div className="flex items-center justify-between">
                {progressSteps.map((step, idx) => {
                  const isDone = currentStep > step.id;
                  const isActive = currentStep === step.id;
                  const isRejected = false;
                  return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isDone
                              ? 'bg-teal-gradient text-white shadow-[0_6px_16px_-4px_rgba(46,196,182,0.5)]'
                              : isActive
                              ? 'bg-brand-gradient text-white shadow-float animate-float'
                              : 'bg-ink-100 text-ink-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : isRejected ? (
                            <AlertCircle className="w-6 h-6 text-danger-500" />
                          ) : (
                            <span className="font-bold">{step.id}</span>
                          )}
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-sm font-semibold ${
                              isActive ? 'text-ink-900' : isDone ? 'text-teal-600' : 'text-ink-400'
                            }`}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-ink-400 mt-0.5">{step.desc}</div>
                        </div>
                      </div>
                      {idx < progressSteps.length - 1 && (
                        <div className="flex-1 mx-3 sm:mx-6 h-1 bg-ink-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isDone ? 'bg-teal-gradient w-full' : 'w-0 bg-brand-gradient'
                            }`}
                          />
                          {isActive && (
                            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-brand-500 to-brand-300 rounded-full animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-500" />
                </div>
                营业执照上传
              </CardTitle>
              <p className="text-sm text-ink-500 mt-1">支持 PDF、JPG、PNG 格式，大小不超过 10MB，上传后将自动 OCR 识别</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    setLicenseUploaded(true);
                  }}
                  onClick={() => setLicenseUploaded(true)}
                  className={`relative cursor-pointer rounded-xl2 border-2 border-dashed p-8 flex flex-col items-center justify-center min-h-[240px] transition-all duration-200 ${
                    isDragging
                      ? 'border-brand-400 bg-brand-50/60 scale-[1.01]'
                      : licenseUploaded
                      ? 'border-teal-300 bg-teal-50/40 hover:bg-teal-50/60'
                      : 'border-ink-200 bg-cream-50/50 hover:border-brand-300 hover:bg-brand-50/40'
                  }`}
                >
                  {licenseUploaded ? (
                    <div className="flex flex-col items-center gap-3 animate-fade-in-up">
                      <div className="w-16 h-16 rounded-2xl bg-teal-gradient flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(46,196,182,0.5)]">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-ink-900">营业执照_副本.pdf</div>
                        <div className="text-xs text-ink-500 mt-0.5">2.4 MB · 已上传</div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="success" dot size="xs">
                          <Sparkles className="w-3 h-3" />
                          OCR 识别成功
                        </Badge>
                      </div>
                      <button className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 mt-2">
                        <Camera className="w-3.5 h-3.5" />
                        重新上传
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-ink-200 flex items-center justify-center shadow-soft">
                        <Upload className="w-8 h-8 text-brand-500" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-ink-900">点击或拖拽文件至此</div>
                        <div className="text-xs text-ink-500 mt-1">支持 PDF / JPG / PNG 格式</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-cream-50 to-white rounded-xl2 border border-ink-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-semibold text-ink-900">OCR 自动识别信息</span>
                    <Badge variant="success" size="xs">已回填</Badge>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-ink-500 block mb-1">统一社会信用代码</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-ink-100">
                        <CreditCard className="w-4 h-4 text-ink-400" />
                        <span className="text-sm font-medium text-ink-800 font-num tracking-wide">
                          {enterpriseInfo.licenseNo}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ink-500 block mb-1">法定代表人</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-ink-100">
                        <User className="w-4 h-4 text-ink-400" />
                        <span className="text-sm font-medium text-ink-800">{enterpriseInfo.legalPerson}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-ink-500 block mb-1">成立日期</label>
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-ink-100">
                        <Calendar className="w-4 h-4 text-ink-400" />
                        <span className="text-sm font-medium text-ink-800 font-num">
                          {enterpriseInfo.establishDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-teal-500" />
                </div>
                企业基本信息
              </CardTitle>
              <p className="text-sm text-ink-500 mt-1">请确保信息与营业执照一致，审核通过后修改需重新认证</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="企业全称"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  value={enterpriseInfo.companyName}
                  onChange={(e) => setEnterpriseInfo({ ...enterpriseInfo, companyName: e.target.value })}
                />

                <div className="relative">
                  <label className="text-sm font-medium text-ink-700 ml-0.5 block mb-1.5">
                    所属行业
                  </label>
                  <button
                    onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
                    className="w-full h-11 px-3.5 bg-white border border-ink-200 rounded-xl2 flex items-center justify-between text-sm text-ink-800 hover:border-ink-300 focus-within:border-brand-400 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-ink-400" />
                      {enterpriseInfo.industry}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${industryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {industryDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 p-2 bg-white border border-ink-200 rounded-xl2 shadow-card animate-scale-in">
                      {industryOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setEnterpriseInfo({ ...enterpriseInfo, industry: opt });
                            setIndustryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            enterpriseInfo.industry === opt
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-ink-700 hover:bg-cream-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-ink-700 ml-0.5 block mb-1.5">
                    人员规模
                  </label>
                  <button
                    onClick={() => setScaleDropdownOpen(!scaleDropdownOpen)}
                    className="w-full h-11 px-3.5 bg-white border border-ink-200 rounded-xl2 flex items-center justify-between text-sm text-ink-800 hover:border-ink-300 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-ink-400" />
                      {enterpriseInfo.scale}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform ${scaleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {scaleDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 p-2 bg-white border border-ink-200 rounded-xl2 shadow-card animate-scale-in">
                      {scaleOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setEnterpriseInfo({ ...enterpriseInfo, scale: opt });
                            setScaleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            enterpriseInfo.scale === opt
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-ink-700 hover:bg-cream-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  label="所在地区"
                  leftIcon={<MapPin className="w-4 h-4" />}
                  value={enterpriseInfo.region}
                  onChange={(e) => setEnterpriseInfo({ ...enterpriseInfo, region: e.target.value })}
                />

                <Input
                  label="HR 联系人姓名"
                  leftIcon={<User className="w-4 h-4" />}
                  value={enterpriseInfo.hrName}
                  onChange={(e) => setEnterpriseInfo({ ...enterpriseInfo, hrName: e.target.value })}
                />

                <Input
                  label="HR 联系电话"
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={enterpriseInfo.hrPhone}
                  onChange={(e) => setEnterpriseInfo({ ...enterpriseInfo, hrPhone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-sky-500" />
                  </div>
                  实习协议模板
                </CardTitle>
                <p className="text-sm text-ink-500 mt-1">可上传多份模板，录用学生时可选择对应协议发送</p>
              </div>
              <Badge variant="info" size="sm">{agreements.length}/10</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agreements.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group relative rounded-xl2 border border-ink-200 bg-white overflow-hidden hover:shadow-card hover:border-brand-200 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-sky-50 via-white to-cream-50 relative flex items-center justify-center border-b border-ink-100">
                      <div className="w-16 h-20 bg-white rounded-md shadow-card border border-ink-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-4 bg-brand-500/90" />
                        <div className="absolute top-6 left-3 right-3 space-y-1.5">
                          <div className="h-1 bg-ink-200 rounded-full w-full" />
                          <div className="h-1 bg-ink-200 rounded-full w-4/5" />
                          <div className="h-1 bg-ink-200 rounded-full w-full" />
                          <div className="h-1 bg-ink-200 rounded-full w-3/4" />
                          <div className="h-1 bg-ink-200 rounded-full w-5/6" />
                        </div>
                      </div>
                      {tpl.isDefault && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="brand" size="xs">
                            <Star className="w-3 h-3" />
                            默认
                          </Badge>
                        </div>
                      )}
                      <button className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/80 backdrop-blur border border-ink-200 flex items-center justify-center text-ink-500 hover:text-brand-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3.5">
                      <div className="text-sm font-semibold text-ink-900 truncate">{tpl.name}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-ink-500">
                          {tpl.uploadDate} · {tpl.pages}页
                        </span>
                        <span className="text-xs text-ink-500">{tpl.size}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!tpl.isDefault && (
                          <button
                            onClick={() => setDefaultAgreement(tpl.id)}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                          >
                            设为默认
                          </button>
                        )}
                        <button
                          onClick={() => removeAgreement(tpl.id)}
                          className="w-8 h-7 rounded-lg text-ink-500 hover:text-danger-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button className="aspect-auto rounded-xl2 border-2 border-dashed border-ink-200 hover:border-brand-300 hover:bg-brand-50/40 flex flex-col items-center justify-center min-h-[200px] transition-all duration-200 text-ink-500 hover:text-brand-600">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-ink-200 flex items-center justify-center shadow-soft mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">上传新模板</span>
                  <span className="text-xs text-ink-400 mt-0.5">PDF 格式</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  带教人管理
                </CardTitle>
                <p className="text-sm text-ink-500 mt-1">已录入 {mentors.length} 位带教人，供岗位发布时绑定</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setAddMentorOpen(true)}>
                <Plus className="w-4 h-4" />
                新增带教人
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="group p-4 rounded-xl2 border border-ink-200 bg-white hover:shadow-card hover:border-teal-200 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center text-white font-bold shadow-soft shrink-0">
                        {mentor.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-ink-900 text-sm">{mentor.name}</div>
                          <button
                            onClick={() => removeMentor(mentor.id)}
                            className="w-7 h-7 rounded-lg text-ink-400 hover:text-danger-600 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-teal-700 font-medium mt-0.5 bg-teal-50 inline-block px-2 py-0.5 rounded-md">
                          {mentor.position}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-ink-500 mt-2">
                          <Building2 className="w-3 h-3" />
                          {mentor.dept}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-ink-500 mt-1">
                          <Phone className="w-3 h-3" />
                          {mentor.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-ink-700 via-ink-800 to-ink-900 relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-52 h-52 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="font-semibold text-white">信息填写完成度 92%</div>
                <div className="text-sm text-ink-300 mt-0.5">
                  提交后 1-3 个工作日完成审核，审核期间不可修改信息
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="relative z-10"
              onClick={() => setShowSuccess(true)}
            >
              <Upload className="w-4.5 h-4.5" />
              提交审核
            </Button>
          </div>

          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-ink-600" />
                </div>
                常见问题
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-ink-100 -mx-5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="px-5">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full py-4 flex items-center justify-between gap-4 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">
                          Q
                        </span>
                        <span className="font-medium text-ink-900 text-sm">{faq.q}</span>
                      </div>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4.5 h-4.5 text-ink-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4.5 h-4.5 text-ink-400 flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === idx && (
                      <div className="pb-5 pl-9 animate-fade-in-up">
                        <div className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-teal-50 text-teal-600 text-xs font-bold flex items-center justify-center">
                            A
                          </span>
                          <p className="text-sm text-ink-600 leading-relaxed pt-0.5">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={addMentorOpen}
        onClose={() => setAddMentorOpen(false)}
        title="新增带教人"
        description="录入带教人信息，供岗位发布时绑定"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddMentorOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddMentor}>
              确认添加
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Input
            label="带教人姓名"
            placeholder="请输入姓名"
            leftIcon={<User className="w-4 h-4" />}
            value={newMentor.name}
            onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
          />
          <Input
            label="职位"
            placeholder="例：高级前端工程师"
            leftIcon={<Briefcase className="w-4 h-4" />}
            value={newMentor.position}
            onChange={(e) => setNewMentor({ ...newMentor, position: e.target.value })}
          />
          <Input
            label="所属部门"
            placeholder="例：前端技术部"
            leftIcon={<Building2 className="w-4 h-4" />}
            value={newMentor.dept}
            onChange={(e) => setNewMentor({ ...newMentor, dept: e.target.value })}
          />
          <Input
            label="联系电话"
            placeholder="请输入手机号"
            leftIcon={<Phone className="w-4 h-4" />}
            value={newMentor.phone}
            onChange={(e) => setNewMentor({ ...newMentor, phone: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="提交成功！"
        description="您的资质材料已提交，将在 1-3 个工作日内完成审核"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setShowSuccess(false)}>
            知道了
          </Button>
        }
      >
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center shadow-float mb-4 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="text-lg font-bold text-ink-900 mb-1">等待平台审核</div>
          <div className="text-sm text-ink-500 text-center">
            审核结果将通过短信通知您，请注意查收
          </div>
          <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-amber-700">
              预计完成时间：2026年6月14日前
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
