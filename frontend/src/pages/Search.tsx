import React, { useState } from 'react';
import { Table, Tag, Card, Button, Space, Select, Input, Row, Col, Form, DatePicker, Switch, Descriptions, Timeline, Modal, Badge } from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queryApi } from '../services/api';
import { Document, ProcessNode, ApprovalComment } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DocumentSearch: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<any>({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const navigate = useNavigate();

  const handleSearch = async (values?: any) => {
    const params = values || searchParams;
    setLoading(true);
    try {
      const apiParams: any = {
        page: 1,
        pageSize,
      };

      if (params.document_type) {
        apiParams.document_type = params.document_type;
      }
      if (params.status) {
        apiParams.status = params.status;
      }
      if (params.category) {
        apiParams.category = params.category;
      }
      if (params.keyword) {
        apiParams.keyword = params.keyword;
      }
      if (params.exact_match) {
        apiParams.exact_match = params.exact_match;
      }
      if (params.is_archived) {
        apiParams.is_archived = params.is_archived;
      }
      if (params.dateRange && params.dateRange.length === 2) {
        apiParams.start_date = params.dateRange[0].format('YYYY-MM-DD');
        apiParams.end_date = params.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await queryApi.search(apiParams);
      setDocuments(response.documents || []);
      setTotal(response.total || 0);
      setCurrentPage(1);
      setSearchParams(params);
    } catch (error) {
      console.error('查询公文失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (page: number, size: number) => {
    setLoading(true);
    try {
      const apiParams: any = {
        page,
        pageSize: size,
        ...searchParams,
      };

      if (searchParams.dateRange && searchParams.dateRange.length === 2) {
        apiParams.start_date = searchParams.dateRange[0].format('YYYY-MM-DD');
        apiParams.end_date = searchParams.dateRange[1].format('YYYY-MM-DD');
        delete apiParams.dateRange;
      }

      const response = await queryApi.search(apiParams);
      setDocuments(response.documents || []);
      setTotal(response.total || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error('查询公文失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (record: Document) => {
    setSelectedDocument(record);
    try {
      const response = await queryApi.getTracking(record.id);
      setTrackingData(response);
    } catch (error) {
      console.error('获取跟踪信息失败:', error);
    }
    setDetailModalVisible(true);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      草稿: { color: 'default', text: '草稿' },
      审批中: { color: 'processing', text: '审批中' },
      已签发: { color: 'success', text: '已签发' },
      已退回: { color: 'error', text: '已退回' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '公文编号',
      dataIndex: 'document_number',
      key: 'document_number',
      ellipsis: true,
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'document_type',
      key: 'document_type',
      width: 80,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 80,
    },
    {
      title: '密级',
      dataIndex: 'security_level',
      key: 'security_level',
      width: 80,
      render: (level: string) => {
        const colorMap: Record<string, string> = {
          普通: 'default',
          秘密: 'orange',
          机密: 'red',
          绝密: 'purple',
        };
        return <Tag color={colorMap[level] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Document) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => navigate(`/tracking/${record.id}`)}>
            跟踪
          </Button>
        </Space>
      ),
    },
  ];

  const getNodeStatusIcon = (status: string) => {
    switch (status) {
      case '已完成':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
      case '待处理':
        return <Badge status="processing" />;
      case '已退回':
        return <Badge status="error" />;
      default:
        return <Badge status="default" />;
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <SearchOutlined />
            公文查询
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{ exact_match: false, is_archived: false }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词搜索">
                <Search placeholder="标题/内容/编号" allowClear enterButton={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="document_type" label="公文类型">
                <Select placeholder="请选择" allowClear>
                  <Option value="发文">发文</Option>
                  <Option value="收文">收文</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择" allowClear>
                  <Option value="草稿">草稿</Option>
                  <Option value="审批中">审批中</Option>
                  <Option value="已签发">已签发</Option>
                  <Option value="已退回">已退回</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="category" label="类别">
                <Select placeholder="请选择" allowClear>
                  <Option value="通知">通知</Option>
                  <Option value="公告">公告</Option>
                  <Option value="请示">请示</Option>
                  <Option value="报告">报告</Option>
                  <Option value="批复">批复</Option>
                  <Option value="意见">意见</Option>
                  <Option value="函">函</Option>
                  <Option value="纪要">纪要</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="dateRange" label="创建时间范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="exact_match" label="精确匹配" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="is_archived" label="仅查询归档" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="操作" style={{ marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button onClick={() => { form.resetFields(); setDocuments([]); setTotal(0); }}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => loadPage(page, size),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="公文详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedDocument && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="公文编号">{selectedDocument.document_number}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{selectedDocument.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{selectedDocument.document_type}</Descriptions.Item>
              <Descriptions.Item label="类别">{selectedDocument.category}</Descriptions.Item>
              <Descriptions.Item label="密级">{selectedDocument.security_level}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedDocument.status)}
              </Descriptions.Item>
              <Descriptions.Item label="当前环节">{selectedDocument.current_node || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">
                {selectedDocument.creator_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedDocument.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Card title="公文正文" size="small" style={{ marginTop: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 100 }}>
                {selectedDocument.content}
              </div>
            </Card>

            {trackingData && (
              <>
                <Card title="审批流程" size="small" style={{ marginTop: 16 }}>
                  {trackingData.process_nodes && trackingData.process_nodes.length > 0 ? (
                    <Timeline>
                      {trackingData.process_nodes.map((node: ProcessNode) => (
                        <Timeline.Item
                          key={node.id}
                          dot={getNodeStatusIcon(node.status)}
                        >
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{node.node_name}</p>
                          <p style={{ margin: 0 }}>处理人: {node.handler_name || '-'}</p>
                          <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                            状态: {node.status}
                            {node.completed_at && ` | 完成时间: ${dayjs(node.completed_at).format('YYYY-MM-DD HH:mm')}`}
                          </p>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999' }}>暂无流程记录</div>
                  )}
                </Card>

                <Card title="审批意见" size="small" style={{ marginTop: 16 }}>
                  {trackingData.comments && trackingData.comments.length > 0 ? (
                    <Table
                      dataSource={trackingData.comments}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      columns={[
                        { title: '审批人', dataIndex: 'user_name', key: 'user_name' },
                        { title: '操作', dataIndex: 'action', key: 'action',
                          render: (action: string) => {
                            const colorMap: Record<string, string> = {
                              '通过': 'success',
                              '退回': 'error',
                              '补充意见': 'warning',
                            };
                            return <Tag color={colorMap[action] || 'default'}>{action}</Tag>;
                          }
                        },
                        { title: '意见', dataIndex: 'comment', key: 'comment', ellipsis: true },
                        { title: '时间', dataIndex: 'created_at', key: 'created_at',
                          render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
                        },
                      ]}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999' }}>暂无审批意见</div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentSearch;
