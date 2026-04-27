import { Card, Form, Input, Select, DatePicker, InputNumber, Button, Steps, message, Row, Col, Descriptions, Tag } from 'antd';
import { useState } from 'react';
import { QrcodeOutlined, SaveOutlined, ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LivestockType, LivestockTypeLabels, Gender, GenderLabels } from '@/types';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;

const LivestockAdmission = () => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const navigate = useNavigate();

  const steps = [
    { title: '扫码识别' },
    { title: '录入信息' },
    { title: '确认提交' },
  ];

  const next = () => {
    if (current === 0) {
      setCurrent(current + 1);
    } else if (current === 1) {
      form.validateFields()
        .then((values) => {
          setPreviewData({
            ...values,
            birthDate: values.birthDate?.format('YYYY-MM-DD'),
            entryDate: values.entryDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
          });
          setCurrent(current + 1);
        })
        .catch(() => {
          message.error('请填写完整信息');
        });
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = () => {
    message.success('进场登记成功！系统已自动生成喂养计划和疫苗日历');
    setTimeout(() => {
      navigate('/livestock/list');
    }, 1500);
  };

  const handleScan = () => {
    message.info('正在模拟UHF耳标扫码...');
    setTimeout(() => {
      const mockEarTagId = 'E' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      form.setFieldValue('earTagId', mockEarTagId);
      message.success(`扫码成功，耳标编号: ${mockEarTagId}`);
    }, 1000);
  };

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Steps current={current}>
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </div>

        <div style={{ minHeight: 400 }}>
          {current === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 80, color: '#1890ff', marginBottom: 24 }}>
                <QrcodeOutlined />
              </div>
              <h3>使用UHF耳标读卡器扫描耳标</h3>
              <p style={{ color: '#999', marginBottom: 24 }}>
                将耳标靠近读卡器，系统将自动识别耳标编号
              </p>
              <Button type="primary" size="large" icon={<QrcodeOutlined />} onClick={handleScan}>
                模拟扫码
              </Button>
              <div style={{ marginTop: 24 }}>
                <Form form={form} layout="inline" style={{ justifyContent: 'center' }}>
                  <Form.Item
                    name="earTagId"
                    label="耳标编号"
                    rules={[{ required: true, message: '请扫码或手动输入耳标编号' }]}
                  >
                    <Input
                      placeholder="请扫描耳标或手动输入"
                      style={{ width: 200 }}
                      className="ear-tag-input"
                    />
                  </Form.Item>
                </Form>
              </div>
            </div>
          )}

          {current === 1 && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                source: '外购',
                entryDate: dayjs(),
              }}
            >
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="livestockType"
                    label="牲畜类型"
                    rules={[{ required: true, message: '请选择牲畜类型' }]}
                  >
                    <Select placeholder="请选择牲畜类型">
                      {Object.entries(LivestockTypeLabels).map(([key, label]) => (
                        <Select.Option key={key} value={key}>{label}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="breed"
                    label="品种"
                    rules={[{ required: true, message: '请输入品种' }]}
                  >
                    <Input placeholder="如：杜洛克、长白、西门塔尔等" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Select placeholder="请选择性别">
                      {Object.entries(GenderLabels).map(([key, label]) => (
                        <Select.Option key={key} value={key}>{label}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="birthDate"
                    label="出生日期"
                    rules={[{ required: true, message: '请选择出生日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="entryWeight"
                    label="进场重量 (kg)"
                    rules={[{ required: true, message: '请输入进场重量' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      precision={1}
                      placeholder="请输入进场重量"
                      className="weight-input"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="source"
                    label="来源"
                    rules={[{ required: true, message: '请选择来源' }]}
                  >
                    <Select placeholder="请选择来源">
                      <Select.Option value="自繁">自繁</Select.Option>
                      <Select.Option value="外购">外购</Select.Option>
                      <Select.Option value="调入">调入</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="barnId"
                    label="栏舍"
                    rules={[{ required: true, message: '请选择栏舍' }]}
                  >
                    <Select placeholder="请选择栏舍">
                      <Select.Option value="A-01">育肥舍 A-01</Select.Option>
                      <Select.Option value="A-02">育肥舍 A-02</Select.Option>
                      <Select.Option value="B-01">母牛舍 B-01</Select.Option>
                      <Select.Option value="C-01">仔猪舍 C-01</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="penId"
                    label="栏位"
                    rules={[{ required: true, message: '请选择栏位' }]}
                  >
                    <Select placeholder="请选择栏位">
                      <Select.Option value="A-01-01">栏位 01</Select.Option>
                      <Select.Option value="A-01-02">栏位 02</Select.Option>
                      <Select.Option value="A-01-03">栏位 03</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="备注">
                <TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
            </Form>
          )}

          {current === 2 && previewData && (
            <div>
              <Card size="small" title="进场信息确认" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="耳标编号">
                    <Tag color="blue">{previewData.earTagId as string}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="牲畜类型">
                    {LivestockTypeLabels[previewData.livestockType as keyof typeof LivestockTypeLabels]}
                  </Descriptions.Item>
                  <Descriptions.Item label="品种">{previewData.breed as string}</Descriptions.Item>
                  <Descriptions.Item label="性别">
                    {GenderLabels[previewData.gender as keyof typeof GenderLabels]}
                  </Descriptions.Item>
                  <Descriptions.Item label="出生日期">{previewData.birthDate as string}</Descriptions.Item>
                  <Descriptions.Item label="进场重量">{previewData.entryWeight as number} kg</Descriptions.Item>
                  <Descriptions.Item label="来源">{previewData.source as string}</Descriptions.Item>
                  <Descriptions.Item label="栏舍/栏位">
                    {previewData.barnId as string} / {previewData.penId as string}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card size="small" title="系统将自动生成" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <div style={{ padding: 16, background: '#e6f7ff', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
                        <CheckOutlined />
                      </div>
                      <div style={{ fontWeight: 'bold' }}>品种生长基准线</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ padding: 16, background: '#f6ffed', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>
                        <CheckOutlined />
                      </div>
                      <div style={{ fontWeight: 'bold' }}>喂养计划</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ padding: 16, background: '#fff7e6', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }}>
                        <CheckOutlined />
                      </div>
                      <div style={{ fontWeight: 'bold' }}>疫苗日历</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {current > 0 && (
            <Button style={{ margin: '0 8px' }} icon={<ArrowLeftOutlined />} onClick={prev}>
              上一步
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              下一步
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={handleSubmit} icon={<SaveOutlined />}>
              确认提交
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LivestockAdmission;
