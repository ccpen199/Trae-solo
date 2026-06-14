import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Steps, Form, Input, Select, InputNumber, Button, Card, Descriptions, Space, message, Cascader, Row, Col, Spin, DatePicker } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer, UploadPro } from '@/components/common';
import { getPlaceDetail, updatePlace, PLACE_TYPE_MAP } from '@/services/api/place';
import type { Place, PlaceType, PlaceCreateParams, PlaceCertificate, PlaceCertificateDetail, CertStatus } from '@/services/api/place';
import { getCityList, getDistrictList, province } from '@/utils/region';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;

const placeTypeOptions = Object.entries(PLACE_TYPE_MAP).map(([value, label]) => ({ value, label: label as string }));

const regionOptions = [
  {
    value: province.code,
    label: province.name,
    children: getCityList().map(city => ({
      value: city.name,
      label: city.name,
      children: getDistrictList(city.code).map(district => ({
        value: district.name,
        label: district.name,
      })),
    })),
  },
];

const phonePattern = /^1[3-9]\d{9}$/;

const PlaceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [certForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [fireFiles, setFireFiles] = useState<UploadFile[]>([]);
  const [securityFiles, setSecurityFiles] = useState<UploadFile[]>([]);
  const [businessFiles, setBusinessFiles] = useState<UploadFile[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [certValues, setCertValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getPlaceDetail(id);
        if (res.data) {
          const data = res.data;
          setPlace(data);

          form.setFieldsValue({
            name: data.name,
            type: data.type,
            legalPerson: data.legalPerson,
            phone: data.phone,
            contactPerson: data.contactPerson,
            region: [province.code, data.city, data.district],
            address: data.address,
            businessHours: data.businessHours,
            computerCount: data.computerCount,
            area: data.area,
            description: data.description,
          });

          setFormValues({
            name: data.name,
            type: data.type,
            legalPerson: data.legalPerson,
            phone: data.phone,
            contactPerson: data.contactPerson,
            region: [province.code, data.city, data.district],
            address: data.address,
            businessHours: data.businessHours,
            computerCount: data.computerCount,
            area: data.area,
            description: data.description,
          });

          if (data.certificates) {
            const fire = data.certificates.find(c => c.type === 'fire');
            const security = data.certificates.find(c => c.type === 'security');
            const business = data.certificates.find(c => c.type === 'business');

            if (fire) {
              setFireFiles([{ uid: '-1', name: fire.name, status: 'done', url: fire.url }]);
            }
            if (security) {
              setSecurityFiles([{ uid: '-2', name: security.name, status: 'done', url: security.url }]);
            }
            if (business) {
              setBusinessFiles([{ uid: '-3', name: business.name, status: 'done', url: business.url }]);
            }
          }

          if (data.certificateDetails) {
            const certFieldValues: Record<string, any> = {};
            const certStoredValues: Record<string, any> = {};

            const fire = data.certificateDetails.find(c => c.type === 'fire');
            const security = data.certificateDetails.find(c => c.type === 'security');
            const business = data.certificateDetails.find(c => c.type === 'business');

            if (fire) {
              certFieldValues.fireCertNo = fire.certNo;
              certFieldValues.fireIssueOrg = fire.issueOrg;
              certFieldValues.fireIssueDate = fire.issueDate ? dayjs(fire.issueDate) : undefined;
              certFieldValues.fireExpiryDate = fire.expiryDate ? dayjs(fire.expiryDate) : undefined;
              certStoredValues.fireCertNo = fire.certNo;
              certStoredValues.fireIssueOrg = fire.issueOrg;
              certStoredValues.fireIssueDate = fire.issueDate ? dayjs(fire.issueDate) : undefined;
              certStoredValues.fireExpiryDate = fire.expiryDate ? dayjs(fire.expiryDate) : undefined;
            }
            if (security) {
              certFieldValues.securityCertNo = security.certNo;
              certFieldValues.securityIssueOrg = security.issueOrg;
              certFieldValues.securityIssueDate = security.issueDate ? dayjs(security.issueDate) : undefined;
              certFieldValues.securityExpiryDate = security.expiryDate ? dayjs(security.expiryDate) : undefined;
              certStoredValues.securityCertNo = security.certNo;
              certStoredValues.securityIssueOrg = security.issueOrg;
              certStoredValues.securityIssueDate = security.issueDate ? dayjs(security.issueDate) : undefined;
              certStoredValues.securityExpiryDate = security.expiryDate ? dayjs(security.expiryDate) : undefined;
            }
            if (business) {
              certFieldValues.businessCertNo = business.certNo;
              certFieldValues.businessIssueOrg = business.issueOrg;
              certFieldValues.businessIssueDate = business.issueDate ? dayjs(business.issueDate) : undefined;
              certFieldValues.businessExpiryDate = business.expiryDate ? dayjs(business.expiryDate) : undefined;
              certStoredValues.businessCertNo = business.certNo;
              certStoredValues.businessIssueOrg = business.issueOrg;
              certStoredValues.businessIssueDate = business.issueDate ? dayjs(business.issueDate) : undefined;
              certStoredValues.businessExpiryDate = business.expiryDate ? dayjs(business.expiryDate) : undefined;
            }

            certForm.setFieldsValue(certFieldValues);
            setCertValues(certStoredValues);
          }
        }
      } catch {
        message.error('获取场所信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, form, certForm]);

  const handleNext = useCallback(async () => {
    try {
      if (currentStep === 0) {
        const values = await form.validateFields([
          'name', 'type', 'legalPerson', 'phone', 'contactPerson',
          'region', 'address', 'businessHours', 'computerCount', 'area',
        ]);
        setFormValues(prev => ({ ...prev, ...values }));
      }
      if (currentStep === 1) {
        const values = await certForm.validateFields();
        setCertValues(prev => ({ ...prev, ...values }));
      }
      setCurrentStep(currentStep + 1);
    } catch {
      message.warning('请完善必填信息');
    }
  }, [currentStep, form, certForm]);

  const handlePrev = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const region = formValues.region || [];
      const certificates: PlaceCertificate[] = [];
      const certificateDetails: PlaceCertificateDetail[] = [];

      if (fireFiles.length > 0 || certValues.fireCertNo) {
        const cert: PlaceCertificateDetail = {
          type: 'fire',
          typeName: '消防许可证',
          certNo: certValues.fireCertNo || '',
          issueOrg: certValues.fireIssueOrg || '',
          issueDate: certValues.fireIssueDate?.format('YYYY-MM-DD') || '',
          expiryDate: certValues.fireExpiryDate?.format('YYYY-MM-DD') || '',
          url: fireFiles[0]?.url || fireFiles[0]?.thumbUrl || '',
          name: fireFiles[0]?.name || '',
          status: certValues.fireExpiryDate ? getCertStatusFromExpiry(certValues.fireExpiryDate.format('YYYY-MM-DD')) : 'not_uploaded',
        };
        certificateDetails.push(cert);
        if (fireFiles.length > 0) {
          certificates.push({ type: 'fire', typeName: '消防许可证', url: cert.url, name: cert.name });
        }
      }

      if (securityFiles.length > 0 || certValues.securityCertNo) {
        const cert: PlaceCertificateDetail = {
          type: 'security',
          typeName: '治安许可证',
          certNo: certValues.securityCertNo || '',
          issueOrg: certValues.securityIssueOrg || '',
          issueDate: certValues.securityIssueDate?.format('YYYY-MM-DD') || '',
          expiryDate: certValues.securityExpiryDate?.format('YYYY-MM-DD') || '',
          url: securityFiles[0]?.url || securityFiles[0]?.thumbUrl || '',
          name: securityFiles[0]?.name || '',
          status: certValues.securityExpiryDate ? getCertStatusFromExpiry(certValues.securityExpiryDate.format('YYYY-MM-DD')) : 'not_uploaded',
        };
        certificateDetails.push(cert);
        if (securityFiles.length > 0) {
          certificates.push({ type: 'security', typeName: '治安许可证', url: cert.url, name: cert.name });
        }
      }

      if (businessFiles.length > 0 || certValues.businessCertNo) {
        const cert: PlaceCertificateDetail = {
          type: 'business',
          typeName: '营业执照',
          certNo: certValues.businessCertNo || '',
          issueOrg: certValues.businessIssueOrg || '',
          issueDate: certValues.businessIssueDate?.format('YYYY-MM-DD') || '',
          expiryDate: certValues.businessExpiryDate?.format('YYYY-MM-DD') || '',
          url: businessFiles[0]?.url || businessFiles[0]?.thumbUrl || '',
          name: businessFiles[0]?.name || '',
          status: certValues.businessExpiryDate ? getCertStatusFromExpiry(certValues.businessExpiryDate.format('YYYY-MM-DD')) : 'not_uploaded',
        };
        certificateDetails.push(cert);
        if (businessFiles.length > 0) {
          certificates.push({ type: 'business', typeName: '营业执照', url: cert.url, name: cert.name });
        }
      }

      const params: Partial<PlaceCreateParams> = {
        name: formValues.name,
        type: formValues.type as PlaceType,
        legalPerson: formValues.legalPerson,
        phone: formValues.phone,
        contactPerson: formValues.contactPerson,
        province: province.name,
        city: region[1] || '',
        district: region[2] || '',
        regionCode: region[0] || '',
        address: formValues.address,
        businessHours: formValues.businessHours,
        computerCount: formValues.computerCount || 0,
        area: formValues.area || 0,
        description: formValues.description || '',
        certificates,
        certificateDetails,
        images: [],
        capacity: formValues.computerCount || 0,
      };

      await updatePlace(id, params);
      message.success('场所信息更新成功');
      navigate(`/places/detail/${id}`);
    } catch {
      message.error('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [id, formValues, certValues, fireFiles, securityFiles, businessFiles, navigate]);

  const renderStep1 = () => (
    <Form form={form} layout="vertical">
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="场所名称"
            rules={[{ required: true, message: '请输入场所名称' }]}
          >
            <Input placeholder="请输入场所名称" maxLength={50} showCount />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="type"
            label="场所类型"
            rules={[{ required: true, message: '请选择场所类型' }]}
          >
            <Select placeholder="请选择场所类型" options={placeTypeOptions} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="legalPerson"
            label="法人"
            rules={[{ required: true, message: '请输入法人姓名' }]}
          >
            <Input placeholder="请输入法人姓名" maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: phonePattern, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入联系电话" maxLength={11} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            name="contactPerson"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="region"
            label="所属区域"
            rules={[{ required: true, message: '请选择所属区域' }]}
          >
            <Cascader
              options={regionOptions}
              placeholder="请选择省/市/区"
              changeOnSelect
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        label="详细地址"
        rules={[{ required: true, message: '请输入详细地址' }]}
      >
        <Input placeholder="请输入详细地址" maxLength={100} showCount />
      </Form.Item>

      <Row gutter={24}>
        <Col span={8}>
          <Form.Item
            name="businessHours"
            label="营业时间"
            rules={[{ required: true, message: '请输入营业时间' }]}
          >
            <Input placeholder="如 08:00-24:00" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="computerCount"
            label="电脑台数"
            rules={[{ required: true, message: '请输入电脑台数' }]}
          >
            <InputNumber min={0} max={9999} className="w-full" placeholder="请输入" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="area"
            label="面积（㎡）"
            rules={[{ required: true, message: '请输入面积' }]}
          >
            <InputNumber min={0} max={99999} className="w-full" placeholder="请输入" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="场所描述">
        <TextArea rows={4} placeholder="请输入场所描述" maxLength={500} showCount />
      </Form.Item>
    </Form>
  );

  const getCertStatusFromExpiry = (expiryDate: string): CertStatus => {
    if (!expiryDate) return 'not_uploaded';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'valid';
  };

  const renderCertSection = (
    prefix: string,
    title: string,
    files: UploadFile[],
    onFilesChange: (files: UploadFile[]) => void,
  ) => (
    <Card size="small" title={title} className="mb-4 shadow-sm">
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name={`${prefix}CertNo`}
              label="证照编号"
              rules={[{ required: true, message: '请输入证照编号' }]}
            >
              <Input placeholder="请输入证照编号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={`${prefix}IssueOrg`}
              label="发证机关"
              rules={[{ required: true, message: '请输入发证机关' }]}
            >
              <Input placeholder="请输入发证机关" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={`${prefix}IssueDate`}
              label="发证日期"
              rules={[{ required: true, message: '请选择发证日期' }]}
            >
              <DatePicker className="w-full" placeholder="请选择发证日期" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name={`${prefix}ExpiryDate`}
              label="有效期至"
              rules={[{ required: true, message: '请选择有效期' }]}
            >
              <DatePicker className="w-full" placeholder="请选择有效期" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="证照扫描件">
              <UploadPro
                value={files}
                onChange={onFilesChange}
                uploadType="certificate"
                maxCount={1}
                buttonText={`上传${title}`}
                description="支持jpg/png格式，不超过5MB"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  const renderStep2 = () => (
    <Form form={certForm} layout="vertical">
      {renderCertSection('fire', '消防许可证', fireFiles, setFireFiles)}
      {renderCertSection('security', '治安许可证', securityFiles, setSecurityFiles)}
      {renderCertSection('business', '营业执照', businessFiles, setBusinessFiles)}
    </Form>
  );

  const renderStep3 = () => {
    const region = formValues.region || [];
    const regionText = `${province.name}${region[1] || ''}${region[2] || ''}`;

    return (
      <Card title="信息确认" size="small">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="场所名称">{formValues.name}</Descriptions.Item>
          <Descriptions.Item label="场所类型">
            {PLACE_TYPE_MAP[formValues.type as PlaceType] || formValues.type}
          </Descriptions.Item>
          <Descriptions.Item label="法人">{formValues.legalPerson}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{formValues.phone}</Descriptions.Item>
          <Descriptions.Item label="联系人">{formValues.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="所属区域">{regionText}</Descriptions.Item>
          <Descriptions.Item label="详细地址" span={3}>{formValues.address}</Descriptions.Item>
          <Descriptions.Item label="营业时间">{formValues.businessHours}</Descriptions.Item>
          <Descriptions.Item label="电脑台数">{formValues.computerCount}</Descriptions.Item>
          <Descriptions.Item label="面积">{formValues.area ? `${formValues.area}㎡` : '-'}</Descriptions.Item>
          {formValues.description && (
            <Descriptions.Item label="描述" span={3}>{formValues.description}</Descriptions.Item>
          )}
        </Descriptions>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">证件信息</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'fire', title: '消防许可证', files: fireFiles },
              { key: 'security', title: '治安许可证', files: securityFiles },
              { key: 'business', title: '营业执照', files: businessFiles },
            ].map(({ key, title, files }) => (
              <Card key={key} size="small" className="shadow-sm">
                <div className="text-sm font-medium mb-2">{title}</div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="证照编号">{certValues[`${key}CertNo`] || '-'}</Descriptions.Item>
                  <Descriptions.Item label="发证机关">{certValues[`${key}IssueOrg`] || '-'}</Descriptions.Item>
                  <Descriptions.Item label="发证日期">{certValues[`${key}IssueDate`]?.format('YYYY-MM-DD') || '-'}</Descriptions.Item>
                  <Descriptions.Item label="有效期至">{certValues[`${key}ExpiryDate`]?.format('YYYY-MM-DD') || '-'}</Descriptions.Item>
                </Descriptions>
                <div className={`w-full h-10 flex items-center justify-center rounded border mt-2 ${files.length > 0 ? 'border-green-300 bg-green-50' : 'border-neutral-200 bg-neutral-50'}`}>
                  {files.length > 0 ? (
                    <span className="text-green-500 text-xs">已上传扫描件</span>
                  ) : (
                    <span className="text-neutral-400 text-xs">未上传扫描件</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  const steps = [
    { title: '基本信息', description: '修改场所基本资料' },
    { title: '证件上传', description: '更新相关许可证照' },
    { title: '提交确认', description: '确认并保存修改' },
  ];

  if (loading) {
    return (
      <PageContainer title="编辑场所">
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="编辑场所"
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </Space>
      }
    >
      <Card className="mb-6">
        <Steps current={currentStep} items={steps} />
      </Card>

      <Card>
        <div className="min-h-[400px]">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
          {currentStep > 0 && (
            <Button onClick={handlePrev}>上一步</Button>
          )}
          {currentStep < 2 && (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          )}
          {currentStep === 2 && (
            <Space>
              <Button onClick={handlePrev}>上一步</Button>
              <Button type="primary" loading={submitting} onClick={handleSubmit}>
                保存修改
              </Button>
            </Space>
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default PlaceEditPage;
