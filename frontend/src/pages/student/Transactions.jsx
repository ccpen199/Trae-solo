import React, { useEffect, useState } from 'react'
import { Table, Tag, DatePicker, Button, Card, Statistic, Row, Col, Descriptions, Modal, Space } from 'antd'
import { WalletOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import StudentLayout from '../../components/StudentLayout.jsx'
import { transactionAPI } from '../../utils/api.js'

function StudentTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [dateRange, setDateRange] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [stats, setStats] = useState({ totalAmount: 0, totalWater: 0, count: 0 })

  useEffect(() => {
    loadTransactions()
  }, [pagination.current, pagination.pageSize])

  useEffect(() => {
    if (transactions.length > 0) {
      const completed = transactions.filter(t => t.status === 'completed')
      setStats({
        totalAmount: completed.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalWater: completed.reduce((sum, t) => sum + (t.water_used || 0), 0),
        count: completed.length,
      })
    }
  }, [transactions])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const response = await transactionAPI.getTransactions(params)
      setTransactions(response.data.transactions)
      setPagination(p => ({ ...p, total: response.data.total }))
    } catch (error) {
      console.error('加载交易记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodText = (method) => {
    const methods = {
      alipay: '支付宝',
      wechat: '微信支付',
      balance: '余额扣费',
      card: '校园卡',
    }
    return methods[method] || method || '余额扣费'
  }

  const showDetail = async (record) => {
    try {
      const res = await transactionAPI.getTransaction(record.id)
      setSelectedTransaction(res.data)
    } catch (error) {
      console.error('加载账单详情失败', error)
      setSelectedTransaction(record)
    }
    setDetailModal(true)
  }

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '设备信息',
      key: 'device',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.device_name || record.device_id}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.device_location || ''}</div>
        </div>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 170,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 170,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (text) => {
        if (!text) return '-'
        const mins = Math.floor(text / 60)
        const secs = text % 60
        return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
      },
    },
    {
      title: '用水量',
      dataIndex: 'water_used',
      key: 'water_used',
      width: 100,
      render: (text) => text ? `${text.toFixed(2)}L` : '-',
    },
    {
      title: '平均水温',
      dataIndex: 'avg_temp',
      key: 'avg_temp',
      width: 100,
      render: (text) => text ? `${text.toFixed(1)}°C` : '-',
    },
    {
      title: '平均流速',
      dataIndex: 'avg_flow',
      key: 'avg_flow',
      width: 110,
      render: (text) => text ? `${text.toFixed(2)}L/min` : '-',
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const color = method === 'alipay' ? 'blue' : method === 'wechat' ? 'green' : 'purple'
        return <Tag color={color}>{getPaymentMethodText(method)}</Tag>
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (text, record) => (
        <span style={{ 
          fontWeight: 'bold', 
          color: record.status === 'completed' ? '#52c41a' : '#faad14' 
        }}>
          ¥{text?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const color = status === 'completed' ? 'success' : status === 'active' ? 'processing' : 'default'
        const text = status === 'completed' ? '已完成' : status === 'active' ? '进行中' : status
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <StudentLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>消费账单</h2>
          <Button onClick={loadTransactions}>刷新</Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总消费笔数"
                value={stats.count}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="累计用水量"
                value={stats.totalWater.toFixed(1)}
                suffix="L"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="累计消费金额"
                value={stats.totalAmount.toFixed(2)}
                prefix={<WalletOutlined style={{ marginRight: 4 }} />}
                formatter={(value) => `¥${value}`}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Card style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ color: '#666' }}>时间筛选：</span>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button type="primary" onClick={loadTransactions}>查询</Button>
            {dateRange && (
              <Button onClick={() => { setDateRange(null); loadTransactions(); }}>
                重置
              </Button>
            )}
          </div>

          <Table
            columns={columns}
            dataSource={transactions}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize })),
            }}
          />
        </Card>

        <Modal
          title="账单详情"
          open={detailModal}
          onCancel={() => setDetailModal(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>
          ]}
          width={700}
        >
          {selectedTransaction && (
            <div>
              <Descriptions title="账户身份信息" column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="学生学号">{selectedTransaction.student_id}</Descriptions.Item>
                <Descriptions.Item label="学生姓名">{selectedTransaction.student_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="绑定支付宝">
                  {selectedTransaction.alipay_user_id 
                    ? selectedTransaction.alipay_user_id.replace(/(.{6}).*(.{4})/, '$1****$2') 
                    : '未绑定'}
                </Descriptions.Item>
                <Descriptions.Item label="绑定手机">
                  {selectedTransaction.student_phone 
                    ? selectedTransaction.student_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') 
                    : '未绑定'}
                </Descriptions.Item>
              </Descriptions>

              <Descriptions title="交易基本信息" column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="交易ID">{selectedTransaction.id}</Descriptions.Item>
                <Descriptions.Item label="设备名称">{selectedTransaction.device_name || selectedTransaction.device_id}</Descriptions.Item>
                <Descriptions.Item label="设备位置">{selectedTransaction.building || ''} {selectedTransaction.device_location || '-'}</Descriptions.Item>
                <Descriptions.Item label="设备楼层">{selectedTransaction.floor || '-'}层</Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {new Date(selectedTransaction.start_time).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {selectedTransaction.end_time ? new Date(selectedTransaction.end_time).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="使用时长">
                  {selectedTransaction.duration 
                    ? `${Math.floor(selectedTransaction.duration / 60)}分${selectedTransaction.duration % 60}秒` 
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="用水量">{selectedTransaction.water_used?.toFixed(2) || 0}L</Descriptions.Item>
                <Descriptions.Item label="平均水温">{selectedTransaction.avg_temp?.toFixed(1) || '-'}°C</Descriptions.Item>
                <Descriptions.Item label="平均流速">{selectedTransaction.avg_flow?.toFixed(2) || '-'}L/min</Descriptions.Item>
                <Descriptions.Item label="支付方式">
                  <Tag>{getPaymentMethodText(selectedTransaction.payment_method)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="交易金额">
                  <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>
                    ¥{selectedTransaction.amount?.toFixed(2) || '0.00'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="交易状态" span={2}>
                  <Tag color={selectedTransaction.status === 'completed' ? 'success' : 'processing'}>
                    {selectedTransaction.status === 'completed' ? '已完成' : '进行中'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {selectedTransaction.pricing_rules && selectedTransaction.pricing_rules.length > 0 && (
                <Descriptions title="资费策略来源" column={1} bordered size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="当前生效规则">
                    {selectedTransaction.pricing_rules.map((rule, idx) => (
                      <div key={idx} style={{ padding: '4px 0' }}>
                        <Tag color="blue">{rule.name}</Tag>
                        阶梯价: ¥{rule.price_per_liter}/L
                        {rule.night_discount && <Tag color="orange" style={{ marginLeft: 8 }}>夜间优惠{rule.night_discount * 100}%</Tag>}
                        {rule.peak_price && <Tag color="red" style={{ marginLeft: 8 }}>高峰时段¥{rule.peak_price}/L</Tag>}
                      </div>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {selectedTransaction.related_alerts && selectedTransaction.related_alerts.length > 0 ? (
                <Descriptions title="异常用水复查记录" column={1} bordered size="small">
                  <Descriptions.Item label="相关告警">
                    {selectedTransaction.related_alerts.map((alert, idx) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: idx < selectedTransaction.related_alerts.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <Space>
                          <Tag color={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'orange' : 'blue'}>
                            {alert.type === 'full_flow' ? '满流运行' : alert.type}
                          </Tag>
                          <span>{alert.message}</span>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {new Date(alert.created_at).toLocaleString('zh-CN')}
                          </span>
                          <Tag color={alert.status === 'resolved' ? 'green' : 'warning'}>
                            {alert.status === 'resolved' ? '已处理' : '待处理'}
                          </Tag>
                        </Space>
                      </div>
                    ))}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <div style={{ padding: 12, background: '#f6ffed', borderRadius: 6, color: '#52c41a', fontSize: 12 }}>
                  ✓ 本次用水无异常记录，消费正常
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </StudentLayout>
  )
}

export default StudentTransactions
