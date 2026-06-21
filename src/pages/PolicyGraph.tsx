import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Tag,
  Input,
  Select,
  Button,
  Tabs,
  Modal,
  Form,
  List,
  Timeline,
  Tree,
  Space,
  Typography,
  Empty,
  message,
} from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { get } from '../utils/api';
import {
  policyDocuments as mockPolicyDocuments,
  cityPolicies,
} from '../../shared/mockData';
import {
  PolicyDocument,
  CITIES,
  CITY_NAMES,
  INSURANCE_NAMES,
  InsuranceType,
  CityCode,
} from '../../shared/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ALL_CITIES = [...CITIES, 'NATIONAL' as const];
const ALL_CITY_NAMES: Record<string, string> = {
  ...CITY_NAMES,
  NATIONAL: '全国',
};
const ALL_INSURANCE_TYPES: InsuranceType[] = [
  'PENSION',
  'MEDICAL',
  'UNEMPLOYMENT',
  'INJURY',
  'MATERNITY',
  'HOUSING_FUND',
];

type GraphNodeCategory = 'city' | 'policy' | 'group' | 'authority';

interface GraphNode {
  id: string;
  name: string;
  category: GraphNodeCategory;
  symbolSize: number;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  value?: string;
}

function PolicyGraph() {
  const [policies, setPolicies] = useState<PolicyDocument[]>(mockPolicyDocuments);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [activeTab, setActiveTab] = useState('graph');
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [subscribeForm] = Form.useForm();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await get('/policy/search');
      if (res?.data?.list) {
        setPolicies(res.data.list);
      }
    } catch (e) {
      setPolicies(mockPolicyDocuments);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies = useMemo(() => {
    let result = [...policies];
    if (selectedCity.length > 0) {
      result = result.filter(
        (p) => selectedCity.includes(p.cityCode) || p.cityCode === 'NATIONAL'
      );
    }
    if (selectedInsurance.length > 0) {
      const insNames = selectedInsurance.map((i) => INSURANCE_NAMES[i as InsuranceType]);
      result = result.filter(
        (p) =>
          insNames.includes(p.category) ||
          p.tags.some((t) => insNames.some((n) => t.includes(n)))
      );
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.content.toLowerCase().includes(kw) ||
          p.tags.some((t) => t.toLowerCase().includes(kw))
      );
    }
    return result;
  }, [policies, selectedCity, selectedInsurance, keyword]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeSet = new Set<string>();

    Object.entries(ALL_CITY_NAMES).forEach(([code, name]) => {
      nodes.push({
        id: `city_${code}`,
        name,
        category: 'city',
        symbolSize: 55,
        cityCode: code,
      });
      nodeSet.add(`city_${code}`);
    });

    const authoritySet = new Set<string>();
    const groupSet = new Set<string>();

    filteredPolicies.forEach((policy) => {
      if (!nodeSet.has(policy.id)) {
        nodes.push({
          id: policy.id,
          name: policy.title.length > 12 ? policy.title.slice(0, 12) + '...' : policy.title,
          category: 'policy',
          symbolSize: 45,
          fullTitle: policy.title,
          docNo: policy.docNo,
          issuingAuthority: policy.issuingAuthority,
          status: policy.status,
          cityCode: policy.cityCode,
        });
        nodeSet.add(policy.id);
      }

      const cityNodeId = `city_${policy.cityCode}`;
      if (nodeSet.has(cityNodeId)) {
        links.push({ source: cityNodeId, target: policy.id, value: '适用' });
      }

      if (!authoritySet.has(policy.issuingAuthority)) {
        const authId = `auth_${policy.issuingAuthority}`;
        nodes.push({
          id: authId,
          name: policy.issuingAuthority.length > 8 ? policy.issuingAuthority.slice(0, 8) + '...' : policy.issuingAuthority,
          category: 'authority',
          symbolSize: 50,
          fullName: policy.issuingAuthority,
        });
        authoritySet.add(policy.issuingAuthority);
        nodeSet.add(authId);
      }
      links.push({
        source: `auth_${policy.issuingAuthority}`,
        target: policy.id,
        value: '发布',
      });

      policy.applicableGroups.forEach((group) => {
        const groupId = `group_${group}`;
        if (!groupSet.has(group)) {
          nodes.push({
            id: groupId,
            name: group,
            category: 'group',
            symbolSize: 40,
          });
          groupSet.add(group);
          nodeSet.add(groupId);
        }
        links.push({ source: policy.id, target: groupId, value: '适用' });
      });

      policy.relatedDocIds.forEach((rid) => {
        if (nodeSet.has(rid) && filteredPolicies.find((p) => p.id === rid)) {
          links.push({ source: policy.id, target: rid, value: '关联' });
        }
      });
    });

    return { nodes, links };
  }, [filteredPolicies]);

  const chartOption: EChartsOption = useMemo(() => {
    const categoryColors: Record<GraphNodeCategory, string> = {
      city: '#1890ff',
      policy: '#52c41a',
      group: '#fa8c16',
      authority: '#722ed1',
    };
    const categoryNames: Record<GraphNodeCategory, string> = {
      city: '城市',
      policy: '法规',
      group: '适用人群',
      authority: '发文机关',
    };

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const d = params.data;
          if (!d) return '';
          let html = `<div style="font-weight:600;margin-bottom:6px">${d.fullTitle || d.fullName || d.name}</div>`;
          html += `<div style="color:#666">类型：${categoryNames[d.category as GraphNodeCategory]}</div>`;
          if (d.docNo) html += `<div style="color:#666">文号：${d.docNo}</div>`;
          if (d.issuingAuthority) html += `<div style="color:#666">机关：${d.issuingAuthority}</div>`;
          if (d.status) html += `<div style="color:${d.status === 'EFFECTIVE' ? '#52c41a' : '#999'}">状态：${d.status === 'EFFECTIVE' ? '有效' : '失效'}</div>`;
          return html;
        },
      },
      legend: [
        {
          data: ['城市', '法规', '适用人群', '发文机关'],
          orient: 'vertical',
          right: 10,
          top: 20,
        },
      ],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          name: '政策知识图谱',
          type: 'graph',
          layout: 'force',
          data: graphData.nodes.map((n) => ({
            ...n,
            itemStyle: { color: categoryColors[n.category] },
            category: categoryNames[n.category],
          })),
          links: graphData.links,
          categories: [
            { name: '城市' },
            { name: '法规' },
            { name: '适用人群' },
            { name: '发文机关' },
          ],
          roam: true,
          draggable: true,
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            formatter: '{b}',
          },
          edgeLabel: {
            show: true,
            fontSize: 10,
            formatter: (p: any) => p.data.value || '',
          },
          force: {
            repulsion: 400,
            edgeLength: [80, 180],
            gravity: 0.1,
          },
          lineStyle: {
            color: 'source',
            curveness: 0.15,
            opacity: 0.6,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 4 },
          },
        },
      ],
    };
  }, [graphData]);

  const handleChartClick = (params: any) => {
    if (params?.data?.category === 'policy' || params?.data?.category === '法规') {
      const policyId = params.data.id;
      const found = policies.find((p) => p.id === policyId);
      if (found) {
        setSelectedPolicy(found);
        setActiveTab('detail');
      }
    }
  };

  const treeData = selectedPolicy
    ? [
        {
          title: selectedPolicy.title,
          key: selectedPolicy.id,
          children: [
            { title: `文号：${selectedPolicy.docNo}`, key: 'docno' },
            { title: `发文机关：${selectedPolicy.issuingAuthority}`, key: 'auth' },
            {
              title: `适用城市：${ALL_CITY_NAMES[selectedPolicy.cityCode]}`,
              key: 'city',
            },
            { title: `分类：${selectedPolicy.category}`, key: 'cat' },
            {
              title: '适用人群',
              key: 'groups',
              children: selectedPolicy.applicableGroups.map((g, i) => ({
                title: g,
                key: `g_${i}`,
              })),
            },
          ],
        },
      ]
    : [];

  const relatedPolicies = selectedPolicy
    ? policies.filter((p) => selectedPolicy.relatedDocIds.includes(p.id))
    : [];

  const handleSubscribe = (values: any) => {
    message.success('订阅成功！我们会按照您选择的方式通知您最新政策。');
    setSubscribeModalVisible(false);
    subscribeForm.resetFields();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0 }}>
          <ApartmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          政策知识图谱
        </Title>
        <Button
          type="primary"
          icon={<BellOutlined />}
          onClick={() => setSubscribeModalVisible(true)}
        >
          政策订阅
        </Button>
      </div>

      <Card className="mb-4" size="small">
        <Space wrap size="middle">
          <span style={{ color: '#666' }}>城市：</span>
          <Select
            mode="multiple"
            placeholder="选择城市"
            style={{ minWidth: 280 }}
            value={selectedCity}
            onChange={setSelectedCity}
            allowClear
            maxTagCount="responsive"
          >
            {ALL_CITIES.map((c) => (
              <Option key={c} value={c}>
                {ALL_CITY_NAMES[c]}
              </Option>
            ))}
          </Select>

          <span style={{ color: '#666' }}>险种：</span>
          <Select
            mode="multiple"
            placeholder="选择险种"
            style={{ minWidth: 280 }}
            value={selectedInsurance}
            onChange={setSelectedInsurance}
            allowClear
            maxTagCount="responsive"
          >
            {ALL_INSURANCE_TYPES.map((t) => (
              <Option key={t} value={t}>
                {INSURANCE_NAMES[t]}
              </Option>
            ))}
          </Select>

          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索关键词"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
        </Space>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Card
            title={`政策法规 (${filteredPolicies.length})`}
            size="small"
            style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
          >
            {filteredPolicies.length === 0 ? (
              <Empty description="暂无匹配的政策" />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {filteredPolicies.map((policy) => (
                  <Card
                    key={policy.id}
                    size="small"
                    hoverable
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setActiveTab('detail');
                    }}
                    style={{
                      borderColor:
                        selectedPolicy?.id === policy.id ? '#1890ff' : undefined,
                      background:
                        selectedPolicy?.id === policy.id
                          ? '#e6f7ff'
                          : undefined,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        marginBottom: 8,
                        color: '#1677ff',
                      }}
                    >
                      <FileTextOutlined style={{ marginRight: 6 }} />
                      {policy.title}
                    </div>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space wrap size={4}>
                        <Tag color="blue">{policy.docNo}</Tag>
                        <Tag color={policy.status === 'EFFECTIVE' ? 'green' : 'default'}>
                          {policy.status === 'EFFECTIVE' ? '有效' : '失效'}
                        </Tag>
                        <Tag color="purple">{policy.category}</Tag>
                      </Space>
                      <Space size={8} wrap>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ApartmentOutlined style={{ marginRight: 4 }} />
                          {policy.issuingAuthority}
                        </Text>
                      </Space>
                      <Space size={8} wrap>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          生效：{dayjs(policy.effectiveDate).format('YYYY-MM-DD')}
                        </Text>
                      </Space>
                      <Space wrap size={4}>
                        {policy.applicableGroups.map((g) => (
                          <Tag key={g} color="orange" style={{ fontSize: 11 }}>
                            <TeamOutlined style={{ marginRight: 2 }} />
                            {g}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </div>

        <div className="col-span-8">
          <Card size="small" style={{ height: 'calc(100vh - 200px)' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'graph',
                  label: (
                    <span>
                      <ApartmentOutlined /> 图谱可视化
                    </span>
                  ),
                  children: (
                    <div style={{ height: 'calc(100vh - 280px)' }}>
                      <ReactECharts
                        option={chartOption}
                        style={{ height: '100%', width: '100%' }}
                        onEvents={{
                          click: handleChartClick,
                        }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'detail',
                  label: (
                    <span>
                      <FileTextOutlined /> 法规详情
                    </span>
                  ),
                  children: selectedPolicy ? (
                    <div
                      style={{
                        height: 'calc(100vh - 280px)',
                        overflow: 'auto',
                        padding: '0 8px',
                      }}
                    >
                      <Title level={4} style={{ marginTop: 0 }}>
                        {selectedPolicy.title}
                      </Title>
                      <Space wrap size={8} style={{ marginBottom: 16 }}>
                        <Tag color="blue">{selectedPolicy.docNo}</Tag>
                        <Tag color={selectedPolicy.status === 'EFFECTIVE' ? 'green' : 'default'}>
                          {selectedPolicy.status === 'EFFECTIVE' ? '有效' : '失效'}
                        </Tag>
                        <Tag color="purple">{selectedPolicy.category}</Tag>
                        <Tag color="cyan">{ALL_CITY_NAMES[selectedPolicy.cityCode]}</Tag>
                      </Space>

                      <div className="grid grid-cols-2 gap-4">
                        <Card title="法规层级" size="small">
                          <Tree
                            treeData={treeData}
                            defaultExpandAll
                            showLine={{ showLeafIcon: false }}
                          />
                        </Card>
                        <Card title="生效时间线" size="small">
                          <Timeline
                            items={[
                              {
                                color: 'blue',
                                children: (
                                  <div>
                                    <div style={{ fontWeight: 600 }}>发布日期</div>
                                    <Text type="secondary">
                                      {dayjs(selectedPolicy.issueDate).format('YYYY-MM-DD')}
                                    </Text>
                                  </div>
                                ),
                              },
                              {
                                color: 'green',
                                children: (
                                  <div>
                                    <div style={{ fontWeight: 600 }}>生效日期</div>
                                    <Text type="secondary">
                                      {dayjs(selectedPolicy.effectiveDate).format('YYYY-MM-DD')}
                                    </Text>
                                  </div>
                                ),
                              },
                              {
                                color:
                                  selectedPolicy.status === 'EFFECTIVE' ? 'green' : 'gray',
                                children: (
                                  <div>
                                    <div style={{ fontWeight: 600 }}>当前状态</div>
                                    <Text
                                      type={
                                        selectedPolicy.status === 'EFFECTIVE'
                                          ? 'success'
                                          : 'secondary'
                                      }
                                    >
                                      {selectedPolicy.status === 'EFFECTIVE' ? '正在生效中' : '已失效'}
                                    </Text>
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </Card>
                      </div>

                      <Card title="政策全文" size="small" style={{ marginTop: 16 }}>
                        <div
                          dangerouslySetInnerHTML={{ __html: selectedPolicy.content }}
                          style={{ lineHeight: 1.8 }}
                        />
                      </Card>

                      <Card title="关联法规" size="small" style={{ marginTop: 16 }}>
                        {relatedPolicies.length === 0 ? (
                          <Empty description="暂无关联法规" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                          <List
                            dataSource={relatedPolicies}
                            renderItem={(item) => (
                              <List.Item
                                key={item.id}
                                onClick={() => {
                                  setSelectedPolicy(item);
                                }}
                                style={{ cursor: 'pointer', padding: '8px 0' }}
                              >
                                <List.Item.Meta
                                  avatar={<FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                                  title={
                                    <Text strong style={{ color: '#1677ff' }}>
                                      {item.title}
                                    </Text>
                                  }
                                  description={
                                    <Space>
                                      <Tag color="blue">{item.docNo}</Tag>
                                      <Text type="secondary">{item.issuingAuthority}</Text>
                                      <Text type="secondary">
                                        {dayjs(item.effectiveDate).format('YYYY-MM-DD')}
                                      </Text>
                                    </Space>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        )}
                      </Card>
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 'calc(100vh - 280px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Empty description="请选择左侧政策或点击图谱节点查看详情" />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      <Modal
        title="政策订阅"
        open={subscribeModalVisible}
        onCancel={() => setSubscribeModalVisible(false)}
        footer={null}
      >
        <Form form={subscribeForm} layout="vertical" onFinish={handleSubscribe}>
          <Form.Item
            label="关键词订阅"
            name="keywords"
            rules={[{ required: true, message: '请输入订阅关键词' }]}
          >
            <TextArea
              rows={3}
              placeholder="多个关键词用逗号分隔，例如：基数调整,医保报销,养老金"
            />
          </Form.Item>
          <Form.Item label="通知方式" name="notifyType" rules={[{ required: true, message: '请选择通知方式' }]}>
            <Select mode="multiple" placeholder="选择通知方式">
              <Option value="email">
                <MailOutlined /> 邮件通知
              </Option>
              <Option value="sms">
                <MessageOutlined /> 短信通知
              </Option>
            </Select>
          </Form.Item>
          <Form.Item label="通知频率" name="frequency" initialValue="DAILY">
            <Select>
              <Option value="IMMEDIATE">即时</Option>
              <Option value="DAILY">每日摘要</Option>
              <Option value="WEEKLY">每周摘要</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认订阅
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PolicyGraph;
