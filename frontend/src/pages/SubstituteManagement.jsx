import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, message, Tag, Switch, DatePicker } from 'antd';
import { getSubstitutes, createSubstitute, approveSubstitute, getMaterials } from '../api';

const { Option } = Select;
const { TextArea } = Input;

function SubstituteManagement() {
  const [data, setData] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, matRes] = await Promise.all([
        getSubstitutes(), getMaterials()
      ]);
      setData(subRes.data);
      setMaterials(matRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      await createSubstitute({
        ...values,
        approval_required: values.approval_required ? 1 : 0,
        valid_from: values.valid_from?.format('YYYY-MM-DD'),
        valid_to: values.valid_to?.format('YYYY-MM-DD')
      });
      message.success('替代料规则创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveSubstitute(id, { approved_by: 'admin' });
      message.success('审批通过');
      fetchData();
    } catch (error) {
      message.error('审批失败');
    }
  };

  const columns = [
    { title: '原物料编码', dataIndex: 'original_code', key: 'original_code', width: 120 },
    { title: '原物料名称', dataIndex: 'original_name', key: 'original_name' },
    { title: '替代料编码', dataIndex: 'substitute_code', key: 'substitute_code', width: 120 },
    { title: '替代料名称', dataIndex: 'substitute_name', key: 'substitute_name' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '需审批', dataIndex: 'approval_required', key: 'approval', width: 80,
      render: (v) => v ? <Tag color="orange">是</Tag> : <Tag>否</Tag>
    },
    { title: '审批状态', dataIndex: 'approved', key: 'approved', width: 100,
      render: (v, record) => {
        if (!record.approval_required) return <Tag color="green">免审批</Tag>;
        return v ? <Tag color="green">已审批</Tag> : <Tag color="red">待审批</Tag>;
      }
    },
    { title: '有效期', key: 'valid', width: 200,
      render: (_, record) => {
        if (!record.valid_from && !record.valid_to) return '永久有效';
        return `${record.valid_from || '-'} 至 ${record.valid_to || '-'}`;
      }
    },
    { title: '审批人', dataIndex: 'approved_by', key: 'approved_by', width: 100 },
    { title: '操作', key: 'action', width: 100,
      render: (_, record) => {
        if (record.approval_required && !record.approved) {
          return <Button type="link" onClick={() => handleApprove(record.id)}>审批</Button>;
        }
        return null;
      }
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>替代料规则</h2>
        <Button type="primary" onClick={() => setModalVisible(true)}>新建规则</Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建替代料规则"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="original_material_id" label="原物料" rules={[{ required: true }]}>
            <Select placeholder="请选择原物料">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="substitute_material_id" label="替代物料" rules={[{ required: true }]}>
            <Select placeholder="请选择替代物料">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={1}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="approval_required" label="需要审批" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="valid_from" label="生效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="valid_to" label="失效日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SubstituteManagement;
