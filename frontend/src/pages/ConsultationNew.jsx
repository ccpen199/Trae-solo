import React, { useState, useRef } from 'react'
import {
  Card, Form, Input, Select, Button, Space, List, Avatar, Tag, Progress,
  message, Row, Col, Result, Upload, Alert, Divider, Descriptions, Tooltip,
  Steps, Modal
} from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  InboxOutlined, LockOutlined, SafetyOutlined, EyeOutlined,
  FileTextOutlined, CheckCircleOutlined, InfoCircleOutlined,
  MessageOutlined, SafetyCertificateOutlined, TrophyOutlined, SyncOutlined
} from '@ant-design/icons'
import { createConsultation, triage, getLawyers, createContract } from '../api.js'
import dayjs from 'dayjs'

const computeSha256 = async (file) => {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const { Dragger } = Upload

const ConsultationNew = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [triageResult, setTriageResult] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState(null)
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [evidenceHashes, setEvidenceHashes] = useState([])
  const [confirmedCaseCode, setConfirmedCaseCode] = useState('')
  const [confirmedCategory, setConfirmedCategory] = useState('')
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractingLawyer, setContractingLawyer] = useState(null)
  const [contentPreview, setContentPreview] = useState('')
  const [extractedElements, setExtractedElements] = useState([])
  const [triageConfirmed, setTriageConfirmed] = useState(false)
  const [reTriaging, setReTriaging] = useState(false)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const handleFileUpload = async ({ fileList }) => {
    setEvidenceFiles(fileList)
    const newHashes = []
    for (const file of fileList) {
      if (file.originFileObj) {
        try {
          const hash = await computeSha256(file.originFileObj)
          newHashes.push({ name: file.name, hash: `sha256:${hash}`, size: file.size })
        } catch (e) {
          console.error('Hash error:', e)
        }
      }
    }
    setEvidenceHashes(newHashes)
    if (newHashes.length > 0) {
      message.success(`已生成 ${newHashes.length} 个证据材料的 SHA-256 哈希存证`)
    }
  }

  const extractKeyElements = (content) => {
    const elements = []
    const moneyMatch = content.match(/(\d+[万万千]{0,2}元?|\d+,\d+)/g)
    const timeMatch = content.match(/\d+[天月年]/g)
    const peopleMatch = content.match(/(老公|老婆|前夫|前妻|公司|老板|同事|朋友|父母|子女|亲戚|对方|第三人)/g)
    const placeMatch = content.match(/(房产|房屋|房子|车子|车辆|公司|工厂|店铺|工地)/g)

    if (moneyMatch) elements.push({ type: '金额', values: [...new Set(moneyMatch)] })
    if (timeMatch) elements.push({ type: '时间', values: [...new Set(timeMatch)] })
    if (peopleMatch) elements.push({ type: '主体', values: [...new Set(peopleMatch)] })
    if (placeMatch) elements.push({ type: '标的', values: [...new Set(placeMatch)] })

    const claims = []
    if (content.includes('赔偿') || content.includes('补偿金')) claims.push('损害赔偿')
    if (content.includes('离婚') || content.includes('抚养权')) claims.push('婚姻家庭')
    if (content.includes('工资') || content.includes('辞退') || content.includes('加班')) claims.push('劳动争议')
    if (content.includes('还钱') || content.includes('借款') || content.includes('欠款')) claims.push('债权债务')
    if (content.includes('合同') || content.includes('违约')) claims.push('合同纠纷')
    if (claims.length) elements.push({ type: '诉求', values: claims })

    return elements
  }

  const handleTriage = async () => {
    const content = form.getFieldValue('content')
    const title = form.getFieldValue('title')
    if (!content || content.length < 10) {
      message.warning('请先填写详细咨询内容（至少10个字）')
      return
    }
    setContentPreview(content)
    setExtractedElements(extractKeyElements(content))
    setLoading(true)
    setReTriaging(true)
    try {
      const res = await triage(content)
      setTriageResult(res.data)
      setConfirmedCaseCode(res.data.caseCode)
      setConfirmedCategory(res.data.analysis.primaryCategory)
      setTriageConfirmed(false)
      message.success('智能分诊完成，请在右侧复核结果')
    } catch (e) {
      message.error('分诊失败')
    } finally {
      setLoading(false)
      setReTriaging(false)
    }
  }

  const handleConfirmTriage = () => {
    setTriageConfirmed(true)
    message.success('分诊结果已确认，可以提交咨询')
  }

  const handleReTriage = () => {
    handleTriage()
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const hashString = evidenceHashes.map(h => `${h.name}:${h.hash}`).join(';')
      const res = await createConsultation({
        ...values,
        evidence_hashes: hashString || undefined,
        case_category: confirmedCategory,
        case_code: confirmedCaseCode
      })
      setSubmitted(true)
      setSubmittedId(res.data.id)
      message.success('咨询提交成功，证据哈希已存证')
    } catch (e) {
      message.error('提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContract = async (lawyer) => {
    try {
      setContractingLawyer(lawyer)
      setShowContractModal(true)
      const hourlyRates = { 1: 800, 2: 600, 3: 700, 4: 500 }
      await createContract({
        consultation_id: submittedId,
        lawyer_id: lawyer.id,
        client_name: form.getFieldValue('client_name') || '客户',
        hourly_rate: hourlyRates[lawyer.id] || 500,
        scope: `代理${form.getFieldValue('title')}相关法律事务，包括咨询、文书、谈判及诉讼代理`
      })
      message.success('服务合约已创建，电子签章链已生成')
      setShowContractModal(false)
      setContractingLawyer(null)
    } catch (e) {
      message.error('合约创建失败')
      setShowContractModal(false)
    }
  }

  const handleContentChange = (e) => {
    const val = e.target.value
    if (val && val.length > 20) {
      setExtractedElements(extractKeyElements(val))
    }
  }

  if (submitted) {
    return (
      <div>
        <Result
          status="success"
          title="咨询提交成功"
          subTitle={
            <Space direction="vertical" align="center">
              <span>案件编号 <Tag color="geekblue">#{submittedId}</Tag> - 案由 <Tag color="blue">{confirmedCategory}</Tag> - 编码 <Tag color="purple">{confirmedCaseCode}</Tag></span>
              {evidenceHashes.length > 0 && (
                <span><Tag color="green" icon={<CheckCircleOutlined />}>{evidenceHashes.length}份证据材料已哈希存证</Tag></span>
              )}
            </Space>
          }
          extra={
            <div>
              <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 500 }}>
                <Steps
                  current={1}
                  items={[
                    { title: '咨询提交', description: dayjs().format('HH:mm') },
                    { title: '律师匹配', description: 'TOP3已匹配' },
                    { title: '加密沟通', description: '可开始' },
                    { title: '签约服务', description: '待确认' }
                  ]}
                />
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Button type="primary" size="large" block icon={<MessageOutlined />}
                      onClick={() => navigate(`/chat/${submittedId}`)}>
                      进入加密沟通
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button size="large" block icon={<SafetyCertificateOutlined />}
                      onClick={() => setShowContractModal(true)}>
                      签署服务合约
                    </Button>
                  </Col>
                </Row>
                <Button block onClick={() => navigate('/consultations')}>返回咨询列表</Button>
              </Space>
            </div>
          }
        />

        <Modal
          title="选择律师签署服务合约"
          open={showContractModal}
          onCancel={() => setShowContractModal(false)}
          footer={null}
          width={700}
        >
          {triageResult && (
            <List
              dataSource={triageResult.matchedLawyers}
              renderItem={(item, idx) => (
                <List.Item
                  actions={[
                    <Button type="primary" size="small" loading={contractingLawyer?.id === item.id}
                      onClick={() => handleCreateContract(item)}>
                      选择签约
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: idx === 0 ? '#faad14' : idx === 1 ? '#a0d911' : '#1890ff', fontWeight: 'bold' }}>{idx + 1}</Avatar>}
                    title={<Space>{item.name} <Tag color="gold">匹配度 {item.match_score}</Tag></Space>}
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {item.specialties?.map((s, i) => <Tag key={i}>{s.category}</Tag>)}
                        </div>
                        <Space size="large">
                          <span>胜诉率 <Progress percent={Math.round(item.win_rate * 100)} size="small" style={{ width: 80 }} /></span>
                          <span>评价 <Progress percent={Math.round(item.sentiment_score * 100)} size="small" style={{ width: 80 }} status="active" /></span>
                          <span>响应 {item.avg_response_time}分钟</span>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>
      </div>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      <Col lg={14}>
        <Alert
          message="📋 委托前隐私最小化提示"
          description={
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12 }}>
              <li>根据《个人信息保护法》，本平台仅收集处理与法律服务相关的最小必要信息</li>
              <li>证据材料仅计算 SHA-256 哈希值用于存证，原文不上传服务器</li>
              <li>联系方式仅用于律师对接，不会用于其他商业用途</li>
              <li>所有法律咨询内容采用端到端加密存储，仅您和匹配律师可见</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Card title="📝 发起法律咨询" extra={<Tag icon={<LockOutlined />} color="green">端到端加密</Tag>}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="title" label="咨询标题" rules={[{ required: true, message: '请输入咨询标题' }]}>
              <Input placeholder="简要描述您的法律问题，如：劳动合同纠纷、房产继承等" maxLength={50} showCount />
            </Form.Item>

            <Form.Item name="content" label="详细描述" rules={[{ required: true, message: '请详细描述咨询内容' }]}
              extra="请详细描述事件经过，包括时间、地点、人物、诉求等，越详细越有助于准确分诊">
              <Input.TextArea
                rows={6}
                placeholder="例如：我于2024年1月入职某公司，公司至今未签订劳动合同，也未缴纳社保，现在要辞退我，请问可以主张哪些赔偿？"
                onChange={handleContentChange}
                showCount
                maxLength={2000}
              />
            </Form.Item>

            {extractedElements.length > 0 && (
              <Card size="small" type="inner" title="🔍 实时关键要素提取" style={{ marginBottom: 16 }}>
                <Space wrap>
                  {extractedElements.map((e, i) => (
                    <span key={i}>
                      <Tag color="blue">{e.type}:</Tag>
                      {e.values.map((v, j) => <Tag key={j} color="geekblue">{v}</Tag>)}
                    </span>
                  ))}
                </Space>
              </Card>
            )}

            <Form.Item label="📎 证据材料上传（仅计算哈希存证，原文不上传）">
              <Dragger
                fileList={evidenceFiles}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                multiple
                maxCount={10}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽文件到此区域</p>
                <p className="ant-upload-hint">
                  支持 PDF、Word、图片、Excel、TXT 格式，系统将自动计算 SHA-256 哈希值用于存证
                </p>
              </Dragger>
              {evidenceHashes.length > 0 && (
                <div style={{ marginTop: 12, background: '#f6ffed', padding: 12, borderRadius: 6 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#52c41a' }}>
                    <CheckCircleOutlined /> 证据哈希存证已生成（SHA-256）：
                  </div>
                  {evidenceHashes.map((h, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}>
                      {h.name}: <code>{h.hash}</code>
                    </div>
                  ))}
                </div>
              )}
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="urgency" label="紧急程度" rules={[{ required: true }]} initialValue="normal">
                  <Select>
                    <Select.Option value="low">🟢 一般（72h内）</Select.Option>
                    <Select.Option value="normal">🔵 普通（24h内）</Select.Option>
                    <Select.Option value="high">🔴 紧急（2h内）</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="client_name" label="您的姓名" rules={[{ required: true }]}>
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="client_contact" label="联系方式" rules={[{ required: true }]}>
                  <Input placeholder="手机号或邮箱" />
                </Form.Item>
              </Col>
            </Row>

            {triageResult && (
              <Card size="small" type="inner" title="✅ 案由编码确认（可手动调整）" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="案由分类" style={{ marginBottom: 0 }} initialValue={confirmedCategory}>
                      <Select value={confirmedCategory} onChange={setConfirmedCategory} style={{ width: '100%' }}>
                        <Select.Option value="债权债务">债权债务</Select.Option>
                        <Select.Option value="婚姻家庭">婚姻家庭</Select.Option>
                        <Select.Option value="劳动争议">劳动争议</Select.Option>
                        <Select.Option value="合同纠纷">合同纠纷</Select.Option>
                        <Select.Option value="房产纠纷">房产纠纷</Select.Option>
                        <Select.Option value="交通事故">交通事故</Select.Option>
                        <Select.Option value="知识产权">知识产权</Select.Option>
                        <Select.Option value="刑事辩护">刑事辩护</Select.Option>
                        <Select.Option value="行政诉讼">行政诉讼</Select.Option>
                        <Select.Option value="涉外法律">涉外法律</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="案由编码" style={{ marginBottom: 0 }}>
                      <Input value={confirmedCaseCode} onChange={e => setConfirmedCaseCode(e.target.value)} prefix="M" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            )}

            <Form.Item>
              <Space wrap>
                <Button loading={loading || reTriaging} onClick={handleTriage} icon={<EyeOutlined />} type={!triageResult ? 'primary' : 'default'}>
                  {triageResult ? '重新分诊' : '智能分诊预览（提取要素+匹配律师）'}
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} icon={<FileTextOutlined />}
                  disabled={!triageResult || !triageConfirmed}>
                  提交咨询 {triageResult && !triageConfirmed && '(请先确认分诊结果)'}
                </Button>
                <Button onClick={() => navigate('/consultations')}>返回列表</Button>
              </Space>
              {triageResult && !triageConfirmed && (
                <Alert
                  message="⚠️ 请在右侧复核分诊结果后点击「确认分诊」，再提交咨询"
                  type="warning"
                  showIcon
                  size="small"
                  style={{ marginTop: 12 }}
                />
              )}
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col lg={10}>
        <Card title="🎯 智能分诊结果 & 复核" loading={loading || reTriaging}
          extra={triageResult && <Space>
            <Tag color={triageConfirmed ? 'success' : 'warning'}>
              {triageConfirmed ? '已确认' : '待复核'}
            </Tag>
            <Tag color="blue">{triageResult.matchedLawyers?.length || 0}位匹配</Tag>
          </Space>}>
          {triageResult ? (
            <div>
              <Divider style={{ margin: '8px 0' }} orientation="left">
                <Space><InfoCircleOutlined /> 分析结果</Space>
              </Divider>
              <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
                <Descriptions.Item label="案由分类（可在左侧修改）">
                  <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>{confirmedCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="案由编码（可在左侧修改）">
                  <Tag color="geekblue" style={{ fontSize: 14, padding: '2px 10px' }}>{confirmedCaseCode}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="NLP提取关键词">
                  <Space wrap>
                    {triageResult.analysis.keywords.map((k, i) => <Tag key={i} color="purple">{k}</Tag>)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="实时要素提取">
                  <Space wrap>
                    {extractedElements.map((e, i) => (
                      <span key={i}>
                        <Tag color="blue">{e.type}:</Tag>
                        {e.values.map((v, j) => <Tag key={j} color="geekblue">{v}</Tag>)}
                      </span>
                    ))}
                    {extractedElements.length === 0 && <Tag>内容不足20字</Tag>}
                  </Space>
                </Descriptions.Item>
                {evidenceHashes.length > 0 && (
                  <Descriptions.Item label="证据存证">
                    <Tag color="green" icon={<CheckCircleOutlined />}>{evidenceHashes.length}份 SHA-256</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider style={{ margin: '8px 0' }} orientation="left">
                <Space><TrophyOutlined /> TOP3 匹配律师（含权重分数）</Space>
              </Divider>
              <List
                size="small"
                dataSource={triageResult.matchedLawyers}
                renderItem={(item, idx) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: idx < 2 ? '1px solid #f0f0f0' : 'none' }}>
                    <List.Item.Meta
                      avatar={<Avatar style={{ 
                        backgroundColor: idx === 0 ? '#faad14' : idx === 1 ? '#a0d911' : '#1890ff', 
                        fontWeight: 'bold', 
                        fontSize: 14,
                        width: 36,
                        height: 36
                      }}>{idx + 1}</Avatar>}
                      title={
                        <Space wrap>
                          <b style={{ fontSize: 14 }}>{item.name}</b>
                          <Tag color={idx === 0 ? 'gold' : 'blue'} style={{ fontWeight: 'bold' }}>
                            匹配分 {Math.round(item.match_score)}
                          </Tag>
                          {item.license_verified && <Tag color="success" icon={<CheckCircleOutlined />}>已核验</Tag>}
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 6 }}>
                          <div style={{ marginBottom: 8 }}>
                            {item.specialties?.slice(0, 3).map((s, i) => (
                              <Tooltip key={i} title={`权重来源：${s.weight >= 0.9 ? '核心专精领域' : s.weight >= 0.7 ? '重要办案方向' : '辅助领域'}`}>
                                <Tag style={{ marginBottom: 4 }} color={s.weight >= 0.9 ? 'gold' : s.weight >= 0.7 ? 'blue' : 'default'}>
                                  {s.category} {Math.round(s.weight * 100)}%
                                </Tag>
                              </Tooltip>
                            ))}
                          </div>
                          <Row gutter={8} style={{ marginBottom: 6 }}>
                            <Col span={8}><small>胜诉率 {Math.round(item.win_rate * 100)}%</small></Col>
                            <Col span={8}><small>满意度 {Math.round(item.sentiment_score * 100)}%</small></Col>
                            <Col span={8}><small>{item.avg_response_time}分钟响应</small></Col>
                          </Row>
                          <Alert
                            message={<small style={{ color: '#666' }}>
                              💡 匹配分 = 领域权重{Math.round(item.specialties?.[0]?.weight * 100 || 0)}×100 + 
                              胜诉率{Math.round(item.win_rate * 100)}×0.3 + 
                              满意度{Math.round(item.sentiment_score * 100)}×0.2
                            </small>}
                            type="info"
                            size="small"
                            showIcon={false}
                            style={{ background: '#fafafa', border: 'none', padding: '4px 8px' }}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />

              <Divider style={{ margin: '12px 0' }} />
              
              {!triageConfirmed ? (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Alert
                    message="请复核以上分析结果，如无问题请确认分诊"
                    type="info"
                    showIcon
                    size="small"
                  />
                  <Space style={{ width: '100%' }}>
                    <Button type="primary" block icon={<CheckCircleOutlined />} onClick={handleConfirmTriage}>
                      确认分诊结果
                    </Button>
                    <Button block icon={<SyncOutlined />} onClick={handleReTriage} loading={reTriaging}>
                      重新分诊
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Alert
                  message="✅ 分诊结果已确认，可以提交咨询"
                  type="success"
                  showIcon
                  action={<Button size="small" onClick={() => setTriageConfirmed(false)}>修改</Button>}
                />
              )}

              <Divider style={{ margin: '12px 0' }} />
              <Alert
                message="匹配算法"
                description="匹配分数 = 专精领域权重 × 100 + 胜诉率 × 30 + 客户满意度 × 20 + 执业年限 × 0.5 - 响应时间 × 0.1"
                type="info"
                showIcon
                size="small"
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>
              <EyeOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block', color: '#d9d9d9' }} />
              <p style={{ fontSize: 15, marginBottom: 8 }}>填写咨询内容后点击「智能分诊预览」</p>
              <p style={{ fontSize: 12 }}>系统将自动提取关键要素、识别案由分类、并匹配最合适的 TOP3 律师</p>
              <div style={{ marginTop: 16, textAlign: 'left', background: '#fafafa', padding: 12, borderRadius: 6 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#666' }}>分诊将提供：</p>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 18, fontSize: 12, color: '#666' }}>
                  <li>NLP 关键词与要素提取</li>
                  <li>案由分类编码（如 M0101-M0601）</li>
                  <li>TOP3 律师匹配及权重分数</li>
                  <li>证据材料 SHA-256 哈希存证</li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        <Card title="💡 提交后可承接的服务" size="small" style={{ marginTop: 16 }}>
          <Steps direction="vertical" size="small" items={[
            { title: '加密法律咨询', description: 'AES-256 端到端加密，图文语音视频沟通，消息哈希存证' },
            { title: '服务合约签署', description: '在线约定小时费率、委托范围，电子签章链存证' },
            { title: '法律文书生成', description: '法院文书格式规范校验 + 条款冲突检测 + 法条溯源' },
            { title: '结案质量评估', description: '响应时效、解决闭环率、客户满意度综合评分' }
          ]} />
        </Card>
      </Col>
    </Row>
  )
}

export default ConsultationNew
