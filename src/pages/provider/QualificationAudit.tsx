import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  CheckCircle2, Clock, Upload, X, FileText, Shield, Building2,
  ChevronDown, ChevronUp, ChevronRight, HelpCircle, AlertCircle, Eye,
  Camera, FileCheck, ScanLine, Award, Star, MapPin,
} from 'lucide-react';
import { Collapse, Progress, Table, Avatar, Rate, Tag } from 'antd';

const steps = [
  { id: 1, name: '提交申请', status: 'completed' },
  { id: 2, name: '营业执照', status: 'completed' },
  { id: 3, name: '资质证书', status: 'processing' },
  { id: 4, name: '工地报告', status: 'pending' },
  { id: 5, name: '综合审核', status: 'pending' },
];

const statusIconMap: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4" />,
  processing: <Clock className="w-4 h-4 animate-pulse" />,
  pending: <span className="w-2 h-2 rounded-full bg-ivory-400" />,
};

const historicalProjects = [
  {
    key: '1',
    name: '阳光花园3栋全屋整装',
    address: '阳光花园·3栋·2301',
    area: 128,
    duration: '75天',
    score: 4.9,
    review: '施工工艺精湛，团队专业负责，工期把控精准，最终效果超出预期...',
    owner: '张女士',
    images: 48,
  },
  {
    key: '2',
    name: '滨江壹号大平层装修',
    address: '滨江壹号·5栋·1202',
    area: 186,
    duration: '120天',
    score: 4.8,
    review: '设计方案很有创意，材料选择环保，现场管理规范，监理态度很好...',
    owner: '王先生',
    images: 72,
  },
  {
    key: '3',
    name: '绿城春江月三居室',
    address: '绿城春江月·7栋·803',
    area: 105,
    duration: '65天',
    score: 4.7,
    review: '整体体验不错，项目经理跟进及时，问题响应快，性价比很高...',
    owner: '李先生',
    images: 36,
  },
  {
    key: '4',
    name: '万科城六期精装修',
    address: '万科城六期·2栋·1501',
    area: 89,
    duration: '45天',
    score: 5.0,
    review: '完美的装修体验！从设计到施工每一步都很满意，强烈推荐给大家！',
    owner: '赵女士',
    images: 56,
  },
];

const faqItems = [
  {
    key: '1',
    label: '审核需要多长时间？',
    children: (
      <p className="text-sm text-carbon-600 leading-relaxed">
        完整的资质审核通常需要3-5个工作日。营业执照和资质证书的OCR识别一般在24小时内完成，工地报告和综合审核视材料完整性可能需要额外时间。您可以随时在此页面查看最新进度。
      </p>
    ),
  },
  {
    key: '2',
    label: '哪些资质证书是必须的？',
    children: (
      <div className="text-sm text-carbon-600 leading-relaxed space-y-2">
        <p>平台要求服务商必须具备以下证书：</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>营业执照（经营范围包含建筑装饰或装修工程）</li>
          <li>建筑业企业资质证书（二级及以上）</li>
          <li>安全生产许可证</li>
          <li>至少5个已完成项目的巡检报告</li>
        </ul>
      </div>
    ),
  },
  {
    key: '3',
    label: '上传的照片有什么要求？',
    children: (
      <p className="text-sm text-carbon-600 leading-relaxed">
        工地巡检报告照片要求清晰可辨，每张照片大小不超过10MB，支持JPG/PNG格式。建议包含：施工前现场、各阶段施工过程、隐蔽工程验收、完工全景等。照片需带有时间水印更佳。
      </p>
    ),
  },
  {
    key: '4',
    label: '审核不通过怎么办？',
    children: (
      <p className="text-sm text-carbon-600 leading-relaxed">
        如果审核不通过，我们会通过站内信和短信通知您具体原因。您可以根据反馈修改材料后重新提交。对于资质证书类的驳回，建议您仔细核对证书编号、有效期等信息是否正确。
      </p>
    ),
  },
  {
    key: '5',
    label: '如何提升审核评分？',
    children: (
      <div className="text-sm text-carbon-600 leading-relaxed space-y-2">
        <p>以下几个方面可以显著提升综合审核评分：</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>提供更多高质量的历史项目案例（带业主评价更佳）</li>
          <li>上传完整的工地巡检照片集（建议每个项目20+张）</li>
          <li>补充ISO认证、绿色建筑等额外资质</li>
          <li>提供过往业主的推荐信或第三方监理报告</li>
        </ul>
      </div>
    ),
  },
];

