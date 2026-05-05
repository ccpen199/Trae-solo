import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Tag, Spin, Button, Typography, Divider
} from 'antd';
import {
  ArrowLeftOutlined, EyeOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { announcementApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AnnouncementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const data = await announcementApi.getById(id);
      setAnnouncement(data);
    } catch (error) {
      console.error('获取公告详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Spin spinning={loading}>
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/announcements')}
              >
                返回列表
              </Button>
            </div>
          }
        >
          {announcement && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  {announcement.is_top && <Tag color="red">置顶</Tag>}
                </div>
                <Title level={2}>{announcement.title}</Title>
                <div style={{ marginTop: 12 }}>
                  <Tag color="blue">
                    <EyeOutlined style={{ marginRight: 4 }} />
                    {announcement.view_count || 0} 次浏览
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 16 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    发布时间: {dayjs(announcement.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                  {announcement.author_name && (
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                      发布者: {announcement.author_nickname || announcement.author_name}
                    </Text>
                  )}
                </div>
              </div>

              <Divider />

              <div style={{ 
                fontSize: 16, 
                lineHeight: 2, 
                padding: '0 20px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {announcement.content}
              </div>

              <Divider />

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/announcements')}
                >
                  返回公告列表
                </Button>
              </div>
            </div>
          )}
        </Card>
      </Spin>
    </AppLayout>
  );
};

export default AnnouncementDetail;
