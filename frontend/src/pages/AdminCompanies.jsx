import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, Descriptions, message, Card } from 'antd';
import { ShopOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { getCompanies, auditCompany } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminCompanies = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [auditStatus, setAuditStatus] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [form] = Form.useForm();

  const statusMap = {
    pending: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已拒绝' }
  };

  const levelColors = {
    '一级资质': 'red',
    '二级资质': 'orange',
    '三级资质': 'blue'
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, auditStatus]);

  const loadData = async () => {
    setLoading(true);
    const res = await getCompanies({
      page: pagination.current,
      pageSize: pagination.pageSize,
      audit_status: auditStatus
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleAudit = async (values) => {
    const res = await auditCompany(currentCompany.id, {
      audit_status: values.audit_status,
      audit_remark: values.audit_remark
    });
    if (res.code === 200) {
      message.success('审核完成');
      setAuditVisible(false);
      setCurrentCompany(null);
      form.resetFields();
      loadData();
    }
  };

  const columns = [
    { title: '公司名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '资质等级', dataIndex: 'qualification_level', key: 'level', width: 120, render: v => v && <Tag color={levelColors[v]}>{v}</Tag> },
    { title: '统一社会信用代码', dataIndex: 'license_no', key: 'license', width: 180 },
    { title: '住建备案号', dataIndex: 'housing_approval_no', key: 'housing', width: 160 },
    { title: '联系人', dataIndex: 'legal_person', key: 'person', width: 100 },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'phone', width: 130 },
    { 
      title: '审核状态', 
      dataIndex: 'audit_status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>
    },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentCompany(record); setDetailVisible(true); }}>
            详情
          </Button>
          {record.audit_status === 'pending' && (
            <>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => { setCurrentCompany(record); form.resetFields(); setAuditVisible(true); }}>
                审核
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <ShopOutlined style={{ marginRight: 8 }} />
          装修公司资质审核
        </Title>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: 160 }}
          value={auditStatus || undefined}
          onChange={v => setAuditStatus(v || '')}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.text}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="公司详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentCompany && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{currentCompany.name}</div>
                  <Tag color={levelColors[currentCompany.qualification_level]} style={{ marginTop: 8 }}>
                    {currentCompany.qualification_level}
                  </Tag>
                  <Tag color={statusMap[currentCompany.audit_status]?.color} style={{ marginLeft: 8 }}>
                    {statusMap[currentCompany.audit_status]?.text}
                  </Tag>
                </div>
              </div>
            </Card>

            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="统一社会信用代码">{currentCompany.license_no}</Descriptions.Item>
              <Descriptions.Item label="住建备案号">{currentCompany.housing_approval_no}</Descriptions.Item>
              <Descriptions.Item label="法人代表">{currentCompany.legal_person}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentCompany.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="所在地区">{currentCompany.region}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{dayjs(currentCompany.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="公司地址" span={2}>{currentCompany.address}</Descriptions.Item>
              {currentCompany.audit_remark && (
                <Descriptions.Item label="审核备注" span={2}>{currentCompany.audit_remark}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="资质审核"
        open={auditVisible}
        onCancel={() => setAuditVisible(false)}
        footer={null}
        width={600}
      >
        {currentCompany && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ fontWeight: 500 }}>{currentCompany.name}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              资质等级: {currentCompany.qualification_level} | 住建备案号: {currentCompany.housing_approval_no}
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleAudit}>
          <Form.Item name="audit_status" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="approved"><CheckCircleOutlined style={{ color: '#52c41a' }} /> 审核通过</Select.Option>
              <Select.Option value="rejected"><CloseCircleOutlined style={{ color: '#f5222d' }} /> 审核拒绝</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="audit_remark" label="审核备注" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请输入审核意见..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setAuditVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCompanies;