const LicenseUploadCard = () => (
  <div className="card-base p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-medium text-carbon-800">营业执照</h4>
          <span className="badge-success mt-0.5 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 已通过OCR
          </span>
        </div>
      </div>
      <button className="text-sm text-haze-600 hover:text-haze-700 flex items-center gap-1">
        <Eye className="w-4 h-4" /> 预览
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-ivory-100 to-ivory-200 border-2 border-dashed border-ivory-300 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
          <FileText className="w-8 h-8 text-ivory-500" />
        </div>
        <span className="text-xs text-ivory-600">营业执照.jpg</span>
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="bg-emerald-50/60 rounded-xl border border-emerald-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 mb-1">
          <ScanLine className="w-4 h-4" />
          OCR识别结果
        </div>
        {[
          { label: '公司名称', value: '锦绣家居装饰工程有限公司', verified: true },
          { label: '统一信用代码', value: '91330100MA2XXXXXX', verified: true },
          { label: '法人代表', value: '陈建华', verified: true },
          { label: '注册资本', value: '500万元人民币', verified: true },
          { label: '成立日期', value: '2016-08-15', verified: true },
        ].map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-2">
            <span className="text-xs text-ivory-600 flex-shrink-0 w-20">{item.label}</span>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-xs text-carbon-700 font-mono truncate">{item.value}</span>
              {item.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-ivory-200">
      <button className="btn-secondary text-sm w-full justify-center">
        <Upload className="w-4 h-4" />
        重新上传
      </button>
    </div>
  </div>
);

const QualificationCard = () => {
  const [progress, setProgress] = useState(0);
  const [showOCR, setShowOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setShowOCR(true);
          return 100;
        }
        return p + 3;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showOCR) return;
    const timer = setInterval(() => {
      setOcrProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [showOCR]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-haze-50 border border-haze-200 flex items-center justify-center">
            <Award className="w-5 h-5 text-haze-600" />
          </div>
          <div>
            <h4 className="font-medium text-carbon-800">建筑业企业资质证书</h4>
            <span className="badge-haze mt-0.5 inline-flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse" /> OCR识别中
            </span>
          </div>
        </div>
      </div>

      {progress < 100 ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-haze-400 bg-haze-50/60 scale-[1.01]'
              : 'border-ivory-300 bg-ivory-50/40 hover:border-haze-300 hover:bg-haze-50/30'
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
            className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-sm border border-ivory-200 flex items-center justify-center mb-3"
          >
            <Upload className="w-7 h-7 text-haze-500" />
          </motion.div>
          <p className="text-sm font-medium text-carbon-700 mb-1">
            {isDragActive ? '释放文件以上传' : '点击或拖拽证书图片到此'}
          </p>
          <p className="text-xs text-ivory-600">支持 JPG/PNG 格式，建议 2MB 以上</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-ivory-100 to-ivory-200 border border-ivory-300">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                <FileCheck className="w-8 h-8 text-haze-500" />
              </div>
              <span className="text-xs text-ivory-600">资质证书.jpg</span>
            </div>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-16 bg-gradient-to-b from-haze-400/0 via-haze-400/30 to-haze-400/0"
              />
            </div>
            <div className="absolute top-3 left-3 right-3">
              <Progress percent={progress} size="small" strokeColor="#6B8E9F" showInfo={false} />
            </div>
          </div>

          <AnimatePresence>
            {showOCR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-haze-50/60 rounded-xl border border-haze-200 p-4 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-haze-700">
                    <ScanLine className="w-4 h-4" />
                    OCR识别中...
                  </div>
                  <span className="font-mono text-xs text-haze-600">{ocrProgress}%</span>
                </div>
                <Progress percent={ocrProgress} size="small" strokeColor="#6B8E9F" showInfo={false} className="mb-4" />
                <div className="space-y-2.5" style={{ filter: `blur(${(100 - ocrProgress) / 20}px)`, transition: 'filter 0.3s' }}>
                  {[
                    { label: '资质等级', value: '一级（建筑装修装饰工程专业承包）' },
                    { label: '证书编号', value: 'D2330XXXXXX' },
                    { label: '有效期至', value: '2028-12-31' },
                    { label: '发证机关', value: '浙江省住房和城乡建设厅' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-ivory-600 flex-shrink-0 w-20">{item.label}</span>
                      <span className="text-xs text-carbon-700 font-mono text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const SafetyLicenseCard = () => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-carbon-800">安全生产许可证</h4>
            <span className="badge-warning mt-0.5 inline-flex items-center gap-1">
              <Upload className="w-3 h-3" /> 待上传
            </span>
          </div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-amber-400 bg-amber-50/60 scale-[1.01]'
            : 'border-ivory-300 bg-ivory-50/40 hover:border-amber-300 hover:bg-amber-50/30'
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
          whileHover={{ y: -2 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-4 shadow-sm border border-amber-300/50"
        >
          <Camera className="w-8 h-8 text-amber-600" />
        </motion.div>
        <p className="text-sm font-medium text-carbon-700 mb-1">
          上传安全生产许可证
        </p>
        <p className="text-xs text-ivory-600 mb-4">请确保证书在有效期内，字迹清晰可辨</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100/80 text-amber-700 text-xs border border-amber-200/60">
          <AlertCircle className="w-3.5 h-3.5" />
          此为必填项，缺失将无法通过审核
        </div>
      </div>
    </div>
  );
};

const InspectionReportsCard = () => {
  const [uploaded, setUploaded] = useState([
    { id: 1, name: '阳光花园_水电验收.jpg' },
    { id: 2, name: '滨江壹号_泥瓦阶段.jpg' },
  ]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 5,
  });

  const removeImage = (id: number) => {
    setUploaded((prev) => prev.filter((img) => img.id !== id));
  };

  const slots = 5;
  const remaining = slots - uploaded.length;

  return (
    <div className="card-base p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-terracotta-600" />
          </div>
          <div>
            <h4 className="font-medium text-carbon-800">工地巡检报告</h4>
            <span className="badge-terracotta mt-0.5 inline-flex">
              {uploaded.length} / 5 已上传
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        {uploaded.map((img, idx) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08 }}
            className="aspect-square rounded-xl bg-gradient-to-br from-wood-100 via-wood-50 to-ivory-100 border border-wood-200/60 relative overflow-hidden group"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-wood-500" />
              </div>
              <p className="text-[10px] text-carbon-600 text-center leading-tight truncate w-full px-1">
                {img.name.replace(/\.[^.]+$/, '')}
              </p>
            </div>
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
        {Array.from({ length: remaining }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            {...getRootProps()}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-terracotta-400 bg-terracotta-50/50'
                : 'border-ivory-300 bg-ivory-50/40 hover:border-terracotta-300 hover:bg-terracotta-50/30'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-5 h-5 text-ivory-400" />
            <span className="text-[10px] text-ivory-500">添加</span>
          </div>
        ))}
      </div>

      <Progress percent={(uploaded.length / slots) * 100} size="small" strokeColor="#C4623A" showInfo={false} className="mb-3" />

      <div className="flex items-center justify-between pt-3 border-t border-ivory-200">
        <p className="text-xs text-ivory-600">建议上传不同施工阶段的现场照片</p>
        <a href="#" className="text-xs text-haze-600 hover:text-haze-700 flex items-center gap-1 font-medium">
          历史项目交付评价 <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

const QualificationAudit = () => {
  const activeStep = steps.findIndex((s) => s.status === 'processing');

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: typeof historicalProjects[0]) => (
        <div>
          <p className="font-medium text-carbon-800 text-sm">{record.name}</p>
          <p className="text-xs text-ivory-600 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {record.address}
          </p>
        </div>
      ),
    },
    {
      title: '面积/工期',
      key: 'info',
      render: (_: unknown, record: typeof historicalProjects[0]) => (
        <div className="text-sm text-carbon-700">
          <p className="font-mono">{record.area}㎡</p>
          <p className="text-xs text-ivory-600 mt-0.5">{record.duration}</p>
        </div>
      ),
    },
    {
      title: '交付评分',
      key: 'score',
      render: (_: unknown, record: typeof historicalProjects[0]) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-carbon-800">{record.score}</span>
            <Rate disabled allowHalf defaultValue={record.score} className="!text-xs [&_.ant-rate-star]:!margin-r-0.5" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Avatar size={16} className="!bg-terracotta-400 !text-white !text-[10px]">
              {record.owner[0]}
            </Avatar>
            <span className="text-xs text-ivory-600">{record.owner}</span>
            <span className="text-xs text-ivory-400">·</span>
            <span className="text-xs text-ivory-600">{record.images}张图</span>
          </div>
        </div>
      ),
    },
    {
      title: '业主评价',
      dataIndex: 'review',
      key: 'review',
      render: (text: string) => (
        <p className="text-sm text-carbon-600 line-clamp-2 max-w-xs">{text}</p>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="section-title">服务商准入审核</h1>
        <p className="text-ivory-600">完成以下步骤即可入驻平台，获取业主订单推荐</p>
      </div>

      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-lg text-carbon-800">审核进度</h3>
            <Tag
              color="processing"
              className="!m-0 !rounded-full !px-3 !py-1 !text-xs !font-medium"
              style={{ borderColor: 'transparent', background: 'linear-gradient(135deg, rgba(200,170,110,0.15), rgba(107,142,159,0.15))', color: '#54707F' }}
            >
              审核中 · 预计3-5工作日
            </Tag>
          </div>
          <div className="text-right">
            <p className="text-xs text-ivory-600">提交时间</p>
            <p className="font-mono text-sm text-carbon-700">2024-05-20 14:32</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-ivory-200 rounded-full mx-10" />
          <div
            className="absolute top-6 left-0 h-1 rounded-full bg-gradient-to-r from-wood-400 via-haze-400 to-terracotta-400 transition-all duration-700 mx-10"
            style={{ width: `calc(${(activeStep / (steps.length - 1)) * 100}% - 80px * ${1 - activeStep / (steps.length - 1)})` }}
          />
          <div className="grid grid-cols-5 relative z-10">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'processing';
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-300 text-white shadow-md shadow-emerald-500/25'
                        : isActive
                        ? 'bg-gradient-to-br from-haze-400 to-haze-500 border-haze-300 text-white shadow-md shadow-haze-500/25 animate-pulse-slow'
                        : 'bg-white border-ivory-300 text-ivory-400'
                    }`}
                  >
                    {isCompleted || isActive ? statusIconMap[step.status] : <span className="font-mono font-semibold">{step.id}</span>}
                  </div>
                  <p className={`mt-3 text-sm font-medium ${
                    isCompleted || isActive ? 'text-carbon-800' : 'text-ivory-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isCompleted ? 'text-emerald-600'
                    : isActive ? 'text-haze-600'
                    : 'text-ivory-400'
                  }`}>
                    {isCompleted ? '已通过' : isActive ? '审核中' : '待上传'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LicenseUploadCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <QualificationCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SafetyLicenseCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <InspectionReportsCard />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-4"
        >
          <div className="card-base p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-carbon-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-wood-500" />
                历史项目交付评价
              </h3>
              <span className="text-xs text-ivory-600">共 {historicalProjects.length} 个项目</span>
            </div>
            <div className="overflow-x-auto -mx-2">
              <Table
                columns={columns}
                dataSource={historicalProjects}
                pagination={false}
                size="middle"
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="py-4 px-2 bg-ivory-50/60 rounded-xl my-2">
                      <div className="flex items-start gap-3">
                        <Avatar size={40} className="!bg-terracotta-400 !text-white">
                          {record.owner[0]}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-carbon-800">{record.owner}</span>
                            <Rate disabled allowHalf defaultValue={record.score} className="!text-xs" />
                            <span className="font-mono text-sm font-semibold text-carbon-700">{record.score}分</span>
                          </div>
                          <p className="text-sm text-carbon-600 leading-relaxed">{record.review}</p>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            <Tag color="green">准时交付</Tag>
                            <Tag color="blue">工艺优良</Tag>
                            <Tag color="orange">服务到位</Tag>
                            <Tag>性价比高</Tag>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                  expandIcon: ({ expanded, onExpand, record }) => (
                    <button
                      onClick={(e) => onExpand(record, e)}
                      className="p-1 hover:bg-ivory-200 rounded-md transition-colors"
                    >
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-ivory-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-ivory-600" />
                      )}
                    </button>
                  ),
                }}
                className="!border-0"
                rowClassName={() => '!border-b !border-ivory-200/70 hover:!bg-ivory-50/40 transition-colors'}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-12 lg:col-span-3 space-y-5"
        >
          <div className="card-base p-5 bg-gradient-to-br from-wood-50/60 to-haze-50/40">
            <h3 className="font-serif text-lg text-carbon-800 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-wood-600" />
              审核标准说明
            </h3>
            <div className="space-y-4">
              {[
                {
                  num: '01',
                  title: '资质真实性核验',
                  desc: '所有上传证书将通过官方数据库进行交叉验证，确保证书真实有效且在有效期内。',
                },
                {
                  num: '02',
                  title: '历史项目评估',
                  desc: '系统综合分析历史项目规模、评分、业主评价等，计算服务商初始信誉分。',
                },
                {
                  num: '03',
                  title: '综合能力评定',
                  desc: '结合团队规模、资质等级、在建项目数量等维度，评定接单能力等级。',
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex gap-3"
                >
                  <span className="font-mono text-lg font-bold text-wood-500 w-8 flex-shrink-0">{item.num}</span>
                  <div>
                    <p className="font-medium text-sm text-carbon-800 mb-1">{item.title}</p>
                    <p className="text-xs text-ivory-600 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-serif text-lg text-carbon-800 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-haze-600" />
              常见问题
            </h3>
            <Collapse
              items={faqItems}
              ghost
              className="[&_.ant-collapse-item]:!border-b [&_.ant-collapse-item]:!border-ivory-200 [&_.ant-collapse-item:last-child]:!border-0 [&_.ant-collapse-content]:!bg-transparent [&_.ant-collapse-header]:!px-0 [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-header]:!text-sm [&_.ant-collapse-header]:!text-carbon-700 [&_.ant-collapse-expand-icon]:!text-ivory-500"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QualificationAudit;
