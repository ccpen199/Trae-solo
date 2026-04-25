import React, { useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Card,
  Tabs,
  Popconfirm,
  message,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LinkOutlined,
  CloudOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import type { NewsSource } from '../types';

const { Text } = Typography;
const { Option } = Select;

const SourcesManagement: React.FC = () => {
  const {
    newsSources,
    toggleSourceStatus,
    addSource,
    updateSource,
    deleteSource
  } = useAppStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();
  
  const sourceTypeIcons = {
    news: <GlobalOutlined />,
    rss: <LinkOutlined />,
    weather: <CloudOutlined />
  };
  
  const sourceTypeText = {
    news: '新闻源',
    rss: 'RSS源',
    weather: '天气源'
  };
  
  const filteredSources = activeTab === 'all'
    ? newsSources
    : newsSources.filter(s => s.type === activeTab);
  
  const handleAdd = () => {
    setEditingSource(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEdit = (source: NewsSource) => {
    setEditingSource(source);
    form.setFieldsValue({
      name: source.name,
      type: source.type,
      url: source.url,
      status: source.status === 'active',
      description: source.description
    });
    setModalVisible(true);
  };
  
  const handleDelete = (id: string) => {
    deleteSource(id);
    message.success('删除成功');
  };
  
  const handleSync = () => {
    message.loading({ content: '正在同步...', key: 'sync' });
    setTimeout(() => {
      message.success({ content: '同步完成', key: 'sync' });
    }, 1500);
  };
  
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const status: 'active' | 'inactive' = values.status ? 'active' : 'inactive';
      const sourceData = {
        name: values.name,
        type: values.type,
        url: values.url,
        status,
        description: values.description,
        newsCount: editingSource?.newsCount || 0,
        syncInterval: editingSource?.syncInterval || '30分钟'
      };
      
      if (editingSource) {
        updateSource(editingSource.id, sourceData);
        message.success('更新成功');
      } else {
        addSource(sourceData);
        message.success('添加成功');
      }
      
      setModalVisible(false);
    });
  };
  
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: NewsSource) => (
        <Space>
          {sourceTypeIcons[record.type]}
          <Text strong>{text}</Text>
          <Tag color={record.type === 'news' ? 'blue' : record.type === 'rss' ? 'orange' : 'green'}>
            {sourceTypeText[record.type]}
          </Tag>
        </Space>
      )
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      width: 300
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: NewsSource['status'], record: NewsSource) => (
        <Space>
          <Tag color={status === 'active' ? 'green' : 'red'}>
            {status === 'active' ? '启用中' : '已停用'}
          </Tag>
          <Switch
            checked={status === 'active'}
            onChange={() => toggleSourceStatus(record.id)}
            size="small"
          />
        </Space>
      )
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: NewsSource) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个来源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  const tabItems = [
    { key: 'all', label: '全部来源', count: newsSources.length },
    { key: 'news', label: '新闻源', count: newsSources.filter(s => s.type === 'news').length },
    { key: 'rss', label: 'RSS源', count: newsSources.filter(s => s.type === 'rss').length },
    { key: 'weather', label: '天气源', count: newsSources.filter(s => s.type === 'weather').length }
  ];
  
  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems.map(item => ({
              key: item.key,
              label: (
                <span>
                  {item.label}
                  <Tag style={{ marginLeft: 8 }}>{item.count}</Tag>
                </span>
              )
            }))}
          />
          <Space>
            <Button
              type="default"
              icon={<SyncOutlined />}
              onClick={handleSync}
            >
              同步全部
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加来源
            </Button>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredSources}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>
      
      <Modal
        title={editingSource ? '编辑来源' : '添加来源'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="来源名称"
            rules={[{ required: true, message: '请输入来源名称' }]}
          >
            <Input placeholder="请输入来源名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="来源类型"
            rules={[{ required: true, message: '请选择来源类型' }]}
          >
            <Select placeholder="请选择来源类型">
              <Option value="news">
                <Space>
                  <GlobalOutlined />
                  新闻源
                </Space>
              </Option>
              <Option value="rss">
                <Space>
                  <LinkOutlined />
                  RSS源
                </Space>
              </Option>
              <Option value="weather">
                <Space>
                  <CloudOutlined />
                  天气源
                </Space>
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="url"
            label="URL地址"
            rules={[
              { required: true, message: '请输入URL地址' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input placeholder="请输入URL地址" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入来源描述"
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SourcesManagement;
