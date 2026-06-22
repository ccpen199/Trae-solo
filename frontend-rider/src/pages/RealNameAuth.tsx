import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Upload, message, Tag, Descriptions } from 'antd';
import {
  UploadOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import { authService } from '@/services/auth.service';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const RealNameAuth: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idCardFront, setIdCardFront] = useState<UploadFile[]>([]);
  const [idCardBack, setIdCardBack] = useState<UploadFile[]>([]);
  const [driverLicense, setDriverLicense] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        idCardNo: user.idCardNo,
      });
    }
  }, [user, form]);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
    }
    return isImage && isLt5M;
  };

  const handleSubmit = async (values: any) => {
    if (idCardFront.length === 0) {
      message.error('请上传身份证正面');
      return;
    }
    if (idCardBack.length === 0) {
      message.error('请上传身份证反面');
      return;
    }

    setSubmitting(true);
    try {
      const result = await authService.submitRealNameAuth({
        ...values,
        idCardFront: idCardFront[0]?.name || '',
        idCardBack: idCardBack[0]?.name || '',
        driverLicense: driverLicense[0]?.name || '',
      });
      updateUser({
        realNameAuditStatus: result.realNameAuditStatus,
        idCardNo: result.idCardNo,
      });
      message.success('实名认证提交成功，请等待审核');
      navigate(-1);
    } catch (error) {
      console.error('Submit real name auth error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getAuditStatusInfo = () => {
    if (!user?.realNameAuditStatus || user.realNameAuditStatus === 'pending') {
      return { color: 'gold', text: '审核中', desc: '您的实名认证正在审核中，请耐心等待' };
    }
    if (user.realNameAuditStatus === 'approved') {
      return { color: 'green', text: '已通过', desc: '您的实名认证已通过' };
    }
    if (user.realNameAuditStatus === 'rejected') {
      return { color: 'red', text: '已拒绝', desc: user.realNameAuditRemark || '您的实名认证未通过，请重新提交' };
    }
    return { color: 'default', text: user.realNameAuditStatus, desc: '' };
  };

  if (!user) {
    return <Loading fullScreen />;
  }

  const auditInfo = getAuditStatusInfo();
  const isEditable = !user.realNameAuditStatus || user.realNameAuditStatus === 'rejected';

  return (
    <div className="page-container">
      <PageHeader title="实名认证" showBack />

      <div className="p-4 space-y-4">
        {user.realNameAuditStatus && (
          <div className={`card border-${auditInfo.color}-200 bg-${auditInfo.color}-50`}>
            <div className="flex items-center gap-2 mb-2">
              <SafetyCertificateOutlined className={`text-${auditInfo.color}-500`} />
              <Tag color={auditInfo.color}>{auditInfo.text}</Tag>
            </div>
            <p className="text-sm text-gray-600">{auditInfo.desc}</p>
          </div>
        )}

        {user.realNameAuditStatus === 'approved' ? (
          <div className="card">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {user.idCardNo?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
              </Descriptions.Item>
              <Descriptions.Item label="审核时间">
                {user.realNameAuditedAt ? new Date(user.realNameAuditedAt).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={!isEditable}
          >
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <InfoCircleOutlined className="text-blue-500" />
                基本信息
              </h3>

              <Form.Item
                name="name"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入身份证上的姓名" />
              </Form.Item>

              <Form.Item
                name="idCardNo"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' },
                ]}
              >
                <Input placeholder="请输入18位身份证号" maxLength={18} />
              </Form.Item>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UploadOutlined className="text-green-500" />
                证件照片
              </h3>

              <Form.Item label="身份证正面" required>
                <Upload
                  listType="picture-card"
                  fileList={idCardFront}
                  onChange={({ fileList }) => setIdCardFront(fileList)}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  accept="image/*"
                >
                  <div>
                    <UploadOutlined />
                    <div className="mt-2 text-sm">上传正面</div>
                  </div>
                </Upload>
                <p className="text-xs text-gray-500 mt-1">请上传身份证正面（国徽面）</p>
              </Form.Item>

              <Form.Item label="身份证反面" required>
                <Upload
                  listType="picture-card"
                  fileList={idCardBack}
                  onChange={({ fileList }) => setIdCardBack(fileList)}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  accept="image/*"
                >
                  <div>
                    <UploadOutlined />
                    <div className="mt-2 text-sm">上传反面</div>
                  </div>
                </Upload>
                <p className="text-xs text-gray-500 mt-1">请上传身份证反面（头像面）</p>
              </Form.Item>

              {user.vehicleType && ['motorcycle', 'car'].includes(user.vehicleType) && (
                <Form.Item label="驾驶证">
                  <Upload
                    listType="picture-card"
                    fileList={driverLicense}
                    onChange={({ fileList }) => setDriverLicense(fileList)}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    accept="image/*"
                  >
                    <div>
                      <UploadOutlined />
                      <div className="mt-2 text-sm">上传驾照</div>
                    </div>
                  </Upload>
                  <p className="text-xs text-gray-500 mt-1">请上传驾驶证照片</p>
                </Form.Item>
              )}
            </div>

            {isEditable && (
              <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t">
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={submitting}
                >
                  提交审核
                </Button>
              </div>
            )}
          </Form>
        )}
      </div>
    </div>
  );
};

export default RealNameAuth;
