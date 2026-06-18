import { useState } from 'react'
import {
  Table, Card, Button, Space, Input, Select, Tag, Modal, message, Tabs,
  Avatar, Row, Col, Statistic, Drawer, Timeline, Badge
} from 'antd'
import {
  SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined,
  WarningOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/utils'

interface ContentItem {
  id: string
  title: string
  author: string
  authorAvatar?: string
  type: 'post' | 'comment'
  status: 'pending' | 'approved' | 'rejected' | 'violation'
  violationType?: string
  content: string
  createTime: string
  reviewer?: string
  reviewTime?: string
  rejectReason?: string
  auditHistory: AuditRecord[]
}

interface AuditRecord {
  action: string
  operator: string
  time: string
  reason?: string
  result?: string
}

interface ReviewItem {
  id: string
  contentId: string
  contentTitle: string
  originalStatus: string
  reviewResult: string
  reviewer: string
  reviewTime: string
  reason?: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  violation: { color: 'volcano', text: '违规' }
}

const typeMap: Record<string, { color: string; text: string }> = {
  post: { color: 'blue', text: '帖子' },
  comment: { color: 'purple', text: '评论' }
}

const violationTypeMap: Record<string, { color: string; text: string }> = {
  advertisement: { color: 'orange', text: '广告' },
  fake_info: { color: 'red', text: '虚假信息' },
  inappropriate: { color: 'volcano', text: '不当言论' },
  duplicate: { color: 'cyan', text: '重复内容' },
  other: { color: 'default', text: '其他' }
}

const reviewers = ['审核员A', '审核员B', '审核员C', '审核员D']

const mockContentData: ContentItem[] = [
  { id: '1', title: '分享一下浦东充电站体验', author: '张伟', type: 'post', status: 'pending', content: '今天去了浦东充电站，充电速度很快，环境也不错，推荐给大家。国网的服务态度也很好。', createTime: '2024-06-18 10:30:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-18 10:30:00' }] },
  { id: '2', title: '求推荐性价比高的充电站', author: '李娜', type: 'post', status: 'approved', content: '大家有没有性价比高的充电站推荐一下，最好在徐汇附近的。', createTime: '2024-06-18 09:15:00', reviewer: '审核员A', reviewTime: '2024-06-18 09:30:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-18 09:15:00' }, { action: '审核通过', operator: '审核员A', time: '2024-06-18 09:30:00', result: '通过' }] },
  { id: '3', title: '关于充电费用疑问', author: '王强', type: 'comment', status: 'pending', content: '请问现在充电费用是怎么算的？为什么不同站点价格差这么多？', createTime: '2024-06-18 08:45:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-18 08:45:00' }] },
  { id: '4', title: '充电桩故障问题', author: '赵敏', type: 'post', status: 'rejected', content: '虹桥充电站的充电桩经常故障，希望能修一下。已经报修3次了没人处理。', createTime: '2024-06-17 16:20:00', reviewer: '审核员B', reviewTime: '2024-06-17 16:35:00', rejectReason: '内容涉及不实投诉，已核实该站近期无3次报修记录', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-17 16:20:00' }, { action: '审核拒绝', operator: '审核员B', time: '2024-06-17 16:35:00', reason: '内容涉及不实投诉', result: '拒绝' }] },
  { id: '5', title: '回复：分享一下浦东充电站体验', author: '钱磊', type: 'comment', status: 'approved', content: '我也去过，确实不错，下次还去。', createTime: '2024-06-17 14:10:00', reviewer: '审核员A', reviewTime: '2024-06-17 14:25:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-17 14:10:00' }, { action: '审核通过', operator: '审核员A', time: '2024-06-17 14:25:00', result: '通过' }] },
  { id: '6', title: '超值充电优惠来啦！', author: '孙丽', type: 'post', status: 'violation', violationType: 'advertisement', content: '点击链接领取充电优惠券，限时特价0.1元/度！名额有限先到先得！', createTime: '2024-06-17 11:30:00', reviewer: '审核员C', reviewTime: '2024-06-17 11:40:00', rejectReason: '广告推广', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-17 11:30:00' }, { action: '标记违规', operator: '审核员C', time: '2024-06-17 11:40:00', reason: '广告推广', result: '违规' }] },
  { id: '7', title: '这家充电站有安全隐患', author: '周杰', type: 'post', status: 'violation', violationType: 'fake_info', content: 'XX充电站漏电严重，已经有人触电了，大家千万别去！', createTime: '2024-06-17 09:00:00', reviewer: '审核员B', reviewTime: '2024-06-17 09:15:00', rejectReason: '散布虚假信息，无任何触电事故记录', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-17 09:00:00' }, { action: '标记违规', operator: '审核员B', time: '2024-06-17 09:15:00', reason: '虚假信息', result: '违规' }] },
  { id: '8', title: '充电APP使用技巧分享', author: '吴芳', type: 'post', status: 'approved', content: '分享几个充电APP的使用小技巧，可以节省不少费用。1.错峰充电 2.使用优惠券 3.关注活动...', createTime: '2024-06-16 20:15:00', reviewer: '审核员D', reviewTime: '2024-06-16 20:30:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-16 20:15:00' }, { action: '审核通过', operator: '审核员D', time: '2024-06-16 20:30:00', result: '通过' }] },
  { id: '9', title: '不满充电站服务态度', author: '郑浩', type: 'comment', status: 'violation', violationType: 'inappropriate', content: 'XX充电站的工作人员态度太差了，简直不是人，大家一起来投诉！', createTime: '2024-06-16 15:45:00', reviewer: '审核员A', reviewTime: '2024-06-16 16:00:00', rejectReason: '不当言论，含人身攻击', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-16 15:45:00' }, { action: '标记违规', operator: '审核员A', time: '2024-06-16 16:00:00', reason: '不当言论', result: '违规' }] },
  { id: '10', title: '同一内容重复发布测试', author: '冯雪', type: 'post', status: 'violation', violationType: 'duplicate', content: '测试充电站评测报告，这是一条重复内容...', createTime: '2024-06-16 10:20:00', reviewer: '审核员C', reviewTime: '2024-06-16 10:35:00', rejectReason: '重复内容', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-16 10:20:00' }, { action: '标记违规', operator: '审核员C', time: '2024-06-16 10:35:00', reason: '重复内容', result: '违规' }] },
  { id: '11', title: '国网充电桩使用体验', author: '陈龙', type: 'post', status: 'pending', content: '最近体验了国网的超充桩，功率稳定，充电体验不错，就是价格稍微贵了点。', createTime: '2024-06-18 11:00:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-18 11:00:00' }] },
  { id: '12', title: '高速服务区充电排队问题', author: '褚瑶', type: 'post', status: 'pending', content: '节假日高速服务区充电排队3小时，建议增加桩的数量或者实施预约充电。', createTime: '2024-06-18 07:30:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-18 07:30:00' }] },
  { id: '13', title: '充电桩布局建议', author: '卫东', type: 'comment', status: 'approved', content: '建议在商圈停车场也增设充电桩，方便逛街的时候补电。', createTime: '2024-06-15 18:20:00', reviewer: '审核员D', reviewTime: '2024-06-15 18:35:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-15 18:20:00' }, { action: '审核通过', operator: '审核员D', time: '2024-06-15 18:35:00', result: '通过' }] },
  { id: '14', title: '充电桩标识不清', author: '蒋蓉', type: 'comment', status: 'rejected', content: '某些充电桩的标识太模糊了，快充慢充分不清，建议改进。', createTime: '2024-06-15 12:10:00', reviewer: '审核员B', reviewTime: '2024-06-15 12:25:00', rejectReason: '反馈不够具体，无法定位问题', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-15 12:10:00' }, { action: '审核拒绝', operator: '审核员B', time: '2024-06-15 12:25:00', reason: '反馈不具体', result: '拒绝' }] },
  { id: '15', title: '其他平台优惠推广', author: '沈阳', type: 'post', status: 'violation', violationType: 'other', content: '某宝充电优惠券群，加V：XXXXX，免费领！', createTime: '2024-06-14 22:00:00', reviewer: '审核员C', reviewTime: '2024-06-14 22:10:00', rejectReason: '引流推广', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-14 22:00:00' }, { action: '标记违规', operator: '审核员C', time: '2024-06-14 22:10:00', reason: '引流推广', result: '违规' }] },
  { id: '16', title: '充电安全注意事项', author: '韩冰', type: 'post', status: 'approved', content: '充电时注意不要在车内使用大功率电器，充完电记得拔枪，雨天注意防水...', createTime: '2024-06-14 16:30:00', reviewer: '审核员A', reviewTime: '2024-06-14 16:45:00', auditHistory: [{ action: '提交审核', operator: '系统', time: '2024-06-14 16:30:00' }, { action: '审核通过', operator: '审核员A', time: '2024-06-14 16:45:00', result: '通过' }] }
]

const reviewRecords: ReviewItem[] = [
  { id: '1', contentId: '2', contentTitle: '求推荐性价比高的充电站', originalStatus: 'approved', reviewResult: '维持原判', reviewer: '复查员甲', reviewTime: '2024-06-18 10:00:00' },
  { id: '2', contentId: '4', contentTitle: '充电桩故障问题', originalStatus: 'rejected', reviewResult: '改判通过', reviewer: '复查员乙', reviewTime: '2024-06-18 09:30:00', reason: '经核实用户确实有报修记录，原判断有误' },
  { id: '3', contentId: '6', contentTitle: '超值充电优惠来啦！', originalStatus: 'violation', reviewResult: '维持原判', reviewer: '复查员甲', reviewTime: '2024-06-17 14:00:00' },
  { id: '4', contentId: '9', contentTitle: '不满充电站服务态度', originalStatus: 'violation', reviewResult: '维持原判', reviewer: '复查员乙', reviewTime: '2024-06-17 11:00:00' },
  { id: '5', contentId: '14', contentTitle: '充电桩标识不清', originalStatus: 'rejected', reviewResult: '改判通过', reviewer: '复查员甲', reviewTime: '2024-06-16 10:00:00', reason: '用户反馈虽笼统但属于有效建议，应予通过' }
]

const violationPieOption = {
  title: { text: '违规类型分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie', radius: ['40%', '70%'],
    data: [
      { value: 3, name: '广告', itemStyle: { color: '#fa8c16' } },
      { value: 2, name: '虚假信息', itemStyle: { color: '#f5222d' } },
      { value: 2, name: '不当言论', itemStyle: { color: '#eb2f96' } },
      { value: 1, name: '重复内容', itemStyle: { color: '#13c2c2' } },
      { value: 1, name: '其他', itemStyle: { color: '#bfbfbf' } }
    ]
  }]
}

