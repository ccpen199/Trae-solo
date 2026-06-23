import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Select, Tag, Modal, message, Descriptions, List } from 'antd';
import { EyeOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { billApi } from '../api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  confirmed: { text: '已确认', color: 'blue' },
  paid: { text: '已支付', color: 'green' },
  overdue: { text: '已逾期', color: 'red' },
};

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState('all');
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));

  useEffect(() => {
    loadData();
  }, [page, pageSize, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (status && status !== 'all') params.status = status;
      const result = await billApi.getList(params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      await billApi.generate({ month, groupBy: 'department' });
      message.success('账单生成成功');
      setGenerateModalVisible(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (bill: any) => {
    try {
      const data = await billApi.exportBill(bill.id, { format: 'json' });

      const wsData: any[] = [];
      data.orders?.forEach((order: any) => {
        wsData.push({
          '运单号': order.waybillNo,
          '寄件人': order.senderName,
          '收件人': order.recipientName,
          '收件城市': order.recipientCity,
          '部门': order.department || '-',
          '项目': order.project || '-',
          '物品名称': order.goodsName,
          '重量(kg)': order.weight,
          '费用(元)': order.totalFee,
          '下单时间': order.createdAt,
          '状态': order.status,
        });
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '订单明细');

      if (data.details) {
        const summaryData = data.details.map((d: any) => ({
          '部门/项目': d.department || d.project || d.recipientCity || '-',
          '订单数': d.orderCount,
          '总重量(kg)': d.totalWeight,
          '总费用(元)': d.totalFee,
        }));
        const ws2 = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws2, '汇总统计');
      }

      XLSX.writeFile(wb, `${bill.enterpriseName}_${bill.month}_月结账单.xlsx`);
      message.success('导出成功');
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '企业名称', dataIndex: 'enterpriseName', key: 'enterpriseName' },
    { title: '账单月份', dataIndex: 'month', key: 'month', width: 120 },
    { title: '订单数', dataIndex: 'totalOrders', key: 'totalOrders', width: 100 },
    {
      title: '总重量',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 120,
      render: (w: number) => `${w?.toFixed(2)}kg`,
    },
    {
      title: '总费用',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 120,
      render: (f: number) => (
        <span style={{ fontWeight: 'bold', color: '#f5222d' }}>¥{f?.toFixed(2)}</span>
      ),
    },
    {
      title: '已支付',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (f: number) => `¥${f?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const info = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/bills/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record)}>
            导出
          </Button>
        </div>
      ),
    },
  ];

  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = dayjs().subtract(i, 'month').format('YYYY-MM');
    months.push({ value: m, label: m });
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>月结账单</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Select
              style={{ width: 150 }}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'draft', label: '草稿' },
                { value: 'confirmed', label: '已确认' },
                { value: 'paid', label: '已支付' },
                { value: 'overdue', label: '已逾期' },
              ]}
            />
          </div>
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateModalVisible(true)}>
              生成账单
            </Button>
          </div>
        </div>

        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title="生成月结账单"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        onOk={handleGenerate}
        okText="生成"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>选择月份</label>
          <Select style={{ width: '100%' }} value={month} onChange={setMonth} options={months} />
        </div>
        <div style={{ padding: 12, background: '#f6ffed', borderRadius: 6, fontSize: 12 }}>
          <p style={{ margin: 0, color: '#52c41a' }}>💡 提示</p>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            生成的账单将包含所选月份的所有企业订单数据，支持按部门、项目、收件地址等多维度统计。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Bills;
