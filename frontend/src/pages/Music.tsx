import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Spin, Empty, Typography, Tag, Button, Space } from 'antd';
import { PlayCircleOutlined, AudioOutlined, ReloadOutlined } from '@ant-design/icons';
import { musicAPI } from '../services/api';
import { SleepMusic } from '../types';

const { Title, Text, Paragraph } = Typography;

const Music: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [musicList, setMusicList] = useState<SleepMusic[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [playingId, setPlayingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [listData, categoriesData] = await Promise.all([
        musicAPI.getList({ limit: 50 }),
        musicAPI.getCategories()
      ]);
      setMusicList(listData.musicList || []);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      console.error('获取音乐列表失败:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlay = async (music: SleepMusic) => {
    try {
      if (playingId === music.id) {
        setPlayingId(null);
      } else {
        await musicAPI.playMusic(music.id);
        setPlayingId(music.id);
        setTimeout(() => setPlayingId(null), 3000);
      }
    } catch (err) {
      console.error('播放失败:', err);
    }
  };

  const filteredMusic = activeCategory
    ? musicList.filter(m => m.category === activeCategory)
    : musicList;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nature: 'green',
      piano: 'blue',
      meditation: 'purple',
      'white-noise': 'orange'
    };
    return colors[category] || 'default';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      nature: '自然声',
      piano: '钢琴曲',
      meditation: '冥想',
      'white-noise': '白噪音'
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="加载失败" />
        <div style={{ marginTop: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchData} type="primary">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>助眠音乐</Title>
        <Text type="secondary">选择舒缓的音乐，帮助您更快入睡</Text>
      </div>

      <Space wrap style={{ marginBottom: 24 }}>
        <Button
          type={!activeCategory ? 'primary' : 'default'}
          onClick={() => setActiveCategory('')}
        >
          全部
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.name}
            type={activeCategory === cat.name ? 'primary' : 'default'}
            onClick={() => setActiveCategory(cat.name)}
          >
            {getCategoryName(cat.name)}
          </Button>
        ))}
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
              dataSource={filteredMusic}
              locale={{ emptyText: <Empty description="暂无音乐" /> }}
              renderItem={(music) => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <div style={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        fontSize: 48
                      }}>
                        <AudioOutlined />
                      </div>
                    }
                    actions={[
                      <Button
                        type="text"
                        icon={<PlayCircleOutlined style={{ color: playingId === music.id ? '#52c41a' : '#1890ff' }} />}
                        onClick={() => handlePlay(music)}
                      >
                        {playingId === music.id ? '播放中...' : '播放'}
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong ellipsis style={{ maxWidth: 150 }}>
                            {music.name}
                          </Text>
                          <Tag color={getCategoryColor(music.category)}>
                            {getCategoryName(music.category)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                            {music.description}
                          </Paragraph>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            播放 {music.play_count} 次
                          </Text>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Music;
