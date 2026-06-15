import React, { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Input,
  Select,
  Tag,
  Space,
  Button,
  Avatar,
  Badge,
  Table,
  Tooltip,
  Progress,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  DownloadOutlined,
  SafetyCertificateOutlined,
  FilterOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Users, Activity, Target, Zap, Clock, Star } from 'lucide-react';
import { mockData } from '@/mock/data';
import { TOWNSHIP_NAMES } from '@/mock/townships';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import type { RPOProject, TalentCandidate } from '../../../shared/types';

const { Option } = Select;

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';

const STAGES = [
  '需求确认', '寻访中', '初筛', '推荐面试', '面试中',
  'Offer阶段', '入职阶段', '保用期',
];

const STAGE_COLORS: Record<string, string> = {
  需求确认: '#E5E6EB',
  寻访中: '#165DFF',
  初筛: '#14C9C9',
  推荐面试: '#722ED1',
  面试中: '#FF7D00',
  Offer阶段: '#00B42A',
  入职阶段: '#F7BA1E',
  保用期: '#F53F3F',
};

const STATUS_COLOR: Record<string, string> = {
  需求确认: 'default',
  寻访中: 'processing',
  初筛: 'blue',
  推荐面试: 'purple',
  面试中: 'warning',
  Offer阶段: 'success',
  入职阶段: 'gold',
  保用期: 'error',
  已完成: 'success',
};

const BG_RESULT_COLOR: Record<string, string> = {
  优秀: 'success',
  良好: 'blue',
  合格: 'default',
  不合格: 'error',
};

