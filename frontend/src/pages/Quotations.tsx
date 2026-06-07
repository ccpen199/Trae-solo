import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Descriptions, Drawer, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Timeline, Switch, message,
} from 'antd';
import {
  EyeOutlined, PlusOutlined, SwapOutlined, WarningOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, CheckOutlined, CloseOutlined, HistoryOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/utils/api';

type Quotation = {
  id: number;
  project_id: number;
  title: string;
  company_name?: string;
  total_price: number;
  material_cost: number;
  labor_cost: number;
  status: string;
  created_at: string;
  versions?: { version: number; created_at: string; total_price: number }[];
};

type QuotationItem = {
  id: number;
  quotation_id: number;
  category: string;
  item_name: string;
  specification?: string;
  unit_price: number;
  quantity: number;
  unit: string;
  craft_standard?: string;
  is_additional: boolean;
  subtotal: number;
};

type Project = {
  id: number;
  title: string;
};

type WarningItem = QuotationItem & { severity: 'high' | 'medium' | 'low' };

const categoryOptions = [
  { value: '水电', label: '水电' },
  { value: '泥木', label: '泥木' },
  { value: '油漆', label: '油漆' },
  { value: '木工', label: '木工' },
  { value: '拆除', label: '拆除' },
  { value: '其他', label: '其他' },
];

const statusColors: Record<string, string> = {
  draft: 'blue',
  submitted: 'orange',
  accepted: 'green',
  rejected: 'red',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  accepted: '已采纳',
  rejected: '已驳回',
};

const severityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const severityLabels: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

const emptyItem = {
  category: undefined,
  item_name: '',
  specification: '',
  unit_price: 0,
  quantity: 0,
  unit: '',
  craft_standard: '',
  is_additional: false,
};

export default function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<Record<number, QuotationItem[]>>({});

  const [warningsOpen, setWarningsOpen] = useState(false);
  const [warnings, setWarnings] = useState<{ additionalItems: WarningItem[]; priceAlerts: { msg: string; severity: 'high' | 'medium' | 'low' }[]; additionalRatio: number }>({ additionalItems: [], priceAlerts: [], additionalRatio: 0 });

  const [itemEditOpen, setItemEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editRowForm] = Form.useForm();

  const [showVersions, setShowVersions] = useState(false);

  const [createForm] = Form.useForm();
  const [itemForm] = Form.useForm();

  const createFormItems = Form.useWatch('items', createForm);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filterProject) params.project_id = filterProject;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/quotations', { params });
      const data = res.data.data;
      setQuotations(data.list || []);
      setTotal(data.total || 0);
    } catch {
      message.error('获取报价列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterProject, filterStatus]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects', { params: { pageSize: 100 } });
      setProjects(res.data.data.list || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  useEffect(() => {
    if (createOpen) {
      createForm.setFieldsValue({
        items: [emptyItem, emptyItem, emptyItem],
      });
    }
  }, [createOpen, createForm]);

  const calculateTotals = (itemsData: any[]) => {
    let materialCost = 0;
    let laborCost = 0;
    itemsData.forEach((item) => {
      const subtotal = (item?.unit_price || 0) * (item?.quantity || 0);
      if (item?.category === '水电' || item?.category === '泥木' || item?.category === '油漆') {
        materialCost += subtotal * 0.6;
        laborCost += subtotal * 0.4;
      } else {
        materialCost += subtotal * 0.5;
        laborCost += subtotal * 0.5;
      }
    });
    return {
      materialCost,
      laborCost,
      total: materialCost + laborCost,
    };
  };

  const createTotals = createFormItems ? calculateTotals(createFormItems) : { materialCost: 0, laborCost: 0, total: 0 };

  async function handleCreate(values: { project_id: number; title: string; company_name?: string; items: any[] }) {
    try {
      const { items: formItems, ...quotationData } = values;
      const validItems = formItems.filter((item: any) => item.item_name && item.unit_price > 0 && item.quantity > 0);

      if (validItems.length === 0) {
        message.error('请至少填写一个有效的明细项目');
        return;
      }

      const totals = calculateTotals(validItems);
      const createRes = await api.post('/quotations', {
        ...quotationData,
        material_cost: totals.materialCost,
        labor_cost: totals.laborCost,
        total_price: totals.total,
        status: 'draft',
      });

      const quotationId = createRes.data.data.id;

      const itemPayloads = validItems.map((item: any) => ({
        ...item,
        subtotal: item.unit_price * item.quantity,
      }));

      await Promise.all(itemPayloads.map((payload: any) =>
        api.post(`/quotations/${quotationId}/items`, payload)
      ));

      message.success('创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchQuotations();
    } catch {
      message.error('创建失败');
    }
  }

  async function handleViewDetail(record: Quotation) {
    setCurrentQuotation(record);
    setDetailOpen(true);
    setShowVersions(false);
    setEditingRowId(null);
    try {
      const res = await api.get(`/quotations/${record.id}/items`);
      setItems(res.data.data || []);
    } catch {
      // silent
    }
  }

  async function handleQuickCompare(record: Quotation) {
    const sameProjectQuotations = quotations.filter(
      (q) => q.project_id === record.project_id && q.id !== record.id
    );
    if (sameProjectQuotations.length === 0) {
      message.warning('该项目暂无其他报价可对比');
      return;
    }
    const ids = [record.id, ...sameProjectQuotations.slice(0, 2).map((q) => q.id)];
    setCompareIds(ids);
    setDetailOpen(false);
    setCompareOpen(true);
    const dataMap: Record<number, QuotationItem[]> = {};
    for (const id of ids) {
      try {
        const res = await api.get(`/quotations/${id}/items`);
        dataMap[id] = res.data.data || [];
      } catch {
        dataMap[id] = [];
      }
    }
    setCompareData(dataMap);
  }

  async function handleCompare() {
    if (compareIds.length < 2) {
      message.warning('请至少选择2个报价进行对比');
      return;
    }
    setCompareOpen(true);
    const dataMap: Record<number, QuotationItem[]> = {};
    for (const id of compareIds) {
      try {
        const res = await api.get(`/quotations/${id}/items`);
        dataMap[id] = res.data.data || [];
      } catch {
        dataMap[id] = [];
      }
    }
    setCompareData(dataMap);
  }

  async function handleWarnings(record: Quotation) {
    setWarningsOpen(true);
    try {
      const res = await api.get(`/quotations/${record.id}/items`);
      const allItems: QuotationItem[] = res.data.data || [];
      const additionalItems = allItems.filter((i) => i.is_additional);
      const additionalTotal = additionalItems.reduce((sum, i) => sum + i.subtotal, 0);
      const totalPrice = record.total_price || allItems.reduce((sum, i) => sum + i.subtotal, 0);
      const additionalRatio = totalPrice > 0 ? (additionalTotal / totalPrice) * 100 : 0;

      const warningItems: WarningItem[] = additionalItems.map((item) => {
        let severity: 'high' | 'medium' | 'low' = 'low';
        if (item.subtotal > 10000) severity = 'high';
        else if (item.subtotal > 5000) severity = 'medium';
        return { ...item, severity };
      });

      const priceAlerts: { msg: string; severity: 'high' | 'medium' | 'low' }[] = [];
      const categoryTotals: Record<string, number> = {};
      allItems.forEach((item) => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.subtotal;
      });
      Object.entries(categoryTotals).forEach(([cat, catTotal]) => {
        let severity: 'high' | 'medium' | 'low' = 'low';
        if (catTotal > 80000) severity = 'high';
        else if (catTotal > 50000) severity = 'medium';
        if (catTotal > 50000) {
          priceAlerts.push({
            msg: `${cat} 类别总价 ¥${catTotal.toLocaleString()} 超过预警线`,
            severity,
          });
        }
      });

      setWarnings({ additionalItems: warningItems, priceAlerts, additionalRatio });
    } catch {
      // silent
    }
  }

  function handleExportWarningReport() {
    const content = [
      '===== 增项预警报告 =====',
      `生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
      '',
      `增项金额占比: ${warnings.additionalRatio.toFixed(2)}%`,
      '',
      '--- 增项项目 ---',
      ...warnings.additionalItems.map((item, idx) =>
        `${idx + 1}. [${severityLabels[item.severity]}] ${item.item_name} - ¥${item.subtotal.toLocaleString()}`
      ),
      '',
      '--- 价格预警 ---',
      ...warnings.priceAlerts.map((alert, idx) =>
        `${idx + 1}. [${severityLabels[alert.severity]}] ${alert.msg}`
      ),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `预警报告_${dayjs().format('YYYYMMDD_HHmmss')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  }

  async function handleSaveItem(values: Omit<QuotationItem, 'id' | 'quotation_id' | 'subtotal'> & { id?: number }) {
    if (!currentQuotation) return;
    try {
      const payload = { ...values, subtotal: (values.unit_price || 0) * (values.quantity || 0) };
      if (editingItem?.id) {
        await api.patch(`/quotations/${currentQuotation.id}/items/${editingItem.id}`, payload);
      } else {
        await api.post(`/quotations/${currentQuotation.id}/items`, payload);
      }
      message.success('保存成功');
      setItemEditOpen(false);
      setEditingItem(null);
      itemForm.resetFields();
      const res = await api.get(`/quotations/${currentQuotation.id}/items`);
      setItems(res.data.data || []);
    } catch {
      message.error('保存失败');
    }
  }

  async function handleRowEditSave(record: QuotationItem) {
    if (!currentQuotation) return;
    try {
      const values = editRowForm.getFieldsValue();
      const payload = {
        ...record,
        ...values,
        subtotal: (values.unit_price || 0) * (values.quantity || 0),
      };
      await api.patch(`/quotations/${currentQuotation.id}/items/${record.id}`, payload);
      message.success('保存成功');
      setEditingRowId(null);
      const res = await api.get(`/quotations/${currentQuotation.id}/items`);
      setItems(res.data.data || []);
    } catch {
      message.error('保存失败');
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!currentQuotation) return;
    try {
      await api.delete(`/quotations/${currentQuotation.id}/items/${itemId}`);
      message.success('删除成功');
      const res = await api.get(`/quotations/${currentQuotation.id}/items`);
      setItems(res.data.data || []);
    } catch {
      message.error('删除失败');
    }
  }

  function calculateCompareScore(qItems: QuotationItem[], allCompareData: Record<number, QuotationItem[]>) {
    let score = 100;
    const allItems = Object.values(allCompareData).flat();
    const itemNames = new Set(allItems.map((i) => i.item_name));

    itemNames.forEach((name) => {
      const sameItems = allItems.filter((i) => i.item_name === name);
      const qItem = qItems.find((i) => i.item_name === name);
      if (!qItem) {
        score -= 5;
        return;
      }
      const avgPrice = sameItems.reduce((s, i) => s + i.unit_price, 0) / sameItems.length;
      if (qItem.unit_price > avgPrice * 1.1) {
        score -= 3;
      } else if (qItem.unit_price < avgPrice * 0.9) {
        score += 2;
      }
      if (qItem.is_additional) score -= 2;
      if (qItem.craft_standard) score += 1;
    });

    return Math.max(0, Math.min(100, score));
  }

  function generateRecommendation(quotationsToCompare: Quotation[], scores: Record<number, number>) {
    if (quotationsToCompare.length < 2) {
      return '请至少选择两份报价后再生成对比建议。';
    }
    const sorted = [...quotationsToCompare].sort((a, b) => scores[b.id] - scores[a.id]);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    if (scores[best.id] - scores[worst.id] > 20) {
      return `强烈推荐「${best.company_name || best.title}」，综合评分最高（${scores[best.id]}分），价格合理且工艺标准完善。`;
    } else if (best.total_price < worst.total_price * 0.9) {
      return `推荐「${best.company_name || best.title}」，总价较低（¥${best.total_price.toLocaleString()}）且评分不错。`;
    }
    return `各报价差异不大，「${best.company_name || best.title}」综合评分略高（${scores[best.id]}分），建议结合具体需求选择。`;
  }

  const itemColumns: ColumnsType<QuotationItem> = [
    { title: '类别', dataIndex: 'category', key: 'category', width: 80 },
    { title: '项目名称', dataIndex: 'item_name', key: 'item_name', width: 120 },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 100, render: (v) => v || '-' },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v) => `¥${Number(v).toLocaleString()}` },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 50 },
    { title: '工艺标准', dataIndex: 'craft_standard', key: 'craft_standard', width: 120, render: (v) => v || '-' },
    {
      title: '增项',
      dataIndex: 'is_additional',
      key: 'is_additional',
      width: 60,
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => { setEditingItem(record); itemForm.setFieldsValue(record); setItemEditOpen(true); }}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const editableItemColumns: ColumnsType<QuotationItem> = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (text: string, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="category" style={{ margin: 0 }}>
              <Select options={categoryOptions} style={{ width: '100%' }} />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: '项目名称',
      dataIndex: 'item_name',
      key: 'item_name',
      width: 120,
      render: (text: string, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="item_name" style={{ margin: 0 }}>
              <Input />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 100,
      render: (text: string, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="specification" style={{ margin: 0 }}>
              <Input />
            </Form.Item>
          );
        }
        return text || '-';
      },
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 90,
      render: (text: number, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="unit_price" style={{ margin: 0 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          );
        }
        return `¥${Number(text).toLocaleString()}`;
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      render: (text: number, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="quantity" style={{ margin: 0 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 50,
      render: (text: string, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="unit" style={{ margin: 0 }}>
              <Input />
            </Form.Item>
          );
        }
        return text;
      },
    },
    {
      title: '工艺标准',
      dataIndex: 'craft_standard',
      key: 'craft_standard',
      width: 120,
      render: (text: string, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="craft_standard" style={{ margin: 0 }}>
              <Input />
            </Form.Item>
          );
        }
        return text || '-';
      },
    },
    {
      title: '增项',
      dataIndex: 'is_additional',
      key: 'is_additional',
      width: 60,
      render: (text: boolean, record: QuotationItem) => {
        if (editingRowId === record.id) {
          return (
            <Form.Item name="is_additional" valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          );
        }
        return text ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>;
      },
    },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (editingRowId === record.id) {
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleRowEditSave(record)}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setEditingRowId(null)}
              >
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRowId(record.id);
                editRowForm.setFieldsValue(record);
              }}
            >
              编辑
            </Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)}>删除</Button>
          </Space>
        );
      },
    },
  ];

  const quotationColumns: ColumnsType<Quotation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '装企', dataIndex: 'company_name', key: 'company_name', render: (v) => v || '-' },
    { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 120, render: (v) => `¥${Number(v).toLocaleString()}` },
    { title: '材料费', dataIndex: 'material_cost', key: 'material_cost', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
    { title: '人工费', dataIndex: 'labor_cost', key: 'labor_cost', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => { setCompareIds([record.id]); }}>对比</Button>
          <Button type="link" size="small" icon={<WarningOutlined />} onClick={() => handleWarnings(record)}>预警</Button>
        </Space>
      ),
    },
  ];

  function buildCompareTable() {
    const compareQuotations = quotations.filter((q) => compareIds.includes(q.id));
    if (compareQuotations.length < 2) {
      return <Alert type="info" message="请选择至少两份报价进行对比" showIcon />;
    }
    const allItemNames = new Set<string>();
    Object.values(compareData).forEach((items) => {
      items.forEach((item) => allItemNames.add(item.item_name));
    });

    const scores: Record<number, number> = {};
    compareQuotations.forEach((q) => {
      scores[q.id] = calculateCompareScore(compareData[q.id] || [], compareData);
    });

    const cols: ColumnsType<{ key: string; item_name: string; [k: string]: unknown }> = [
      { title: '项目名称', dataIndex: 'item_name', key: 'item_name', fixed: 'left', width: 140 },
      ...compareQuotations.map((q) => ({
        title: (
          <div>
            <div>{q.company_name || q.title}</div>
            <div style={{ fontSize: 11, color: '#888' }}>评分: {scores[q.id]}分</div>
          </div>
        ),
        key: `q_${q.id}`,
        width: 160,
        render: (_: unknown, row: { key: string; item_name: string; [k: string]: unknown }) => {
          const qItems = compareData[q.id] || [];
          const found = qItems.find((i) => i.item_name === row.item_name);
          if (!found) return <Tag color="red">缺失</Tag>;
          const prices = Object.values(compareData).flat().filter((i) => i.item_name === row.item_name);
          const avgPrice = prices.reduce((s, i) => s + i.unit_price, 0) / prices.length;
          const priceDiff = Math.abs(found.unit_price - avgPrice) / avgPrice;
          const isHighDiff = priceDiff > 0.1 && prices.length > 1;
          const isHighest = found.unit_price === Math.max(...prices.map((i) => i.unit_price)) && prices.length > 1;
          const isLowest = found.unit_price === Math.min(...prices.map((i) => i.unit_price)) && prices.length > 1;

          return (
            <Space direction="vertical" size={2}>
              <span
                style={isHighDiff ? { color: '#ff4d4f', fontWeight: 'bold' } : {}}
              >
                ¥{found.unit_price.toLocaleString()}
                {isHighest && <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>最高</Tag>}
                {isLowest && <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>最低</Tag>}
              </span>
              {found.is_additional && <Tag color="red" style={{ fontSize: 10 }}>增项</Tag>}
              {found.craft_standard && (
                <div style={{ fontSize: 11, color: '#666', background: '#f5f5f5', padding: '2px 4px', borderRadius: 4 }}>
                  工艺: {found.craft_standard}
                </div>
              )}
              {found.specification && (
                <span style={{ fontSize: 11, color: '#999' }}>规格: {found.specification}</span>
              )}
            </Space>
          );
        },
      })),
    ];

    return (
      <div>
        <Table
          rowKey="key"
          columns={cols}
          dataSource={Array.from(allItemNames).map((name) => ({ key: name, item_name: name }))}
          pagination={false}
          size="small"
          scroll={{ x: 140 + compareQuotations.length * 160 }}
        />
        <Card size="small" style={{ marginTop: 16 }} title="综合评分与推荐">
          <Row gutter={16} style={{ marginBottom: 12 }}>
            {compareQuotations.map((q) => (
              <Col key={q.id} span={24 / compareQuotations.length}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{q.company_name || q.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: scores[q.id] >= 80 ? '#52c41a' : scores[q.id] >= 60 ? '#faad14' : '#ff4d4f' }}>
                    {scores[q.id]}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>综合评分</div>
                </div>
              </Col>
            ))}
          </Row>
          <Alert type="info" message="推荐建议" description={generateRecommendation(compareQuotations, scores)} showIcon />
        </Card>
      </div>
    );
  }

  const mockVersions = currentQuotation ? [
    { version: 3, created_at: currentQuotation.created_at, total_price: currentQuotation.total_price },
    { version: 2, created_at: dayjs(currentQuotation.created_at).subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), total_price: currentQuotation.total_price * 0.95 },
    { version: 1, created_at: dayjs(currentQuotation.created_at).subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'), total_price: currentQuotation.total_price * 0.88 },
  ] : [];

  return (
    <div style={{ padding: 24 }}>
      <Card title="装修报价管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建报价</Button>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              placeholder="选择项目"
              allowClear
              style={{ width: 200 }}
              value={filterProject}
              onChange={(v) => { setFilterProject(v); setPage(1); }}
              options={projects.map((p) => ({ value: p.id, label: p.title }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 140 }}
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(1); }}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
          <Col>
            <Button icon={<SwapOutlined />} disabled={compareIds.length < 1} onClick={handleCompare}>
              对比选中 ({compareIds.length})
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={quotationColumns}
          dataSource={quotations}
          loading={loading}
          rowSelection={{
            selectedRowKeys: compareIds,
            onChange: (keys) => setCompareIds(keys as number[]),
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title="新建报价"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        width={1000}
        maskClosable={false}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
                <Select placeholder="请选择项目" options={projects.map((p) => ({ value: p.id, label: p.title }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="title" label="报价标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="请输入报价标题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="company_name" label="装企名称">
                <Input placeholder="请输入装企名称" />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="报价明细" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
            const currentItems = createForm.getFieldValue('items') || [];
            createForm.setFieldsValue({ items: [...currentItems, emptyItem] });
          }}>添加明细</Button>}>
            <Form.List name="items">
              {(fields, { remove }) => (
                <Table
                  rowKey="key"
                  size="small"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  columns={[
                    {
                      title: '类别',
                      dataIndex: 'category',
                      width: 90,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'category']} rules={[{ required: true, message: '必选' }]} style={{ margin: 0 }}>
                          <Select placeholder="请选择" options={categoryOptions} />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '项目名称',
                      dataIndex: 'item_name',
                      width: 120,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'item_name']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}>
                          <Input placeholder="项目名称" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '规格',
                      dataIndex: 'specification',
                      width: 100,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'specification']} style={{ margin: 0 }}>
                          <Input placeholder="规格" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '单价',
                      dataIndex: 'unit_price',
                      width: 90,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'unit_price']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}>
                          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="单价" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '数量',
                      dataIndex: 'quantity',
                      width: 70,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'quantity']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}>
                          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="数量" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '单位',
                      dataIndex: 'unit',
                      width: 70,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'unit']} rules={[{ required: true, message: '必填' }]} style={{ margin: 0 }}>
                          <Input placeholder="m²/项" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '工艺标准',
                      dataIndex: 'craft_standard',
                      width: 120,
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'craft_standard']} style={{ margin: 0 }}>
                          <Input placeholder="工艺标准" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '增项',
                      dataIndex: 'is_additional',
                      width: 60,
                      align: 'center',
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Form.Item name={[index, 'is_additional']} valuePropName="checked" style={{ margin: 0 }}>
                          <Switch size="small" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: '小计',
                      width: 80,
                      align: 'right',
                      render: (_: unknown, _record: unknown, index: number) => {
                        const itemsData = createForm.getFieldValue('items') || [];
                        const item = itemsData[index] || {};
                        const subtotal = (item.unit_price || 0) * (item.quantity || 0);
                        return <span>¥{subtotal.toLocaleString()}</span>;
                      },
                    },
                    {
                      title: '操作',
                      width: 50,
                      align: 'center',
                      render: (_: unknown, _record: unknown, index: number) => (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        />
                      ),
                    },
                  ]}
                  dataSource={fields.map((field) => ({ ...field }))}
                />
              )}
            </Form.List>
            <Row gutter={16} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: 12 }}>材料费合计</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>¥{createTotals.materialCost.toLocaleString()}</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: 12 }}>人工费合计</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>¥{createTotals.laborCost.toLocaleString()}</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: 12 }}>总金额</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>¥{createTotals.total.toLocaleString()}</div>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>

      <Drawer
        title="报价详情"
        width={950}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            <Button icon={<HistoryOutlined />} onClick={() => setShowVersions(!showVersions)}>
              {showVersions ? '隐藏历史' : '历史版本'}
            </Button>
            <Button icon={<SwapOutlined />} onClick={() => currentQuotation && handleQuickCompare(currentQuotation)}>
              报价对比
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); itemForm.resetFields(); setItemEditOpen(true); }}>
              添加项目
            </Button>
          </Space>
        }
      >
        {currentQuotation && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{currentQuotation.id}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentQuotation.title}</Descriptions.Item>
              <Descriptions.Item label="装企">{currentQuotation.company_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="总价">¥{Number(currentQuotation.total_price).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="材料费">¥{Number(currentQuotation.material_cost).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="人工费">¥{Number(currentQuotation.labor_cost).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColors[currentQuotation.status]}>{statusLabels[currentQuotation.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentQuotation.created_at ? dayjs(currentQuotation.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            {showVersions && (
              <Card size="small" title="报价历史版本" style={{ marginBottom: 16 }}>
                <Timeline
                  items={mockVersions.map((v) => ({
                    color: v.version === mockVersions.length ? 'green' : 'blue',
                    children: (
                      <div>
                        <div>
                          <strong>版本 v{v.version}</strong>
                          <Tag color="blue" style={{ marginLeft: 8 }}>¥{v.total_price.toLocaleString()}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>{dayjs(v.created_at).format('YYYY-MM-DD HH:mm')}</div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}

            <Form form={editRowForm}>
              <Table
                rowKey="id"
                columns={editableItemColumns}
                dataSource={items}
                pagination={false}
                size="small"
                scroll={{ x: 950 }}
              />
            </Form>
          </>
        )}
      </Drawer>

      <Modal title="报价对比" open={compareOpen} onCancel={() => setCompareOpen(false)} footer={null} width={900}>
        {compareOpen ? buildCompareTable() : null}
      </Modal>

      <Modal
        title="预警信息"
        open={warningsOpen}
        onCancel={() => setWarningsOpen(false)}
        width={750}
        footer={
          <Button icon={<DownloadOutlined />} onClick={handleExportWarningReport}>
            导出预警报告
          </Button>
        }
      >
        {warnings.additionalRatio > 15 && (
          <Alert
            type="error"
            message="严重警告"
            description={`增项金额占比达到 ${warnings.additionalRatio.toFixed(2)}%，超过15%警戒线，请重点关注！`}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}
        {warnings.priceAlerts.length > 0 && (
          <Card title="价格预警" size="small" style={{ marginBottom: 16 }}>
            {['high', 'medium', 'low'].map((severity) => {
              const alerts = warnings.priceAlerts.filter((a) => a.severity === severity);
              if (alerts.length === 0) return null;
              return (
                <div key={severity} style={{ marginBottom: alerts.length > 0 ? 8 : 0 }}>
                  <Tag color={severityColors[severity]}>{severityLabels[severity]}</Tag>
                  <ul style={{ margin: '4px 0 8px 28px', padding: 0 }}>
                    {alerts.map((a, i) => <li key={i}>{a.msg}</li>)}
                  </ul>
                </div>
              );
            })}
          </Card>
        )}
        {warnings.additionalItems.length > 0 && (
          <Card title="增项项目" size="small">
            {['high', 'medium', 'low'].map((severity) => {
              const items = warnings.additionalItems.filter((i) => i.severity === severity);
              if (items.length === 0) return null;
              return (
                <div key={severity} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={severityColors[severity]}>{severityLabels[severity]}</Tag>
                    <span style={{ color: '#888', fontSize: 12 }}>共 {items.length} 项</span>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={[
                      { title: '项目', dataIndex: 'item_name', key: 'item_name' },
                      { title: '类别', dataIndex: 'category', key: 'category', width: 70 },
                      { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80, render: (v) => `¥${Number(v).toLocaleString()}` },
                      { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 60 },
                      { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
                    ]}
                    dataSource={items}
                    pagination={false}
                  />
                </div>
              );
            })}
          </Card>
        )}
        {warnings.priceAlerts.length === 0 && warnings.additionalItems.length === 0 && (
          <Alert type="success" message="暂无预警信息" />
        )}
      </Modal>

      <Modal
        title={editingItem ? '编辑项目' : '添加项目'}
        open={itemEditOpen}
        onCancel={() => { setItemEditOpen(false); setEditingItem(null); itemForm.resetFields(); }}
        onOk={() => itemForm.submit()}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select placeholder="请选择类别" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="item_name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="specification" label="规格">
            <Input placeholder="请输入规格说明" />
          </Form.Item>
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item name="unit_price" label="单价" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Input placeholder="如：m²、项" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="craft_standard" label="工艺标准">
            <Input placeholder="请输入工艺标准" />
          </Form.Item>
          <Form.Item name="is_additional" label="是否增项" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
