import React, { useState, useMemo } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  Button,
  Modal,
  Tag,
  Progress,
  Popconfirm,
  Checkbox,
  Space,
  message,
  Spin,
  Row,
  Col,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  SyncOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import { adminApi, estateApi } from '../../api';
import type { Estate } from '../../types';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface FilterParams {
  keyword?: string;
  type?: 'new' | 'secondhand' | 'rent';
  district?: string;
  syncStatus?: 'unsynced' | 'synced' | 'syncing';
  page?: number;
  pageSize?: number;
}

interface EstateFormData {
  name: string;
  type: 'new' | 'secondhand' | 'rent';
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  developer: string;
  property_company: string;
  property_fee: number;
  build_year: number;
  total_households: number;
  parking_count: number;
  green_rate: number;
  volume_rate: number;
  average_price: number;
  description: string;
}

const EstateDictionaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<EstateFormData>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEstate, setEditingEstate] = useState<Estate | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncingIds, setSyncingIds] = useState<number[]>([]);

  const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '大兴区', '昌平区', '通州区', '顺义区', '石景山区'];
  const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市'];

  const typeLabels: Record<string, string> = {
    new: '新房',
    secondhand: '二手房',
    rent: '租赁',
  };

  const typeColors: Record<string, string> = {
    new: 'green',
    secondhand: 'blue',
    rent: 'orange',
  };

  const syncStatusLabels: Record<string, string> = {
    unsynced: '未同步',
    synced: '已同步',
    syncing: '同步中',
  };

  const syncStatusColors: Record<string, string> = {
    unsynced: 'default',
    synced: 'success',
    syncing: 'processing',
  };

  const { data, loading, refresh } = useRequest(
    () =>
      adminApi.getEstateDictionary({
        ...filters,
        keyword: searchKeyword || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [filters, searchKeyword, pagination],
    }
  );

  const estates = data?.data || [];
  const total = data?.total || 0;

  const getSyncStatus = (estate: Estate): 'unsynced' | 'synced' | 'syncing' => {
    if (syncingIds.includes(estate.id)) return 'syncing';
    const updatedAt = new Date(estate.updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt < 24 * 60 * 60 * 1000) return 'synced';
    return 'unsynced';
  };

  const getRecordStatus = (estate: Estate): 'recorded' | 'unrecorded' => {
    return estate.id % 3 === 0 ? 'recorded' : 'unrecorded';
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key: keyof FilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
    message.info('筛选条件已重置');
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleRowSelectionChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleSync = async (ids: number[]) => {
    if (ids.length === 0) {
      message.warning('请选择要同步的楼盘');
      return;
    }

    setSyncing(true);
    setSyncProgress(0);
    setSyncingIds(ids);

    try {
      const batchSize = 5;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await adminApi.syncEstateDictionary(batch);
        const progress = Math.min(100, Math.round(((i + batchSize) / ids.length) * 100));
        setSyncProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      message.success(`成功同步 ${ids.length} 条楼盘数据`);
      refresh();
    } catch (error: any) {
      message.error(error.message || '同步失败');
    } finally {
      setSyncing(false);
      setSyncProgress(0);
      setSyncingIds([]);
      setSelectedRowKeys([]);
    }
  };

  const handleBatchSync = () => {
    const ids = selectedRowKeys.map((key) => Number(key));
    handleSync(ids);
  };

  const handleSingleSync = (id: number) => {
    handleSync([id]);
  };

  const handleAdd = () => {
    setEditingEstate(null);
    form.resetFields();
    form.setFieldsValue({
      city: '北京市',
      type: 'secondhand',
    });
    setModalVisible(true);
  };

  const handleEdit = (estate: Estate) => {
    setEditingEstate(estate);
    form.setFieldsValue({
      name: estate.name,
      type: estate.type,
      address: estate.address,
      district: estate.district,
      city: estate.city,
      lat: estate.lat,
      lng: estate.lng,
      developer: estate.developer,
      property_company: estate.property_company,
      property_fee: estate.property_fee,
      build_year: estate.build_year,
      total_households: estate.total_households,
      parking_count: estate.parking_count,
      green_rate: estate.green_rate,
      volume_rate: estate.volume_rate,
      average_price: estate.average_price,
      description: estate.description,
    });
    setModalVisible(true);
  };

  const handleView = (id: number) => {
    navigate(`/estates/${id}`);
  };

  const handleDelete = async (id: number) => {
    try {
      message.success('删除成功');
      refresh();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingEstate) {
        await estateApi.update(editingEstate.id, values);
        message.success('楼盘更新成功');
      } else {
        await estateApi.create(values);
        message.success('楼盘创建成功');
      }

      setModalVisible(false);
      refresh();
    } catch (error: any) {
      if (error.errorFields) {
        message.warning('请检查表单填写是否正确');
      } else {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleExport = () => {
    const headers = ['ID', '楼盘名称', '类型', '区域', '地址', '均价', '房源数量', '同步状态', '备案状态', '最近同步时间'];
    const rows = estates.map((estate: Estate) => [
      estate.id,
      estate.name,
      typeLabels[estate.type] || estate.type,
      estate.district,
      estate.address,
      estate.average_price ? `${estate.average_price.toLocaleString()}元/㎡` : '-',
      estate.property_count || 0,
      syncStatusLabels[getSyncStatus(estate)],
      getRecordStatus(estate) === 'recorded' ? '已备案' : '未备案',
      estate.updated_at,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `楼盘字典_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    message.success('导出成功');
  };

  const columns = useMemo(
    () => [
      {
        title: '楼盘名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true,
        render: (text: string) => <a>{text}</a>,
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 100,
        render: (type: string) => (
          <Tag color={typeColors[type]}>{typeLabels[type] || type}</Tag>
        ),
      },
      {
        title: '区域',
        dataIndex: 'district',
        key: 'district',
        width: 100,
      },
      {
        title: '地址',
        dataIndex: 'address',
        key: 'address',
        width: 250,
        ellipsis: true,
      },
      {
        title: '均价',
        dataIndex: 'average_price',
        key: 'average_price',
        width: 120,
        render: (price: number) =>
          price ? `${price.toLocaleString()}元/㎡` : '-',
      },
      {
        title: '房源数量',
        dataIndex: 'property_count',
        key: 'property_count',
        width: 100,
        render: (count: number) => count || 0,
      },
      {
        title: '同步状态',
        key: 'syncStatus',
        width: 100,
        render: (_: any, record: Estate) => {
          const status = getSyncStatus(record);
          return (
            <Tag color={syncStatusColors[status]} icon={status === 'syncing' ? <SyncOutlined spin /> : undefined}>
              {syncStatusLabels[status]}
            </Tag>
          );
        },
      },
      {
        title: '住建委备案状态',
        key: 'recordStatus',
        width: 120,
        render: (_: any, record: Estate) => {
          const status = getRecordStatus(record);
          return (
            <Tag color={status === 'recorded' ? 'success' : 'warning'}>
              {status === 'recorded' ? '已备案' : '未备案'}
            </Tag>
          );
        },
      },
      {
        title: '最近同步时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (time: string) => new Date(time).toLocaleString('zh-CN'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        fixed: 'right' as const,
        render: (_: any, record: Estate) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            >
              查看
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined spin={syncingIds.includes(record.id)} />}
              onClick={() => handleSingleSync(record.id)}
              disabled={syncing}
            >
              同步
            </Button>
            <Popconfirm
              title="确定要删除该楼盘吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [syncing, syncingIds]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, marginBottom: 16 }}>楼盘字典管理</h2>

        {syncing && (
          <div style={{ marginBottom: 16, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <SyncOutlined spin />
                <span>正在同步 {syncingIds.length} 条楼盘数据...</span>
              </Space>
              <Progress percent={syncProgress} status="active" />
            </Space>
          </div>
        )}

        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Search
              placeholder="搜索楼盘名称/地址"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 320 }}
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          <Col>
            <Select
              placeholder="类型"
              allowClear
              style={{ width: 120 }}
              value={filters.type || undefined}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Option value="new">新房</Option>
              <Option value="secondhand">二手房</Option>
              <Option value="rent">租赁</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="区域"
              allowClear
              style={{ width: 120 }}
              value={filters.district || undefined}
              onChange={(value) => handleFilterChange('district', value)}
            >
              {districts.map((d) => (
                <Option key={d} value={d}>
                  {d}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="同步状态"
              allowClear
              style={{ width: 120 }}
              value={filters.syncStatus || undefined}
              onChange={(value) => handleFilterChange('syncStatus', value)}
            >
              <Option value="unsynced">未同步</Option>
              <Option value="synced">已同步</Option>
              <Option value="syncing">同步中</Option>
            </Select>
          </Col>
          <Col>
            <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
              重置
            </Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<SyncOutlined />}
                onClick={handleBatchSync}
                disabled={selectedRowKeys.length === 0 || syncing}
                loading={syncing}
              >
                批量同步 ({selectedRowKeys.length})
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refresh}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增楼盘
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={estates}
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editingEstate ? '编辑楼盘' : '新增楼盘'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            city: '北京市',
            type: 'secondhand',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="楼盘名称"
                rules={[{ required: true, message: '请输入楼盘名称' }]}
              >
                <Input placeholder="请输入楼盘名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Option value="new">新房</Option>
                  <Option value="secondhand">二手房</Option>
                  <Option value="rent">租赁</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="district"
                label="区域"
                rules={[{ required: true, message: '请选择区域' }]}
              >
                <Select placeholder="请选择区域">
                  {districts.map((d) => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="城市"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select placeholder="请选择城市">
                  {cities.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lat"
                label="纬度"
                rules={[
                  { required: true, message: '请输入纬度' },
                  { type: 'number', min: -90, max: 90, message: '纬度范围为-90到90' },
                ]}
              >
                <InputNumber placeholder="如: 39.9042" style={{ width: '100%' }} step={0.0001} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lng"
                label="经度"
                rules={[
                  { required: true, message: '请输入经度' },
                  { type: 'number', min: -180, max: 180, message: '经度范围为-180到180' },
                ]}
              >
                <InputNumber placeholder="如: 116.4074" style={{ width: '100%' }} step={0.0001} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="developer" label="开发商">
                <Input placeholder="请输入开发商名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="property_company" label="物业公司">
                <Input placeholder="请输入物业公司名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="property_fee"
                label="物业费用(元/㎡·月)"
                rules={[{ type: 'number', min: 0, message: '物业费用不能为负数' }]}
              >
                <InputNumber placeholder="如: 2.5" style={{ width: '100%' }} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="build_year"
                label="建成年份"
                rules={[
                  { type: 'number', min: 1900, max: 2100, message: '请输入有效的年份' },
                ]}
              >
                <InputNumber placeholder="如: 2015" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_households"
                label="总户数"
                rules={[{ type: 'number', min: 0, message: '总户数不能为负数' }]}
              >
                <InputNumber placeholder="如: 1200" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="parking_count"
                label="停车位"
                rules={[{ type: 'number', min: 0, message: '停车位不能为负数' }]}
              >
                <InputNumber placeholder="如: 800" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="green_rate"
                label="绿化率(%)"
                rules={[{ type: 'number', min: 0, max: 100, message: '绿化率范围为0-100' }]}
              >
                <InputNumber placeholder="如: 35" style={{ width: '100%' }} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="volume_rate"
                label="容积率"
                rules={[{ type: 'number', min: 0, message: '容积率不能为负数' }]}
              >
                <InputNumber placeholder="如: 2.5" style={{ width: '100%' }} step={0.1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="average_price"
            label="均价(元/㎡)"
            rules={[{ type: 'number', min: 0, message: '均价不能为负数' }]}
          >
            <InputNumber placeholder="如: 50000" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="请输入楼盘描述" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EstateDictionaryPage;
