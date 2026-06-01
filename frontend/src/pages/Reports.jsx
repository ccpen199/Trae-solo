import React, { useState, useEffect } from 'react';
import { Table, Card, Select, message, Tag, Descriptions, Tabs, Statistic, Row, Col, Progress, List } from 'antd';
import { reportsApi, segmentsApi, productsApi } from '../api';
import { BarChartOutlined, UserOutlined, DollarOutlined, CheckCircleOutlined, ArrowUpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

function Reports() {
  const [overview, setOverview] = useState({});
  const [marketingEffects, setMarketingEffects] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [channels, setChannels] = useState([]);
  const [products, setProducts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadData();
    loadSegments();
    loadProducts();
  }, [selectedSegment, selectedProduct]);

  const loadData = async () => {
    try {
      const [overviewRes, funnelRes, channelsRes, productsRes] = await Promise.all([
        reportsApi.getOverview(),
        reportsApi.getFunnel(),
        reportsApi.getChannelAnalysis(),
        reportsApi.getProductPerformance()
      ]);
      
      setOverview(overviewRes.data.data);
      setFunnel(funnelRes.data.data);
      setChannels(channelsRes.data.data);
      setProductList(productsRes.data.data);
    } catch (error) {
      message.error('加载报表数据失败');
    }
  };

  const loadSegments = async () => {
    try {
      const res = await segmentsApi.getRules();
      setSegments(res.data.data);
    } catch (error) {
      message.error('加载客群规则失败');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productsApi.getList();
      setProducts(res.data.data);
    } catch (error) {
      message.error('加载产品失败');
    }
  };

  useEffect(() => {
    const loadMarketingEffect = async () => {
      if (selectedSegment || selectedProduct) {
        try {
          const params = {};
          if (selectedSegment) params.segment_rule_id = selectedSegment;
          if (selectedProduct) params.product_id = selectedProduct;
          const res = await reportsApi.getMarketingEffect(params);
          setMarketingEffects(res.data.data);
        } catch (error) {
          message.error('加载营销效果失败');
        }
      }
    };
    loadMarketingEffect();
  }, [selectedSegment, selectedProduct]);

  const effectColumns = [
    { title: '客户', dataIndex: 'name', key: 'name', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '客群规则', dataIndex: 'segment_name', key: 'segment_name', width: 150 },
    { title: '产品', dataIndex: 'product_name', key: 'product_name', width: 120 },
    { title: '触达次数', dataIndex: 'touch_count', key: 'touch_count', width: 100,
      render: (v) => <Tag color="blue">{v}次</Tag>
    },
    { title: '申请次数', dataIndex: 'application_count', key: 'application_count', width: 100,
      render: (v) => <Tag color="orange">{v}次</Tag>
    },
    { title: '审批通过', dataIndex: 'approved_count', key: 'approved_count', width: 100,
      render: (v) => <Tag color="green">{v}次</Tag>
    },
    { title: '审批金额', dataIndex: 'total_approved_amount', key: 'total_approved_amount', width: 120,
      render: (v) => v ? `¥${v.toLocaleString()}` : '-'
    },
  ];

  const productColumns = [
    { title: '产品名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '期数', dataIndex: 'periods', key: 'periods', width: 80 },
    { title: '申请数', dataIndex: 'application_count', key: 'application_count', width: 100 },
    { title: '通过数', dataIndex: 'approved_count', key: 'approved_count', width: 100 },
    { title: '通过率', key: 'rate', width: 100,
      render: (_, r) => r.application_count > 0 ? `${((r.approved_count / r.application_count) * 100).toFixed(1)}%` : '0%'
    },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 120,
      render: (v) => v ? `¥${v.toLocaleString()}` : '-'
    },
    { title: '总手续费', dataIndex: 'total_fee', key: 'total_fee', width: 120,
      render: (v) => v ? `¥${v.toLocaleString()}` : '-'
    },
  ];

  const funnelSteps = [
    { key: 'segments', name: '客群筛选', icon: 'UserOutlined', color: '#1890ff' },
    { key: 'touches', name: '客户触达', icon: 'BarChartOutlined', color: '#52c41a' },
    { key: 'applications', name: '提交申请', icon: 'DollarOutlined', color: '#faad14' },
    { key: 'approved', name: '审批通过', icon: 'CheckCircleOutlined', color: '#722ed1' },
  ];
  
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'UserOutlined': return <UserOutlined />;
      case 'BarChartOutlined': return <BarChartOutlined />;
      case 'DollarOutlined': return <DollarOutlined />;
      case 'CheckCircleOutlined': return <CheckCircleOutlined />;
      default: return null;
    }
  };

  const tabsItems = [
    {
      key: 'overview',
      label: '总览',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic title="客户总数" value={overview.total_customers || 0} prefix={<UserOutlined />} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="总触达次数" value={overview.total_touches || 0} prefix={<BarChartOutlined />} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="申请总数" value={overview.total_applications || 0} prefix={<DollarOutlined />} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="审批通过" value={overview.approved_applications || 0} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="审批金额(万)" value={Math.floor((overview.total_amount || 0) / 10000)} precision={0} />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic title="待跟进" value={overview.follow_up_tasks || 0} valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
          </Row>

          <Card title="营销效果筛选">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Select placeholder="选择客群规则" style={{ width: '100%' }} allowClear onChange={setSelectedSegment}>
                  {segments.map(s => (
                    <Option key={s.id} value={s.id}>{s.name} ({s.rule_version})</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Select placeholder="选择产品" style={{ width: '100%' }} allowClear onChange={setSelectedProduct}>
                  {products.map(p => (
                    <Option key={p.id} value={p.id}>{p.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {marketingEffects.length > 0 && (
              <Table columns={effectColumns} dataSource={marketingEffects} rowKey="id" pagination={{ pageSize: 10 }} />
            )}
          </Card>
        </div>
      )
    },
    {
      key: 'funnel',
      label: '转化漏斗',
      children: (
        <Card title="转化漏斗">
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0' }}>
            <List
              dataSource={funnelSteps}
              renderItem={(step, index) => {
                const funnelData = funnel[index] || { count: 0 };
                const prevFunnelData = funnel[index - 1] || { count: 0 };
                
                const count = funnelData.count || 0;
                const prevCount = index === 0 ? count : prevFunnelData.count || 0;
                const totalCount = funnel[0]?.count || 1;
                const rate = prevCount > 0 ? (count / prevCount * 100).toFixed(1) : 0;
                const totalRate = totalCount > 0 ? (count / totalCount * 100).toFixed(1) : 0;

                return (
                  <List.Item style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                        <Tag color={step.color} icon={getIcon(step.icon)} style={{ fontSize: 16, padding: '8px 16px' }}>
                          {step.name}
                        </Tag>
                      </div>
                      <Statistic value={count} suffix="人" style={{ marginBottom: 8 }} />
                      <div>
                        <Progress percent={parseFloat(totalRate)} status="active" strokeColor={step.color} />
                        <div style={{ fontSize: 12, color: '#999' }}>
                          占总客群 {totalRate}%
                          {index > 0 && <span style={{ marginLeft: 8, color: step.color }}>
                            <ArrowUpOutlined /> 上一步转化 {rate}%
                          </span>}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        </Card>
      )
    },
    {
      key: 'channels',
      label: '渠道分析',
      children: (
        <Card title="渠道分析">
          <Row gutter={16}>
            {channels.map(channel => (
              <Col span={8} key={channel.channel}>
                <Card hoverable>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="渠道">
                      <Tag color="blue">{channel.channel}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="触达总数">{channel.total}</Descriptions.Item>
                    <Descriptions.Item label="已申请">
                      <Tag color="green">{channel.applied}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="客户拒绝">
                      <Tag color="red">{channel.rejected}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="未接通">
                      <Tag color="orange">{channel.no_answer}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="转化率">
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        {channel.conversion_rate}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )
    },
    {
      key: 'products',
      label: '产品表现',
      children: (
        <Card title="产品表现">
          <Table columns={productColumns} dataSource={productList} rowKey="id" pagination={false} />
        </Card>
      )
    },
    {
      key: 'trace',
      label: '客户追踪',
      children: (
        <Card title="客户追踪说明">
          <div style={{ padding: '20px' }}>
            <h3>追踪路径</h3>
            <p>客群筛选 → 客户触达 → 分期申请 → 审批通过 → 生成还款计划</p>
            
            <h3 style={{ marginTop: 24 }}>数据关联</h3>
            <ul>
              <li>每个触达记录关联具体客户、产品和客群规则</li>
              <li>每个分期申请关联审批结果和营销来源</li>
              <li>营销效果表按客群+产品+客户维度聚合统计</li>
              <li>可追踪每个客户从触达到最终分期的完整转化路径</li>
            </ul>

            <h3 style={{ marginTop: 24 }}>报表口径</h3>
            <ul>
              <li>触达次数：该客户通过该客群规则+产品被触达的次数</li>
              <li>申请次数：该客户通过该客群规则+产品提交的申请次数</li>
              <li>审批通过：该客户通过该客群规则+产品最终审批通过的次数</li>
              <li>转化率：审批通过数 / 触达次数</li>
            </ul>
          </div>
        </Card>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>营销报表</h2>
      <Tabs defaultActiveKey="overview" items={tabsItems} />
    </div>
  );
}

export default Reports;
