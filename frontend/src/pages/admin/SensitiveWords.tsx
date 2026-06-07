import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Tag, message, Modal, Form, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { Option } = Select;

const AdminSensitiveWords: React.FC = () => {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSensitiveWords();
      setWords(res.data.words);
    } catch (error) {
      message.error('加载敏感词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values: any) => {
    try {
      await adminAPI.addSensitiveWord(values);
      message.success('添加成功');
      setAddModal(false);
      form.resetFields();
      loadWords();
    } catch (error: any) {
      message.error(error.response?.data?.error || '添加失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminAPI.deleteSensitiveWord(id);
      message.success('删除成功');
      loadWords();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '敏感词', dataIndex: 'word', key: 'word' },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (v: number) => (
        <Tag color={v >= 2 ? 'red' : 'orange'}>
          {v >= 2 ? '高危' : '一般'}
        </Tag>
      ),
    },
    { title: '添加时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="敏感词管理"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
            添加敏感词
          </Button>
        }
      >
        <Table
          loading={loading}
          dataSource={words}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="添加敏感词"
        open={addModal}
        onCancel={() => setAddModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="word" label="敏感词" rules={[{ required: true }]}>
            <Input placeholder="请输入敏感词" />
          </Form.Item>
          <Form.Item name="level" label="级别" rules={[{ required: true }]}>
            <Select defaultValue={1}>
              <Option value={1}>一般</Option>
              <Option value={2}>高危</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminSensitiveWords;
