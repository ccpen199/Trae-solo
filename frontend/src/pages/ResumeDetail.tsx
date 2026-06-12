import { useState, useEffect } from 'react';
import { Descriptions, Card, Tag, Space, Typography, Row, Col, Divider, Button, Progress, Alert, Avatar, List } from 'antd';
import { EditOutlined, ArrowLeftOutlined, SendOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get(`/resumes/${id}`).then((d: any) => setData(d.resume));
  }, [id]);

  if (!data) return <Card loading />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>
        <Card>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <Space>
              <Avatar size={64} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ margin: 0 }}>{data.title || '个人简历'}</Title>
                <Text type="secondary">更新于 {dayjs(data.updated_at).format('YYYY-MM-DD')}</Text>
              </div>
            </Space>
            {data.user_id === user?.id && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/resumes/${id}/edit`)}>编辑简历</Button>
            )}
          </div>

          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="工作经验">{data.experience || 0} 年</Descriptions.Item>
            <Descriptions.Item label="学历">{data.education || '未填写'}</Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">个人简介</Divider>
          <Paragraph>{data.summary || '暂无'}</Paragraph>

          <Divider orientation="left">技能标签</Divider>
          <Space wrap>
            {(data.skills || []).map((s: string) => <Tag key={s} color="blue">{s}</Tag>)}
          </Space>

          <Divider orientation="left">证书资质</Divider>
          {(data.certifications || []).length === 0 ? <Text type="secondary">暂无证书</Text> :
            <List dataSource={data.certifications} renderItem={(c: any) => <List.Item>{c}</List.Item>} />
          }

          <Divider orientation="left">项目经历</Divider>
          {(data.projects || []).length === 0 ? <Text type="secondary">暂无项目</Text> :
            <List
              dataSource={data.projects}
              renderItem={(p: any) => (
                <List.Item style={{ display: 'block' }}>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{p.role}</div>
                  <div>{p.description}</div>
                </List.Item>
              )}
            />
          }

          <Divider orientation="left">工作经历</Divider>
          {(data.workHistory || []).length === 0 ? <Text type="secondary">暂无工作经历</Text> :
            <List
              dataSource={data.workHistory}
              renderItem={(w: any) => (
                <List.Item style={{ display: 'block' }}>
                  <div className="flex-between">
                    <Text strong>{w.company} - {w.position}</Text>
                    <Text type="secondary">{w.startDate} ~ {w.endDate || '至今'}</Text>
                  </div>
                  <div style={{ marginTop: 4 }}>{w.description}</div>
                </List.Item>
              )}
            />
          }
        </Card>
      </div>
    </Space>
  );
}
