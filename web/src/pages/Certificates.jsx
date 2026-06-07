import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, Modal, Form, DatePicker, Spin, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/auth';
import { certificates as certApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;

const statusMap = {
  valid: { text: '有效', color: 'green' },
  expired: { text: '已过期', color: 'red' },
  revoked: { text: '已吊销', color: 'volcano' },
};

export default function Certificates() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [certType, setCertType] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, page_size: pagination.pageSize };
      if (keyword) params.keyword = keyword;
      if (certType) params.cert_type = certType;
      if (status) params.status = status;
      const res = await certApi.getCertificates(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
    } catch {
      message.error('获取证照列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (values.valid_until) {
        values.valid_until = values.valid_until.format('YYYY-MM-DD');
      }
      await certApi.createCertificate(values);
      message.success('添加证照成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: '证照编号', dataIndex: 'cert_no', key: 'cert_no', width: 150 },
    { title: '证照名称', dataIndex: 'cert_name', key: 'cert_name', ellipsis: true },
    { title: '持有人', dataIndex: 'holder_name', key: 'holder_name', width: 100 },
    {
      title: '证照类型',
      dataIndex: 'cert_type',
      key: 'cert_type',
      width: 100,
      render: (v) => {
        const map = { identity: '身份证', business: '营业执照', license: '许可证', other: '其他' };
        return map[v] || v || '-';
      },
    },
    { title: '发证机关', dataIndex: 'issuer', key: 'issuer', width: 120 },
    {
      title: '有效期至',
      dataIndex: 'valid_until',
      key: 'valid_until',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const st = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          {isAdmin && record.status === 'valid' && (
            <Button type="link" size="small" danger>吊销</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="请输入关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select placeholder="证照类型" value={certType} onChange={setCertType} allowClear style={{ width: '100%' }}>
              <Option value="identity">身份证</Option>
              <Option value="business">营业执照</Option>
              <Option value="license">许可证</Option>
              <Option value="other">其他</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select placeholder="状态" value={status} onChange={setStatus} allowClear style={{ width: '100%' }}>
              <Option value="valid">有效</Option>
              <Option value="expired">已过期</Option>
              <Option value="revoked">已吊销</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={8}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setCertType(undefined); setStatus(undefined); }}>重置</Button>
              {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                  添加证照
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          onChange={(pag) => setPagination({ current: pag.current, pageSize: pag.pageSize, total: pag.total })}
        />
      </Card>

      <Modal
        title="添加证照"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cert_no" label="证照编号" rules={[{ required: true, message: '请输入证照编号' }]}>
            <Input placeholder="请输入证照编号" />
          </Form.Item>
          <Form.Item name="cert_name" label="证照名称" rules={[{ required: true, message: '请输入证照名称' }]}>
            <Input placeholder="请输入证照名称" />
          </Form.Item>
          <Form.Item name="holder_name" label="持有人" rules={[{ required: true, message: '请输入持有人' }]}>
            <Input placeholder="请输入持有人" />
          </Form.Item>
          <Form.Item name="cert_type" label="证照类型" rules={[{ required: true, message: '请选择证照类型' }]}>
            <Select placeholder="请选择证照类型">
              <Option value="identity">身份证</Option>
              <Option value="business">营业执照</Option>
              <Option value="license">许可证</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="issuer" label="发证机关">
            <Input placeholder="请输入发证机关" />
          </Form.Item>
          <Form.Item name="valid_until" label="有效期至">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
