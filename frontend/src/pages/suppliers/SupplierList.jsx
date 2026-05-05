import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag, Input as AntInput } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ExportOutlined, SearchOutlined } from '@ant-design/icons'
import { supplierApi } from '../../services/api'

const { Search } = AntInput

const SupplierList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true)
    try {
      const result = await supplierApi.getSuppliers({ 
        page, 
        page_size: pageSize,
        keyword: keyword || undefined
      })
      if (result.success) {
        setData(result.data.list)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.page_size,
          total: result.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Fetch suppliers failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchKeyword)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      supplier_name: record.supplier_name,
      contact_person: record.contact_person,
      phone: record.phone,
      address: record.address,
      email: record.email,
      remark: record.remark
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await supplierApi.deleteSupplier(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Delete supplier failed:', error)
    }
  }

  const handleExport = () => {
    supplierApi.exportSuppliers({ keyword: searchKeyword })
    message.success('导出任务已开始')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)

      if (editingItem) {
        await supplierApi.updateSupplier(editingItem.id, values)
        message.success('更新成功')
      } else {
        await supplierApi.createSupplier(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '供应商名称',
      dataIndex: 'supplier_name',
      key: 'supplier_name'
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该供应商吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">供应商管理</div>
        <div className="page-description">管理商品供应商信息</div>
      </div>

      <div className="table-toolbar">
        <div className="search-form">
          <Search
            placeholder="搜索供应商名称"
            allowClear
            enterButton={<span><SearchOutlined /> 搜索</span>}
            style={{ width: 300 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
          />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增供应商
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword)
        }}
      />

      <Modal
        title={editingItem ? '编辑供应商' : '新增供应商'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="modal-form"
        >
          <Form.Item
            label="供应商名称"
            name="supplier_name"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contact_person"
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item
            label="联系电话"
            name="phone"
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            label="地址"
            name="address"
          >
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierList