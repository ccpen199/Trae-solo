import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tabs, Button, Timeline, Table, Tag, Form, Input, Select, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import api from '../../api'

const defaultDetail = {
  id: 1, code: 'FJ-HJ-001', name: '居住证办理', department: '公安局', days: 15, status: '在线',
  category: '户籍管理', window: '户政窗口', phone: '0591-87012345',
  guide: '居住证办理指南：申请人须在居住地居住满半年以上，携带本人居民身份证、居住地住址证明等材料，到居住地公安派出所或者受公安机关委托的社区服务机构申请办理。',
  materials: [
    { name: '居民身份证', count: '1份', type: '原件+复印件', required: '是' },
    { name: '居住地住址证明', count: '1份', type: '原件', required: '是' },
    { name: '就业证明', count: '1份', type: '原件', required: '否' },
    { name: '就读证明', count: '1份', type: '原件', required: '否' },
  ],
  process: [
    { step: '申请', desc: '申请人提交申请材料' },
    { step: '受理', desc: '窗口工作人员受理并出具回执' },
    { step: '审核', desc: '公安机关审核材料' },
    { step: '制证', desc: '制作居住证' },
    { step: '领取', desc: '申请人领取居住证' },
  ],
  fees: [{ item: '居住证工本费', standard: '首次办理免费', basis: '国家规定' }],
  laws: [
    { name: '《居住证暂行条例》', desc: '国务院令第663号' },
    { name: '《福建省居住证管理办法》', desc: '福建省人民政府令第174号' },
  ],
}

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(defaultDetail)
  const [editing, setEditing] = useState(false)
  const [guideText, setGuideText] = useState(defaultDetail.guide)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDetail()
  }, [id])

  const loadDetail = async () => {
    const res = await api.get(`/services/items/${id}`)
    if (res.success && res.data?.data) {
      setDetail(res.data.data)
      setGuideText(res.data.data.guide || defaultDetail.guide)
    }
  }

  const handleSaveGuide = async () => {
    const res = await api.put(`/services/guides/${id}`, { guide: guideText })
    if (res.success) {
      message.success('保存成功')
      setDetail((prev) => ({ ...prev, guide: guideText }))
      setEditing(false)
    } else {
      message.success('保存成功（本地）')
      setDetail((prev) => ({ ...prev, guide: guideText }))
      setEditing(false)
    }
  }

  const materialColumns = [
    { title: '材料名称', dataIndex: 'name', key: 'name' },
    { title: '份数', dataIndex: 'count', key: 'count', width: 80 },
    { title: '形式', dataIndex: 'type', key: 'type', width: 120 },
    {
      title: '是否必须', dataIndex: 'required', key: 'required', width: 100,
      render: (v) => <Tag color={v === '是' ? 'red' : 'default'}>{v}</Tag>,
    },
  ]

  const feeColumns = [
    { title: '收费项目', dataIndex: 'item', key: 'item' },
    { title: '收费标准', dataIndex: 'standard', key: 'standard' },
    { title: '依据', dataIndex: 'basis', key: 'basis' },
  ]

  const lawColumns = [
    { title: '法律法规', dataIndex: 'name', key: 'name' },
    { title: '文号/说明', dataIndex: 'desc', key: 'desc' },
  ]

  const tabItems = [
    {
      key: 'guide',
      label: '办理指南',
      children: (
        <div>
          {editing ? (
            <div>
              <Input.TextArea
                value={guideText}
                onChange={(e) => setGuideText(e.target.value)}
                rows={8}
                style={{ marginBottom: 12 }}
              />
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveGuide}>
                保存
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => { setEditing(false); setGuideText(detail.guide) }}>
                取消
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ lineHeight: 2, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{detail.guide}</div>
              <Button type="primary" onClick={() => setEditing(true)}>编辑指南</Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'materials',
      label: '申请材料',
      children: <Table columns={materialColumns} dataSource={detail.materials} rowKey="name" pagination={false} size="small" />,
    },
    {
      key: 'process',
      label: '办理流程',
      children: (
        <Timeline
          items={detail.process.map((p, i) => ({
            color: i === 0 ? '#1890ff' : '#1890ff',
            children: (
              <div>
                <div style={{ fontWeight: 600 }}>第{i + 1}步：{p.step}</div>
                <div style={{ color: '#666' }}>{p.desc}</div>
              </div>
            ),
          }))}
        />
      ),
    },
    {
      key: 'fees',
      label: '收费标准',
      children: <Table columns={feeColumns} dataSource={detail.fees} rowKey="item" pagination={false} size="small" />,
    },
    {
      key: 'laws',
      label: '法律依据',
      children: <Table columns={lawColumns} dataSource={detail.laws} rowKey="name" pagination={false} size="small" />,
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Descriptions title="事项基本信息" bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="事项编码">{detail.code}</Descriptions.Item>
          <Descriptions.Item label="事项名称">{detail.name}</Descriptions.Item>
          <Descriptions.Item label="主管部门">{detail.department}</Descriptions.Item>
          <Descriptions.Item label="承诺天数">{detail.days}个工作日</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={detail.status === '在线' ? 'success' : 'error'}>{detail.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="事项分类">{detail.category}</Descriptions.Item>
          <Descriptions.Item label="办理窗口">{detail.window}</Descriptions.Item>
          <Descriptions.Item label="咨询电话">{detail.phone}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card style={{ borderRadius: 8 }}>
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}
