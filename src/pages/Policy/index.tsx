import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Timeline,
} from 'antd';
import {
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const policyItems = [
  {
    id: 1,
    title: '关于2026年度城乡居民医疗保险集中缴费工作的通知',
    category: '缴费通知',
    date: '2026-06-01',
    tagColor: 'red',
    summary: '明确集中缴费时间、线上缴费渠道、财政补助标准和特殊人群资助流程。',
  },
  {
    id: 2,
    title: '湖南省灵活就业人员社会保险补贴政策解读',
    category: '政策解读',
    date: '2026-05-20',
    tagColor: 'blue',
    summary: '面向灵活就业参保人说明补贴对象、申请材料、审核路径和到账周期。',
  },
  {
    id: 3,
    title: '家庭共济账户绑定与医保个账使用指南',
    category: '办事指南',
    date: '2026-05-12',
    tagColor: 'green',
    summary: '覆盖亲属绑定、额度授权、医院药店使用记录查询和解绑流程。',
  },
  {
    id: 4,
    title: '城乡居民养老保险缴费档次及待遇测算说明',
    category: '待遇测算',
    date: '2026-04-28',
    tagColor: 'gold',
    summary: '说明缴费档次、政府补贴、个人账户累计和养老金试算口径。',
  },
  {
    id: 5,
    title: '社保费税务征缴三端协同状态查询规则',
    category: '业务规则',
    date: '2026-04-18',
    tagColor: 'purple',
    summary: '解释支付、税务开票、财政入库和医保入账各状态的更新时间与异常处理。',
  },
];

const categoryOptions = [
  { label: '全部分类', value: 'all' },
  ...Array.from(new Set(policyItems.map((item) => item.category))).map((category) => ({
    label: category,
    value: category,
  })),
];

const quickGuides = [
  { title: '居民医保缴费', desc: '选择年度、缴费档次和支付渠道后生成订单。' },
  { title: '养老待遇测算', desc: '录入年龄、缴费年限和档次，查看预计待遇。' },
  { title: '家庭共济授权', desc: '绑定亲属后设置授权额度，支持使用记录追踪。' },
];

const PolicyPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');

  const filteredPolicies = useMemo(() => {
    const normalizedKeyword = keyword.trim();
    return policyItems.filter((item) => {
      const matchCategory = category === 'all' || item.category === category;
      const matchKeyword =
        !normalizedKeyword ||
        item.title.includes(normalizedKeyword) ||
        item.summary.includes(normalizedKeyword) ||
        item.category.includes(normalizedKeyword);
      return matchCategory && matchKeyword;
    });
  }, [category, keyword]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          政策公告
        </h2>
        <p className="text-gray-500">
          汇总社保费征缴、待遇发放、家庭共济和三端协同相关政策，支持按分类和关键词快速检索。
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="shadow-sm">
            <Statistic title="最新公告" value={policyItems.length} suffix="条" prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm">
            <Statistic title="政策分类" value={categoryOptions.length - 1} suffix="类" prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm">
            <Statistic title="服务指南" value={quickGuides.length} suffix="项" prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        message="2026年度居民医保集中缴费已开始"
        description="参保人可在缴费中心创建订单，支付后可在首页查看税务开票、财政入库、医保入账状态。"
      />

      <Card
        title={
          <Space>
            <FileTextOutlined className="text-orange-500" />
            <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '18px' }}>公告列表</span>
          </Space>
        }
        className="shadow-sm"
        extra={
          <Space wrap>
            <Select
              value={category}
              options={categoryOptions}
              onChange={setCategory}
              style={{ width: 140 }}
            />
            <Input.Search
              allowClear
              placeholder="搜索政策关键词"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ width: 240 }}
            />
          </Space>
        }
      >
        <List
          itemLayout="vertical"
          dataSource={filteredPolicies}
          locale={{ emptyText: '暂无匹配政策' }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <span key="date" className="text-gray-400">{item.date}</span>,
                <Button key="detail" type="link">
                  查看详情 <ArrowRightOutlined />
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Tag color={item.tagColor}>{item.category}</Tag>}
                title={<span className="text-base font-medium">{item.title}</span>}
                description={item.summary}
              />
            </List.Item>
          )}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined className="text-green-500" />
                <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '18px' }}>办理流程</span>
              </Space>
            }
            className="shadow-sm h-full"
          >
            <Timeline
              items={[
                { color: 'blue', children: '完成实名登录并核验个人参保身份。' },
                { color: 'blue', children: '在缴费中心选择年度、险种、缴费档次和支付方式。' },
                { color: 'green', children: '支付成功后等待税务开票、财政入库、医保入账自动同步。' },
                { color: 'green', children: '在首页、订单列表或待遇页面查看后续状态和明细。' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <QuestionCircleOutlined className="text-blue-500" />
                <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '18px' }}>常用指南</span>
              </Space>
            }
            className="shadow-sm h-full"
          >
            <List
              dataSource={quickGuides}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.title} description={item.desc} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PolicyPage;
