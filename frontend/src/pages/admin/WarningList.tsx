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
  Card,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  WarningOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { admin } from '../../api/endpoints';
import { highlightSensitiveWords, getRiskLevelLabel } from '../../utils/sensitive.tsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const sourceOptions = [
  { value: 'job', label: '岗位' },
  { value: 'post', label: '帖子' },
  { value: 'comment', label: '评论' },
];

interface WarningRecord {
  id: number;
  type: string;
  content: string;
  source: string;
  sourceId: number;
  matchedWord: string;
  riskLevel: string;
  createdAt: Date;
  status: 'pending' | 'ignored' | 'deleted' | 'warned';
}

const WarningList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WarningRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState<string | undefined>();
  const [riskLevel, setRiskLevel] = useState<string | undefined>();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WarningRecord | null>(null);

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
      if (source) params.source = source;
      if (riskLevel) params.riskLevel = riskLevel;

      const response = await admin.warnings(params);
      const list: WarningRecord[] = (response.data.list || []).map((item: any) => ({
        id: item.id,
        type: item.type || '',
        content: item.content || '',
        source: item.source || '',
        sourceId: item.sourceId || 0,
        matchedWord: item.matchedWord || '',
        riskLevel: item.riskLevel || 'low',
        createdAt: item.createdAt || new Date(),
        status: item.status || 'pending',
      }));
      setData(list);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleViewDetail = (record: WarningRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleIgnore = async (record: WarningRecord) => {
    try {
      await admin.handleWarning(record.id, 'ignore');
      setData(prev => prev.map(d =>
        d.id === record.id ? { ...d, status: 'ignored' as const } : d
      ));
      message.success('已忽略');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (record: WarningRecord) => {
    try {
      await admin.handleWarning(record.id, 'delete');
      setData(prev => prev.map(d =>
        d.id === record.id ? { ...d, status: 'deleted' as const } : d
      ));
      message.success('内容已删除');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleWarn = async (record: WarningRecord) => {
    try {
      await admin.handleWarning(record.id, 'warn');
      setData(prev => prev.map(d =>
        d.id === record.id ? { ...d, status: 'warned' as const } : d
      ));
      message.success('已向用户发送警告');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getSourceLabel = (source: string) => {
    if (source.includes('岗位') || source === 'job') return '岗位';
    if (source.includes('帖子') || source === 'post') return '帖子';
    if (source.includes('评论') || source === 'comment') return '评论';
    return source;
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('岗位') || source === 'job') return '💼';
    if (source.includes('帖子') || source === 'post') return '📝';
    if (source.includes('评论') || source === 'comment') return '💬';
    return '📄';
  };

  const getTypeLabel = (type: string) => {
    if (type === 'job') return '岗位招聘';
    if (type === 'post') return '社区帖子';
    return type;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      ignored: { color: 'default', text: '已忽略' },
      deleted: { color: 'red', text: '已删除' },
      warned: { color: 'blue', text: '已警告' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: 280,
      ellipsis: true,
      render: (text: string, record: WarningRecord) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            {highlightSensitiveWords(text.substring(0, 50))}
            {text.length > 50 && '...'}
          </div>
          <Space size={[4, 4]} wrap>
            {record.matchedWord.split(',').map((word, idx) => {
              const { color } = getRiskLevelLabel(record.riskLevel);
              return (
                <Tag key={idx} color={color} style={{ fontSize: '11px', padding: '0 6px' }}>
                  {word}
                </Tag>
              );
            })}
          </Space>
        </div>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => {
        const { text, color } = getRiskLevelLabel(level);
        return (
          <Tag color={color} icon={<WarningOutlined />}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string, record: WarningRecord) => (
        <Tag>
          {getSourceIcon(record.type || source)} {getTypeLabel(record.type) || getSourceLabel(source)}
        </Tag>
      ),
    },
    {
      title: '检测时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: WarningRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleIgnore(record)}
              >
                忽略
              </Button>
              <Popconfirm
                title="确认删除"
                description="确定要删除这条内容吗？"
                onConfirm={() => handleDelete(record)}
                okText="确认删除"
                okType="danger"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除内容
                </Button>
              </Popconfirm>
              <Button
                type="link"
                size="small"
                icon={<ExclamationCircleOutlined />}
                style={{ color: '#fa8c16' }}
                onClick={() => handleWarn(record)}
              >
                警告用户
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = data.filter(d => d.status === 'pending').length;
  const highRiskCount = data.filter(d => d.riskLevel === 'high' && d.status === 'pending').length;
  const mediumRiskCount = data.filter(d => d.riskLevel === 'medium' && d.status === 'pending').length;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <WarningOutlined /> 敏感词预警列表
          </Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space align="center">
              <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>待处理</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                  {pendingCount}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space align="center">
              <WarningOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>高风险</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  {highRiskCount}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space align="center">
              <WarningOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>中风险</Text>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {mediumRiskCount}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%' }} wrap>
          <Search
            placeholder="搜索内容、关键词"
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 280 }}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            placeholder="来源筛选"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setSource(value);
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            {sourceOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="风险等级"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setRiskLevel(value);
              setPage(1);
              setTimeout(fetchData, 0);
            }}
          >
            <Option value="high">高风险</Option>
            <Option value="medium">中风险</Option>
            <Option value="low">低风险</Option>
          </Select>
          <Button onClick={handleSearch}>查询</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
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
        title="预警详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text type="secondary">风险等级：</Text>
                {(() => {
                  const { text, color } = getRiskLevelLabel(selectedRecord.riskLevel);
                  return <Tag color={color}>{text}</Tag>;
                })()}
              </Col>
              <Col span={12}>
                <Text type="secondary">来源：</Text>
                <Tag>{getSourceIcon(selectedRecord.type)} {getTypeLabel(selectedRecord.type) || getSourceLabel(selectedRecord.source)}</Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">状态：</Text>
                {getStatusTag(selectedRecord.status)}
              </Col>
              <Col span={12}>
                <Text type="secondary">检测时间：</Text>
                <Text>{dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <div>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                敏感词：
              </Text>
              <Space wrap size={[4, 4]} style={{ marginBottom: '16px' }}>
                {selectedRecord.matchedWord.split(',').map((word, idx) => {
                  const { color } = getRiskLevelLabel(selectedRecord.riskLevel);
                  return (
                    <Tag key={idx} color={color}>
                      {word}
                    </Tag>
                  );
                })}
              </Space>
            </div>

            <div>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                完整内容（敏感词已标红）：
              </Text>
              <Card size="small" style={{ background: '#fafafa' }}>
                <div style={{ lineHeight: '1.8' }}>
                  {highlightSensitiveWords(selectedRecord.content)}
                </div>
              </Card>
            </div>

            {selectedRecord.status === 'pending' && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
                  <Button onClick={() => {
                    handleIgnore(selectedRecord);
                    setDetailModalVisible(false);
                  }}>
                    忽略
                  </Button>
                  <Popconfirm
                    title="确认删除"
                    description="确定要删除这条内容吗？"
                    onConfirm={() => {
                      handleDelete(selectedRecord);
                      setDetailModalVisible(false);
                    }}
                    okText="确认删除"
                    okType="danger"
                    cancelText="取消"
                  >
                    <Button danger>
                      删除内容
                    </Button>
                  </Popconfirm>
                  <Button
                    type="primary"
                    onClick={() => {
                      handleWarn(selectedRecord);
                      setDetailModalVisible(false);
                    }}
                  >
                    警告用户
                  </Button>
                </Space>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WarningList;
