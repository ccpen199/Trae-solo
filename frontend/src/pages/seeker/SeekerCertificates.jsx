import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Row, Col, Upload, message,
  Modal, List, Tag, DatePicker, Descriptions, Spin, Empty
} from 'antd';
import {
  PlusOutlined, UploadOutlined, ScanOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined,
  ClockCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const SeekerCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrModalVisible, setOcrModalVisible] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/job-seekers/certificates');
      setCertificates(res.data.certificates || []);
    } catch (e) {
      message.error('加载证书列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('请上传证书扫描件');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('scan_file', fileList[0].originFileObj);
      formData.append('certificate_name', values.certificate_name);
      formData.append('issuing_authority', values.issuing_authority);
      if (values.issue_date) {
        formData.append('issue_date', values.issue_date.format('YYYY-MM-DD'));
      }
      formData.append('certificate_no', values.certificate_no || '');

      const res = await api.post('/job-seekers/certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      message.success('证书上传成功');
      
      if (res.data.ocrData) {
        setOcrResult({
          name: values.certificate_name,
          text: res.data.ocrData,
        });
        setOcrModalVisible(true);
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchCertificates();
    } catch (e) {
      message.error(e.response?.data?.error || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (cert) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${cert.certificate_name}」证书吗？`,
      onOk: async () => {
        try {
          await api.delete(`/job-seekers/certificates/${cert.id}`);
          message.success('删除成功');
          fetchCertificates();
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const getStatusTag = (cert) => {
    if (cert.verified === 1) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="green">
          已核验
        </Tag>
      );
    } else if (cert.ocr_data) {
      return (
        <Tag icon={<ScanOutlined />} color="blue">
          已OCR识别
        </Tag>
      );
    }
    return (
      <Tag icon={<ClockCircleOutlined />} color="orange">
        待核验
      </Tag>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header">
        <h2>技能证书管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setFileList([]);
            setModalVisible(true);
          }}
        >
          添加证书
        </Button>
      </div>

      <Card
        className="card-shadow"
        style={{ marginBottom: 24 }}
        title="上传说明"
        size="small"
      >
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32, color: '#1677ff' }}><ScanOutlined /></div>
              <div>
                <div style={{ fontWeight: 600 }}>OCR自动识别</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>系统自动识别证书文字信息</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32, color: '#52c41a' }}><CheckCircleOutlined /></div>
              <div>
                <div style={{ fontWeight: 600 }}>人工核验</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>管理员核验后获得更高权重</div>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32, color: '#faad14' }}><FileTextOutlined /></div>
              <div>
                <div style={{ fontWeight: 600 }}>匹配加分</div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>已核验证书在匹配中获得加分</div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : certificates.length === 0 ? (
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="暂无证书，点击右上角添加您的技能证书"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {certificates.map(cert => (
            <Col xs={24} sm={12} lg={8} key={cert.id}>
              <Card
                className="certificate-card"
                actions={[
                  cert.ocr_data && (
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setOcrResult({
                          name: cert.certificate_name,
                          text: cert.ocr_data,
                        });
                        setOcrModalVisible(true);
                      }}
                    >
                      查看OCR
                    </Button>
                  ),
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(cert)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div className="cert-name">{cert.certificate_name}</div>
                    {getStatusTag(cert)}
                  </div>
                  <div className="cert-authority">{cert.issuing_authority || '-'}</div>
                  {cert.certificate_no && (
                    <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                      证书编号：{cert.certificate_no}
                    </div>
                  )}
                  <div className="cert-date">
                    发证日期：{cert.issue_date ? dayjs(cert.issue_date).format('YYYY-MM-DD') : '未填写'}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="添加技能证书"
        open={modalVisible}
        onOk={handleUpload}
        onCancel={() => setModalVisible(false)}
        confirmLoading={uploading}
        okText="上传并识别"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificate_name"
                label="证书名称"
                rules={[{ required: true, message: '请输入证书名称' }]}
              >
                <Input placeholder="例如：数控车工高级技师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="issuing_authority"
                label="发证机关"
                rules={[{ required: true, message: '请输入发证机关' }]}
              >
                <Input placeholder="例如：人力资源和社会保障部" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issue_date"
                label="发证日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="certificate_no"
                label="证书编号"
              >
                <Input placeholder="请输入证书编号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="证书扫描件"
            required
            extra="支持 JPG、PNG、PDF 格式，OCR 将自动识别证书内容"
          >
            <Upload
              listType="picture"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList)}
              accept="image/*,.pdf"
              maxCount={1}
            >
              <div className="upload-area">
                <div className="upload-icon"><UploadOutlined /></div>
                <div className="upload-text">点击或拖拽上传证书扫描件</div>
                <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 8 }}>
                  支持 JPG、PNG、PDF，最大 10MB
                </div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <span>
            <ScanOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            OCR 识别结果 - {ocrResult?.name}
          </span>
        }
        open={ocrModalVisible}
        onCancel={() => setOcrModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setOcrModalVisible(false)}>
            确定
          </Button>,
        ]}
        width={700}
      >
        <div style={{
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#389e0d', fontWeight: 600 }}>
            <CheckCircleOutlined />
            OCR 识别完成
          </div>
          <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
            识别结果将用于岗位匹配和证书核验参考
          </div>
        </div>

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="识别文字">
            <pre style={{
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              maxHeight: 300,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: 13,
              marginBottom: 0,
            }}>
              {ocrResult?.text || '无识别结果'}
            </pre>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default SeekerCertificates;
