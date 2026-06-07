import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Spin, List, Tag, Progress } from 'antd';
import {
  ProjectOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  ShopOutlined,
  CarOutlined,
  AccountBookOutlined,
  BarChartOutlined,
  LineChartOutlined,
  WarningOutlined,
  FundOutlined,
  FileTextOutlined,
  PictureOutlined,
  AppstoreOutlined,
  RocketOutlined,
  AuditOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  SafetyOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  FolderOutlined,
  CheckSquareOutlined
} from '@ant-design/icons';
import api from '@/utils/api';
import { getUser } from '@/utils/auth';

const { Title, Text } = Typography;

type DashboardData = {
  projectsCount: number;
  activeProjects: number;
  pendingInspections: number;
  completedProjects: number;
  usersCount: number;
  ownersCount: number;
  designersCount: number;
  companiesCount: number;
  suppliersCount: number;
};

type RecentActivity = {
  id: number;
  action: string;
  time: string;
  type: string;
};

type OwnerPortfolio = {
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  activeProjects: number;
  pendingDesigns: number;
  pendingQuotations: number;
  pendingInspections: number;
};

type DesignerStats = {
  ongoingProjects: number;
  pendingReviews: number;
  completedDesigns: number;
};

type CompanyStats = {
  contractFulfillmentRate: number;
  ongoingProjects: number;
  pendingInspections: number;
  pendingQuotations: number;
};

type SupplierStats = {
  lowStockItems: number;
  pendingOrders: number;
};

const defaultData: DashboardData = {
  projectsCount: 0,
  activeProjects: 0,
  pendingInspections: 0,
  completedProjects: 0,
  usersCount: 0,
  ownersCount: 0,
  designersCount: 0,
  companiesCount: 0,
  suppliersCount: 0
};

const defaultOwnerPortfolio: OwnerPortfolio = {
  totalBudget: 500000,
  spentBudget: 280000,
  remainingBudget: 220000,
  activeProjects: 2,
  pendingDesigns: 1,
  pendingQuotations: 3,
  pendingInspections: 2
};

const defaultDesignerStats: DesignerStats = {
  ongoingProjects: 5,
  pendingReviews: 3,
  completedDesigns: 12
};

const defaultCompanyStats: CompanyStats = {
  contractFulfillmentRate: 94.5,
  ongoingProjects: 8,
  pendingInspections: 4,
  pendingQuotations: 6
};

const defaultSupplierStats: SupplierStats = {
  lowStockItems: 5,
  pendingOrders: 12
};

const cardStyles: Record<string, { background: string; borderRadius: number; border: string }> = {
  projects: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 10, border: 'none' },
  active: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 10, border: 'none' },
  inspection: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: 10, border: 'none' },
  completed: { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 10, border: 'none' },
  users: { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: 10, border: 'none' },
  owners: { background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', borderRadius: 10, border: 'none' },
  designers: { background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', borderRadius: 10, border: 'none' },
  companies: { background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', borderRadius: 10, border: 'none' },
  suppliers: { background: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', borderRadius: 10, border: 'none' },
  budget: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 10, border: 'none' },
  spent: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 10, border: 'none' },
  remaining: { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 10, border: 'none' },
  entry1: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 10, border: 'none' },
  entry2: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 10, border: 'none' },
  entry3: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: 10, border: 'none' },
  entry4: { background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 10, border: 'none' },
  entry5: { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: 10, border: 'none' },
  entry6: { background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', borderRadius: 10, border: 'none' }
};

const clickableCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const cardHoverStyle: React.CSSProperties = {
  transform: 'translateY(-4px)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
};

const roleLabel: Record<string, string> = {
  admin: '管理员',
  owner: '业主',
  designer: '设计师',
  company: '装修公司',
  supplier: '供应商'
};

