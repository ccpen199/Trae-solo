import React, { useState, useCallback } from 'react';
import { Button, Space, DatePicker, Select, Input, Modal, Descriptions, Card, Statistic, Row, Col, message } from 'antd';
import { ScanOutlined, EyeOutlined, AlertOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageContainer, SearchForm, TablePro, Desensitize, StatusTag } from '@/components/common';
import type { SearchFormField } from '@/components/common';
import type { TableProColumn } from '@/components/common';
import {
  getVerificationList,
  exportVerificationRecords,
  getVerificationDetail,
  getVerificationStatistics,
} from '@/services/api/verification';
import type { VerificationRecord, VerificationStatistics } from '@/services/api/verification';
import { getPlaceList } from '@/services/api/place';
import { parseIdCard } from '@/utils/idCard';
import { formatDateTime } from '@/utils/format';
import LiveVerify from './components/LiveVerify';
import MinorIntercept from './components/MinorIntercept';
import { useRequest } from 'ahooks';

const { RangePicker } = DatePicker;

const VerificationPage: React.FC = () => {
  const [liveVerifyOpen, setLiveVerifyOpen] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [minorInterceptOpen, setMinorInterceptOpen] = useState(false);
  const [minorInterceptId, setMinorInterceptId] = useState<string>('');
  const [currentRecord, setCurrentRecord] = useState<VerificationRecord | null>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [placeOptions, setPlaceOptions] = useState<{ label: string; value: string }[]>([]);

  const { data: statsData } = useRequest(getVerificationStatistics);
  const stats = statsData?.data;

  const fetchPlaces = async () => {
    try {
      const res = await getPlaceList({ page: 1, pageSize: 200, status: 'approved' });
      if (res.data?.list) {
        setPlaceOptions(res.data.list.map(p => ({ label: p.name, value: p.id })));
      }
    } catch {}
  };

  React.useEffect(() => {
    fetchPlaces();
  }, []);

  const handleSearch = useCallback((values: Record<string, any>) => {
    const params: Record<string, any> = {};
    if (values.placeId) params.placeId = values.placeId;
    if (values.status) params.status = values.status;
    if (values.keyword) params.keyword = values.keyword;
    if (values.timeRange?.length === 2) {
      params.startDate = values.timeRange[0].format('YYYY-MM-DD');
      params.endDate = values.timeRange[1].format('YYYY-MM-DD');
    }
    setSearchParams(params);
  }, []);

  const handleReset = useCallback(() => {
    setSearchParams({});
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportVerificationRecords(searchParams);
      if (res.data) {
        message.success('导出成功，文件已下载');
      }
    } catch {
      message.error('导出失败');
    }
  };

  const handleViewDetail = async (record: VerificationRecord) => {
    try {
      const res = await getVerificationDetail(record.id);
      if (res.data) {
        setCurrentRecord(res.data);
        setDetailVisible(true);
      }
    } catch {}
  };

  const handleMinorIntercept = (record: VerificationRecord) => {
    if (record.isMinor) {
      setMinorInterceptId(record.id);
      setMinorInterceptOpen(true);
    }
  };

  const request = useCallback(
    async (params: Record<string, any>) => {
      const res = await getVerificationList({ page: params.page, pageSize: params.pageSize, ...searchParams });
      return {
        list: res.data?.list || [],
        total: res.data?.total || 0,
        page: res.data?.page || params.page,
        pageSize: res.data?.pageSize || params.pageSize,
      };
    },
    [searchParams]
  );

  const searchFields: SearchFormField[] = [
    {
      name: 'placeId',
      label: '场所名称',
      render: (
        <Select
          placeholder="请选择场所"
          options={placeOptions}
          allowClear
          showSearch
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
        />
      ),
    },
    {
      name: 'keyword',
      label: '姓名/身份证',
      render: <Input placeholder="请输入姓名或身份证号" allowClear />,
    },
    {
      name: 'status',
      label: '核验结果',
      render: (
        <Select
          placeholder="请选择"
          allowClear
          options={[
            { label: '成功', value: 'success' },
            { label: '失败', value: 'failed' },
            { label: '待核验', value: 'pending' },
          ]}
        />
      ),
    },
    {
      name: 'timeRange',
      label: '时间段',
      span: 8,
      render: <RangePicker className="w-full" />,
    },
  ];

  const columns: TableProColumn<VerificationRecord>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '场所名称',
      dataIndex: 'placeName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 90,
      render: (name: string) => <Desensitize value={name} type="name" allowToggle />,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      width: 170,
      render: (idCard: string) => <Desensitize value={idCard} type="idCard" allowToggle />,
    },
    {
      title: '年龄',
      dataIndex: 'idCard',
      width: 60,
      render: (idCard: string) => {
        const info = parseIdCard(idCard);
        return info ? `${info.age}岁` : '-';
      },
    },
    {
      title: '核验方式',
      dataIndex: 'verifyMethodName',
      width: 90,
      render: (val: string, record: VerificationRecord) => val || (record.type === 'face' ? '终端' : '人工'),
    },
    {
      title: '比对来源',
      dataIndex: 'compareSourceName',
      width: 100,
      render: (val: string, record: VerificationRecord) => val || (record.compareSource === 'police' ? '公安人口库' : '本地'),
    },
    {
      title: '匹配置信度',
      dataIndex: 'confidence',
      width: 100,
      render: (val: number) => val != null ? `${val}%` : '-',
    },
    {
      title: '核验时间',
      dataIndex: 'verifyTime',
      width: 160,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '核验结果',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const map: Record<string, { type: 'success' | 'danger' | 'pending'; text: string }> = {
          success: { type: 'success', text: '成功' },
          failed: { type: 'danger', text: '失败' },
          pending: { type: 'pending', text: '待核验' },
        };
        const item = map[status] || map.pending;
        return <StatusTag status={item.type} text={item.text} />;
      },
    },
    {
      title: '拦截结果',
      dataIndex: 'interceptResult',
      width: 100,
      render: (val: string, record: VerificationRecord) => {
        if (record.isMinor) return <span className="text-red-500 font-medium">未成年人拦截</span>;
        if (val === '放行') return <span className="text-green-600">放行</span>;
        if (val === '标记异常') return <span className="text-orange-500">标记异常</span>;
        return '-';
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: VerificationRecord) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.isMinor && (
            <Button type="link" size="small" danger icon={<AlertOutlined />} onClick={() => handleMinorIntercept(record)}>
              拦截处置
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="实名核验管理"
      subTitle="管理场所实名核验记录，支持身份证和人脸核验"
      extra={
        <Button
          type="primary"
          size="large"
          icon={<ScanOutlined />}
          onClick={() => setLiveVerifyOpen(true)}
          style={{ background: '#1677ff', height: 44, paddingInline: 28, fontSize: 16, fontWeight: 600 }}
        >
          发起现场核验
        </Button>
      }
    >
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span className="text-neutral-500 text-sm">今日核验总数</span>}
              value={stats?.todayTotal ?? 0}
              prefix={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span className="text-neutral-500 text-sm">今日通过率</span>}
              value={stats?.todayPassRate ?? 0}
              suffix="%"
              prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span className="text-neutral-500 text-sm">今日未成年人拦截数</span>}
              value={stats?.todayMinorIntercept ?? 0}
              prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <SearchForm fields={searchFields} onSearch={handleSearch} onReset={handleReset} />

      <TablePro<VerificationRecord>
        columns={columns}
        request={request}
        params={searchParams}
        showExport
        onExport={handleExport}
        rowKey="id"
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          record.isMinor ? 'bg-red-50 dark:bg-red-900/10' : ''
        }
      />

      <LiveVerify
        open={liveVerifyOpen}
        onCancel={() => setLiveVerifyOpen(false)}
        onSuccess={() => setSearchParams({ ...searchParams })}
        onMinorIntercept={(id) => {
          setMinorInterceptId(id);
          setMinorInterceptOpen(true);
        }}
      />

      <MinorIntercept
        open={minorInterceptOpen}
        verificationId={minorInterceptId}
        onCancel={() => { setMinorInterceptOpen(false); setMinorInterceptId(''); }}
        onSuccess={() => setSearchParams({ ...searchParams })}
      />

      <Modal
        title="核验详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        width={650}
      >
        {currentRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="场所名称" span={2}>{currentRecord.placeName}</Descriptions.Item>
            <Descriptions.Item label="姓名">
              <Desensitize value={currentRecord.name} type="name" allowToggle />
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              <Desensitize value={currentRecord.idCard} type="idCard" allowToggle />
            </Descriptions.Item>
            <Descriptions.Item label="年龄">
              {(() => { const info = parseIdCard(currentRecord.idCard); return info ? `${info.age}岁` : '-'; })()}
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              {(() => { const info = parseIdCard(currentRecord.idCard); return info?.gender ?? '-'; })()}
            </Descriptions.Item>
            <Descriptions.Item label="核验方式">{currentRecord.verifyMethodName || currentRecord.typeName}</Descriptions.Item>
            <Descriptions.Item label="比对来源">{currentRecord.compareSourceName || '-'}</Descriptions.Item>
            <Descriptions.Item label="匹配置信度">{currentRecord.confidence ? `${currentRecord.confidence}%` : '-'}</Descriptions.Item>
            <Descriptions.Item label="拦截结果">
              {currentRecord.isMinor ? (
                <span className="text-red-500 font-medium">未成年人拦截</span>
              ) : (
                currentRecord.interceptResult || '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="核验结果">
              <StatusTag
                status={currentRecord.status === 'success' ? 'success' : currentRecord.status === 'failed' ? 'danger' : 'pending'}
                text={currentRecord.statusName}
              />
            </Descriptions.Item>
            <Descriptions.Item label="核验时间" span={2}>{formatDateTime(currentRecord.verifyTime)}</Descriptions.Item>
            {currentRecord.remark && (
              <Descriptions.Item label="备注" span={2}>{currentRecord.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default VerificationPage;
