import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Switch,
  Upload,
  Card,
  Statistic,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  AlertOutlined,
  WarningOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { SensitiveWord, SensitiveWordCategory } from '../../types';
import { admin } from '../../api/endpoints';
import { setSensitiveWords, getCategoryLabel, getRiskLevelLabel } from '../../utils/sensitive.tsx';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const categoryOptions: { value: SensitiveWordCategory; label: string }[] = [
  { value: 'salary_promise', label: '薪资承诺' },
  { value: 'overtime_culture', label: '加班文化' },
  { value: 'false_publicity', label: '虚假宣传' },
  { value: 'other', label: '其他' },
];

const riskLevelOptions = [
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
];

const SensitiveWordManage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SensitiveWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [riskLevel, setRiskLevel] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SensitiveWord | null>(null);
  const [form] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);

  const stats = {
    todayDetected: 156,
    highRisk: 23,
    mediumRisk: 67,
    lowRisk: 66,
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (riskLevel) params.riskLevel = riskLevel;

      const response = await admin.sensitiveWords(params);
      setData(response.data.list);
      setTotal(response.data.total);
      setSensitiveWords(response.data.list);
    } catch (error) {
      console.error('Failed to fetch sensitive words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalVisible(true);
  };

  const handleEdit = (item: SensitiveWord) => {
    setEditingItem(item);
    form.setFieldsValue({
      word: item.word,
      category: item.category,
      riskLevel: item.riskLevel,
      replacement: item.replacement,
      enabled: item.enabled,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await admin.deleteSensitiveWord(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggleEnabled = async (item: SensitiveWord, enabled: boolean) => {
    try {
      await admin.updateSensitiveWord(item.id, { ...item, enabled });
      setData(prev => prev.map(d =>
        d.id === item.id ? { ...d, enabled } : d
      ));
      message.success(enabled ? '已启用' : '已禁用');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await admin.updateSensitiveWord(editingItem.id, values);
      } else {
        await admin.addSensitiveWord(values);
      }
      message.success(editingItem ? '更新成功' : '添加成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败，请检查表单');
    }
  };

  const handleImport = () => {
    setImportModalVisible(true);
  };

  const columns = [
    {
      title: '关键词',
      dataIndex: 'word',
      key: 'word',
      width: 200,
      render: (text: string, record: SensitiveWord) => (
        <Text
          style={{
            color: getRiskLevelLabel(record.riskLevel).color === 'red'
              ? '#ff4d4f'
              : getRiskLevelLabel(record.riskLevel).color === 'orange'
              ? '#fa8c16'
              : '#fadb14',
            fontWeight: 'bold',
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag>{getCategoryLabel(category)}</Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => {
        const { text, color } = getRiskLevelLabel(level);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '替换词',
      dataIndex: 'replacement',
      key: 'replacement',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: SensitiveWord) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: SensitiveWord) => (
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
            title="确定要删除这个敏感词吗？"
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
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <AlertOutlined /> 敏感词管理
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              批量导入
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增敏感词
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日检测数"
              value={stats.todayDetected}
              prefix={<SafetyOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="高风险"
              value={stats.highRisk}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="中风险"
              value={stats.mediumRisk}
              prefix={<AlertOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="低风险"
              value={stats.lowRisk}
              prefix={<SafetyOutlined style={{ color: '#fadb14' }} />}
              valueStyle={{ color: '#d4b106' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%' }} wrap>
          <Search
            placeholder="搜索关键词"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 280 }}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder="筛选分类"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setCategory(value);
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            {categoryOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="筛选风险等级"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setRiskLevel(value);
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            {riskLevelOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Button onClick={handleSearch}>查询</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editingItem ? '编辑敏感词' : '新增敏感词'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingItem ? '更新' : '添加'}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="word"
            label="关键词"
            rules={[
              { required: true, message: '请输入关键词' },
              { max: 50, message: '关键词不能超过50字' },
            ]}
          >
            <Input placeholder="请输入敏感词" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categoryOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="riskLevel"
            label="风险等级"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select placeholder="请选择风险等级">
              {riskLevelOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.value === 'high' ? 'red' : opt.value === 'medium' ? 'orange' : 'yellow'}>
                    {opt.label}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="replacement"
            label="替换词（可选）"
          >
            <Input placeholder="检测到敏感词后替换为该内容" />
          </Form.Item>
          <Form.Item
            name="enabled"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入敏感词"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => {
            message.success('导入成功');
            setImportModalVisible(false);
            fetchData();
          }}>
            确认导入
          </Button>,
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            请上传 CSV 或 Excel 文件，格式要求：关键词,分类,风险等级,替换词
          </Text>
        </div>
        <Upload
          accept=".csv,.xlsx,.xls"
          beforeUpload={() => false}
          maxCount={1}
        >
          <Button icon={<ImportOutlined />}>选择文件</Button>
        </Upload>
        <Divider style={{ margin: '16px 0' }} />
        <div>
          <Text strong>或直接粘贴内容（每行一个，格式：关键词,分类,风险等级,替换词）：</Text>
          <TextArea
            rows={6}
            placeholder="月薪过万,salary_promise,high,***&#10;强制加班,overtime_culture,high,***&#10;免费培训,false_publicity,medium,***"
            style={{ marginTop: '8px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SensitiveWordManage;
