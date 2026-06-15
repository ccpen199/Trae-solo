import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Select, Tag, Typography, Space, Progress, App, Statistic } from 'antd';
import { FilterOutlined, ShopOutlined, BlockOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';

const { Title, Text } = Typography;
const { Option } = Select;

interface BomSummary {
  contract_count: number;
  material_items: number;
  total_material_cost: number;
  avg_material_ratio: number;
}

interface BomItem {
  contract_id: string;
  contract_no: string;
  material_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  status: string;
  supplier_name: string;
  contract_total: number;
  cost_percentage: number;
}

const statusMap: Record<string, { text: string; color: string }> = {
  planned: { text: '已计划', color: 'default' },
  ordered: { text: '已下单', color: 'blue' },
  delivered: { text: '已配送', color: 'warning' },
  installed: { text: '已安装', color: 'success' },
};

const BomAnalysis: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [contractFilter, setContractFilter] = useState<string | undefined>();
  const [summary, setSummary] = useState<BomSummary>({
    contract_count: 0,
    material_items: 0,
    total_material_cost: 0,
    avg_material_ratio: 0,
  });
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [contractList, setContractList] = useState<{ id: string; contract_no: string }[]>([]);

  useEffect(() => {
    fetchBomData(contractFilter);
  }, [contractFilter]);

  useEffect(() => {
    fetchContractList();
  }, []);

  const fetchContractList = async () => {
    try {
      const response = await apiClient.get('/contracts');
      const contracts = response.data || [];
      setContractList(contracts.map((c: any) => ({ id: c.id, contract_no: c.contract_no })));
    } catch (error: any) {
      console.error('获取合同列表失败', error);
    }
  };

  const fetchBomData = async (contractId?: string) => {
    setLoading(true);
    try {
      const params = contractId ? { contract_id: contractId } : {};
      const response = await apiClient.get('/admin/bom/cost-analysis', { params });
      const data = response.data;
      setSummary(data.summary || {
        contract_count: 0,
        material_items: 0,
        total_material_cost: 0,
        avg_material_ratio: 0,
      });
      setBomItems(data.cost_breakdown || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取BOM数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = () => {
    const categoryMap: Record<string, number> = {};
    bomItems.forEach((item) => {
      const category = categorizeMaterial(item.material_name);
      categoryMap[category] = (categoryMap[category] || 0) + item.total_price;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const categorizeMaterial = (name: string): string => {
    if (name.includes('砖') || name.includes('瓷砖') || name.includes('地板')) return '瓷砖地板';
    if (name.includes('涂料') || name.includes('漆') || name.includes('腻子')) return '油漆涂料';
    if (name.includes('门') || name.includes('窗') || name.includes('柜')) return '木作门窗';
    if (name.includes('管') || name.includes('线') || name.includes('电') || name.includes('水')) return '水电材料';
    if (name.includes('水泥') || name.includes('沙') || name.includes('石') || name.includes('砖')) return '基础建材';
    if (name.includes('灯') || name.includes('洁具') || name.includes('卫浴')) return '灯具洁具';
    if (name.includes('板') || name.includes('龙骨') || name.includes('吊顶')) return '吊顶板材';
    return '其他材料';
  };

  const categoryColors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16', '#8c8c8c'];

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '材料类别',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
        },
        data: getCategoryData().map((item, index) => ({
          ...item,
          itemStyle: { color: categoryColors[index % categoryColors.length] },
        })),
      },
    ],
  };

  const columns = [
    {
      title: '材料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 160,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 140,
    },
    {
      title: '数量',
      key: 'quantity',
      width: 100,
      render: (_: any, record: BomItem) => (
        <Text>{record.quantity} {record.unit}</Text>
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price: number) => (
        <Text>¥{price?.toLocaleString() || 0}</Text>
      ),
    },
    {
      title: '小计',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 130,
      render: (price: number) => (
        <Text strong style={{ color: '#f5222d', fontSize: 15 }}>
          ¥{price?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color as any}>{info.text}</Tag>;
      },
    },
    {
      title: '占合同额比例',
      key: 'cost_percentage',
      width: 180,
      render: (_: any, record: BomItem) => {
        const percent = Number(record.cost_percentage?.toFixed(2)) || 0;
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Text type="secondary">
                {record.contract_no} · ¥{record.contract_total?.toLocaleString() || 0}
              </Text>
              <Text strong>{percent}%</Text>
            </div>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent > 30 ? '#f5222d' : percent > 15 ? '#faad14' : '#1890ff'}
              showInfo={false}
            />
          </Space>
        );
      },
    },
  ];

  const statCards = [
    {
      title: '合同数量',
      value: summary.contract_count,
      suffix: '份',
      icon: <ShopOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
    {
      title: '材料项数',
      value: summary.material_items,
      suffix: '项',
      icon: <BlockOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '材料总成本',
      value: summary.total_material_cost,
      suffix: '元',
      icon: <DollarOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      color: '#f9f0ff',
      isMoney: true,
    },
    {
      title: '材料占比均值',
      value: Number(summary.avg_material_ratio?.toFixed(2)) || 0,
      suffix: '%',
      icon: <PercentageOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          供应链BOM成本穿透分析
        </Title>
        <Text type="secondary">
          全面分析各合同的材料成本构成，识别成本优化空间
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                background: card.color,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 28, color: '#333' }}>
                      {card.isMoney
                        ? `¥${card.value?.toLocaleString() || 0}`
                        : card.value?.toLocaleString() || 0}
                      <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>{card.suffix}</span>
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title="材料类别成本占比"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <ReactECharts
              option={pieOption}
              style={{ height: 320 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title="材料成本明细"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
            extra={
              <Space>
                <FilterOutlined style={{ color: '#666' }} />
                <Select
                  placeholder="按合同筛选"
                  style={{ width: 200 }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  value={contractFilter}
                  onChange={setContractFilter}
                >
                  {contractList.map((c) => (
                    <Option key={c.id} value={c.id}>{c.contract_no}</Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Table
              rowKey="contract_id"
              columns={columns}
              dataSource={bomItems}
              loading={loading}
              scroll={{ x: 1100, y: 280 }}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BomAnalysis;
