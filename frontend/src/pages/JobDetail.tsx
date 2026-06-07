import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Descriptions, Divider, message, Modal, Select, Input, Progress, Space, Tooltip, List, Badge } from 'antd';
import { BankOutlined, EnvironmentOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, UserOutlined, HistoryOutlined, FileTextOutlined, BulbOutlined, AlertOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import axios from '../utils/axios';
import { useAuthStore } from '../store/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const workTypeMap: Record<string, string> = {
  fulltime: '全职',
  parttime: '兼职',
  intern: '实习',
};

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

function formatFullLocation(job: any) {
  const parts = [job.province, job.city, job.district, job.street, job.address].filter(Boolean);
  return parts.join(' ');
}

const reportReasons = [
  { value: '虚假薪资', label: '虚假薪资' },
  { value: '虚假地址', label: '虚假地址' },
  { value: '虚假公司', label: '虚假公司' },
  { value: '其他', label: '其他' },
];

const reportStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'warning' },
  processing: { label: '处理中', color: 'processing' },
  resolved: { label: '已解决', color: 'success' },
  rejected: { label: '已驳回', color: 'default' },
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [hiringHistory, setHiringHistory] = useState<any>(null);
  const [riskReports, setRiskReports] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    loadJobDetail();
    if (user?.role === 'jobseeker') {
      loadMatchExplanation();
    }
  }, [id, user]);

  useEffect(() => {
    if (job?.company_id) {
      loadHiringHistory(job.company_id);
    }
    if (id) {
      loadRiskReports(id);
    }
  }, [job]);

  const loadJobDetail = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/jobs/${id}`);
      setJob(data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHiringHistory = async (companyId: number) => {
    try {
      const { data } = await axios.get(`/company/${companyId}/hiring-history`);
      setHiringHistory(data);
    } catch (error) {
      console.error('Failed to load hiring history:', error);
    }
  };

  const loadRiskReports = async (targetId: string | number) => {
    try {
      const { data } = await axios.get('/reports', { params: { target_id: targetId, type: 'job' } });
      setRiskReports(data || []);
    } catch (error) {
      console.error('Failed to load risk reports:', error);
    }
  };

  const loadMatchExplanation = async () => {
    setLoadingMatch(true);
    try {
      const { data } = await axios.get(`/jobs/${id}/match-explanation`);
      setMatchData(data);
    } catch (error) {
      console.error('Failed to load match explanation:', error);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleApply = () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (user.role !== 'jobseeker') {
      message.warning('只有求职者可以申请职位');
      return;
    }

    Modal.confirm({
      title: '确认申请',
      content: '确定要申请这个职位吗？',
      onOk: async () => {
        setApplying(true);
        try {
          await axios.post(`/jobseeker/apply/${id}`);
          message.success('申请成功！HR会尽快查看您的简历');
        } catch (error: any) {
          message.error(error.response?.data?.error || '申请失败');
        } finally {
          setApplying(false);
        }
      }
    });
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      message.warning('请选择举报原因');
      return;
    }
    try {
      await axios.post('/report', {
        type: 'job',
        target_id: id,
        reason: reportReason,
        description: reportDesc || '用户举报',
      });
      message.success('举报已提交，我们会尽快处理');
      setReportVisible(false);
      setReportReason('');
      setReportDesc('');
      loadRiskReports(id!);
    } catch {
      message.error('举报失败');
    }
  };

  const openMap = () => {
    const address = formatFullLocation(job || {});
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://map.baidu.com/search/${encodedAddress}`, '_blank');
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#1890ff';
    return '#fa8c16';
  };

  if (!job && !loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>职位不存在或已被删除</div>;
  }

  const skills = parseSkills(job?.skills);
  const score = job?.authenticity_score || 0;

  return (
    <Row gutter={24}>
      <Col span={16}>
        <Card loading={loading}>
          <Row align="middle" style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Space size={8} align="center">
                <h1 style={{ margin: 0 }}>{job?.title}</h1>
                {job?.work_type && (
                  <Tag color="purple">{workTypeMap[job.work_type] || job.work_type}</Tag>
                )}
              </Space>
            </Col>
          </Row>
          <Row align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <span className="salary-tag" style={{ fontSize: 24 }}>{job?.salary_min}-{job?.salary_max}K</span>
              {job?.salary_negotiable && <Tag style={{ marginLeft: 8 }}>面议</Tag>}
            </Col>
            <Col style={{ marginLeft: 'auto' }}>
              <Space>
                <span style={{ color: '#999', fontSize: 13 }}>
                  <EyeOutlined /> {job?.view_count || 0}次浏览
                </span>
                <span style={{ color: '#999', fontSize: 13 }}>
                  <UserOutlined /> {job?.apply_count || 0}人申请
                </span>
              </Space>
              <Button type="primary" size="large" onClick={handleApply} loading={applying} style={{ marginLeft: 16 }}>
                立即申请
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setReportVisible(true)} icon={<ExclamationCircleOutlined />}>
                举报
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 8]} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <a onClick={openMap} style={{ cursor: 'pointer', color: 'inherit' }}>
                <EnvironmentOutlined style={{ color: '#1890ff' }} /> {formatFullLocation(job || {})}
                <Tag color="blue" style={{ marginLeft: 8 }}>查看地图</Tag>
              </a>
            </Col>
            <Col span={4}>
              经验：{job?.experience_required}
            </Col>
            <Col span={4}>
              学历：{job?.education_required}
            </Col>
            <Col span={4}>
              类型：{job?.work_type ? (workTypeMap[job.work_type] || job.work_type) : '全职'}
            </Col>
          </Row>

          {skills.length > 0 && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>技能标签</h3>
                <Space size={[8, 8]} wrap>
                  {skills.map((skill: string, index: number) => (
                    <Tag key={index} color="blue" style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}>
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </div>
              <Divider />
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <h3>职位描述</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
              {job?.description || '暂无描述'}
            </p>
          </div>

          <Divider />

          <div style={{ marginTop: 24 }}>
            <h3>任职要求</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
              {job?.requirements || '暂无要求'}
            </p>
          </div>
        </Card>

        {user?.role === 'jobseeker' && matchData && (
          <Card 
            title={
              <Space>
                <BulbOutlined style={{ color: '#1890ff' }} />
                匹配度分析
              </Space>
            } 
            style={{ marginTop: 24 }} 
            loading={loadingMatch}
          >
            <Row gutter={24}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Progress
                  type="dashboard"
                  percent={matchData.overall_match_score}
                  size={140}
                  strokeColor={getMatchColor(matchData.overall_match_score)}
                  format={(percent) => (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 600, color: getMatchColor(percent || 0) }}>
                        {percent}%
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>综合匹配度</div>
                    </div>
                  )}
                />
              </Col>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Space style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>技能匹配</span>
                    <Tag color="blue">{matchData.skill_match_percent}%</Tag>
                  </Space>
                  <Progress 
                    percent={matchData.skill_match_percent} 
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Space size={[4, 4]} wrap>
                      {matchData.matching_skills.map((skill: string, idx: number) => (
                        <Tag key={idx} color="success">
                          <CheckCircleOutlined /> {skill}
                        </Tag>
                      ))}
                      {matchData.gaps.map((skill: string, idx: number) => (
                        <Tag key={`gap-${idx}`} color="default">
                          <CloseCircleOutlined /> {skill}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Space>
                      <span style={{ fontWeight: 500 }}>经验匹配：</span>
                      {matchData.experience_match >= 80 ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>符合 {matchData.experience_match}%</Tag>
                      ) : (
                        <Tag color="warning" icon={<CloseCircleOutlined />}>待提升 {matchData.experience_match}%</Tag>
                      )}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <span style={{ fontWeight: 500 }}>学历匹配：</span>
                      {matchData.education_match >= 100 ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>符合 {matchData.education_match}%</Tag>
                      ) : (
                        <Tag color="warning" icon={<CloseCircleOutlined />}>待提升 {matchData.education_match}%</Tag>
                      )}
                    </Space>
                  </Col>
                </Row>

                {matchData.match_reason.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>
                      <CheckCircleOutlined /> 匹配优势
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                      {matchData.match_reason.map((reason: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchData.gaps.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#fa8c16' }}>
                      <AlertOutlined /> 待提升方向
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                      {matchData.gaps.map((gap: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        )}

        <Card 
          title={
            <Space>
              <HistoryOutlined style={{ color: '#1890ff' }} />
              风控复查记录
            </Space>
          } 
          style={{ marginTop: 24 }}
          extra={
            <Tooltip title="该职位的历史举报记录">
              <QuestionCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          }
        >
          {riskReports.length > 0 ? (
            <List
              dataSource={riskReports}
              renderItem={(item: any) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 20 }} />}
                    title={
                      <Space>
                        <span>{item.reason}</span>
                        <Badge 
                          status={reportStatusMap[item.status]?.color as any} 
                          text={reportStatusMap[item.status]?.label} 
                        />
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          举报人：{item.reporter_name || '匿名'} · {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </div>
                        {item.description && (
                          <div style={{ color: '#666', marginTop: 4 }}>{item.description}</div>
                        )}
                        {item.handling_notes && (
                          <div style={{ color: '#52c41a', marginTop: 4, fontSize: 12 }}>
                            处理备注：{item.handling_notes}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
              <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div>暂无风控复查记录</div>
            </div>
          )}
        </Card>
      </Col>

      <Col span={8}>
        <Card title="办公地址地图" style={{ marginBottom: 24 }}>
          <div 
            style={{ 
              height: 180, 
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 12
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <div style={{ marginTop: 8, color: '#666' }}>点击下方按钮查看地图</div>
            </div>
            <div 
              style={{ 
                position: 'absolute', 
                top: 16, 
                right: 16,
                width: 60,
                height: 40,
                background: '#fff',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#999',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              缩小
            </div>
          </div>
          <div style={{ marginBottom: 12, color: '#333' }}>
            <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {formatFullLocation(job || {})}
          </div>
          <Button 
            type="primary" 
            block 
            icon={<EnvironmentOutlined />}
            onClick={openMap}
          >
            查看地图
          </Button>
        </Card>

        <Card title="公司信息" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <BankOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <h3 style={{ marginTop: 12 }}>{job?.company_name}</h3>
          </div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="行业">{job?.company_industry}</Descriptions.Item>
            <Descriptions.Item label="规模">{job?.company_scale}</Descriptions.Item>
            <Descriptions.Item label="地址">{job?.address}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            {job?.company_verified ? (
              <Tag color="success" icon={<SafetyCertificateOutlined />}>企业已认证</Tag>
            ) : (
              <Tag color="warning">认证中</Tag>
            )}
          </div>
        </Card>

        <Card title="真实性核验" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Progress
              type="dashboard"
              percent={score}
              size={120}
              strokeColor={authenticityColor(score)}
              format={(percent) => (
                <span style={{ fontSize: 24, fontWeight: 600, color: authenticityColor(score || 0) }}>
                  {percent}
                </span>
              )}
            />
            <div style={{ marginTop: 8, color: '#666' }}>真实性评分</div>
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="社保核验">
              {job?.social_security_verified ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>已核验</Tag>
              ) : (
                <Tag color="warning" icon={<CloseCircleOutlined />}>未核验</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="地址核验">
              {job?.address ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>已标注</Tag>
              ) : (
                <Tag color="default" icon={<CloseCircleOutlined />}>未标注</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="企业认证">
              {job?.company_verified ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>已认证</Tag>
              ) : (
                <Tag color="warning" icon={<CloseCircleOutlined />}>未认证</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card 
          title={
            <Space>
              <HistoryOutlined style={{ color: '#1890ff' }} />
              历史招聘行为
            </Space>
          } 
          style={{ marginBottom: 24 }}
          loading={!hiringHistory}
        >
          {hiringHistory && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                    {hiringHistory.active_job_count}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>在招职位</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                    {hiringHistory.total_hired}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>累计招聘</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
                    {hiringHistory.avg_tenure_months}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>平均在职(月)</div>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ fontWeight: 500, marginBottom: 12 }}>最近招聘职位</div>
              {hiringHistory.recent_jobs && hiringHistory.recent_jobs.length > 0 ? (
                <List
                  size="small"
                  dataSource={hiringHistory.recent_jobs}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/jobs/${item.id}`)}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={
                          <div style={{ fontSize: 12 }}>
                            <span style={{ color: '#fa8c16' }}>{item.salary_min}-{item.salary_max}K</span>
                            <span style={{ color: '#999', marginLeft: 8 }}>
                              {dayjs(item.created_at).format('YYYY-MM-DD')}
                            </span>
                          </div>
                        }
                      />
                      <Tag color="blue">{item.apply_count || 0}人申请</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 12 }}>暂无最近招聘记录</div>
              )}
            </>
          )}
        </Card>
      </Col>

      <Modal
        title="举报职位"
        open={reportVisible}
        onOk={handleReportSubmit}
        onCancel={() => { setReportVisible(false); setReportReason(''); setReportDesc(''); }}
        okText="提交举报"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>举报原因</div>
          <Select
            placeholder="请选择举报原因"
            style={{ width: '100%' }}
            value={reportReason || undefined}
            onChange={(value) => setReportReason(value)}
          >
            {reportReasons.map(r => (
              <Option key={r.value} value={r.value}>{r.label}</Option>
            ))}
          </Select>
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>补充说明</div>
          <TextArea
            rows={4}
            placeholder="请详细描述举报原因..."
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
          />
        </div>
      </Modal>
    </Row>
  );
}
