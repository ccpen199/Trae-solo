import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography, Card, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { caseAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { TextArea } = Input;

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [form] = Form.useForm();
  const { canEdit, isManager } = useAuth();
  const navigate = useNavigate();

  const loadCases = async () => {
    setLoading(true);
    try {
      const response = await caseAPI.getAll();
      setCases(response.data.cases);
    } catch (error) {
      message.error('加载案件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreate = () => {
    setEditingCase(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCase(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除吗？',
      onOk: async () => {
        try {
          await caseAPI.delete(id);
          message.success('删除成功');
          loadCases();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCase) {
        await caseAPI.update(editingCase.id, values);
        message.success('更新成功');
      } else {
        await caseAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadCases();
    } catch (error) {
      if (error.errorFields) return;
      message.error(editingCase ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_number',
      key: 'case_number',
      width: 150,
    },
    {
      title: '案件名称',
      dataIndex: 'case_name',
      key: 'case_name',
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '进行中' : '已结束'}
        </Tag>
      ),
    },
    {
      title: '法院',
      dataIndex: 'court',
      key: 'court',
      width: 150,
    },
    {
      title: '原告',
      dataIndex: 'plaintiff',
      key: 'plaintiff',
      width: 120,
    },
    {
      title: '被告',
      dataIndex: 'defendant',
      key: 'defendant',
      width: 120,
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/cases/${record.id}`)}
          >
            查看
          </Button>
          {canEdit() && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {isManager() && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>案件列表</Title>
        {canEdit() && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建案件
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={cases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingCase ? '编辑案件' : '新建案件'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="case_number"
            label="案件编号"
            rules={[{ required: true, message: '请输入案件编号' }]}
          >
            <Input placeholder="请输入案件编号" />
          </Form.Item>
          <Form.Item
            name="case_name"
            label="案件名称"
            rules={[{ required: true, message: '请输入案件名称' }]}
          >
            <Input placeholder="请输入案件名称" />
          </Form.Item>
          <Form.Item name="case_type" label="案件类型">
            <Select placeholder="请选择案件类型">
              <Select.Option value="civil">民事案件</Select.Option>
              <Select.Option value="criminal">刑事案件</Select.Option>
              <Select.Option value="administrative">行政案件</Select.Option>
              <Select.Option value="commercial">商事案件</Select.Option>
              <Select.Option value="intellectual">知识产权案件</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Select.Option value="active">进行中</Select.Option>
              <Select.Option value="closed">已结束</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="court" label="法院">
            <Input placeholder="请输入法院名称" />
          </Form.Item>
          <Form.Item name="plaintiff" label="原告">
            <Input placeholder="请输入原告" />
          </Form.Item>
          <Form.Item name="defendant" label="被告">
            <Input placeholder="请输入被告" />
          </Form.Item>
          <Form.Item name="filing_date" label="立案日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="hearing_date" label="开庭日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="description" label="案件描述">
            <TextArea rows={4} placeholder="请输入案件描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Cases;
