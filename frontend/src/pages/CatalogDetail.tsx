import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Tag, List, message, Space, Modal, Form, Input, Select } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { catalogsAPI } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const CatalogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadCatalog();
    }
  }, [id]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await catalogsAPI.getById(parseInt(id!));
      setCatalog(res.data);
    } catch (error) {
      message.error('加载目录详情失败');
    }
    setLoading(false);
  };

  const handleUpdate = async (values: any) => {
    try {
      await catalogsAPI.update(parseInt(id!), {
        ...catalog,
        ...values,
        fields: catalog?.fields || [],
        change_log: values.change_log || '更新目录信息'
      });
      message.success('更新成功');
      setEditModalVisible(false);
      loadCatalog();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const fieldColumns = [
    { title: '字段名', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '脱敏规则',
      dataIndex: 'desensitization_rule',
      key: 'desensitization_rule',
      render: (rule: string) => rule ? <Tag color="blue">{rule}</Tag> : <Tag>无</Tag>
    },
    {
      title: '必填',
      dataIndex: 'is_required',
      key: 'is_required',
      render: (required: number) => required ? <Tag color="red">是</Tag> : <Tag>否</Tag>
    }
  ];

  const shareLevelLabels: Record<string, string> = { public: '公开', conditional: '有条件共享', restricted: '受限' };
  const shareLevelColors: Record<string, string> = { public: 'green', conditional: 'orange', restricted: 'red' };

  if (!catalog) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalogs')}>返回</Button>
          <h2 style={{ margin: 0 }}>数据目录详情</h2>
        </Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => {
          form.setFieldsValue(catalog);
          setEditModalVisible(true);
        }}>编辑</Button>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }} loading={loading}>
        <Descriptions column={2}>
          <Descriptions.Item label="ID">{catalog.id}</Descriptions.Item>
          <Descriptions.Item label="版本">v{catalog.version}</Descriptions.Item>
          <Descriptions.Item label="数据标题" span={2}>{catalog.title}</Descriptions.Item>
          <Descriptions.Item label="数据主题">{catalog.topic}</Descriptions.Item>
          <Descriptions.Item label="责任部门">{catalog.department_name}</Descriptions.Item>
          <Descriptions.Item label="更新频率">{catalog.update_frequency}</Descriptions.Item>
          <Descriptions.Item label="共享级别">
            <Tag color={shareLevelColors[catalog.share_level]}>{shareLevelLabels[catalog.share_level]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{catalog.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{catalog.created_at}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{catalog.updated_at}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="字段定义" style={{ marginBottom: 16 }}>
        <Table
          columns={fieldColumns}
          dataSource={catalog.fields}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="版本历史">
        <List
          dataSource={catalog.versions}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={`v${item.version} - ${item.title}`}
                description={
                  <div>
                    <div>主题: {item.topic} | 共享级别: {shareLevelLabels[item.share_level]}</div>
                    <div style={{ color: '#666' }}>变更说明: {item.change_log}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{item.created_at}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="编辑数据目录"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
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
          <Form.Item name="change_log" label="变更说明">
            <TextArea rows={2} placeholder="请输入本次变更说明" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>更新</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CatalogDetail;
