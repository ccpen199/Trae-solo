import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Table, Row, Col, Statistic, Divider, Empty, Upload, Modal, Form, Input, Select, message, List, Timeline } from 'antd';
import { ArrowLeftOutlined, FileProtectOutlined, UploadOutlined, ClockCircleOutlined, DollarCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { enforcementApi } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const EnforcementCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [statusForm] = Form.useForm();
  const [attachmentForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await enforcementApi.detail(Number(id));
      setCaseData(res.data);
    } catch (error) {
      console.error('加载案件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const values = await statusForm.validateFields();
      await enforcementApi.updateStatus(Number(id), values);
      message.success('状态更新成功');
      setStatusModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleAddAttachment = async () => {
    try {
      const values = await attachmentForm.validateFields();
      await enforcementApi.addAttachment(Number(id), values);
      message.success('附件添加成功');
      setAttachmentModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const caseTypeMap: Record<string, string> = {
    takedown: '下架维权',
    compensation: '赔偿诉讼',
    administrative: '行政投诉',
    criminal: '刑事报案',
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待处理' },
    investigating: { color: 'processing', text: '调查中' },
    negotiating: { color: 'processing', text: '协商中' },
    litigating: { color: 'processing', text: '诉讼中' },
    settled: { color: 'success', text: '已和解' },
    won: { color: 'success', text: '胜诉' },
    lost: { color: 'error', text: '败诉' },
    closed: { color: 'default', text: '已结案' },
  };

  const attachmentTypeMap: Record<string, string> = {
    evidence: '证据材料',
    legal: '法律文书',
    correspondence: '往来函件',
    other: '其他',
  };

  const activityColumns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 120,
      render: (type: string) => {
        const actionMap: Record<string, string> = {
          status_change: '状态变更',
          note_added: '添加备注',
          attachment_added: '添加附件',
          case_created: '案件创建',
        };
        return actionMap[type] || type;
      },
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'username'],
      key: 'operator',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '详情',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  if (!caseData && !loading) {
    return <Empty description="案件不存在" />;
  }

  const statusCfg = statusMap[caseData?.status] || { color: 'default', text: caseData?.status };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/enforcement')} style={{ padding: 0 }}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ marginTop: 8 }}>案件详情</h1>
          <p className="page-description">案件编号: {caseData?.case_no}</p>
        </div>
        <Space>
          <Tag color={statusCfg.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {statusCfg.text}
          </Tag>
          <Button onClick={() => setStatusModalVisible(true)}>更新状态</Button>
          <Button type="primary" onClick={() => setAttachmentModalVisible(true)}>添加附件</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="案件信息" size="small" loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="案件编号">{caseData?.case_no}</Descriptions.Item>
              <Descriptions.Item label="案件类型">{caseTypeMap[caseData?.case_type] || caseData?.case_type}</Descriptions.Item>
              <Descriptions.Item label="相关线索">
                {caseData?.piracy_clue ? (
                  <Button type="link" onClick={() => navigate(`/piracy/${caseData.piracy_clue.id}`)}>
                    {caseData.piracy_clue.clue_no}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="相关课程">
                {caseData?.piracy_clue?.course ? (
                  <Button type="link" onClick={() => navigate(`/courses/${caseData.piracy_clue.course.id}`)}>
                    {caseData.piracy_clue.course.name}
                  </Button>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="侵权平台">{caseData?.piracy_clue?.infringing_platform || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {caseData?.created_at ? dayjs(caseData.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="索赔金额">
                {caseData?.claimed_amount ? `¥${caseData.claimed_amount.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际赔偿">
                {caseData?.compensation_amount ? `¥${caseData.compensation_amount.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="案件描述" span={2}>
                {caseData?.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="案件附件" size="small" style={{ marginTop: 16 }} loading={loading}>
            <List
              dataSource={caseData?.attachments || []}
              renderItem={(item: any) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button type="link" size="small" href={item.file_url} target="_blank">
                      下载
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<PaperClipOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                    title={item.name}
                    description={
                      <Space>
                        <Tag>{attachmentTypeMap[item.type] || item.type}</Tag>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          上传时间: {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无附件' }}
            />
          </Card>

          <Card title="操作记录" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Table
              dataSource={caseData?.activity_logs || []}
              columns={activityColumns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无操作记录' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="案件周期"
                  value={caseData?.case_days || 0}
                  suffix="天"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="附件数量"
                  value={caseData?.attachments?.length || 0}
                  prefix={<PaperClipOutlined />}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="索赔金额"
                  value={caseData?.claimed_amount || 0}
                  prefix={<DollarCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已获赔偿"
                  value={caseData?.compensation_amount || 0}
                  prefix={<DollarCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="案件进度" size="small" style={{ marginTop: 16 }} loading={loading}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>案件立案</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {caseData?.created_at ? dayjs(caseData.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['investigating', 'negotiating', 'litigating', 'settled', 'won', 'lost', 'closed'].includes(caseData?.status) ? 'blue' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>调查取证</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {caseData?.investigated_at ? dayjs(caseData.investigated_at).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['negotiating', 'litigating', 'settled', 'won', 'lost', 'closed'].includes(caseData?.status) ? 'orange' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>协商/诉讼</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {caseData?.negotiated_at ? dayjs(caseData.negotiated_at).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </p>
                    </div>
                  ),
                },
                {
                  color: ['settled', 'won', 'lost', 'closed'].includes(caseData?.status) ? 'purple' : 'gray',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>案件结案</p>
                      <p style={{ margin: 0, color: '#8c8c8c', fontSize: 12 }}>
                        {caseData?.closed_at ? dayjs(caseData.closed_at).format('YYYY-MM-DD HH:mm') : '待处理'}
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          {caseData?.lawyer && (
            <Card title="代理律师" size="small" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{caseData.lawyer.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="律所">{caseData.lawyer.firm || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系方式">{caseData.lawyer.contact || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="更新案件状态"
        open={statusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setStatusModalVisible(false)}
        width={500}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label="案件状态" rules={[{ required: true }]}>
            <Select placeholder="请选择状态">
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="compensation_amount" label="赔偿金额(元)">
            <Input type="number" min={0} placeholder="如有赔偿请填写金额" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="状态变更备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加附件"
        open={attachmentModalVisible}
        onOk={handleAddAttachment}
        onCancel={() => setAttachmentModalVisible(false)}
        width={500}
      >
        <Form form={attachmentForm} layout="vertical">
          <Form.Item name="name" label="附件名称" rules={[{ required: true }]}>
            <Input placeholder="请输入附件名称" />
          </Form.Item>
          <Form.Item name="type" label="附件类型" rules={[{ required: true }]}>
            <Select placeholder="请选择附件类型">
              {Object.entries(attachmentTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="file_url" label="文件地址" rules={[{ required: true }]}>
            <Input placeholder="请输入文件访问地址" />
          </Form.Item>
          <Form.Item label="上传文件">
            <Upload beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="附件描述说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnforcementCaseDetail;
