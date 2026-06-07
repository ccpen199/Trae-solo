import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Descriptions, Row, Col, message, Spin, Divider, Modal, Alert, Progress, List, Badge } from 'antd';
import {
  ArrowLeftOutlined, SendOutlined, BarChartOutlined, CheckCircleOutlined,
  WarningOutlined, ScanOutlined, VideoCameraOutlined, LinkOutlined,
  FileTextOutlined, TrophyOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import MatchRadarChart from '../components/Charts/MatchRadarChart.jsx';
import dayjs from 'dayjs';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [job, setJob] = useState(null);
  const [salaryCompliance, setSalaryCompliance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    fetchJobDetail();
    if (user?.role === 'jobseeker') {
      fetchResumeInfo();
    }
  }, [id, user]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data.job);
      setSalaryCompliance(res.data.salaryCompliance);
    } catch (e) {
      message.error('加载岗位详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeInfo = async () => {
    setResumeLoading(true);
    try {
      const res = await api.get('/job-seekers/profile');
      setResumeInfo(res.data.resume);
    } catch (e) {
      // ignore
    } finally {
      setResumeLoading(false);
    }
  };

  const getResumeCompleteness = () => {
    if (!resumeInfo) return { score: 0, missing: [] };
    const missing = [];
    let score = 0;

    if (resumeInfo.resume_title) score += 10;
    else missing.push('简历标题');

    if (resumeInfo.skills?.length > 0) score += 15;
    else missing.push('技能标签');

    if (resumeInfo.work_experience?.length > 0) score += 25;
    else missing.push('工作经历');

    if (resumeInfo.education_experience?.length > 0) score += 15;
    else missing.push('教育经历');

    if (resumeInfo.project_experience?.length > 0) score += 15;
    else missing.push('项目经验');

    if (resumeInfo.project_videos || resumeInfo.portfolio_url) score += 10;
    else missing.push('作品集/视频');

    if (resumeInfo.certificates?.length > 0) score += 10;
    else missing.push('技能证书');

    return { score: Math.min(score, 100), missing };
  };

  const getSalaryText = (min, max) => {
    if (!min && !max) return '面议';
    if (min === max) return `${min / 1000}K`;
    return `${min / 1000}K-${max / 1000}K`;
  };

  const handleApply = async () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (user.role !== 'jobseeker') {
      message.warning('只有求职者可以投递简历');
      return;
    }

    const completeness = getResumeCompleteness();
    const missingItems = completeness.missing;

    Modal.confirm({
      title: `简历完整度 ${completeness.score}%`,
      width: 600,
      content: (
        <div>
          <Progress percent={completeness.score} status={completeness.score >= 70 ? 'success' : completeness.score >= 50 ? 'normal' : 'exception'} style={{ marginBottom: 16 }} />
          {missingItems.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="建议完善以下信息以提高投递成功率"
              description={
                <List size="small" dataSource={missingItems} renderItem={item => <List.Item>{item}</List.Item>} />
              }
              style={{ marginBottom: 16 }}
            />
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button size="small" icon={<FileTextOutlined />} onClick={() => navigate('/seeker/resume')}>
              完善三维简历
            </Button>
            <Button size="small" icon={<TrophyOutlined />} onClick={() => navigate('/seeker/certificates')}>
              添加技能证书
            </Button>
          </div>
          <Divider orientation="left" orientationMargin={0}>投递说明</Divider>
          <p style={{ color: '#595959', marginBottom: 0 }}>
            确定要投递「{job.job_title}」岗位吗？系统将自动进行ATS智能初筛，包括：
          </p>
          <List size="small" style={{ marginTop: 8 }}>
            <List.Item>• 关键词匹配度分析</List.Item>
            <List.Item>• 语义相似度计算</List.Item>
            <List.Item>• 技能证书核验</List.Item>
            <List.Item>• 能力模型匹配</List.Item>
          </List>
        </div>
      ),
      okText: '确认投递',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await api.post('/applications', { job_id: job.id });
          message.success(`投递成功！ATS评分：${res.data.atsResult.overallScore}分`);
          setTimeout(() => navigate('/seeker/applications'), 1500);
        } catch (e) {
          message.error(e.response?.data?.error || '投递失败');
        }
      },
    });
  };

  const handleCheckMatch = async () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (user.role !== 'jobseeker') {
      message.warning('只有求职者可以查看匹配度');
      return;
    }

    setMatchLoading(true);
    try {
      const res = await api.get(`/job-seekers/match/${job.id}`);
      setMatchResult(res.data);
      setShowMatchModal(true);
    } catch (e) {
      message.error(e.response?.data?.error || '获取匹配度失败');
    } finally {
      setMatchLoading(false);
    }
  };

  if (loading || !job) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="card-shadow">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px 0' }}>
                  {job.job_title}
                </h1>
                <div style={{ marginBottom: 12 }}>
                  <Tag color="blue">{job.parent_category_name} / {job.category_name}</Tag>
                  <Tag color="#f0f0f0" style={{ color: '#8c8c8c', fontFamily: 'monospace', fontSize: 11 }}>
                    {job.category_code}
                  </Tag>
                  <Tag>{job.city}</Tag>
                  <Tag>{job.work_experience_required}</Tag>
                  <Tag>{job.education_required}</Tag>
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 14 }}>
                  发布于 {dayjs(job.created_at).format('YYYY-MM-DD')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="salary-text" style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                  {getSalaryText(job.salary_min, job.salary_max)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Badge
                    status={salaryCompliance?.checked ? (salaryCompliance?.compliant ? 'success' : 'warning') : 'default'}
                    text={
                      salaryCompliance?.checked
                        ? (salaryCompliance?.compliant ? '薪酬合规' : '需复核')
                        : '待校验'
                    }
                  />
                </div>
                {salaryCompliance?.reference && (
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    行业参考：{salaryCompliance.reference.min / 1000}K-{salaryCompliance.reference.max / 1000}K
                    <span style={{ marginLeft: 8 }}>({salaryCompliance.reference.work_years})</span>
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {salaryCompliance && (
              <Card
                size="small"
                style={{ marginBottom: 24 }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                    薪酬合规校验
                  </div>
                }
                extra={
                  <Tag color={salaryCompliance.compliant ? 'green' : 'orange'}>
                    {salaryCompliance.checked ? (salaryCompliance.compliant ? '校验通过' : '存在异常') : '待校验'}
                  </Tag>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="校验依据">
                        制造业薪酬参考数据库
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {job.city} · {job.work_experience_required}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="参考区间">
                        <span style={{ fontWeight: 600, color: '#1677ff' }}>
                          {salaryCompliance.reference ? `${salaryCompliance.reference.min / 1000}K-${salaryCompliance.reference.max / 1000}K` : '暂无参考数据'}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="企业报价">
                        {getSalaryText(job.salary_min, job.salary_max)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="复核状态">
                        {salaryCompliance.checked ? (
                          <span style={{ color: salaryCompliance.compliant ? '#52c41a' : '#faad14' }}>
                            {salaryCompliance.compliant ? (
                              <span><CheckCircleOutlined /> 已通过系统自动复核</span>
                            ) : (
                              <span><WarningOutlined /> 需人工复核</span>
                            )}
                          </span>
                        ) : '未复核'}
                      </Descriptions.Item>
                      <Descriptions.Item label="校验说明">
                        {salaryCompliance.remark || '薪酬区间符合行业标准'}
                      </Descriptions.Item>
                    </Descriptions>
                    {salaryCompliance.issues?.length > 0 && (
                      <Alert
                        type="warning"
                        showIcon
                        size="small"
                        message="异常处理记录"
                        description={
                          <List size="small" dataSource={salaryCompliance.issues} renderItem={item => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                              {item}
                            </List.Item>
                          )} />
                        }
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            <div className="section-title">岗位职责</div>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#262626', marginBottom: 24 }}>
              {job.job_description}
            </p>

            <div className="section-title">任职要求</div>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#262626', marginBottom: 24 }}>
              {job.requirements}
            </p>

            {job.ability_model && (
              <div>
                <div className="section-title">能力模型</div>
                <Row gutter={[16, 16]}>
                  {job.ability_model.technical && (
                    <Col span={8}>
                      <Card size="small" title="技术技能" style={{ background: '#f6ffed' }}>
                        {job.ability_model.technical.map((s, i) => (
                          <Tag key={i} color="green" style={{ margin: '4px' }}>{s}</Tag>
                        ))}
                      </Card>
                    </Col>
                  )}
                  {job.ability_model.experience && (
                    <Col span={8}>
                      <Card size="small" title="经验要求" style={{ background: '#e6f7ff' }}>
                        {job.ability_model.experience.map((s, i) => (
                          <Tag key={i} color="blue" style={{ margin: '4px' }}>{s}</Tag>
                        ))}
                      </Card>
                    </Col>
                  )}
                  {job.ability_model.soft && (
                    <Col span={8}>
                      <Card size="small" title="软技能" style={{ background: '#fff7e6' }}>
                        {job.ability_model.soft.map((s, i) => (
                          <Tag key={i} color="orange" style={{ margin: '4px' }}>{s}</Tag>
                        ))}
                      </Card>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="card-shadow" style={{ marginBottom: 16 }}>
            <div className="section-title">企业信息</div>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="企业名称">{job.enterprise_name}</Descriptions.Item>
              <Descriptions.Item label="所属行业">{job.industry || '-'}</Descriptions.Item>
              <Descriptions.Item label="企业规模">{job.scale || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司地址">{job.address || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {user?.role === 'jobseeker' && resumeInfo && (
            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <div className="section-title">简历完整度</div>
              <Progress
                percent={getResumeCompleteness().score}
                status={getResumeCompleteness().score >= 70 ? 'success' : getResumeCompleteness().score >= 50 ? 'normal' : 'exception'}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button size="small" icon={<FileTextOutlined />} onClick={() => navigate('/seeker/resume')}>
                  完善三维简历
                </Button>
                <Button size="small" icon={<TrophyOutlined />} onClick={() => navigate('/seeker/certificates')}>
                  技能证书
                </Button>
              </div>
            </Card>
          )}

          <Card className="card-shadow" style={{ marginBottom: 16 }}>
            <div className="section-title">求职能力提升</div>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    if (user.role === 'jobseeker') navigate('/seeker/certificates');
                    else message.warning('仅求职者可使用');
                  }}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
                >
                  <div style={{ fontSize: 24, color: '#1677ff', marginBottom: 4 }}>
                    <ScanOutlined />
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>技能证书OCR</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    if (user.role === 'jobseeker') navigate('/seeker/resume');
                    else message.warning('仅求职者可使用');
                  }}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
                >
                  <div style={{ fontSize: 24, color: '#722ed1', marginBottom: 4 }}>
                    <VideoCameraOutlined />
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>项目视频</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => {
                    if (!user) { navigate('/login'); return; }
                    if (user.role === 'jobseeker') navigate('/seeker/resume');
                    else message.warning('仅求职者可使用');
                  }}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
                >
                  <div style={{ fontSize: 24, color: '#fa8c16', marginBottom: 4 }}>
                    <LinkOutlined />
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>作品集链接</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  hoverable
                  onClick={handleCheckMatch}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
                >
                  <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 4 }}>
                    <BarChartOutlined />
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>匹配度分析</div>
                </Card>
              </Col>
            </Row>
          </Card>

          <Card className="card-shadow">
            <div className="section-title">求职操作</div>
            
            {user?.role === 'jobseeker' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleApply}
                  style={{ height: 48, fontSize: 16 }}
                >
                  立即投递
                </Button>
                <Button
                  size="large"
                  icon={<BarChartOutlined />}
                  loading={matchLoading}
                  onClick={handleCheckMatch}
                >
                  查看岗位匹配度
                </Button>
              </div>
            )}

            {!user && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#8c8c8c', marginBottom: 16 }}>登录后可投递简历并查看匹配度</p>
                <Button type="primary" onClick={() => navigate('/login')}>
                  立即登录
                </Button>
              </div>
            )}

            {user?.role !== 'jobseeker' && user && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
                企业HR和管理员不可投递简历
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="岗位匹配度分析"
        open={showMatchModal}
        onCancel={() => setShowMatchModal(false)}
        footer={null}
        width={600}
      >
        {matchResult && (
          <div>
            <div className="match-score-highlight" style={{ marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#1677ff' }}>
                {matchResult.overallScore}
              </div>
              <div style={{ fontSize: 14, color: '#595959' }}>综合匹配度</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <MatchRadarChart dimensions={matchResult.dimensions} />
            </div>

            <Row gutter={[8, 8]}>
              {matchResult.dimensions.map((dim, i) => (
                <Col span={12} key={i}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{dim.name}</span>
                      <span style={{
                        color: dim.score >= 70 ? '#52c41a' : dim.score >= 50 ? '#faad14' : '#ff4d4f',
                        fontWeight: 600,
                      }}>
                        {dim.score}%
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobDetail;
