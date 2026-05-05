import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Space, Select, Input, Row, Col, Form, Descriptions, Timeline, Modal, Badge, message } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  EyeOutlined,
  InboxOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queryApi } from '../services/api';
import { Document, ProcessNode, ApprovalComment } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const Archived: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [documentType, setDocumentType] = useState<string>('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchived();
  }, [currentPage, pageSize, keyword, documentType]);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize,
      };
      if (keyword) {
        params.keyword = keyword;
      }
      if (documentType) {
        params.document_type = documentType;
      }

      const response = await queryApi.getArchived(params);
      setDocuments(response.documents || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('获取归档公文失败:', error);
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
      title: '最终状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '归档时间',
      dataIndex: 'archived_at',
      key: 'archived_at',
      width: 150,
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
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
            <InboxOutlined />
            归档查询
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索标题/编号"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => {
                setKeyword(value);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="公文类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setDocumentType(value || '');
                setCurrentPage(1);
              }}
              value={documentType || undefined}
            >
              <Option value="发文">发文</Option>
              <Option value="收文">收文</Option>
            </Select>
          </Col>
        </Row>

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
            showTotal: (total) => `共 ${total} 条归档`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="归档公文详情"
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
              <Descriptions.Item label="最终状态">
                {getStatusTag(selectedDocument.status)}
              </Descriptions.Item>
              <Descriptions.Item label="归档时间">
                {selectedDocument.archived_at ? dayjs(selectedDocument.archived_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
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

export default Archived;
