import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Space, Table, Tag, Row, Col, Statistic, message, Spin, List } from 'antd'
import { ArrowLeftOutlined, ExportOutlined, ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getReport, exportReport, regenerateReport } from '../api'

function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    setLoading(true)
    try {
      const res = await getReport(id)
      if (res.data.success) {
        setReport(res.data.data)
      } else {
        message.error('加载报告失败')
      }
    } catch (error) {
      message.error('加载报告失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await exportReport(report.id, 'Admin')
      if (res.data.success) {
        const { fileName } = res.data.data
        const downloadUrl = `http://127.0.0.1:58807/exports/${fileName}`
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success(`报告导出成功，文件：${fileName}`)
      } else {
        message.error('导出失败')
      }
    } catch (error) {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleRegenerate = async () => {
    try {
      const res = await regenerateReport(report.report_no, 'Admin')
      if (res.data.success) {
        message.success('报告重新生成成功')
        navigate(`/reports/${res.data.data.reportNo}`)
      } else {
        message.error(res.data.error || '重新生成失败')
      }
    } catch (error) {
      message.error(error.response?.data?.error || '重新生成失败')
    }
  }

  const getRiskLevelClass = (level) => {
    const map = {
      low: 'risk-low',
      medium: 'risk-medium',
      high: 'risk-high',
      critical: 'risk-critical'
    }
    return map[level] || ''
  }

  const getRiskLevelText = (level) => {
    const map = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    }
    return map[level] || level
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="报告加载中..." />
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
        <p style={{ marginTop: 16 }}>报告不存在</p>
      </div>
    )
  }

  const reportData = report.reportData || {}
  const aggregatedData = reportData.aggregatedData || {}
  const hitRules = report.hitRules || []

  const ruleColumns = [
    {
      title: '规则编号',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
      width: 100
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName'
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 120,
      render: (text) => (
        <Tag color={text === 'high' || text === 'critical' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
          {getRiskLevelText(text)}
        </Tag>
      )
    }
  ]

  const evidenceColumns = [
    { title: '证据来源', dataIndex: 'source', key: 'source', width: 120 },
    { title: '证据类型', dataIndex: 'type', key: 'type' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' }
  ]

  const taxColumns = [
    { title: '类型', dataIndex: 'record_type', key: 'record_type', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '税务机关', dataIndex: 'tax_authority', key: 'tax_authority', width: 200 },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => record.is_abnormal ? (
        <Tag color="red">异常</Tag>
      ) : (
        <Tag color="green">正常</Tag>
      )
    }
  ]

  const creditColumns = [
    { title: '银行', dataIndex: 'bank', key: 'bank', width: 180 },
    { title: '授信额度', dataIndex: 'credit_line', key: 'credit_line', width: 120 },
    { title: '已用额度', dataIndex: 'used_amount', key: 'used_amount', width: 120 },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', width: 120 },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', width: 120 },
    {
      title: '状态',
      key: 'status',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tag color={record.status === '逾期' ? 'red' : 'green'}>{record.status}</Tag>
          {record.overdue_days > 0 && <span style={{ color: 'red' }}>逾期 {record.overdue_days} 天</span>}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
          返回查询
        </Button>
        <Button onClick={() => navigate('/reports')}>
          报告列表
        </Button>
        <Button type="primary" icon={<ExportOutlined />} onClick={handleExport} loading={exporting}>
          导出报告
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRegenerate} disabled={report.is_archived === 1}>
          重新生成
        </Button>
        {report.is_archived === 1 && <Tag color="blue">已归档</Tag>}
      </Space>

      <Card title="报告概览" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 24]}>
          <Col span={6}>
            <Statistic
              title="报告编号"
              value={report.report_no}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="版本"
              value={report.version}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="风险等级"
              value={getRiskLevelText(report.risk_level)}
              valueRender={() => (
                <span className={getRiskLevelClass(report.risk_level)} style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {getRiskLevelText(report.risk_level)}
                </span>
              )}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="风险评分"
              value={report.risk_score}
              suffix="/ 100"
              valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
            />
          </Col>
        </Row>
        <Descriptions column={2} style={{ marginTop: 24 }} bordered size="middle">
          <Descriptions.Item label="企业名称" span={1}>
            {report.enterprise_name}
          </Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码" span={1}>
            {report.credit_code}
          </Descriptions.Item>
          <Descriptions.Item label="生成人" span={1}>
            {report.generated_by}
          </Descriptions.Item>
          <Descriptions.Item label="生成时间" span={1}>
            {report.generated_at}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="命中规则" style={{ marginBottom: 16 }} extra={<Tag color="red">{hitRules.length} 条</Tag>}>
        {hitRules.length > 0 ? (
          <Table dataSource={hitRules} columns={ruleColumns} rowKey="ruleCode" pagination={false} size="middle" />
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <p style={{ marginTop: 16 }}>无命中规则</p>
          </div>
        )}
      </Card>

      <Card title="证据来源" style={{ marginBottom: 16 }}>
        <Table
          dataSource={report.evidenceSources || []}
          columns={evidenceColumns}
          rowKey={(record, index) => index}
          pagination={false}
          size="middle"
        />
      </Card>

      {aggregatedData.business && (
        <Card title="工商信息" style={{ marginBottom: 16 }}>
          {aggregatedData.business.success ? (
            <div>
              <Descriptions column={2} bordered size="middle" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="企业名称">
                  {aggregatedData.business.data.enterprise.name}
                </Descriptions.Item>
                <Descriptions.Item label="注册资本">
                  {aggregatedData.business.data.enterprise.registered_capital}
                </Descriptions.Item>
                <Descriptions.Item label="成立日期">
                  {aggregatedData.business.data.enterprise.establishment_date}
                </Descriptions.Item>
                <Descriptions.Item label="法定代表人">
                  {aggregatedData.business.data.enterprise.legal_representative}
                </Descriptions.Item>
                <Descriptions.Item label="经营状态">
                  {aggregatedData.business.data.enterprise.status}
                </Descriptions.Item>
                <Descriptions.Item label="所属行业">
                  {aggregatedData.business.data.enterprise.industry}
                </Descriptions.Item>
                <Descriptions.Item label="注册地址" span={2}>
                  {aggregatedData.business.data.enterprise.address}
                </Descriptions.Item>
              </Descriptions>

              {aggregatedData.business.data.changes && aggregatedData.business.data.changes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 12 }}>工商变更记录</h4>
                  <List
                    bordered
                    dataSource={aggregatedData.business.data.changes}
                    renderItem={(change) => (
                      <List.Item>
                        <List.Item.Meta
                          title={change.change_type}
                          description={
                            <Space>
                              <span style={{ color: '#999' }}>{change.before_value}</span>
                              <span>→</span>
                              <span style={{ color: '#1890ff' }}>{change.after_value}</span>
                              <Tag color="blue">{change.change_date}</Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {aggregatedData.business.data.shareholders && aggregatedData.business.data.shareholders.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: 12 }}>股东信息</h4>
                  <Table
                    dataSource={aggregatedData.business.data.shareholders}
                    columns={[
                      { title: '股东名称', dataIndex: 'name', key: 'name' },
                      { title: '持股比例', dataIndex: 'share_ratio', key: 'share_ratio', width: 150 },
                      { title: '出资额', dataIndex: 'contribution_amount', key: 'contribution_amount', width: 150 },
                      {
                        title: '是否关联企业',
                        key: 'related',
                        width: 150,
                        render: (_, record) => record.is_related_enterprise ? (
                          <Tag color="orange">是</Tag>
                        ) : (
                          <Tag color="green">否</Tag>
                        )
                      }
                    ]}
                    rowKey={(record, index) => index}
                    pagination={false}
                    size="middle"
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#ff4d4f', padding: 40, textAlign: 'center' }}>
              <ExclamationCircleOutlined style={{ fontSize: 32 }} />
              <p style={{ marginTop: 16 }}>工商数据源获取失败: {aggregatedData.business.error}</p>
              <Space>
                {aggregatedData.business.retryable && <Tag color="orange">可重试</Tag>}
                {aggregatedData.business.degraded && <Tag color="red">已降级</Tag>}
              </Space>
            </div>
          )}
        </Card>
      )}

      {aggregatedData.judicial && (
        <Card title="司法信息" style={{ marginBottom: 16 }}>
          {aggregatedData.judicial.success ? (
            <Row gutter={[16, 16]}>
              {aggregatedData.judicial.data.map((item, index) => (
                <Col span={12} key={index}>
                  <Card type="inner" title={item.title} size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="法院">{item.court}</Descriptions.Item>
                      <Descriptions.Item label="案号">{item.case_number}</Descriptions.Item>
                      <Descriptions.Item label="金额">{item.amount}</Descriptions.Item>
                      <Descriptions.Item label="判决日期">{item.verdict_date}</Descriptions.Item>
                    </Descriptions>
                    <Tag color={item.risk_level === 'high' ? 'red' : 'orange'}>
                      {getRiskLevelText(item.risk_level)}
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ color: '#ff4d4f', padding: 40, textAlign: 'center' }}>
              司法数据源获取失败: {aggregatedData.judicial.error}
            </div>
          )}
        </Card>
      )}

      {aggregatedData.tax && (
        <Card title="税务信息" style={{ marginBottom: 16 }}>
          {aggregatedData.tax.success ? (
            <Table
              dataSource={aggregatedData.tax.data}
              columns={taxColumns}
              rowKey={(record, index) => index}
              pagination={false}
              size="middle"
            />
          ) : (
            <div style={{ color: '#ff4d4f', padding: 40, textAlign: 'center' }}>
              税务数据源获取失败: {aggregatedData.tax.error}
            </div>
          )}
        </Card>
      )}

      {aggregatedData.indicators && (
        <Card title="经营指标" style={{ marginBottom: 16 }}>
          {aggregatedData.indicators.success ? (
            <Row gutter={[16, 16]}>
              {aggregatedData.indicators.data.map((item, index) => (
                <Col span={12} key={index}>
                  <Card type="inner" title={`${item.year}年 第${item.quarter || 4}季度`} size="small">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="营业收入">{item.revenue}</Descriptions.Item>
                      <Descriptions.Item label="净利润">{item.profit}</Descriptions.Item>
                      <Descriptions.Item label="员工人数">{item.employee_count} 人</Descriptions.Item>
                      <Descriptions.Item label="总资产">{item.asset_total}</Descriptions.Item>
                      <Descriptions.Item label="总负债">{item.liability_total}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ color: '#ff4d4f', padding: 40, textAlign: 'center' }}>
              经营数据源获取失败: {aggregatedData.indicators.error}
            </div>
          )}
        </Card>
      )}

      {aggregatedData.creditHistory && (
        <Card title="授信历史" style={{ marginBottom: 16 }}>
          {aggregatedData.creditHistory.success ? (
            <Table
              dataSource={aggregatedData.creditHistory.data}
              columns={creditColumns}
              rowKey={(record, index) => index}
              pagination={false}
              size="middle"
            />
          ) : (
            <div style={{ color: '#ff4d4f', padding: 40, textAlign: 'center' }}>
              授信数据源获取失败: {aggregatedData.creditHistory.error}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default ReportDetailPage