const violationTrendOption = {
  title: { text: '月度违规趋势', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '违规数' },
  series: [{
    type: 'line', smooth: true, data: [12, 15, 18, 14, 20, 9],
    itemStyle: { color: '#f5222d' }, areaStyle: { opacity: 0.15 }
  }]
}

const reviewerBarOption = {
  title: { text: '审核员审核量统计', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: reviewers },
  yAxis: { type: 'value', name: '审核量' },
  series: [
    { name: '通过', type: 'bar', stack: 'total', data: [28, 32, 25, 30], itemStyle: { color: '#52c41a' } },
    { name: '拒绝', type: 'bar', stack: 'total', data: [5, 8, 6, 4], itemStyle: { color: '#fa8c16' } },
    { name: '违规', type: 'bar', stack: 'total', data: [3, 4, 5, 2], itemStyle: { color: '#f5222d' } }
  ]
}

function Community() {
  const [data, setData] = useState<ContentItem[]>(mockContentData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [violationVisible, setViolationVisible] = useState(false)
  const [violationType, setViolationType] = useState<string | undefined>()
  const [violationId, setViolationId] = useState<string | null>(null)

  const filteredData = (() => {
    let result = data
    if (activeTab !== 'all') {
      if (activeTab === 'review') return []
      result = result.filter(item => item.status === activeTab)
    }
    if (keyword) {
      result = result.filter(item => item.title.includes(keyword) || item.author.includes(keyword))
    }
    if (typeFilter) {
      result = result.filter(item => item.type === typeFilter)
    }
    return result
  })()

  const columns: ColumnsType<ContentItem> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    {
      title: '作者', dataIndex: 'author', key: 'author', width: 100,
      render: (author: string) => <Space><Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{author[0]}</Avatar>{author}</Space>
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (type: string) => { const info = typeMap[type]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => { const info = statusMap[status]; return <Tag color={info.color}>{info.text}</Tag> }
    },
    {
      title: '违规类型', dataIndex: 'violationType', key: 'violationType', width: 100,
      render: (type: string) => type ? <Tag color={violationTypeMap[type]?.color}>{violationTypeMap[type]?.text}</Tag> : '-'
    },
    { title: '审核人', dataIndex: 'reviewer', key: 'reviewer', width: 90, render: (v) => v || '-' },
    { title: '发布时间', dataIndex: 'createTime', key: 'createTime', width: 160, render: (t) => formatDateTime(t) },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>拒绝</Button>
              <Button type="link" size="small" danger icon={<FlagOutlined />} onClick={() => handleViolation(record)}>违规</Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const reviewColumns: ColumnsType<ReviewItem> = [
    { title: '内容标题', dataIndex: 'contentTitle', key: 'contentTitle', ellipsis: true },
    { title: '原审核结果', dataIndex: 'originalStatus', key: 'originalStatus', width: 110, render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> },
    { title: '复查结果', dataIndex: 'reviewResult', key: 'reviewResult', width: 110, render: (r: string) => {
      const colorMap: Record<string, string> = { '维持原判': 'blue', '改判通过': 'green', '改判拒绝': 'red' }
      return <Tag color={colorMap[r]}>{r}</Tag>
    }},
    { title: '复查人', dataIndex: 'reviewer', key: 'reviewer', width: 100 },
    { title: '复查时间', dataIndex: 'reviewTime', key: 'reviewTime', width: 160, render: (t) => formatDateTime(t) },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true, render: (r) => r || '-' }
  ]

  const handleView = (record: ContentItem) => {
    setCurrentContent(record)
    setDetailVisible(true)
  }

  const handleApprove = (record: ContentItem) => {
    Modal.confirm({
      title: '确认通过',
      content: `确定通过"${record.title}"的审核吗？`,
      onOk: () => {
        setData(data.map(item => item.id === record.id ? {
          ...item,
          status: 'approved' as const,
          reviewer: '审核员A',
          reviewTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          auditHistory: [...item.auditHistory, { action: '审核通过', operator: '审核员A', time: new Date().toISOString().replace('T', ' ').substring(0, 19), result: '通过' }]
        } : item))
        message.success('审核通过')
      }
    })
  }

  const handleReject = (record: ContentItem) => {
    setRejectId(record.id)
    setRejectReason('')
    setRejectVisible(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      message.warning('请填写拒绝原因')
      return
    }
    if (rejectId) {
      setData(data.map(item => item.id === rejectId ? {
        ...item,
        status: 'rejected' as const,
        reviewer: '审核员A',
        reviewTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        rejectReason,
        auditHistory: [...item.auditHistory, { action: '审核拒绝', operator: '审核员A', time: new Date().toISOString().replace('T', ' ').substring(0, 19), reason: rejectReason, result: '拒绝' }]
      } : item))
      message.success('已拒绝')
      setRejectVisible(false)
    }
  }

  const handleViolation = (record: ContentItem) => {
    setViolationId(record.id)
    setViolationType(undefined)
    setViolationVisible(true)
  }

  const handleViolationSubmit = () => {
    if (!violationType) {
      message.warning('请选择违规类型')
      return
    }
    if (violationId) {
      setData(data.map(item => item.id === violationId ? {
        ...item,
        status: 'violation' as const,
        violationType,
        reviewer: '审核员A',
        reviewTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        rejectReason: violationTypeMap[violationType]?.text,
        auditHistory: [...item.auditHistory, { action: '标记违规', operator: '审核员A', time: new Date().toISOString().replace('T', ' ').substring(0, 19), reason: violationTypeMap[violationType]?.text, result: '违规' }]
      } : item))
      message.success('已标记违规')
      setViolationVisible(false)
    }
  }

  const pendingCount = data.filter(i => i.status === 'pending').length
  const approvedCount = data.filter(i => i.status === 'approved').length
  const rejectedCount = data.filter(i => i.status === 'rejected').length
  const violationCount = data.filter(i => i.status === 'violation').length

  const tabItems = [
    { key: 'all', label: <span>全部 <Badge count={data.length} style={{ marginLeft: 4 }} /></span> },
    { key: 'pending', label: <span>待审核 <Badge count={pendingCount} style={{ backgroundColor: '#fa8c16', marginLeft: 4 }} /></span> },
    { key: 'approved', label: <span>已通过 <Badge count={approvedCount} style={{ backgroundColor: '#52c41a', marginLeft: 4 }} /></span> },
    { key: 'rejected', label: <span>已拒绝 <Badge count={rejectedCount} style={{ backgroundColor: '#f5222d', marginLeft: 4 }} /></span> },
    { key: 'violation', label: <span>违规记录 <Badge count={violationCount} style={{ backgroundColor: '#eb2f96', marginLeft: 4 }} /></span> },
    { key: 'review', label: '复查记录' },
    { key: 'stats', label: '违规统计' }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="待审核" value={pendingCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已通过" value={approvedCount} prefix={<CheckOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已拒绝" value={rejectedCount} prefix={<CloseOutlined />} valueStyle={{ color: '#f5222d' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="违规累计" value={violationCount} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#eb2f96' }} /></Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab !== 'review' && activeTab !== 'stats' && (
          <>
            <Space style={{ marginBottom: 16 }} wrap>
              <Input placeholder="搜索标题/作者" prefix={<SearchOutlined />} style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setLoading(true); setTimeout(() => { setLoading(false) }, 300) }} />
              <Select placeholder="内容类型" style={{ width: 120 }} allowClear value={typeFilter} onChange={setTypeFilter} options={[{ value: 'post', label: '帖子' }, { value: 'comment', label: '评论' }]} />
            </Space>
            <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ total: filteredData.length, pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
          </>
        )}

        {activeTab === 'review' && (
          <Table columns={reviewColumns} dataSource={reviewRecords} rowKey="id" pagination={false} />
        )}

        {activeTab === 'stats' && (
          <Row gutter={16}>
            <Col span={8}><Card><ReactECharts option={violationPieOption} style={{ height: 320 }} /></Card></Col>
            <Col span={8}><Card><ReactECharts option={violationTrendOption} style={{ height: 320 }} /></Card></Col>
            <Col span={8}><Card><ReactECharts option={reviewerBarOption} style={{ height: 320 }} /></Card></Col>
          </Row>
        )}
      </Card>

      <Drawer title="内容详情" width={600} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {currentContent && (
          <>
            <h3>{currentContent.title}</h3>
            <Space style={{ marginBottom: 16 }}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>{currentContent.author[0]}</Avatar>
              <Tag color={typeMap[currentContent.type].color}>{typeMap[currentContent.type].text}</Tag>
              <Tag color={statusMap[currentContent.status].color}>{statusMap[currentContent.status].text}</Tag>
              {currentContent.violationType && <Tag color={violationTypeMap[currentContent.violationType]?.color}>{violationTypeMap[currentContent.violationType]?.text}</Tag>}
              <span style={{ color: '#999' }}>{formatDateTime(currentContent.createTime)}</span>
            </Space>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              {currentContent.content}
            </div>
            {currentContent.rejectReason && (
              <Card size="small" style={{ marginBottom: 16, borderColor: '#f5222d' }}>
                <Space>
                  <WarningOutlined style={{ color: '#f5222d' }} />
                  <span>处理原因: {currentContent.rejectReason}</span>
                </Space>
              </Card>
            )}
            <Card title="审核历史时间线" size="small">
              <Timeline
                items={currentContent.auditHistory.map((record, idx) => ({
                  color: record.result === '通过' ? 'green' : record.result === '违规' ? 'red' : record.result === '拒绝' ? 'orange' : 'blue',
                  children: (
                    <div key={idx}>
                      <div><b>{record.action}</b> - {record.operator}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{formatDateTime(record.time)}</div>
                      {record.reason && <div style={{ fontSize: 12, color: '#666' }}>原因: {record.reason}</div>}
                    </div>
                  )
                }))}
              />
            </Card>
          </>
        )}
      </Drawer>

      <Modal title="拒绝原因" open={rejectVisible} onOk={handleRejectSubmit} onCancel={() => setRejectVisible(false)}>
        <Input.TextArea rows={4} placeholder="请输入拒绝原因" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>

      <Modal title="标记违规" open={violationVisible} onOk={handleViolationSubmit} onCancel={() => setViolationVisible(false)}>
        <div style={{ marginBottom: 12 }}>选择违规类型:</div>
        <Select style={{ width: '100%' }} placeholder="请选择违规类型" value={violationType} onChange={setViolationType} options={Object.entries(violationTypeMap).map(([k, v]) => ({ value: k, label: v.text }))} />
      </Modal>
    </div>
  )
}

export default Community
