import React, { useState, useCallback } from 'react';
import { Button, Space, DatePicker, Select, Input, Modal, message, Popconfirm, Form, InputNumber } from 'antd';
import { EyeOutlined, CheckOutlined, StopOutlined, PlusOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageContainer, SearchForm, TablePro, Desensitize, StatusTag } from '@/components/common';
import type { SearchFormField } from '@/components/common';
import type { TableProColumn } from '@/components/common';
import {
  getReservationList,
  cancelReservation,
  verifyReservation,
  createReservation,
  getCapacityBoard,
  getReservationConfig,
} from '@/services/api/reservation';
import type { Reservation, CapacityBoardData, CapacitySlot, ReservationConfig, ReservationCreateParams } from '@/services/api/reservation';
import { getPlaceList } from '@/services/api/place';
import ReservationDetail from './components/ReservationDetail';
import CapacityBoard from './components/CapacityBoard';

const { RangePicker } = DatePicker;

const statusMap: Record<string, { type: 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'default'; text: string }> = {
  pending: { type: 'pending', text: '待确认' },
  confirmed: { type: 'info', text: '已确认' },
  used: { type: 'success', text: '已核销' },
  cancelled: { type: 'danger', text: '已取消' },
  expired: { type: 'default', text: '已过期' },
};

const verifyStatusMap: Record<string, { type: 'success' | 'warning' | 'danger' | 'default'; text: string }> = {
  unverified: { type: 'warning', text: '未核销' },
  verified: { type: 'success', text: '已核销' },
  timeout: { type: 'danger', text: '超时未核销' },
  mismatch: { type: 'danger', text: '人数不符' },
};

