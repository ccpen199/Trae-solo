import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message, Modal, Progress, Descriptions, List, Row, Col } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

interface MatchExplanation {
  overall_score: number;
  skill_match: {
    score: number;
    matched_skills: string[];
    missing_skills: string[];
  };
  experience_match: {
    score: number;
    details: string;
  };
  education_match: {
    score: number;
    details: string;
  };
  salary_match: {
    score: number;
    details: string;
  };
  location_match: {
    score: number;
    details: string;
  };
  suggestions: string[];
}

export default function JobseekerApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchExplanation, setMatchExplanation] = useState<MatchExplanation | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/jobseeker/applications');
      setApplications(data || []);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMatch = async (record: any) => {
    setMatchLoading(true);
    setMatchModalVisible(true);
    try {
      const { data } = await axios.get(`/jobs/${record.job_id}/match-explanation`);
      setMatchExplanation(data);
    } catch (error) {
      message.error('加载匹配分析失败');
    } finally {
      setMatchLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    viewed: 'processing',
    interview: 'blue',
    offer: 'success',
    rejected: 'error',
    hired: 'success'
  };

  const statusLabels: Record<string, string> = {
    pending: '待查看',
    viewed: '已查看',
    interview: '面试中',
    offer: '已录用',
    rejected: '未通过',
    hired: '已入职'
  };

  const columns = [
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/jobs/${record.job_id}`)}>{text}</a>
      )
    },
    {
      title: '公司',
      dataIndex: 'company_name',
      key: 'company_name'
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_: any, record: any) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>
          {record.salary_min}-{record.salary_max}K
        </span>
      )
    },
    {
      title: '地点',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: '匹配度',
      dataIndex: 'match_score',
      key: 'match_score',
      render: (score: number) => {
        if (score === undefined || score === null) {
          return <Tag color="default">待计算</Tag>;
        }
        return (
          <Space direction="vertical" size={0} style={{ width: 100 }}>
            <Progress
              percent={score}
              size="small"
              strokeColor={getScoreColor(score)}
              showInfo={false}
            />
            <span style={{ color: getScoreColor(score), fontWeight: 'bold', fontSize: 12 }}>
              {score}%
            </span>
          </Space>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: 'HR备注',
      dataIndex: 'hr_remark',
      key: 'hr_remark',
      render: (text: string) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<BarChartOutlined />}
          onClick={() => handleViewMatch(record)}
        >
          查看匹配分析
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card title="我的申请">
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={<span><BarChartOutlined style={{ marginRight: 8 }} />职位匹配分析</span>}
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={null}
        width={700}
        confirmLoading={matchLoading}
      >
        {matchLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : matchExplanation ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress
                type="circle"
                percent={matchExplanation.overall_score}
                format={(percent) => `${percent}分`}
                strokeColor={getScoreColor(matchExplanation.overall_score)}
                size={120}
              />
              <div style={{ marginTop: 8, fontSize: 16, fontWeight: 'bold' }}>综合匹配度</div>
            </div>

            <Descriptions column={3} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="技能匹配">
                <span style={{ color: getScoreColor(matchExplanation.skill_match.score), fontWeight: 'bold' }}>
                  {matchExplanation.skill_match.score}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="经验匹配">
                <span style={{ color: getScoreColor(matchExplanation.experience_match.score), fontWeight: 'bold' }}>
                  {matchExplanation.experience_match.score}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="学历匹配">
                <span style={{ color: getScoreColor(matchExplanation.education_match.score), fontWeight: 'bold' }}>
                  {matchExplanation.education_match.score}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="薪资匹配">
                <span style={{ color: getScoreColor(matchExplanation.salary_match.score), fontWeight: 'bold' }}>
                  {matchExplanation.salary_match.score}分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="地点匹配">
                <span style={{ color: getScoreColor(matchExplanation.location_match.score), fontWeight: 'bold' }}>
                  {matchExplanation.location_match.score}分
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="技能分析" style={{ marginBottom: 16 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#52c41a' }}>已匹配技能</div>
                  <Space wrap>
                    {matchExplanation.skill_match.matched_skills.map((skill, idx) => (
                      <Tag key={idx} color="success">{skill}</Tag>
                    ))}
                  </Space>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>缺失技能</div>
                  <Space wrap>
                    {matchExplanation.skill_match.missing_skills.length > 0 ? (
                      matchExplanation.skill_match.missing_skills.map((skill, idx) => (
                        <Tag key={idx} color="error">{skill}</Tag>
                      ))
                    ) : (
                      <span style={{ color: '#999' }}>无缺失技能</span>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="详细说明" style={{ marginBottom: 16 }}>
              <List size="small">
                <List.Item>
                  <List.Item.Meta
                    title="经验要求"
                    description={matchExplanation.experience_match.details}
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta
                    title="学历要求"
                    description={matchExplanation.education_match.details}
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta
                    title="薪资预期"
                    description={matchExplanation.salary_match.details}
                  />
                </List.Item>
                <List.Item>
                  <List.Item.Meta
                    title="工作地点"
                    description={matchExplanation.location_match.details}
                  />
                </List.Item>
              </List>
            </Card>

            {matchExplanation.suggestions.length > 0 && (
              <Card size="small" title="提升建议">
                <List
                  size="small"
                  dataSource={matchExplanation.suggestions}
                  renderItem={(item) => (
                    <List.Item>
                      <span style={{ color: '#faad14', marginRight: 8 }}>💡</span>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
