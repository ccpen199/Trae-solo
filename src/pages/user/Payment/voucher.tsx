import React, { useEffect, useState } from 'react';
import { Card, Table, DatePicker, Button, Modal, Checkbox, Space, message, Alert, Tag } from 'antd';
import { EyeOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { paymentApi } from '@/services/payment';
import { useUserStore } from '@/store/userStore';
import { formatMoney, formatDateTime } from '@/utils/format';
import type { Voucher } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const buildDemoVouchers = (): Voucher[] => {
  const vouchers: any[] = [];
  for (let i = 1; i <= 8; i++) {
    const d = dayjs().subtract(i, 'day');
    vouchers.push({
      id: i,
      voucherNo: 'VCH' + d.format('YYYYMMDD') + String(i).padStart(4, '0'),
      paymentNo: 'PAY' + d.format('YYYYMMDD') + String(i).padStart(4, '0'),
      amount: [128.5, 236.8, 86.2, 145.0, 198.5, 72.3, 165.0, 210.5][i - 1],
      createTime: d.format('YYYY-MM-DD HH:mm:ss'),
    });
  }
  return vouchers;
};

const VoucherPage: React.FC = () => {
  const { isLogin } = useUserStore();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState<Voucher | null>(null);
  const displayMode = !isLogin;

  const DEMO_VOUCHERS = React.useMemo(() => buildDemoVouchers(), []);

  useEffect(() => { loadVouchers(); }, [dateRange, page, pageSize]);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      if (!displayMode) {
        const params: any = { page, pageSize };
        if (dateRange) {
          params.startTime = dateRange[0].format('YYYY-MM-DD');
          params.endTime = dateRange[1].format('YYYY-MM-DD');
        }
        const res: any = await paymentApi.getVoucherList(params);
        setVouchers(res.list || []);
        setTotal(res.total || 0);
      }
    } catch { message.error('加载凭证列表失败'); }
    finally { setLoading(false); }
  };

  const displayVouchers = displayMode ? DEMO_VOUCHERS : vouchers;
  const displayTotal = displayMode ? DEMO_VOUCHERS.length : total;

  const handlePreview = (voucher: Voucher) => {
    setCurrentVoucher(voucher);
    setPreviewVisible(true);
  };

  const handleDownload = (id: number) => {
    message.success(displayMode ? '演示模式：凭证下载成功（登录后可下载真实凭证）' : '下载成功');
  };

  const handleBatchDownload = () => {
    if (selectedIds.length === 0) { message.warning('请先选择要下载的凭证'); return; }
    message.success(displayMode ? `演示模式：已下载 ${selectedIds.length} 张示例凭证` : `已下载 ${selectedIds.length} 张凭证`);
    setSelectedIds([]);
  };

  const handleSearch = () => { setPage(1); if (!displayMode) loadVouchers(); };
  const handleReset = () => { setDateRange(null); setPage(1); setSelectedIds([]); };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(displayVouchers.map(v => v.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  const columns: ColumnsType<Voucher> = [
    { title: '选择', width: 60, render: (_, r) => (
      <Checkbox checked={selectedIds.includes(r.id)} onChange={e => e.target.checked ? setSelectedIds([...selectedIds, r.id]) : setSelectedIds(selectedIds.filter(id => id !== r.id))} />
    )},
    { title: '凭证号', dataIndex: 'voucherNo', width: 200, render: t => <span className="font-mono text-sm">{t}</span> },
    { title: '对应订单号', dataIndex: 'paymentNo', width: 200, render: t => <span className="font-mono text-sm">{t}</span> },
    { title: '金额', dataIndex: 'amount', width: 120, render: t => <span className="font-bold text-primary-600 tabular-nums">{formatMoney(t)}</span> },
    { title: '生成时间', dataIndex: 'createTime', width: 180, render: t => formatDateTime(t) },
    { title: '操作', width: 160, render: (_, r) => (
      <Space>
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(r)}>预览</Button>
        <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r.id)}>下载</Button>
      </Space>
    )},
  ];

  const isAllSelected = displayVouchers.length > 0 && displayVouchers.every(v => selectedIds.includes(v.id));

  return (
    <div className="space-y-6">
      {displayMode && (
        <Alert message="演示模式" description="当前展示演示电子凭证，登录后可查看和下载真实凭证" type="info" showIcon icon={<InfoCircleOutlined />} closable />
      )}
      <Card className="shadow-md card-hover">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">时间范围</span>
            <DatePicker.RangePicker value={dateRange} onChange={v => setDateRange(v as any)} allowClear />
          </div>
          <Space>
            <Button type="primary" onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
            <Button icon={<DownloadOutlined />} onClick={handleBatchDownload} disabled={selectedIds.length === 0}>
              批量下载 ({selectedIds.length})
            </Button>
          </Space>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
          <Checkbox checked={isAllSelected} indeterminate={selectedIds.length > 0 && !isAllSelected} onChange={e => handleSelectAll(e.target.checked)}>全选</Checkbox>
          <span className="text-sm text-gray-500">共 {displayTotal} 条记录</span>
        </div>

        <Table rowKey="id" columns={columns} dataSource={displayVouchers} loading={loading}
          pagination={{ current: page, pageSize, total: displayTotal, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`, onChange: (p, ps) => { setPage(p); setPageSize(ps); setSelectedIds([]); } }}
          onRow={r => ({ onClick: () => toggleSelect(r.id), style: { cursor: 'pointer' } })} />
      </Card>

      <Modal title="凭证预览" open={previewVisible} onCancel={() => setPreviewVisible(false)} footer={null} width={480}>
        {currentVoucher && (
          <div className="p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-1">电子缴费凭证</h3>
              <p className="text-sm text-gray-500">Electronic Payment Voucher</p>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">扫码验证</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">凭证号</span><span className="font-mono font-medium">{currentVoucher.voucherNo}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-mono font-medium">{currentVoucher.paymentNo}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">金额</span><span className="font-bold text-primary-600 text-lg tabular-nums">{formatMoney(currentVoucher.amount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">生成时间</span><span>{formatDateTime(currentVoucher.createTime)}</span></div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">本凭证由系统自动生成，具有法律效力</p>
              <p className="text-xs text-gray-400 mt-1">查询网址：https://www.example.com/verify</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VoucherPage;
