import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, message, Spin, Empty,
  Modal, Select, Descriptions, Row, Col, List, Progress, Tag as AntTag
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined,
  CalendarOutlined, RedoOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';
import MatchRadarChart from '../../components/Charts/MatchRadarChart.jsx';

const { Option } = Select;

const EnterpriseApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState({ status: '', job_id: '' });
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/enterprises/my-jobs');
      setJobs(res.data.jobs || []);
    } catch (e) {
      // ignore
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.job_id) params.job_id = filter.job_id;
      const res = await api.get('/applications/for-enterprise', { params });
      setApplications(res.data.applications || []);
    } catch (e) {
      message.error('加载投递记录失败');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (app) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/applications/${app.id}`);
      setCurrentApp(res.data);
      setDetailVisible(true);
    } catch (e) {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      message.success('状态更新成功');
      fetchApplications();
      if (currentApp?.application?.id === appId) {
        viewDetail({ id: appId });
      }
    } catch (e) {
      message.error('操作失败');
    }
  };

  const rescore = async (appId) => {
    try {
      const res = await api.post(`/applications/${appId}/ats-rescore`);
      message.success(`重新评分完成，得分：${res.data.overallScore}`);
      fetchApplications();
      if (currentApp?.application?.id === appId) {
        viewDetail({ id: appId });
      }
    } catch (e) {
      message.error('评分失败');
    }
  };

  const getAtsScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  const getStatusConfig = (status) => {
    const config = {
      applied: { text: '已投递', color: 'blue' },
      screening: { text: '初筛中', color: 'orange' },
      interview: { text: '面试中', color: 'purple' },
      offer: { text: '已发Offer', color: 'cyan' },
      hired: { text: '已入职', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
    };
    return config[status] || config.applied;
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>
            {record.education} · {record.work_years}年经验
          </div>
        </div>
      ),
    },
    {
      title: '应聘岗位',
      dataIndex: 'job_title',
      key: 'job',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'ATS评分',
      dataIndex: 'ats_score',
      key: 'ats',
      render: (score) => (
        score !== null && score !== undefined ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`ats-score-circle ${getAtsScoreClass(score)}`} style={{ width: 48, height: 48, fontSize: 16 }}>
              {score}
            </div>
            <Progress
              type="circle"
              percent={score}
              size="small"
              width={36}
              strokeColor={score >= 70 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        ) : <Tag color="default">待评分</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = getStatusConfig(status);
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '投递时间',
      dataIndex: 'applied_at',
      key: 'time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            查看
          </Button>
          {record.status === 'screening' && (
            <>
              <Button
                type="link"
                icon={<CalendarOutlined />}
                onClick={() => {
                  updateStatus(record.id, 'interview');
                  navigate('/enterprise/interviews');
                }}
              >
                安排面试
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => updateStatus(record.id, 'rejected')}
              >
                淘汰
              </Button>
            </>
          )}
          {record.ats_score === null && (
            <Button type="link" icon={<RedoOutlined />} onClick={() => rescore(record.id)}>
              ATS评分
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header">
        <h2>简历初筛（ATS智能筛选）</h2>
        <Space>
          <Select
            placeholder="筛选岗位"
            style={{ width: 200 }}
            allowClear
            value={filter.job_id || undefined}
            onChange={(v) => setFilter(f => ({ ...f, job_id: v || '' }))}
          >
            {jobs.map(j => (
              <Option key={j.id} value={j.id}>{j.job_title}</Option>
            ))}
          </Select>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            value={filter.status || undefined}
            onChange={(v) => setFilter(f => ({ ...f, status: v || '' }))}
          >
            <Option value="applied">已投递</Option>
            <Option value="screening">初筛中</Option>
            <Option value="interview">面试中</Option>
            <Option value="offer">已发Offer</Option>
            <Option value="hired">已入职</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </Space>
      </div>

      <Card
        className="card-shadow"
        extra={
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            <FileTextOutlined style={{ marginRight: 4 }} />
            ATS自动进行关键词匹配 + 语义分析，帮助快速筛选优质候选人
          </div>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : applications.length === 0 ? (
          <Empty description="暂无投递记录" />
        ) : (
          <Table
            dataSource={applications}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条记录`,
            }}
          />
        )}
      </Card>

      <Modal
        title="候选人详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : currentApp && (
          <div>
            <div className="match-score-highlight" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div className={`ats-score-circle ${getAtsScoreClass(currentApp.application.ats_score)}`} style={{ margin: '0 auto' }}>
                    {currentApp.application.ats_score || '-'}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 8 }}>ATS综合评分</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{currentApp.application.name}</div>
                  <div style={{ color: '#8c8c8c' }}>
                    {currentApp.application.education} · {currentApp.application.work_years}年经验
                  </div>
                  <Tag color={getStatusConfig(currentApp.application.status).color} style={{ marginTop: 8 }}>
                    {getStatusConfig(currentApp.application.status).text}
                  </Tag>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{currentApp.application.job_title}</div>
                  <div style={{ color: '#fa541c', fontWeight: 600 }}>
                    {currentApp.application.salary_min / 1000}K-{currentApp.application.salary_max / 1000}K
                  </div>
                </Col>
              </Row>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="ATS 智能分析" size="small" style={{ marginBottom: 16 }}>
                  {currentApp.application.ats_semantic_analysis ? (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>关键词匹配</div>
                        {currentApp.application.ats_semantic_analysis.keyword_match?.matched?.length > 0 ? (
                          <div>
                            {currentApp.application.ats_semantic_analysis.keyword_match.matched.map((k, i) => (
                              <Tag key={i} color="green" style={{ margin: 2 }}>{k}</Tag>
                            ))}
                          </div>
                        ) : <span style={{ color: '#8c8c8c' }}>未匹配到关键词</span>}
                        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                          匹配度：{currentApp.application.ats_semantic_analysis.keyword_match?.score || 0}%
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>语义匹配</div>
                        <Progress
                          percent={currentApp.application.ats_semantic_analysis.semantic_analysis?.score || 0}
                          strokeColor="#1677ff"
                        />
                      </div>

                      {currentApp.application.ats_semantic_analysis.strengths?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ color: '#52c41a', fontSize: 13, marginBottom: 4 }}>✓ 优势</div>
                          {currentApp.application.ats_semantic_analysis.strengths.map((s, i) => (
                            <Tag key={i} color="green">{s}</Tag>
                          ))}
                        </div>
                      )}

                      {currentApp.application.ats_semantic_analysis.gaps?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ color: '#faad14', fontSize: 13, marginBottom: 4 }}>⚡ 待提升</div>
                          {currentApp.application.ats_semantic_analysis.gaps.map((g, i) => (
                            <Tag key={i} color="orange">{g}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c' }}>
                      暂无分析数据
                      <Button
                        type="link"
                        icon={<RedoOutlined />}
                        onClick={() => rescore(currentApp.application.id)}
                      >
                        立即分析
                      </Button>
                    </div>
                  )}
                </Card>

                <Card title="候选人信息" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="电话">{currentApp.application.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{currentApp.application.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="期望薪资">{currentApp.application.expected_salary_min || '-'}</Descriptions.Item>
                  </Descriptions>
                  {currentApp.resume && (
                    <div style={{ marginTop: 12 }}>
                      <Button type="link" onClick={() => navigate(`/resume/${currentApp.resume.id}`)}>
                        查看完整三维简历
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card title="简历内容" size="small">
                  {currentApp.resume?.skills?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>专业技能</div>
                      {currentApp.resume.skills.map((s, i) => (
                        <Tag key={i} color="blue" style={{ margin: 2 }}>{s}</Tag>
                      ))}
                    </div>
                  )}

                  {currentApp.certificates?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>技能证书</div>
                      {currentApp.certificates.map((c, i) => (
                        <Tag
                          key={i}
                          color={c.verified ? 'green' : 'default'}
                          style={{ margin: 2 }}
                        >
                          {c.certificate_name} {c.verified && '(已核验)'}
                        </Tag>
                      ))}
                    </div>
                  )}

                  {currentApp.resume?.work_experience?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>工作经历</div>
                      <List
                        size="small"
                        dataSource={currentApp.resume.work_experience}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              title={<strong>{item.position}</strong>}
                              description={
                                <div>
                                  <div>{item.company} · {item.start_date} - {item.end_date || '至今'}</div>
                                  <div style={{ color: '#595959', marginTop: 4 }}>{item.description}</div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}

                  {currentApp.resume?.project_experience?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>项目经验</div>
                      <List
                        size="small"
                        dataSource={currentApp.resume.project_experience}
                        renderItem={item => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space>
                                  <strong>{item.project_name}</strong>
                                  <Tag color="orange">{item.role}</Tag>
                                </Space>
                              }
                              description={
                                <div>
                                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{item.start_date} - {item.end_date || '至今'}</div>
                                  <div style={{ color: '#595959', marginTop: 4 }}>{item.description}</div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Space wrap>
                {currentApp.application.status === 'screening' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CalendarOutlined />}
                      onClick={() => {
                        updateStatus(currentApp.application.id, 'interview');
                        setDetailVisible(false);
                        navigate('/enterprise/interviews');
                      }}
                    >
                      安排面试
                    </Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => updateStatus(currentApp.application.id, 'rejected')}
                    >
                      淘汰
                    </Button>
                  </>
                )}
                {currentApp.application.status === 'interview' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => updateStatus(currentApp.application.id, 'offer')}
                    >
                      发Offer
                    </Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => updateStatus(currentApp.application.id, 'rejected')}
                    >
                      淘汰
                    </Button>
                  </>
                )}
                {currentApp.application.status === 'offer' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => updateStatus(currentApp.application.id, 'hired')}
                  >
                    确认入职
                  </Button>
                )}
                <Button icon={<RedoOutlined />} onClick={() => rescore(currentApp.application.id)}>
                  重新ATS评分
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnterpriseApplications;
