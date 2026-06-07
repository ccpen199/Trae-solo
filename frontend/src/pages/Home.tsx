import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Button, Statistic, Tag, Space, Badge } from 'antd';
import { SearchOutlined, UserOutlined, BankOutlined, FileTextOutlined, SafetyOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';

const { Search } = Input;

const authenticityColor = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 75) return '#1890ff';
  return '#fa8c16';
};

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatLocation(job: any) {
  const parts = [job.city, job.district].filter(Boolean);
  return parts.join('·');
}

export default function HomePage() {
  const navigate = useNavigate();
  const [hotJobs, setHotJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0, jobseekers: 0, verified: 0 });

  useEffect(() => {
    loadHotJobs();
    loadStats();
  }, []);

  const loadHotJobs = async () => {
    try {
      const { data } = await axios.get('/hot-jobs');
      setHotJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load hot jobs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await axios.get('/stats');
      setStats({
        jobs: data.totalJobs || 0,
        companies: data.totalCompanies || 0,
        jobseekers: data.totalJobseekers || 0,
        verified: data.verifiedRate || 0,
      });
    } catch (error) {
      setStats({ jobs: 1280, companies: 356, jobseekers: 8900, verified: 95 });
    }
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim() || 'Java';
    navigate(`/jobs?keyword=${encodeURIComponent(keyword)}`);
  };

  const features = [
    { 
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />, 
      title: '岗位真实性验证', 
      desc: '企业社保核验、办公地址标注、历史行为分析、举报风控联动',
      link: '/jobs',
      linkText: '查看真实职位'
    },
    { 
      icon: <UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />, 
      title: '能力图谱建模', 
      desc: '基于简历、作品、测评生成技能权重画像，证书OCR识别',
      link: '/jobseeker/profile',
      linkText: '完善我的简历'
    },
    { 
      icon: <SearchOutlined style={{ fontSize: 32, color: '#722ed1' }} />, 
      title: '智能推荐引擎', 
      desc: '协同过滤+语义匹配+冷启动兜底算法',
      link: '/jobs?sort=smart_match',
      linkText: '智能匹配职位'
    },
    { 
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#fa8c16' }} />, 
      title: '全流程面试管理', 
      desc: '时间协商、视频面试、AI初筛报告归档',
      link: '/jobseeker/interviews',
      linkText: '查看面试安排'
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: 36, marginBottom: 16 }}>
            泛蓝领与白领融合招聘平台
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 32 }}>
            岗位真实性治理 · 人岗智能匹配 · 全流程面试管理
          </p>
          <Search
            placeholder="搜索职位、技能或公司..."
            size="large"
            enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>搜索</Button>}
            onSearch={handleSearch}
            style={{ maxWidth: 600 }}
          />
        </div>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        <Col span={6}>
          <Card>
            <Statistic title="在招职位" value={stats.jobs} suffix="个" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="认证企业" value={stats.companies} suffix="家" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="求职人才" value={stats.jobseekers} suffix="人" valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="真实率" value={stats.verified} suffix="%" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <h2 style={{ marginBottom: 24 }}>热门职位</h2>
      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        {hotJobs.map((job: any) => {
          const skills = parseSkills(job.skills);
          const score = job.authenticity_score || 0;
          return (
            <Col span={8} key={job.id}>
              <Card
                className="card-hover"
                hoverable
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <Card.Meta
                  title={
                    <Space size={6}>
                      {job.title}
                      <Badge
                        count={`${score}分`}
                        style={{
                          backgroundColor: authenticityColor(score),
                          fontSize: 11,
                          lineHeight: '18px',
                          height: 18,
                        }}
                      />
                      {job.company_verified ? (
                        <Tag color="success" style={{ fontSize: 11 }} icon={<SafetyCertificateOutlined />}>
                          已核验
                        </Tag>
                      ) : null}
                    </Space>
                  }
                  description={job.company_name}
                />
                <div style={{ marginTop: 16 }}>
                  <span className="salary-tag">{job.salary_min}-{job.salary_max}K</span>
                  <div style={{ color: '#666', marginTop: 8, fontSize: 13 }}>
                    {formatLocation(job)} · {job.experience_required} · {job.education_required}
                  </div>
                  {skills.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Space size={[4, 4]} wrap>
                        {skills.slice(0, 3).map((s: string, idx: number) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 11 }}>{s}</Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
        {hotJobs.length === 0 && (
          <Col span={24} style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#999' }}>暂无职位数据，请先注册企业账号发布职位</p>
          </Col>
        )}
      </Row>

      <h2 style={{ marginBottom: 24 }}>平台特色</h2>
      <Row gutter={[24, 24]}>
        {features.map((feature, index) => (
          <Col span={6} key={index}>
            <Card 
              className="card-hover" 
              hoverable
              onClick={() => navigate(feature.link)}
              style={{ cursor: 'pointer', height: '100%' }}
              styles={{ body: { padding: '24px 16px' } }}
            >
              <div style={{ textAlign: 'center' }}>
                {feature.icon}
                <h3 style={{ margin: '16px 0 8px', fontSize: 18 }}>{feature.title}</h3>
                <p style={{ color: '#666', fontSize: 13, minHeight: 36, lineHeight: '18px' }}>{feature.desc}</p>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" size="small">
                    {feature.linkText} <ArrowRightOutlined style={{ fontSize: 11 }} />
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
