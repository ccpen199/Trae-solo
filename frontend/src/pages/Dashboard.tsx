import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, List, Avatar, Progress, Space, Typography, Button } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  SafetyOutlined,
  AlertOutlined,
  FileProtectOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { reportApi, piracyApi } from '../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [highRiskCourses, setHighRiskCourses] = useState<any[]>([]);
  const [recentClues, setRecentClues] = useState<any[]>([]);
  const [expiringMaterials, setExpiringMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, riskRes, cluesRes, expiringRes] = await Promise.all([
        reportApi.overview(),
        reportApi.highRiskCourses(),
        piracyApi.list({ page_size: 10 }),
        reportApi.authorizationExpiry(30),
      ]);

      setStats(statsRes.data);
      setHighRiskCourses(riskRes.data);
      setRecentClues(cluesRes.data?.data || cluesRes.data || []);
      const allAuthItems = expiringRes.data?.items || expiringRes.data?.expiring_items || [];
      const sortedItems = [...allAuthItems].sort((a: any, b: any) => a.days_remaining - b.days_remaining);
      setExpiringMaterials(sortedItems);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: '课程总数', value: stats.total_courses || 0, icon: <BookOutlined />, color: '#1677ff' },
    { title: '素材总数', value: stats.total_materials || 0, icon: <FileTextOutlined />, color: '#52c41a' },
    { title: '待审核', value: stats.pending_reviews || 0, icon: <SafetyOutlined />, color: '#faad14' },
    { title: '活跃线索', value: stats.active_piracy_clues || 0, icon: <AlertOutlined />, color: '#ff4d4f' },
    { title: '维权案件', value: stats.active_enforcement_cases || 0, icon: <FileProtectOutlined />, color: '#722ed1' },
    { title: '待授权素材', value: stats.unauthorized_materials || 0, icon: <WarningOutlined />, color: '#fa8c16' },
  ];

  const quickEntries = [
    { icon: <FileTextOutlined />, title: '素材库管理', desc: '视频、课件、授权文件', path: '/materials', color: '#667eea' },
    { icon: <SafetyOutlined />, title: '上架合规检查', desc: '授权验证、水印策略', path: '/publication', color: '#f093fb' },
    { icon: <AlertOutlined />, title: '盗版线索登记', desc: '侵权链接、证据上传', path: '/piracy', color: '#fa709a' },
    { icon: <FileProtectOutlined />, title: '维权流程跟进', desc: '通知、律师函、下架', path: '/enforcement', color: '#4facfe' },
    { icon: <BookOutlined />, title: '课程管理', desc: '课程创建、编辑、发布', path: '/courses', color: '#43e97b' },
    { icon: <BarChartOutlined />, title: '版权报表', desc: '高风险、损失估算', path: '/reports', color: '#30cfd0' },
  ];

  const clueColumns = [
    { title: '线索编号', dataIndex: 'clue_no', key: 'clue_no', render: (t: string) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{t}</Text> },
    { title: '侵权平台', dataIndex: 'infringing_platform', key: 'infringing_platform' },
    { title: '相关课程', dataIndex: ['course', 'name'], key: 'course_name', render: (t: string) => t || '-' },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority',
      render: (p: string) => {
        const cm: Record<string, string> = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' };
        const tm: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
        return <Tag color={cm[p]}>{tm[p]}</Tag>;
      }
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const sm: Record<string, string> = {
          pending: 'default', investigating: 'processing', confirmed: 'warning',
          processing: 'processing', resolved: 'success', closed: 'default'
        };
        const tm: Record<string, string> = {
          pending: '待处理', investigating: '调查中', confirmed: '已确认',
          processing: '处理中', resolved: '已解决', closed: '已关闭'
        };
        return <Tag color={sm[s]}>{tm[s]}</Tag>;
      }
    },
    { title: '发现时间', dataIndex: 'discovered_date', key: 'discovered_date', render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
  ];

  return (
    <div>
      <div style={{
        marginBottom: 24, padding: 24,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12, color: 'white',
      }}>
        <Title level={3} style={{ color: 'white', margin: 0, marginBottom: 8 }}>
          课程版权管控工作台
        </Title>
        <Text style={{ color: 'white', opacity: 0.9, fontSize: 14 }}>
          全面掌握素材授权状态、侵权线索动态、维权处理进度
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} md={8} lg={4} key={i}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${card.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: card.color,
                }}>
                  {card.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{card.title}</Text>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1f1f1f' }}>{card.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlayCircleOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>核心业务入口</span>
        </div>}
        style={{ marginBottom: 24, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Row gutter={[16, 16]}>
          {quickEntries.map((entry, i) => (
            <Col xs={24} sm={12} md={8} key={i}>
              <Card
                hoverable
                onClick={() => navigate(entry.path)}
                style={{
                  height: '100%', border: 'none',
                  background: `linear-gradient(135deg, ${entry.color} 0%, ${entry.color}dd 100%)`,
                  borderRadius: 12,
                }}
                styles={{ body: { padding: 20 } }}
              >
                <div style={{ fontSize: 32, color: 'white', marginBottom: 12, opacity: 0.9 }}>
                  {entry.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 4 }}>
                  {entry.title}
                </div>
                <div style={{ fontSize: 12, color: 'white', opacity: 0.8 }}>
                  {entry.desc}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertOutlined style={{ color: '#ff4d4f' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>最新盗版线索</span>
              </div>
              <Button type="link" onClick={() => navigate('/piracy')}>查看全部 <ArrowRightOutlined /></Button>
            </div>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={recentClues}
              columns={clueColumns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate(`/piracy/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarningOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>高风险课程</span>
            </div>}
            style={{ marginBottom: 16, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <List
              dataSource={highRiskCourses.slice(0, 5)}
              renderItem={(item: any) => (
                <List.Item
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                  onClick={() => navigate(`/courses/${item.id}`)}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BookOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
                    title={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <Tag color="red">侵权 {item.piracy_count} 次</Tag>
                    </div>}
                    description={<Space>
                      {item.unauthorized_material_count > 0 && <Tag color="orange">{item.unauthorized_material_count} 个未授权</Tag>}
                      {item.total_estimated_loss > 0 && <Text type="danger">预估损失 ¥{item.total_estimated_loss?.toLocaleString()}</Text>}
                    </Space>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card
            title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockCircleOutlined style={{ color: '#722ed1' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>授权即将到期</span>
            </div>}
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <List
              dataSource={expiringMaterials.slice(0, 5)}
              locale={{ emptyText: '暂无即将到期的授权' }}
              renderItem={(item: any) => {
                const days = item.days_remaining;
                const isExpired = days < 0;
                const tagColor = isExpired ? 'red' : days <= 7 ? 'red' : days <= 30 ? 'orange' : 'blue';
                const displayText = isExpired ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`;
                return (
                  <List.Item
                    style={{ paddingLeft: 0, paddingRight: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/materials/${item.id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: isExpired ? '#ff4d4f' : '#722ed1' }} />}
                      title={item.name}
                      description={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {isExpired ? '已过期:' : '到期:'} {dayjs(item.authorization_end_date).format('YYYY-MM-DD')}
                        </Text>
                        <Tag color={tagColor}>{displayText}</Tag>
                      </div>}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ height: 16 }} />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="素材授权状态" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>已授权</Text>
                  <Text strong>{stats.total_materials ? Math.round(((stats.total_materials - stats.unauthorized_materials - (stats.expired_materials || 0)) / stats.total_materials) * 100) : 0}%</Text>
                </div>
                <Progress percent={stats.total_materials ? Math.round(((stats.total_materials - stats.unauthorized_materials - (stats.expired_materials || 0)) / stats.total_materials) * 100) : 0} showInfo={false} strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>待授权</Text>
                  <Text strong>{stats.unauthorized_materials} 个</Text>
                </div>
                <Progress percent={stats.total_materials ? Math.min(100, Math.round((stats.unauthorized_materials / stats.total_materials) * 100)) : 0} showInfo={false} strokeColor="#fa8c16" />
              </div>
              {stats.expired_materials > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="danger">已过期</Text>
                    <Text strong type="danger">{stats.expired_materials} 个</Text>
                  </div>
                  <Progress percent={stats.total_materials ? Math.min(100, Math.round((stats.expired_materials / stats.total_materials) * 100)) : 0} showInfo={false} strokeColor="#ff4d4f" />
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="上架审核进度" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <List
              size="small"
              dataSource={[
                { label: '已通过审核', value: `${stats.approved_reviews || 0} 个`, color: '#52c41a' },
                { label: '待审核', value: `${stats.pending_reviews || 0} 个`, color: '#faad14' },
                { label: '已发布', value: `${stats.published_courses || 0} 门`, color: '#1677ff' },
              ]}
              renderItem={(item: any) => (
                <List.Item style={{ paddingLeft: 0, paddingRight: 0, cursor: item.label === '待审核' ? 'pointer' : 'default' }} onClick={() => item.label === '待审核' && navigate('/publication')}>
                  <span style={{ color: item.label === '待审核' ? '#1677ff' : 'inherit' }}>{item.label}</span>
                  <Tag color={item.color} style={{ margin: 0 }}>{item.value}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="维权处理概览" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <List
              size="small"
              dataSource={[
                { label: '已发送通知', value: `${stats.enforcement_notice_sent || 0} 件`, color: '#1677ff' },
                { label: '已下架确认', value: `${stats.enforcement_resolved || 0} 件`, color: '#52c41a' },
                { label: '处理中', value: `${stats.active_enforcement_cases || 0} 件`, color: '#faad14' },
              ]}
              renderItem={(item: any) => (
                <List.Item style={{ paddingLeft: 0, paddingRight: 0, cursor: 'pointer' }} onClick={() => navigate('/enforcement')}>
                  <span style={{ color: '#1677ff' }}>{item.label}</span>
                  <Tag color={item.color} style={{ margin: 0 }}>{item.value}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
