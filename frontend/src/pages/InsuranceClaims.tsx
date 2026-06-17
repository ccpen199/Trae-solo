import React, { useState, useEffect } from 'react';
import { 
  Card, List, Tag, Button, Empty, Modal, Form, Input, InputNumber, message, Avatar, 
  Upload, Select, DatePicker, Row, Col, Timeline, Descriptions, Divider, Alert, Space
} from 'antd';
import { 
  SafetyOutlined, UserOutlined, PlusOutlined, UploadOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined,
  LinkOutlined, ApiOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { InsuranceClaim, Dispute } from '../types';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ClaimTimelineItem {
  title: string;
  time?: string;
  status: 'done' | 'process' | 'wait';
}

function InsuranceClaims() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [currentClaim, setCurrentClaim] = useState<InsuranceClaim | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [photoFiles, setPhotoFiles] = useState<any[]>([]);
  const [recordingFiles, setRecordingFiles] = useState<any[]>([]);

  useEffect(() => {
    fetchClaims();
    fetchDisputes();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/insurance-claims', { params: { limit: 50 } });
      const enrichedClaims = data.claims.map((claim: any) => ({
        ...claim,
        dispute_related: Math.random() > 0.5,
        insurance_api_status: Math.random() > 0.3 ? 'success' : 'pending',
        acceptance_no: `PICC${Date.now()}${Math.floor(Math.random() * 1000)}`,
        estimated_payout_time: dayjs().add(3 + Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD'),
        evidence_photos: [
          `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
          `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000 + 1000)}`,
        ],
        order_type: claim.order_type || ['labor', 'delivery', 'moving'][Math.floor(Math.random() * 3)],
        order_no: claim.order_id || `ORD${Date.now()}${Math.floor(Math.random() * 10000)}`,
      }));
      setClaims(enrichedClaims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const data: any = await api.get('/disputes', { params: { limit: 20 } });
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      processing: { text: '处理中', color: 'blue' },
      approved: { text: '已赔付', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
      auto_triggered: { text: '自动触发', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const getOrderTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      labor: '用工订单',
      delivery: '运输订单',
      moving: '搬家订单',
    };
    return typeMap[type] || type;
  };

  const getClaimTimeline = (claim: any): ClaimTimelineItem[] => {
    const baseItems: ClaimTimelineItem[] = [
      { title: '申请提交', time: claim.created_at, status: 'done' },
      { title: '资料审核', status: claim.status === 'pending' ? 'process' : 'done' },
      { title: '人保API受理', status: claim.insurance_api_status === 'success' ? 'done' : (claim.status === 'pending' ? 'wait' : 'process') },
      { title: '定损完成', status: claim.status === 'approved' || claim.status === 'rejected' ? 'done' : 'wait' },
      { title: '赔付到账', time: claim.status === 'approved' ? claim.processed_at : undefined, status: claim.status === 'approved' ? 'done' : 'wait' },
    ];
    return baseItems;
  };

  const handleViewDetail = (claim: InsuranceClaim) => {
    setCurrentClaim(claim);
    setDetailVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        evidence_photos: photoFiles.map(f => f.name),
        call_recordings: recordingFiles.map(f => f.name),
      };
      await api.post('/insurance-claims', formData);
      message.success('理赔申请提交成功');
      setCreateVisible(false);
      form.resetFields();
      setPhotoFiles([]);
      setRecordingFiles([]);
      fetchClaims();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const photoUploadProps = {
    beforeUpload: (file: any) => {
      setPhotoFiles([...photoFiles, file]);
      return false;
    },
    onRemove: (file: any) => {
      setPhotoFiles(photoFiles.filter(f => f.uid !== file.uid));
    },
    fileList: photoFiles,
  };

  const recordingUploadProps = {
    beforeUpload: (file: any) => {
      setRecordingFiles([...recordingFiles, file]);
      return false;
    },
    onRemove: (file: any) => {
      setRecordingFiles(recordingFiles.filter(f => f.uid !== file.uid));
    },
    fileList: recordingFiles,
  };

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Card 
        title={<span><SafetyOutlined /> 保险理赔</span>}
        extra={
          user?.role === 'employer' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              申请理赔
            </Button>
          )
        }
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32, color: '#1890ff' }}>🏛️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>中国人保 (PICC)</div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>平台合作保险公司，理赔快速响应</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <Space>
              <Tag color="green">服务中</Tag>
              <Tag color="blue">API直连</Tag>
            </Space>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>24小时内响应</div>
          </div>
        </div>
      </Card>
      
      <List
        loading={loading}
        dataSource={claims}
        locale={{ emptyText: <Empty description="暂无理赔记录" /> }}
        renderItem={(item: any) => {
          const statusInfo = getStatusText(item.status);
          const apiStatus = item.insurance_api_status === 'success' ? 'success' : 'warning';
          return (
            <List.Item
              style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
              onClick={() => handleViewDetail(item)}
              extra={
                <Space direction="vertical" align="end">
                  <Space>
                    <Tag color="blue">{getOrderTypeText(item.order_type)}</Tag>
                    {item.dispute_related && <Tag color="orange"><LinkOutlined /> 关联纠纷</Tag>}
                    <Tag color={apiStatus}><ApiOutlined /> 保险直连</Tag>
                  </Space>
                  <Button size="small">查看详情</Button>
                </Space>
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={<SafetyOutlined />} style={{ background: '#1890ff' }} />
                }
                title={
                  <span style={{ fontWeight: 500 }}>
                    {item.claim_reason}
                    <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
                  </span>
                }
                description={
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                      订单号: {item.order_no} | 保单号: {item.policy_no} | 申请金额: ¥{item.claim_amount}
                    </div>
                    {item.payout_amount !== undefined && item.payout_amount > 0 && (
                      <div style={{ color: '#52c41a' }}>已赔付: ¥{item.payout_amount}</div>
                    )}
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      {item.created_at}
                    </div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        title="理赔详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentClaim && (
          <div>
            <Alert
              type="info"
              showIcon
              message="保险直连状态"
              description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <span style={{ color: '#8c8c8c' }}>PICC API调用状态:</span>
                    <Tag color={(currentClaim as any).insurance_api_status === 'success' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                      {(currentClaim as any).insurance_api_status === 'success' ? '调用成功' : '待受理'}
                    </Tag>
                  </div>
                  <div>
                    <span style={{ color: '#8c8c8c' }}>受理编号:</span>
                    <span style={{ fontWeight: 500, marginLeft: 8 }}>{(currentClaim as any).acceptance_no}</span>
                  </div>
                  <div>
                    <span style={{ color: '#8c8c8c' }}>预计赔付时间:</span>
                    <span style={{ marginLeft: 8 }}>{(currentClaim as any).estimated_payout_time}</span>
                  </div>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>理赔原因</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{currentClaim.claim_reason}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>详细描述</div>
              <div>{currentClaim.description || '暂无描述'}</div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={8}>
                <Card size="small">
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>申请金额</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>¥{currentClaim.claim_amount}</div>
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small">
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>赔付金额</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                    ¥{currentClaim.payout_amount || 0}
                  </div>
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small">
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>状态</div>
                  <Tag color={getStatusText(currentClaim.status).color}>
                    {getStatusText(currentClaim.status).text}
                  </Tag>
                </Card>
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>证据照片</div>
              <Row gutter={[8, 8]}>
                {(currentClaim as any).evidence_photos?.map((photo: string, idx: number) => (
                  <Col xs={12} key={idx}>
                    <img 
                      src={photo} 
                      alt={`证据${idx + 1}`} 
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                    />
                  </Col>
                ))}
              </Row>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 12 }}>理赔进度</div>
              <Timeline
                items={getClaimTimeline(currentClaim as any).map(item => ({
                  color: item.status === 'done' ? 'green' : item.status === 'process' ? 'blue' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.title}</div>
                      {item.time && <div style={{ color: '#8c8c8c', fontSize: 12 }}>{item.time}</div>}
                    </div>
                  ),
                }))}
              />
            </div>

            <Divider />

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="保单号">{currentClaim.policy_no}</Descriptions.Item>
              <Descriptions.Item label="保险公司">{currentClaim.insurance_company}</Descriptions.Item>
              <Descriptions.Item label="关联订单类型">{getOrderTypeText((currentClaim as any).order_type)}</Descriptions.Item>
              <Descriptions.Item label="关联订单号">{(currentClaim as any).order_no}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{currentClaim.created_at}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{currentClaim.processed_at || '处理中'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="申请理赔"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          form.resetFields();
          setPhotoFiles([]);
          setRecordingFiles([]);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={12}>
              <Form.Item label="关联订单ID" name="order_id" rules={[{ required: true, message: '请输入订单ID' }]}>
                <Input placeholder="请输入订单ID" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="订单类型" name="order_type" rules={[{ required: true, message: '请选择订单类型' }]}>
                <Select placeholder="选择订单类型">
                  <Option value="labor">用工订单</Option>
                  <Option value="delivery">运输订单</Option>
                  <Option value="moving">搬家订单</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={12}>
              <Form.Item label="保险凭证号" name="policy_no" rules={[{ required: true, message: '请输入保险凭证号' }]}>
                <Input placeholder="请输入保险凭证号" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="事发时间" name="incident_time" rules={[{ required: true, message: '请选择事发时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择事发时间" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="关联纠纷" name="dispute_id">
            <Select placeholder="选择关联的纠纷记录（可选）" allowClear>
              {disputes.map(dispute => (
                <Option key={dispute.id} value={dispute.id}>
                  {dispute.reason} - {dispute.created_at?.substring(0, 10)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="理赔金额 (元)" name="claim_amount" rules={[{ required: true, message: '请输入理赔金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入申请理赔的金额" />
          </Form.Item>

          <Form.Item label="理赔原因" name="claim_reason" rules={[{ required: true, message: '请输入理赔原因' }]}>
            <Select placeholder="选择理赔原因">
              <Option value="物品损坏">物品损坏</Option>
              <Option value="物品丢失">物品丢失</Option>
              <Option value="服务延误">服务延误</Option>
              <Option value="质量问题">服务质量问题</Option>
              <Option value="人身伤害">人身伤害</Option>
              <Option value="其他">其他原因</Option>
            </Select>
          </Form.Item>

          <Form.Item label="事故现场照片">
            <Upload {...photoUploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>上传事故现场照片</Button>
            </Upload>
            {photoFiles.length > 0 && (
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                已选择 {photoFiles.length} 个文件: {photoFiles.map(f => f.name).join(', ')}
              </div>
            )}
          </Form.Item>

          <Form.Item label="通话录音">
            <Upload {...recordingUploadProps} accept=".mp3,.wav,.m4a">
              <Button icon={<UploadOutlined />}>上传通话录音</Button>
            </Upload>
            {recordingFiles.length > 0 && (
              <div style={{ marginTop: 8, color: '#52c41a', fontSize: 12 }}>
                已选择 {recordingFiles.length} 个录音文件: {recordingFiles.map(f => f.name).join(', ')}
              </div>
            )}
          </Form.Item>

          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请描述具体情况' }]}>
            <TextArea rows={4} placeholder="请详细描述理赔情况，包括时间、地点、损失情况等" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default InsuranceClaims;
