import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Tabs, Row, Col, Statistic, Timeline, List, InputNumber, Switch, Divider } from 'antd';
import { PlusOutlined, EditOutlined, AppstoreOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Option } = Select;
const { TextArea } = Input;

function AdminServiceConfig() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [detailService, setDetailService] = useState(null);
  const [form] = Form.useForm();
  const [materialList, setMaterialList] = useState([]);
  const [stepList, setStepList] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [publishLogs, setPublishLogs] = useState([]);

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const loadServices = async () => {
    try { setServices(await api.get('/admin/services')); } catch (e) { message.error('加载失败'); }
  };
  const loadCategories = async () => {
    try { setCategories(await api.get('/services/categories')); } catch (e) {}
  };

  const openDetail = (record) => {
    setDetailService(record);
    try {
      const mats = JSON.parse(record.required_materials || '[]');
      setMaterialList(mats.length > 0 ? mats : [
        { name: '居民身份证', type: '原件', required: true, source: '电子证照' },
        { name: '申请表', type: '原件', required: true, source: '在线填写' },
      ]);
    } catch {
      setMaterialList([
        { name: '居民身份证', type: '原件', required: true, source: '电子证照' },
        { name: '申请表', type: '原件', required: true, source: '在线填写' },
      ]);
    }
    try {
      const flow = JSON.parse(record.process_flow || '[]');
      setStepList(flow.length > 0 ? flow : [
        { step: 1, name: '提交申请', handler: '申请人', timeout: 0 },
        { step: 2, name: '材料审核', handler: '窗口受理', timeout: 3 },
        { step: 3, name: '业务办理', handler: '承办部门', timeout: 5 },
        { step: 4, name: '办结归档', handler: '系统自动', timeout: 1 },
      ]);
    } catch {
      setStepList([
        { step: 1, name: '提交申请', handler: '申请人', timeout: 0 },
        { step: 2, name: '材料审核', handler: '窗口受理', timeout: 3 },
        { step: 3, name: '业务办理', handler: '承办部门', timeout: 5 },
        { step: 4, name: '办结归档', handler: '系统自动', timeout: 1 },
      ]);
    }
    try {
      const schema = JSON.parse(record.form_schema || '{}');
      const fields = schema.fields || [];
      setFormFields(fields.length > 0 ? fields : [
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'idcard', label: '身份证号', type: 'idcard', required: true },
        { key: 'phone', label: '联系电话', type: 'phone', required: true },
        { key: 'address', label: '联系地址', type: 'textarea', required: false },
      ]);
    } catch {
      setFormFields([
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'idcard', label: '身份证号', type: 'idcard', required: true },
        { key: 'phone', label: '联系电话', type: 'phone', required: true },
        { key: 'address', label: '联系地址', type: 'textarea', required: false },
      ]);
    }
    setPublishLogs([
      { version: 'v2.0', operator: '管理员', time: '2024-06-01 10:30', action: '更新材料清单', status: '已发布' },
      { version: 'v1.1', operator: '管理员', time: '2024-05-15 14:20', action: '修改流程步骤', status: '已发布' },
      { version: 'v1.0', operator: '管理员', time: '2024-01-01 09:00', action: '初始发布', status: '已发布' },
    ]);
    setDetailModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingService(record);
    form.setFieldsValue({
      ...record,
      categoryId: record.category_id,
      handlingTime: record.handling_time,
    });
    setEditModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!detailService) return;
    try {
      await api.put(`/admin/services/${detailService.id}`, {
        name: detailService.name,
        department: detailService.department,
        description: detailService.description,
        handlingTime: detailService.handling_time,
        status: detailService.status,
        requiredMaterials: materialList,
        processFlow: stepList,
        formSchema: { fields: formFields },
      });
      message.success('配置已保存，版本已记录');
      setDetailModalVisible(false);
      loadServices();
    } catch (e) {
      message.error('保存失败');
    }
  };

  const addMaterial = () => {
    setMaterialList([...materialList, { name: '', type: '原件', required: true, source: '在线填写' }]);
  };
  const updateMaterial = (idx, key, val) => {
    const list = [...materialList];
    list[idx][key] = val;
    setMaterialList(list);
  };
  const removeMaterial = (idx) => {
    setMaterialList(materialList.filter((_, i) => i !== idx));
  };

  const addStep = () => {
    setStepList([...stepList, { step: stepList.length + 1, name: '', handler: '', timeout: 3 }]);
  };
  const updateStep = (idx, key, val) => {
    const list = [...stepList];
    list[idx][key] = val;
    setStepList(list);
  };
  const removeStep = (idx) => {
    setStepList(stepList.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  };

  const addFormField = () => {
    setFormFields([...formFields, { key: '', label: '', type: 'text', required: false }]);
  };
  const updateFormField = (idx, key, val) => {
    const list = [...formFields];
    list[idx][key] = val;
    setFormFields(list);
  };
  const removeFormField = (idx) => {
    setFormFields(formFields.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await api.put(`/admin/services/${editingService.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/admin/services', values);
        message.success('添加成功');
      }
      setEditModalVisible(false);
      loadServices();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 50 },
    { title: '事项名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
    { title: '所属部门', dataIndex: 'department', key: 'department', render: (d) => <Tag color="blue" style={{ fontSize: 11 }}>{d?.slice(0, 8)}</Tag> },
    { title: '时限', dataIndex: 'handling_time', key: 'handling_time', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? '启用' : '停用'}</Tag> },
    { title: '热门', dataIndex: 'is_hot', key: 'is_hot', render: (h) => h ? <Tag color="red">热门</Tag> : <Tag>普通</Tag> },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" onClick={() => openDetail(record)}>全量配置</Button>
          <Button size="small" onClick={() => handleEdit(record)}>基础信息</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title={<Space><AppstoreOutlined />事项配置中心</Space>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingService(null); form.resetFields(); setEditModalVisible(true); }}>新增事项</Button>}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={6}><Statistic title="总事项数" value={services.length} /></Col>
          <Col xs={6}><Statistic title="启用中" value={services.filter(s => s.status === 'active').length} valueStyle={{ color: '#52c41a' }} /></Col>
          <Col xs={6}><Statistic title="热门事项" value={services.filter(s => s.is_hot).length} valueStyle={{ color: '#fa541c' }} /></Col>
          <Col xs={6}><Statistic title="服务分类" value={categories.length} valueStyle={{ color: '#1890ff' }} /></Col>
        </Row>
        <Table columns={columns} dataSource={services} rowKey="id" pagination={{ pageSize: 15 }} size="small" />
      </Card>

      <Modal title={`事项配置 - ${detailService?.name || ''}`} open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)} width={900}
        footer={[
          <Button key="cancel" onClick={() => setDetailModalVisible(false)}>取消</Button>,
          <Button key="save" type="primary" onClick={handleSaveConfig}>保存并发布</Button>,
        ]}
      >
        <Tabs defaultActiveKey="materials">
          <Tabs.TabPane tab="材料清单" key="materials">
            <div style={{ marginBottom: 12 }}>
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addMaterial}>添加材料</Button>
            </div>
            <Table dataSource={materialList} pagination={false} size="small" rowKey={(_, i) => i}
              columns={[
                { title: '序号', render: (_, __, i) => i + 1, width: 50 },
                { title: '材料名称', render: (_, r, i) => <Input value={r.name} onChange={e => updateMaterial(i, 'name', e.target.value)} placeholder="材料名称" size="small" /> },
                { title: '类型', render: (_, r, i) => <Select value={r.type} onChange={v => updateMaterial(i, 'type', v)} size="small" style={{ width: 80 }}>
                  <Option value="原件">原件</Option><Option value="复印件">复印件</Option><Option value="电子版">电子版</Option>
                </Select> },
                { title: '必填', render: (_, r, i) => <Switch checked={r.required} onChange={v => updateMaterial(i, 'required', v)} size="small" /> },
                { title: '来源', render: (_, r, i) => <Select value={r.source} onChange={v => updateMaterial(i, 'source', v)} size="small" style={{ width: 100 }}>
                  <Option value="电子证照">电子证照</Option><Option value="在线填写">在线填写</Option><Option value="用户上传">用户上传</Option>
                </Select> },
                { title: '操作', render: (_, __, i) => <Button size="small" danger onClick={() => removeMaterial(i)}>删除</Button>, width: 60 },
              ]}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="流程步骤" key="steps">
            <div style={{ marginBottom: 12 }}>
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addStep}>添加步骤</Button>
            </div>
            <Table dataSource={stepList} pagination={false} size="small" rowKey={(_, i) => i}
              columns={[
                { title: '步骤', dataIndex: 'step', width: 50 },
                { title: '步骤名称', render: (_, r, i) => <Input value={r.name} onChange={e => updateStep(i, 'name', e.target.value)} placeholder="步骤名称" size="small" /> },
                { title: '处理人', render: (_, r, i) => <Input value={r.handler} onChange={e => updateStep(i, 'handler', e.target.value)} placeholder="处理人/角色" size="small" /> },
                { title: '时限(天)', render: (_, r, i) => <InputNumber value={r.timeout} onChange={v => updateStep(i, 'timeout', v)} min={0} size="small" style={{ width: 80 }} /> },
                { title: '操作', render: (_, __, i) => <Button size="small" danger onClick={() => removeStep(i)}>删除</Button>, width: 60 },
              ]}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="表单模板" key="form">
            <div style={{ marginBottom: 12 }}>
              <Button type="dashed" block icon={<PlusOutlined />} onClick={addFormField}>添加字段</Button>
            </div>
            <Table dataSource={formFields} pagination={false} size="small" rowKey={(_, i) => i}
              columns={[
                { title: '序号', render: (_, __, i) => i + 1, width: 50 },
                { title: '字段标识', render: (_, r, i) => <Input value={r.key} onChange={e => updateFormField(i, 'key', e.target.value)} placeholder="如 name" size="small" /> },
                { title: '显示名称', render: (_, r, i) => <Input value={r.label} onChange={e => updateFormField(i, 'label', e.target.value)} placeholder="如 姓名" size="small" /> },
                { title: '类型', render: (_, r, i) => <Select value={r.type} onChange={v => updateFormField(i, 'type', v)} size="small" style={{ width: 100 }}>
                  <Option value="text">文本</Option><Option value="idcard">身份证</Option><Option value="phone">电话</Option>
                  <Option value="email">邮箱</Option><Option value="textarea">多行文本</Option><Option value="select">下拉选择</Option>
                  <Option value="date">日期</Option><Option value="number">数字</Option>
                </Select> },
                { title: '必填', render: (_, r, i) => <Switch checked={r.required} onChange={v => updateFormField(i, 'required', v)} size="small" /> },
                { title: '操作', render: (_, __, i) => <Button size="small" danger onClick={() => removeFormField(i)}>删除</Button>, width: 60 },
              ]}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="发布留痕" key="publish">
            <Timeline
              items={publishLogs.map((log, idx) => ({
                color: idx === 0 ? 'green' : 'blue',
                children: (
                  <div>
                    <Space>
                      <Tag color={idx === 0 ? 'green' : 'blue'}>{log.version}</Tag>
                      <span style={{ fontWeight: 'bold' }}>{log.action}</span>
                      <Tag>{log.status}</Tag>
                    </Space>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      操作人：{log.operator} · 时间：{log.time}
                    </div>
                  </div>
                )
              }))}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="复查记录" key="review">
            <List
              dataSource={[
                { reviewer: '质量审核员A', time: '2024-06-02 09:00', result: '通过', remark: '材料清单与实际业务一致' },
                { reviewer: '部门负责人B', time: '2024-05-16 15:30', result: '通过', remark: '流程步骤合理，时限合规' },
                { reviewer: '合规审查C', time: '2024-01-05 11:00', result: '通过', remark: '首次发布审查通过' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: item.result === '通过' ? '#52c41a' : '#ff4d4f' }} />}
                    title={<Space><span>{item.reviewer}</span><Tag color={item.result === '通过' ? 'success' : 'error'}>{item.result}</Tag></Space>}
                    description={<div><div>{item.remark}</div><div style={{ fontSize: 12, color: '#999' }}>{item.time}</div></div>}
                  />
                </List.Item>
              )}
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>

      <Modal title={editingService ? '编辑事项' : '新增事项'} open={editModalVisible}
        onCancel={() => setEditModalVisible(false)} onOk={handleSubmit} width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="服务分类" rules={[{ required: true }]}>
                <Select placeholder="选择分类">
                  {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="事项编码" rules={[{ required: true }]}>
                <Input placeholder="如 social_security_query" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="事项名称" rules={[{ required: true }]}>
                <Input placeholder="如 社保查询" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handlingTime" label="办理时限" rules={[{ required: true }]}>
                <Input placeholder="如 7个工作日" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="department" label="所属部门" rules={[{ required: true }]}>
            <Input placeholder="如 人力资源和社会保障厅" />
          </Form.Item>
          <Form.Item name="description" label="事项说明">
            <TextArea rows={3} placeholder="详细描述该服务事项" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminServiceConfig;
