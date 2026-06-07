import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Spin, Empty, Modal } from 'antd';
import {
  EyeOutlined, FileTextOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';
import MatchRadarChart from '../../components/Charts/MatchRadarChart.jsx';

const SeekerApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/my-applications');
      setApplications(res.data.applications || []);
    } catch (e) {
      message.error('加载投递记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getSalaryText = (min, max) => {
    if (!min && !max) return '面议';
    return `${min / 1000}K-${max / 1000}K`;
  };

  const getStatusConfig = (status) => {
    const config = {
      applied: { text: '已投递', color: 'blue', icon: <ClockCircleOutlined /> },
      screening: { text: '初筛中', color: 'orange', icon: <ClockCircleOutlined /> },
      interview: { text: '面试中', color: 'purple', icon: <CalendarOutlined /> },
      offer: { text: '已发Offer', color: 'cyan', icon: <FileTextOutlined /> },
      hired: { text: '已入职', color: 'green', icon: <CheckCircleOutlined /> },
      rejected: { text: '已拒绝', color: 'red', icon: <ClockCircleOutlined /> },
    };
    return config[status] || config.applied;
  };

  const getAtsScoreClass = (score) => {
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
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

  const columns = [
    {
      title: '岗位信息',
      dataIndex: 'job_title',
      key: 'job',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${record.job_id}`)}>
            {text}
          </div>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
            {record.enterprise_name} · {record.category_name}
          </div>
        </div>
      ),
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_, record) => (
        <span className="salary-text" style={{ fontWeight: 600 }}>
          {getSalaryText(record.salary_min, record.salary_max)}
        </span>
      ),
    },
    {
      title: 'ATS评分',
      dataIndex: 'ats_score',
      key: 'ats',
      render: (score) => (
        score !== null && score !== undefined ? (
          <div style={{ textAlign: 'center' }}>
            <div className={`ats-score-circle ${getAtsScoreClass(score)}`}>
              {score}
            </div>
          </div>
        ) : <span style={{ color: '#8c8c8c' }}>待评分</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = getStatusConfig(status);
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.text}
          </Tag>
        );
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
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header">
        <h2>我的投递</h2>
        <Space>
          <Tag color="blue">共 {applications.length} 条投递记录</Tag>
        </Space>
      </div>

      <Card className="card-shadow">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : applications.length === 0 ? (
          <Empty
            description={
              <div>
                <p>暂无投递记录</p>
                <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                  去浏览岗位
                </Button>
              </div>
            }
          />
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
        title="投递详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : currentApp && (
          <div>
            <div className="match-score-highlight" style={{ marginBottom: 24, textAlign: 'center' }}>
              <Row gutter={24}>
                <Col span={8}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#1677ff' }}>
                    {currentApp.application.ats_score || '-'}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959' }}>ATS评分</div>
                </Col>
                <Col span={8}>
                  <Tag color={getStatusConfig(currentApp.application.status).color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {getStatusConfig(currentApp.application.status).text}
                  </Tag>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>当前状态</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fa541c' }}>
                    {getSalaryText(currentApp.application.salary_min, currentApp.application.salary_max)}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                    {currentApp.application.job_title}
                  </div>
                </Col>
              </Row>
            </div>

            {currentApp.application.ats_semantic_analysis && (
              <Card title="ATS 智能分析" size="small" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>关键词匹配</div>
                    <div>
                      {currentApp.application.ats_semantic_analysis.keyword_match?.matched?.map((k, i) => (
                        <Tag key={i} color="green" style={{ margin: 2 }}>{k}</Tag>
                      ))}
                    </div>
                    {currentApp.application.ats_semantic_analysis.keyword_match?.score !== undefined && (
                      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
                        匹配度：{currentApp.application.ats_semantic_analysis.keyword_match.score}%
                      </div>
                    )}
                  </Col>
                  <Col span={12}>
                    <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>语义分析</div>
                    <div style={{ color: '#595959', fontSize: 13 }}>
                      {currentApp.application.ats_semantic_analysis.semantic_analysis?.details}
                    </div>
                    {currentApp.application.ats_semantic_analysis.semantic_analysis?.score !== undefined && (
                      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
                        语义匹配度：{currentApp.application.ats_semantic_analysis.semantic_analysis.score}%
                      </div>
                    )}
                  </Col>
                </Row>

                {currentApp.application.ats_semantic_analysis.strengths?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ color: '#52c41a', fontSize: 13, marginBottom: 4 }}>✓ 优势匹配</div>
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
              </Card>
            )}

            {currentApp.interviews && currentApp.interviews.length > 0 && (
              <Card title="面试安排" size="small" style={{ marginBottom: 16 }}>
                {currentApp.interviews.map((iv, i) => (
                  <div key={i} style={{ padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8 }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>面试时间</div>
                        <div style={{ fontWeight: 600 }}>
                          {dayjs(iv.interview_time).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>面试方式</div>
                        <div>{iv.interview_method || '待确认'}</div>
                      </Col>
                    </Row>
                    {iv.location && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>面试地点</div>
                        <div>{iv.location}</div>
                      </div>
                    )}
                    {iv.remark && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>备注</div>
                        <div>{iv.remark}</div>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}

            {currentApp.resume && (
              <Card title="简历信息" size="small">
                {currentApp.resume.resume_title && (
                  <p style={{ marginBottom: 8 }}><strong>简历标题：</strong>{currentApp.resume.resume_title}</p>
                )}
                {currentApp.resume.skills?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>技能：</strong>
                    {currentApp.resume.skills.map((s, i) => (
                      <Tag key={i} color="blue" style={{ margin: 2 }}>{s}</Tag>
                    ))}
                  </div>
                )}
                {currentApp.certificates?.length > 0 && (
                  <div>
                    <strong>证书：</strong>
                    {currentApp.certificates.map((c, i) => (
                      <Tag key={i} color={c.verified ? 'green' : 'default'} style={{ margin: 2 }}>
                        {c.certificate_name}
                      </Tag>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SeekerApplications;
