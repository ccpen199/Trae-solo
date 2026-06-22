import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Space,
  Button,
  Modal,
  Typography,
  List,
  Statistic,
  Timeline,
  Tooltip,
} from 'antd'
import {
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  FileProtectOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

interface FactorItem {
  key: string
  name: string
  score: number
  maxScore: number
  weight: number
  color: string
  icon: JSX.Element
  tips: string
}

interface HistoryItem {
  id: number
  date: string
  change: number
  reason: string
  type: 'rise' | 'fall'
  detail: string
}

function CreditScore() {
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const score = 92
  const level = score >= 90
    ? { text: 'AAA', color: '#52c41a', desc: '顶级信用，可享平台最高权益' }
    : score >= 80
    ? { text: 'AA', color: '#1890ff', desc: '优质信用，推荐合作' }
    : score >= 70
    ? { text: 'A', color: '#13c2c2', desc: '良好信用，正常合作' }
    : { text: 'BBB', color: '#faad14', desc: '一般信用，建议关注' }

  const factors: FactorItem[] = [
    {
      key: 'payment',
      name: '按时发薪率',
      score: 95,
      maxScore: 100,
      weight: 35,
      color: '#52c41a',
      icon: <DollarOutlined />,
      tips: '近90天内所有工资均按时发放，未出现任何延迟记录。保持此项可持续获得高分。',
    },
    {
      key: 'contract',
      name: '合同履约率',
      score: 100,
      maxScore: 100,
      weight: 30,
      color: '#1890ff',
      icon: <FileProtectOutlined />,
      tips: '所有签订的劳动合同均完整履行，未出现违约记录。',
    },
    {
      key: 'complaint',
      name: '投诉率',
      score: 90,
      maxScore: 100,
      weight: 20,
      color: '#722ed1',
      icon: <TeamOutlined />,
      tips: '近90天内收到1条非实质性投诉，已妥善处理完毕。',
    },
    {
      key: 'verify',
      name: '认证等级',
      score: 85,
      maxScore: 100,
      weight: 15,
      color: '#faad14',
      icon: <SafetyCertificateOutlined />,
      tips: '已完成基础企业认证，完成高级认证（上传完整资质）可获得满分。',
    },
  ]

  const history: HistoryItem[] = [
    {
      id: 1,
      date: '2026-06-15',
      change: 3,
      reason: '按时完成6月上半月工资发放',
      type: 'rise',
      detail: '涉及5名工人，共计 ¥25,400 工资全部按时到账',
    },
    {
      id: 2,
      date: '2026-06-10',
      change: 2,
      reason: '成功完成商业街改造项目履约',
      type: 'rise',
      detail: '项目完工验收合格，工人满意度100%',
    },
    {
      id: 3,
      date: '2026-06-05',
      change: -1,
      reason: '工人投诉未及时处理',
      type: 'fall',
      detail: '工人反映住宿问题延迟2天处理，已妥善解决',
    },
    {
      id: 4,
      date: '2026-06-01',
      change: 5,
      reason: '完成企业基础认证',
      type: 'rise',
      detail: '上传营业执照、法人身份信息，通过平台审核',
    },
    {
      id: 5,
      date: '2026-05-30',
      change: 3,
      reason: '完成5月工资全部发放',
      type: 'rise',
      detail: '涉及12名工人，共计 ¥62,000 工资全部按时到账',
    },
    {
      id: 6,
      date: '2026-05-15',
      change: 2,
      reason: '新建CBD办公楼项目上架',
      type: 'rise',
      detail: '及时支付保证金，信用资质良好',
    },
  ]

  const suggestions = [
    {
      icon: <SafetyCertificateOutlined />,
      title: '完成高级企业认证',
      desc: '上传完整的企业资质文件（税务登记证、开户许可证等），完成后可获得 +15 分',
      tag: '认证',
      color: '#1890ff',
    },
    {
      icon: <DollarOutlined />,
      title: '持续按时发放工资',
      desc: '保持连续6个月零延迟发薪记录，可晋升至 AAA+ 级',
      tag: '维护',
      color: '#52c41a',
    },
    {
      icon: <FileProtectOutlined />,
      title: '增加履约项目数量',
      desc: '累计完成10个以上完整履约项目，可提升履约权重加分',
      tag: '提升',
      color: '#722ed1',
    },
    {
      icon: <TeamOutlined />,
      title: '及时处理工人反馈',
      desc: '在24小时内响应并处理工人投诉建议，可降低投诉率影响',
      tag: '改进',
      color: '#faad14',
    },
  ]

  const levelBadgeStyle = {
    background: `linear-gradient(135deg, ${level.color} 0%, ${level.color}dd 100%)`,
    color: '#fff',
    padding: '6px 20px',
    borderRadius: '0 0 20px 20px',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2,
    boxShadow: `0 4px 12px ${level.color}40`,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <StarOutlined style={{ color: level.color }} />
            信用评分
          </Space>
        </Title>
        <Space>
          <Tag color={level.color} style={{ padding: '4px 12px', fontSize: 13 }}>
            {level.text} 级企业
          </Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: `linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 30%, #f6ffed 100%)`,
              position: 'relative',
              overflow: 'hidden',
              height: 360,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 40,
                zIndex: 2,
                ...levelBadgeStyle,
              }}
            >
              {level.text}
            </div>
            <div style={{ position: 'relative', zIndex: 1, paddingTop: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  当前信用评分
                </Text>
                <div
                  style={{
                    fontSize: 100,
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${level.color}, #1890ff)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                    margin: '12px 0 8px',
                    letterSpacing: -4,
                  }}
                >
                  {score}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {level.desc}
                </Text>
              </div>

              <div style={{ marginTop: 30, padding: '0 20px' }}>
                <Progress
                  percent={score}
                  strokeColor={{ '0%': level.color, '100%': '#1890ff' }}
                  trailColor="#fff"
                  strokeWidth={14}
                  style={{ padding: 0 }}
                />
                <Row
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#999',
                  }}
                >
                  <span>0</span>
                  <span>BBB</span>
                  <span>A</span>
                  <span>AA</span>
                  <span>AAA</span>
                  <span>100</span>
                </Row>
              </div>

              <div style={{ marginTop: 24 }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: '#fff', borderRadius: 10, textAlign: 'center' }}
                    >
                      <Statistic
                        title={<Text type="secondary" style={{ fontSize: 12 }}>全国排名</Text>}
                        value={1286}
                        suffix="/ 58,392"
                        style={{ margin: 0 }}
                        valueStyle={{ fontSize: 18, color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      bordered={false}
                      style={{ background: '#fff', borderRadius: 10, textAlign: 'center' }}
                    >
                      <Statistic
                        title={<Text type="secondary" style={{ fontSize: 12 }}>超越企业</Text>}
                        value={97.8}
                        precision={1}
                        suffix="%"
                        style={{ margin: 0 }}
                        valueStyle={{ fontSize: 18, color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, height: 360 }}
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                <span>影响因素分析</span>
                <Tooltip title="各指标加权计算得出综合信用评分">
                  <InfoCircleOutlined style={{ color: '#999', fontSize: 14 }} />
                </Tooltip>
              </Space>
            }
          >
            <List
              dataSource={factors}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '14px 0', borderBottom: '1px solid #f5f5f5' }}
                  actions={[
                    <Tooltip key="tip" title={item.tips}>
                      <Button type="text" icon={<InfoCircleOutlined />} size="small" />
                    </Tooltip>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: `${item.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          color: item.color,
                        }}
                      >
                        {item.icon}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
                        <Tag color={item.color} style={{ fontSize: 11, margin: 0 }}>
                          权重 {item.weight}%
                        </Tag>
                        <Tag
                          color={item.score >= 90 ? 'success' : item.score >= 70 ? 'processing' : 'warning'}
                          style={{ fontSize: 11, margin: 0 }}
                        >
                          {item.score}/{item.maxScore}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Progress
                        percent={item.score}
                        strokeColor={item.color}
                        trailColor="#f5f5f5"
                        strokeWidth={8}
                        showInfo={false}
                        style={{ maxWidth: 500, marginTop: 6 }}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16 }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#722ed1' }} />
                <span>信用历史记录</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => setDetailModalOpen(true)}>
                查看全部
              </Button>
            }
          >
            <Timeline
              mode="left"
              items={history.slice(0, 5).map((item) => ({
                color: item.type === 'rise' ? 'green' : 'red',
                dot: item.type === 'rise' ? <RiseOutlined /> : <FallOutlined />,
                label: (
                  <div style={{ minWidth: 100 }}>
                    <Text strong>{dayjs(item.date).format('YYYY-MM-DD')}</Text>
                  </div>
                ),
                children: (
                  <Space direction="vertical" size={2}>
                    <Space size={8}>
                      <Text strong>{item.reason}</Text>
                      <Tag
                        color={item.type === 'rise' ? 'success' : 'error'}
                        icon={item.type === 'rise' ? <ArrowUpOutlined /> : <FallOutlined />}
                        style={{ fontSize: 12, padding: '0 8px', margin: 0 }}
                      >
                        {item.type === 'rise' ? '+' : ''}
                        {item.change} 分
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.detail}
                    </Text>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16 }}
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span>信用提升建议</span>
              </Space>
            }
          >
            <List
              dataSource={suggestions}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '14px 0', borderBottom: '1px solid #f5f5f5' }}
                  actions={[
                    <Button type="primary" size="small" key="go" style={{ background: item.color, border: 'none' }}>
                      立即提升
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${item.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: item.color,
                        }}
                      >
                        {item.icon}
                      </div>
                    }
                    title={
                      <Space size={6}>
                        <Text strong>{item.title}</Text>
                        <Tag color={item.color} style={{ fontSize: 11, margin: 0 }}>
                          {item.tag}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                        {item.desc}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <StarOutlined style={{ color: level.color }} />
            完整信用历史
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={720}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <Timeline
          mode="left"
          items={history.map((item) => ({
            color: item.type === 'rise' ? 'green' : 'red',
            dot: item.type === 'rise' ? <RiseOutlined /> : <FallOutlined />,
            label: (
              <div style={{ minWidth: 120 }}>
                <Text strong>{dayjs(item.date).format('YYYY-MM-DD')}</Text>
              </div>
            ),
            children: (
              <Space direction="vertical" size={2}>
                <Space size={8}>
                  <Text strong>{item.reason}</Text>
                  <Tag
                    color={item.type === 'rise' ? 'success' : 'error'}
                    icon={item.type === 'rise' ? <ArrowUpOutlined /> : <FallOutlined />}
                  >
                    {item.type === 'rise' ? '+' : ''}
                    {item.change} 分
                  </Tag>
                </Space>
                <Paragraph style={{ margin: 0, fontSize: 13, color: '#666' }}>
                  {item.detail}
                </Paragraph>
              </Space>
            ),
          }))}
        />
      </Modal>
    </div>
  )
}

export default CreditScore
