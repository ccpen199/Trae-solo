import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Input, Select, Space, message, Popconfirm, Tag, Dropdown } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, DownOutlined } from '@ant-design/icons';
import { PageContainer, TablePro, TableProColumn, SearchForm, SearchFormField, StatusTag, Desensitize } from '@/components/common';
import {
  getPlaceList,
  reviewPlace,
  revokePlace,
  batchReviewPlaces,
  batchUrgePlaces,
  PLACE_TYPE_MAP,
  PLACE_STATUS_MAP,
  CERT_STATUS_MAP,
  RECTIFICATION_STATUS_MAP,
} from '@/services/api/place';
import type { Place, PlaceType, PlaceStatus, CertStatus } from '@/services/api/place';
import usePermission from '@/hooks/usePermission';
import { getCityList } from '@/utils/region';

const { TextArea } = Input;

const placeTypeOptions = Object.entries(PLACE_TYPE_MAP).map(([value, label]) => ({ value, label: label as string }));
const placeStatusOptions = Object.entries(PLACE_STATUS_MAP).map(([value, config]: [string, { text: string }]) => ({ value, label: config.text }));
const cityOptions = getCityList().map(c => ({ value: c.name, label: c.name }));
const certStatusOptions = Object.entries(CERT_STATUS_MAP).map(([value, config]) => ({ value, label: config.text }));
const rectificationStatusOptions = [
  { value: 'none', label: '无整改' },
  { value: 'pending', label: '待整改' },
  { value: 'submitted', label: '已提交' },
  { value: 'recheck_passed', label: '复查通过' },
  { value: 'recheck_failed', label: '复查不通过' },
];

const PlaceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission('place:create');
  const canReview = hasPermission('place:review');
  const canRevoke = hasPermission('place:revoke');

  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [batchReviewVisible, setBatchReviewVisible] = useState(false);
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewRemark, setReviewRemark] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchReviewStatus, setBatchReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [batchReviewReason, setBatchReviewReason] = useState('');

  const searchFields: SearchFormField[] = [
    {
      name: 'name',
      label: '场所名称',
      render: <Input placeholder="请输入场所名称" allowClear />,
    },
    {
      name: 'type',
      label: '场所类型',
      render: <Select placeholder="请选择类型" allowClear options={placeTypeOptions} />,
    },
    {
      name: 'status',
      label: '状态',
      render: <Select placeholder="请选择状态" allowClear options={placeStatusOptions} />,
    },
    {
      name: 'city',
      label: '所属区域',
      render: <Select placeholder="请选择城市" allowClear options={cityOptions} />,
    },
    {
      name: 'fireLicenseStatus',
      label: '消防许可',
      render: <Select placeholder="请选择" allowClear options={certStatusOptions} />,
    },
    {
      name: 'securityLicenseStatus',
      label: '治安许可',
      render: <Select placeholder="请选择" allowClear options={certStatusOptions} />,
    },
    {
      name: 'rectificationStatus',
      label: '整改状态',
      render: <Select placeholder="请选择" allowClear options={rectificationStatusOptions} />,
    },
  ];

  const handleSearch = useCallback((values: Record<string, any>) => {
    setSearchParams(values);
  }, []);

  const handleReset = useCallback(() => {
    setSearchParams({});
  }, []);

  const request = useCallback(async (params: Record<string, any>) => {
    const res = await getPlaceList({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      name: searchParams.name,
      type: searchParams.type as PlaceType,
      status: searchParams.status as PlaceStatus,
      city: searchParams.city,
      fireLicenseStatus: searchParams.fireLicenseStatus as CertStatus,
      securityLicenseStatus: searchParams.securityLicenseStatus as CertStatus,
      rectificationStatus: searchParams.rectificationStatus,
    });
    return {
      list: res.data?.list || [],
      total: res.data?.total || 0,
      page: res.data?.page,
      pageSize: res.data?.pageSize,
    };
  }, [searchParams]);

  const handleReview = useCallback((place: Place, status: 'approved' | 'rejected') => {
    setCurrentPlace(place);
    setReviewStatus(status);
    setReviewRemark('');
    setReviewModalVisible(true);
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (!currentPlace) return;
    setSubmitting(true);
    try {
      await reviewPlace({
        id: currentPlace.id,
        status: reviewStatus,
        reason: reviewRemark,
      });
      message.success(reviewStatus === 'approved' ? '审核通过' : '已驳回');
      setReviewModalVisible(false);
      setSearchParams(prev => ({ ...prev }));
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }, [currentPlace, reviewStatus, reviewRemark]);

  const handleRevoke = useCallback((place: Place) => {
    setCurrentPlace(place);
    setRevokeReason('');
    setRevokeModalVisible(true);
  }, []);

  const handleRevokeSubmit = useCallback(async () => {
    if (!currentPlace || !revokeReason.trim()) {
      message.warning('请填写注销原因');
      return;
    }
    setSubmitting(true);
    try {
      await revokePlace(currentPlace.id, revokeReason);
      message.success('已注销');
      setRevokeModalVisible(false);
      setSearchParams(prev => ({ ...prev }));
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }, [currentPlace, revokeReason]);

  const handleBatchReview = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的场所');
      return;
    }
    setSubmitting(true);
    try {
      await batchReviewPlaces(selectedRowKeys as string[], batchReviewStatus, batchReviewReason || undefined);
      message.success(`已批量${batchReviewStatus === 'approved' ? '审核通过' : '驳回'} ${selectedRowKeys.length} 个场所`);
      setBatchReviewVisible(false);
      setSelectedRowKeys([]);
      setSearchParams(prev => ({ ...prev }));
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRowKeys, batchReviewStatus, batchReviewReason]);

  const handleBatchUrge = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要催报的场所');
      return;
    }
    try {
      await batchUrgePlaces(selectedRowKeys as string[]);
      message.success(`已催报 ${selectedRowKeys.length} 个场所`);
      setSelectedRowKeys([]);
    } catch {
      message.error('操作失败');
    }
  }, [selectedRowKeys]);

  const renderCertTag = (status: CertStatus) => {
    const config = CERT_STATUS_MAP[status];
    if (!config) return <Tag>未知</Tag>;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderRectificationTag = (status: string) => {
    if (status === 'none') return <Tag>无</Tag>;
    const config = RECTIFICATION_STATUS_MAP[status as keyof typeof RECTIFICATION_STATUS_MAP];
    if (!config) return <Tag>{status}</Tag>;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRowClassName = (record: Place) => {
    if (record.status === 'pending') return 'bg-yellow-50';
    if (record.status === 'rejected') return 'bg-red-50';
    if (record.rectificationStatus === 'pending' || record.rectificationStatus === 'recheck_failed') return 'bg-orange-50';
    return '';
  };

  const columns: TableProColumn<Place>[] = [
    {
      title: '场所名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: PlaceType) => PLACE_TYPE_MAP[type] || type,
    },
    {
      title: '法人',
      dataIndex: 'legalPerson',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
      render: (phone: string) => <Desensitize value={phone} type="phone" allowToggle />,
    },
    {
      title: '所属区域',
      dataIndex: 'city',
      width: 120,
      render: (_: string, record: Place) => `${record.province}${record.city}${record.district}`,
    },
    {
      title: '消防许可',
      dataIndex: 'fireLicenseStatus',
      width: 100,
      render: (status: CertStatus) => renderCertTag(status),
    },
    {
      title: '治安许可',
      dataIndex: 'securityLicenseStatus',
      width: 100,
      render: (status: CertStatus) => renderCertTag(status),
    },
    {
      title: '电脑台数',
      dataIndex: 'computerCount',
      width: 100,
      render: (count: number) => count ?? '-',
    },
    {
      title: '最近审核',
      dataIndex: 'lastAuditTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '整改状态',
      dataIndex: 'rectificationStatus',
      width: 110,
      render: (status: string) => renderRectificationTag(status),
    },
    {
      title: '备案状态',
      dataIndex: 'status',
      width: 100,
      render: (status: PlaceStatus) => {
        const config = PLACE_STATUS_MAP[status];
        return config ? <StatusTag status={config.status} text={config.text} /> : status;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 240,
      fixed: 'right',
      render: (_: unknown, record: Place) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/places/detail/${record.id}`)}>
            查看详情
          </Button>
          {canReview && record.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={() => handleReview(record, 'approved')}>
                审核
              </Button>
            </>
          )}
          <Button type="link" size="small" onClick={() => navigate(`/places/edit/${record.id}`)}>
            编辑
          </Button>
          {canRevoke && record.status === 'approved' && (
            <Popconfirm
              title="确定要注销该场所备案吗？"
              onConfirm={() => handleRevoke(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                注销
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const batchMenuItems = [
    {
      key: 'batch-review',
      label: '批量审核',
      onClick: () => {
        if (selectedRowKeys.length === 0) {
          message.warning('请先选择要操作的场所');
          return;
        }
        setBatchReviewStatus('approved');
        setBatchReviewReason('');
        setBatchReviewVisible(true);
      },
    },
    {
      key: 'batch-urge',
      label: '批量催报',
      onClick: handleBatchUrge,
    },
  ];

  return (
    <PageContainer
      title="场所备案管理"
      subTitle="管理互联网上网服务营业场所备案信息"
      extra={
        <Space>
          {canReview && selectedRowKeys.length > 0 && (
            <Dropdown menu={{ items: batchMenuItems }}>
              <Button>
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
          )}
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/places/create')}>
              新增备案
            </Button>
          )}
        </Space>
      }
    >
      <SearchForm fields={searchFields} onSearch={handleSearch} onReset={handleReset} />
      <TablePro<Place>
        columns={columns}
        request={request}
        params={searchParams}
        rowKey="id"
        showExport
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        rowClassName={getRowClassName}
      />

      <Modal
        title={reviewStatus === 'approved' ? '审核通过' : '审核驳回'}
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-2 text-neutral-600">
            场所名称：<span className="font-medium">{currentPlace?.name}</span>
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
        title="注销场所备案"
        open={revokeModalVisible}
        onOk={handleRevokeSubmit}
        onCancel={() => setRevokeModalVisible(false)}
        confirmLoading={submitting}
        okText="确定注销"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <div className="flex items-start gap-2 mb-4 p-3 bg-warning-50 rounded">
            <ExclamationCircleOutlined className="text-warning-500 mt-0.5" />
            <span className="text-sm text-warning-700">
              注销后该场所备案信息将失效，此操作不可逆，请确认是否继续？
            </span>
          </div>
          <p className="mb-2 text-neutral-600">
            场所名称：<span className="font-medium">{currentPlace?.name}</span>
          </p>
          <div className="mt-4">
            <p className="mb-2 text-neutral-600">注销原因：</p>
            <TextArea
              rows={4}
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder="请输入注销原因"
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="批量审核"
        open={batchReviewVisible}
        onOk={handleBatchReview}
        onCancel={() => setBatchReviewVisible(false)}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <div className="py-4">
          <p className="mb-4 text-neutral-600">
            已选择 <span className="font-medium text-primary-500">{selectedRowKeys.length}</span> 个场所
          </p>
          <div className="mb-4">
            <p className="mb-2 text-neutral-600">审核结果：</p>
            <Select
              value={batchReviewStatus}
              onChange={setBatchReviewStatus}
              style={{ width: '100%' }}
              options={[
                { value: 'approved', label: '审核通过' },
                { value: 'rejected', label: '审核驳回' },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-neutral-600">
              {batchReviewStatus === 'rejected' ? '驳回原因：' : '审核备注（选填）：'}
            </p>
            <TextArea
              rows={4}
              value={batchReviewReason}
              onChange={e => setBatchReviewReason(e.target.value)}
              placeholder={batchReviewStatus === 'rejected' ? '请输入驳回原因' : '请输入审核备注'}
              maxLength={200}
              showCount
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default PlaceListPage;