function ProjectGanttView() {
  const { rpoProjects } = mockData;

  const totalDays = 120;
  const dayWidth = 4;
  const chartWidth = totalDays * dayWidth;

  const getStageOffsets = (project: RPOProject) => {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.deadline);
    const projectDuration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const currentStageIdx = STAGES.indexOf(project.status === '已完成' ? STAGES[STAGES.length - 1] : project.status);

    return STAGES.map((stage, idx) => {
      const stageDuration = projectDuration / STAGES.length;
      const startOffset = idx * stageDuration;
      const isActive = idx <= currentStageIdx;
      const isCurrent = idx === currentStageIdx && project.status !== '已完成';
      return {
        stage,
        left: (startOffset / totalDays) * chartWidth,
        width: (stageDuration / totalDays) * chartWidth,
        color: STAGE_COLORS[stage],
        isActive,
        isCurrent,
      };
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div
          className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10"
          style={{ paddingLeft: 220 }}
        >
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="text-xs text-gray-500 py-2 px-1 text-center flex-shrink-0"
              style={{ width: chartWidth / STAGES.length }}
            >
              {stage}
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-100">
          {rpoProjects.slice(0, 12).map((project) => {
            const progress = Math.round((project.filledCount / Math.max(1, project.headcount)) * 100);
            const stageOffsets = getStageOffsets(project);
            return (
              <div
                key={project.id}
                className="flex items-center hover:bg-blue-50/40 transition-colors py-3"
              >
                <div className="w-[220px] flex-shrink-0 pr-4">
                  <div className="font-medium text-gray-800 text-sm truncate">{project.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color={STATUS_COLOR[project.status] || 'default'} className="!text-xs !py-0 !px-1.5 m-0">
                      {project.status}
                    </Tag>
                    {project.priority === '加急' && <Tag color="error" className="!text-xs !py-0 !px-1.5 m-0">加急</Tag>}
                    {project.priority === '特急' && <Tag color="error" className="!text-xs !py-0 !px-1.5 m-0">特急</Tag>}
                  </div>
                </div>
                <div className="relative flex-1 h-10 flex items-center">
                  {stageOffsets.map((so, idx) => (
                    <Tooltip key={idx} title={so.stage}>
                      <div
                        className="absolute h-6 rounded-sm transition-all hover:opacity-80 cursor-pointer"
                        style={{
                          left: so.left,
                          width: Math.max(so.width - 2, 10),
                          backgroundColor: so.isActive ? so.color : '#F2F3F5',
                          opacity: so.isCurrent ? 1 : so.isActive ? 0.7 : 0.4,
                          border: so.isCurrent ? `2px solid ${so.color}` : 'none',
                        }}
                      />
                    </Tooltip>
                  ))}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-600 bg-white/90 px-1.5 py-0.5 rounded">
                    <UserOutlined />
                    {project.filledCount}/{project.headcount}
                    <span className="ml-1" style={{ color: INDUSTRIAL_BLUE }}>({progress}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TalentPoolView() {
  const { rpoProjects, jobSeekers, matchResults } = mockData;
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = ['高匹配', '活跃度高', '技术强', '经验丰富', '本科以上', '本地人才'];
  const stageOptions = ['待推荐', '已推荐', '面试中', '已发Offer', '已入职'];

  const talentCandidates = useMemo(() => {
    const candidates: (TalentCandidate & {
      jobSeekerName?: string;
      projectName?: string;
      avatar?: string;
      gender?: string;
      age?: number;
    })[] = [];

    rpoProjects.slice(0, 6).forEach((project, pIdx) => {
      const poolCandidates = project.candidates || [];
      const count = Math.min(poolCandidates.length || 4, 6);

      for (let i = 0; i < count; i++) {
        const cand = poolCandidates[i];
        const jsIdx = pIdx * 6 + i;
        const js = jobSeekers[jsIdx % jobSeekers.length];
        const match = matchResults.find((m) => m.jobSeekerId === js?.id);

        if (cand) {
          candidates.push({
            ...cand,
            jobSeekerName: js?.name,
            projectName: project.name,
            avatar: js?.avatar,
            gender: js?.gender,
            age: js?.age,
            matchScore: cand.matchScore || match?.overallScore || Math.round(Math.random() * 30 + 60),
            stage: cand.stage || ['待推荐', '已推荐', '面试中', '已发Offer', '已入职'][i % 5],
            tags: cand.tags.length > 0 ? cand.tags : allTags.slice(0, 2 + (i % 3)),
          });
        }
      }
    });

    return candidates;
  }, [rpoProjects, jobSeekers, matchResults]);

  const filteredCandidates = useMemo(() => {
    return talentCandidates.filter((c) => {
      if (searchText && !(c.jobSeekerName || '').toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [talentCandidates, searchText]);

  return (
    <div className="space-y-4">
      <Card className="!rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <Input
            placeholder="搜索候选人姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 260 }}
          />
          <Select
            mode="multiple"
            placeholder="标签筛选"
            allowClear
            style={{ minWidth: 260, flex: 1 }}
            value={selectedTags}
            onChange={setSelectedTags}
          >
            {allTags.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
          <Select placeholder="阶段筛选" allowClear style={{ width: 150 }}>
            {stageOptions.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </div>
      </Card>

      {filteredCandidates.length === 0 ? (
        <Card className="!rounded-xl">
          <Empty description="暂无匹配的候选人" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCandidates.map((cand, idx) => (
            <Card
              key={cand.id || idx}
              className="!rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  size={48}
                  style={{ backgroundColor: INDUSTRIAL_BLUE, fontWeight: 600 }}
                >
                  {(cand.jobSeekerName || '?')[0]}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 truncate">
                      {cand.jobSeekerName}
                    </span>
                    <MatchScoreRing
                      score={cand.matchScore || 75}
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {cand.gender} · {cand.age}岁 · 活跃度 {cand.activityScore || 85}%
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {(cand.tags || []).slice(0, 4).map((tag, ti) => (
                  <Tag key={ti} color="blue" className="!text-xs !py-0 !px-1.5 m-0">
                    {tag}
                  </Tag>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <Tag color={STATUS_COLOR[cand.stage] || 'default'} className="!text-xs !py-0 !px-1.5 m-0">
                  {cand.stage}
                </Tag>
                <span className="text-xs text-gray-400 truncate max-w-[140px]">
                  {cand.projectName}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BackgroundCheckView() {
  const { rpoProjects, jobSeekers } = mockData;

  const bgData = useMemo(() => {
    const data: any[] = [];
    rpoProjects.slice(0, 8).forEach((project, pIdx) => {
      for (let i = 0; i < 2; i++) {
        const jsIdx = pIdx * 2 + i;
        const js = jobSeekers[jsIdx % jobSeekers.length];
        const levels: any[] = ['优秀', '良好', '合格', '不合格'];
        data.push({
          key: `${project.id}-${i}`,
          candidateName: js?.name || `候选人${jsIdx + 1}`,
          candidateId: js?.id,
          projectName: project.name,
          resultLevel: levels[(pIdx + i) % 4],
          checkedAt: new Date(Date.now() - (pIdx + i) * 86400000 * 3).toLocaleDateString('zh-CN'),
          operator: ['李顾问', '王顾问', '张顾问', '陈顾问'][(pIdx + i) % 4],
        });
      }
    });
    return data;
  }, [rpoProjects, jobSeekers]);

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar size={28} style={{ backgroundColor: INDUSTRIAL_BLUE }}>
            {text[0]}
          </Avatar>
          <div>
            <div className="font-medium text-sm text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">{record.candidateId}</div>
          </div>
        </div>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => (
        <span className="text-sm text-gray-700 truncate max-w-[200px] block">{text}</span>
      ),
    },
    {
      title: '背调结果',
      dataIndex: 'resultLevel',
      key: 'resultLevel',
      render: (level: string) => (
        <Tag color={BG_RESULT_COLOR[level]} icon={<SafetyCertificateOutlined />} className="!text-xs">
          {level}
        </Tag>
      ),
    },
    {
      title: '背调时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      render: (t: string) => <span className="text-sm text-gray-600">{t}</span>,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      render: (t: string) => <span className="text-sm text-gray-600">{t}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<FileTextOutlined />}>
            授权书
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            下载报告
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card className="!rounded-xl" styles={{ body: { padding: 0 } }}>
      <Table
        columns={columns}
        dataSource={bgData}
        pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条背调记录` }}
      />
    </Card>
  );
}

export default function Rpo() {
  const [activeTab, setActiveTab] = useState('gantt');

  const tabItems = [
    {
      key: 'gantt',
      label: (
        <span>
          <Clock size={14} className="inline mr-1.5" />
          项目看板
        </span>
      ),
    },
    {
      key: 'talent',
      label: (
        <span>
          <Users size={14} className="inline mr-1.5" />
          人才池
        </span>
      ),
    },
    {
      key: 'bgcheck',
      label: (
        <span>
          <SafetyCertificateOutlined className="mr-1.5" />
          背调归档
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-industrial-blue-100 flex items-center justify-center">
              <Target size={20} style={{ color: INDUSTRIAL_BLUE }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{mockData.rpoProjects.length}</div>
              <div className="text-xs text-gray-500">进行中项目</div>
            </div>
          </div>
        </Card>
        <Card className="!rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-vital-orange-100 flex items-center justify-center">
              <Activity size={20} style={{ color: VITAL_ORANGE }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">128</div>
              <div className="text-xs text-gray-500">活跃候选人数</div>
            </div>
          </div>
        </Card>
        <Card className="!rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <Star size={20} className="text-success-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">46</div>
              <div className="text-xs text-gray-500">本月入职人数</div>
            </div>
          </div>
        </Card>
        <Card className="!rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">92%</div>
              <div className="text-xs text-gray-500">保用期通过率</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="!rounded-xl" styles={{ body: { padding: '12px 0 0 0' } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16 }}
        />
        <div className="px-4 pb-4 pt-2">
          {activeTab === 'gantt' && <ProjectGanttView />}
          {activeTab === 'talent' && <TalentPoolView />}
          {activeTab === 'bgcheck' && <BackgroundCheckView />}
        </div>
      </Card>
    </div>
  );
}
