import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Card, Modal, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { enterpriseAPI } from '../../services/api';

const { Option } = Select;

function EnterpriseList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [industry, setIndustry] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, keyword, industry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await enterpriseAPI.getList({
        page,
        pageSize: 10,
        keyword,
        industry
      });
      setData(res.data.list);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await enterpriseAPI.create(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '统一社会信用代码', dataIndex: 'unified_credit_code', key: 'code' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '规模', dataIndex: 'scale', key: 'scale' },
    { title: '法定代表人', dataIndex: 'legal_person', key: 'legal' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/enterprise/${record.id}`)}>
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Input.Search
            placeholder="搜索企业名称或信用代码"
            style={{ width: 250 }}
            onSearch={setKeyword}
            enterButton
          />
          <Select
            placeholder="选择行业"
            style={{ width: 150 }}
            allowClear
            onChange={setIndustry}
          >
            <Option value="information">信息技术</Option>
            <Option value="manufacturing">制造业</Option>
            <Option value="service">服务业</Option>
            <Option value="retail">零售业</Option>
          </Select>
          <Button type="primary" onClick={() => setModalVisible(true)}>
            添加企业
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            total,
            current: page,
            onChange: setPage
          }}
        />
      </Card>

      <Modal
        title="添加企业"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="企业名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unifiedCreditCode" label="统一社会信用代码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legalPerson" label="法定代表人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="legalPersonIdCard" label="法人身份证号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
            <Select>
              <Option value="information">信息技术</Option>
              <Option value="manufacturing">制造业</Option>
              <Option value="service">服务业</Option>
              <Option value="retail">零售业</Option>
            </Select>
          </Form.Item>
          <Form.Item name="scale" label="规模" rules={[{ required: true }]}>
            <Select>
              <Option value="large">大型</Option>
              <Option value="medium">中型</Option>
              <Option value="small">小型</Option>
              <Option value="micro">微型</Option>
            </Select>
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EnterpriseList;
