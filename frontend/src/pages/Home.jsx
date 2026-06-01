import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Input, Select, Pagination, Tag, Space, Button, Statistic, Divider } from 'antd';
import { 
  BookOutlined, FireOutlined, UserOutlined, EditOutlined, 
  TeamOutlined, DollarOutlined, LikeOutlined, CommentOutlined,
  FileTextOutlined, AuditOutlined, ScheduleOutlined, HistoryOutlined,
  ReadOutlined, ShoppingCartOutlined, GiftOutlined, StarOutlined,
  WarningOutlined, RiseOutlined, BankOutlined, BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request.js';

const { Search } = Input;
const { Option } = Select;

function Home() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([
    '玄幻奇幻', '都市青春', '科幻未来', '历史军事',
    '游戏竞技', '灵异悬疑', '武侠仙侠', '言情小说'
  ]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', category_name: '', sign_status: '' });
  const [searchParams, setSearchParams] = useState({ keyword: '', category_name: '', sign_status: '' });

  const fetchNovels = useCallback(async () => {
    setLoading(true);
    try {
      const params = { 
        page: pagination.current, 
        pageSize: pagination.pageSize,
        ...searchParams
      };
      const res = await request.get('/novels', { params });
      setNovels(res.list || []);
      setPagination(p => ({ ...p, total: res.total || 0 }));
    } catch (e) {
      console.error('加载小说失败', e);
      setNovels([]);
    }
    setLoading(false);
  }, [pagination.current, pagination.pageSize, searchParams]);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  const handleSearch = () => {
    setSearchParams(filters);
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(p => ({ ...p, current: page }));
  };

  const quickEntries = [
    { 
      icon: <EditOutlined style={{ fontSize: 24, color: '#1677ff' }} />, 
      title: '作者创作', 
      desc: '作品管理·章节发布·草稿箱',
      path: '/author/novels',
      color: '#e6f4ff'
    },
    { 
      icon: <AuditOutlined style={{ fontSize: 24, color: '#52c41a' }} />, 
      title: '编辑审核', 
      desc: '作品审核·签约管理·推荐位',
      path: '/editor/dashboard',
      color: '#f6ffed'
    },
    { 
      icon: <ReadOutlined style={{ fontSize: 24, color: '#722ed1' }} />, 
      title: '读者阅读', 
      desc: '书架·订阅·评论打赏',
      path: '/bookshelf',
      color: '#f9f0ff'
    },
    { 
      icon: <BankOutlined style={{ fontSize: 24, color: '#fa8c16' }} />, 
      title: '稿费结算', 
      desc: '账单明细·收入统计',
      path: '/finance/settlements',
      color: '#fff7e6'
    }
  ];

  const renderTags = (tags) => {
    if (!tags) return null;
    return tags.split(',').slice(0, 3).map((tag, idx) => (
      <Tag key={idx} color="purple" style={{ margin: '0 4px 4px 0' }}>{tag.trim()}</Tag>
    ));
  };

  return (
    <div className="container">
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={12}>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 600 }}>小说连载平台</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0 0' }}>
              一站式网络小说创作、连载、阅读与结算全链路平台
            </p>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              {[
                { label: '连载作品', value: '4', icon: <BookOutlined /> },
                { label: '注册作者', value: '2', icon: <UserOutlined /> },
                { label: '读者用户', value: '2', icon: <TeamOutlined /> },
                { label: '今日阅读', value: '156', icon: <ReadOutlined /> }
              ].map((stat, idx) => (
                <Col span={6} key={idx}>
                  <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>{stat.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Card title="业务快速入口" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {quickEntries.map((entry, idx) => (
            <Col xs={12} md={6} key={idx}>
              <Card 
                hoverable 
                onClick={() => navigate(entry.path)}
                style={{ background: entry.color, border: 'none', cursor: 'pointer', height: '100%' }}
                styles={{ body: { padding: 20 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {entry.icon}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{entry.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{entry.desc}</div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card 
        title="作品列表" 
        extra={
          <Space style={{ marginBottom: 0 }} wrap>
            <Search
              placeholder="搜索书名或标签"
              allowClear
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
              onSearch={handleSearch}
            />
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: 130 }}
              value={filters.category_name || undefined}
              onChange={value => setFilters(f => ({ ...f, category_name: value || '' }))}
            >
              {categories.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
            </Select>
            <Select
              placeholder="签约状态"
              allowClear
              style={{ width: 120 }}
              value={filters.sign_status || undefined}
              onChange={value => setFilters(f => ({ ...f, sign_status: value || '' }))}
            >
              <Option value="signed">已签约</Option>
              <Option value="unsigned">未签约</Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>
        ) : novels.length > 0 ? (
          <Row gutter={[16, 16]}>
            {novels.map(novel => (
              <Col xs={24} md={12} lg={6} key={novel.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/novel/${novel.id}`)}
                  style={{ height: '100%', cursor: 'pointer' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ 
                        width: 72, 
                        height: 96, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: '0 0 6px 0', 
                          fontSize: 15,
                          fontWeight: 600,
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {novel.title}
                        </h4>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                          <Space size={8} wrap>
                            <span><UserOutlined /> {novel.author_name || '未知'}</span>
                            <span><EditOutlined /> {novel.editor_name || '待定'}</span>
                          </Space>
                        </div>
                        <Space size={4} wrap>
                          {novel.category_name && <Tag color="blue" style={{ margin: 0 }}>{novel.category_name}</Tag>}
                          {novel.sign_status === 'signed' && <Tag color="gold" style={{ margin: 0 }}>已签约</Tag>}
                          {novel.serialize_status === 'ongoing' ? (
                            <Tag color="green" style={{ margin: 0 }}>连载中</Tag>
                          ) : (
                            <Tag color="default" style={{ margin: 0 }}>已完结</Tag>
                          )}
                          {novel.is_recommended && <Tag color="red" style={{ margin: 0 }}>推荐</Tag>}
                        </Space>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#888' }}>
                      {renderTags(novel.tags)}
                    </div>

                    <p style={{ 
                      fontSize: 12, 
                      color: '#666', 
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                      minHeight: 38
                    }}>
                      {novel.description || '暂无简介'}
                    </p>

                    <Divider style={{ margin: '8px 0' }} />

                    <Row gutter={[8, 8]} style={{ fontSize: 12, color: '#888' }}>
                      <Col span={8}>
                        <Space size={4}>
                          <FireOutlined /> {novel.click_count || 0}
                        </Space>
                      </Col>
                      <Col span={8}>
                        <Space size={4}>
                          <StarOutlined /> {novel.subscribe_count || 0}
                        </Space>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {(novel.word_count / 10000).toFixed(1)}万字
                      </Col>
                      <Col span={12}>
                        <Space size={4}>
                          <FileTextOutlined /> {novel.chapter_count || 0}章
                        </Space>
                      </Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Space size={4}>
                          <LikeOutlined /> {novel.vote_count || 0}票
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            暂无作品数据
          </div>
        )}

        {pagination.total > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      <Card title="核心业务链路一览">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <Card size="small" title="✍️ 作者链路" style={{ height: '100%' }}>
              <Space direction="vertical" size={8} style={{ width: '100%', fontSize: 13 }}>
                <div><FileTextOutlined style={{ color: '#1677ff' }} /> 作品创建与编辑</div>
                <div><ScheduleOutlined style={{ color: '#1677ff' }} /> 章节发布/草稿/定时</div>
                <div><DollarOutlined style={{ color: '#1677ff' }} /> 收费章节设置</div>
                <div><HistoryOutlined style={{ color: '#1677ff' }} /> 修改记录查看</div>
                <div><BarChartOutlined style={{ color: '#1677ff' }} /> 稿费收入明细</div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card size="small" title="📝 编辑链路" style={{ height: '100%' }}>
              <Space direction="vertical" size={8} style={{ width: '100%', fontSize: 13 }}>
                <div><AuditOutlined style={{ color: '#52c41a' }} /> 作品签约审核</div>
                <div><AuditOutlined style={{ color: '#52c41a' }} /> 章节内容审核</div>
                <div><WarningOutlined style={{ color: '#52c41a' }} /> 断更风险跟踪</div>
                <div><StarOutlined style={{ color: '#52c41a' }} /> 推荐位配置</div>
                <div><WarningOutlined style={{ color: '#52c41a' }} /> 违规内容处理</div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card size="small" title="📖 读者链路" style={{ height: '100%' }}>
              <Space direction="vertical" size={8} style={{ width: '100%', fontSize: 13 }}>
                <div><ReadOutlined style={{ color: '#722ed1' }} /> 免费/付费阅读</div>
                <div><BookOutlined style={{ color: '#722ed1' }} /> 书架收藏管理</div>
                <div><ShoppingCartOutlined style={{ color: '#722ed1' }} /> 订阅与订单</div>
                <div><CommentOutlined style={{ color: '#722ed1' }} /> 评论与投票</div>
                <div><GiftOutlined style={{ color: '#722ed1' }} /> 打赏与阅读进度</div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card size="small" title="💰 结算链路" style={{ height: '100%' }}>
              <Space direction="vertical" size={8} style={{ width: '100%', fontSize: 13 }}>
                <div><DollarOutlined style={{ color: '#fa8c16' }} /> 订阅收入分成</div>
                <div><GiftOutlined style={{ color: '#fa8c16' }} /> 打赏收入结算</div>
                <div><RiseOutlined style={{ color: '#fa8c16' }} /> 奖励与扣罚</div>
                <div><FileTextOutlined style={{ color: '#fa8c16' }} /> 账单明细导出</div>
                <div><BarChartOutlined style={{ color: '#fa8c16' }} /> 平台收入统计</div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default Home;
