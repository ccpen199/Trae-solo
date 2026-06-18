import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tabs,
  Table,
  List,
  Rate,
  Tag,
  Progress,
  Avatar,
  Spin,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { workerApi } from '../../api';
import {
  Worker,
  SkillCertificate,
  Order,
  WorkerRoleMap,
  OrderStatusMap,
  OrderStatusColor,
} from '../../types';

interface ReviewItem {
  id: string;
  worker_id: string;
  employer_id: string;
  order_id: string;
  rating: number;
  content: string;
  tags: string;
  created_at: string;
  employer_name?: string;
  order_title?: string;
}

interface TrainingProgressItem {
  id: string;
  worker_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  course_title?: string;
  category?: string;
  level?: string;
}

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [certificates, setCertificates] = useState<SkillCertificate[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgressItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await workerApi.detail(id!);
      setWorker(result.worker);
      setCertificates(result.certificates || []);
      setReviews(result.reviews || []);
      setRecentOrders(result.recentOrders || []);
      setTrainingProgress(result.trainingProgress || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '正常' },
      inactive: { color: 'default', text: '停用' },
      pending_review: { color: 'orange', text: '待审核' },
    };
    const cfg = map[status] || { color: 'default', text: status };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const certColumns = [
    {
      title: '证书类型',
      dataIndex: 'certificate_type',
      key: 'certificate_type',
      width: 160,
      render: (text: string, record: SkillCertificate) => (
        <Space>
          <span>{text}</span>
          {record.verified ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>已认证</Tag>
          ) : (
            <Tag color="orange" icon={<ClockCircleOutlined />}>待审核</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '证书编号',
      dataIndex: 'certificate_number',
      key: 'certificate_number',
      width: 180,
    },
    {
      title: '发证机构',
      dataIndex: 'issuing_authority',
      key: 'issuing_authority',
    },
    {
      title: '发证日期',
      dataIndex: 'issue_date',
      key: 'issue_date',
      width: 120,
    },
    {
      title: '有效期至',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (text: string) => text || <Tag color="default">长期有效</Tag>,
    },
  ];

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <span style={{ color: '#1677ff' }}>{text.slice(0, 8)}...</span>,
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '雇主',
      dataIndex: 'employer_name',
      key: 'employer_name',
      width: 100,
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      width: 100,
      render: (role: string) => WorkerRoleMap[role as keyof typeof WorkerRoleMap] || role,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={OrderStatusColor[status as keyof typeof OrderStatusColor]}>
          {OrderStatusMap[status as keyof typeof OrderStatusMap]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
  ];

  const levelMap: Record<string, { color: string; text: string }> = {
    beginner: { color: 'green', text: '初级' },
    intermediate: { color: 'blue', text: '中级' },
    advanced: { color: 'purple', text: '高级' },
  };

  const categoryMap: Record<string, string> = {
    nanny: '保姆类',
    cleaner: '保洁类',
    maternity: '月嫂类',
    general: '通用类',
  };

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <FileTextOutlined /> 基本档案
        </span>
      ),
      children: (
        <div>
          <Card title="个人信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="middle">
              <Descriptions.Item label="姓名">{worker?.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{worker?.phone}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="blue">
                  {WorkerRoleMap[worker?.role as keyof typeof WorkerRoleMap]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="年龄">{worker?.age} 岁</Descriptions.Item>
              <Descriptions.Item label="性别">
                {worker?.gender === 'female' ? '女' : '男'}
              </Descriptions.Item>
              <Descriptions.Item label="籍贯">{worker?.native_place || '-'}</Descriptions.Item>
              <Descriptions.Item label="学历">{worker?.education || '-'}</Descriptions.Item>
              <Descriptions.Item label="从业年限">{worker?.experience_years} 年</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                {statusTag(worker?.status || '')}
              </Descriptions.Item>
              <Descriptions.Item label="技能标签" span={2}>
                <Space size={[4, 4]} wrap>
                  {(worker?.skills || []).map((skill, idx) => (
                    <Tag key={idx} color="blue">{skill}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="语言能力" span={2}>
                <Space size={[4, 4]} wrap>
                  {(worker?.languages || []).map((lang, idx) => (
                    <Tag key={idx} color="cyan">{lang}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="服务城市" span={2}>
                <Space size={[4, 4]} wrap>
                  {(worker?.service_cities_data || []).map((city, idx) => (
                    <Tag key={idx} color="geekblue">{city}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="业务数据">
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Card className="stat-card">
                  <Rate disabled allowHalf value={worker?.rating || 0} style={{ fontSize: 16 }} />
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                    {worker?.rating?.toFixed(1) || 0}
                    <span style={{ fontSize: 14, color: '#999', marginLeft: 4 }}>分</span>
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>综合评分</div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="stat-card">
                  <div style={{ fontSize: 14, color: '#999' }}>评价数</div>
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                    {worker?.review_count || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>条评价</div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="stat-card">
                  <div style={{ fontSize: 14, color: '#999' }}>订单总数</div>
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                    {worker?.order_count || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>单</div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card className="stat-card">
                  <div style={{ fontSize: 14, color: '#999' }}>完成订单</div>
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                    {worker?.completed_orders || 0}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>单</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'certificates',
      label: (
        <span>
          <CheckCircleOutlined /> 技能证书
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          columns={certColumns}
          dataSource={certificates}
          pagination={false}
          locale={{ emptyText: '暂无证书数据' }}
        />
      ),
    },
    {
      key: 'reviews',
      label: (
        <span>
          <StarOutlined /> 历史评价
        </span>
      ),
      children: (
        <List
          locale={{ emptyText: '暂无评价' }}
          dataSource={reviews}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{item.employer_name || '匿名用户'}</span>
                    <Rate disabled value={item.rating} style={{ fontSize: 14 }} />
                    <span style={{ color: '#999', fontSize: 12 }}>{item.created_at}</span>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ color: '#333', marginBottom: 8 }}>{item.content || '无评价内容'}</div>
                    <div>
                      {item.order_title && (
                        <Tag color="blue">订单：{item.order_title}</Tag>
                      )}
                      {item.tags &&
                        (typeof item.tags === 'string' ? item.tags.split(',').filter(Boolean) : [])
                          .slice(0, 5)
                          .map((tag, idx) => (
                            <Tag key={idx} color="green">
                              {tag}
                            </Tag>
                          ))}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'orders',
      label: (
        <span>
          <ClockCircleOutlined /> 最近订单
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          columns={orderColumns}
          dataSource={recentOrders}
          pagination={false}
          locale={{ emptyText: '暂无订单记录' }}
        />
      ),
    },
    {
      key: 'training',
      label: (
        <span>
          <BookOutlined /> 培训进度
        </span>
      ),
      children: trainingProgress.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无培训记录</div>
      ) : (
        <List
          dataSource={trainingProgress}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 16 }}>{item.course_title}</span>
                    <Space style={{ marginLeft: 12 }}>
                      <Tag color={levelMap[item.level || 'beginner']?.color}>
                        {levelMap[item.level || 'beginner']?.text}
                      </Tag>
                      <Tag color="purple">
                        {categoryMap[item.category || 'general']}
                      </Tag>
                      {item.completed ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>
                      ) : (
                        <Tag color="orange" icon={<ClockCircleOutlined />}>进行中</Tag>
                      )}
                    </Space>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
                    {item.progress}%
                  </div>
                </div>
                <Progress
                  percent={item.progress}
                  status={item.completed ? 'success' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/workers')}
                >
                  返回列表
                </Button>
                <span style={{ fontSize: 18, fontWeight: 600 }}>
                  {worker?.name} 的详细档案
                </span>
                {statusTag(worker?.status || '')}
              </Space>
            </div>
          }
        />

        <Card bodyStyle={{ padding: 0 }}>
          <Tabs
            defaultActiveKey="basic"
            items={tabItems}
            size="large"
            style={{ padding: '0 24px 24px' }}
            tabBarStyle={{ padding: '0 8px' }}
          />
        </Card>
      </Spin>
    </div>
  );
}
