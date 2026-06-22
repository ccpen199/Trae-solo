import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Modal, InputNumber, Input, Form, Space, Row, Col, Statistic, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { riderService } from '@/services/rider.service';
import type { Rider } from '@shared/types';

const RiderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(false);
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [creditModalVisible, setCreditModalVisible] = useState(false);
  const [freezeForm] = Form.useForm();
  const [creditForm] = Form.useForm();

  const fetchRider = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await riderService.getDetail(id);
      setRider(data);
    } catch {
      message.error('获取骑手信息失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRider();
  }, [id]);

  const handleFreeze = async (values: { isFrozen: boolean; frozenReason: string; frozenDays?: number }) => {
    if (!id) return;
    try {
      await riderService.updateStatus({
        riderId: id,
        isFrozen: values.isFrozen,
        frozenReason: values.frozenReason,
        frozenDays: values.frozenDays,
      });
      message.success(values.isFrozen ? '已冻结骑手账户' : '已解冻骑手账户');
      setFreezeModalVisible(false);
      freezeForm.resetFields();
      fetchRider();
    } catch {
      message.error('操作失败');
    }
  };

  const handleCreditAdjust = async (values: { change: number; reason: string }) => {
    if (!id) return;
    try {
      await riderService.adjustCredit({
        riderId: id,
        change: values.change,
        reason: values.reason,
      });
      message.success('信用分已调整');
      setCreditModalVisible(false);
      creditForm.resetFields();
      fetchRider();
    } catch {
      message.error('操作失败');
    }
  };

  if (!rider) {
    return <Card loading={loading} />;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/riders')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="信用分" value={rider.creditScore} valueStyle={{ color: rider.creditScore < 60 ? '#cf1322' : '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="完成订单" value={rider.completedOrders} />
          </Col>
          <Col span={6}>
            <Statistic title="总里程(km)" value={(rider.totalDistance / 1000).toFixed(1)} />
          </Col>
          <Col span={6}>
            <Statistic title="总收入(元)" value={rider.totalEarnings} precision={2} />
          </Col>
        </Row>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">{rider.realName || rider.nickname}</Descriptions.Item>
          <Descriptions.Item label="手机号">{rider.phone}</Descriptions.Item>
          <Descriptions.Item label="在线状态">
            <Tag color={rider.isOnline ? 'green' : 'default'}>{rider.isOnline ? '在线' : '离线'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="冻结状态">
            <Tag color={rider.isFrozen ? 'red' : 'green'}>{rider.isFrozen ? '已冻结' : '正常'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="实名认证">
            <Tag color={rider.realNameVerified ? 'green' : 'orange'}>{rider.realNameVerified ? '已认证' : '未认证'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="资质审核">
            <Tag color={rider.qualificationVerified ? 'green' : 'orange'}>{rider.qualificationVerified ? '已通过' : '未通过'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="交通工具">{rider.vehicleType}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{rider.vehiclePlate || '-'}</Descriptions.Item>
          {rider.isFrozen && (
            <>
              <Descriptions.Item label="冻结原因" span={2}>{rider.frozenReason || '-'}</Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Space style={{ marginTop: 16 }}>
          <Button
            danger={rider.isFrozen}
            type={rider.isFrozen ? 'default' : 'primary'}
            onClick={() => {
              freezeForm.setFieldsValue({ isFrozen: !rider.isFrozen });
              setFreezeModalVisible(true);
            }}
          >
            {rider.isFrozen ? '解冻账户' : '冻结账户'}
          </Button>
          <Button onClick={() => setCreditModalVisible(true)}>调整信用分</Button>
        </Space>
      </Card>

      <Modal
        title={rider.isFrozen ? '解冻骑手账户' : '冻结骑手账户'}
        open={freezeModalVisible}
        onCancel={() => setFreezeModalVisible(false)}
        onOk={() => freezeForm.submit()}
      >
        <Form form={freezeForm} onFinish={handleFreeze} layout="vertical">
          <Form.Item name="isFrozen" hidden>
            <Input />
          </Form.Item>
          {!rider.isFrozen && (
            <Form.Item name="frozenReason" label="冻结原因" rules={[{ required: true, message: '请输入冻结原因' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          )}
          {!rider.isFrozen && (
            <Form.Item name="frozenDays" label="冻结天数">
              <InputNumber min={1} max={365} style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="调整信用分"
        open={creditModalVisible}
        onCancel={() => setCreditModalVisible(false)}
        onOk={() => creditForm.submit()}
      >
        <Form form={creditForm} onFinish={handleCreditAdjust} layout="vertical">
          <Form.Item name="change" label="调整分数(正数加，负数减)" rules={[{ required: true }]}>
            <InputNumber min={-100} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="调整原因" rules={[{ required: true, message: '请输入调整原因' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RiderDetail;
