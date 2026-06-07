import React, { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  List,
  Form,
  Input,
  Rate,
  Button,
  Tag,
  Spin,
  message,
  Descriptions,
} from 'antd';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getReviews, createReview, getReviewStats, getBuildings } from '@/api';

interface Review {
  id: number;
  building_id: number;
  reviewer_name: string;
  rating: number;
  content: string;
  sentiment: string;
  keywords: string[];
  created_at: string;
}

interface ReviewStats {
  avg_rating: number;
  total_reviews: number;
  sentiment_distribution: Record<string, number>;
  top_keywords: { keyword: string; count: number }[];
}

const Reviews: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<{ id: number; name: string; district: string }[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    getBuildings()
      .then((res: any) => {
        const list = res?.list || [];
        setBuildings(list.map((b: any) => ({ id: b.id, name: b.name, district: b.district })));
      })
      .catch(() => message.error('获取楼盘列表失败'));
  }, []);

  useEffect(() => {
    if (!selectedBuilding) return;
    setLoading(true);
    Promise.all([
      getReviews({ building_id: selectedBuilding }),
      getReviewStats(selectedBuilding),
    ])
      .then(([revRes, statsRes]: any[]) => {
        setReviews(revRes?.list || []);
        setStats(statsRes);
      })
      .catch(() => message.error('获取评价数据失败'))
      .finally(() => setLoading(false));
  }, [selectedBuilding]);

  const handleSubmit = async (values: any) => {
    try {
      await createReview({
        building_id: selectedBuilding,
        reviewer_name: values.reviewer_name || '匿名用户',
        rating: values.rating,
        content: values.content,
      });
      message.success('评价提交成功');
      form.resetFields();
      if (selectedBuilding) {
        const [revRes, statsRes]: any[] = await Promise.all([
          getReviews({ building_id: selectedBuilding }),
          getReviewStats(selectedBuilding),
        ]);
        setReviews(revRes?.list || []);
        setStats(statsRes);
      }
    } catch {
      message.error('评价提交失败');
    }
  };

  const sentimentData = stats
    ? Object.entries(stats.sentiment_distribution || {}).map(([name, value]) => ({
        name,
        value: value as number,
      }))
    : [];

  const keywordData = stats?.top_keywords ?? [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case '正面': return 'green';
      case '负面': return 'red';
      case '中性': return 'blue';
      default: return 'default';
    }
  };

  const getPieColor = (name: string) => {
    switch (name) {
      case '正面': return '#52c41a';
      case '负面': return '#ff4d4f';
      case '中性': return '#1677ff';
      default: return '#d9d9d9';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>小区口碑</h2>
        <p>基于真实评价的小区综合口碑分析，含情感分析和避坑关键词提取</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Select
          placeholder="选择楼盘"
          showSearch
          optionFilterProp="label"
          style={{ width: 300 }}
          value={selectedBuilding}
          onChange={setSelectedBuilding}
          allowClear
          options={buildings.map((b) => ({
            label: `${b.name}（${b.district}）`,
            value: b.id,
          }))}
        />
      </Card>

      <Spin spinning={loading}>
        {selectedBuilding && (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={8}>
                <Card title="评分概览">
                  {stats && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 700, color: '#fa8c16' }}>
                        {stats.avg_rating.toFixed(1)}
                      </div>
                      <Rate disabled value={Math.round(stats.avg_rating)} style={{ fontSize: 20 }} />
                      <div style={{ color: '#8c8c8c', marginTop: 8 }}>
                        共 {stats.total_reviews} 条评价
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="情感分布">
                  {sentimentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sentimentData.map((entry, i) => (
                            <Cell key={i} fill={getPieColor(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '50px 0' }}>
                      暂无情感数据
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="热词标签">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {keywordData.map((kw, i) => (
                      <Tag
                        key={i}
                        color={getSentimentColor(kw.keyword.includes('避坑') || kw.keyword.includes('问题') || kw.keyword.includes('投诉') ? '负面' : '正面')}
                        style={{ fontSize: Math.min(12 + kw.count * 2, 20) }}
                      >
                        {kw.keyword}
                      </Tag>
                    ))}
                    {keywordData.length === 0 && (
                      <span style={{ color: '#8c8c8c' }}>暂无热词数据</span>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {keywordData.length > 0 && (
              <Card title="关键词频次" style={{ marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={keywordData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={14}>
                <Card title="评价列表">
                  <List
                    dataSource={reviews}
                    locale={{ emptyText: '暂无评价数据' }}
                    renderItem={(review) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontWeight: 500 }}>{review.reviewer_name}</span>
                              <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                              <Tag color={getSentimentColor(review.sentiment)}>
                                {review.sentiment}
                              </Tag>
                              <span style={{ color: '#8c8c8c', fontSize: 12 }}>{review.created_at}</span>
                            </div>
                          }
                          description={
                            <div>
                              <p style={{ margin: '8px 0' }}>{review.content}</p>
                              <div>
                                {review.keywords?.map((kw, i) => (
                                  <Tag key={i}>{kw}</Tag>
                                ))}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="发表评价">
                  <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="reviewer_name" label="昵称" initialValue="匿名用户">
                      <Input placeholder="您的昵称" />
                    </Form.Item>
                    <Form.Item name="rating" label="评分" rules={[{ required: true, message: '请选择评分' }]}>
                      <Rate />
                    </Form.Item>
                    <Form.Item name="content" label="评价内容" rules={[{ required: true, message: '请输入评价内容' }]}>
                      <Input.TextArea rows={6} placeholder="分享您的居住体验，我们将自动进行情感分析并提取关键词..." />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">提交评价</Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
};

export default Reviews;