const ReservationPage: React.FC = () => {
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Reservation | null>(null);
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [placeOptions, setPlaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelRecord, setCancelRecord] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [overCapacityVisible, setOverCapacityVisible] = useState(false);
  const [overCapacitySlot, setOverCapacitySlot] = useState<CapacitySlot | null>(null);
  const [pendingCreateParams, setPendingCreateParams] = useState<ReservationCreateParams | null>(null);
  const [reservationConfig, setReservationConfig] = useState<ReservationConfig | null>(null);

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

  const fetchCapacityBoard = async (placeId?: string, date?: string) => {
    try {
      const res = await getCapacityBoard(placeId ? { placeId, date } : date ? { date } : undefined);
      return res.data || [];
    } catch {
      return [];
    }
  };

  const findSlot = (boardData: CapacityBoardData[], placeId: string, date: string, timeSlot: string): CapacitySlot | null => {
    const place = boardData.find(p => p.placeId === placeId && p.date === date);
    if (!place) return null;
    return place.slots.find(s => s.timeSlot === timeSlot) || null;
  };

  const handleCreateSubmit = async (values: Record<string, any>) => {
    const placeId = values.placeId;
    const visitDate = values.visitDate?.format?.('YYYY-MM-DD') || values.visitDate;
    const visitTimeSlot = values.visitTimeSlot;
    const boardData = await fetchCapacityBoard(placeId, visitDate);
    const slot = findSlot(boardData, placeId, visitDate, visitTimeSlot);

    try {
      const configRes = await getReservationConfig(placeId);
      setReservationConfig(configRes.data || null);
    } catch {
      setReservationConfig(null);
    }

    const params: ReservationCreateParams = {
      placeId,
      visitorName: values.visitorName,
      visitorPhone: values.visitorPhone,
      visitorIdCard: values.visitorIdCard,
      visitorCount: values.visitorCount,
      visitDate,
      visitTimeSlot,
      remark: values.remark,
    };

    if (slot && slot.remaining <= 0) {
      setOverCapacitySlot(slot);
      setPendingCreateParams(params);
      setOverCapacityVisible(true);
      return;
    }

    await doCreateReservation(params);
  };

  const doCreateReservation = async (params: ReservationCreateParams, joinWaitlist = false) => {
    setCreateSubmitting(true);
    try {
      await createReservation({
        ...params,
        remark: joinWaitlist ? `[排队等候] ${params.remark || ''}`.trim() : params.remark,
      });
      message.success(joinWaitlist ? '已加入排队等候列表' : '预约创建成功');
      setCreateVisible(false);
      createForm.resetFields();
      setSearchParams({ ...searchParams });
    } catch {
      message.error('预约创建失败');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOverCapacityJoinWaitlist = () => {
    setOverCapacityVisible(false);
    if (pendingCreateParams) {
      doCreateReservation(pendingCreateParams, true);
    }
    setPendingCreateParams(null);
    setOverCapacitySlot(null);
  };

  const handleOverCapacityCancel = () => {
    setOverCapacityVisible(false);
    setPendingCreateParams(null);
    setOverCapacitySlot(null);
  };

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

  const handleViewDetail = (record: Reservation) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleConfirm = async (record: Reservation) => {
    try {
      await verifyReservation({ orderNo: record.orderNo, operator: 'admin' });
      message.success('确认成功');
      setDetailVisible(false);
      setSearchParams({ ...searchParams });
    } catch {
      message.error('确认失败');
    }
  };

  const handleVerify = async (record: Reservation) => {
    try {
      await verifyReservation({ orderNo: record.orderNo, operator: 'admin' });
      message.success('核销成功');
      setDetailVisible(false);
      setSearchParams({ ...searchParams });
    } catch {
      message.error('核销失败');
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelRecord || !cancelReason.trim()) {
      message.warning('请填写取消原因');
      return;
    }
    try {
      await cancelReservation(cancelRecord.id, cancelReason);
      message.success('取消成功');
      setCancelVisible(false);
      setCancelReason('');
      setDetailVisible(false);
      setSearchParams({ ...searchParams });
    } catch {
      message.error('取消失败');
    }
  };

  const openCancelModal = (record: Reservation) => {
    setCancelRecord(record);
    setCancelVisible(true);
  };

  const request = useCallback(
    async (params: Record<string, any>) => {
      const res = await getReservationList({ page: params.page, pageSize: params.pageSize, ...searchParams });
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
      label: '场所',
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
      name: 'timeRange',
      label: '预约日期',
      render: <RangePicker className="w-full" />,
    },
    {
      name: 'status',
      label: '状态',
      render: (
        <Select
          placeholder="请选择状态"
          allowClear
          options={[
            { label: '待确认', value: 'pending' },
            { label: '已确认', value: 'confirmed' },
            { label: '已核销', value: 'used' },
            { label: '已取消', value: 'cancelled' },
            { label: '已过期', value: 'expired' },
          ]}
        />
      ),
    },
    {
      name: 'keyword',
      label: '手机号',
      render: <Input placeholder="请输入手机号" allowClear />,
    },
  ];

  const columns: TableProColumn<Reservation>[] = [
    {
      title: '预约编号',
      dataIndex: 'orderNo',
      width: 160,
      render: (no: string) => <span className="font-mono text-xs">{no}</span>,
    },
    {
      title: '场所',
      dataIndex: 'placeName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '姓名',
      dataIndex: 'visitorName',
      width: 80,
      render: (name: string) => <Desensitize value={name} type="name" allowToggle />,
    },
    {
      title: '手机号',
      dataIndex: 'visitorPhone',
      width: 120,
      render: (phone: string) => <Desensitize value={phone} type="phone" allowToggle />,
    },
    {
      title: '预约日期',
      dataIndex: 'visitDate',
      width: 100,
    },
    {
      title: '时段',
      dataIndex: 'visitTimeSlot',
      width: 110,
    },
    {
      title: '人数',
      dataIndex: 'visitorCount',
      width: 60,
      render: (count: number) => `${count}人`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => {
        const info = statusMap[status] || statusMap.pending;
        return <StatusTag status={info.type} text={info.text} />;
      },
    },
    {
      title: '核销状态',
      dataIndex: 'verifyStatus',
      width: 100,
      render: (vs: string, record: Reservation) => {
        if (!vs) return '-';
        const info = verifyStatusMap[vs];
        return info ? <StatusTag status={info.type} text={info.text} /> : '-';
      },
    },
    {
      title: '核销时间',
      dataIndex: 'verifyTime',
      width: 150,
      render: (v: string) => v || '-',
    },
    {
      title: '异常',
      dataIndex: 'isAbnormal',
      width: 70,
      render: (v: boolean, record: Reservation) => {
        if (!v) return '-';
        return <span className="text-red-500 text-xs font-medium">{record.abnormalReason || '异常'}</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 170,
      fixed: 'right',
      render: (_: any, record: Reservation) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Popconfirm title="确认此预约？" onConfirm={() => handleConfirm(record)}>
              <Button type="link" size="small" icon={<CheckOutlined />}>确认</Button>
            </Popconfirm>
          )}
          {record.status === 'confirmed' && (
            <Popconfirm title="确认核销此预约？" onConfirm={() => handleVerify(record)}>
              <Button type="link" size="small" icon={<CheckOutlined />}>核销</Button>
            </Popconfirm>
          )}
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => openCancelModal(record)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="预约分流管理" subTitle="管理场所预约记录，支持确认、核销、取消等操作" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>新增预约</Button>
    }>
      <CapacityBoard />
      <SearchForm fields={searchFields} onSearch={handleSearch} onReset={handleReset} />

      <TablePro<Reservation>
        columns={columns}
        request={request}
        params={searchParams}
        rowKey="id"
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          record.isAbnormal ? 'bg-red-50 dark:bg-red-900/10' :
          record.verifyStatus === 'timeout' ? 'bg-orange-50 dark:bg-orange-900/10' : ''
        }
      />

      <ReservationDetail
        open={detailVisible}
        record={currentRecord}
        onCancel={() => setDetailVisible(false)}
        onConfirm={handleConfirm}
        onVerify={handleVerify}
        onCancelReservation={(record) => {
          setDetailVisible(false);
          openCancelModal(record);
        }}
      />

      <Modal
        title="取消预约"
        open={cancelVisible}
        onOk={handleCancelReservation}
        onCancel={() => {
          setCancelVisible(false);
          setCancelReason('');
        }}
        okText="确认取消"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2">
          <p className="mb-3 text-neutral-600">
            确定要取消预约 <span className="font-mono font-medium">{cancelRecord?.orderNo}</span> 吗？
          </p>
          <Input.TextArea
            rows={3}
            placeholder="请输入取消原因"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        title="新增预约"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={createSubmitting}
        okText="提交预约"
        width={560}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="mt-2"
        >
          <Form.Item name="placeId" label="场所" rules={[{ required: true, message: '请选择场所' }]}>
            <Select
              placeholder="请选择场所"
              options={placeOptions}
              showSearch
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="visitorName" label="访客姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入访客姓名" />
          </Form.Item>
          <Form.Item name="visitorPhone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="visitorIdCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="visitDate" label="预约日期" rules={[{ required: true, message: '请选择预约日期' }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="visitTimeSlot" label="预约时段" rules={[{ required: true, message: '请选择预约时段' }]}>
            <Select placeholder="请选择预约时段" />
          </Form.Item>
          <Form.Item name="visitorCount" label="预约人数" rules={[{ required: true, message: '请输入预约人数' }]} initialValue={1}>
            <InputNumber min={1} className="w-full" placeholder="请输入预约人数" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <span className="inline-flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            时段容量已满
          </span>
        }
        open={overCapacityVisible}
        onCancel={handleOverCapacityCancel}
        footer={[
          <Button key="cancel" onClick={handleOverCapacityCancel}>
            取消预约
          </Button>,
          <Button key="waitlist" type="primary" onClick={handleOverCapacityJoinWaitlist}>
            排队等候
          </Button>,
        ]}
        width={480}
      >
        <div className="py-2">
          <p className="mb-3 text-neutral-600">
            您选择的时段 <span className="font-mono font-medium text-red-500">{overCapacitySlot?.timeSlot}</span> 预约已满（容量 {overCapacitySlot?.totalCapacity}，已预约 {overCapacitySlot?.reserved}），无法直接预约。
          </p>
          {reservationConfig?.overCapacityPolicy && (
            <p className="mb-2 text-sm text-neutral-500">
              当前超容量政策：{reservationConfig.overCapacityPolicyName || (reservationConfig.overCapacityPolicy === 'auto_reject' ? '自动拒绝' : '排队等候')}
            </p>
          )}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded p-3 text-sm text-neutral-600">
            <div className="flex items-start gap-2">
              <InfoCircleOutlined className="text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium mb-1">您可以选择：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>排队等候</strong>：加入等候列表，当有预约取消或释放名额时，系统将按顺序自动安排。</li>
                  <li><strong>取消预约</strong>：放弃本次预约，选择其他时段或日期。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default ReservationPage;
