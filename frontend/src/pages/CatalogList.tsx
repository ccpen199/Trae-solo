import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { catalogsAPI, departmentsAPI } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const CatalogList: React.FC = () => {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadCatalogs();
    loadDepartments();
  }, []);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const res = await catalogsAPI.getAll();
      setCatalogs(res.data);
    } catch (error) {
      message.error('加载数据目录失败');
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const res = await departmentsAPI.getAll();
      setDepartments(res.data);
    } catch (error) {
      console.error('加载部门失败', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await catalogsAPI.create({
        ...values,
        fields: [
          { name: '示例字段1', type: 'string', description: '示例字段描述', desensitization_rule: null, is_required: true }
        ]
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadCatalogs();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '数据标题', dataIndex: 'title', key: 'title' },
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    { title: '责任部门', dataIndex: 'department_name', key: 'department_name' },
    { title: '更新频率', dataIndex: 'update_frequency', key: 'update_frequency' },
    {
      title: '共享级别',
      dataIndex: 'share_level',
      key: 'share_level',
      render: (level: string) => {
        const colors: Record<string, string> = { public: 'green', conditional: 'orange', restricted: 'red' };
        const labels: Record<string, string> = { public: '公开', conditional: '有条件', restricted: '受限' };
        return <Tag color={colors[level]}>{labels[level]}</Tag>;
      }
    },
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/catalogs/${record.id}`)}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>数据目录管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建目录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={catalogs}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建数据目录"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="数据标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="topic" label="数据主题" rules={[{ required: true }]}>
            <Select>
              <Option value="人口户籍">人口户籍</Option>
              <Option value="社会保障">社会保障</Option>
              <Option value="医疗卫生">医疗卫生</Option>
              <Option value="教育科技">教育科技</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="department_id" label="责任部门" rules={[{ required: true }]}>
            <Select>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="update_frequency" label="更新频率" rules={[{ required: true }]}>
            <Select>
              <Option value="realtime">实时</Option>
              <Option value="daily">每日</Option>
              <Option value="weekly">每周</Option>
              <Option value="monthly">每月</Option>
            </Select>
          </Form.Item>
          <Form.Item name="share_level" label="共享级别" rules={[{ required: true }]}>
            <Select>
              <Option value="public">公开</Option>
              <Option value="conditional">有条件共享</Option>
              <Option value="restricted">受限</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CatalogList;
