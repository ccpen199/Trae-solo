import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Typography,
  App,
  Row,
  Col,
  List,
  Avatar,
  Empty,
  Divider,
  Tabs,
  Image,
  Statistic,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  RobotOutlined,
  UserOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface DemandDetail {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_phone: string;
  city: string;
  district: string;
  address: string;
  house_type: string;
  area: number;
  budget_min: number;
  budget_max: number;
  decoration_style: string;
  requirement_desc: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'matched' | 'signed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface AISolution {
  id: string;
  demand_id: string;
  style_plan: string;
  layout_plan: string;
  material_plan: string;
  estimated_budget: number;
  estimated_period: number;
  renderings: string;
  created_at: string;
}

interface DesignerMatch {
  id: string;
  designer_id: string;
  designer_name: string;
  store_id: string;
  store_name: string;
  match_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待匹配', color: 'orange' },
  matched: { text: '已匹配', color: 'blue' },
  signed: { text: '已签约', color: 'purple' },
  in_progress: { text: '施工中', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const DemandDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [demand, setDemand] = useState<DemandDetail | null>(null);
  const [aiSolution, setAiSolution] = useState<AISolution | null>(null);
  const [matches, setMatches] = useState<DesignerMatch[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [matchingDesigners, setMatchingDesigners] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);

  const fetchDemand = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/demands/${id}`);
      setDemand(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取需求详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAISolution = async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/demands/${id}/ai-solution`);
      setAiSolution(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        message.error('获取AI方案失败');
      }
    }
  };

  const fetchMatches = async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/demands/${id}/matches`);
      setMatches(response.data);
    } catch (error: any) {
      message.error('获取设计师匹配失败');
    }
  };

  useEffect(() => {
    fetchDemand();
    fetchAISolution();
    fetchMatches();
  }, [id]);

  const handleGenerateAISolution = async () => {
    if (!id) return;
    setGeneratingAI(true);
    try {
      const response = await apiClient.post(`/demands/${id}/ai-solution`);
      setAiSolution(response.data);
      await fetchDemand();
      message.success('AI方案生成成功！');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'AI方案生成失败');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleMatchDesigners = async () => {
    if (!id) return;
    setMatchingDesigners(true);
    try {
      const response = await apiClient.post(`/demands/${id}/match-designers`);
      setMatches(response.data);
      message.success('设计师匹配完成！');
    } catch (error: any) {
      message.error(error.response?.data?.error || '设计师匹配失败');
    } finally {
      setMatchingDesigners(false);
    }
  };

  const handleConfirmDesigner = (matchId: string, designerName: string) => {
    modal.confirm({
      title: '确认设计师',
      content: `您确定要选择设计师「${designerName}」吗？确认后将无法更改。`,
      okText: '确认选择',
      cancelText: '取消',
      onOk: async () => {
        setConfirmLoading(matchId);
        try {
          await apiClient.post(`/demands/matches/${matchId}/accept`);
          await fetchMatches();
          await fetchDemand();
          message.success('设计师确认成功！');
        } catch (error: any) {
          message.error(error.response?.data?.error || '确认失败');
        } finally {
          setConfirmLoading(null);
        }
      },
    });
  };

  const renderInfoCard = () => {
    if (!demand) return null;
    const statusInfo = statusMap[demand.status] || { text: demand.status, color: 'default' };

    return (
      <Card
        loading={loading}
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/demands')}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>需求详情</Title>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Space>
        }
        extra={
          <Space>
            {(user?.role === 'owner' || user?.role === 'store_manager' || user?.role === 'designer') && (
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleGenerateAISolution}
                loading={generatingAI}
                disabled={!!aiSolution}
              >
                {aiSolution ? 'AI方案已生成' : '生成AI方案'}
              </Button>
            )}
            {(user?.role === 'owner' || user?.role === 'store_manager') && (
              <Button
                icon={<UserOutlined />}
                onClick={handleMatchDesigners}
                loading={matchingDesigners}
              >
                {matches.length > 0 ? '重新匹配设计师' : '匹配设计师'}
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="需求编号">
                <Text code>{demand.id.slice(0, 8)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="业主">{demand.owner_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{demand.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(demand.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col xs={12}>
                <Card size="small">
                  <Statistic
                    title="建筑面积"
                    value={demand.area}
                    suffix="㎡"
                    prefix={<HomeOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12}>
                <Card size="small">
                  <Statistic
                    title="预算范围"
                    value={(demand.budget_min / 10000).toFixed(1)}
                    suffix={`-${(demand.budget_max / 10000).toFixed(1)}万`}
                    prefix={<WalletOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12}>
                <Card size="small">
                  <Statistic
                    title="户型"
                    value={demand.house_type}
                    suffix=""
                  />
                </Card>
              </Col>
              <Col xs={12}>
                <Card size="small">
                  <Statistic
                    title="装修风格"
                    value={demand.decoration_style}
                    suffix=""
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        <Descriptions column={1} size="middle">
          <Descriptions.Item label="房屋地址">
            <Space>
              <EnvironmentOutlined />
              <span>{demand.city} {demand.district} {demand.address}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="需求描述">
            <Paragraph style={{ marginBottom: 0 }}>
              {demand.requirement_desc || '暂无详细描述'}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const renderAISolution = () => {
    if (!aiSolution) {
      return (
        <Card title={
          <Space>
            <RobotOutlined />
            <span>AI装修方案</span>
          </Space>
        }>
          <Empty
            description="暂无AI方案"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {(user?.role === 'owner' || user?.role === 'store_manager' || user?.role === 'designer') && (
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleGenerateAISolution}
                loading={generatingAI}
              >
                立即生成AI方案
              </Button>
            )}
          </Empty>
        </Card>
      );
    }

    const renderings = JSON.parse(aiSolution.renderings || '[]');

    return (
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>AI装修方案</span>
            <Tag color="green">已生成</Tag>
          </Space>
        }
        extra={
          <Text type="secondary">
            <ClockCircleOutlined /> {new Date(aiSolution.created_at).toLocaleString('zh-CN')}
          </Text>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title="预估预算"
                value={(aiSolution.estimated_budget / 10000).toFixed(1)}
                suffix="万元"
                prefix={<WalletOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title="预估工期"
                value={aiSolution.estimated_period}
                suffix="天"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="style">
          <TabPane tab="风格方案" key="style">
            <Card type="inner" title="整体风格定位">
              <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                {aiSolution.style_plan}
              </Paragraph>
            </Card>
          </TabPane>
          <TabPane tab="空间布局" key="layout">
            <Card type="inner" title="空间规划方案">
              <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                {aiSolution.layout_plan}
              </Paragraph>
            </Card>
          </TabPane>
          <TabPane tab="材料方案" key="material">
            <Card type="inner" title="主要材料清单">
              <List
                dataSource={aiSolution.material_plan.split('\n').filter(Boolean)}
                renderItem={(item) => (
                  <List.Item>
                    <FileTextOutlined style={{ marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>
          <TabPane tab="效果图预览" key="renderings">
            {renderings.length > 0 ? (
              <Image.PreviewGroup>
                <Row gutter={[16, 16]}>
                  {renderings.map((img: string, idx: number) => (
                    <Col xs={24} md={8} key={idx}>
                      <Image
                        width="100%"
                        height={200}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        src={img}
                        alt={`效果图 ${idx + 1}`}
                        fallback="https://via.placeholder.com/400x300?text=装修效果图"
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            ) : (
              <Empty description="暂无效果图" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  const renderDesignerMatches = () => {
    const acceptedMatch = matches.find(m => m.status === 'accepted');

    return (
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>设计师匹配</span>
            {acceptedMatch && <Tag color="green">已确认设计师</Tag>}
          </Space>
        }
        extra={
          (user?.role === 'owner' || user?.role === 'store_manager') && (
            <Button
              icon={<UserOutlined />}
              onClick={handleMatchDesigners}
              loading={matchingDesigners}
            >
              {matches.length > 0 ? '重新匹配' : '匹配设计师'}
            </Button>
          )
        }
      >
        {matches.length === 0 ? (
          <Empty
            description="暂无匹配的设计师"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {(user?.role === 'owner' || user?.role === 'store_manager') && (
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={handleMatchDesigners}
                loading={matchingDesigners}
              >
                立即匹配设计师
              </Button>
            )}
          </Empty>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
            dataSource={matches}
            renderItem={(match) => (
              <List.Item>
                <Card
                  hoverable
                  actions={
                    user?.role === 'owner' && match.status === 'pending' && !acceptedMatch
                      ? [
                          <Button
                            key="confirm"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={confirmLoading === match.id}
                            onClick={() => handleConfirmDesigner(match.id, match.designer_name)}
                          >
                            确认选择
                          </Button>,
                        ]
                      : []
                  }
                >
                  <Card.Meta
                    avatar={
                      <Avatar size={64} icon={<UserOutlined />}>
                        {match.designer_name?.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <Space>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>{match.designer_name}</span>
                        {match.status === 'accepted' && (
                          <Tag color="green" icon={<CheckCircleOutlined />}>已选中</Tag>
                        )}
                        {match.status === 'rejected' && (
                          <Tag color="red">已拒绝</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary">所属门店</Text>
                          <Text>{match.store_name || '-'}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary">匹配度</Text>
                          <Tag color="blue" style={{ margin: 0 }}>
                            {match.match_score} 分
                          </Tag>
                        </div>
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    );
  };

  return (
    <div>
      {renderInfoCard()}
      {renderAISolution()}
      {renderDesignerMatches()}
    </div>
  );
};

export default DemandDetail;
