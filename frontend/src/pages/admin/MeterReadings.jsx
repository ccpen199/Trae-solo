import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Descriptions, Image, Drawer, Row, Col } from 'antd';
import { SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined, CameraOutlined, DesktopOutlined, EditOutlined } from '@ant-design/icons';
import { adminAPI, meterReadingAPI } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;

const AdminMeterReadings = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentReading, setCurrentReading] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectForm] = Form.useForm();
  const [filters, setFilters] = useState({ status: 'all', source: 'all' });

  useEffect(() => {
    loadReadings();
  }, [filters]);

  const loadReadings = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllMeterReadings(filters);
      setReadings(res.data || []);
    } catch (err) {
      message.error('加载抄表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id) => {
    Modal.confirm({
      title: '确认审核通过',
      content: '审核通过后，该读数将用于账单计算。',
      onOk: async () => {
        try {
          await adminAPI.approveMeterReading(id);
          message.success('审核通过');
          loadReadings();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleReject = async (values) => {
    try {
      await adminAPI.rejectMeterReading(currentReading.id, values);
      message.success('已驳回');
      setRejectVisible(false);
      rejectForm.resetFields();
      loadReadings();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await meterReadingAPI.getMeterReadingDetail(id);
      setCurrentReading(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取详情失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
      auto: { color: 'blue', text: '系统自动' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getSourceTag = (source) => {
    const sourceMap = {
      ocr: { color: 'purple', text: 'OCR识别', icon: <CameraOutlined /> },
      manual: { color: 'cyan', text: '人工补录', icon: <EditOutlined /> },
      system: { color: 'default', text: '系统抄表', icon: <DesktopOutlined /> },
    };
    const info = sourceMap[source] || { color: 'default', text: source };
    return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '记录编号',
      dataIndex: 'id',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>#{v}</span>,
      width: 100,
    },
    {
      title: '表具编号',
      dataIndex: 'meter_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
    },
    {
      title: '读数',
      dataIndex: 'reading_value',
      render: (v, record) => (
        <div>
          <strong style={{ fontSize: 16, fontFamily: 'monospace' }}>{v}</strong>
          <span style={{ color: '#999', marginLeft: 4 }}>m³</span>
          {record.confidence && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              置信度 {(record.confidence * 100).toFixed(0)}%
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      render: (v) => getSourceTag(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => getStatusTag(v),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => { setCurrentReading(record); setRejectVisible(true); }}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>抄表审核</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          审核用户提交的燃气表读数，确保数据准确
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.source}
              onChange={(v) => setFilters({ ...filters, source: v })}
            >
              <Option value="all">全部来源</Option>
              <Option value="ocr">OCR识别</Option>
              <Option value="manual">人工补录</Option>
              <Option value="system">系统抄表</Option>
            </Select>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadReadings}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={readings}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Drawer
        title="抄表记录详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentReading && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="记录编号">#{currentReading.id}</Descriptions.Item>
              <Descriptions.Item label="表具编号">
                <span style={{ fontFamily: 'monospace' }}>{currentReading.meter_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="用户">{currentReading.user_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentReading.user_phone}</Descriptions.Item>
              <Descriptions.Item label="读数">
                <strong style={{ fontSize: 20 }}>{currentReading.reading_value}</strong> m³
              </Descriptions.Item>
              <Descriptions.Item label="上次读数">
                {currentReading.previous_reading} m³
              </Descriptions.Item>
              <Descriptions.Item label="本期用量">
                <Tag color="red">{currentReading.usage} m³</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                {currentReading.confidence ? `${(currentReading.confidence * 100).toFixed(1)}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{getSourceTag(currentReading.source)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentReading.status)}</Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>
                {dayjs(currentReading.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {currentReading.reject_reason && (
                <Descriptions.Item label="驳回原因" span={2}>
                  {currentReading.reject_reason}
                </Descriptions.Item>
              )}
              {currentReading.auditor_name && (
                <>
                  <Descriptions.Item label="审核人">{currentReading.auditor_name}</Descriptions.Item>
                  <Descriptions.Item label="审核时间">
                    {dayjs(currentReading.audited_at).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {currentReading.ocr_digits && (
              <Card title="OCR识别结果" size="small" style={{ marginBottom: 16 }}>
                <div className="ocr-digits" style={{ display: 'flex', gap: 8 }}>
                  {currentReading.ocr_digits.map((digit, idx) => (
                    <div
                      key={idx}
                      className="ocr-digit"
                      style={{
                        width: 40,
                        height: 56,
                        border: '2px solid #d9d9d9',
                        borderRadius: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: digit.confidence > 0.9 ? '#f6ffed' : digit.confidence > 0.7 ? '#fffbe6' : '#fff1f0',
                        borderColor: digit.confidence > 0.9 ? '#52c41a' : digit.confidence > 0.7 ? '#faad14' : '#f5222d',
                      }}
                    >
                      <span style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' }}>{digit.value}</span>
                      <span style={{ fontSize: 10, color: '#999' }}>{(digit.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {currentReading.photo_url && (
              <Card title="表具照片" size="small">
                <Image
                  width="100%"
                  src={currentReading.photo_url}
                  alt="表具照片"
                />
              </Card>
            )}

            {currentReading.status === 'pending' && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setDetailVisible(false)}>取消</Button>
                  <Button type="primary" icon={<CheckOutlined />} onClick={() => { setDetailVisible(false); handleApprove(currentReading.id); }}>
                    审核通过
                  </Button>
                  <Button danger icon={<CloseOutlined />} onClick={() => { setDetailVisible(false); setRejectVisible(true); }}>
                    驳回
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="驳回抄表记录"
        open={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        footer={null}
        width={500}
      >
        {currentReading && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="表具编号">{currentReading.meter_no}</Descriptions.Item>
                <Descriptions.Item label="读数">{currentReading.reading_value} m³</Descriptions.Item>
                <Descriptions.Item label="用户">{currentReading.user_name}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
              <Form.Item
                name="reject_reason"
                label="驳回原因"
                rules={[{ required: true, message: '请输入驳回原因' }]}
              >
                <Input.TextArea rows={4} placeholder="请详细说明驳回原因，用户将收到该通知" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ float: 'right' }}>
                  <Button onClick={() => setRejectVisible(false)}>取消</Button>
                  <Button danger htmlType="submit">确认驳回</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminMeterReadings;
