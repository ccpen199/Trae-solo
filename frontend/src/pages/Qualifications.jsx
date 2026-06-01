import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Form, Button, message, Tag, Modal, Input, DatePicker } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { qualificationsApi } from '../utils/api';
import dayjs from 'dayjs';

function Qualifications() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    type: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await qualificationsApi.getList(filters);
      setData(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await qualificationsApi.update(editingRecord.id, {
          ...values,
          issue_date: values.issue_date?.format('YYYY-MM-DD'),
          expiry_date: values.expiry_date?.format('YYYY-MM-DD')
        });
        message.success('更新成功');
      } else {
        await qualificationsApi.create({
          ...values,
          issue_date: values.issue_date?.format('YYYY-MM-DD'),
          expiry_date: values.expiry_date?.format('YYYY-MM-DD')
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const isExpired = (expiryDate) => {
    return dayjs(expiryDate).isBefore(dayjs());
  };

  const columns = [
    { title: '资质名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 120,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    { title: '等级', dataIndex: 'level', width: 100 },
    { title: '证书编号', dataIndex: 'certificate_no', width: 150 },
    { title: '发证机关', dataIndex: 'issuing_authority', width: 150 },
    { title: '发证日期', dataIndex: 'issue_date', width: 120,
      render: (v) => dayjs(v).format('YYYY-MM-DD')
    },
    { title: '有效期至', dataIndex: 'expiry_date', width: 120,
      render: (v) => {
        const expired = isExpired(v);
        return (
          <span style={{ color: expired ? '#ff4d4f' : undefined }}>
            {dayjs(v).format('YYYY-MM-DD')}
            {expired && <Tag color="red" style={{ marginLeft: 8 }}>已过期</Tag>}
          </span>
        );
      }
    },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'valid' ? 'green' : 'red'}>
          {v === 'valid' ? '有效' : '已过期'}
        </Tag>
      )
    },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    { title: '操作', width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
      )
    }
  ];

  const typeOptions = [
    { value: '施工资质', label: '施工资质' },
    { value: '体系认证', label: '体系认证' },
    { value: '企业资质', label: '企业资质' },
    { value: '安全资质', label: '安全资质' },
    { value: '人员资质', label: '人员资质' }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">资质管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增资质
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="类型">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, type: v, page: 1 })}
            >
              {typeOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
            >
              <Select.Option value="valid">有效</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>搜索</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize })
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑资质' : '新增资质'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingRecord ? {
            ...editingRecord,
            issue_date: editingRecord.issue_date ? dayjs(editingRecord.issue_date) : null,
            expiry_date: editingRecord.expiry_date ? dayjs(editingRecord.expiry_date) : null
          } : {}}
        >
          <Form.Item label="资质名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入资质名称" />
          </Form.Item>
          <Form.Item label="资质类型" name="type" rules={[{ required: true }]}>
            <Select placeholder="请选择资质类型">
              {typeOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="等级" name="level">
            <Input placeholder="请输入等级" />
          </Form.Item>
          <Form.Item label="证书编号" name="certificate_no">
            <Input placeholder="请输入证书编号" />
          </Form.Item>
          <Form.Item label="发证机关" name="issuing_authority">
            <Input placeholder="请输入发证机关" />
          </Form.Item>
          <Form.Item label="发证日期" name="issue_date">
            <DatePicker style={{ width: '100%' }} placeholder="请选择发证日期" />
          </Form.Item>
          <Form.Item label="有效期至" name="expiry_date">
            <DatePicker style={{ width: '100%' }} placeholder="请选择有效期至" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select placeholder="请选择状态">
              <Select.Option value="valid">有效</Select.Option>
              <Select.Option value="expired">已过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingRecord ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Qualifications;
