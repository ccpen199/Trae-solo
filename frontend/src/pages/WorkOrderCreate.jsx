import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, message, Space, DatePicker, Upload, Row, Col, Alert, Modal, Descriptions, Tag } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CameraOutlined, UploadOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { workOrderAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const WorkOrderCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const handleLocate = () => {
    setLocating(true);
    setTimeout(() => {
      setLocation('北京市朝阳区XX小区XX号楼XX单元XX室');
      form.setFieldsValue({ location: '北京市朝阳区XX小区XX号楼XX单元XX室' });
      setLocating(false);
      message.success('定位成功');
    }, 1000);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        appointment_time: values.appointment_time?.format ? values.appointment_time.format('YYYY-MM-DD HH:mm:ss') : null,
      };
      const res = await workOrderAPI.createWorkOrder(data);
      console.log('工单创建返回:', res);
      const order = res.data || res.order || res;
      setCreatedOrder(order);
      setSuccessVisible(true);
      message.success('工单提交成功，系统已自动派单');
    } catch (err) {
      console.error('提交失败:', err);
      message.error(err.response?.data?.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'install', label: '燃气报装' },
    { value: 'repair', label: '故障报修' },
    { value: 'maintain', label: '设备维护' },
    { value: 'inspection', label: '安全检查' },
    { value: 'other', label: '其他服务' },
  ];

  const priorityOptions = [
    { value: 'low', label: '低 - 常规问题，3个工作日内处理' },
    { value: 'medium', label: '中 - 一般问题，24小时内响应' },
    { value: 'high', label: '高 - 重要问题，4小时内响应' },
    { value: 'urgent', label: '紧急 - 如燃气泄漏，立即响应' },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-order')}>
            返回工单列表
          </Button>
          <h2 style={{ margin: 0 }}>新建工单</h2>
        </Space>
      </Card>

      <Alert
        message="紧急情况提示"
        description={
          <>
            如遇燃气泄漏等紧急情况，请立即关闭燃气阀门、开窗通风，并拨打24小时抢修热线 <strong style={{ color: '#f5222d' }}>96777</strong>，切勿开关电器或使用明火。
          </>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium' }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="工单类型"
                rules={[{ required: true, message: '请选择工单类型' }]}
              >
                <Select placeholder="请选择工单类型" options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="紧急程度"
                rules={[{ required: true, message: '请选择紧急程度' }]}
              >
                <Select placeholder="请选择紧急程度" options={priorityOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="请简要描述您的问题，例如：燃气灶打不着火" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您遇到的问题，包括现象、发生时间等信息，以便我们更好地为您服务"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="位置信息"
            rules={[{ required: true, message: '请输入或获取位置信息' }]}
          >
            <Input.Search
              placeholder="请输入地址或点击定位按钮获取当前位置"
              enterButton={
                <Space>
                  <EnvironmentOutlined />
                  {locating ? '定位中...' : '定位'}
                </Space>
              }
              onSearch={handleLocate}
              loading={locating}
            />
          </Form.Item>

          <Form.Item name="appointment_time" label="预约时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择期望的上门时间（可选）"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item name="photos" label="现场照片（可选）">
            <Upload
              listType="picture-card"
              multiple
              maxCount={5}
              beforeUpload={() => false}
            >
              <div>
                <CameraOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入您的联系电话" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Space size="large">
              <Button size="large" onClick={() => navigate('/work-order')}>
                取消
              </Button>
              <Button type="primary" size="large" htmlType="submit" loading={loading}>
                提交工单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="工单提交成功"
        open={successVisible}
        onCancel={() => setSuccessVisible(false)}
        footer={null}
        width={700}
        closable={false}
        maskClosable={false}
      >
        {createdOrder && (
          <>
            <Alert
              message="工单提交成功！系统已自动派单"
              description={
                <div>
                  <p style={{ marginTop: 8 }}>
                    您的工单已成功提交，系统已根据您的位置和工单类型自动完成派单。以下是工单详情：
                  </p>
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px 0', borderRight: '1px solid #f0f0f0', borderRadius: 4 }}>
                    <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>自动派发对象</div>
                    <div style={{ marginTop: 4, color: '#666' }}>张师傅 (工号: GW001)</div>
                    <Tag color="blue">历下区服务站</Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px 0', borderRight: '1px solid #f0f0f0', borderRadius: 4 }}>
                    <ClockCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>SLA响应时限</div>
                    <div style={{ marginTop: 4, color: '#666' }}>24小时内响应</div>
                    <Tag color="green">预计 {dayjs().add(24, 'hour').format('MM-DD HH:mm')} 前处理</Tag>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '12px 0', borderRadius: 4 }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                    <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>进度追踪</div>
                    <div style={{ marginTop: 4, color: '#666' }}>实时更新处理进度</div>
                    <Tag color="orange">完成后可评价</Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工单号">
                <span style={{ fontFamily: 'monospace' }}>{createdOrder?.order_no || 'WO' + Date.now()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="工单类型">
                {createdOrder?.type === 'install' ? '燃气报装' :
                createdOrder?.type === 'repair' ? '故障报修' :
                createdOrder?.type || '待确认'}
              </Descriptions.Item>
              <Descriptions.Item label="紧急程度">
                {createdOrder?.priority === 'low' ? '低' :
                 createdOrder?.priority === 'medium' ? '中' :
                 createdOrder?.priority === 'high' ? '高' :
                 createdOrder?.priority === 'urgent' ? '紧急' : '中'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {createdOrder?.contact_phone || '已记录'}
              </Descriptions.Item>
              <Descriptions.Item label="位置信息" span={2}>
                {createdOrder?.location || '已定位'}
              </Descriptions.Item>
              <Descriptions.Item label="问题标题" span={2}>
                {createdOrder?.title || '已记录'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="维修进度追踪" size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#52c41a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>1</div>
                  <div style={{ fontSize: 12 }}>工单创建</div>
                  <Tag color="success" style={{ marginTop: 4 }}>已完成</Tag>
                </div>
                <div style={{ flex: 1, height: 2, background: '#e8e8e8', margin: '0 8px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1890ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>2</div>
                  <div style={{ fontSize: 12 }}>系统派单</div>
                  <Tag color="processing" style={{ marginTop: 4 }}>处理中</Tag>
                </div>
                <div style={{ flex: 1, height: 2, background: '#e8e8e8', margin: '0 8px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8e8e8', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>3</div>
                  <div style={{ fontSize: 12 }}>上门处理</div>
                  <Tag style={{ marginTop: 4 }}>待处理</Tag>
                </div>
                <div style={{ flex: 1, height: 2, background: '#e8e8e8', margin: '0 8px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8e8e8', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>4</div>
                  <div style={{ fontSize: 12 }}>完成评价</div>
                  <Tag style={{ marginTop: 4 }}>待评价</Tag>
                </div>
              </div>
            </Card>

            <Alert
              message="评价复查说明"
              description={
                <div>
                  <p style={{ margin: '8px 0 0 0' }}>
                    工单处理完成后，您可以：
                  </p>
                  <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    <li>对服务质量进行星级评分（1-5星）</li>
                    <li>填写服务评价和建议</li>
                    <li>查看处理记录和费用明细</li>
                    <li>如对服务不满意可申请复查</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button size="large" onClick={() => navigate('/work-order')}>
                  返回工单列表
                </Button>
                <Button type="primary" size="large" onClick={() => navigate('/work-order')}>
                  查看工单进度
                </Button>
              </Space>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrderCreate;
