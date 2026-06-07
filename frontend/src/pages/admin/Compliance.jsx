import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Button, Modal, Form, Select, message, Space } from 'antd';
import { PlusOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { adminAPI } from '../../utils/api';

const { Title, Paragraph } = Typography;

function AdminCompliance() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genModalVisible, setGenModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getComplianceReports();
      if (res.data.success) {
        setReports(res.data.reports);
      }
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (values) => {
    try {
      await adminAPI.generateComplianceReport(values);
      message.success('报告生成成功');
      setGenModalVisible(false);
      form.resetFields();
      loadReports();
    } catch (err) {
      message.error('生成失败');
    }
  };

  const showDetail = (record) => {
    setCurrentReport(record);
    setDetailModalVisible(true);
  };

  const columns = [
    { title: '律师', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '报告期间', dataIndex: 'report_period', key: 'report_period' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = { pending: '生成中', completed: '已完成', failed: '失败' };
        const colorMap = { pending: 'processing', completed: 'success', failed: 'error' };
        return <span style={{ color: colorMap[status] === 'success' ? '#52c41a' : colorMap[status] === 'error' ? '#f5222d' : '#fa8c16' }}>{map[status] || status}</span>;
      },
    },
    { title: '生成时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>合规巡检报告</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenModalVisible(true)}>
          生成报告
        </Button>
      </div>

      <Card style={{ marginTop: 24 }}>
        <Table dataSource={reports} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="生成合规巡检报告"
        open={genModalVisible}
        onCancel={() => setGenModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleGenerate} layout="vertical">
          <Form.Item name="lawyer_id" label="选择律师" rules={[{ required: true, message: '请选择律师' }]}>
            <Select placeholder="选择律师" />
          </Form.Item>
          <Form.Item name="report_period" label="报告期间" rules={[{ required: true, message: '请选择报告期间' }]}>
            <Select placeholder="选择报告期间">
              <Select.Option value="2025-Q1">2025年第一季度</Select.Option>
              <Select.Option value="2025-Q2">2025年第二季度</Select.Option>
              <Select.Option value="2025-Q3">2025年第三季度</Select.Option>
              <Select.Option value="2025-Q4">2025年第四季度</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>生成报告</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><FileTextOutlined style={{ marginRight: 8 }} />报告详情</span>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={640}
      >
        {currentReport && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>律师：</strong>{currentReport.lawyer_name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>报告期间：</strong>{currentReport.report_period}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>状态：</strong>{currentReport.status}
            </div>
            <div>
              <strong>报告内容：</strong>
              <Card size="small" style={{ marginTop: 8, background: '#fafafa' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {currentReport.report_content || '暂无报告内容'}
                </Paragraph>
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminCompliance;
