import React, { useState, useEffect } from 'react'
import { Card, Spin, Button, Tag, Descriptions, message, Row, Col, Divider, Result } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, DownOutlined } from '@ant-design/icons'
import { getParcelChain, verifyChain } from '../../api/parcels'
import dayjs from 'dayjs'

function TraceChain() {
  const { trackingNo } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [chainData, setChainData] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)

  useEffect(() => {
    fetchChain()
  }, [trackingNo])

  const fetchChain = async () => {
    setLoading(true)
    try {
      const data = await getParcelChain(trackingNo)
      setChainData(data)
    } catch (error) {
      message.error('获取溯源链失败')
      console.error('Fetch chain error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const result = await verifyChain(trackingNo)
      setVerifyResult(result)
      if (result?.valid) {
        message.success('链完整性验证通过！数据未被篡改')
      } else {
        message.error('链完整性验证失败！数据可能已被篡改')
      }
    } catch (error) {
      message.error('验证失败')
    } finally {
      setVerifying(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'created': 'default',
      'picked': 'blue',
      'transit': 'blue',
      'arrived': 'cyan',
      'out_for_delivery': 'purple',
      'delivered': 'green',
      'anomaly': 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'created': '创建订单',
      'picked': '已揽收',
      'transit': '运输中',
      'arrived': '已到达',
      'out_for_delivery': '派送中',
      'delivered': '已签收',
      'anomaly': '异常'
    }
    return texts[status] || status
  }

  const truncateHash = (hash) => {
    if (!hash) return '---'
    return `${hash.slice(0, 16)}...${hash.slice(-16)}`
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            style={{ marginRight: 16 }}
          />
          溯源链 - {trackingNo}
        </h2>
        <Button type="primary" loading={verifying} onClick={handleVerify}>
          验证链完整性
        </Button>
      </div>

      {verifyResult && (
        <Result
          status={verifyResult.valid ? 'success' : 'error'}
          title={verifyResult.valid ? '链完整性验证通过' : '链完整性验证失败'}
          subTitle={verifyResult.valid 
            ? '所有节点数据完整，未检测到篡改' 
            : `检测到数据异常：${verifyResult.message || '哈希校验不匹配'}`}
          icon={verifyResult.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      <Card title="包裹信息" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={3}>
          <Descriptions.Item label="运单号">{chainData?.tracking_no || trackingNo}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={getStatusColor(chainData?.status)}>
              {getStatusText(chainData?.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="节点数">{chainData?.chain?.length || 0}</Descriptions.Item>
          <Descriptions.Item label="收件人">{chainData?.receiver_name || '---'}</Descriptions.Item>
          <Descriptions.Item label="目的地">{chainData?.destination || '---'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {chainData?.created_at ? dayjs(chainData.created_at).format('YYYY-MM-DD HH:mm') : '---'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="溯源链结构">
        {(chainData?.chain || []).map((node, index) => (
          <React.Fragment key={node.hash || index}>
            <div className="chain-node">
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={getStatusColor(node.status)} style={{ fontSize: 14, padding: '4px 12px' }}>
                      {getStatusText(node.status)}
                    </Tag>
                  </div>
                  <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>
                    节点 #{index + 1}
                  </p>
                  <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    {dayjs(node.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </Col>
                <Col xs={24} md={18}>
                  {node.location && (
                    <p style={{ marginBottom: 8 }}>
                      <strong>位置：</strong>{node.location}
                    </p>
                  )}
                  {node.operator && (
                    <p style={{ marginBottom: 8 }}>
                      <strong>操作人：</strong>{node.operator}
                    </p>
                  )}
                  {node.description && (
                    <p style={{ marginBottom: 8 }}>
                      <strong>描述：</strong>{node.description}
                    </p>
                  )}
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
                    当前哈希：
                  </p>
                  <div className={`hash-display ${verifyResult?.invalidNodes?.includes(index) ? 'hash-invalid' : 'hash-valid'}`}>
                    {verifyResult?.invalidNodes?.includes(index) 
                      ? <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                      : <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    }
                    {truncateHash(node.hash)}
                  </div>
                  
                  {index > 0 && (
                    <>
                      <p style={{ marginBottom: 4, marginTop: 12, fontSize: 12, fontWeight: 500 }}>
                        前一区块哈希：
                      </p>
                      <div className="hash-display">
                        {truncateHash(node.previous_hash)}
                      </div>
                    </>
                  )}
                  
                  {node.data_hash && (
                    <>
                      <p style={{ marginBottom: 4, marginTop: 12, fontSize: 12, fontWeight: 500 }}>
                        数据哈希：
                      </p>
                      <div className="hash-display">
                        {truncateHash(node.data_hash)}
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </div>
            {index < (chainData?.chain?.length || 0) - 1 && (
              <div className="chain-arrow">
                <DownOutlined />
              </div>
            )}
          </React.Fragment>
        ))}

        {(chainData?.chain?.length || 0) === 0 && (
          <div className="empty-state">
            暂无溯源链数据
          </div>
        )}
      </Card>

      <Card title="溯源说明" style={{ marginTop: 24 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="哈希算法">
            SHA-256
          </Descriptions.Item>
          <Descriptions.Item label="链结构">
            每个节点包含当前区块哈希、前一区块哈希和数据哈希，形成不可篡改的链式结构
          </Descriptions.Item>
          <Descriptions.Item label="验证方式">
            通过重新计算每个节点的数据哈希并与链上记录对比，确保数据完整性
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default TraceChain
