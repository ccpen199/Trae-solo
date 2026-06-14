import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin, message, Tag, Button, Space } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined, DownloadOutlined } from '@ant-design/icons';
import { deliveryApi, exportApi } from '../api';
import dayjs from 'dayjs';

const DeliveryTrackPage: React.FC = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (trackingCode) {
      loadData();
    }
  }, [trackingCode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await deliveryApi.track(trackingCode!);
      setData(res);
    } catch (err: any) {
      message.error(err.error || '加载失败，投递记录不存在或已过期');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card>
          <h2>投递记录不存在</h2>
          <p style={{ color: '#718096' }}>该追踪码无效或已过期</p>
        </Card>
      </div>
    );
  }

  const { resume_content, company, position, user_name, created_at } = data;
  const { basicInfo, education, experience, projects, skills, summary } = resume_content;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="no-print" style={{ marginBottom: 16, textAlign: 'center' }}>
          <Space>
            <Tag color="blue">{company}</Tag>
            <Tag color="green">{position}</Tag>
            <Tag color="orange">来自：{user_name}</Tag>
          </Space>
          <div style={{ marginTop: 8, color: '#718096', fontSize: 13 }}>
            投递时间：{dayjs(created_at).format('YYYY-MM-DD HH:mm')}
          </div>
          <Button
            icon={<DownloadOutlined />}
            style={{ marginTop: 12 }}
            onClick={() => {
              const html = document.documentElement.outerHTML;
              const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${basicInfo?.name || '简历'}.html`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            下载完整简历
          </Button>
        </div>

        <div className="resume-preview">
          <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
            <h1 style={{ margin: '0 0 12px 0', fontSize: 28, fontWeight: 700, color: '#1a365d' }}>
              {basicInfo?.name || '姓名'}
            </h1>
            <div style={{ color: '#718096', fontSize: 15, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {basicInfo?.phone && (
                <span><PhoneOutlined style={{ marginRight: 4 }} />{basicInfo.phone}</span>
              )}
              {basicInfo?.email && (
                <span><MailOutlined style={{ marginRight: 4 }} />{basicInfo.email}</span>
              )}
              {basicInfo?.location && (
                <span><EnvironmentOutlined style={{ marginRight: 4 }} />{basicInfo.location}</span>
              )}
              {basicInfo?.website && (
                <span><GlobalOutlined style={{ marginRight: 4 }} />{basicInfo.website}</span>
              )}
            </div>
          </div>

          {summary && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">个人简介</div>
              <p style={{ lineHeight: 1.8, color: '#4a5568', whiteSpace: 'pre-wrap' }}>{summary}</p>
            </div>
          )}

          {experience?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">工作/实习经历</div>
              {experience.map((exp: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>
                      {exp.company || '公司名称'} · {exp.position || '职位'}
                    </div>
                    <div style={{ color: '#718096', fontSize: 14 }}>
                      {exp.startDate} - {exp.endDate || '至今'}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4a5568' }}>
                    {exp.description || ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {projects?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">项目经历</div>
              {projects.map((proj: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>
                      {proj.name || '项目名称'}{proj.role ? ' · ' + proj.role : ''}
                    </div>
                    <div style={{ color: '#718096', fontSize: 14 }}>
                      {proj.startDate} - {proj.endDate || '至今'}
                    </div>
                  </div>
                  {proj.technologies?.length > 0 && (
                    <div style={{ color: '#4299e1', marginBottom: 6, fontSize: 14 }}>
                      技术栈：{proj.technologies.join('、')}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4a5568' }}>
                    {proj.description || ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {education?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">教育背景</div>
              {education.map((edu: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: '#2d3748' }}>
                      {edu.school || '学校名称'}
                    </div>
                    <div style={{ color: '#718096', fontSize: 14 }}>
                      {edu.startDate} - {edu.endDate || '至今'}
                    </div>
                  </div>
                  <div style={{ color: '#4a5568' }}>
                    {edu.degree || ''}{edu.major ? ' · ' + edu.major : ''}{edu.gpa ? ' · GPA: ' + edu.gpa : ''}
                  </div>
                  {edu.description && (
                    <div style={{ color: '#718096', fontSize: 14, marginTop: 4 }}>
                      {edu.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {skills?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="section-title">专业技能</div>
              {skills.map((skill: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#1a365d' }}>
                    {skill.category || '技能分类'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {skill.items?.map((item: string, i: number) => (
                      <span key={i} style={{ background: '#e2e8f0', padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="no-print" style={{ textAlign: 'center', marginTop: 24, color: '#718096', fontSize: 13 }}>
          <p>本简历由智能简历生成工作台提供技术支持</p>
          <p style={{ fontSize: 12 }}>追踪码：{trackingCode}</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackPage;
