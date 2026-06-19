import { useState, useMemo } from 'react';
import type { PracticeLog, Team } from '../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Sparkles,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  Eye,
  Plus,
  BookOpen,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const keywordMappings: { pattern: RegExp; keyword: string }[] = [
  { pattern: /乡村|振兴|助农|农业|农村|农民/, keyword: '乡村振兴' },
  { pattern: /电商|直播|带货|销售|农产品|店铺/, keyword: '电商助农' },
  { pattern: /支教|老人|儿童|社区|公益|志愿/, keyword: '社区服务' },
  { pattern: /教育|教学|课程|培训|学校|学生/, keyword: '教育帮扶' },
  { pattern: /环境|环保|生态|绿色|污染|垃圾/, keyword: '生态环保' },
  { pattern: /调研|问卷|访谈|走访|调查|研究/, keyword: '社会调研' },
  { pattern: /文化|非遗|传统|历史|民俗|艺术/, keyword: '文化传承' },
  { pattern: /医疗|健康|义诊|卫生|科普/, keyword: '医疗服务' },
  { pattern: /科技|数字|智能|互联网|编程|技术/, keyword: '科技赋能' },
  { pattern: /法律|普法|维权|咨询|法治/, keyword: '法律援助' },
];

const PracticeLogs = () => {
  const { logs, teams, addLog } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedLog, setSelectedLog] = useState<string | null>(
    logs[0]?.id || null
  );
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      teamId: params.get('teamId'),
    };
  }, [location.search]);

  const hasUrlFilter = !!urlParams.teamId;

  const filterLabel = useMemo(() => {
    if (urlParams.teamId) {
      const team = teams.find((t) => t.id === urlParams.teamId);
      return team?.name || urlParams.teamId;
    }
    return '';
  }, [urlParams.teamId, teams]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReadModal, setShowReadModal] = useState<PracticeLog | null>(null);

  const [formData, setFormData] = useState({
    teamId: '',
    author: '',
    serviceHours: '',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [aiLoading, setAiLoading] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);

  const filteredTeams = useMemo(
    () => teams.filter((t) => t.status !== 'draft'),
    [teams]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesTeam =
        selectedTeam === 'all' || log.teamId === selectedTeam;
      const matchesSearch =
        log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUrlTeam = !urlParams.teamId || log.teamId === urlParams.teamId;
      return matchesTeam && matchesSearch && matchesUrlTeam;
    });
  }, [logs, selectedTeam, searchTerm, urlParams.teamId]);

  const activeLog = useMemo(
    () => logs.find((log) => log.id === selectedLog) || null,
    [logs, selectedLog]
  );

  const totalHours = useMemo(
    () => logs.reduce((sum, log) => sum + log.serviceHours, 0),
    [logs]
  );

  const totalKeywords = useMemo(() => {
    const all = logs.reduce<string[]>(
      (acc, log) => [...acc, ...(log.keywords || [])],
      []
    );
    return Array.from(new Set(all)).length;
  }, [logs]);

  const aiSummaryCount = useMemo(
    () => logs.filter((l) => l.summary).length,
    [logs]
  );

  const selectedTeamObj = useMemo(
    () => teams.find((t) => t.id === formData.teamId) || null,
    [teams, formData.teamId]
  );

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.teamId) errs.teamId = '请选择所属团队';
    if (!formData.author.trim()) errs.author = '请填写作者姓名';
    if (formData.content.trim().length < 100)
      errs.content = `日志正文至少100字（当前${formData.content.trim().length}字）`;
    const hours = Number(formData.serviceHours);
    if (!formData.serviceHours || isNaN(hours) || hours < 1)
      errs.serviceHours = '服务时长至少为1小时';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAIGenerate = () => {
    if (formData.content.trim().length < 100) {
      setErrors((prev) => ({
        ...prev,
        content: `请先填写至少100字的正文内容（当前${formData.content.trim().length}字）`,
      }));
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const trimmed = formData.content.trim();
      const baseSummary = trimmed.slice(0, 120);
      const summary =
        '【实践日志摘要】' +
        baseSummary +
        (trimmed.length > 120 ? '...' : '') +
        ' 本次实践记录了团队在基层服务中的具体行动与收获，展现了青年学子的责任担当与实践能力。';

      const found: string[] = [];
      keywordMappings.forEach((m) => {
        if (m.pattern.test(trimmed) && !found.includes(m.keyword)) {
          found.push(m.keyword);
        }
      });
      if (found.length < 5) {
        const extraMap = [
          '基层实践',
          '志愿服务',
          '青春担当',
          '社会实践',
          '成果转化',
        ];
        for (const k of extraMap) {
          if (found.length >= 8) break;
          if (!found.includes(k)) found.push(k);
        }
      }
      const finalKeywords = found.slice(0, 8);

      setGeneratedSummary(summary);
      setGeneratedKeywords(finalKeywords);
      setAiLoading(false);
    }, 1500);
  };

  const removeKeyword = (kw: string) => {
    setGeneratedKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const resetForm = () => {
    setFormData({
      teamId: '',
      author: '',
      serviceHours: '',
      content: '',
    });
    setErrors({});
    setGeneratedSummary('');
    setGeneratedKeywords([]);
    setAiLoading(false);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!selectedTeamObj) return;

    const today = new Date().toISOString().slice(0, 10);
    const newLog: Omit<PracticeLog, 'id'> = {
      teamId: formData.teamId,
      teamName: selectedTeamObj.name,
      author: formData.author.trim(),
      authorId: '1',
      date: today,
      content: formData.content.trim(),
      summary: generatedSummary || undefined,
      keywords: generatedKeywords,
      serviceHours: Number(formData.serviceHours),
      status: 'submitted',
    };
    addLog(newLog);
    setShowCreateModal(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* URL参数过滤提示条 */}
      {hasUrlFilter && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>
            当前展示「{filterLabel}」的实践日志，共 {filteredLogs.length} 篇
            <button
              onClick={() => navigate('/sanxiaxiang/logs')}
              className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
            >
              清除筛选
            </button>
          </span>
          <button
            onClick={() => navigate('/sanxiaxiang/logs')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索日志内容、团队、作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部团队</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          撰写日志
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
              <p className="text-xs text-gray-500">日志总数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHours}h</p>
              <p className="text-xs text-gray-500">累计服务时长</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{aiSummaryCount}</p>
              <p className="text-xs text-gray-500">AI摘要生成</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalKeywords}</p>
              <p className="text-xs text-gray-500">关键词提取</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">日志列表</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedLog === log.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {log.teamName}
                      </p>
                      {log.status === 'submitted' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full">
                          待审核
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {log.content.slice(0, 50)}...
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{log.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{log.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {log.summary && (
                  <div className="mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-600">已生成AI摘要</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeLog ? (
            <div className="h-[600px] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {activeLog.teamName}
                      </h3>
                      {activeLog.status === 'submitted' && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          待审核
                        </span>
                      )}
                      {activeLog.status === 'approved' && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          已通过
                        </span>
                      )}
                      {activeLog.status === 'rejected' && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          已驳回
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {activeLog.serviceHours}小时服务
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReadModal(activeLog)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看全文
                  </button>
                </div>
              </div>

              {activeLog.reviewer && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          审核人：{activeLog.reviewer}
                        </span>
                        {activeLog.reviewTime && (
                          <span className="text-xs text-gray-400">
                            · {activeLog.reviewTime}
                          </span>
                        )}
                      </div>
                      {activeLog.reviewComment && (
                        <p className="text-xs text-gray-500 mt-1">
                          审核意见：{activeLog.reviewComment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeLog.summary && (
                <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700">
                      AI智能摘要
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {activeLog.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activeLog.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-white text-yellow-700 rounded-full border border-yellow-200"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">日志正文</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {activeLog.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">请选择一篇日志查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================ 撰写日志弹窗 ================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  撰写实践日志
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  提交后将进入审核流程，审核通过自动沉淀关键词与累计时长
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 模块1 团队选择 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                  模块1 · 团队选择 <span className="text-red-500">*</span>
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    所属实践团队
                  </label>
                  <select
                    value={formData.teamId}
                    onChange={(e) =>
                      setFormData({ ...formData, teamId: e.target.value })
                    }
                    className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.teamId ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">请选择团队（过滤草稿状态）</option>
                    {filteredTeams.map((team: Team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} — {team.projectName}
                      </option>
                    ))}
                  </select>
                  {errors.teamId && (
                    <p className="text-xs text-red-500 mt-1">{errors.teamId}</p>
                  )}
                </div>
              </div>

              {/* 模块2 作者信息 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded"></span>
                  模块2 · 作者信息 <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      作者姓名
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      placeholder="请输入作者姓名"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.author ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.author && (
                      <p className="text-xs text-red-500 mt-1">{errors.author}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      服务时长（小时）
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={formData.serviceHours}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceHours: e.target.value })
                      }
                      placeholder="请输入服务时长，至少1小时"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.serviceHours ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.serviceHours && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.serviceHours}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 模块3 日志正文 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded"></span>
                  模块3 · 日志正文 <span className="text-red-500">*</span>
                </h3>
                <div className="relative">
                  <textarea
                    rows={8}
                    maxLength={5000}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="请详细记录今日实践过程、见闻、收获与反思（至少100字，不超过5000字）"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none pb-8 ${
                      errors.content ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {formData.content.length}/5000
                  </div>
                </div>
                {errors.content ? (
                  <p className="text-xs text-red-500 mt-1">{errors.content}</p>
                ) : formData.content.trim().length > 0 && formData.content.trim().length < 100 ? (
                  <p className="text-xs text-orange-500 mt-1">
                    距离100字还差 {100 - formData.content.trim().length} 字
                  </p>
                ) : null}
              </div>

              {/* 模块4 AI一键生成 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-yellow-500 rounded"></span>
                  模块4 · AI一键生成摘要与关键词
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleAIGenerate}
                    disabled={aiLoading}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-lg hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {aiLoading ? 'AI智能生成中...' : 'AI一键生成摘要&关键词'}
                  </button>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      AI摘要预览
                    </label>
                    <div
                      className={`w-full min-h-[80px] px-3 py-2.5 text-sm border rounded-lg bg-gray-50 ${
                        generatedSummary ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {generatedSummary || '点击上方按钮，AI将根据正文内容自动生成摘要...'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      关键词标签（点击 × 可删除）
                    </label>
                    <div
                      className={`w-full min-h-[44px] px-3 py-2 border rounded-lg flex flex-wrap gap-2 ${
                        generatedKeywords.length > 0
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {generatedKeywords.length === 0 ? (
                        <span className="text-xs text-gray-400 py-1">
                          暂未生成关键词，点击AI按钮后自动提取
                        </span>
                      ) : (
                        generatedKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200"
                          >
                            #{kw}
                            <button
                              onClick={() => removeKeyword(kw)}
                              className="ml-0.5 hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 模块5 审核流程提示条 */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  模块5 · 审核流程说明
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
                  <span className="px-2.5 py-1.5 bg-white rounded-lg border border-amber-200 font-medium">
                    ① 学生提交
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="px-2.5 py-1.5 bg-white rounded-lg border border-amber-200 font-medium">
                    ② 指导老师审核
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="px-2.5 py-1.5 bg-white rounded-lg border border-amber-200 font-medium">
                    ③ 日志通过
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-200 font-medium">
                    ④ 自动沉淀关键词/累计时长
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                  <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
                    ⑤ 推进学分进度
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              >
                提交日志
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================ 查看全文弹窗 ================ */}
      {showReadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  日志全文阅读
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {showReadModal.teamName} · {showReadModal.author} · {showReadModal.date} · {showReadModal.serviceHours}h服务
                </p>
              </div>
              <button
                onClick={() => setShowReadModal(null)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {showReadModal.summary && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">
                        AI智能摘要
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {showReadModal.summary}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    日志正文
                  </h3>
                  <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-700 leading-8 whitespace-pre-wrap indent-8">
                      {showReadModal.content}
                    </p>
                  </div>
                </div>

                {/* 服务内容关键词提取展示区 */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    服务内容关键词提取展示区
                  </h3>
                  {showReadModal.keywords.length === 0 ? (
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <p className="text-sm text-orange-700 font-medium">
                        未生成关键词
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {showReadModal.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 text-sm bg-white text-green-700 rounded-full border border-green-200 shadow-sm"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">
                          已自动沉淀至团队成果
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
              <button
                onClick={() => setShowReadModal(null)}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeLogs;
