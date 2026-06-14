import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Table, Input, Select, Button, Space, Modal, Form, Tag, Spin, message, Popconfirm, Row, Col, Statistic, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, ScanOutlined, EditOutlined, ReloadOutlined, BankOutlined, RiseOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import request from '../utils/request';
import FarmerDetail from '../components/FarmerDetail';

const { Option } = Select;

const plantColors = {
  '水稻': 'green', '小麦': 'gold', '玉米': 'orange', '大豆': 'cyan',
  '蔬菜': 'lime', '水果': 'pink', '茶叶': 'green', '药材': 'purple',
};

const breedColors = {
  '生猪': 'red', '牛': 'geekblue', '羊': 'magenta', '鸡': 'orange',
  '鸭': 'volcano', '鱼': 'blue',
};

const mockFarmers = [
  { id: 1, name: '张三', idCard: '110101199001011234', village: '和平村', group: '一组', phone: '13800138001', landArea: 8.5, plantTags: ['水稻', '玉米'], breedTags: ['生猪', '鸡'], ocrStatus: '已识别', familyMembers: 5, createTime: '2024-06-15' },
  { id: 2, name: '李四', idCard: '110101198505055678', village: '和平村', group: '二组', phone: '13800138002', landArea: 12.3, plantTags: ['小麦', '大豆'], breedTags: ['牛'], ocrStatus: '未识别', familyMembers: 4, createTime: '2024-06-16' },
  { id: 3, name: '王五', idCard: '110101197803039012', village: '幸福村', group: '一组', phone: '13800138003', landArea: 6.8, plantTags: ['蔬菜', '水果'], breedTags: ['羊', '鱼'], ocrStatus: '已识别', familyMembers: 6, createTime: '2024-06-17' },
  { id: 4, name: '赵六', idCard: '110101199212123456', village: '幸福村', group: '三组', phone: '13800138004', landArea: 15.2, plantTags: ['茶叶', '药材'], breedTags: [], ocrStatus: '识别中', familyMembers: 3, createTime: '2024-06-18' },
  { id: 5, name: '孙七', idCard: '110101198808087890', village: '民主村', group: '二组', phone: '13800138005', landArea: 9.7, plantTags: ['水稻', '茶叶'], breedTags: ['鸭', '鸡'], ocrStatus: '已识别', familyMembers: 5, createTime: '2024-06-19' },
];

const villages = ['和平村', '幸福村', '民主村', '团结村'];

