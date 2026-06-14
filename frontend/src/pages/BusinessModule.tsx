import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Drawer, Form, Input, List, Row, Select, Space, Statistic, Steps, Tag, Typography, message } from 'antd';
import {
  AppleOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  CustomerServiceOutlined,
  HeartOutlined,
  MoneyCollectOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

type ModuleKey = 'mall' | 'finance' | 'products' | 'tech' | 'welfare' | 'life';

interface BusinessItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  tag: string;
  detail: string;
}

interface ModuleConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  submitText: string;
  searchPlaceholder: string;
  items: BusinessItem[];
}

const moduleConfigs: Record<ModuleKey, ModuleConfig> = {
  mall: {
    title: '农资商城',
    description: '农户可查询农资商品、查看详情并提交采购订单。',
    icon: <ShoppingCartOutlined />,
    actionText: '查看商品详情',
    submitText: '提交采购订单',
    searchPlaceholder: '搜索种子、化肥、农机',
    items: [
      { id: 'M-1001', title: '高产水稻种子套装', subtitle: '适合丘陵水田，含播种指导', price: '￥268/袋', tag: '热销', detail: '支持县域仓次日配送，采购后可预约农技专家线上指导。' },
      { id: 'M-1002', title: '有机复合肥 40kg', subtitle: '合作社集采价，支持分批配送', price: '￥116/袋', tag: '集采', detail: '下单后由农企确认库存，订单进入待支付和配送跟踪流程。' },
      { id: 'M-1003', title: '小型旋耕机租赁', subtitle: '按天计费，含基础保养', price: '￥180/天', tag: '租赁', detail: '提交申请后由本地服务站确认档期并生成租赁合同。' },
    ],
  },
  finance: {
    title: '中和金服',
    description: '贷款产品、授信额度和还款计划一屏可查。',
    icon: <MoneyCollectOutlined />,
    actionText: '查看方案详情',
    submitText: '提交贷款申请',
    searchPlaceholder: '搜索贷款、授信、分期',
    items: [
      { id: 'F-2101', title: '春耕极速贷', subtitle: '最高 5 万，资料齐全当天预审', price: '年化 4.8%', tag: '极速', detail: '面向农户采购农资的短期周转需求，提交后进入银行风控初审。' },
      { id: 'F-2102', title: '合作社设备贷', subtitle: '农机购置专项额度', price: '最高 30 万', tag: '设备', detail: '支持农企或合作社上传合同、发票和经营流水进行综合评估。' },
      { id: 'F-2103', title: '用呗分期', subtitle: '订单采购先用后付', price: '3/6/12 期', tag: '分期', detail: '商城采购订单可直接转入分期申请，平台同步订单履约状态。' },
    ],
  },
  products: {
    title: '农品直采',
    description: '展示可直采农品、产地溯源和采购提交链路。',
    icon: <AppleOutlined />,
    actionText: '查看产地详情',
    submitText: '提交直采意向',
    searchPlaceholder: '搜索苹果、稻米、蔬菜',
    items: [
      { id: 'P-3101', title: '高山脆甜苹果', subtitle: '产地直发，支持溯源码', price: '￥6.8/斤', tag: '溯源', detail: '采摘批次、检测报告和物流节点可在详情页查看。' },
      { id: 'P-3102', title: '生态大米预售', subtitle: '合作社统一收储', price: '￥128/20斤', tag: '预售', detail: '买家提交意向后由合作社确认供货量和配送周期。' },
      { id: 'P-3103', title: '时令蔬菜组合', subtitle: '县域冷链每日配送', price: '￥58/箱', tag: '冷链', detail: '适合社区团购和单位食堂，支持批量询价。' },
    ],
  },
  tech: {
    title: '农技支持',
    description: '专家问诊、课程预约和病虫害初筛入口完整可用。',
    icon: <CustomerServiceOutlined />,
    actionText: '查看服务详情',
    submitText: '提交问诊',
    searchPlaceholder: '搜索作物、病虫害、专家',
    items: [
      { id: 'T-4101', title: '水稻病虫害问诊', subtitle: '上传照片后专家复核', price: '免费', tag: '问诊', detail: '提交后进入待回复列表，专家给出防治建议和用药提醒。' },
      { id: 'T-4102', title: '春耕直播课堂', subtitle: '县农技站每周开课', price: '免费', tag: '课程', detail: '报名后可在个人中心查看课程提醒和回放资料。' },
      { id: 'T-4103', title: '土壤检测预约', subtitle: '上门取样或站点送检', price: '￥39/次', tag: '检测', detail: '检测完成后生成土壤改良建议和肥料采购清单。' },
    ],
  },
  welfare: {
    title: '公益援助',
    description: '救助项目、公益物资和申报进度均可提交查看。',
    icon: <HeartOutlined />,
    actionText: '查看项目详情',
    submitText: '提交援助申请',
    searchPlaceholder: '搜索救助、物资、项目',
    items: [
      { id: 'W-5101', title: '灾后补种物资包', subtitle: '面向受灾农户', price: '免费申领', tag: '救助', detail: '需填写受灾面积、村级证明和联系方式，政务员后台审核。' },
      { id: 'W-5102', title: '困难农户公益基金', subtitle: '县域专项帮扶', price: '最高 3000 元', tag: '基金', detail: '提交后进入资质审核，审核通过后推送拨付状态。' },
      { id: 'W-5103', title: '农技志愿服务', subtitle: '专家入户指导', price: '预约制', tag: '志愿', detail: '平台按地区和作物类型自动匹配志愿专家。' },
    ],
  },
  life: {
    title: '本地生活',
    description: '便民缴费、政务预约和乡村服务事项可查可办。',
    icon: <CoffeeOutlined />,
    actionText: '查看事项详情',
    submitText: '提交服务预约',
    searchPlaceholder: '搜索缴费、预约、便民服务',
    items: [
      { id: 'L-6101', title: '农机维修预约', subtitle: '县域维修站上门服务', price: '按工单报价', tag: '维修', detail: '提交设备型号和故障描述后，维修站确认上门时间。' },
      { id: 'L-6102', title: '合作社办事预约', subtitle: '登记、变更、咨询一站办理', price: '免费', tag: '政务', detail: '预约成功后生成办理清单，减少现场等待时间。' },
      { id: 'L-6103', title: '乡村物流寄递', subtitle: '农品上行专线', price: '首重 ￥6', tag: '物流', detail: '支持批量下单、冷链标记和物流轨迹查询。' },
    ],
  },
};

