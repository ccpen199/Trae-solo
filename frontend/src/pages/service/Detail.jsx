import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Tag, Button, Row, Col, Timeline, Steps, 
  Table, Collapse, Alert, Statistic, Space, Tooltip, Divider, List,
  Checkbox, message, Modal, Radio
} from 'antd';
import { 
  CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined, 
  FileTextOutlined, SafetyCertificateOutlined, TeamOutlined,
  InfoCircleOutlined, ThunderboltOutlined, ArrowLeftOutlined,
  CalendarOutlined, UserOutlined
} from '@ant-design/icons';
import { serviceAPI, reservationAPI, enterpriseAPI } from '../../services/api';

const { Step } = Steps;
const { Panel } = Collapse;

function ServiceDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [branches, setBranches] = useState([]);
  const [myEnterprises, setMyEnterprises] = useState([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState(null);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [materialChecks, setMaterialChecks] = useState({});

  useEffect(() => {
    loadData();
    loadMyEnterprises();
  }, [code]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [serviceRes, branchesRes] = await Promise.all([
        serviceAPI.getDetail(code),
        reservationAPI.getBranches({ serviceCode: code })
      ]);
      setService(serviceRes.data);
      setBranches(branchesRes.data || []);
      
      const materials = {};
      (serviceRes.data.required_materials_list || []).forEach(m => {
        materials[m.id] = m.required === false;
      });
      setMaterialChecks(materials);
    } catch (err) {
      console.error(err);
      message.error('加载服务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMyEnterprises = async () => {
    try {
      const res = await enterpriseAPI.getMyEnterprises();
      setMyEnterprises(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusTag = (status) => {
    const configs = {
      active: { color: 'green', text: '全省通办', icon: <CheckCircleOutlined /> },
      pilot: { color: 'blue', text: '试点运行', icon: <ThunderboltOutlined /> },
      suspended: { color: 'orange', text: '暂停办理', icon: <ClockCircleOutlined /> },
      offline: { color: 'default', text: '仅线下', icon: <EnvironmentOutlined /> }
    };
    const cfg = configs[status] || configs.active;
    return <Tag icon={cfg.icon} color={cfg.color}>{cfg.text}</Tag>;
  };

  const getLevelTag = (level) => {
    const colors = {
      national: 'red',
      provincial: 'blue',
      municipal: 'green',
      district: 'purple'
    };
    const names = {
      national: '国家级',
      provincial: '省级',
      municipal: '市级',
      district: '区级'
    };
    return <Tag color={colors[level]}>{names[level] || level}</Tag>;
  };

  const getServiceTypeTag = (type) => {
    const configs = {
      online: { color: 'cyan', text: '全程网办' },
      hybrid: { color: 'blue', text: '线上线下融合' },
      offline: { color: 'orange', text: '线下办理' }
    };
    const cfg = configs[type] || configs.hybrid;
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const allMaterialsReady = (service?.required_materials_list || []).every(m => 
    !m.required || materialChecks[m.id]
  );

  const hasBoundEnterprise = myEnterprises.some(e => e.bound);

  const handleReservation = () => {
    if (!hasBoundEnterprise) {
      setBindingModalVisible(true);
      return;
    }
    if (!allMaterialsReady) {
      message.warning('请确认必备材料已准备齐全');
      return;
    }
    navigate(`/reservation?service=${service.id}&code=${service.item_code}`);
  };

  const handleOnlineApply = () => {
    if (!hasBoundEnterprise) {
      setBindingModalVisible(true);
      return;
    }
    if (!allMaterialsReady) {
      message.warning('请确认必备材料已准备齐全');
      return;
    }
    message.info('线上申报功能开发中，即将跳转...');
  };

  if (loading && !service) return <Card loading>加载中...</Card>;
  if (!service) return <Card>服务事项不存在</Card>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/services')}
        >
          返回服务大厅
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={16}>
            <div style={{ marginBottom: 16 }}>
              <Space wrap size={[8, 8]}>
                {getStatusTag(service.status)}
                {getLevelTag(service.level)}
                {getServiceTypeTag(service.service_type)}
                <Tag color="geekblue">{service.category}</Tag>
              </Space>
            </div>
            <h2 style={{ marginBottom: 8 }}>{service.name}</h2>
            <div style={{ color: '#666', marginBottom: 16 }}>
              <Tag>事项编码：{service.item_code}</Tag>
              <Tag>实施主体：{service.department}</Tag>
              <Tag>联办机构：{service.collaborative_departments || '无'}</Tag>
            </div>
            <p style={{ color: '#666', lineHeight: 1.8 }}>{service.description}</p>
          </Col>
          <Col span={8}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic 
                    title="法定办结时限" 
                    value={service.legal_deadline || 20} 
                    suffix="个工作日"
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic 
                    title="承诺办结时限" 
                    value={service.promise_deadline || 10} 
                    suffix="个工作日"
                    valueStyle={{ fontSize: 18, color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic 
                    title="办理形式" 
                    value={service.apply_method || '窗口办理'}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic 
                    title="到办事现场次数" 
                    value={service.visit_count || 1}
                    suffix="次"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="办理流程" style={{ marginBottom: 16 }}>
            <Steps 
              direction="vertical" 
              current={-1}
              items={[
                {
                  title: '申请与受理',
                  description: (
                    <div>
                      <p style={{ margin: '4px 0' }}>1. 申请人通过线上或线下渠道提交申请材料</p>
                      <p style={{ margin: '4px 0' }}>2. 受理人员对材料进行初审（1个工作日）</p>
                      <p style={{ margin: '4px 0' }}>3. 材料齐全符合法定形式的，出具《受理通知书》</p>
                    </div>
                  ),
                  status: 'process'
                },
                {
                  title: '审查与决定',
                  description: (
                    <div>
                      <p style={{ margin: '4px 0' }}>1. 业务部门对申请材料进行实质审查（5个工作日）</p>
                      <p style={{ margin: '4px 0' }}>2. 如需现场核查，组织人员赴现场核验</p>
                      <p style={{ margin: '4px 0' }}>3. 部门负责人作出审批决定（2个工作日）</p>
                    </div>
                  ),
                  status: 'wait'
                },
                {
                  title: '颁证与送达',
                  description: (
                    <div>
                      <p style={{ margin: '4px 0' }}>1. 制作批准文书或许可证件（2个工作日）</p>
                      <p style={{ margin: '4px 0' }}>2. 通知申请人领取或通过快递送达</p>
                    </div>
                  ),
                  status: 'wait'
                }
              ]}
            />
          </Card>

          <Card title="申请材料" style={{ marginBottom: 16 }}>
            <Alert
              type="info"
              showIcon
              message={
                <Space>
                  <span>材料校验状态：</span>
                  {allMaterialsReady ? (
                    <Tag color="green"><CheckCircleOutlined /> 材料齐全</Tag>
                  ) : (
                    <Tag color="orange"><InfoCircleOutlined /> 请确认必备材料</Tag>
                  )}
                </Space>
              }
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={service.required_materials_list || []}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Checkbox 
                      checked={materialChecks[item.id]}
                      onChange={(e) => setMaterialChecks({...materialChecks, [item.id]: e.target.checked})}
                    >
                      我已准备
                    </Checkbox>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      item.required ? 
                        <Tag color="red" style={{ margin: 0 }}>必备</Tag> :
                        <Tag color="default">容缺</Tag>
                    }
                    title={
                      <Space>
                        <span>{item.name}</span>
                        <Tag color="blue">{item.type}</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          原件{item.original_count}份，复印件{item.copy_count}份
                        </span>
                      </Space>
                    }
                    description={
                      <div style={{ color: '#666', fontSize: 12 }}>
                        <p style={{ margin: 0 }}>材料说明：{item.description}</p>
                        <p style={{ margin: '4px 0 0 0' }}>填报须知：{item.instructions}</p>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="线上线下同源办理网点">
            <Alert
              message="全省通办，就近办理"
              description="以下网点均可办理此业务，线上线下数据同源同步"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              size="small"
              dataSource={branches}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '网点名称',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <Space>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <span>{text}</span>
                      {(record.is_main || record.id === branches[0]?.id) && <Tag color="red">主办</Tag>}
                    </Space>
                  )
                },
                {
                  title: '地址',
                  dataIndex: 'address',
                  key: 'address',
                  render: (text, record) => (
                    <Tooltip title={`经度：${record.lng || record.gis_longitude}，纬度：${record.lat || record.gis_latitude}`}>
                      <span>{text}</span>
                    </Tooltip>
                  )
                },
                {
                  title: '办理时间',
                  dataIndex: 'work_hours',
                  key: 'work_time',
                  render: (value, record) => value || record.work_time || '-',
                  width: 200
                },
                {
                  title: '联系电话',
                  dataIndex: 'phone',
                  key: 'phone',
                  width: 130
                },
                {
                  title: '在线预约',
                  key: 'action',
                  width: 100,
                  render: (_, record) => (
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate(`/reservation?branch=${record.id}&service=${service.id}`)}
                    >
                      <CalendarOutlined /> 预约
                    </Button>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title="办理入口" 
            style={{ marginBottom: 16, position: 'sticky', top: 16 }}
            extra={
              <Tooltip title="法人身份绑定后方可办理">
                <SafetyCertificateOutlined style={{ color: hasBoundEnterprise ? '#52c41a' : '#faad14' }} />
              </Tooltip>
            }
          >
            {!hasBoundEnterprise && (
              <Alert
                type="warning"
                showIcon
                message="请先完成法人身份绑定"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>办理法人服务事项需先绑定企业身份</p>
                    <Button type="link" size="small" onClick={() => setBindingModalVisible(true)}>
                      立即绑定 →
                    </Button>
                  </div>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            {myEnterprises.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>选择办理企业：</div>
                <Radio.Group 
                  value={selectedEnterprise} 
                  onChange={(e) => setSelectedEnterprise(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {myEnterprises.map(e => (
                    <Radio key={e.id} value={e.id} style={{ display: 'block', marginBottom: 8 }}>
                      <Space>
                        <span>{e.name}</span>
                        {e.bound ? (
                          <Tag color="green" size="small"><CheckCircleOutlined /> 已绑定</Tag>
                        ) : (
                          <Tag color="orange" size="small">待认证</Tag>
                        )}
                      </Space>
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            )}

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                size="large" 
                block
                icon={<FileTextOutlined />}
                onClick={handleOnlineApply}
              >
                在线申报
              </Button>
              <Button 
                size="large" 
                block
                icon={<CalendarOutlined />}
                onClick={handleReservation}
              >
                预约线下办理
              </Button>
              <Button 
                size="large" 
                block
                icon={<UserOutlined />}
              >
                进度查询
              </Button>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Collapse ghost size="small">
              <Panel header="收费标准" key="1">
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                  本事项不收取任何费用
                </p>
              </Panel>
              <Panel header="设定依据" key="2">
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                  {service.legal_basis || '《中华人民共和国行政许可法》及相关规定'}
                </p>
              </Panel>
              <Panel header="常见问题" key="3">
                <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  <strong>Q：材料不齐可以先受理吗？</strong>
                </p>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                  A：对于非核心材料，可以容缺受理，后续在规定时限内补齐即可。
                </p>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  <strong>Q：可以委托他人办理吗？</strong>
                </p>
                <p style={{ fontSize: 12, color: '#666' }}>
                  A：可以，需提供授权委托书和受托人身份证明。
                </p>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>

      <Modal
        title="法人身份绑定"
        open={bindingModalVisible}
        onCancel={() => setBindingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBindingModalVisible(false)}>取消</Button>,
          <Button 
            key="go" 
            type="primary" 
            onClick={() => {
              setBindingModalVisible(false);
              navigate('/enterprise');
            }}
          >
            前往绑定
          </Button>
        ]}
      >
        <Alert
          type="info"
          showIcon
          message="办理法人服务事项需完成企业身份绑定"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>绑定后可作为企业经办人办理各类政务服务</li>
              <li>需要法定代表人授权或企业公章认证</li>
              <li>绑定成功后，全省政务服务事项通用</li>
            </ul>
          }
        />
      </Modal>
    </div>
  );
}

export default ServiceDetail;
