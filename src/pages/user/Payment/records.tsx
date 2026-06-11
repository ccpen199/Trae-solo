import React, { useEffect, useState } from 'react';
import { Card, Table, DatePicker, Select, Button, Modal, Space, message, Tag, Empty, Alert } from 'antd';
import { EyeOutlined, ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { paymentApi } from '@/services/payment';
import { useUserStore } from '@/store/userStore';
import { formatMoney, formatDateTime, serviceTypeMap, paymentStatusMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { PaymentRecord } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const payMethodMap: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '银行卡',
};

const buildDemoRecords = (): PaymentRecord[] => {
  const methods = ['wechat', 'alipay', 'bank'];
  const types = ['water', 'electricity', 'gas'];
  const records: any[] = [];
  for (let i = 1; i <= 12; i++) {
    const d = dayjs().subtract(i, 'day');
    records.push({
      id: i,
      paymentNo: 'PAY' + d.format('YYYYMMDD') + String(i).padStart(4, '0'),
      householdNos: [types[i % 3] === 'water' ? 'W2024000001' : types[i % 3] === 'electricity' ? 'E2024000002' : 'G2024000003'],
      serviceTypes: [[types[i % 3]]],
      totalAmount: [128.5, 236.8, 86.2, 145.0, 198.5, 72.3, 165.0, 210.5, 95.8, 138.2, 188.6, 68.4][i - 1],
      payMethod: methods[i % 3],
      status: i <= 10 ? 1 : 0,
      thirdPartyNo: 'TP' + d.format('YYYYMMDDHHmmss'),
      createTime: d.format('YYYY-MM-DD HH:mm:ss'),
      payTime: i <= 10 ? d.add(2, 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    });
  }
  return records;
};

const PaymentRecords: React.FC = () => {
  const { isLogin } = useUserStore();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [serviceType, setServiceType] = useState<string>();
  const [status, setStatus] = useState<number>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PaymentRecord | null>(null);
  const displayMode = !isLogin;

  const DEMO_RECORDS = React.useMemo(() => buildDemoRecords(), []);

  useEffect(() => { loadRecords(); }, [dateRange, serviceType, status, page, pageSize]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      if (!displayMode) {
        const params: any = { page, pageSize };
        if (dateRange) {
          params.startTime = dateRange[0].format('YYYY-MM-DD');
          params.endTime = dateRange[1].format('YYYY-MM-DD');
        }
        if (serviceType) params.serviceType = serviceType;
        if (status !== undefined) params.status = status;
        const res: any = await paymentApi.getPaymentRecords(params);
        setRecords(res.list || []);
        setTotal(res.total || 0);
      }
    } catch { message.error('加载缴费记录失败'); }
    finally { setLoading(false); }
  };

  const displayRecords = displayMode ? DEMO_RECORDS : records;
  const displayTotal = displayMode ? DEMO_RECORDS.length : total;

  const handleViewDetail = (record: PaymentRecord) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleExport = () => {
    message.success(displayMode ? '演示模式：已生成示例Excel（登录后可导出真实数据）' : '导出成功');
  };

  const handleSearch = () => { setPage(1); if (!displayMode) loadRecords(); };
  const handleReset = () => {
    setDateRange(null);
    setServiceType(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const columns: ColumnsType<PaymentRecord> = [
    { title: '订单号', dataIndex: 'paymentNo', width: 200, render: t => <span className="font-mono text-sm">{t}</span> },
    { title: '户号', dataIndex: 'householdNos', width: 150, render: t => t?.join(', ') },
    { title: '服务类型', dataIndex: 'serviceTypes', width: 120, render: t => t?.map((s: string, i: number) => (
      <Tag key={i} color={serviceTypeMap[s as keyof typeof serviceTypeMap]?.color}>{serviceTypeMap[s as keyof typeof serviceTypeMap]?.name}</Tag>
    ))},
    { title: '金额', dataIndex: 'totalAmount', width: 120, render: t => <span className="font-bold text-primary-600 tabular-nums">{formatMoney(t)}</span> },
    { title: '支付方式', dataIndex: 'payMethod', width: 100, render: t => payMethodMap[t] || t },
    { title: '状态', dataIndex: 'status', width: 100, render: s => <StatusTag type="payment" status={s} /> },
    { title: '支付时间', dataIndex: 'payTime', width: 180, render: t => t ? formatDateTime(t) : '-' },
    { title: '操作', width: 100, render: (_, r) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button> },
  ];

  return (
    <div className="space-y-6">
      {displayMode && (
        <Alert message="演示模式" description="当前展示演示缴费记录，登录后可查看真实历史记录" type="info" showIcon icon={<InfoCircleOutlined />} closable />
      )}
      <Card className="shadow-md card-hover">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">时间范围</span>
            <DatePicker.RangePicker value={dateRange} onChange={v => setDateRange(v as any)} allowClear />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">服务类型</span>
            <Select style={{ width: 140 }} placeholder="全部" allowClear value={serviceType} onChange={setServiceType}
              options={Object.entries(serviceTypeMap).filter(([k]) => k !== 'all').map(([key, val]) => ({ label: val.name, value: key }))} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">支付状态</span>
            <Select style={{ width: 140 }} placeholder="全部" allowClear value={status} onChange={setStatus}
              options={Object.entries(paymentStatusMap).map(([key, val]) => ({ label: val.text, value: Number(key) }))} />
          </div>
          <Space>
            <Button type="primary" onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>导出Excel</Button>
          </Space>
        </div>

        <Table rowKey="id" columns={columns} dataSource={displayRecords} loading={loading}
          pagination={{ current: page, pageSize, total: displayTotal, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }} />
      </Card>

      <Modal title="缴费记录详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={500}>
        {currentRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div><p className="text-sm text-gray-500">订单号</p><p className="font-medium font-mono">{currentRecord.paymentNo}</p></div>
              <div><p className="text-sm text-gray-500">状态</p><StatusTag type="payment" status={currentRecord.status} /></div>
              <div><p className="text-sm text-gray-500">户号</p><p className="font-medium">{currentRecord.householdNos?.join(', ')}</p></div>
              <div><p className="text-sm text-gray-500">服务类型</p><p className="font-medium">{currentRecord.serviceTypes?.map(s => serviceTypeMap[s as keyof typeof serviceTypeMap]?.name).join(', ')}</p></div>
              <div><p className="text-sm text-gray-500">支付方式</p><p className="font-medium">{payMethodMap[currentRecord.payMethod] || currentRecord.payMethod}</p></div>
              <div><p className="text-sm text-gray-500">第三方单号</p><p className="font-medium font-mono text-sm">{currentRecord.thirdPartyNo || '-'}</p></div>
              <div><p className="text-sm text-gray-500">创建时间</p><p className="font-medium">{formatDateTime(currentRecord.createTime)}</p></div>
              <div><p className="text-sm text-gray-500">支付时间</p><p className="font-medium">{currentRecord.payTime ? formatDateTime(currentRecord.payTime) : '-'}</p></div>
            </div>
            <div className="p-4 bg-primary-50 rounded-xl flex items-center justify-between">
              <span className="font-medium">支付金额</span>
              <span className="text-2xl font-bold text-primary-600 tabular-nums">{formatMoney(currentRecord.totalAmount)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentRecords;
