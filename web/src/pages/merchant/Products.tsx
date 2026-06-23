import { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, InputNumber, Upload, message, Tag, Space, Switch } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';

export default function MerchantProducts() {
  const [list, setList] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const loadData = () => {
    api.get('/merchant/products').then((res) => setList(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (record?: any) => {
    setEditing(record || null);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setFileList([]);
    setModal(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      let images: string[] = values.images || [];
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((f) => formData.append('files', f.originFileObj));
        const uploadRes = await api.post('/upload', formData);
        images = [...images, ...uploadRes.data.urls];
      }

      if (editing) {
        await api.put(`/merchant/products/${editing.id}`, { ...values, images });
        message.success('修改成功');
      } else {
        await api.post('/merchant/products', { ...values, images });
        message.success('上架成功');
      }
      setModal(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const toggleStatus = async (record: any) => {
    try {
      await api.put(`/merchant/products/${record.id}`, { status: record.status === 'active' ? 'inactive' : 'active' });
      message.success('状态已更新');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category' },
    { title: '价格', dataIndex: 'price', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{v}</span> },
    { title: '排序', dataIndex: 'sortOrder' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string, record: any) => (
        <Switch checked={s === 'active'} checkedChildren="上架" unCheckedChildren="下架" onChange={() => toggleStatus(record)} />
      ),
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="商品管理"
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>上架新商品</Button>}
      >
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? '编辑商品' : '上架新商品'} open={modal} onCancel={() => setModal(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="商品名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Input placeholder="如：生鲜食品、家政服务、维修服务" />
          </Form.Item>
          <Form.Item label="价格(元)" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="排序权重" name="sortOrder" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="商品描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
          <Form.Item label="商品图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              multiple
              accept="image/*"
            >
              {fileList.length >= 6 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>}
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editing ? '保存修改' : '确认上架'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
