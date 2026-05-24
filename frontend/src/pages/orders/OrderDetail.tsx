import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Divider, Table, Empty, Modal, Form, Input, InputNumber, message, Row, Col, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, CarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../services/api';
import { Order, OrderStatusMap, DepositStatusMap, ViolationStatusMap } from '../../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [pickupForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [settleForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await orderApi.detail(Number(id));
      setOrder(res.data);
    } catch (err) {
      console.error('加载订单详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      await orderApi.pay(Number(id));
      message.success('支付成功');
      loadOrder();
    } catch (err) {
      message.error('支付失败');
    }
  };

  const handlePickup = async (values: any) => {
    try {
      await orderApi.pickup(Number(id), values);
      message.success('取车确认成功');
      setPickupModalVisible(false);
      loadOrder();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleReturn = async (values: any) => {
    try {
      await orderApi.returnVehicle(Number(id), values);
      message.success('还车确认成功');
      setReturnModalVisible(false);
      loadOrder();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleSettle = async (values: any) => {
    try {
      await orderApi.settle(Number(id), values);
      message.success('结算完成');
      setSettleModalVisible(false);
      loadOrder();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleCancel = async () => {
    try {
      await orderApi.cancel(Number(id));
      message.success('订单已取消');
      loadOrder();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const inspectionColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => t === 'pickup' ? '取车验车' : '还车验车' },
    { title: '里程(km)', dataIndex: 'mileage', key: 'mileage' },
    { title: '油量(%)', dataIndex: 'fuel_level', key: 'fuel_level' },
    { title: '外观损伤', dataIndex: 'exterior_damages', key: 'exterior_damages', render: (v: string) => v || '无' },
    { title: '内饰损伤', dataIndex: 'interior_damages', key: 'interior_damages', render: (v: string) => v || '无' },
    { title: '验车人', dataIndex: 'operator_name', key: 'operator_name' },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v?.slice(0, 19).replace('T', ' ') }
  ];

  const violationColumns = [
    { title: '违章时间', dataIndex: 'violation_time', key: 'violation_time', render: (v: string) => v?.slice(0, 19).replace('T', ' ') || '-' },
    { title: '违章地点', dataIndex: 'violation_location', key: 'violation_location', render: (v: string) => v || '-' },
    { title: '违章类型', dataIndex: 'violation_type', key: 'violation_type', render: (v: string) => v || '-' },
    { title: '罚款', dataIndex: 'fine_amount', key: 'fine_amount', render: (v: number) => `¥${v}` },
    { title: '扣分', dataIndex: 'deduction_points', key: 'deduction_points', render: (v: number) => `${v}分` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={ViolationStatusMap[s]?.color}>{ViolationStatusMap[s]?.text}</Tag> }
  ];

  if (!order && !loading) {
    return <Empty description="订单不存在" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          订单详情 - {order?.order_no}
          <Tag color={OrderStatusMap[order?.status || '']?.color} style={{ marginLeft: 12 }}>
            {OrderStatusMap[order?.status || '']?.text}
          </Tag>
        </h2>
        <Space>
          {order?.status === 'pending' && (
            <>
              <Button type="primary" onClick={handlePay}>立即支付</Button>
              <Popconfirm title="确定取消该订单?" onConfirm={handleCancel}>
                <Button danger>取消订单</Button>
              </Popconfirm>
            </>
          )}
          {order?.status === 'paid' && (
            <Button type="primary" onClick={() => setPickupModalVisible(true)}>确认取车</Button>
          )}
          {order?.status === 'in_use' && (
            <Button type="primary" onClick={() => setReturnModalVisible(true)}>确认还车</Button>
          )}
          {order?.status === 'returned' && (
            <Button type="primary" onClick={() => setSettleModalVisible(true)}>订单结算</Button>
          )}
        </Space>
      </div>

      <Card loading={loading}>
        <div className="detail-section">
          <h3 className="detail-section-title">订单信息</h3>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号">{order?.order_no}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{order?.created_at?.slice(0, 19).replace('T', ' ')}</Descriptions.Item>
            <Descriptions.Item label="日租金">¥{order?.daily_rate}</Descriptions.Item>
            <Descriptions.Item label="租期">{order?.total_days}天</Descriptions.Item>
            <Descriptions.Item label="基础租金">¥{order?.base_amount}</Descriptions.Item>
            <Descriptions.Item label="保险费">¥{order?.insurance_fee}</Descriptions.Item>
            <Descriptions.Item label="总金额"><span style={{ color: '#1677ff', fontWeight: 600 }}>¥{order?.total_amount}</span></Descriptions.Item>
            <Descriptions.Item label="押金">¥{order?.deposit_amount}</Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        <div className="detail-section">
          <h3 className="detail-section-title">客户信息</h3>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="姓名">{order?.user_name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{order?.user_phone}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{order?.id_card}</Descriptions.Item>
            <Descriptions.Item label="驾照号">{order?.license_number}</Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        <div className="detail-section">
          <h3 className="detail-section-title">车辆信息</h3>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="车牌号">{order?.plate_number}</Descriptions.Item>
            <Descriptions.Item label="车型">{order?.brand} {order?.model}</Descriptions.Item>
            <Descriptions.Item label="颜色">{order?.color}</Descriptions.Item>
            <Descriptions.Item label="燃油类型">{order?.fuel_type}</Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        <div className="detail-section">
          <h3 className="detail-section-title">取还车信息</h3>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="取车门店">{order?.pickup_store_name}</Descriptions.Item>
            <Descriptions.Item label="还车门店">{order?.return_store_name}</Descriptions.Item>
            <Descriptions.Item label="预计取车时间">{order?.pickup_time?.slice(0, 19).replace('T', ' ')}</Descriptions.Item>
            <Descriptions.Item label="预计还车时间">{order?.return_time?.slice(0, 19).replace('T', ' ')}</Descriptions.Item>
            <Descriptions.Item label="实际取车时间">{order?.actual_pickup_time?.slice(0, 19).replace('T', ' ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="实际还车时间">{order?.actual_return_time?.slice(0, 19).replace('T', ' ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="取车里程">{order?.pickup_mileage ? `${order.pickup_mileage} km` : '-'}</Descriptions.Item>
            <Descriptions.Item label="还车里程">{order?.return_mileage ? `${order.return_mileage} km` : '-'}</Descriptions.Item>
          </Descriptions>
        </div>

        {order?.deposit && (
          <>
            <Divider />
            <div className="detail-section">
              <h3 className="detail-section-title">押金信息</h3>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="押金金额">¥{order.deposit.amount}</Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={DepositStatusMap[order.deposit.status]?.color}>{DepositStatusMap[order.deposit.status]?.text}</Tag></Descriptions.Item>
                <Descriptions.Item label="支付时间">{order.deposit.paid_at?.slice(0, 19).replace('T', ' ') || '-'}</Descriptions.Item>
                <Descriptions.Item label="退款时间">{order.deposit.refund_at?.slice(0, 19).replace('T', ' ') || '-'}</Descriptions.Item>
                {order.deposit.refund_amount !== undefined && order.deposit.refund_amount > 0 && (
                  <Descriptions.Item label="退款金额">¥{order.deposit.refund_amount}</Descriptions.Item>
                )}
                {order.deposit.deduction_amount !== undefined && order.deposit.deduction_amount > 0 && (
                  <Descriptions.Item label="扣除金额">¥{order.deposit.deduction_amount}</Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </>
        )}

        {order?.inspections && order.inspections.length > 0 && (
          <>
            <Divider />
            <div className="detail-section">
              <h3 className="detail-section-title">验车记录</h3>
              <Table columns={inspectionColumns} dataSource={order.inspections} rowKey="id" size="small" pagination={false} />
            </div>
          </>
        )}

        {order?.violations && order.violations.length > 0 && (
          <>
            <Divider />
            <div className="detail-section">
              <h3 className="detail-section-title">违章记录</h3>
              <Table columns={violationColumns} dataSource={order.violations} rowKey="id" size="small" pagination={false} />
            </div>
          </>
        )}

        {order?.settlement && (
          <>
            <Divider />
            <div className="detail-section">
              <h3 className="detail-section-title">结算信息</h3>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="基础租金">¥{order.settlement.base_amount}</Descriptions.Item>
                <Descriptions.Item label="油费">¥{order.settlement.fuel_fee}</Descriptions.Item>
                <Descriptions.Item label="违章费">¥{order.settlement.violation_fee}</Descriptions.Item>
                <Descriptions.Item label="损失费">¥{order.settlement.damage_fee}</Descriptions.Item>
                <Descriptions.Item label="结算总额"><span style={{ color: '#1677ff', fontWeight: 600, fontSize: 16 }}>¥{order.settlement.total_settlement}</span></Descriptions.Item>
                <Descriptions.Item label="押金退还">¥{order.settlement.deposit_refund}</Descriptions.Item>
              </Descriptions>
            </div>
          </>
        )}
      </Card>

      <Modal title="确认取车" open={pickupModalVisible} onCancel={() => setPickupModalVisible(false)} footer={null}>
        <Form form={pickupForm} layout="vertical" onFinish={handlePickup}>
          <Form.Item name="pickup_mileage" label="取车里程(km)" rules={[{ required: true, message: '请输入里程' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="pickup_fuel_level" label="油量(%)" rules={[{ required: true, message: '请输入油量' }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="operator_name" label="验车人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setPickupModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="确认还车" open={returnModalVisible} onCancel={() => setReturnModalVisible(false)} footer={null}>
        <Form form={returnForm} layout="vertical" onFinish={handleReturn}>
          <Form.Item name="return_mileage" label="还车里程(km)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={order?.pickup_mileage || 0} />
          </Form.Item>
          <Form.Item name="return_fuel_level" label="油量(%)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="exterior_damages" label="外观损伤">
            <Input.TextArea rows={2} placeholder="无损伤请填'无'" />
          </Form.Item>
          <Form.Item name="interior_damages" label="内饰损伤">
            <Input.TextArea rows={2} placeholder="无损伤请填'无'" />
          </Form.Item>
          <Form.Item name="operator_name" label="验车人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setReturnModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="订单结算" open={settleModalVisible} onCancel={() => setSettleModalVisible(false)} footer={null} width={600}>
        <Form form={settleForm} layout="vertical" onFinish={handleSettle}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="extra_mileage_fee" label="超里程费(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fuel_fee" label="油费差价(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="violation_fee" label="违章扣费(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="damage_fee" label="车损扣费(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="overdue_fee" label="逾期费用(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="other_fee" label="其他费用(元)" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="deposit_refund" label="押金退还(元)" rules={[{ required: true }]} initialValue={order?.deposit_amount || 0}>
            <InputNumber style={{ width: '100%' }} min={0} max={order?.deposit_amount || 0} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认结算</Button>
              <Button onClick={() => setSettleModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
