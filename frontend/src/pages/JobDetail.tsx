import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, message, Tag, Button, Space, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, BankOutlined, SafetyOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { JobPosting } from '../types';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobPosting | null>(null);

  const fetchJobDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.jobs.getDetail(parseInt(id));
      setJob(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取岗位详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const getSalaryTypeText = (type: string) => {
    const map: Record<string, string> = {
      daily: '日薪',
      piece: '计件',
      monthly: '月薪'
    };
    return map[type] || type;
  };

  if (!job) return null;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/jobs')}
        style={{ marginBottom: '16px' }}
      >
        返回岗位列表
      </Button>

      <Spin spinning={loading}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{job.title}</span>
              <Tag color="blue">{job.gbName}</Tag>
              {job.status === 'active' ? (
                <Tag color="green">招聘中</Tag>
              ) : (
                <Tag color="default">已关闭</Tag>
              )}
            </div>
          }
        >
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Descriptions column={1} bordered size="middle">
                <Descriptions.Item label="薪资待遇">
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5222d' }}>
                    ¥{job.salaryMin}
                    {job.salaryMax ? ` - ¥${job.salaryMax}` : ''}
                  </span>
                  <Tag style={{ marginLeft: '8px' }} color="orange">
                    {getSalaryTypeText(job.salaryType)}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="工作地点">
                  <Space>
                    <EnvironmentOutlined />
                    {job.workLocation}
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="招聘人数">
                  {job.peopleNeeded || 0} 人
                </Descriptions.Item>

                <Descriptions.Item label="福利待遇">
                  <Space>
                    {job.includesBoard ? <Tag color="green">包吃</Tag> : null}
                    {job.includesLodging ? <Tag color="blue">包住</Tag> : null}
                    {!job.includesBoard && !job.includesLodging && <span>暂无</span>}
                  </Space>
                </Descriptions.Item>

                <Descriptions.Item label="所属项目">
                  {job.projectName || '-'}
                </Descriptions.Item>

                <Descriptions.Item label="岗位要求">
                  {job.requirementDescription || '暂无'}
                </Descriptions.Item>

                <Descriptions.Item label="岗位描述">
                  {job.description || '暂无'}
                </Descriptions.Item>

                <Descriptions.Item label="发布时间">
                  {new Date(job.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={
                  <Space>
                    <BankOutlined />
                    企业信息
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <p style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                  {job.companyName}
                </p>
                <p style={{ color: '#666', margin: 0 }}>
                  企业地址：{(job as any).projectAddress || '暂无'}
                </p>
              </Card>

              {job.safetyTrainingRequired && (
                <Card
                  title={
                    <Space>
                      <SafetyOutlined style={{ color: '#faad14' }} />
                      安全培训要求
                    </Space>
                  }
                  type="inner"
                  style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                >
                  <p style={{ margin: 0, color: '#d48806' }}>
                    {job.safetyTrainingRequired}
                  </p>
                </Card>
              )}

              {job.salaryDetails && (
                <>
                  <Divider />
                  <Card
                    title="薪资结构明细"
                    type="inner"
                  >
                    <Descriptions column={1} size="small">
                      {Object.entries(job.salaryDetails).map(([key, value]) => (
                        <Descriptions.Item key={key} label={key}>
                          {typeof value === 'number' ? `¥${value}` : String(value)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </Card>
                </>
              )}
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default JobDetail;
