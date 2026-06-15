import React, { useMemo, useState } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FolderKanban,
  FileText,
  Edit3,
  Plus,
  Trash2,
  Upload,
  File,
  X,
  Check,
  AlertCircle,
  Loader2,
  Brain,
  Zap,
  Target,
  TrendingUp,
  ChevronRight,
  Download,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  Tabs,
  Button,
  Input,
  DatePicker,
  Select,
  Tag,
  Upload as AntdUpload,
  Progress,
  Card,
  Divider,
  Rate,
  Slider,
  Avatar,
  Tooltip,
  message,
  Popconfirm,
  Empty,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer } from 'recharts';
import { generateMockData } from '@/mock/data';
import {
  TownshipCode,
  SkillItem,
  EducationItem,
  WorkItem,
  ProjectItem,
  CertificateItem,
  Resume,
} from '@shared/types';
import { TOWNSHIPS } from '@/mock/townships';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import StatsCard from '@/components/common/StatsCard';
import { cn } from '@/lib/utils';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

type TabKey = 'online' | 'parser' | 'skillmap';

interface SkillNode {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  x?: number;
  y?: number;
  r?: number;
}

interface SkillLink {
  source: string;
  target: string;
  value: number;
}

const SKILL_CATEGORIES: Record<string, { color: string; bg: string }> = {
  '机械制造': { color: '#165DFF', bg: 'bg-industrial-blue-500' },
  '电子电气': { color: '#722ED1', bg: 'bg-purple-500' },
  '质检管理': { color: '#00B42A', bg: 'bg-success-500' },
  'IT互联网': { color: '#13C2C2', bg: 'bg-cyan-500' },
  '通用技能': { color: '#FF7D00', bg: 'bg-vital-orange-500' },
};

