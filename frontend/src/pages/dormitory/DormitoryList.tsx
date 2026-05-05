import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { dormitoryApi } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface Dormitory {
  id: number;
  building_code: string;
  building_name: string;
  description: string;
  gender_type: string;
  total_rooms: number;
  total_beds: number;
  actual_rooms: number;
  actual_beds: number;
  occupied_beds: number;
  available_beds: number;
  status: string;
}

const DormitoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Dormitory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Dormitory | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await dormitoryApi.getAll();
      setData(response.data.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Dormitory) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await dormitoryApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await dormitoryApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await dormitoryApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getGenderTag = (gender: string) => {
    const colorMap: Record<string, string> = {
      male: 'blue',
      female: 'pink',
      mixed: 'green',
    };
    const textMap: Record<string, string> = {
      male: '男生',
      female: '女生',
      mixed: '混合',
    };
    return <Tag color={colorMap[gender] || 'default'}>{textMap[gender] || gender}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'green',
      inactive: 'red',
    };
    const textMap: Record<string, string> = {
      active: '正常',
      inactive: '停用',
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '楼栋编号',
      dataIndex: 'building_code',
      key: 'building_code',
      width: 100,
    },
    {
      title: '楼栋名称',
      dataIndex: 'building_name',
      key: 'building_name',
      width: 150,
    },
    {
      title: '性别类型',
      dataIndex: 'gender_type',
      key: 'gender_type',
      width: 100,
      render: (gender: string) => getGenderTag(gender),
    },
    {
      title: '房间数',
      dataIndex: 'actual_rooms',
      key: 'actual_rooms',
      width: 80,
      render: (val: number, record: Dormitory) => (
        <span>{val || 0} / {record.total_rooms}</span>
      ),
    },
    {
      title: '床位总数',
      dataIndex: 'actual_beds',
      key: 'actual_beds',
      width: 100,
      render: (val: number, record: Dormitory) => (
        <span>{val || 0} / {record.total_beds}</span>
      ),
    },
    {
      title: '已入住',
      dataIndex: 'occupied_beds',
      key: 'occupied_beds',
      width: 100,
      render: (val: number) => (
        <Tag color="orange">{val || 0}</Tag>
      ),
    },
    {
      title: '空床位',
      dataIndex: 'available_beds',
      key: 'available_beds',
      width: 100,
      render: (val: number) => (
        <Tag color="green">{val || 0}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Dormitory) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个宿舍楼吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="宿舍楼列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增宿舍楼
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑宿舍楼' : '新增宿舍楼'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="building_code"
            label="楼栋编号"
            rules={[{ required: true, message: '请输入楼栋编号' }]}
          >
            <Input placeholder="例如：A、B、C" />
          </Form.Item>

          <Form.Item
            name="building_name"
            label="楼栋名称"
            rules={[{ required: true, message: '请输入楼栋名称' }]}
          >
            <Input placeholder="例如：A栋宿舍楼" />
          </Form.Item>

          <Form.Item
            name="gender_type"
            label="性别类型"
            rules={[{ required: true, message: '请选择性别类型' }]}
          >
            <Select placeholder="请选择性别类型">
              <Option value="male">男生宿舍</Option>
              <Option value="female">女生宿舍</Option>
              <Option value="mixed">混合宿舍</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="total_rooms"
            label="总房间数"
          >
            <Input type="number" placeholder="请输入总房间数" />
          </Form.Item>

          <Form.Item
            name="total_beds"
            label="总床位数"
          >
            <Input type="number" placeholder="请输入总床位数" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入描述信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DormitoryList;