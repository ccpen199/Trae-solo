import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  DatePicker,
  Table,
  Tag,
  message,
  Radio,
} from 'antd';
import {
  PayCircleOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { reportApi, paymentApi } from '@/services/payment';
import { formatMoney, formatDateTime, serviceTypeMap, paymentStatusMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Reconciliation: React.FC = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [statistics, setStatistics] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [dateParams, setDateParams] = useState({ startTime: '', endTime: '' });

  const getTimeParams = (range: string) => {
    const today = dayjs();
    switch (range) {
      case 'today':
        return { startTime: today.startOf('day').format('YYYY-MM-DD HH:mm:ss'), endTime: today.endOf('day').format('YYYY-MM-DD HH:mm:ss') };
      case 'yesterday':
        return { startTime: today.subtract(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'), endTime: today.subtract(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss') };
      case '7days':
        return { startTime: today.subtract(6, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'), endTime: today.endOf('day').format('YYYY-MM-DD HH:mm:ss') };
      case '30days':
        return { startTime: today.subtract(29, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss'), endTime: today.endOf('day').format('YYYY-MM-DD HH:mm:ss') };
      default:
        return dateParams;
    }
  };

  const loadStatistics = async () => {
    try {
      const params = getTimeParams(timeRange);
      const res: any = await reportApi.getPaymentStatistics({ ...params, type: 'day' });
      if (res.code === 0) {
        setStatistics(res.data);
      }
    } catch (error) {
      console.error('加载统计数据失败');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = getTimeParams(timeRange);
      const res: any = await paymentApi.getPaymentRecords({
        ...params,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 0) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    loadRecords();
  }, [pagination, timeRange, dateParams]);

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateParams({
        startTime: dates[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        endTime: dates[1].endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      });
      setTimeRange('custom');
      setPagination({ ...pagination, current: 1 });
    }
  };

  const handleExport = async () => {
    try {
      const params = getTimeParams(timeRange);
      const res: any = await paymentApi.exportRecords(params);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `对账报表_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: statistics?.dailyTrend?.slice(0, 7).reverse().map((item: any) => item.date) || [],
    },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [
      {
        type: 'line',
        smooth: true,
        data: statistics?.dailyTrend?.slice(0, 7).reverse().map((item: any) => item.amount) || [],
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#165DFF' },
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}元 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: statistics?.typeRatio?.map((item: any) => ({
          value: item.amount,
          name: item.typeName,
        })) || [],
      },
    ],
  };

  const columns: ColumnsType<any> = [
    { title: '时间', dataIndex: 'createTime', width: 160, render: (t) => formatDateTime(t) },
    { title: '订单号', dataIndex: 'paymentNo', width: 200 },
    { title: '户号', dataIndex: 'householdNos', width: 140, render: (n) => n?.[0] || '-' },
    {
      title: '类型',
      dataIndex: 'serviceTypes',
      width: 100,
      render: (t) => <StatusTag type="service" status={t?.[0]} />,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (a) => <span className="text-blue-600 font-medium">{formatMoney(a)}</span>,
    },
    {
      title: '支付方式',
      dataIndex: 'payMethod',
      width: 100,
      render: (m) => {
        const map: Record<string, string> = { wechat: '微信', alipay: '支付宝', bank: '银行卡' };
        return map[m] || m;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag type="payment" status={s} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">对账报表</h2>
        <Space>
          <Radio.Group value={timeRange} onChange={(e) => handleTimeRangeChange(e.target.value)}>
            <Radio.Button value="today">今日</Radio.Button>
            <Radio.Button value="yesterday">昨日</Radio.Button>
            <Radio.Button value="7days">近7天</Radio.Button>
            <Radio.Button value="30days">近30天</Radio.Button>
          </Radio.Group>
          <RangePicker onChange={handleDateChange} />
          <Button icon={<ReloadOutlined />} onClick={() => { loadStatistics(); loadRecords(); }}>刷新</Button>
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>导出Excel</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="总金额"
              value={statistics?.totalAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="总笔数"
              value={statistics?.totalCount || 0}
              valueStyle={{ color: '#00B42A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="水费"
              value={statistics?.waterAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#00B8D9' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic
              title="电费"
              value={statistics?.electricityAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#FF8800' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="缴费趋势" className="shadow-sm">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="类型占比" className="shadow-sm">
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="缴费明细" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
        />
      </Card>
    </div>
  );
};

export default Reconciliation;
