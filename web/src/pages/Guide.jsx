import React, { useState } from 'react';
import { Card, Steps, Row, Col, Button, List, Checkbox, Tag, Spin, Descriptions, Empty, message } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { search as searchApi } from '../api';

const scenarios = [
  { key: 'person', label: '个人办事', icon: <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />, desc: '户籍、社保、医保等个人业务' },
  { key: 'enterprise', label: '企业办事', icon: <TeamOutlined style={{ fontSize: 32, color: '#722ed1' }} />, desc: '注册、许可、税务等企业业务' },
];

const categories = {
  person: [
    { key: 'identity', label: '户籍身份', icon: '🪪' },
    { key: 'social_security', label: '社会保障', icon: '🛡️' },
    { key: 'medical', label: '医疗健康', icon: '🏥' },
    { key: 'tax', label: '税务财务', icon: '💰' },
    { key: 'housing', label: '住房建设', icon: '🏠' },
    { key: 'education', label: '教育科研', icon: '🎓' },
    { key: 'civil', label: '民政服务', icon: '🤝' },
    { key: 'transport', label: '交通运输', icon: '🚗' },
  ],
  enterprise: [
    { key: 'registration', label: '设立变更', icon: '📝' },
    { key: 'license', label: '资质许可', icon: '📋' },
    { key: 'tax_ent', label: '税务财务', icon: '💰' },
    { key: 'social_ent', label: '社会保障', icon: '🛡️' },
    { key: 'construction', label: '工程建设', icon: '🏗️' },
    { key: 'environment_ent', label: '环保安全', icon: '🌿' },
    { key: 'market_ent', label: '市场监管', icon: '📊' },
    { key: 'import_export', label: '外贸外资', icon: '🌐' },
  ],
};

export default function Guide() {
  const [current, setCurrent] = useState(0);
  const [scenario, setScenario] = useState(null);
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetail, setItemDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScenarioSelect = (key) => {
    setScenario(key);
    setCategory(null);
    setItems([]);
    setSelectedItem(null);
    setItemDetail(null);
    setCurrent(1);
  };

  const handleCategorySelect = async (key) => {
    setCategory(key);
    setSelectedItem(null);
    setItemDetail(null);
    setLoading(true);
    setCurrent(2);
    try {
      const res = await searchApi.searchItems({ scenario, category: key });
      const d = res.data?.data || res.data || {};
      setItems(d.items || d.list || []);
    } catch {
      message.error('获取事项列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = async (item) => {
    setSelectedItem(item);
    setLoading(true);
    setCurrent(3);
    try {
      const res = await searchApi.precheckItem(item.id);
      const d = res.data?.data || res.data || {};
      setItemDetail(d);
    } catch {
      setItemDetail(item);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setScenario(null);
    setCategory(null);
    setItems([]);
    setSelectedItem(null);
    setItemDetail(null);
  };

  const stepsItems = [
    { title: '选择场景', icon: <QuestionCircleOutlined /> },
    { title: '选择类别', icon: <FileTextOutlined /> },
    { title: '选择事项', icon: <CheckCircleOutlined /> },
    { title: '材料预检', icon: <CheckCircleOutlined /> },
  ];

  return (
    <div>
      <Card>
        <Steps current={current} items={stepsItems} style={{ marginBottom: 32 }} />

        {current === 0 && (
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: 24 }}>请选择办事场景</h3>
            <Row gutter={32} justify="center">
              {scenarios.map((s) => (
                <Col xs={24} sm={12} md={8} key={s.key}>
                  <Card
                    hoverable
                    onClick={() => handleScenarioSelect(s.key)}
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      border: scenario === s.key ? '2px solid #1890ff' : undefined,
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>{s.icon}</div>
                    <h3>{s.label}</h3>
                    <p style={{ color: '#999' }}>{s.desc}</p>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {current === 1 && scenario && (
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: 24 }}>
              请选择事项类别
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {scenarios.find((s) => s.key === scenario)?.label}
              </Tag>
            </h3>
            <Row gutter={[16, 16]}>
              {(categories[scenario] || []).map((cat) => (
                <Col xs={12} sm={8} md={6} key={cat.key}>
                  <Card
                    hoverable
                    onClick={() => handleCategorySelect(cat.key)}
                    style={{
                      textAlign: 'center',
                      padding: '16px 8px',
                      border: category === cat.key ? '2px solid #1890ff' : undefined,
                    }}
                    size="small"
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                    <div>{cat.label}</div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button onClick={() => setCurrent(0)}>上一步</Button>
            </div>
          </div>
        )}

        {current === 2 && (
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: 24 }}>推荐事项</h3>
            <Spin spinning={loading}>
              {items.length === 0 ? (
                <Empty description="暂无相关事项" />
              ) : (
                <List
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" onClick={() => handleItemSelect(item)}>
                          选择
                        </Button>,
                        <Button size="small" onClick={() => navigate(`/items/${item.id}`)}>
                          查看详情
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <div>
                            <Tag>{item.department_name || '-'}</Tag>
                            <Tag>{item.item_type || '-'}</Tag>
                            {item.time_limit && <Tag color="blue">{item.time_limit}个工作日</Tag>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button onClick={() => setCurrent(1)}>上一步</Button>
            </div>
          </div>
        )}

        {current === 3 && (
          <div>
            <h3 style={{ textAlign: 'center', marginBottom: 24 }}>
              材料预检 -
              <span style={{ color: '#1890ff' }}>{selectedItem?.name || ''}</span>
            </h3>
            <Spin spinning={loading}>
              {itemDetail ? (
                <div>
                  <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="事项名称">{itemDetail.name || selectedItem?.name}</Descriptions.Item>
                    <Descriptions.Item label="所属部门">{itemDetail.department_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="法定时限">{itemDetail.time_limit ? `${itemDetail.time_limit}个工作日` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="申请条件">{itemDetail.conditions || '-'}</Descriptions.Item>
                  </Descriptions>

                  <Card title="所需材料清单" size="small" style={{ marginBottom: 16 }}>
                    {(itemDetail.required_materials || itemDetail.materials || []).length === 0 ? (
                      <Empty description="暂无材料要求" />
                    ) : (
                      (itemDetail.required_materials || itemDetail.materials || []).map((mat, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Checkbox />
                            <span>{mat.name}</span>
                            {mat.is_required ? <Tag color="red">必须</Tag> : <Tag>可选</Tag>}
                          </div>
                          <div>
                            <Tag>{mat.category === 'form' ? '表格' : mat.category === 'certificate' ? '证照' : mat.category === 'report' ? '报告' : '其他'}</Tag>
                          </div>
                        </div>
                      ))
                    )}
                  </Card>

                  <Card title="办理流程" size="small">
                    <Steps
                      current={0}
                      items={(itemDetail.process_steps || [
                        { name: '受理' },
                        { name: '审核' },
                        { name: '审批' },
                        { name: '办结' },
                      ]).map((s) => ({
                        title: s.name,
                        description: s.description,
                      }))}
                      size="small"
                    />
                  </Card>

                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Button type="primary" onClick={() => navigate('/items/' + (selectedItem?.id || ''))}>
                      查看事项详情
                    </Button>
                    <Button style={{ marginLeft: 12 }} onClick={() => setCurrent(2)}>
                      上一步
                    </Button>
                    <Button style={{ marginLeft: 12 }} onClick={handleReset}>
                      重新导办
                    </Button>
                  </div>
                </div>
              ) : (
                <Empty description="暂无信息" />
              )}
            </Spin>
          </div>
        )}
      </Card>
    </div>
  );
}