function ResumePage() {
  const mockData = useMemo(() => generateMockData(), []);
  const [activeTab, setActiveTab] = useState<TabKey>('online');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const resume = useMemo<Resume>(() => {
    if (mockData.resumes.length > 0) return mockData.resumes[0];
    return {
      id: 'res_demo',
      jobSeekerId: 'js_1',
      title: '张三的个人简历',
      basicInfo: {
        name: '张三',
        gender: '男',
        age: 28,
        phone: '138****8888',
        email: 'zhangsan@example.com',
        location: TownshipCode.XL,
        education: '大专',
        workYears: 5,
        expectPosition: 'CNC操作员',
        expectSalary: [8, 15],
      },
      skills: [
        { id: 's1', name: 'CNC操作', proficiency: 5, category: '机械制造', years: 5 },
        { id: 's2', name: '机械制图', proficiency: 4, category: '机械制造', years: 4 },
        { id: 's3', name: 'CAD绘图', proficiency: 4, category: '机械制造', years: 3 },
        { id: 's4', name: 'PLC编程', proficiency: 3, category: '电子电气', years: 2 },
        { id: 's5', name: '电工操作', proficiency: 3, category: '电子电气', years: 3 },
        { id: 's6', name: '质量管理', proficiency: 4, category: '质检管理', years: 4 },
        { id: 's7', name: 'Office办公', proficiency: 4, category: '通用技能', years: 6 },
        { id: 's8', name: '沟通协调', proficiency: 4, category: '通用技能', years: 5 },
      ],
      educationList: [
        {
          id: 'e1',
          school: '中山职业技术学院',
          major: '机电一体化技术',
          degree: '大专',
          startDate: '2015-09',
          endDate: '2018-06',
          description: '主修机械设计、电气控制、PLC编程等课程，成绩优秀',
        },
      ],
      workList: [
        {
          id: 'w1',
          company: '中山市某精密五金有限公司',
          position: 'CNC高级操作员',
          startDate: '2021-03',
          endDate: '至今',
          salary: 12,
          highlights: [
            '独立操作Fanuc、三菱系统CNC加工中心，完成精密零件加工',
            '负责班组生产质量管控，产品合格率达99.5%',
            '参与工艺优化，提高生产效率20%',
          ],
          skillsUsed: ['CNC操作', '机械制图', '质量管理'],
        },
        {
          id: 'w2',
          company: '中山市某机械制造有限公司',
          position: '数控操作员',
          startDate: '2018-07',
          endDate: '2021-02',
          salary: 8,
          highlights: [
            '操作数控车床、铣床，完成零件加工任务',
            '协助技术员完成设备调试和维护',
          ],
          skillsUsed: ['CNC操作', 'CAD绘图'],
        },
      ],
      projectList: [
        {
          id: 'p1',
          name: '精密零件加工工艺优化',
          role: '主要执行人',
          startDate: '2022-06',
          endDate: '2022-12',
          description: '针对某精密零件加工效率低、合格率低的问题，优化加工工艺和工装夹具',
          achievements: [
            '单件加工时间从45分钟缩短至28分钟，效率提升38%',
            '产品合格率从96%提升至99.5%',
            '每月节省生产成本约2.5万元',
          ],
          skillsUsed: ['CNC操作', '机械制图', '质量管理'],
        },
      ],
      certificates: [
        { id: 'c1', name: '数控车工高级技能等级证书', issuer: '中山市人力资源和社会保障局', date: '2020-08' },
        { id: 'c2', name: '电工操作证', issuer: '中山市应急管理局', date: '2019-05' },
        { id: 'c3', name: 'CAD中级绘图师', issuer: '国家职业技能鉴定中心', date: '2017-12' },
      ],
      selfEvaluation: '5年以上机械制造行业工作经验，熟练掌握CNC加工中心操作，具备扎实的机械制图和工艺优化能力。工作认真负责，学习能力强，善于团队协作，具备良好的质量意识和安全意识。',
      updatedAt: new Date().toISOString(),
    };
  }, [mockData.resumes]);

  const [uploadState, setUploadState] = useState<{
    status: 'idle' | 'uploading' | 'parsing' | 'done' | 'error';
    progress: number;
    fileName: string;
    fileSize: number;
  }>({
    status: 'idle',
    progress: 0,
    fileName: '',
    fileSize: 0,
  });

  const handleFileUpload = (file: File) => {
    setUploadState({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      fileSize: file.size,
    });

    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setUploadState((s) => ({ ...s, status: 'parsing', progress: 100 }));
        startParsing();
      }
      setUploadState((s) => ({ ...s, progress: Math.min(progress, 100) }));
    }, 300);

    return false;
  };

  const startParsing = () => {
    let parseProgress = 0;
    const parseInterval = setInterval(() => {
      parseProgress += Math.random() * 12;
      if (parseProgress >= 100) {
        parseProgress = 100;
        clearInterval(parseInterval);
        setUploadState((s) => ({ ...s, status: 'done' }));
        message.success('简历解析完成！');
      }
      setUploadState((s) => ({ ...s, progress: Math.min(parseProgress, 100) }));
    }, 400);
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0, fileName: '', fileSize: 0 });
  };

  const { skillNodes, skillLinks } = useMemo(() => {
    const nodes: SkillNode[] = resume.skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
    }));

    const links: SkillLink[] = [];
    const categories = Array.from(new Set(nodes.map((n) => n.category)));

    categories.forEach((cat) => {
      const catNodes = nodes.filter((n) => n.category === cat);
      for (let i = 0; i < catNodes.length; i++) {
        for (let j = i + 1; j < catNodes.length; j++) {
          links.push({
            source: catNodes[i].id,
            target: catNodes[j].id,
            value: 0.5 + Math.random() * 0.5,
          });
        }
      }
    });

    return { skillNodes: nodes, skillLinks: links };
  }, [resume.skills]);

  const recommendedPaths = useMemo(() => [
    {
      id: 'p1',
      title: '高级技师成长路径',
      steps: ['数控高级工', '数控技师', '高级技师', '技能大师'],
      duration: '5-8年',
      courses: ['CNC编程进阶', '五轴加工技术', '精密测量技术'],
      salaryBoost: '+60%',
    },
    {
      id: 'p2',
      title: '技术管理路径',
      steps: ['技术员', '班组长', '车间主管', '生产经理'],
      duration: '4-6年',
      courses: ['生产管理', '质量管理体系', '团队管理'],
      salaryBoost: '+80%',
    },
    {
      id: 'p3',
      title: '自动化工程师路径',
      steps: ['电气助理', 'PLC工程师', '自动化工程师', '自动化主管'],
      duration: '3-5年',
      courses: ['PLC高级编程', '伺服控制', '工业机器人'],
      salaryBoost: '+100%',
    },
  ], []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / 1024 / 1024).toFixed(1) + 'MB';
  };

  const renderOnlineResume = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">个人简历</h2>
            <p className="text-sm text-gray-500">
              最后更新于 {new Date(resume.updatedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<Download size={16} />}>导出PDF</Button>
            <Button icon={<Eye size={16} />}>预览</Button>
            <Button type="primary" icon={<Edit3 size={16} />}>
              编辑简历
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 p-5 bg-gradient-to-r from-industrial-blue-50 to-industrial-blue-50/30 rounded-xl border border-industrial-blue-100"
        >
          <div className="flex-shrink-0">
            <Avatar size={80} className="!bg-industrial-gradient !text-2xl font-bold">
              {resume.basicInfo?.name?.charAt(0) || '张'}
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-2xl font-bold text-gray-900">
                {resume.basicInfo?.name || '张三'}
              </h3>
              <Tag color="blue">{resume.basicInfo?.gender}</Tag>
              <Tag color="orange">{resume.basicInfo?.age}岁</Tag>
              <Tag color="green">
                {resume.basicInfo?.workYears || 0}年经验
              </Tag>
              <Tag color="purple">{resume.basicInfo?.education}</Tag>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Phone size={14} /> {resume.basicInfo?.phone || '138****8888'}
              </span>
              <span className="flex items-center gap-1">
                <Mail size={14} /> {resume.basicInfo?.email || 'zhangsan@example.com'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {TOWNSHIPS.find((t) => t.code === resume.basicInfo?.location)?.name || '小榄镇'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">期望职位：</span>
              <span className="text-sm font-semibold text-industrial-blue-600">
                {resume.basicInfo?.expectPosition || 'CNC操作员'}
              </span>
              <span className="text-sm text-gray-600">期望薪资：</span>
              <span className="text-sm font-semibold text-vital-orange-500">
                {resume.basicInfo?.expectSalary?.[0] || 8}K - {resume.basicInfo?.expectSalary?.[1] || 15}K
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 mb-1">简历完整度</span>
            <MatchScoreRing score={92} size="md" label="完整度" />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
            <Award size={18} className="text-industrial-blue-500" />
            技能证书
          </h3>
          <Button type="link" icon={<Plus size={14} />} className="!text-industrial-blue-600">
            添加技能
          </Button>
        </div>

        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">专业技能</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resume.skills.map((skill, idx) => {
              const scheme = SKILL_CATEGORIES[skill.category] || SKILL_CATEGORIES['通用技能'];
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-industrial-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', scheme.bg)} />
                      <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                      <Tag className="!text-[10px] !m-0 !px-1.5 !py-0">{skill.category}</Tag>
                    </div>
                    <span className="text-xs text-gray-500">
                      {skill.years || 0}年经验
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', scheme.bg)}
                        style={{ width: `${skill.proficiency * 20}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono-num text-gray-600 w-12 text-right">
                      {skill.proficiency}/5
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">资格证书</h4>
          {resume.certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {resume.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-3 bg-gradient-to-r from-vital-orange-50 to-transparent rounded-lg border border-vital-orange-100 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-vital-orange-100 flex items-center justify-center flex-shrink-0">
                    <Award size={20} className="text-vital-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cert.name}</p>
                    <p className="text-xs text-gray-500 truncate">{cert.issuer}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无证书" />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-5 bg-vital-orange-500 rounded-full inline-block" />
            <Briefcase size={18} className="text-vital-orange-500" />
            工作经历
          </h3>
          <Button type="link" icon={<Plus size={14} />} className="!text-vital-orange-600">
            添加工作经历
          </Button>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
          <div className="space-y-5">
            {resume.workList.map((work, idx) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.1 }}
                className="relative pl-10"
              >
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-vital-orange-100 border-2 border-vital-orange-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-vital-orange-500 rounded-full" />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{work.position}</h4>
                      <p className="text-sm text-gray-600">{work.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-vital-orange-500 font-semibold">
                        {work.salary}K/月
                      </p>
                      <p className="text-xs text-gray-500">
                        {work.startDate} - {work.endDate}
                      </p>
                    </div>
                  </div>
                  {work.highlights.length > 0 && (
                    <ul className="space-y-1 mt-3">
                      {work.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check size={12} className="text-success-500 mt-1 flex-shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {work.skillsUsed && work.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {work.skillsUsed.map((s, i) => (
                        <Tag key={i} className="!text-[10px] !m-0">
                          {s}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
              <GraduationCap size={18} className="text-industrial-blue-500" />
              教育经历
            </h3>
          </div>
          <div className="space-y-3">
            {resume.educationList.map((edu) => (
              <div key={edu.id} className="p-4 bg-industrial-blue-50/30 rounded-lg border border-industrial-blue-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{edu.school}</h4>
                    <p className="text-sm text-gray-600">
                      {edu.major} · {edu.degree}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {edu.startDate} - {edu.endDate}
                  </p>
                </div>
                {edu.description && (
                  <p className="text-sm text-gray-600">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-vital-orange-500 rounded-full inline-block" />
              <FolderKanban size={18} className="text-vital-orange-500" />
              项目经验
            </h3>
          </div>
          <div className="space-y-3">
            {resume.projectList.map((proj) => (
              <div key={proj.id} className="p-4 bg-vital-orange-50/30 rounded-lg border border-vital-orange-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{proj.name}</h4>
                    <p className="text-sm text-gray-600">{proj.role}</p>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {proj.startDate} - {proj.endDate}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">{proj.description}</p>
                {proj.achievements.length > 0 && (
                  <ul className="space-y-1">
                    {proj.achievements.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Sparkles size={12} className="text-vital-orange-500 mt-1 flex-shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
          <FileText size={18} className="text-industrial-blue-500" />
          自我评价
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
          {resume.selfEvaluation}
        </p>
      </motion.div>
    </div>
  );

  const renderParser = () => (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">简历智能解析</h2>
            <p className="text-sm text-gray-500">
              上传PDF/Word格式简历，AI自动提取信息生成在线简历
            </p>
          </div>
          {uploadState.status === 'done' && (
            <Button onClick={resetUpload}>重新上传</Button>
          )}
        </div>

        {uploadState.status === 'idle' && (
          <div
            className="border-2 border-dashed border-gray-300 hover:border-industrial-blue-400 rounded-xl p-12 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-industrial-blue-50/30"
            onClick={() => document.getElementById('resume-upload')?.click()}
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-industrial-blue-100 flex items-center justify-center">
              <Upload size={32} className="text-industrial-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              点击上传或拖拽文件到此处
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              支持 PDF、Word（.doc/.docx）格式，单个文件不超过 10MB
            </p>
            <Button type="primary" icon={<Upload size={16} />}>
              选择文件
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {uploadState.status !== 'idle' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-50 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-industrial-blue-100 flex items-center justify-center flex-shrink-0">
                  <File size={24} className="text-industrial-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {uploadState.fileName}
                    </h4>
                    {uploadState.status !== 'done' && uploadState.status !== 'error' && (
                      <Button
                        type="text"
                        size="small"
                        icon={<X size={14} />}
                        onClick={resetUpload}
                        className="!text-gray-400 !h-6"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadState.fileSize)}
                  </p>
                </div>
                {uploadState.status === 'done' && (
                  <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                    <Check size={20} className="text-success-500" />
                  </div>
                )}
                {uploadState.status === 'error' && (
                  <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                    <X size={20} className="text-danger-500" />
                  </div>
                )}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {uploadState.status === 'uploading' && '上传中...'}
                    {uploadState.status === 'parsing' && 'AI智能解析中...'}
                    {uploadState.status === 'done' && '解析完成！'}
                    {uploadState.status === 'error' && '解析失败'}
                  </span>
                  <span className="text-sm font-mono-num text-industrial-blue-600 font-semibold">
                    {Math.round(uploadState.progress)}%
                  </span>
                </div>
                <Progress
                  percent={Math.round(uploadState.progress)}
                  showInfo={false}
                  strokeColor={
                    uploadState.status === 'error'
                      ? '#F53F3F'
                      : uploadState.status === 'done'
                      ? '#00B42A'
                      : '#165DFF'
                  }
                  trailColor="#E5E6EB"
                />
              </div>

              {uploadState.status === 'parsing' && (
                <div className="space-y-2">
                  {[
                    { label: '识别文档结构', done: true },
                    { label: '提取个人信息', done: true },
                    { label: '解析工作经历', done: uploadState.progress > 50 },
                    { label: '识别技能证书', done: uploadState.progress > 75 },
                    { label: '生成结构化简历', done: uploadState.progress >= 100 },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <Check size={14} className="text-success-500" />
                      ) : (
                        <Loader2 size={14} className="text-industrial-blue-500 animate-spin" />
                      )}
                      <span className={step.done ? 'text-gray-700' : 'text-gray-400'}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {uploadState.status === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Divider className="!my-4">解析结果预览</Divider>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatsCard
                      title="提取字段"
                      value={28}
                      suffix="项"
                      theme="blue"
                      icon={<Check size={18} />}
                    />
                    <StatsCard
                      title="工作经历"
                      value={2}
                      suffix="段"
                      theme="orange"
                      icon={<Briefcase size={18} />}
                    />
                    <StatsCard
                      title="技能识别"
                      value={8}
                      suffix="项"
                      theme="green"
                      icon={<Award size={18} />}
                    />
                    <StatsCard
                      title="置信度"
                      value={95}
                      suffix="%"
                      theme="purple"
                      icon={<Target size={18} />}
                    />
                  </div>

                  <div className="p-4 bg-success-50 rounded-lg border border-success-100">
                    <div className="flex items-start gap-2">
                      <Check size={18} className="text-success-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-success-700 mb-1">
                          简历解析成功！
                        </p>
                        <p className="text-sm text-success-600">
                          已自动将解析结果填入在线简历，请核对信息并进行必要的修改。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button>仅查看结果</Button>
                    <Button type="primary" onClick={() => setActiveTab('online')}>
                      应用到在线简历
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {uploadState.status === 'error' && (
                <div className="p-4 bg-danger-50 rounded-lg border border-danger-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-danger-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-danger-700 mb-1">
                        解析失败
                      </p>
                      <p className="text-sm text-danger-600">
                        无法识别文件内容，请检查文件是否损坏，或重新上传其他格式的简历。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-vital-orange-500 rounded-full inline-block" />
          <Zap size={18} className="text-vital-orange-500" />
          AI解析能力
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <User size={24} />, title: '个人信息', desc: '姓名、性别、联系方式、地址' },
            { icon: <Briefcase size={24} />, title: '工作经历', desc: '公司、职位、时间、业绩亮点' },
            { icon: <GraduationCap size={24} />, title: '教育背景', desc: '学校、专业、学历、时间' },
            { icon: <Award size={24} />, title: '技能证书', desc: '专业技能、资格证书、熟练度' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-gradient-to-br from-industrial-blue-50 to-transparent rounded-lg border border-industrial-blue-100"
            >
              <div className="w-12 h-12 rounded-xl bg-industrial-blue-100 flex items-center justify-center mb-3 text-industrial-blue-600">
                {item.icon}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderSkillMap = () => (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Brain size={22} className="text-industrial-blue-500" />
              技能图谱
            </h2>
            <p className="text-sm text-gray-500">
              可视化展示您的技能网络，发现学习成长路径
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-industrial-blue-50/30 rounded-xl p-4 border border-gray-100 min-h-[400px] relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full min-h-[360px]">
                {skillNodes.map((node, idx) => {
                  const angle = (idx / skillNodes.length) * Math.PI * 2;
                  const radius = 100 + (node.proficiency - 3) * 20;
                  const centerX = 50;
                  const centerY = 50;
                  const x = centerX + Math.cos(angle) * (radius / 4);
                  const y = centerY + Math.sin(angle) * (radius / 4);
                  const scheme = SKILL_CATEGORIES[node.category] || SKILL_CATEGORIES['通用技能'];
                  const size = 40 + node.proficiency * 8;

                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.08, type: 'spring', stiffness: 200 }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <Tooltip title={`${node.name} · ${node.category} · 熟练度 ${node.proficiency}/5`}>
                        <div
                          className={cn(
                            'rounded-full flex items-center justify-center transition-all duration-300',
                            'shadow-lg hover:shadow-xl hover:scale-110',
                            'bg-white border-2',
                            `hover:border-[${scheme.color}]`
                          )}
                          style={{
                            width: size,
                            height: size,
                            borderColor: scheme.color + '40',
                            boxShadow: `0 4px 16px ${scheme.color}30`,
                          }}
                        >
                          <div className="text-center">
                            <span
                              className="text-xs font-semibold block truncate px-2"
                              style={{ color: scheme.color }}
                            >
                              {node.name}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {node.proficiency}/5
                            </span>
                          </div>
                        </div>
                      </Tooltip>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: skillNodes.length * 0.08, type: 'spring', stiffness: 200 }}
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-20 h-20 rounded-full bg-industrial-gradient flex items-center justify-center shadow-industrial-lg">
                    <span className="text-white text-xs font-semibold text-center">
                      技能<br />中心
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 bg-white rounded-xl border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">技能分类</h4>
              <div className="space-y-2">
                {Object.entries(SKILL_CATEGORIES).map(([cat, scheme]) => {
                  const count = skillNodes.filter((n) => n.category === cat).length;
                  if (count === 0) return null;
                  const totalProficiency = skillNodes
                    .filter((n) => n.category === cat)
                    .reduce((sum, n) => sum + n.proficiency, 0);
                  const avg = (totalProficiency / count / 5) * 100;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: scheme.color }} />
                          <span className="text-gray-700 font-medium">{cat}</span>
                        </span>
                        <span className="text-gray-500">
                          {count}项 · {Math.round(avg)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${avg}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: scheme.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-vital-orange-50 to-transparent rounded-xl border border-vital-orange-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                <TrendingUp size={14} className="text-vital-orange-500" />
                技能综合评估
              </h4>
              <div className="flex items-center justify-center py-3">
                <MatchScoreRing
                  score={Math.round(
                    (skillNodes.reduce((s, n) => s + n.proficiency, 0) / (skillNodes.length * 5)) * 100
                  )}
                  size="lg"
                  label="综合评分"
                />
              </div>
              <p className="text-xs text-gray-600 text-center">
                您的技能体系较为完整，在机械制造领域具备较强竞争力
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-industrial-blue-500 rounded-full inline-block" />
          <Sparkles size={18} className="text-industrial-blue-500" />
          推荐学习路径
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedPaths.map((path, idx) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.1 }}
              className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 hover:shadow-card-hover hover:border-industrial-blue-200 transition-all group cursor-pointer"
            >
              <div className="absolute top-4 right-4">
                <Tag color="orange" className="!text-xs !m-0">
                  薪资提升 {path.salaryBoost}
                </Tag>
              </div>
              <div className="w-12 h-12 rounded-xl bg-industrial-blue-100 flex items-center justify-center mb-4 group-hover:bg-industrial-blue-200 transition-colors">
                <span className="text-xl font-bold text-industrial-blue-600">{idx + 1}</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-industrial-blue-600 transition-colors">
                {path.title}
              </h4>
              <p className="text-xs text-gray-500 mb-4">预计耗时 {path.duration}</p>

              <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                {path.steps.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <span className="text-xs px-2 py-1 bg-industrial-blue-50 text-industrial-blue-600 rounded whitespace-nowrap flex-shrink-0">
                      {step}
                    </span>
                    {sIdx < path.steps.length - 1 && (
                      <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">推荐课程：</p>
                <div className="flex flex-wrap gap-1">
                  {path.courses.map((c, cIdx) => (
                    <Tag key={cIdx} className="!text-[10px] !m-0">
                      {c}
                    </Tag>
                  ))}
                </div>
              </div>

              <Button block className="!h-9">
                查看详情
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 overflow-hidden"
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as TabKey)}
          size="large"
          items={[
            {
              key: 'online',
              label: (
                <span className="flex items-center gap-2 px-2">
                  <FileText size={16} />
                  在线简历
                </span>
              ),
            },
            {
              key: 'parser',
              label: (
                <span className="flex items-center gap-2 px-2">
                  <Upload size={16} />
                  附件解析
                </span>
              ),
            },
            {
              key: 'skillmap',
              label: (
                <span className="flex items-center gap-2 px-2">
                  <Brain size={16} />
                  技能图谱
                </span>
              ),
            },
          ]}
          className="!px-6"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'online' && renderOnlineResume()}
          {activeTab === 'parser' && renderParser()}
          {activeTab === 'skillmap' && renderSkillMap()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ResumePage;
