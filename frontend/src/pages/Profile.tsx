import { Card, Col, Descriptions, List, Row, Space, Statistic, Tag, Typography, Button } from 'antd'
import {
  CheckCircleOutlined,
  FileDoneOutlined,
  MoneyCollectOutlined,
  ShoppingOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Title, Paragraph } = Typography

const serviceItems = [
  { title: '我的招工提交', description: '查看已提交需求、审核状态和工地核验记录', to: '/jobs?filter=my', action: '查看提交' },
  { title: '我的匹配结果', description: '查看智能撮合推荐、用工确认和通知状态', to: '/matches?filter=my', action: '查看匹配' },
  { title: '我的合同', description: '查看电子合同、签署状态和合同详情', to: '/contracts?filter=my', action: '查看合同' },
  { title: '我的工资支付', description: '查看工资支付、购买/支付确认和欠薪风险预警', to: '/wage-payments?filter=my', action: '查看支付' }
]

export default function Profile() {
  return (
    <div>
      <Title level={2}>个人中心 / 我的</Title>
      <Paragraph type="secondary">
        当前为住建部门劳务监管管理端账号，集中查看招工提交、购买/支付、合同签署和待办审核。
      </Paragraph>
      <Space wrap style={{ marginBottom: 24 }}>
        <Link to="/jobs/new">
          <Button type="primary" icon={<ShoppingOutlined />}>提交需求</Button>
        </Link>
        <Link to="/jobs">
          <Button>搜索筛选招工</Button>
        </Link>
        <Link to="/admin">
          <Button>进入后台管理</Button>
        </Link>
        <Link to="/wage-payments">
          <Button icon={<MoneyCollectOutlined />}>购买/支付确认</Button>
        </Link>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="待审核提交" value={6} prefix={<ShoppingOutlined />} suffix="条" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="待签合同" value={4} prefix={<FileDoneOutlined />} suffix="份" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="工资支付待确认" value={3} prefix={<MoneyCollectOutlined />} suffix="笔" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="账号信息" extra={<Tag color="blue">管理端</Tag>}>
            <Descriptions column={1}>
              <Descriptions.Item label="账号">
                <Space><UserOutlined /> 劳务监管员</Space>
              </Descriptions.Item>
              <Descriptions.Item label="机构">住建劳务供需监管中心</Descriptions.Item>
              <Descriptions.Item label="权限">工人管理、招工审核、合同监管、工资支付</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="success" icon={<CheckCircleOutlined />}>已实名认证</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="我的服务">
            <List
              dataSource={serviceItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link key="view" to={item.to}>
                      <Button type="link">{item.action}</Button>
                    </Link>
                  ]}
                >
                  <List.Item.Meta title={item.title} description={item.description} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
