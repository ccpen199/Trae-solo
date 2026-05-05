import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Space, Select, Input, Badge, Descriptions, Modal, Timeline, Form, TextArea, message, Row, Col } from 'antd';
import {
  CheckSquareOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { approvalApi } from '../services/api';
import { TodoTask, ProcessNode, ApprovalComment } from '../types';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const TodoList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<TodoTask[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoTask | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos();
  }, [currentPage, pageSize, statusFilter]);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        pageSize,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await approvalApi.getTodoList(params);
      setTodos(response.todos || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('获取待办列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      待处理: { color: 'processing', text: '待处理' },
      已完成: { color: 'success', text: '已完成' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const viewDetail = async (record: TodoTask) => {
    setSelectedTodo(record);
    try {
      const response = await approvalApi.getTodoDetail(record.id);
      setTrackingData(response);
    } catch (error) {
      console.error('获取待办详情失败:', error);
    }
    form.resetFields();
    setDetailModalVisible(true);
  };

  const handleApproval = async (action: string) => {
    if (!selectedTodo) return;

    const values = form.getFieldsValue();
    setProcessing(true);
    try {
      const response = await approvalApi.handleApproval(
        selectedTodo.id,
        action,
        values.comment
      );
      message.success(`审批成功：${action}`);
      setDetailModalVisible(false);
      fetchTodos();
    } catch (error: any) {
      message.error(error.response?.data?.error || '审批失败');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      ellipsis: true,
      width: 200,
    },
    {
      title: '公文标题',
      dataIndex: 'document_title',
      key: 'document_title',
      ellipsis: true,
    },
    {
      title: '公文编号',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 150,
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
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
      width: 150,
      render: (_: any, record: TodoTask) => (
        <Space>
          {record.status === '待处理' ? (
            <Button type="primary" size="small" onClick={() => viewDetail(record)}>
              处理
            </Button>
          ) : (
            <Button type="link" size="small" onClick={() => viewDetail(record)}>
              查看
            </Button>
          )}
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
            <CheckSquareOutlined />
            待办公文
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索任务名称/公文标题"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => setKeyword(value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              value={statusFilter || undefined}
            >
              <Option value="待处理">待处理</Option>
              <Option value="已完成">已完成</Option>
            </Select>
          </Col>
        </Row>

        <Table
          dataSource={todos}
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
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={selectedTodo?.status === '待处理' ? '处理审批' : '查看详情'}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedTodo && trackingData && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="任务名称">{selectedTodo.task_name}</Descriptions.Item>
              <Descriptions.Item label="公文编号">{trackingData.todo?.document_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="公文标题" span={2}>{trackingData.todo?.title || selectedTodo.document_title}</Descriptions.Item>
              <Descriptions.Item label="创建人">{trackingData.todo?.creator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属部门">{trackingData.todo?.creator_department || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {getStatusTag(selectedTodo.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedTodo.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Card title="公文正文" size="small" style={{ marginTop: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', minHeight: 80 }}>
                {trackingData.todo?.content || '-'}
              </div>
            </Card>

            {trackingData.process_nodes && trackingData.process_nodes.length > 0 && (
              <Card title="审批流程" size="small" style={{ marginTop: 16 }}>
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
              </Card>
            )}

            {trackingData.comments && trackingData.comments.length > 0 && (
              <Card title="历史审批意见" size="small" style={{ marginTop: 16 }}>
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
              </Card>
            )}

            {selectedTodo.status === '待处理' && (
              <Card title="处理意见" size="small" style={{ marginTop: 16 }}>
                <Form form={form} layout="vertical">
                  <Form.Item name="comment" label="审批意见">
                    <TextArea rows={4} placeholder="请输入审批意见（可选）" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={processing}
                        onClick={() => handleApproval('通过')}
                      >
                        通过
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        loading={processing}
                        onClick={() => handleApproval('退回')}
                      >
                        退回
                      </Button>
                      <Button
                        icon={<FormOutlined />}
                        loading={processing}
                        onClick={() => handleApproval('补充意见')}
                      >
                        补充意见
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TodoList;
