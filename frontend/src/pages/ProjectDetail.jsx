import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Descriptions, Button, Tag, Progress, Timeline, Table, Typography, Space, Divider, List, Avatar, Tabs } from 'antd';
import { ArrowLeftOutlined, ProjectOutlined, CalendarOutlined, UserOutlined, PhoneOutlined, FileTextOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getProjectDetail } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    const res = await getProjectDetail(id);
    if (res.code === 200) {
      setProject(res.data);
    }
    setLoading(false);
  };

  const statusMap = {
    pending: { color: 'orange', text: '待启动' },
    in_progress: { color: 'blue', text: '进行中' },
    paused: { color: 'red', text: '已暂停' },
    completed: { color: 'green', text: '已完成' }
  };

  const taskStatusColor = {
    pending: '#d9d9d9',
    in_progress: '#1890ff',
    completed: '#52c41a'
  };

  const fundStatusMap = {
    frozen: { color: 'default', text: '已冻结' },
    pending_release: { color: 'orange', text: '待释放' },
    released: { color: 'green', text: '已释放' }
  };

  if (!project) return <div>加载中...</div>;

  const taskColumns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name' },
    { title: '计划开始', dataIndex: 'start_date', key: 'start_date', width: 110 },
    { title: '计划完成', dataIndex: 'end_date', key: 'end_date', width: 110 },
    { title: '实际开始', dataIndex: 'actual_start_date', key: 'actual_start_date', width: 110 },
    { 
      title: '进度', 
      key: 'progress', 
      width: 150,
      render: (_, r) => <Progress percent={r.progress} size="small" status={r.status === 'completed' ? 'success' : 'active'} />
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={taskStatusColor[v]}>{statusMap[v]?.text || v}</Tag>
    }
  ];

  const materialColumns = [
    { title: '材料名称', dataIndex: 'material_name', key: 'material_name' },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
    { title: '数量', key: 'qty', width: 100, render: (_, r) => `${r.quantity} ${r.unit}` },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price', width: 100 },
    { title: '小计(元)', dataIndex: 'total_price', key: 'total_price', width: 100, render: v => <span style={{ color: '#f5222d' }}>{v?.toFixed(2)}</span> },
    { title: '计划到场', dataIndex: 'planned_arrival_date', key: 'planned', width: 110 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => {
        const colors = { pending: 'orange', ordered: 'blue', delivered: 'green' };
        const texts = { pending: '待采购', ordered: '已下单', delivered: '已到货' };
        return <Tag color={colors[v]}>{texts[v] || v}</Tag>;
      }
    }
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card loading={loading} bordered={false}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <ProjectOutlined style={{ marginRight: 8 }} />
                {project.title}
                <Tag color={statusMap[project.status]?.color} style={{ marginLeft: 12 }}>{statusMap[project.status]?.text}</Tag>
              </Title>
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                <HomeOutlined style={{ marginRight: 4 }} /> {project.address}
              </Text>
            </div>
            <Space>
              <Button>项目日志</Button>
              <Button type="primary">甘特图</Button>
            </Space>
          </div>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>项目总进度</div>
                <div style={{ fontSize: 32, fontWeight: 600, margin: '8px 0' }}>{project.progress}%</div>
                <Progress percent={project.progress} showInfo={false} strokeColor={{ from: '#108ee9', to: '#87d068' }} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>计划工期</div>
                <div style={{ fontSize: 18, fontWeight: 500, margin: '8px 0' }}>
                  <CalendarOutlined /> {project.start_date} ~ {project.end_date}
                </div>
                <Text type="secondary">共 {dayjs(project.end_date).diff(dayjs(project.start_date), 'day')} 天</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>项目预算</div>
                <div style={{ fontSize: 24, fontWeight: 600, margin: '8px 0', color: '#f5222d' }}>
                  ¥{project.budget?.toLocaleString()}
                </div>
                <Tag color="blue">{project.layout_type}</Tag>
                <Tag color="green">{project.area}㎡</Tag>
                <Tag color="orange">{project.style}</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="info">
          <Tabs.TabPane tab="基本信息" key="info">
            <div className="detail-section">
              <div className="detail-section-title">项目参与方</div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card size="small" title="业主">
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar>{project.owner_name?.charAt(0)}</Avatar>}
                        title={project.owner_name}
                        description={<><PhoneOutlined /> {project.owner_phone}</>}
                      />
                    </List.Item>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="装修公司">
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: '#1890ff' }}>{project.company_name?.charAt(0)}</Avatar>}
                        title={project.company_name}
                        description={<><PhoneOutlined /> {project.company_phone}</>}
                      />
                    </List.Item>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="设计师">
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: '#52c41a' }}>{project.designer_name?.charAt(0)}</Avatar>}
                        title={project.designer_name}
                        description={<><PhoneOutlined /> {project.designer_phone}</>}
                      />
                    </List.Item>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="装修管家">
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: '#fa8c16' }}>{project.manager_name?.charAt(0)}</Avatar>}
                        title={project.manager_name}
                        description={<><PhoneOutlined /> {project.manager_phone}</>}
                      />
                    </List.Item>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="施工任务" key="tasks">
            <Table
              columns={taskColumns}
              dataSource={project.tasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="材料计划" key="materials">
            <Table
              columns={materialColumns}
              dataSource={project.materials}
              rowKey="id"
              pagination={false}
              size="small"
              summary={pageData => {
                let total = 0;
                pageData.forEach(item => { total += item.total_price || 0; });
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5}>合计</Table.Summary.Cell>
                    <Table.Summary.Cell style={{ color: '#f5222d', fontWeight: 600 }}>¥{total.toFixed(2)}</Table.Summary.Cell>
                    <Table.Summary.Cell colSpan={2}></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="资金监管" key="funds">
            <Row gutter={[16, 16]}>
              {project.funds?.map((fund, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                  <Card
                    size="small"
                    style={{
                      borderColor: fund.status === 'released' ? '#52c41a' : 
                                   fund.status === 'pending_release' ? '#fa8c16' : '#d9d9d9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>{fund.stage_name}</Text>
                      <Tag color={fundStatusMap[fund.status]?.color}>{fundStatusMap[fund.status]?.text}</Tag>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d', marginBottom: 8 }}>
                      ¥{fund.amount?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      占比: {fund.payment_ratio}%
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      条件: {fund.release_condition}
                    </div>
                    {fund.status === 'pending_release' && (
                      <Button type="primary" size="small" block style={{ marginTop: 8 }}>
                        申请释放
                      </Button>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProjectDetail;
