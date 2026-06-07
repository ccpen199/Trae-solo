import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, List, Tag, Button, Statistic, Progress, Space, 
  Alert, Avatar, Divider, Steps, Table, Tooltip, Badge,
  Timeline, Tabs, Modal, Form, Input, Tree, Popconfirm, message
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  EnvironmentOutlined, FileTextOutlined, TeamOutlined,
  SafetyCertificateOutlined, ApartmentOutlined, UserOutlined,
  ThunderboltOutlined, RiseOutlined, FallOutlined,
  CoffeeOutlined, BulbOutlined, InfoCircleOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined,
  DashboardOutlined, AuditOutlined, BarChartOutlined,
  SettingOutlined, MonitorOutlined, GlobalOutlined,
  ScheduleOutlined, CopyOutlined
} from '@ant-design/icons';
import { 
  policyAPI, serviceAPI, enterpriseAPI, monitorAPI,
  adminAPI, reservationAPI, declarationAPI 
} from '../services/api';

const { Step } = Steps;
const { TabPane } = Tabs;

function AdminHome() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [effectivenessData, setEffectivenessData] = useState([]);
  const [publishStatus, setPublishStatus] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, metricsRes, appsRes, effectRes, publishRes] = await Promise.all([
        adminAPI.getOverview(),
        monitorAPI.getMetrics(),
        adminAPI.getPendingApplications({ pageSize: 5 }),
        adminAPI.getPolicyEffectiveness(),
        adminAPI.getPublishStatus()
      ]);
      
      setOverview(overviewRes.data.statistics);
      setMetrics(metricsRes.data);
      setPendingApplications(appsRes.data.list || []);
      setEffectivenessData(effectRes.data.policies?.slice(0, 5) || []);
      setPublishStatus(publishRes.data || [
        { terminal: 'Web端', status: 'online', version: 'v2.3.1', publishTime: '2026-06-01 10:00' },
        { terminal: 'H5端', status: 'online', version: 'v2.3.1', publishTime: '2026-06-01 10:05' },
        { terminal: '微信小程序', status: 'online', version: 'v2.3.0', publishTime: '2026-05-28 15:30' },
        { terminal: '支付宝小程序', status: 'pending', version: 'v2.3.1', publishTime: '待发布' },
        { terminal: '自助终端', status: 'online', version: 'v2.2.0', publishTime: '2026-05-20 09:00' }
      ]);
      
      setRejectReasons([
        { name: '材料不完整', count: 42, percent: 35, color: '#ff4d4f' },
        { name: '不符合条件', count: 30, percent: 25, color: '#fa8c16' },
        { name: '信息填写错误', count: 24, percent: 20, color: '#faad14' },
        { name: '重复申报', count: 12, percent: 10, color: '#1890ff' },
        { name: '政策已过期', count: 12, percent: 10, color: '#999' }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const appColumns = [
    { title: '申报编号', dataIndex: 'declarationNo', key: 'no', width: 140, render: t => <code>{t}</code> },
    { title: '政策名称', dataIndex: 'policyTitle', key: 'policy', ellipsis: true },
    { title: '企业名称', dataIndex: 'enterpriseName', key: 'ent', width: 150 },
    { title: '提交时间', dataIndex: 'submitTime', key: 'time', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s) => <Tag color={s === 'pending' ? 'orange' : 'blue'}>
        {s === 'pending' ? '待审核' : '审核中'}
      </Tag>
    },
    { title: '操作', key: 'action', width: 120,
      render: (_, r) => <Space>
        <Button type="link" size="small" onClick={() => navigate(`/admin/applications/${r.id}`)}>
          审核
        </Button>
        <Button type="link" size="small">详情</Button>
      </Space>
    }
  ];

  const effectColumns = [
    { title: '政策名称', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '申报数', dataIndex: 'application_count', key: 'apply', width: 80 },
    { title: '通过数', dataIndex: 'approved_count', key: 'approved', width: 80 },
    { title: '兑付金额', dataIndex: 'benefit', key: 'benefit', width: 120,
      render: v => `${(v / 10000).toFixed(0)}万`
    },
    { title: '通过率', key: 'rate', width: 150,
      render: (_, r) => <Progress 
        percent={r.application_count ? (r.approved_count / r.application_count * 100).toFixed(1) : 0}
        size="small"
      />
    },
    { title: '操作', key: 'action',
      render: (_, r) => <Button type="link" size="small" onClick={() => navigate('/admin/effectiveness')}>
        明细
      </Button>
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <h2 style={{ margin: 0 }}>
            <DashboardOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            省级政务中枢 - 管理工作台
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>
            全省政务服务运行监控、政策兑现效能评估、多端一致性管理
          </p>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            <Button type="primary" icon={<AuditOutlined />} onClick={() => navigate('/admin/applications')}>
              待审核 ({overview?.pendingApplications || 28})
            </Button>
            <Tag color="green"><CheckCircleOutlined /> 系统运行正常</Tag>
          </Space>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Button 
              type="primary" 
              block 
              icon={<DashboardOutlined />}
              onClick={() => navigate('/admin')}
            >
              运行概览
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              block 
              icon={<AuditOutlined />}
              onClick={() => navigate('/admin/applications')}
            >
              申报审核
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              block 
              icon={<BarChartOutlined />}
              onClick={() => navigate('/admin/effectiveness')}
            >
              政策效能
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              block 
              icon={<SettingOutlined />}
              onClick={() => navigate('/admin/services')}
            >
              服务管理
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              block 
              icon={<MonitorOutlined />}
              onClick={() => navigate('/admin/monitor')}
            >
              系统监控
            </Button>
          </Col>
          <Col span={4}>
            <Button 
              block 
              icon={<GlobalOutlined />}
              onClick={() => navigate('/admin/publish')}
            >
              多端发布
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="申报失败率"
              value={5.2}
              suffix="%"
              valueStyle={{ color: '#ff4d4f', fontSize: 22 }}
              prefix={<WarningOutlined />}
            />
            <Progress percent={5.2} showInfo={false} strokeColor="#ff4d4f" size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均办理耗时"
              value={4.8}
              suffix="天"
              valueStyle={{ color: '#1890ff', fontSize: 22 }}
              prefix={<ClockCircleOutlined />}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666' }}>目标：5个工作日内</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="退单率"
              value={12.3}
              suffix="%"
              valueStyle={{ color: '#fa8c16', fontSize: 22 }}
              prefix={<FallOutlined />}
            />
            <Progress percent={12.3} showInfo={false} strokeColor="#fa8c16" size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="政策兑现效能"
              value={86.5}
              suffix="%"
              valueStyle={{ color: '#722ed1', fontSize: 22 }}
              prefix={<RiseOutlined />}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666' }}>
              累计兑付：125,860万元
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card 
            size="small" 
            title="待审核申报（实时）" 
            extra={<Button type="link" size="small" onClick={() => navigate('/admin/applications')}>全部待审 →</Button>}
            style={{ marginBottom: 16 }}
          >
            <Table
              size="small"
              columns={appColumns}
              dataSource={pendingApplications}
              rowKey="id"
              pagination={false}
              scroll={{ y: 240 }}
            />
          </Card>

          <Card 
            size="small" 
            title="政策兑现效能明细" 
            extra={<Button type="link" size="small" onClick={() => navigate('/admin/effectiveness')}>效能报表 →</Button>}
          >
            <Table
              size="small"
              columns={effectColumns}
              dataSource={effectivenessData}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            size="small" 
            title="退单原因聚类（近30天）" 
            style={{ marginBottom: 16 }}
            extra={<Button type="link" size="small" onClick={() => navigate('/admin/effectiveness')}>分析 →</Button>}
          >
            <List
              size="small"
              dataSource={rejectReasons}
              renderItem={item => (
                <List.Item>
                  <Space style={{ width: '100%' }}>
                    <Tag color={item.color} style={{ width: 100 }}>{item.name}</Tag>
                    <Progress percent={item.percent} size="small" strokeColor={item.color} style={{ flex: 1 }} />
                    <span style={{ width: 60, textAlign: 'right' }}>{item.count}件</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card 
            size="small" 
            title="多端发布一致性" 
            extra={<Button type="link" size="small" onClick={() => navigate('/admin/publish')}>发布管理 →</Button>}
            style={{ marginBottom: 16 }}
          >
            <List
              size="small"
              dataSource={publishStatus}
              renderItem={item => (
                <List.Item>
                  <Space style={{ width: '100%' }}>
                    <span style={{ width: 100 }}>{item.terminal}</span>
                    <Tag color={item.status === 'online' ? 'green' : 'orange'}>
                      {item.status === 'online' ? '已上线' : '待发布'}
                    </Tag>
                    <span style={{ flex: 1, fontSize: 12, color: '#666' }}>{item.version}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>{item.publishTime}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card size="small" title="系统健康度">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic title="API成功率" value={metrics?.success_rate || 99.8} suffix="%" valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={12}>
                <Statistic title="平均响应" value={metrics?.average_duration_ms || 156} suffix="ms" valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={12}>
                <Statistic title="今日请求" value={metrics?.requests_per_day || 28560} valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={12}>
                <Statistic title="失败请求" value={metrics?.failed_requests || 3} valueStyle={{ fontSize: 14, color: '#ff4d4f' }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function EnterpriseHome() {
  const navigate = useNavigate();
  const [myEnterprises, setMyEnterprises] = useState([]);
  const [recommendedPolicies, setRecommendedPolicies] = useState([]);
  const [services, setServices] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [queueStatus, setQueueStatus] = useState({});
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [orgTree, setOrgTree] = useState([]);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const [addOrgModalVisible, setAddOrgModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedOrgNode, setSelectedOrgNode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entRes, policyRes, serviceRes, declRes] = await Promise.all([
        enterpriseAPI.getMyEnterprises(),
        policyAPI.getRecommended(),
        serviceAPI.getList({ pageSize: 4 }),
        declarationAPI.getList({ pageSize: 5 })
      ]);
      
      setMyEnterprises(entRes.data || []);
      setRecommendedPolicies(policyRes.data.list || []);
      setServices(serviceRes.data.list || []);
      setDeclarations(declRes.data.list || []);
      
      if (entRes.data?.length > 0) {
        setSelectedEnterprise(entRes.data[0]);
        const orgRes = await enterpriseAPI.getOrgTree(entRes.data[0].id);
        setOrgTree(orgRes.data || []);
      }

      const queuePromises = [1, 2, 3].map(id =>
        reservationAPI.getQueueStatus(id).catch(() => null)
      );
      const queueResults = await Promise.all(queuePromises);
      const queueMap = {};
      queueResults.forEach((q, i) => {
        if (q) queueMap[i + 1] = q.data;
      });
      setQueueStatus(queueMap);
    } catch (err) {
      console.error(err);
    }
  };

  const renderTreeNodes = (data) =>
    data.map(item => ({
      title: (
        <span>
          {item.type === 'headquarters' && <ApartmentOutlined style={{ marginRight: 4 }} />}
          {item.type === 'department' && <TeamOutlined style={{ marginRight: 4 }} />}
          {item.name}
        </span>
      ),
      key: item.id,
      children: item.children?.length > 0 ? renderTreeNodes(item.children) : null
    }));

  const handleBind = async (values) => {
    try {
      await enterpriseAPI.bind(selectedEnterprise.id, values);
      message.success('法人身份绑定成功');
      setBindingModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '绑定失败');
    }
  };

  const handleAddOrg = async (values) => {
    try {
      await enterpriseAPI.addOrg(selectedEnterprise.id, {
        ...values,
        parentId: selectedOrgNode?.id || 0
      });
      message.success('添加成功');
      setAddOrgModalVisible(false);
      form.resetFields();
      const orgRes = await enterpriseAPI.getOrgTree(selectedEnterprise.id);
      setOrgTree(orgRes.data || []);
    } catch (err) {
      message.error('添加失败');
    }
  };

  const hasBoundEnterprise = myEnterprises.some(e => e.bound);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <h2 style={{ margin: 0 }}>
            <ApartmentOutlined style={{ color: '#722ed1', marginRight: 8 }} />
            法人服务工作台
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>
            企业信息管理、惠企政策申报、办事预约、进度查询
          </p>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            {myEnterprises.length > 0 && (
              <Tag color={hasBoundEnterprise ? 'green' : 'orange'}>
                <SafetyCertificateOutlined /> {hasBoundEnterprise ? '法人已认证' : '待法人认证'}
              </Tag>
            )}
            <Button type="primary" onClick={() => navigate('/policy')}>
              政策申报
            </Button>
          </Space>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Button type="primary" block icon={<ApartmentOutlined />} onClick={() => navigate('/enterprise')}>
              企业服务
            </Button>
          </Col>
          <Col span={4}>
            <Button block icon={<FileTextOutlined />} onClick={() => navigate('/policy')}>
              惠企政策
            </Button>
          </Col>
          <Col span={4}>
            <Button block icon={<CopyOutlined />} onClick={() => navigate('/declarations')}>
              我的申报
            </Button>
          </Col>
          <Col span={4}>
            <Button block icon={<ScheduleOutlined />} onClick={() => navigate('/reservation')}>
              预约办事
            </Button>
          </Col>
          <Col span={4}>
            <Button block icon={<BulbOutlined />} onClick={() => navigate('/chat')}>
              智能导办
            </Button>
          </Col>
          <Col span={4}>
            <Button block icon={<EnvironmentOutlined />} onClick={() => navigate('/city')}>
              城市服务
            </Button>
          </Col>
        </Row>
      </Card>

      {!hasBoundEnterprise && myEnterprises.length > 0 && (
        <Alert
          message="请完成法人身份绑定以享受完整服务"
          description={
            <Space>
              <span>绑定后可进行政策申报、进度追踪、预约办事等法人服务</span>
              <Button type="link" size="small" onClick={() => setBindingModalVisible(true)}>
                立即绑定
              </Button>
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            size="small" 
            title="我的企业" 
            extra={<Button type="link" size="small" onClick={() => navigate('/enterprise')}>管理 →</Button>}
            style={{ marginBottom: 16 }}
          >
            {myEnterprises.map(ent => (
              <Card 
                key={ent.id}
                size="small" 
                style={{ marginBottom: 8, cursor: 'pointer' }}
                hoverable
                onClick={() => navigate(`/enterprise/${ent.id}`)}
              >
                <Row align="middle" gutter={16}>
                  <Col span={4}>
                    <Avatar size={48} style={{ backgroundColor: '#722ed1' }}>
                      {ent.name?.charAt(0)}
                    </Avatar>
                  </Col>
                  <Col span={14}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        <strong>{ent.name}</strong>
                        {ent.bound ? (
                          <Tag color="green"><SafetyCertificateOutlined /> 已认证</Tag>
                        ) : (
                          <Tag color="orange">待认证</Tag>
                        )}
                      </Space>
                      <Space wrap size={[4, 0]}>
                        <Tag color="blue">{ent.industry || '制造业'}</Tag>
                        <Tag color="green">{ent.scale || '规上企业'}</Tag>
                        <Tag color="orange">年纳税{(ent.tax_amount / 10000 || 500).toFixed(0)}万</Tag>
                      </Space>
                    </Space>
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                    <Button type="link" size="small">详情 →</Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>

          {selectedEnterprise && (
            <Card 
              size="small" 
              title="组织架构" 
              extra={
                <Space>
                  <Button type="link" size="small" onClick={() => { setSelectedOrgNode(null); setAddOrgModalVisible(true); }}>
                    <PlusOutlined /> 添加部门
                  </Button>
                  <Button type="link" size="small" onClick={() => navigate(`/enterprise/${selectedEnterprise.id}`)}>
                    管理 →
                  </Button>
                </Space>
              }
            >
              {orgTree.length > 0 ? (
                <Tree
                  showLine
                  defaultExpandAll
                  treeData={renderTreeNodes(orgTree)}
                  style={{ padding: 8 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  <ApartmentOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                  <p>暂无组织架构</p>
                  <Button size="small" onClick={() => { setSelectedOrgNode(null); setAddOrgModalVisible(true); }}>
                    添加第一个部门
                  </Button>
                </div>
              )}
            </Card>
          )}
        </Col>

        <Col span={12}>
          <Card 
            size="small" 
            title="智能匹配的惠企政策" 
            extra={<Button type="link" size="small" onClick={() => navigate('/policy')}>更多 →</Button>}
            style={{ marginBottom: 16 }}
          >
            {myEnterprises.length > 0 && (
              <Alert
                message={
                  <Space wrap>
                    <span>企业画像：</span>
                    <Tag color="blue">制造业</Tag>
                    <Tag color="green">规上企业</Tag>
                    <Tag color="orange">年纳税500万</Tag>
                    <Tag color="geekblue">3个部门</Tag>
                  </Space>
                }
                type="success"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}
            
            {recommendedPolicies.length > 0 ? (
              <List
                size="small"
                dataSource={recommendedPolicies.slice(0, 3)}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="link" size="small" onClick={() => navigate(`/policy/${item.id}`)}>申报</Button>]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {item.matchTags?.slice(0, 2).map((t, i) => (
                            <Tag key={i} color={i === 0 ? 'red' : 'blue'}>{t}</Tag>
                          ))}
                          <span>{item.title}</span>
                          <Tag color="purple">匹配度 {item.matchScore}%</Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Tag color="orange">最高{(item.benefit_amount / 10000 || 100).toFixed(0)}万</Tag>
                          <span style={{ color: '#666', fontSize: 12 }}>{item.apply_count || 256}家已申报</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="绑定企业后获取精准推荐" />
            )}
          </Card>

          <Card 
            size="small" 
            title="我的申报进度" 
            extra={<Button type="link" size="small" onClick={() => navigate('/declarations')}>全部 →</Button>}
          >
            {declarations.length > 0 ? (
              <List
                size="small"
                dataSource={declarations.slice(0, 3)}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <code style={{ color: '#1890ff' }}>{item.declarationNo}</code>
                          <span>{item.policyTitle}</span>
                        </Space>
                      }
                      description={
                        <Space>
                          <Steps size="small" current={Math.floor(item.progress / 30)} style={{ maxWidth: 300 }}>
                            <Step title="提交" />
                            <Step title="审核" />
                            <Step title="办结" />
                          </Steps>
                          <Progress percent={item.progress || 50} size="small" style={{ width: 100 }} />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无申报记录" />
            )}
          </Card>
        </Col>
      </Row>

      <Card 
        size="small" 
        title="热门服务事项" 
        extra={<Button type="link" size="small" onClick={() => navigate('/services')}>更多 →</Button>}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          {services.slice(0, 4).map(item => (
            <Col span={6} key={item.id}>
              <Card 
                size="small" 
                hoverable
                onClick={() => navigate(`/services/${item.item_code}`)}
                style={{ cursor: 'pointer', height: 220 }}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <Tag color="blue">{item.item_code}</Tag>
                    <Tag color="green"><CheckCircleOutlined /> 全省通办</Tag>
                  </Space>
                  <h4 style={{ margin: '4px 0' }}>{item.name}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{item.department}</p>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: 12 }}>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} /> 线下网点：
                    </p>
                    <Space wrap size={[4, 2]}>
                      {['省中心', '杭州', '宁波'].map((name, idx) => (
                        <Badge 
                          key={idx}
                          status={queueStatus[idx + 1]?.waitingCount >= 15 ? 'error' : 'success'}
                        >
                          <span style={{ fontSize: 11 }}>{name}</span>
                        </Badge>
                      ))}
                    </Space>
                  </div>
                  
                  <div>
                    <p style={{ margin: '8px 0 4px 0', fontSize: 12 }}>
                      <ClockCircleOutlined style={{ color: '#722ed1' }} /> 可预约时段：
                    </p>
                    <Space wrap size={[4, 2]}>
                      {['09:00', '10:00', '14:00', '15:00'].map(time => (
                        <Tag key={time} color="success" style={{ fontSize: 11, padding: '0 4px' }}>
                          {time}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title="法人身份绑定"
        open={bindingModalVisible}
        onCancel={() => setBindingModalVisible(false)}
        footer={null}
        width={450}
      >
        <Form form={form} layout="vertical" onFinish={handleBind}>
          <Form.Item name="name" label="法定代表人姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入法定代表人真实姓名" />
          </Form.Item>
          <Form.Item name="idCard" label="法定代表人身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入18位身份证号码" maxLength={18} />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="系统将验证您输入的信息与企业工商登记信息是否一致"
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Button type="primary" htmlType="submit" block>验证并绑定</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加部门"
        open={addOrgModalVisible}
        onCancel={() => setAddOrgModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrg}>
          {selectedOrgNode && (
            <Alert type="info" message={`将在「${selectedOrgNode.name}」下添加子部门`} style={{ marginBottom: 16 }} />
          )}
          <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="type" label="部门类型" initialValue="department">
            <Select>
              <Select.Option value="headquarters">总部</Select.Option>
              <Select.Option value="department">部门</Select.Option>
              <Select.Option value="team">小组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function PersonalHome() {
  const navigate = useNavigate();
  
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <UserOutlined style={{ color: '#1890ff', marginRight: 8 }} />
        个人服务工作台
      </h2>
      
      <Alert
        message="个人服务模块开发中..."
        description="个人社保、医保、公积金、出入境等便民服务即将上线，敬请期待"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Button block disabled>社保服务</Button>
          </Col>
          <Col span={6}>
            <Button block disabled>医保服务</Button>
          </Col>
          <Col span={6}>
            <Button block disabled>公积金</Button>
          </Col>
          <Col span={6}>
            <Button block disabled>出入境</Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="智能导办">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <BulbOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <p style={{ marginTop: 16 }}>小浙智能助手7×24小时在线</p>
              <Button type="primary" onClick={() => navigate('/chat')} style={{ marginTop: 8 }}>
                开始咨询
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="城市服务">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <EnvironmentOutlined style={{ fontSize: 48, color: '#13c2c2' }} />
              <p style={{ marginTop: 16 }}>便民服务地图即将上线</p>
              <Button type="primary" disabled style={{ marginTop: 8 }}>
                敬请期待
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function Home() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.userType === 'admin';
  const isEnterprise = user?.userType === 'enterprise';

  if (isAdmin) {
    return <AdminHome />;
  } else if (isEnterprise) {
    return <EnterpriseHome />;
  } else {
    return <PersonalHome />;
  }
}

export default Home;
