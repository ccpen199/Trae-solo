import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Badge,
  Space,
  Divider,
  Descriptions,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSchedulingStore } from '@/store';
import { orderApi } from '@/api';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { confirm } = Modal;

const Scheduling: React.FC = () => {
  const {
    batchId,
    lockedOrders,
    sessionExpiresAt,
    setBatch,
    updateOrder,
    removeOrder,
    clearBatch
  } = useSchedulingStore();

  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [form] = Form.useForm();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await orderApi.getPending(1, 1);
      setPendingCount(res.data.pagination?.total || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  useEffect(() => {
    if (!sessionExpiresAt) {
      setRemainingTime(0);
      setIsWarning(false);
      return;
    }

    const updateTime = () => {
      const now = Date.now();
      const expires = new Date(sessionExpiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setRemainingTime(remaining);
      setIsWarning(remaining <= 25 * 60);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [sessionExpiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaimOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.claimOrders();
      if (res.data.orders && res.data.orders.length > 0) {
        setBatch(res.data.batchId, res.data.orders, res.data.sessionDuration);
        message.success(`成功领取 ${res.data.orders.length} 条订单`);
      } else {
        message.info(res.data.message || '当前没有可领取的订单');
      }
      fetchPendingCount();
    } catch (error: any) {
      message.error(error.response?.data?.error || '领取订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseOrder = (order: any) => {
    confirm({
      title: '确认释放订单？',
      icon: <UndoOutlined />,
      content: `订单号: ${order.orderNo}`,
      okText: '确认释放',
      okType: 'warning',
      cancelText: '取消',
      onOk: async () => {
        try {
          await orderApi.releaseOrder(order.orderId);
          removeOrder(order.orderId);
          message.success('订单已释放');
          fetchPendingCount();
        } catch (error: any) {
          message.error(error.response?.data?.error || '释放订单失败');
        }
      }
    });
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    form.setFieldsValue({
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      receiverLandline: order.receiverLandline,
      appointmentDate: order.appointmentDate ? dayjs(order.appointmentDate) : null,
      appointmentTime: order.appointmentTime,
      exceptionRemark: ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      const updateData = {
        receiverName: values.receiverName,
        receiverPhone: values.receiverPhone,
        receiverLandline: values.receiverLandline,
        appointmentDate: values.appointmentDate?.format('YYYY-MM-DD'),
        appointmentTime: values.appointmentTime,
        exceptionRemark: values.exceptionRemark
      };

      await orderApi.updateOrder(editingOrder.orderId, updateData);
      
      updateOrder(editingOrder.orderId, {
        receiverName: updateData.receiverName,
        receiverPhone: updateData.receiverPhone,
        receiverLandline: updateData.receiverLandline,
        appointmentDate: updateData.appointmentDate || '',
        appointmentTime: updateData.appointmentTime || ''
      });

      message.success('订单信息已更新');
      setEditingOrder(null);
    } catch (error: any) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      }
    }
  };

  const handleConfirmOrder = (order: any, result: 'confirmed' | 'cancelled') => {
    const title = result === 'confirmed' ? '确认调度完成？' : '确认取消订单？';
    const content = result === 'confirmed'
      ? `确认订单 ${order.orderNo} 调度完成，预约信息为：${order.appointmentDate} ${order.appointmentTime}`
      : `确认订单 ${order.orderNo} 取消，该操作将记录到恶意拒收线索中。`;

    confirm({
      title,
      icon: result === 'confirmed' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />,
      content,
      okText: result === 'confirmed' ? '确认完成' : '确认取消',
      okType: result === 'confirmed' ? 'primary' : 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await orderApi.confirmOrder(order.orderId, {
            confirmResult: result,
            exceptionRemark: ''
          });
          removeOrder(order.orderId);
          message.success(
            result === 'confirmed' ? '订单已确认调度完成' : '订单已取消，已记录恶意拒收线索'
          );
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败');
        }
      }
    });
  };

  const handleFinishBatch = () => {
    if (lockedOrders.length > 0) {
      confirm({
        title: '还有未处理的订单',
        icon: <ExclamationCircleOutlined />,
        content: `您还有 ${lockedOrders.length} 条订单未处理，确定要结束当前批次吗？未处理的订单将被释放。`,
        okText: '结束批次',
        okType: 'warning',
        cancelText: '继续处理',
        onOk: async () => {
          for (const order of lockedOrders) {
            try {
              await orderApi.releaseOrder(order.orderId);
            } catch {}
          }
          clearBatch();
          message.success('批次已结束，订单已释放');
          fetchPendingCount();
        }
      });
    } else {
      clearBatch();
      message.success('批次已结束');
      fetchPendingCount();
    }
  };

  const timeSlots = [
    '09:00-12:00',
    '10:00-13:00',
    '14:00-18:00',
    '15:00-19:00',
    '18:00-22:00',
  ];

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '收货人信息',
      key: 'receiver',
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <div>{record.receiverName}</div>
          <div style={{ color: '#666' }}>
            {record.receiverPhone}
            {record.receiverLandline && <span> / {record.receiverLandline}</span>}
          </div>
        </div>
      ),
    },
    {
      title: '原预约时间',
      key: 'appointment',
      width: 180,
      render: (_: any, record: any) => (
        <Tag color="blue">
          {record.appointmentDate} {record.appointmentTime}
        </Tag>
      ),
    },
    {
      title: '商品信息',
      key: 'goods',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <div>件数: {record.itemCount} 件</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            体积: {record.volume} m³ | 重量: {record.weight} kg
          </div>
        </div>
      ),
    },
    {
      title: '配送中心/库房',
      key: 'location',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <div>{record.dcName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.warehouseName}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditOrder(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleConfirmOrder(record, 'confirmed')}
          >
            确认完成
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleConfirmOrder(record, 'cancelled')}
          >
            取消订单
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UndoOutlined />}
            onClick={() => handleReleaseOrder(record)}
          >
            释放
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            订单调度
            {lockedOrders.length > 0 && (
              <Badge count={lockedOrders.length} showZero={false} />
            )}
          </Space>
        }
        extra={
          <Space>
            {lockedOrders.length > 0 && (
              <Space>
                <Tag color={isWarning ? 'red' : 'green'}>
                  剩余时间: {formatTime(remainingTime)}
                </Tag>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchPendingCount()}
                >
                  刷新
                </Button>
                <Button onClick={handleFinishBatch}>
                  结束批次
                </Button>
              </Space>
            )}
            {lockedOrders.length === 0 && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleClaimOrders}
                loading={loading}
              >
                领取订单 (待处理: {pendingCount})
              </Button>
            )}
          </Space>
        }
      >
        {isWarning && lockedOrders.length > 0 && (
          <Alert
            message="会话即将过期"
            description="距离会话结束还剩不到5分钟，请尽快完成当前批次订单处理。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {lockedOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}>
              <ExclamationCircleOutlined />
            </div>
            <p style={{ color: '#999' }}>
              当前没有正在处理的订单，请点击"领取订单"开始工作
            </p>
          </div>
        ) : (
          <>
            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批次ID">
                {batchId}
              </Descriptions.Item>
              <Descriptions.Item label="订单数量">
                {lockedOrders.length} 条
              </Descriptions.Item>
              <Descriptions.Item label="会话有效期">
                {formatTime(remainingTime)}
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={columns}
              dataSource={lockedOrders}
              rowKey="orderId"
              scroll={{ x: 1400 }}
              pagination={false}
              size="middle"
            />
          </>
        )}
      </Card>

      <Modal
        title="编辑订单信息"
        open={!!editingOrder}
        onOk={handleSaveEdit}
        onCancel={() => setEditingOrder(null)}
        width={600}
      >
        {editingOrder && (
          <Form form={form} layout="vertical">
            <Descriptions size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">
                {editingOrder.orderNo}
              </Descriptions.Item>
              <Descriptions.Item label="商品">
                {editingOrder.itemCount}件 / {editingOrder.volume}m³ / {editingOrder.weight}kg
              </Descriptions.Item>
            </Descriptions>

            <Divider>修改预约信息</Divider>

            <Form.Item
              label="收货人姓名"
              name="receiverName"
              rules={[{ required: true, message: '请输入收货人姓名' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="收货人手机号"
              name="receiverPhone"
              rules={[{ required: true, message: '请输入收货人手机号' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="固定电话" name="receiverLandline">
              <Input />
            </Form.Item>

            <Form.Item
              label="预约日期"
              name="appointmentDate"
              rules={[{ required: true, message: '请选择预约日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              label="预约时段"
              name="appointmentTime"
              rules={[{ required: true, message: '请选择预约时段' }]}
            >
              <Select>
                {timeSlots.map((slot) => (
                  <Select.Option key={slot} value={slot}>
                    {slot}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="异常备注" name="exceptionRemark">
              <TextArea rows={3} placeholder="如有异常情况请在此备注..." />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Scheduling;
