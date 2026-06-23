import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Table, Button, Tag, Select, Tabs } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { billApi } from '../api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const BillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('department');

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await billApi.getDetail(id!);
      setBill(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!bill) return;
    try {
      const wsData: any[] = [];
      bill.details?.forEach((d: any) => {
        wsData.push({
          '维度': d.department || d.project || d.recipientCity || '-',
          '订单数': d.orderCount,
          '总重量(kg)': d.totalWeight,
          '总费用(元)': d.totalFee,
        });
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '账单明细');
      XLSX.writeFile(wb, `${bill.enterpriseName}_${bill.month}_账单明细.xlsx`);
    } catch (err) {
      console.error(err);
    }
  };

  const detailColumns = [
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (_: any, record: any) => record.department || record.project || record.recipientCity || '-',
    },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount', width: 100 },
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
  ];

  const statusMap: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'default' },
    confirmed: { text: '已确认', color: 'blue' },
    paid: { text: '已支付', color: 'green' },
    overdue: { text: '已逾期', color: 'red' },
  };

  if (!bill) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const statusInfo = statusMap[bill.status] || { text: bill.status, color: 'default' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <a onClick={() => navigate(-1)} style={{ marginRight: 12 }}>
          <ArrowLeftOutlined />
        </a>
        <h2 style={{ margin: 0 }}>账单详情</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="企业名称">{bill.enterpriseName}</Descriptions.Item>
          <Descriptions.Item label="账单月份">{bill.month}</Descriptions.Item>
          <Descriptions.Item label="订单总数">{bill.totalOrders}</Descriptions.Item>
          <Descriptions.Item label="总重量">{bill.totalWeight?.toFixed(2)}kg</Descriptions.Item>
          <Descriptions.Item label="账单状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="已支付金额">¥{bill.paidAmount?.toFixed(2) || '0.00'}</Descriptions.Item>
          <Descriptions.Item
            label="应付总额"
            span={2}
            style={{ color: '#f5222d', fontSize: 20, fontWeight: 'bold' }}
          >
            ¥{bill.totalFee?.toFixed(2)}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button icon={<DownloadOutlined />} type="primary" onClick={handleExport}>
            导出Excel
          </Button>
        </div>
      </Card>

      <Card title="明细汇总">
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>统计维度：</span>
          <Select
            style={{ width: 150 }}
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { value: 'department', label: '按部门' },
              { value: 'project', label: '按项目' },
              { value: 'recipient_city', label: '按收件城市' },
            ]}
          />
        </div>
        <Table
          size="small"
          columns={detailColumns}
          dataSource={bill.details || []}
          rowKey="id"
          pagination={false}
          summary={(pageData) => {
            let totalOrders = 0;
            let totalWeight = 0;
            let totalFee = 0;
            pageData.forEach((d: any) => {
              totalOrders += d.orderCount || 0;
              totalWeight += d.totalWeight || 0;
              totalFee += d.totalFee || 0;
            });
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>{totalOrders}</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>{totalWeight.toFixed(2)}kg</Table.Summary.Cell>
                <Table.Summary.Cell index={3} style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{totalFee.toFixed(2)}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default BillDetail;
