import React, { useState, useEffect } from 'react';
import { Card, Tag, Avatar, Space, Typography, Select, Row, Col, Button, Input, List, message } from 'antd';
import { LikeOutlined, MessageOutlined, ShareAltOutlined, EyeOutlined, SafetyCertificateOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { postAPI, cityAPI } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  news: { label: '本地资讯', color: 'blue' },
  job: { label: '招聘求职', color: 'cyan' },
  rental: { label: '房屋租售', color: 'geekblue' },
  secondhand: { label: '二手交易', color: 'orange' },
  dating: { label: '相亲交友', color: 'magenta' },
  show: { label: '秀场动态', color: 'purple' },
};

interface HomeProps {
  currentCity: { id: number; name: string } | null;
}

const HomePage: React.FC<HomeProps> = ({ currentCity }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [districts, setDistricts] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentCity) {
      loadPosts();
      loadDistricts();
    }
  }, [currentCity, category, district, street]);

  useEffect(() => {
    if (currentCity) {
      loadPosts();
    }
  }, [currentCity]);

  const loadDistricts = async () => {
    if (!currentCity) return;
    try {
      const res = await cityAPI.getDistricts(currentCity.id);
      setDistricts(res.data.districts);
    } catch (error) {
      console.error('加载区县失败', error);
    }
  };

  const loadStreets = async (districtId: number) => {
    if (!currentCity) return;
    try {
      const res = await cityAPI.getStreets(currentCity.id, districtId);
      setStreets(res.data.streets);
    } catch (error) {
      console.error('加载街道失败', error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (currentCity) params.city_id = currentCity.id;
      if (category) params.category = category;
      if (district) params.district = district;
      if (street) params.street = street;
      if (keyword) params.keyword = keyword;

      const res = await postAPI.getPosts(params);
      setPosts(res.data.posts);
    } catch (error) {
      message.error('加载帖子失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setStreet('');
    if (value) {
      const d = districts.find((d) => d.name === value);
      if (d) loadStreets(d.id);
    } else {
      setStreets([]);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await postAPI.likePost(postId);
      loadPosts();
    } catch (error) {
      console.error('点赞失败', error);
    }
  };

  const renderExtraInfo = (post: any) => {
    if (post.category === 'job' && post.extra?.job) {
      return (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary">
            {post.extra.job.job_type} | {post.extra.job.salary_min}k-{post.extra.job.salary_max}k | {post.extra.job.experience_required}
          </Text>
        </div>
      );
    }
    if (post.category === 'rental' && post.extra?.rental) {
      return (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary">
            {post.extra.rental.rooms}室 | {post.extra.rental.area}㎡ | ¥{post.extra.rental.price}/月
          </Text>
        </div>
      );
    }
    if (post.category === 'secondhand' && post.extra?.secondhand) {
      return (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ color: '#f5222d', fontWeight: 'bold' }}>
            ¥{post.extra.secondhand.price}
          </Text>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <Card className="filter-bar">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Select
              placeholder="分类"
              allowClear
              style={{ width: '100%' }}
              value={category || undefined}
              onChange={setCategory}
            >
              {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                <Option key={key} value={key}>{value.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="区县"
              allowClear
              style={{ width: '100%' }}
              value={district || undefined}
              onChange={handleDistrictChange}
            >
              {districts.map((d) => (
                <Option key={d.name} value={d.name}>{d.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="街道"
              allowClear
              style={{ width: '100%' }}
              value={street || undefined}
              onChange={setStreet}
            >
              {streets.map((s) => (
                <Option key={s.name} value={s.name}>{s.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={7}>
            <Search
              placeholder="搜索内容"
              allowClear
              enterButton
              onSearch={(value) => {
                setKeyword(value);
                loadPosts();
              }}
            />
          </Col>
          <Col span={1}>
            <Button icon={<FilterOutlined />} onClick={loadPosts} />
          </Col>
        </Row>
      </Card>

      <List
        loading={loading}
        dataSource={posts}
        renderItem={(post) => (
          <Card
            key={post.id}
            className="post-card"
            hoverable
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <Card.Meta
              avatar={<Avatar src={post.author_avatar} />}
              title={
                <Space>
                  <span>{post.author_name}</span>
                  {post.author_verified ? <SafetyCertificateOutlined className="verified-badge" /> : null}
                  <Tag color={CATEGORY_MAP[post.category]?.color || 'default'} className="category-tag">
                    {CATEGORY_MAP[post.category]?.label || post.category}
                  </Tag>
                  <span className="credibility-score">可信度 {post.credibility_score?.toFixed(0)}%</span>
                </Space>
              }
              description={
                <div>
                  <div>
                    <Title level={5} style={{ marginTop: 8 }}>{post.title}</Title>
                    <Text type="secondary">{post.city_name} {post.district} {post.street}</Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">{dayjs(post.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                  </div>
                  {renderExtraInfo(post)}
                </div>
              }
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-around' }}>
              <Button type="text" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); }}>
                {post.view_count}
              </Button>
              <Button type="text" icon={<LikeOutlined />} onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>
                {post.like_count}
              </Button>
              <Button type="text" icon={<MessageOutlined />} onClick={(e) => e.stopPropagation()}>
                {post.comment_count}
              </Button>
              <Button type="text" icon={<ShareAltOutlined />} onClick={(e) => e.stopPropagation()}>
                {post.share_count}
              </Button>
            </div>
          </Card>
        )}
      />
    </div>
  );
};

export default HomePage;
