import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Flag,
  FileText,
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Image,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { Report } from '@/mock/data';
import { createReport, getReport } from '@/services/api';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { mockReports } from '@/mock/data';

type TabType = 'report' | 'my-reports';

const reportSchema = z.object({
  propertyId: z.string().min(1, '请输入房源ID或链接'),
  type: z.enum(['fake_price', 'fake_info', 'fake_images', 'already_sold', 'other'], {
    required_error: '请选择举报类型',
  }),
  description: z.string().min(10, '描述内容至少10个字符').max(500, '描述内容最多500个字符'),
});

type ReportFormData = z.infer<typeof reportSchema>;

const tabs = [
  { key: 'report' as TabType, label: '举报虚假房源', icon: <Flag className="h-4 w-4" /> },
  { key: 'my-reports' as TabType, label: '我的举报', icon: <FileText className="h-4 w-4" /> },
];

const reportTypeOptions = [
  { value: 'fake_price', label: '虚假价格', desc: '房源价格与实际不符' },
  { value: 'fake_info', label: '虚假信息', desc: '房源基本信息虚假' },
  { value: 'fake_images', label: '虚假图片', desc: '房源图片与实际不符' },
  { value: 'already_sold', label: '已售出', desc: '房源已售出仍在挂牌' },
  { value: 'other', label: '其他', desc: '其他违规情况' },
];

const statusConfig = {
  pending: {
    label: '待处理', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-4 w-4" /> },
  reviewing: {
    label: '审核中', color: 'bg-blue-100 text-blue-700', icon: <Search className="h-4 w-4" /> },
  resolved: {
    label: '已解决', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: {
    label: '已拒绝', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" /> },
};

export default function ReportCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [reports, setReports] = useState<Report[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setEvidenceFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      await createReport({
        propertyId: data.propertyId,
        type: data.type,
        evidence: evidenceFiles,
        description: data.description,
      });
      setSubmitSuccess(true);
      setEvidenceFiles([]);
      reset();
      setTimeout(() => {
        setSubmitSuccess(false);
        fetchReports();
        setActiveTab('my-reports');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getReportTypeLabel = (type: string) => {
    const option = reportTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 pt-12 pb-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Flag className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">举报中心</h1>
                <p className="text-white/70 mt-1">
                  共同维护真实可信的房产交易环境
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container -mt-12 px-4 pb-12">
        <div className="card p-0 overflow-hidden">
          <div className="flex border-b border-neutral-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2',
                  activeTab === tab.key
                    ? 'border-primary-800 text-primary-800 bg-primary-50/50'
                    : 'border-transparent text-neutral-500 hover:text-primary-700 hover:bg-neutral-50'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'report' && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">
                        举报提交成功
                      </h3>
                      <p className="text-neutral-500 text-center">
                        感谢您的举报，我们将尽快审核处理
                      </p>
                    </motion.div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">
                          举报虚假房源
                        </h2>
                        <p className="text-sm text-neutral-500">
                          请填写以下信息，我们将对您的举报进行严格保密
                        </p>
                      </div>

                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            房源ID或链接
                          </label>
                          <input
                            type="text"
                            placeholder="请输入房源ID或粘贴房源链接"
                            className={cn(
                              'input-field',
                              errors.propertyId && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            )}
                            {...register('propertyId')}
                          />
                          {errors.propertyId && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.propertyId.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-3">
                            举报类型
                          </label>
                          <div className="space-y-2">
                            {reportTypeOptions.map((option) => (
                              <label
                                key={option.value}
                                className={cn(
                                  'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                                  errors.type
                                    ? 'border-red-200'
                                    : 'border-neutral-200 hover:border-primary-300',
                                  'data-[checked=true]:border-primary-800 data-[checked=true]:bg-primary-50'
                                )}
                              >
                                <input
                                  type="radio"
                                  value={option.value}
                                  className="sr-only mt-0.5"
                                  {...register('type')}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-primary-800" />
                                    <span className="font-medium text-neutral-900">
                                      {option.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-neutral-500 mt-1">
                                    {option.desc}
                                  </p>
                                </div>
                                <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex items-center justify-center data-[checked=true]:border-primary-800 data-[checked=true]:bg-primary-800" />
                              </label>
                            ))}
                          </div>
                          {errors.type && (
                            <p className="mt-1 text-sm text-red-500">
                              {errors.type.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            上传证据
                            <span className="text-neutral-400 font-normal ml-2">
                              (可选，最多5张图片)
                            </span>
                          </label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                              evidenceFiles.length > 0
                                ? 'border-primary-300 bg-primary-50'
                                : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                            )}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            {evidenceFiles.length > 0 ? (
                              <div className="flex flex-wrap gap-3 justify-center">
                                {evidenceFiles.map((file, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={file}
                                      alt={`证据${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile(index);
                                      }}
                                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                {evidenceFiles.length < 5 && (
                                  <div className="w-20 h-20 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center text-neutral-400">
                                    <Upload className="h-5 w-5 mb-1" />
                                    <span className="text-xs">添加</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                                <p className="text-neutral-600 mb-1">
                                  点击上传图片证据
                                </p>
                                <p className="text-sm text-neutral-400">
                                  支持 JPG、PNG 格式，单张不超过 5MB
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            详细描述
                          </label>
                          <textarea
                            rows={4}
                            placeholder="请详细描述您发现的问题..."
                            className={cn(
                              'input-field resize-none',
                              errors.description && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            )}
                            {...register('description')}
                          />
                          <div className="flex justify-between mt-1">
                            {errors.description && (
                              <p className="text-sm text-red-500">
                                {errors.description.message}
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 ml-auto">
                              10-500字符
                            </p>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                温馨提示
                              </p>
                              <p className="text-sm text-yellow-700 mt-1">
                                恶意举报或提供虚假证据将承担相应法律责任，请确保举报内容真实有效。
                              </p>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={isSubmitting}
                          className={cn(
                            'w-full btn-primary flex items-center justify-center gap-2 py-3',
                            isSubmitting && 'opacity-70 cursor-not-allowed'
                          )}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: 'linear',
                                }}
                                className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                              />
                              提交中...
                            </>
                          ) : (
                            <>
                              <Flag className="h-5 w-5" />
                              提交举报
                            </>
                          )}
                        </motion.button>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'my-reports' && (
                <motion.div
                  key="my-reports"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">
                      我的举报
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      您提交的举报记录，共 {reports.length} 条
                    </p>
                  </div>

                  {reports.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-5 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-800">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-neutral-900 line-clamp-1">
                                  {report.propertyTitle}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                                    {getReportTypeLabel(report.reportType)}
                                  </span>
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded',
                                      statusConfig[report.status as keyof typeof statusConfig]?.color
                                    )}
                                  >
                                    {statusConfig[report.status as keyof typeof statusConfig]?.icon}
                                    {statusConfig[report.status as keyof typeof statusConfig]?.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-300" />
                          </div>

                          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                            {report.description}
                          </p>

                          {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                            <div className="flex gap-2 mb-3">
                              {report.evidenceUrls.slice(0, 3).map((_, index) => (
                                <div
                                  key={index}
                                  className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center"
                                >
                                  <Image className="h-5 w-5 text-neutral-400" />
                                </div>
                              ))}
                              {report.evidenceUrls.length > 3 && (
                                <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center text-xs text-neutral-500">
                                  +{report.evidenceUrls.length - 3}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-neutral-400">
                            <span>提交时间: {formatDate(report.createdAt)}</span>
                            {report.resolution && (
                              <span className="text-neutral-500">
                                处理结果: {report.resolution}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