const BusinessModule: React.FC<{ type: ModuleKey }> = ({ type }) => {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<BusinessItem | null>(null);
  const [form] = Form.useForm();
  const config = moduleConfigs[type];

  const filteredItems = useMemo(() => {
    const clean = keyword.trim();
    if (!clean) return config.items;
    return config.items.filter((item) => `${item.title}${item.subtitle}${item.tag}`.includes(clean));
  }, [config.items, keyword]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      message.success(`${config.submitText}成功：${values.name || selected?.title || config.title}`);
      form.resetFields();
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-green-600 text-white flex items-center justify-center text-2xl">
              {config.icon}
            </div>
            <div>
              <Title level={3} className="!mb-1">{config.title}</Title>
              <Text type="secondary">{config.description}</Text>
            </div>
          </div>
          <Space>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={config.searchPlaceholder}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onPressEnter={() => message.success('筛选结果已更新')}
              className="w-64"
            />
            <Button type="primary" onClick={() => setSelected(config.items[0])}>
              {config.submitText}
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="今日提交" value={12} /></Card></Col>
        <Col span={8}><Card><Statistic title="待确认" value={4} /></Card></Col>
        <Col span={8}><Card><Statistic title="已完成" value={86} suffix="单" /></Card></Col>
      </Row>

      <Card title="业务列表 / 详情入口" className="shadow-sm">
        <List
          itemLayout="vertical"
          rowKey="id"
          dataSource={filteredItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => setSelected(item)}>{config.actionText}</Button>,
                <Button type="link" onClick={() => message.success(`${item.title} 已加入待提交清单`)}>加入清单</Button>,
              ]}
            >
              <List.Item.Meta
                title={<Space><span>{item.title}</span><Tag color="green">{item.tag}</Tag></Space>}
                description={`${item.id} · ${item.subtitle}`}
              />
              <Paragraph className="!mb-0">{item.detail}</Paragraph>
              <Text strong className="text-green-700">{item.price}</Text>
            </List.Item>
          )}
        />
      </Card>

      <Card title="提交办理" className="shadow-sm">
        <Row gutter={24}>
          <Col span={14}>
            <Form form={form} layout="vertical">
              <Form.Item name="name" label="事项名称" rules={[{ required: true, message: '请输入要提交的事项' }]}>
                <Input placeholder={`例如：${config.items[0].title}`} />
              </Form.Item>
              <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input placeholder="张三" />
              </Form.Item>
              <Form.Item name="channel" label="处理方式" initialValue="online">
                <Select
                  options={[
                    { value: 'online', label: '线上办理' },
                    { value: 'station', label: '服务站协助' },
                    { value: 'visit', label: '预约上门' },
                  ]}
                />
              </Form.Item>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSubmit}>
                {config.submitText}
              </Button>
            </Form>
          </Col>
          <Col span={10}>
            <Steps
              direction="vertical"
              current={1}
              items={[
                { title: '填写申请', description: '选择事项并补充联系人' },
                { title: '平台审核', description: '后台确认库存、资质或服务档期' },
                { title: '完成办理', description: '生成订单、工单或服务记录' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Drawer
        title={selected ? `${selected.title}详情` : '业务详情'}
        open={!!selected}
        width={520}
        onClose={() => setSelected(null)}
        extra={<Button type="primary" onClick={() => selected && form.setFieldsValue({ name: selected.title })}>{config.submitText}</Button>}
      >
        {selected && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="编号">{selected.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color="green">{selected.tag}</Tag></Descriptions.Item>
            <Descriptions.Item label="价格/额度">{selected.price}</Descriptions.Item>
            <Descriptions.Item label="详情说明">{selected.detail}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default BusinessModule;
