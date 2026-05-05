import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, List, Tag, Empty, Pagination, Space, Typography
} from 'antd';
import {
  EyeOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { announcementApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.current, pagination.pageSize]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      const data = await announcementApi.getList(params);
      setAnnouncements(data.announcements || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('获取公告列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Card title="公告列表">
        {announcements.length === 0 && !loading ? (
          <Empty description="暂无公告" style={{ margin: '60px 0' }} />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={announcements}
              loading={loading}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/announcements/${item.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.is_top && <Tag color="red">置顶</Tag>}
                        <Title level={4} style={{ margin: 0, cursor: 'pointer' }}>
                          {item.title}
                        </Title>
                      </div>
                    }
                    description={
                      <Space>
                        <Text type="secondary">
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text type="secondary">
                          <EyeOutlined style={{ marginRight: 4 }} />
                          {item.view_count || 0} 次浏览
                        </Text>
                        <Text type="secondary">
                          作者: {item.author_nickname || item.author_name}
                        </Text>
                      </Space>
                    }
                  />
                  <div style={{ marginTop: 12, color: '#666' }}>
                    {item.content?.length > 200 
                      ? item.content.substring(0, 200) + '...' 
                      : item.content
                    }
                  </div>
                </List.Item>
              )}
            />
            
            {pagination.total > 0 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={(page, pageSize) => {
                    setPagination(prev => ({ ...prev, current: page, pageSize }));
                  }}
                  showSizeChanger
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </AppLayout>
  );
};

export default Announcements;