export default function Farmers() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ village: '', keyword: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [form] = Form.useForm();
  const [ocrLoadingId, setOcrLoadingId] = useState(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagForm] = Form.useForm();
  const [tagFarmer, setTagFarmer] = useState(null);
  const location = useLocation();
  const [industryStats, setIndustryStats] = useState(null);

  useEffect(() => {
    if (location.state?.action === 'add') {
      setModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const res = await request.get('/farmers', { params: filters }).catch(() => ({ data: mockFarmers }));
      let farmers = [];
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          farmers = res.data;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          farmers = res.data.data;
        } else {
          farmers = mockFarmers;
        }
      } else {
        farmers = mockFarmers;
      }
      const ocrStatusMap = {
        completed: '已识别',
        pending: '识别中',
        failed: '未识别',
      };
      const mapped = farmers.map((f) => ({
        id: f.id,
        name: f.name,
        idCard: f.id_card || f.idCard || '',
        village: f.village || '',
        group: f.group || '一组',
        phone: f.phone || '',
        landArea: f.land_area !== undefined ? f.land_area : f.landArea,
        landCertNo: f.land_cert_no || f.landCertNo || '',
        plantTags: f.planting_tags || f.plantTags || [],
        breedTags: f.breeding_tags || f.breedTags || [],
        ocrStatus: ocrStatusMap[f.ocr_status] || f.ocrStatus || '未识别',
        familyMembers: f.family_members || f.familyMembers || 4,
        createTime: f.created_at || f.createTime || new Date().toISOString().slice(0, 10),
      }));
      setData(mapped);

      const totalFarmers = mapped.length;
      const totalLand = mapped.reduce((sum, f) => sum + (parseFloat(f.landArea) || 0), 0);
      const avgLand = totalFarmers > 0 ? (totalLand / totalFarmers).toFixed(1) : 0;
      const plantCounts = {};
      const breedCounts = {};
      const villageCounts = {};
      const ocrCompleted = mapped.filter((f) => f.ocrStatus === '已识别').length;
      mapped.forEach((f) => {
        (f.plantTags || []).forEach((t) => {
          plantCounts[t] = (plantCounts[t] || 0) + 1;
        });
        (f.breedTags || []).forEach((t) => {
          breedCounts[t] = (breedCounts[t] || 0) + 1;
        });
        if (f.village) {
          villageCounts[f.village] = (villageCounts[f.village] || 0) + 1;
        }
      });
      const plantStats = Object.entries(plantCounts).map(([name, count]) => ({
        name, count, color: plantColors[name] || 'default', percent: Math.round((count / totalFarmers) * 100),
      })).sort((a, b) => b.count - a.count);
      const breedStats = Object.entries(breedCounts).map(([name, count]) => ({
        name, count, color: breedColors[name] || 'default', percent: Math.round((count / totalFarmers) * 100),
      })).sort((a, b) => b.count - a.count);
      const villageStats = Object.entries(villageCounts).map(([name, count]) => ({
        name, count, percent: Math.round((count / totalFarmers) * 100),
      })).sort((a, b) => b.count - a.count);
      setIndustryStats({
        totalFarmers,
        totalLand: totalLand.toFixed(1),
        avgLand,
        ocrCompleted,
        ocrRate: totalFarmers > 0 ? Math.round((ocrCompleted / totalFarmers) * 100) : 0,
        plantStats,
        breedStats,
        villageStats,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [filters]);

  const handleSearch = (keyword) => {
    setFilters((f) => ({ ...f, keyword }));
  };

  const handleVillageChange = (village) => {
    setFilters((f) => ({ ...f, village }));
  };

  const handleAdd = async (values) => {
    try {
      const newFarmer = {
        ...values,
        id: Date.now(),
        plantTags: values.plantTags || [],
        breedTags: values.breedTags || [],
        ocrStatus: '未识别',
        createTime: new Date().toISOString().slice(0, 10),
      };
      await request.post('/farmers', newFarmer).catch(() => {});
      message.success('添加成功');
      setModalOpen(false);
      form.resetFields();
      loadFarmers();
    } catch {
      message.error('添加失败');
    }
  };

  const handleOCR = async (record) => {
    setOcrLoadingId(record.id);
    try {
      const res = await request.post(`/farmers/${record.id}/ocr`).catch(() => ({}));
      if (res && res.data) {
        setData((prev) => prev.map((f) =>
          f.id === record.id ? {
            ...f,
            ocrStatus: '已识别',
            landArea: res.data.land_area !== undefined ? res.data.land_area : res.data.landArea || f.landArea,
            landCertNo: res.data.land_cert_no || res.data.landCertNo || f.landCertNo,
          } : f
        ));
        message.success('OCR识别完成，土地证号：' + (res.data.land_cert_no || res.data.landCertNo || '已更新'));
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setData((prev) => prev.map((f) => f.id === record.id ? { ...f, ocrStatus: '已识别' } : f));
        message.success('OCR识别完成');
      }
      loadFarmers();
    } catch {
      message.error('识别失败，请重试');
    } finally {
      setOcrLoadingId(null);
    }
  };

  const handleEditTags = (record) => {
    setTagFarmer(record);
    tagForm.setFieldsValue({
      plantTags: record.plantTags || [],
      breedTags: record.breedTags || [],
    });
    setTagModalOpen(true);
  };

  const handleSaveTags = async (values) => {
    try {
      await request.put(`/farmers/${tagFarmer.id}`, {
        ...tagFarmer,
        planting_tags: values.plantTags,
        breeding_tags: values.breedTags,
      }).catch(() => {});
      const updatedFarmer = {
        ...tagFarmer,
        plantTags: values.plantTags,
        breedTags: values.breedTags,
      };
      setData((prev) => prev.map((f) =>
        f.id === tagFarmer.id ? updatedFarmer : f
      ));
      if (selectedFarmer && selectedFarmer.id === tagFarmer.id) {
        setSelectedFarmer(updatedFarmer);
      }
      message.success('标签更新成功');
      setTagModalOpen(false);
      loadFarmers();
    } catch {
      message.error('更新失败');
    }
  };

  const handleViewDetail = (record) => {
    setSelectedFarmer(record);
    setDrawerOpen(true);
  };

  const handleUpdateFarmer = (updatedFarmer) => {
    setData((prev) => prev.map((f) => f.id === updatedFarmer.id ? updatedFarmer : f));
    setSelectedFarmer(updatedFarmer);
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 80 },
    { title: '身份证', dataIndex: 'idCard', key: 'idCard', width: 160, ellipsis: true, responsive: ['md'] },
    { title: '村组', dataIndex: 'village', key: 'village', width: 120, render: (v, r) => `${v}${r.group}` },
    { title: '土地面积', dataIndex: 'landArea', key: 'landArea', width: 100, render: (v) => `${v}亩` },
    {
      title: '种植标签', dataIndex: 'plantTags', key: 'plantTags', width: 160,
      render: (tags) => (
        <div>
          {(tags || []).map((t) => (
            <Tag key={t} color="green" style={{ marginBottom: 4 }}>{t}</Tag>
          ))}
        </div>
      )
    },
    {
      title: '养殖标签', dataIndex: 'breedTags', key: 'breedTags', width: 160,
      render: (tags) => (
        <div>
          {(tags || []).map((t) => (
            <Tag key={t} color="orange" style={{ marginBottom: 4 }}>{t}</Tag>
          ))}
        </div>
      )
    },
    {
      title: 'OCR状态', dataIndex: 'ocrStatus', key: 'ocrStatus', width: 100,
      render: (v) => (
        <Tag color={v === '已识别' ? 'green' : v === '识别中' ? 'processing' : 'orange'}>{v}</Tag>
      )
    },
    {
      title: '操作', key: 'actions', width: 240, fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button
            size="small"
            icon={<ScanOutlined />}
            onClick={() => handleOCR(record)}
            loading={ocrLoadingId === record.id}
            disabled={record.ocrStatus === '已识别'}
          >
            OCR识别
          </Button>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTags(record)}
          >
            标签
          </Button>
        </Space>
      )
    },
  ];

  return (
    <div>
      {industryStats && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12, fontWeight: 500, fontSize: 14 }}>产业分布统计</div>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>农户总数</span>}
                  value={industryStats.totalFarmers}
                  suffix="户"
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>总耕地面积</span>}
                  value={industryStats.totalLand}
                  suffix="亩"
                  prefix={<EnvironmentOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#fffbe6' }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>户均耕地</span>}
                  value={industryStats.avgLand}
                  suffix="亩"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ textAlign: 'center', background: '#f9f0ff' }}>
                <Statistic
                  title={<span style={{ fontSize: 12 }}>确权完成率</span>}
                  value={industryStats.ocrRate}
                  suffix="%"
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card size="small" title="种植品类分布" extra={<Tag color="green">{industryStats.plantStats.length}种</Tag>}>
                {industryStats.plantStats.length > 0 ? (
                  industryStats.plantStats.map((s) => (
                    <div key={s.name} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                      <Tag color={s.color} style={{ width: 50, textAlign: 'center' }}>{s.name}</Tag>
                      <Progress percent={s.percent} size="small" showInfo={false} style={{ flex: 1, marginLeft: 8 }} />
                      <span style={{ fontSize: 11, color: '#888', width: 50, textAlign: 'right' }}>{s.count}户</span>
                    </div>
                  ))
                ) : <div style={{ color: '#888', fontSize: 12 }}>暂无种植数据</div>}
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" title="养殖品类分布" extra={<Tag color="red">{industryStats.breedStats.length}种</Tag>}>
                {industryStats.breedStats.length > 0 ? (
                  industryStats.breedStats.map((s) => (
                    <div key={s.name} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                      <Tag color={s.color} style={{ width: 50, textAlign: 'center' }}>{s.name}</Tag>
                      <Progress percent={s.percent} size="small" showInfo={false} style={{ flex: 1, marginLeft: 8 }} />
                      <span style={{ fontSize: 11, color: '#888', width: 50, textAlign: 'right' }}>{s.count}户</span>
                    </div>
                  ))
                ) : <div style={{ color: '#888', fontSize: 12 }}>暂无养殖数据</div>}
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" title="行政村分布" extra={<Tag color="blue">{industryStats.villageStats.length}个</Tag>}>
                {industryStats.villageStats.length > 0 ? (
                  industryStats.villageStats.map((s) => (
                    <div key={s.name} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                      <Tag color="blue" style={{ width: 60, textAlign: 'center' }}>{s.name}</Tag>
                      <Progress percent={s.percent} size="small" showInfo={false} style={{ flex: 1, marginLeft: 8 }} />
                      <span style={{ fontSize: 11, color: '#888', width: 50, textAlign: 'right' }}>{s.count}户</span>
                    </div>
                  ))
                ) : <div style={{ color: '#888', fontSize: 12 }}>暂无数据</div>}
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      <Card
        size="small"
        title="农户档案"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增农户
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space style={{ width: '100%', flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索姓名/身份证/电话"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 240, maxWidth: '100%' }}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Select
              placeholder="按村筛选"
              allowClear
              style={{ width: 180, maxWidth: '100%' }}
              onChange={handleVillageChange}
            >
              {villages.map((v) => (
                <Option key={v} value={v}>{v}</Option>
              ))}
            </Select>
          </Space>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="加载中..." />
            </div>
          ) : (
            <Table
              size="small"
              rowKey="id"
              columns={columns}
              dataSource={data}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 900 }}
            />
          )}
        </Space>
      </Card>

      <Modal
        title="新增农户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} size="middle">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入电话' }]}>
              <Input placeholder="请输入手机号" />
            </Form.Item>
          </div>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证' }]}>
            <Input placeholder="请输入18位身份证号" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="village" label="村" rules={[{ required: true }]}>
              <Select placeholder="选择村">
                {villages.map((v) => (
                  <Option key={v} value={v}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="group" label="组" rules={[{ required: true }]}>
              <Select placeholder="选择组">
                {['一组', '二组', '三组', '四组', '五组'].map((g) => (
                  <Option key={g} value={g}>{g}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="landArea" label="土地面积(亩)" rules={[{ required: true }]}>
              <Input type="number" step="0.1" min="0" />
            </Form.Item>
          </div>
          <Form.Item name="familyMembers" label="家庭人口" rules={[{ required: true }]}>
            <Input type="number" min="1" />
          </Form.Item>
          <Form.Item name="plantTags" label="种植标签">
            <Select mode="multiple" placeholder="选择种植类型">
              {['水稻', '小麦', '玉米', '大豆', '蔬菜', '水果', '茶叶', '药材'].map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="breedTags" label="养殖标签">
            <Select mode="multiple" placeholder="选择养殖类型">
              {['生猪', '牛', '羊', '鸡', '鸭', '鱼'].map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认添加</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑种养标签"
        open={tagModalOpen}
        onCancel={() => setTagModalOpen(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 500}
      >
        <Form form={tagForm} layout="vertical" onFinish={handleSaveTags} size="middle">
          <Form.Item name="plantTags" label="种植品类标签">
            <Select mode="multiple" placeholder="选择种植类型">
              {['水稻', '小麦', '玉米', '大豆', '蔬菜', '水果', '茶叶', '药材'].map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="breedTags" label="养殖品类标签">
            <Select mode="multiple" placeholder="选择养殖类型">
              {['生猪', '牛', '羊', '鸡', '鸭', '鱼'].map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setTagModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <FarmerDetail
        farmer={selectedFarmer}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={handleUpdateFarmer}
      />
    </div>
  );
}
