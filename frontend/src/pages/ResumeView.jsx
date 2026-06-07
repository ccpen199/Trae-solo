import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Tag, Spin, message, Avatar, Space, Tabs,
  Descriptions, Button, Modal, List, Empty, Divider
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, CalendarOutlined,
  VideoCameraOutlined, LinkOutlined, GlobalOutlined,
  TrophyOutlined, BulbOutlined, FileTextOutlined,
  ArrowLeftOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const ResumeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/job-seekers/resume/${id}`);
      setResumeData(res.data.resume || null);
      setProfileData(res.data.profile || null);
    } catch (e) {
      message.error('加载简历失败');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      expert: '#52c41a',
      proficient: '#1677ff',
      intermediate: '#fa8c16',
      beginner: '#faad14',
    };
    return colors[level] || '#1677ff';
  };

  const playVideo = (videoUrl) => {
    setCurrentVideo(videoUrl);
    setVideoVisible(true);
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('bilibili.com')) {
      const bvMatch = url.match(/BV[a-zA-Z0-9]+/);
      if (bvMatch) {
        return `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}`;
      }
    }
    if (url.includes('youku.com')) {
      const idMatch = url.match(/id_([a-zA-Z0-9]+)/);
      if (idMatch) {
        return `https://player.youku.com/embed/${idMatch[1]}`;
      }
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const idMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      if (idMatch) {
        return `https://www.youtube.com/embed/${idMatch[1]}`;
      }
    }
    return url;
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!resumeData && !profileData) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Empty description="简历不存在或已被删除" />
        <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> 返回
        </Button>
      </div>
    );
  }

  const workExperience = resumeData?.work_experience || [];
  const educationExperience = resumeData?.education_experience || [];
  const projectExperience = resumeData?.project_experience || [];
  const skills = resumeData?.skills || [];
  const certificates = profileData?.certificates || [];
  const projectVideos = resumeData?.project_videos ? resumeData.project_videos.split(',').filter(v => v.trim()) : [];

  return (
    <div style={{
      padding: '40px 20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 20, background: 'rgba(255,255,255,0.9)' }}
        >
          返回
        </Button>

        <div className="three-d-resume">
          <div className="resume-card">
            <Card
              className="card-shadow"
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                padding: '40px 40px 60px',
                color: '#fff',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: '#fff',
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                }} />
                <Row gutter={24} align="middle">
                  <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                    <Avatar
                      size={120}
                      icon={<UserOutlined style={{ fontSize: 50 }} />}
                      style={{
                        border: '4px solid #fff',
                        background: 'rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={18}>
                    <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                      {profileData?.name || '未命名'}
                    </h1>
                    <div style={{ fontSize: 18, opacity: 0.95, marginBottom: 16 }}>
                      {resumeData?.resume_title || '制造业专业人才'}
                    </div>
                    <Space wrap size={[16, 8]}>
                      {profileData?.phone && (
                        <Space size={4}>
                          <PhoneOutlined />
                          <span>{profileData.phone}</span>
                        </Space>
                      )}
                      {profileData?.email && (
                        <Space size={4}>
                          <MailOutlined />
                          <span>{profileData.email}</span>
                        </Space>
                      )}
                      {profileData?.location && (
                        <Space size={4}>
                          <EnvironmentOutlined />
                          <span>{profileData.location}</span>
                        </Space>
                      )}
                    </Space>
                  </Col>
                </Row>
              </div>

              <div style={{ padding: '0 40px 40px' }}>
                <Row gutter={[24, 24]} style={{ marginTop: 0 }}>
                  <Col xs={24} md={16}>
                    <Tabs defaultActiveKey="work">
                      <TabPane
                        tab={
                          <span>
                            <GlobalOutlined /> 工作经历
                          </span>
                        }
                        key="work"
                      >
                        {workExperience.length === 0 ? (
                          <Empty description="暂无工作经历" />
                        ) : (
                          <div style={{ position: 'relative', paddingLeft: 30 }}>
                            <div style={{
                              position: 'absolute',
                              left: 6,
                              top: 8,
                              bottom: 8,
                              width: 2,
                              background: 'linear-gradient(180deg, #1677ff 0%, #722ed1 100%)',
                              borderRadius: 1,
                            }} />
                            {workExperience.map((exp, idx) => (
                              <div
                                key={exp.id || idx}
                                style={{ position: 'relative', marginBottom: 24 }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  left: -30,
                                  top: 8,
                                  width: 14,
                                  height: 14,
                                  background: '#1677ff',
                                  border: '3px solid #fff',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 0 2px #1677ff',
                                }} />
                                <Card size="small" className="card-shadow" style={{
                                  borderRadius: 8,
                                  transition: 'all 0.3s',
                                }}
                                  hoverable
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                        {exp.position}
                                      </h3>
                                      <div style={{ color: '#1677ff', fontWeight: 500, marginBottom: 4 }}>
                                        {exp.company}
                                      </div>
                                    </div>
                                    <Tag color="blue" icon={<CalendarOutlined />}>
                                      {exp.start_date} - {exp.end_date || '至今'}
                                    </Tag>
                                  </div>
                                  {exp.description && (
                                    <div style={{
                                      marginTop: 12,
                                      paddingTop: 12,
                                      borderTop: '1px solid #f0f0f0',
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: 1.8,
                                      color: '#595959',
                                    }}>
                                      {exp.description}
                                    </div>
                                  )}
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabPane>

                      <TabPane
                        tab={
                          <span>
                            <FileTextOutlined /> 教育经历
                          </span>
                        }
                        key="edu"
                      >
                        {educationExperience.length === 0 ? (
                          <Empty description="暂无教育经历" />
                        ) : (
                          <div style={{ position: 'relative', paddingLeft: 30 }}>
                            <div style={{
                              position: 'absolute',
                              left: 6,
                              top: 8,
                              bottom: 8,
                              width: 2,
                              background: 'linear-gradient(180deg, #722ed1 0%, #13c2c2 100%)',
                              borderRadius: 1,
                            }} />
                            {educationExperience.map((exp, idx) => (
                              <div
                                key={exp.id || idx}
                                style={{ position: 'relative', marginBottom: 24 }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  left: -30,
                                  top: 8,
                                  width: 14,
                                  height: 14,
                                  background: '#722ed1',
                                  border: '3px solid #fff',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 0 2px #722ed1',
                                }} />
                                <Card size="small" className="card-shadow" style={{
                                  borderRadius: 8,
                                }}
                                  hoverable
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                        {exp.school}
                                      </h3>
                                      <div style={{ marginBottom: 4 }}>
                                        <Tag color="purple">{exp.degree}</Tag>
                                        <span style={{ color: '#595959' }}>{exp.major}</span>
                                      </div>
                                    </div>
                                    <Tag color="purple" icon={<CalendarOutlined />}>
                                      {exp.start_date} - {exp.end_date}
                                    </Tag>
                                  </div>
                                  {exp.description && (
                                    <div style={{
                                      marginTop: 12,
                                      paddingTop: 12,
                                      borderTop: '1px solid #f0f0f0',
                                      color: '#595959',
                                      lineHeight: 1.8,
                                    }}>
                                      {exp.description}
                                    </div>
                                  )}
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabPane>

                      <TabPane
                        tab={
                          <span>
                            <BulbOutlined /> 项目经验
                          </span>
                        }
                        key="project"
                      >
                        {projectExperience.length === 0 ? (
                          <Empty description="暂无项目经验" />
                        ) : (
                          <div style={{ position: 'relative', paddingLeft: 30 }}>
                            <div style={{
                              position: 'absolute',
                              left: 6,
                              top: 8,
                              bottom: 8,
                              width: 2,
                              background: 'linear-gradient(180deg, #fa8c16 0%, #f5222d 100%)',
                              borderRadius: 1,
                            }} />
                            {projectExperience.map((exp, idx) => (
                              <div
                                key={exp.id || idx}
                                style={{ position: 'relative', marginBottom: 24 }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  left: -30,
                                  top: 8,
                                  width: 14,
                                  height: 14,
                                  background: '#fa8c16',
                                  border: '3px solid #fff',
                                  borderRadius: '50%',
                                  boxShadow: '0 0 0 2px #fa8c16',
                                }} />
                                <Card size="small" className="card-shadow" style={{
                                  borderRadius: 8,
                                }}
                                  hoverable
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                                        {exp.project_name}
                                        {exp.video_url && (
                                          <Button
                                            type="link"
                                            size="small"
                                            icon={<PlayCircleOutlined />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              playVideo(exp.video_url);
                                            }}
                                            style={{ marginLeft: 8, color: '#f5222d' }}
                                          >
                                            播放视频
                                          </Button>
                                        )}
                                      </h3>
                                      <div style={{ marginBottom: 4 }}>
                                        <Tag color="orange">{exp.role}</Tag>
                                      </div>
                                    </div>
                                    <Tag color="orange" icon={<CalendarOutlined />}>
                                      {exp.start_date} - {exp.end_date || '至今'}
                                    </Tag>
                                  </div>
                                  {exp.tech_stack?.length > 0 && (
                                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                                      {exp.tech_stack.map((t, i) => (
                                        <Tag key={i} color="blue" style={{ margin: 2 }}>{t}</Tag>
                                      ))}
                                    </div>
                                  )}
                                  {exp.description && (
                                    <div style={{
                                      marginTop: 12,
                                      paddingTop: 12,
                                      borderTop: '1px solid #f0f0f0',
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: 1.8,
                                      color: '#595959',
                                    }}>
                                      {exp.description}
                                    </div>
                                  )}
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabPane>
                    </Tabs>
                  </Col>

                  <Col xs={24} md={8}>
                    <Card
                      title={
                        <Space>
                          <BulbOutlined style={{ color: '#1677ff' }} />
                          专业技能
                        </Space>
                      }
                      className="card-shadow"
                      style={{ marginBottom: 16, borderRadius: 8 }}
                      size="small"
                    >
                      {skills.length === 0 ? (
                        <Empty description="暂无技能标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <Space wrap size={[6, 6]}>
                          {skills.map((skill, idx) => (
                            <Tag
                              key={idx}
                              color="blue"
                              style={{
                                fontSize: 13,
                                padding: '4px 12px',
                                borderRadius: 16,
                              }}
                            >
                              {skill}
                            </Tag>
                          ))}
                        </Space>
                      )}
                    </Card>

                    {profileData && (
                      <Card
                        title={
                          <Space>
                            <UserOutlined style={{ color: '#722ed1' }} />
                            基本信息
                          </Space>
                        }
                        className="card-shadow"
                        style={{ marginBottom: 16, borderRadius: 8 }}
                        size="small"
                      >
                        <Descriptions column={1} size="small">
                          {profileData.gender && (
                            <Descriptions.Item label="性别">
                              {profileData.gender}
                            </Descriptions.Item>
                          )}
                          {profileData.age && (
                            <Descriptions.Item label="年龄">
                              {profileData.age}岁
                            </Descriptions.Item>
                          )}
                          {profileData.education && (
                            <Descriptions.Item label="最高学历">
                              {profileData.education}
                            </Descriptions.Item>
                          )}
                          {profileData.work_years && (
                            <Descriptions.Item label="工作年限">
                              {profileData.work_years}年
                            </Descriptions.Item>
                          )}
                          {profileData.expected_salary && (
                            <Descriptions.Item label="期望薪资">
                              <span className="salary-text">{profileData.expected_salary}</span>
                            </Descriptions.Item>
                          )}
                          {profileData.intended_position && (
                            <Descriptions.Item label="期望职位">
                              {profileData.intended_position}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    )}

                    {certificates.length > 0 && (
                      <Card
                        title={
                          <Space>
                            <TrophyOutlined style={{ color: '#faad14' }} />
                            技能证书
                          </Space>
                        }
                        className="card-shadow"
                        style={{ marginBottom: 16, borderRadius: 8 }}
                        size="small"
                      >
                        <List
                          size="small"
                          dataSource={certificates}
                          renderItem={(cert, idx) => (
                            <List.Item style={{ padding: '8px 0', borderBottom: idx < certificates.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                              <List.Item.Meta
                                avatar={
                                  <div className="certificate-card" style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    fontSize: 16,
                                  }}>
                                    <TrophyOutlined />
                                  </div>
                                }
                                title={cert.name}
                                description={
                                  <Space>
                                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                                      {cert.authority}
                                    </span>
                                    {cert.verified && (
                                      <Tag color="green" size="small">
                                        已认证
                                      </Tag>
                                    )}
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}

                    {(projectVideos.length > 0 || resumeData?.portfolio_url) && (
                      <Card
                        title={
                          <Space>
                            <VideoCameraOutlined style={{ color: '#f5222d' }} />
                            多媒体展示
                          </Space>
                        }
                        className="card-shadow"
                        style={{ borderRadius: 8 }}
                        size="small"
                      >
                        {projectVideos.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                              项目视频
                            </div>
                            <Space wrap direction="vertical" size={8} style={{ width: '100%' }}>
                              {projectVideos.map((video, idx) => (
                                <Button
                                  key={idx}
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => playVideo(video)}
                                  block
                                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                                >
                                  项目视频 {idx + 1}
                                </Button>
                              ))}
                            </Space>
                          </div>
                        )}
                        {resumeData?.portfolio_url && (
                          <div>
                            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                              作品集
                            </div>
                            <Button
                              icon={<LinkOutlined />}
                              href={resumeData.portfolio_url}
                              target="_blank"
                              type="primary"
                              block
                              style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                            >
                              访问个人作品集
                            </Button>
                          </div>
                        )}
                      </Card>
                    )}
                  </Col>
                </Row>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        title="项目视频"
        open={videoVisible}
        onCancel={() => setVideoVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {currentVideo && (
          <div style={{ paddingTop: '56.25%', position: 'relative' }}>
            <iframe
              src={getVideoEmbedUrl(currentVideo)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 8,
              }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResumeView;
