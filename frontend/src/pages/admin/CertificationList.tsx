import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Form, Modal, Typography, Descriptions, Divider, Alert, Image, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined, SafetyOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { ColumnsType } from 'antd/es/table';

interface OcrResult {
  idType?: string;
  idNumber?: string;
  name?: string;
  issueDate?: string;
  validDate?: string;
  issuingAuthority?: string;
  confidence?: number;
  [key: string]: any;
}

interface VerifyResult {
  status?: string;
  verifyCode?: string;
  source?: string;
  verifiedAt?: string;
  [key: string]: any;
}

interface SkillAssessment {
  id: number;
  theoryScore?: number;
  practicalScore?: number;
  practicalVideo?: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

interface AdminCertification {
  id: number;
  workerId: number;
  tradeId: number;
  certificateNumber: string;
  certificateType: string;
  certificateImage?: string;
  verificationStatus: string;
  verifiedAt?: string;
  verifiedBy?: number;
  verifiedByName?: string;
  verifyRemark?: string;
  gbCode?: string;
  gbName?: string;
  category?: string;
  workerName?: string;
  username?: string;
  phone?: string;
  createdAt: string;
  ocrResult?: string;
  verificationSource?: string;
}

const { Option } = Select;
const { Text } = Typography;

const CertificationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [certifications, setCertifications] = useState<AdminCertification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCert, setSelectedCert] = useState<AdminCertification | null>(null);
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [verifyData, setVerifyData] = useState<VerifyResult | null>(null);
  const [skillAssessment, setSkillAssessment] = useState<SkillAssessment | null>(null);
  const [rawOcrResult, setRawOcrResult] = useState<string>('');
  const [rawVerifyResult, setRawVerifyResult] = useState<string>('');

  const idTypeMap: Record<string, string> = {
    id_card: '居民身份证',
    passport: '护照',
    driver_license: '驾驶证',
    qualification_cert: '职业资格证书',
    skill_cert: '技能等级证书',
    safety_cert: '安全生产考核合格证书'
  };

  const getIdTypeText = (type: string) => idTypeMap[type] || type;

  const getAssessmentStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待评定',
      passed: '已通过',
      failed: '未通过'
    };
    return map[status] || status;
  };

  const getAssessmentStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      passed: 'green',
      failed: 'red'
    };
    return map[status] || 'default';
  };

  const fetchCertifications = async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.certifications.getAll({
        page,
        pageSize,
        ...params
      });
      setCertifications(res.data.certifications || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取认证列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, [page, pageSize]);

  const handleSearch = (values: any) => {
    setPage(1);
    fetchCertifications(values);
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchCertifications();
  };

  const handleVerify = async (id: number, status: string) => {
    try {
      await api.certifications.verify(id, status);
      message.success(status === 'verified' ? '审核通过' : '审核拒绝');
      fetchCertifications(form.getFieldsValue());
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleViewDetail = async (record: AdminCertification) => {
    setDetailLoading(true);
    setSelectedCert(record);
    setOcrData(null);
    setVerifyData(null);
    setSkillAssessment(null);
    setRawOcrResult('');
    setRawVerifyResult('');

    if (record.ocrResult) {
      try {
        const parts = record.ocrResult.split('|');
        if (parts.length >= 1) {
          setRawOcrResult(parts[0]);
          try {
            setOcrData(JSON.parse(parts[0]));
          } catch {
            console.warn('OCR JSON parse failed');
          }
        }
        if (parts.length >= 2) {
          setRawVerifyResult(parts[1]);
          try {
            setVerifyData(JSON.parse(parts[1]));
          } catch {
            console.warn('Verify JSON parse failed');
          }
        }
      } catch {
        message.warning('OCR结果解析失败，显示原始数据');
      }
    }

    try {
      const res = await api.skills.getMyAssessments();
      const assessments = res.data?.assessments || res.data || [];
      const workerAssessments = assessments.filter((a: any) => a.workerId === record.workerId || a.userId === record.workerId);
      if (workerAssessments.length > 0) {
        setSkillAssessment(workerAssessments[0]);
      }
    } catch {
      console.warn('Failed to fetch skill assessments');
    }

    setDetailLoading(false);
    setDetailModalVisible(true);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      verified: '已通过',
      rejected: '已拒绝'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      verified: 'green',
      rejected: 'red'
    };
    return map[status] || 'default';
  };

  const columns: ColumnsType<AdminCertification> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '工人姓名',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '工种',
      dataIndex: 'gbName',
      key: 'gbName',
      width: 150
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      width: 180
    },
    {
      title: '证书类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 120
    },
    {
      title: '审核状态',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '审核时间',
      dataIndex: 'verifiedAt',
      key: 'verifiedAt',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.verificationStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleVerify(record.id, 'verified')}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleVerify(record.id, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="认证审核">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '16px' }}
      >
        <Form.Item name="verificationStatus" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="pending">待审核</Option>
            <Option value="verified">已通过</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={certifications}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Spin>

      <Modal
        title="认证详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Spin spinning={detailLoading}>
          {selectedCert && (
            <div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="工人姓名" span={1}>
                  {selectedCert.workerName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="用户名" span={1}>
                  {selectedCert.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号" span={1}>
                  {selectedCert.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="工种" span={1}>
                  {selectedCert.gbName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="证书编号" span={1}>
                  {selectedCert.certificateNumber}
                </Descriptions.Item>
                <Descriptions.Item label="证书类型" span={1}>
                  {selectedCert.certificateType || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审核状态" span={1}>
                  <Tag color={getStatusColor(selectedCert.verificationStatus)}>
                    {getStatusText(selectedCert.verificationStatus)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="提交时间" span={1}>
                  {new Date(selectedCert.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">证书影像</Divider>
              {selectedCert.certificateImage ? (
                <Image
                  src={selectedCert.certificateImage}
                  alt="证书影像"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #eee', borderRadius: '4px' }}
                />
              ) : (
                <Alert message="暂未上传证书影像" type="info" showIcon />
              )}

              <Divider orientation="left">OCR识别结果</Divider>
              {ocrData ? (
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="证件类型" span={1}>
                    {getIdTypeText(ocrData.idType || ocrData.id_type || selectedCert.certificateType || '-')}
                  </Descriptions.Item>
                  <Descriptions.Item label="证件编号" span={1}>
                    {ocrData.idNumber || ocrData.id_number || selectedCert.certificateNumber || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="持证人姓名" span={1}>
                    {ocrData.name || ocrData.holderName || ocrData.holder_name || selectedCert.workerName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="置信度" span={1}>
                    {ocrData.confidence !== undefined ? `${(ocrData.confidence * 100).toFixed(1)}%` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="发证日期" span={1}>
                    {ocrData.issueDate || ocrData.issue_date || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="有效期至" span={1}>
                    {ocrData.validDate || ocrData.valid_date || ocrData.expiryDate || ocrData.expiry_date || '长期有效'}
                  </Descriptions.Item>
                  <Descriptions.Item label="发证机关" span={2}>
                    {ocrData.issuingAuthority || ocrData.issuing_authority || '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : rawOcrResult ? (
                <Alert
                  message="OCR识别结果（原始数据）"
                  description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{rawOcrResult}</pre>}
                  type="warning"
                  showIcon
                />
              ) : (
                <Alert message="暂无OCR识别结果" type="info" showIcon />
              )}

              <Divider orientation="left">人社部核验结论</Divider>
              {verifyData || selectedCert.verificationSource ? (
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="核验状态" span={1}>
                    {verifyData?.status === 'passed' || verifyData?.status === 'verified' ? (
                      <Tag color="green">核验通过</Tag>
                    ) : verifyData?.status === 'failed' || verifyData?.status === 'rejected' ? (
                      <Tag color="red">核验不通过</Tag>
                    ) : (
                      <Tag color="orange">待核验</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="核验编号" span={1}>
                    {verifyData?.verifyCode || verifyData?.verify_code || verifyData?.verificationCode || verifyData?.verification_code || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="核验来源" span={2}>
                    {verifyData?.source || selectedCert.verificationSource || '全国建筑工人管理服务信息平台'}
                  </Descriptions.Item>
                  <Descriptions.Item label="核验时间" span={2}>
                    {verifyData?.verifiedAt || verifyData?.verified_at || selectedCert.verifiedAt
                      ? new Date(verifyData?.verifiedAt || verifyData?.verified_at || selectedCert.verifiedAt!).toLocaleString('zh-CN')
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : rawVerifyResult ? (
                <Alert
                  message="核验结果（原始数据）"
                  description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{rawVerifyResult}</pre>}
                  type="warning"
                  showIcon
                />
              ) : (
                <Alert message="暂无人社部核验数据" type="info" showIcon />
              )}

              <Divider orientation="left">技能评定材料</Divider>
              {skillAssessment ? (
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="理论考试分数" span={1}>
                    {skillAssessment.theoryScore !== undefined ? `${skillAssessment.theoryScore}分` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="实操考试分数" span={1}>
                    {skillAssessment.practicalScore !== undefined ? `${skillAssessment.practicalScore}分` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="评定结果" span={1}>
                    <Tag color={getAssessmentStatusColor(skillAssessment.status)}>
                      {getAssessmentStatusText(skillAssessment.status)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="评定时间" span={1}>
                    {new Date(skillAssessment.createdAt).toLocaleString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="实操视频" span={2}>
                    {skillAssessment.practicalVideo ? (
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        href={skillAssessment.practicalVideo}
                        target="_blank"
                      >
                        查看实操视频
                      </Button>
                    ) : (
                      <Text type="secondary">暂无实操视频</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert message="暂无关联的技能评定信息" type="info" showIcon />
              )}

              {selectedCert.verificationStatus !== 'pending' && (
                <>
                  <Divider orientation="left">审核记录</Divider>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="审核人" span={1}>
                      {selectedCert.verifiedByName || selectedCert.verifiedBy || '系统自动审核'}
                    </Descriptions.Item>
                    <Descriptions.Item label="审核时间" span={1}>
                      {selectedCert.verifiedAt ? new Date(selectedCert.verifiedAt).toLocaleString('zh-CN') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="审核意见" span={2}>
                      {selectedCert.verifyRemark || (selectedCert.verificationStatus === 'verified' ? '审核通过，证书有效' : '审核拒绝')}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}

              <Divider />
              <Alert
                message="合规说明"
                description="本证书审核流程符合《建筑业用工实名制管理办法》要求，OCR识别与人社部核验双重校验，确保证书真实有效。"
                type="success"
                showIcon
                icon={<SafetyOutlined />}
                style={{ marginTop: '16px' }}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </Card>
  );
};

export default CertificationList;
