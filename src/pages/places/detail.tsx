import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Timeline, Image, Modal, Input, Spin, message, Empty, Tag,
  Tabs, Badge, Alert, Table,
} from 'antd';
import {
  EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined,
  WarningOutlined, PaperClipOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { PageContainer, StatusTag, Desensitize, UploadPro } from '@/components/common';
import {
  getPlaceDetail, reviewPlace, recheckRectification,
  PLACE_TYPE_MAP, PLACE_STATUS_MAP, CERT_STATUS_MAP,
  RECTIFICATION_STATUS_MAP, RECTIFICATION_SOURCE_MAP, AUDIT_ACTION_MAP,
} from '@/services/api/place';
import type {
  Place, PlaceCertificateDetail, PlaceRectificationRecord,
} from '@/services/api/place';
import usePermission from '@/hooks/usePermission';

const { TextArea } = Input;

const PlaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canReview = hasPermission('place:review');
  const canEdit = hasPermission('place:edit');

  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState<Place | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewRemark, setReviewRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [recheckModalVisible, setRecheckModalVisible] = useState(false);
  const [recheckRecord, setRecheckRecord] = useState<PlaceRectificationRecord | null>(null);
  const [recheckResult, setRecheckResult] = useState<'passed' | 'failed'>('passed');
  const [recheckOpinion, setRecheckOpinion] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getPlaceDetail(id);
      if (res.data) {
        setPlace(res.data);
      }
    } catch {
      message.error('获取场所信息失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = useCallback(async () => {
    if (!place) return;
    setSubmitting(true);
    try {
      await reviewPlace({
        id: place.id,
        status: reviewStatus,
        reason: reviewRemark,
      });
      message.success(reviewStatus === 'approved' ? '审核通过' : '已驳回');
      setReviewModalVisible(false);
      fetchData();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }, [place, reviewStatus, reviewRemark, fetchData]);

  const handleRecheck = useCallback(async () => {
    if (!recheckRecord) return;
    if (!recheckOpinion.trim()) {
      message.warning('请输入复查意见');
      return;
    }
    setSubmitting(true);
    try {
      await recheckRectification(recheckRecord.id, recheckResult, recheckOpinion);
      message.success('复查结果已提交');
      setRecheckModalVisible(false);
      fetchData();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }, [recheckRecord, recheckResult, recheckOpinion, fetchData]);

  const renderBasicInfo = () => {
    if (!place) return null;
    const statusConfig = PLACE_STATUS_MAP[place.status];

    return (
      <div>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="场所名称">{place.name}</Descriptions.Item>
          <Descriptions.Item label="场所类型">{PLACE_TYPE_MAP[place.type] || place.typeName}</Descriptions.Item>
          <Descriptions.Item label="备案状态">
            {statusConfig ? <StatusTag status={statusConfig.status} text={statusConfig.text} /> : place.status}
          </Descriptions.Item>
          <Descriptions.Item label="法人">{place.legalPerson}</Descriptions.Item>
          <Descriptions.Item label="联系电话">
            <Desensitize value={place.phone} type="phone" allowToggle />
          </Descriptions.Item>
          <Descriptions.Item label="联系人">{place.contactPerson}</Descriptions.Item>
          <Descriptions.Item label="所属区域" span={2}>
            {place.province}{place.city}{place.district}
          </Descriptions.Item>
          <Descriptions.Item label="详细地址" span={3}>{place.address}</Descriptions.Item>
          <Descriptions.Item label="营业时间">{place.businessHours}</Descriptions.Item>
          <Descriptions.Item label="电脑台数">{place.computerCount ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="面积">{place.area ? `${place.area}㎡` : '-'}</Descriptions.Item>
          <Descriptions.Item label="容量">{place.capacity ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{place.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{place.updatedAt}</Descriptions.Item>
          {place.approvedAt && <Descriptions.Item label="审核时间">{place.approvedAt}</Descriptions.Item>}
          {place.approvedBy && <Descriptions.Item label="审核人">{place.approvedBy}</Descriptions.Item>}
          {place.rejectReason && (
            <Descriptions.Item label="驳回原因" span={3}>
              <span className="text-red-500">{place.rejectReason}</span>
            </Descriptions.Item>
          )}
          {place.description && (
            <Descriptions.Item label="描述" span={3}>{place.description}</Descriptions.Item>
          )}
        </Descriptions>

        {place.images && place.images.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-neutral-700 mb-3">场所照片</h4>
            <div className="flex flex-wrap gap-3">
              {place.images.map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`场所照片${idx + 1}`}
                  width={120}
                  height={90}
                  className="object-cover rounded border border-neutral-200"
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCertExpiryWarning = (cert: PlaceCertificateDetail) => {
    if (cert.status !== 'expiring_soon') return null;
    const daysLeft = Math.ceil((new Date(cert.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <Alert
        message={`${cert.typeName}即将过期`}
        description={`距过期仅剩 ${daysLeft} 天，请及时续期`}
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        className="mb-3"
        banner
      />
    );
  };

  const renderCertificateCard = (cert: PlaceCertificateDetail) => {
    const statusConfig = CERT_STATUS_MAP[cert.status];

    return (
      <Card
        key={cert.type}
        size="small"
        title={
          <div className="flex items-center gap-2">
            <span>{cert.typeName}</span>
            {statusConfig && <Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
          </div>
        }
        className="shadow-sm"
      >
        {renderCertExpiryWarning(cert)}

        {cert.status === 'not_uploaded' ? (
          <div className="py-8 text-center">
            <div className="text-neutral-400 mb-3">
              <FileTextOutlined style={{ fontSize: 32 }} />
            </div>
            <p className="text-neutral-500 text-sm mb-3">尚未上传证照</p>
            <UploadPro
              uploadType="certificate"
              maxCount={1}
              buttonText={`上传${cert.typeName}`}
              description="支持jpg/png格式，不超过5MB"
            />
          </div>
        ) : (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="证照编号">{cert.certNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="发证机关">{cert.issueOrg || '-'}</Descriptions.Item>
              <Descriptions.Item label="发证日期">{cert.issueDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="有效期至">
                <span className={cert.status === 'expired' ? 'text-red-500' : cert.status === 'expiring_soon' ? 'text-orange-500' : ''}>
                  {cert.expiryDate || '-'}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-3">
              <h5 className="text-xs text-neutral-500 mb-2">证照扫描件</h5>
              {cert.url ? (
                <Image
                  src={cert.url}
                  alt={cert.name}
                  width={160}
                  height={120}
                  className="object-contain border border-neutral-200 rounded"
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
                />
              ) : (
                <div className="w-40 h-30 flex items-center justify-center border border-neutral-200 rounded bg-neutral-50">
                  <span className="text-neutral-400 text-sm">暂无扫描件</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderCertificates = () => {
    if (!place) return null;
    const details = place.certificateDetails || [];

    if (details.length === 0) {
      return <Empty description="暂无证照信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {details.map(cert => renderCertificateCard(cert))}
      </div>
    );
  };

  const renderAuditRecords = () => {
    if (!place) return null;
    const records = place.auditRecords || [];

    if (records.length === 0) {
      return <Empty description="暂无审核记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <Timeline
        items={records.map(record => {
          const actionConfig = AUDIT_ACTION_MAP[record.action];
          const color = actionConfig?.color || 'gray';

          return {
            color,
            dot: record.action === 'approve' || record.action === 'submit'
              ? <CheckCircleOutlined style={{ color: record.action === 'approve' ? '#52c41a' : '#1890ff' }} />
              : record.action === 'reject'
                ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                : undefined,
            children: (
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag color={color}>{record.actionName}</Tag>
                  <span className="text-neutral-500 text-sm">{record.operator}</span>
                  <span className="text-neutral-400 text-xs">{record.time}</span>
                </div>
                {record.remark && (
                  <div className="text-sm text-neutral-600 mb-2 bg-neutral-50 p-2 rounded">
                    {record.remark}
                  </div>
                )}
                {record.result && (
                  <div className="mb-1">
                    <span className="text-xs text-neutral-500">审核结果：</span>
                    <Tag color={
                      record.result === 'approved' ? 'success'
                        : record.result === 'rejected' ? 'error'
                        : 'processing'
                    }>
                      {record.result === 'approved' ? '通过'
                        : record.result === 'rejected' ? '驳回'
                        : '要求补充材料'}
                    </Tag>
                  </div>
                )}
                {record.attachments && record.attachments.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary-500">
                    <PaperClipOutlined />
                    <span>{record.attachments.join('、')}</span>
                  </div>
                )}
              </div>
            ),
          };
        })}
      />
    );
  };

  const renderRectificationRecords = () => {
    if (!place) return null;
    const records = place.rectificationRecords || [];

    if (records.length === 0) {
      return <Empty description="暂无整改记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div className="space-y-4">
        {records.map(record => {
          const statusConfig = RECTIFICATION_STATUS_MAP[record.status];
          const sourceName = RECTIFICATION_SOURCE_MAP[record.source] || record.sourceName;

          return (
            <Card key={record.id} size="small" className="shadow-sm border border-neutral-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color="blue">{sourceName}</Tag>
                    {statusConfig && <Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
                  </div>
                  <div className="text-sm font-medium text-neutral-800 mb-1">{record.content}</div>
                  <div className="text-sm text-neutral-500">整改要求：{record.requirement}</div>
                </div>
                <div className="text-right text-xs text-neutral-400 shrink-0 ml-4">
                  <div>截止日期：{record.deadline}</div>
                  <div>创建时间：{record.createdAt}</div>
                </div>
              </div>

              {record.submitMaterial && (
                <div className="bg-blue-50 p-3 rounded mb-3">
                  <div className="text-sm font-medium text-neutral-700 mb-2">整改提交材料</div>
                  <div className="text-sm text-neutral-600 mb-1">{record.submitMaterial.description}</div>
                  <div className="text-xs text-neutral-400">提交时间：{record.submitMaterial.submitTime}</div>
                  {record.submitMaterial.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {record.submitMaterial.photos.map((photo, idx) => (
                        <Image
                          key={idx}
                          src={photo}
                          alt={`整改照片${idx + 1}`}
                          width={80}
                          height={60}
                          className="object-cover rounded border"
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {record.recheckRecord && (
                <div className={`p-3 rounded mb-3 ${record.recheckRecord.result === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-sm font-medium text-neutral-700 mb-2">复查记录</div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-neutral-600">复查人：{record.recheckRecord.rechecker}</span>
                    <span className="text-xs text-neutral-400">{record.recheckRecord.recheckTime}</span>
                    <Tag color={record.recheckRecord.result === 'passed' ? 'success' : 'error'}>
                      {record.recheckRecord.result === 'passed' ? '通过' : '不通过'}
                    </Tag>
                  </div>
                  <div className="text-sm text-neutral-600">{record.recheckRecord.opinion}</div>
                </div>
              )}

              {canReview && (record.status === 'submitted') && (
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setRecheckRecord(record);
                      setRecheckResult('passed');
                      setRecheckOpinion('');
                      setRecheckModalVisible(true);
                    }}
                  >
                    复查
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderChangeRecords = () => {
    if (!place) return null;
    const records = place.changeRecords || [];

    if (records.length === 0) {
      return <Empty description="暂无变更记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const columns = [
      {
        title: '变更字段',
        dataIndex: 'fieldName',
        width: 120,
      },
      {
        title: '变更前',
        dataIndex: 'oldValue',
        width: 200,
        render: (val: string) => <span className="text-red-400 line-through">{val}</span>,
      },
      {
        title: '变更后',
        dataIndex: 'newValue',
        width: 200,
        render: (val: string) => <span className="text-green-600">{val}</span>,
      },
      {
        title: '操作人',
        dataIndex: 'operator',
        width: 120,
      },
      {
        title: '变更时间',
        dataIndex: 'time',
        width: 180,
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        size="small"
        pagination={false}
      />
    );
  };

  if (loading) {
    return (
      <PageContainer title="场所详情">
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!place) {
    return (
      <PageContainer title="场所详情">
        <Empty description="未找到场所信息" />
      </PageContainer>
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: renderBasicInfo(),
    },
    {
      key: 'certificates',
      label: (
        <span>
          证照管理
          <Badge
            count={
              (place.certificateDetails || []).filter(c => c.status === 'expired' || c.status === 'expiring_soon').length
            }
            size="small"
            offset={[6, -2]}
          />
        </span>
      ),
      children: renderCertificates(),
    },
    {
      key: 'audit',
      label: (
        <span>
          审核记录
          <Badge count={(place.auditRecords || []).length} size="small" offset={[6, -2]} />
        </span>
      ),
      children: renderAuditRecords(),
    },
    {
      key: 'rectification',
      label: (
        <span>
          整改记录
          {(place.rectificationRecords || []).length > 0 && place.rectificationStatus !== 'none' && (
            <Badge status="processing" />
          )}
        </span>
      ),
      children: renderRectificationRecords(),
    },
    {
      key: 'changes',
      label: (
        <span>
          变更记录
          <Badge count={(place.changeRecords || []).length} size="small" offset={[6, -2]} />
        </span>
      ),
      children: renderChangeRecords(),
    },
  ];

  return (
    <PageContainer
      title="场所详情"
      subTitle={place.name}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/places')}>
            返回列表
          </Button>
          {canEdit && place.status !== 'closed' && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/places/edit/${place.id}`)}>
              编辑
            </Button>
          )}
          {canReview && place.status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setReviewStatus('approved');
                  setReviewRemark('');
                  setReviewModalVisible(true);
                }}
              >
                审核通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setReviewStatus('rejected');
                  setReviewRemark('');
                  setReviewModalVisible(true);
                }}
              >
                审核驳回
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Tabs items={tabItems} type="card" />

      <Modal
        title={reviewStatus === 'approved' ? '审核通过' : '审核驳回'}
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-2 text-neutral-600">
            场所名称：<span className="font-medium">{place.name}</span>
          </p>
          {reviewStatus === 'rejected' && (
            <div className="mt-4">
              <p className="mb-2 text-neutral-600">驳回原因：</p>
              <TextArea
                rows={4}
                value={reviewRemark}
                onChange={e => setReviewRemark(e.target.value)}
                placeholder="请输入驳回原因"
                maxLength={200}
                showCount
              />
            </div>
          )}
          {reviewStatus === 'approved' && (
            <div className="mt-4">
              <p className="mb-2 text-neutral-600">审核备注（选填）：</p>
              <TextArea
                rows={3}
                value={reviewRemark}
                onChange={e => setReviewRemark(e.target.value)}
                placeholder="请输入审核备注"
                maxLength={200}
                showCount
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="整改复查"
        open={recheckModalVisible}
        onOk={handleRecheck}
        onCancel={() => setRecheckModalVisible(false)}
        confirmLoading={submitting}
        okText="提交复查结果"
        cancelText="取消"
      >
        <div className="py-4">
          {recheckRecord && (
            <>
              <div className="mb-4 bg-neutral-50 p-3 rounded">
                <div className="text-sm text-neutral-600 mb-1">整改内容：{recheckRecord.content}</div>
                <div className="text-sm text-neutral-500">整改要求：{recheckRecord.requirement}</div>
              </div>
              <div className="mb-4">
                <p className="mb-2 text-neutral-600">复查结果：</p>
                <div className="flex gap-3">
                  <Button
                    type={recheckResult === 'passed' ? 'primary' : 'default'}
                    className={recheckResult === 'passed' ? '!bg-green-500 !border-green-500' : ''}
                    onClick={() => setRecheckResult('passed')}
                  >
                    <CheckCircleOutlined /> 复查通过
                  </Button>
                  <Button
                    danger={recheckResult === 'failed'}
                    type={recheckResult === 'failed' ? 'primary' : 'default'}
                    onClick={() => setRecheckResult('failed')}
                  >
                    <CloseCircleOutlined /> 复查不通过
                  </Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-neutral-600">复查意见：</p>
                <TextArea
                  rows={4}
                  value={recheckOpinion}
                  onChange={e => setRecheckOpinion(e.target.value)}
                  placeholder="请输入复查意见"
                  maxLength={200}
                  showCount
                />
              </div>
              {recheckResult === 'failed' && (
                <Alert
                  message="复查不通过将自动生成新的整改任务"
                  type="warning"
                  showIcon
                  className="mt-3"
                />
              )}
            </>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};

export default PlaceDetailPage;
