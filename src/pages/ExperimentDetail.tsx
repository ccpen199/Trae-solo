import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  X, 
  Clock, 
  Send, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { experimentApi, submissionApi } from '../utils/api';
import type { Experiment, Submission, SubmissionFile, RubricItem } from '../../shared/types';
import { statusColors, statusNames } from '../../shared/types';

const ExperimentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (expId: number) => {
    try {
      const [expRes, subRes] = await Promise.all([
        experimentApi.get(expId),
        submissionApi.getByExperiment(expId),
      ]);

      if (expRes.success) {
        setExperiment(expRes.data as Experiment);
        setRubricItems((expRes.data as unknown as { rubricItems: RubricItem[] }).rubricItems || []);
      }
      if (subRes.success && subRes.data) {
        setSubmission(subRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!submission?.id) {
      const res = await submissionApi.create(parseInt(id!));
      if (res.success && res.data) {
        setSubmission(res.data);
        await uploadFiles(res.data.id, Array.from(files));
      }
    } else {
      await uploadFiles(submission.id, Array.from(files));
    }
  };

  const uploadFiles = async (submissionId: number, files: File[]) => {
    setUploading(true);
    try {
      const res = await submissionApi.uploadFiles(submissionId, files);
      if (res.success) {
        setMessage({ type: 'success', text: '文件上传成功' });
        loadData(parseInt(id!));
      } else {
        setMessage({ type: 'error', text: res.error || '上传失败' });
      }
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!submission?.id) return;
    const res = await submissionApi.deleteFile(submission.id, fileId);
    if (res.success) {
      loadData(parseInt(id!));
    }
  };

  const handleSubmit = async () => {
    if (!submission?.id) return;
    setSubmitting(true);
    try {
      const res = await submissionApi.submit(submission.id);
      if (res.success) {
        setMessage({ type: 'success', text: '提交成功' });
        loadData(parseInt(id!));
      } else {
        setMessage({ type: 'error', text: res.error || '提交失败' });
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleResubmit = async () => {
    if (!submission?.id) return;
    const res = await submissionApi.resubmit(submission.id);
    if (res.success) {
      setMessage({ type: 'success', text: '已撤回，可重新提交' });
      loadData(parseInt(id!));
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!experiment) {
    return <div>实验不存在</div>;
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/experiments')}
        className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← 返回实验列表
      </button>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} flex items-center gap-2`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">{experiment.title}</h1>
            <p className="text-slate-600 mb-6">{experiment.description}</p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">实验目标</h3>
              <p className="text-blue-700 whitespace-pre-wrap">{experiment.objectives}</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>截止: {new Date(experiment.deadline).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {rubricItems.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">评分标准</h2>
              <div className="space-y-3">
                {rubricItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-medium text-slate-700">{index + 1}. {item.name}</span>
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{item.maxScore}分</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">提交状态</h2>
            {submission ? (
              <>
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[submission.status]}`}>
                    {statusNames[submission.status]}
                  </span>
                </div>
                {submission.totalScore !== undefined && submission.totalScore !== null ? (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">最终得分</p>
                    <p className="text-3xl font-bold text-green-700">{submission.totalScore}</p>
                  </div>
                ) : (submission.status === 'submitted' || submission.status === 'late') && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">待批改</p>
                    <p className="text-amber-700 mt-1">报告已提交，等待教师批改</p>
                  </div>
                )}
                <p className="text-sm text-slate-500">
                  提交时间: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '未提交'}
                </p>
              </>
            ) : (
              <p className="text-slate-500">尚未开始提交</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">上传文件</h2>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || (submission?.status === 'submitted' || submission?.status === 'late' || submission?.status === 'graded')}
              className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <span className="text-slate-600">{uploading ? '上传中...' : '点击上传文件'}</span>
              <span className="text-xs text-slate-400">支持 PDF、Word、图片、代码等文件</span>
            </button>

            {submission?.files && submission.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {submission.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{file.originalName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/uploads/${file.filename}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {!(submission?.status === 'submitted' || submission?.status === 'late' || submission?.status === 'graded') && (
                        <button 
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-3">
              {submission?.status === 'draft' || submission?.status === 'resubmitted' || submission?.status === 'returned' ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !submission?.files || submission.files.length === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? '提交中...' : '提交报告'}
                </button>
              ) : (submission?.status === 'submitted' || submission?.status === 'late') && (
                <button
                  onClick={handleResubmit}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  撤回重交
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperimentDetail;