const typeColor: Record<string, string> = {
  project: 'blue',
  inspection: 'orange',
  material: 'green',
  system: 'default'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(defaultData);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerPortfolio, setOwnerPortfolio] = useState<OwnerPortfolio>(defaultOwnerPortfolio);
  const [designerStats, setDesignerStats] = useState<DesignerStats>(defaultDesignerStats);
  const [companyStats, setCompanyStats] = useState<CompanyStats>(defaultCompanyStats);
  const [supplierStats, setSupplierStats] = useState<SupplierStats>(defaultSupplierStats);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const user = getUser<{ username: string; role: string; name: string; id?: string | number }>();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isDesigner = user?.role === 'designer';
  const isCompany = user?.role === 'company';
  const isSupplier = user?.role === 'supplier';

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const endpoint = isAdmin ? '/admin/dashboard' : '/dashboard/stats';
        const res = await api.get(endpoint).catch(() => api.get('/admin/dashboard'));
        setData(res.data.data || defaultData);
        try {
          const actRes = await api.get('/dashboard/activities');
          setActivities(actRes.data.data || []);
        } catch {
          setActivities([]);
        }
      } catch {
        setData(defaultData);
      }
      try {
        if (isOwner && user?.id) {
          const ownerRes = await api.get(`/api/owners/${user.id}/portfolio`);
          setOwnerPortfolio(ownerRes.data.data || defaultOwnerPortfolio);
        } else if (isOwner) {
          const ownerRes = await api.get('/api/dashboard/stats');
          setOwnerPortfolio(ownerRes.data.data || defaultOwnerPortfolio);
        }
      } catch {
        setOwnerPortfolio(defaultOwnerPortfolio);
      }
      try {
        if (isDesigner) {
          const designerRes = await api.get('/api/dashboard/stats');
          setDesignerStats(designerRes.data.data || defaultDesignerStats);
        }
      } catch {
        setDesignerStats(defaultDesignerStats);
      }
      try {
        if (isCompany) {
          const companyRes = await api.get('/api/dashboard/stats');
          setCompanyStats(companyRes.data.data || defaultCompanyStats);
        }
      } catch {
        setCompanyStats(defaultCompanyStats);
      }
      try {
        if (isSupplier) {
          const supplierRes = await api.get('/api/dashboard/stats');
          setSupplierStats(supplierRes.data.data || defaultSupplierStats);
        }
      } catch {
        setSupplierStats(defaultSupplierStats);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, [isAdmin, isOwner, isDesigner, isCompany, isSupplier, user?.id]);

  const handleCardNavigate = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          欢迎回来，{user?.name || user?.username || '用户'}
        </Title>
        <Text type="secondary">
          当前角色：{roleLabel[user?.role || ''] || user?.role || '未知'}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }} style={cardStyles.projects}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>项目总数</span>}
              value={data.projectsCount}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }} style={cardStyles.active}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>进行中项目</span>}
              value={data.activeProjects}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }} style={cardStyles.inspection}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待验收</span>}
              value={data.pendingInspections}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }} style={cardStyles.completed}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>已完成项目</span>}
              value={data.completedProjects}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={8} lg={Math.floor(24 / 5) as 4}>
            <Card styles={{ body: { padding: 20 } }} style={cardStyles.users}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>用户总数</span>}
                value={data.usersCount}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card styles={{ body: { padding: 20 } }} style={cardStyles.owners}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>业主</span>}
                value={data.ownersCount}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card styles={{ body: { padding: 20 } }} style={cardStyles.designers}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>设计师</span>}
                value={data.designersCount}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card styles={{ body: { padding: 20 } }} style={cardStyles.companies}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>装修公司</span>}
                value={data.companiesCount}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card styles={{ body: { padding: 20 } }} style={cardStyles.suppliers}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>供应商</span>}
                value={data.suppliersCount}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#fff' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {isAdmin && (
        <Card title="运营总览" style={{ marginTop: 16, borderRadius: 10 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry1,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'admin-reconciliation' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('admin-reconciliation')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <AccountBookOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>资金共管对账</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>管理资金流水与对账记录</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry2,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'admin-price' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('admin-price')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <BarChartOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>城市价格指数</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>查看各城市装修价格走势</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry3,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'admin-designer' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('admin-designer')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <LineChartOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>设计师产能分析</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>分析设计师工作效率与产出</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry4,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'admin-complaint' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('admin-complaint')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/admin')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <WarningOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>投诉根因分析</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>分析投诉原因与改进措施</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {isOwner && (
        <Card title="我的装修进度" style={{ marginTop: 16, borderRadius: 10 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} lg={8}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.budget}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总预算</span>}
                  value={ownerPortfolio.totalBudget}
                  precision={0}
                  prefix="¥"
                  valueStyle={{ color: '#fff' }}
                />
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)', fontSize: 12, marginBottom: 4 }}>
                    <span>已花费: ¥{ownerPortfolio.spentBudget.toLocaleString()}</span>
                    <span>{Math.round((ownerPortfolio.spentBudget / ownerPortfolio.totalBudget) * 100)}%</span>
                  </div>
                  <Progress
                    percent={Math.round((ownerPortfolio.spentBudget / ownerPortfolio.totalBudget) * 100)}
                    showInfo={false}
                    strokeColor="#fff"
                    trailColor="rgba(255,255,255,0.3)"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.spent}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>已花费</span>}
                  value={ownerPortfolio.spentBudget}
                  precision={0}
                  prefix="¥"
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.remaining}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>剩余预算</span>}
                  value={ownerPortfolio.remainingBudget}
                  precision={0}
                  prefix="¥"
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry1,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'owner-projects' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('owner-projects')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/projects')}
              >
                <div style={{ textAlign: 'center' }}>
                  <FolderOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>我的项目</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{ownerPortfolio.activeProjects} 个进行中</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry2,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'owner-designs' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('owner-designs')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/designs')}
              >
                <div style={{ textAlign: 'center' }}>
                  <PictureOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>设计方案</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{ownerPortfolio.pendingDesigns} 个待确认</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry3,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'owner-quotations' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('owner-quotations')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/quotations')}
              >
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>报价对比</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{ownerPortfolio.pendingQuotations} 个待处理</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={4}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry4,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'owner-inspections' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('owner-inspections')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/inspections')}
              >
                <div style={{ textAlign: 'center' }}>
                  <CheckSquareOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>验收任务</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{ownerPortfolio.pendingInspections} 个待验收</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {isDesigner && (
        <Card title="设计产能看板" style={{ marginTop: 16, borderRadius: 10 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.projects}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>进行中项目</span>}
                  value={designerStats.ongoingProjects}
                  prefix={<RocketOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.inspection}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待审核方案</span>}
                  value={designerStats.pendingReviews}
                  prefix={<AuditOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.completed}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>已完成方案</span>}
                  value={designerStats.completedDesigns}
                  prefix={<FileDoneOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry5,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'designer-designs' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('designer-designs')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/designs')}
              >
                <div style={{ textAlign: 'center' }}>
                  <PictureOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>我的设计方案</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>查看与管理所有方案</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {isCompany && (
        <Card title="履约管理看板" style={{ marginTop: 16, borderRadius: 10 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.entry1}>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <SafetyOutlined /> 合同履约率
                </div>
                <Statistic
                  value={companyStats.contractFulfillmentRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.active}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>在施工项目</span>}
                  value={companyStats.ongoingProjects}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.inspection}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待验收任务</span>}
                  value={companyStats.pendingInspections}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry3,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'company-quotations' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('company-quotations')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/quotations')}
              >
                <div style={{ textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>报价管理</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{companyStats.pendingQuotations} 个待处理</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry4,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'company-inspections' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('company-inspections')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/inspections')}
              >
                <div style={{ textAlign: 'center' }}>
                  <CheckSquareOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>验收管理</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>管理所有验收任务</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {isSupplier && (
        <Card title="品控与库存" style={{ marginTop: 16, borderRadius: 10 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.spent}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>库存预警</span>}
                  value={supplierStats.lowStockItems}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card styles={{ body: { padding: 20 } }} style={cardStyles.entry2}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>待处理订单</span>}
                  value={supplierStats.pendingOrders}
                  prefix={<InboxOutlined />}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} lg={6}>
              <Card
                styles={{ body: { padding: 20 } }}
                style={{
                  ...cardStyles.entry3,
                  ...clickableCardStyle,
                  ...(hoveredCard === 'supplier-materials' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('supplier-materials')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardNavigate('/materials')}
              >
                <div style={{ textAlign: 'center' }}>
                  <ShoppingCartOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }} />
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>材料管理</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>库存与订单管理</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="最近动态" style={{ marginTop: 16, borderRadius: 10 }}>
        {activities.length > 0 ? (
          <List
            dataSource={activities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      {item.action} <Tag color={typeColor[item.type] || 'default'}>{item.type}</Tag>
                    </span>
                  }
                  description={item.time}
                />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">暂无动态</Text>
        )}
      </Card>
    </div>
  );
}
