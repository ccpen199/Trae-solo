import { useEffect, useState } from 'react';
import {
  Card, Form, Select, Input, InputNumber, Button, message, Steps, Alert, Tag, Upload, Spin, Descriptions
} from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

export default function WithdrawalApply() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [types, setTypes] = useState({});
  const [selectedType, setSelectedType] = useState('');
  const [balance, setBalance] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationId, setApplicationId] = useState(null);
  const [verification, setVerification] = useState({
    ocr: { status: 'idle' },
    face: { status: 'idle' },
    unionPay: { status: 'idle' }
  });
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setPageLoading(true);
      const [typesRes, accountRes] = await Promise.all([
        api.get('/withdrawal/types'),
        api.get('/account/balance')
      ]);
      setTypes(typesRes.data);
      setBalance(accountRes.data.balance || 0);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setPageLoading(false);
    }
  };

  const typeConfig = types[selectedType];

  const handleTypeSelect = (value) => {
    setSelectedType(value);
    setVerification({ ocr: { status: 'idle' }, face: { status: 'idle' }, unionPay: { status: 'idle' } });
    setCurrentStep(1);
  };

  const handleVerify = async (type) => {
    setVerification(prev => ({ ...prev, [type]: { status: 'verifying' } }));
    try {
      const tempAppId = applicationId || `temp_${Date.now()}`;
      if (!applicationId) setApplicationId(tempAppId);
      await api.post(`/withdrawal/verify/${tempAppId}/${type}`);
      setVerification(prev => ({ ...prev, [type]: { status: 'success' } }));
      message.success(`${type === 'ocr' ? 'OCR身份证' : type === 'face' ? '活体人脸' : '银联'}核验通过`);
    } catch (error) {
      setVerification(prev => ({ ...prev, [type]: { status: 'failed' } }));
      message.error('核验失败，请重试');
    }
  };

  const isVerificationComplete = () => {
    if (!typeConfig) return false;
    const checks = [];
    if (typeConfig.requiresOCR) checks.push(verification.ocr.status === 'success');
    if (typeConfig.requiresFaceAuth) checks.push(verification.face.status === 'success');
    if (typeConfig.requiresUnionPay) checks.push(verification.unionPay.status === 'success');
    return checks.length > 0 ? checks.every(Boolean) : true;
  };

  const handleStep2Next = () => {
    if (!isVerificationComplete()) {
      message.warning('请完成所有必需的身份核验');
      return;
    }
    setCurrentStep(2);
  };

  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      setFormData(values);
      setCurrentStep(3);
    }).catch(() => {
      message.warning('请填写完整申请信息');
    });
  };

  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      await api.post('/withdrawal/apply', {
        ...formData,
        type: selectedType,
        verification: {
          ocr: verification.ocr.status === 'success',
          face: verification.face.status === 'success',
          unionPay: verification.unionPay.status === 'success'
        }
      });
      message.success('申请提交成功，等待审批');
      setCurrentStep(0);
      setSelectedType('');
      setFormData({});
      setApplicationId(null);
      setVerification({ ocr: { status: 'idle' }, face: { status: 'idle' }, unionPay: { status: 'idle' } });
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const renderVerifyStatus = (status) => {
    const map = {
      idle: { color: 'default', text: '未核验', icon: null },
      verifying: { color: 'processing', text: '核验中', icon: <LoadingOutlined /> },
      success: { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '未通过', icon: <CloseCircleOutlined /> }
    };
    const info = map[status] || map.idle;
    return <Tag color={info.color} icon={info.icon}>{info.text}</Tag>;
  };

  if (pageLoading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>提取申请</h2>
      <Card>
        <Alert
          message={`当前账户余额：¥${balance.toFixed(2)}`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Steps.Step title="选择提取类型" />
          <Steps.Step title="身份核验" />
          <Steps.Step title="填写申请" />
          <Steps.Step title="确认提交" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Form layout="vertical">
              <Form.Item label="提取类型" required>
                <Select
                  placeholder="请选择提取类型"
                  onChange={handleTypeSelect}
                  value={selectedType || undefined}
                >
                  {Object.entries(types).map(([key, value]) => (
                    <Option key={key} value={key}>{value.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
            {typeConfig && (
              <Alert
                message={`${typeConfig.name}说明`}
                description={
                  <div>
                    <p>{typeConfig.description}</p>
                    {typeConfig.maxAmount && <p>月提取上限：¥{typeConfig.maxAmount}</p>}
                    {typeConfig.rules && <p>提取规则：{typeConfig.rules}</p>}
                    {typeConfig.requiredDocuments && <p>所需材料：{typeConfig.requiredDocuments?.join('、')}</p>}
                    {typeConfig.approvalThreshold && <p>审批阈值：¥{typeConfig.approvalThreshold}</p>}
                  </div>
                }
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}

        {currentStep === 1 && typeConfig && (
          <div>
            <Alert
              message="身份核验"
              description="根据提取类型要求，需完成以下核验步骤"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {typeConfig.requiresOCR && (
              <Card title="OCR身份证识别" size="small" style={{ marginBottom: 16 }}
                extra={renderVerifyStatus(verification.ocr.status)}>
                <p>上传身份证正反面照片进行OCR识别核验</p>
                <Upload beforeUpload={() => false} maxCount={2} accept="image/*">
                  <Button icon={<UploadOutlined />}>上传身份证照片</Button>
                </Upload>
                <Button
                  type="primary"
                  style={{ marginLeft: 12 }}
                  onClick={() => handleVerify('ocr')}
                  loading={verification.ocr.status === 'verifying'}
                  disabled={verification.ocr.status === 'success'}
                >
                  开始识别
                </Button>
              </Card>
            )}

            {typeConfig.requiresFaceAuth && (
              <Card title="活体人脸核验" size="small" style={{ marginBottom: 16 }}
                extra={renderVerifyStatus(verification.face.status)}>
                <p>通过摄像头进行活体人脸检测，确认本人操作</p>
                <Button
                  type="primary"
                  onClick={() => handleVerify('face')}
                  loading={verification.face.status === 'verifying'}
                  disabled={verification.face.status === 'success'}
                >
                  开始人脸核验
                </Button>
              </Card>
            )}

            {typeConfig.requiresUnionPay && (
              <Card title="银联鉴权" size="small" style={{ marginBottom: 16 }}
                extra={renderVerifyStatus(verification.unionPay.status)}>
                <p>通过银联渠道验证银行卡信息</p>
                <Button
                  type="primary"
                  onClick={() => handleVerify('unionPay')}
                  loading={verification.unionPay.status === 'verifying'}
                  disabled={verification.unionPay.status === 'success'}
                >
                  开始银联鉴权
                </Button>
              </Card>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={handleStep2Next}>下一步</Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ amount: 0 }}
            >
              <Form.Item
                name="amount"
                label="提取金额"
                rules={[
                  { required: true, message: '请输入提取金额' },
                  { type: 'number', min: 1, message: '提取金额必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={typeConfig?.maxAmount ? Math.min(typeConfig.maxAmount, balance) : balance}
                  step={100}
                  addonAfter="元"
                  placeholder="请输入提取金额"
                />
              </Form.Item>

              <Form.Item
                name="reason"
                label="提取说明"
                rules={[{ required: true, message: '请填写提取说明' }]}
              >
                <TextArea rows={4} placeholder="请简要说明提取原因" />
              </Form.Item>

              <Form.Item label="材料上传">
                <Upload beforeUpload={() => false} multiple>
                  <Button icon={<UploadOutlined />}>上传材料</Button>
                </Upload>
              </Form.Item>
            </Form>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => setCurrentStep(1)}>上一步</Button>
              <Button type="primary" onClick={handleFormSubmit}>下一步</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <Alert message="请确认以下申请信息" type="warning" showIcon style={{ marginBottom: 24 }} />

            <Descriptions column={2} bordered>
              <Descriptions.Item label="提取类型">{typeConfig?.name}</Descriptions.Item>
              <Descriptions.Item label="提取金额">¥{formData.amount?.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="提取说明" span={2}>{formData.reason}</Descriptions.Item>
              <Descriptions.Item label="审批阈值">
                {typeConfig?.approvalThreshold ? `¥${typeConfig.approvalThreshold}` : '无需审批'}
              </Descriptions.Item>
              <Descriptions.Item label="核验状态">
                {verification.ocr.status === 'success' && <Tag color="green">OCR已通过</Tag>}
                {verification.face.status === 'success' && <Tag color="green">人脸已通过</Tag>}
                {verification.unionPay.status === 'success' && <Tag color="green">银联已通过</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {typeConfig?.approvalThreshold && formData.amount > typeConfig.approvalThreshold && (
              <Alert
                message="提示"
                description={`提取金额 ¥${formData.amount} 超过审批阈值 ¥${typeConfig.approvalThreshold}，需要上级审批`}
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button onClick={() => setCurrentStep(2)}>上一步</Button>
              <Button type="primary" onClick={handleConfirmSubmit} loading={loading}>
                确认提交
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
