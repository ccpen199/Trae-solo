import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Divider,
  Spin,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { orderApi, employeeApi } from '../api';
import { STATUS_NAMES, STATUS_COLORS, STEP_NAMES, STEPS } from '../utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = React.useState(null);
  const [statusFlow, setStatusFlow] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [actionModalVisible, setActionModalVisible] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [orderRes, flowRes, commentsRes, employeesRes] = await Promise.all([
        orderApi.getDetail(id),
        orderApi.getStatusFlow(id),
        orderApi.getComments(id),
        employeeApi.getList({ limit: 100 }),
      ]);
      setOrder(orderRes.data);
      setStatusFlow(flowRes.data || []);
      setComments(commentsRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error) {
      console.error('获取工单详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAvailableActions = () => {
    if (!order) return [];
    const { current_step, status } = order;
    const actions = [];

    switch (current_step) {
      case STEPS.ORG_SYNC:
        if (status === 'draft') {
          actions.push(
            { key: 'submit', label: '提交', type: 'primary' },
            { key: 'cancel', label: '取消', type: 'default', danger: true }
          );
        }
        break;
      case STEPS.CHAT_COMMUNICATION:
        if (status === 'pending') {
          actions.push(
            { key: 'complete', label: '完成', type: 'primary' },
            { key: 'reject', label: '驳回', type: 'default', danger: true },
            { key: 'transfer', label: '转派', type: 'default' }
          );
        }
        break;
      case STEPS.FILE_SEND:
        if (status === 'pending') {
          actions.push(
            { key: 'send_file', label: '发送文件', type: 'primary' },
            { key: 'transfer', label: '转派', type: 'default' }
          );
        }
        break;
      case STEPS.TASK_NOTIFICATION:
        if (status === 'pending') {
          actions.push(
            { key: 'approve', label: '通过', type: 'primary', icon: <CheckCircleOutlined /> },
            { key: 'reject', label: '驳回', type: 'default', danger: true, icon: <CloseCircleOutlined /> },
            { key: 'need_supplement', label: '需补充', type: 'default' },
            { key: 'transfer', label: '转派', type: 'default' }
          );
        }
        break;
      case STEPS.ARCHIVE:
        if (status === 'approved' || status === 'pending') {
          actions.push({ key: 'archive', label: '归档', type: 'primary' });
        }
        break;
    }

    return actions;
  };

  const handleActionClick = (action) => {
    setCurrentAction(action);
    setActionModalVisible(true);
    form.resetFields();
  };

  const handleActionSubmit = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      let result;
      const { current_step } = order;

      switch (current_step) {
        case STEPS.ORG_SYNC:
          if (currentAction === 'submit') {
            result = await orderApi.submit(id, {
              contacts: values.contacts || order.data_content?.contacts || [],
              responsiblePersonId: values.responsiblePersonId || order.data_content?.responsiblePersonId,
            });
          }
          break;
        case STEPS.CHAT_COMMUNICATION:
          result = await orderApi.processChatCommunication(id, {
            action: currentAction,
            remark: values.remark,
            nextOwnerId: values.nextOwnerId,
          });
          break;
        case STEPS.FILE_SEND:
          result = await orderApi.processFileSend(id, {
            action: currentAction,
            remark: values.remark,
            nextOwnerId: values.nextOwnerId,
          });
          break;
        case STEPS.TASK_NOTIFICATION:
          result = await orderApi.processTaskNotification(id, {
            action: currentAction,
            remark: values.remark,
            nextOwnerId: values.nextOwnerId,
          });
          break;
        case STEPS.ARCHIVE:
          result = await orderApi.archive(id, {
            remark: values.remark,
          });
          break;
      }

      if (result?.success) {
        message.success('操作成功');
        setActionModalVisible(false);
        fetchData();
      }
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div>工单不存在</div>
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>
          返回列表
        </Button>
      </div>
    );
  }

  const actions = getAvailableActions();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回列表
        </Button>
      </div>

      <Card
        className="page-card"
        title={
          <Space>
            <span>{order.order_no}</span>
            <Tag color={STATUS_COLORS[order.status] || 'default'}>
              {STATUS_NAMES[order.status] || order.status}
            </Tag>
          </Space>
        }
        extra={
          actions.length > 0 && (
            <Space>
              {actions.map((action) => (
                <Button
                  key={action.key}
                  type={action.type}
                  danger={action.danger}
                  icon={action.icon}
                  onClick={() => handleActionClick(action.key)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          )
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="工单标题">{order.title}</Descriptions.Item>
          <Descriptions.Item label="工单类型">
            {order.type}
          </Descriptions.Item>
          <Descriptions.Item label="当前步骤">
            <Tag color="blue">{STEP_NAMES[order.current_step] || order.current_step}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            {order.priority === 'high' ? '高' : order.priority === 'low' ? '低' : '中'}
          </Descriptions.Item>
          <Descriptions.Item label="发起人">{order.initiator_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前负责人">{order.current_owner_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="期望完成时间">
            {order.expected_time ? dayjs(order.expected_time).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {order.description || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      <Card className="page-card">
        <Tabs defaultActiveKey="flow">
          <TabPane tab="状态流转" key="flow">
            {statusFlow.length > 0 ? (
              <Timeline mode="left" className="step-timeline">
                {statusFlow
                  .slice()
                  .reverse()
                  .map((item) => (
                    <Timeline.Item
                      key={item.id}
                      color={
                        item.to_status === 'approved' || item.to_status === 'completed'
                          ? 'green'
                          : item.to_status === 'rejected'
                          ? 'red'
                          : 'blue'
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <strong>
                            {STEP_NAMES[item.to_step] || item.to_step} - {STATUS_NAMES[item.to_status] || item.to_status}
                          </strong>
                          {item.action && <Tag>{item.action}</Tag>}
                        </Space>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          操作人: {item.operator_name || '-'} | 时间:{' '}
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                        </div>
                        {item.remark && (
                          <div className="timeline-comment">{item.remark}</div>
                        )}
                      </Space>
                    </Timeline.Item>
                  ))}
              </Timeline>
            ) : (
              <Empty description="暂无状态流转记录" />
            )}
          </TabPane>

          <TabPane tab="审批记录" key="comments">
            {comments.length > 0 ? (
              <div>
                {comments.map((item) => (
                  <Card
                    key={item.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <Space>
                        <span>{item.operator_name}</span>
                        <Tag color={item.result === 'approved' ? 'green' : item.result === 'rejected' ? 'red' : 'blue'}>
                          {item.result}
                        </Tag>
                      </Space>
                    }
                    extra={<span style={{ color: '#999' }}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>}
                  >
                    <div>
                      <strong>操作:</strong> {item.action}
                    </div>
                    {item.content && (
                      <div style={{ marginTop: 8 }}>
                        <strong>意见:</strong> {item.content}
                      </div>
                    )}
                    {item.next_owner_name && (
                      <div style={{ marginTop: 8 }}>
                        <strong>下一负责人:</strong> {item.next_owner_name}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="暂无审批记录" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={`执行操作: ${currentAction === 'approve' ? '通过' : currentAction === 'reject' ? '驳回' : currentAction === 'need_supplement' ? '需补充' : currentAction === 'transfer' ? '转派' : currentAction === 'archive' ? '归档' : '完成'}`}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={handleActionSubmit}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {order.current_step === STEPS.ORG_SYNC && currentAction === 'submit' && (
            <Form.Item
              label="责任人"
              name="responsiblePersonId"
              rules={[{ required: true, message: '请选择责任人' }]}
              initialValue={order.data_content?.responsiblePersonId}
            >
              <Select placeholder="请选择责任人">
                {employees.map((emp) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department_name || '-'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {(currentAction === 'transfer') && (
            <Form.Item
              label="转派给"
              name="nextOwnerId"
              rules={[{ required: true, message: '请选择转派对象' }]}
            >
              <Select placeholder="请选择转派对象">
                {employees.map((emp) => (
                  <Select.Option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department_name || '-'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="备注/意见" name="remark">
            <TextArea rows={4} placeholder="请输入备注或意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
