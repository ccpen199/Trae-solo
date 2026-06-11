import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Statistic, Descriptions, Button, Form, InputNumber, Input, message, Timeline, Tag } from 'antd';
import { RiseOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

function BidDetail() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitted(true);
    message.success(`出价 USD ${values.bid_price}/TEU 已提交，保证金已锁定`);
  };

  return (
    <div>
      <div className="page-title">竞价舱位详情</div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="竞价信息" extra={<Link to="/container-booking">返回订舱</Link>}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="竞价编号">{id}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color="red">竞价中</Tag></Descriptions.Item>
              <Descriptions.Item label="航线">上海港 → 洛杉矶港</Descriptions.Item>
              <Descriptions.Item label="船舶">中远之星 / V2024</Descriptions.Item>
              <Descriptions.Item label="剩余舱位">50 TEU</Descriptions.Item>
              <Descriptions.Item label="当前价">USD 1,450 / TEU</Descriptions.Item>
              <Descriptions.Item label="截止时间">今日 23:30</Descriptions.Item>
              <Descriptions.Item label="保证金">USD 3,000</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="竞价记录" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                { color: 'green', dot: <CheckCircleOutlined />, children: '华贸物流集团出价 USD 1,450 / TEU' },
                { color: 'blue', dot: <RiseOutlined />, children: '远洋供应链出价 USD 1,420 / TEU' },
                { color: 'gray', dot: <ClockCircleOutlined />, children: '竞价场次开启' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="提交出价">
            <Form form={form} layout="vertical">
              <Form.Item name="bid_price" label="出价金额(USD/TEU)" rules={[{ required: true, message: '请输入出价金额' }]}>
                <InputNumber min={1451} style={{ width: '100%' }} placeholder="需高于当前价" />
              </Form.Item>
              <Form.Item name="slot_count" label="采购舱位(TEU)" rules={[{ required: true, message: '请输入舱位数量' }]}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="合同、单证或装箱要求" />
              </Form.Item>
              <Button type="primary" block icon={<RiseOutlined />} onClick={handleSubmit}>
                确认提交出价
              </Button>
            </Form>
            {submitted && (
              <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                出价单已提交，USD 3,000 保证金已锁定。系统已生成报价记录，可在订单中心继续跟踪履约状态。
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default BidDetail;
