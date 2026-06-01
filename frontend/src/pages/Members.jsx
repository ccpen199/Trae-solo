import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Tabs, message, Row, Col, Tag } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select

export default function Members() {
  const [companies, setCompanies] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [companyModal, setCompanyModal] = useState(false)
  const [memberModal, setMemberModal] = useState(false)
  const [companyForm] = Form.useForm()
  const [memberForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [companiesData, membersData] = await Promise.all([
        api.companies(),
        api.members()
      ])
      setCompanies(companiesData)
      setMembers(membersData)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySubmit = async (values) => {
    try {
      await api.createCompany(values)
      message.success('企业添加成功')
      setCompanyModal(false)
      companyForm.resetFields()
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleMemberSubmit = async (values) => {
    try {
      await api.createMember(values)
      message.success('会员添加成功')
      setMemberModal(false)
      memberForm.resetFields()
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const companyColumns = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '邮箱', dataIndex: 'contact_email', key: 'contact_email' }
  ]

  const memberColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '所属企业', dataIndex: 'company_name', key: 'company_name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => (
      <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '停用'}</Tag>
    )}
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>会员企业</h2>

      <Tabs
        items={[
          {
            key: 'companies',
            label: '企业列表',
            children: (
              <>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCompanyModal(true)}>添加企业</Button>
                </Row>
                <Table
                  dataSource={companies}
                  columns={companyColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            )
          },
          {
            key: 'members',
            label: '会员列表',
            children: (
              <>
                <Row justify="end" style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setMemberModal(true)}>添加会员</Button>
                </Row>
                <Table
                  dataSource={members}
                  columns={memberColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            )
          }
        ]}
      />

      <Modal title="添加企业" open={companyModal} onCancel={() => setCompanyModal(false)} footer={null}>
        <Form form={companyForm} layout="vertical" onFinish={handleCompanySubmit}>
          <Form.Item name="name" label="企业名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_person" label="联系人" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_phone" label="联系电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contact_email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setCompanyModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加会员" open={memberModal} onCancel={() => setMemberModal(false)} footer={null}>
        <Form form={memberForm} layout="vertical" onFinish={handleMemberSubmit}>
          <Form.Item name="company_id" label="所属企业" rules={[{ required: true }]}>
            <Select>
              {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setMemberModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
