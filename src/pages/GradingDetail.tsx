import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  User, 
  Send, 
  ArrowLeft,
  Download,
  MessageSquare,
  X
} from 'lucide-react';
import { gradingApi, submissionApi } from '../utils/api';
import type { RubricItem, Submission, User as UserType, Experiment, SubmissionFile } from '../../shared/types';

interface GradeInput {
  rubricItemId: number;
  score: number;
  comment: string;
}

const GradingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [student, setStudent] = useState<UserType | null>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [rubricItems, setRubricItems] = useState<Array<RubricItem & { grade?: GradeInput }>>([]);
  const [grades, setGrades] = useState<GradeInput[]>([]);
  const [annotation, setAnnotation] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (submissionId: number) => {
    try {
      const res = await gradingApi.getSubmission(submissionId);
      if (res.success && res.data) {
        const data = res.data as {
          submission: Submission;
          student: UserType;
          experiment: Experiment;
          rubricItems: Array<RubricItem & { grade?: GradeInput }>;
        };
        setSubmission(data.submission);
        setStudent(data.student);
        setExperiment(data.experiment);
        setRubricItems(data.rubricItems);
        setGrades(data.rubricItems.map(item => ({
          rubricItemId: item.id,
          score: item.grade?.score || 0,
          comment: item.grade?.comment || '',
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (rubricItemId: number, score: number) => {
    setGrades(prev => prev.map(g => 
      g.rubricItemId === rubricItemId ? { ...g, score } : g
    ));
  };

  const handleCommentChange = (rubricItemId: number, comment: string) => {
    setGrades(prev => prev.map(g => 
      g.rubricItemId === rubricItemId ? { ...g, comment } : g
    ));
  };

  const getTotalScore = () => {
    let total = 0;
    let totalWeight = 0;
    rubricItems.forEach(item => {
      const grade = grades.find(g => g.rubricItemId === item.id);
      if (grade) {
        total += grade.score * item.weight;
        totalWeight += item.weight;
      }
    });
    return totalWeight > 0 ? Math.round((total / totalWeight) * 100) / 100 : 0;
  };

  const handleSubmitGrade = async () => {
    if (!submission?.id) return;
    setSaving(true);
    try {
      const res = await gradingApi.grade(submission.id, grades);
      if (res.success) {
        setMessage({ type: 'success', text: '评分完成' });
        setTimeout(() => navigate('/grading'), 1500);
      } else {
        setMessage({ type: 'error', text: res.error || '评分失败' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!submission?.id || !returnReason) return;
    setSaving(true);
    try {
      const res = await gradingApi.returnSubmission(submission.id, returnReason);
      if (res.success) {
        setMessage({ type: 'success', text: '已退回修改' });
        setTimeout(() => navigate('/grading'), 1500);
      }
    } finally {
      setSaving(false);
      setShowReturnModal(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!submission?.id || !annotation) return;
    const res = await submissionApi.addAnnotation(submission.id, annotation);
    if (res.success) {
      setAnnotation('');
      loadData(submission.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/grading')}
        className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        返回批改列表
      </button>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-800">{experiment?.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{student?.name} 的实验报告</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">提交时间</p>
                <p className="font-medium">{submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-slate-700 mb-3">上传的文件</h3>
              {submission?.files && submission.files.length > 0 ? (
                <div className="space-y-2">
                  {submission.files.map((file: SubmissionFile) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-700">{file.originalName}</span>
                        <span className="text-xs text-slate-400">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                      </div>
                      <a 
                        href={`/uploads/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        下载
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">暂无上传文件</p>
              )}
            </div>

            <div>
              <h3 className="font-medium text-slate-700 mb-3">批注</h3>
              <div className="space-y-3 mb-4">
                {submission?.annotations?.map((a, i) => (
                  <div key={i} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-slate-700">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  placeholder="添加批注..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAddAnnotation}
                  disabled={!annotation}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-500">总分</p>
              <p className="text-4xl font-bold text-blue-600">{getTotalScore()}</p>
            </div>

            <h3 className="font-semibold text-slate-800 mb-4">评分项</h3>
            <div className="space-y-4">
              {rubricItems.map((item, index) => {
                const grade = grades.find(g => g.rubricItemId === item.id);
                return (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700">{index + 1}. {item.name}</span>
                      <span className="text-sm text-slate-500">满分: {item.maxScore}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={item.maxScore}
                      value={grade?.score || 0}
                      onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-2"
                    />
                    <input
                      type="text"
                      placeholder="评语（可选）"
                      value={grade?.comment || ''}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSubmitGrade}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                {saving ? '提交中...' : '提交评分'}
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                退回修改
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">退回修改</h3>
              <button onClick={() => setShowReturnModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="请输入退回原因..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReturn}
                disabled={!returnReason || saving}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingDetail;
