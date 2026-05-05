import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Space, Image, Empty, Select, Pagination, Modal, message,
  Popconfirm
} from 'antd';
import {
  EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined
} from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { productApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { confirm } = Modal;

const MyProducts = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [pagination.current, pagination.pageSize, status, isAuthenticated]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      if (status) params.status = status;

      const data = await productApi.getMyProducts(params);
      setProducts(data.products || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      'active': { color: 'green', text: '上架中' },
      'inactive': { color: 'orange', text: '已下架' },
      'deleted': { color: 'red', text: '已删除' },
      'sold': { color: 'blue', text: '已售出' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20product%20image&image_size=square';
  };

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await productApi.delete(id);
          message.success('商品已删除');
          fetchProducts();
        } catch (error) {
          console.error('删除商品失败:', error);
        }
      }
    });
  };

  const columns = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images, record) => (
        <Image
          width={80}
          height={80}
          src={getProductImage(record)}
          style={{ objectFit: 'cover' }}
          preview={false}
        />
      )
    },
    {
      title: '商品信息',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{title}</div>
          <div style={{ color: '#666', fontSize: 12 }}>
            分类: {record.category_name || '-'}
          </div>
        </div>
      )
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <div>
          <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>¥{price}</div>
          {record.original_price && (
            <div style={{ color: '#999', textDecoration: 'line-through', fontSize: 12 }}>
              原价 ¥{record.original_price}
            </div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '浏览/收藏',
      key: 'stats',
      render: (_, record) => (
        <div>
          <div><EyeOutlined style={{ marginRight: 4 }} />{record.view_count || 0}</div>
          <div><span style={{ color: '#ff4d4f' }}>❤</span> {record.favorite_count || 0}</div>
        </div>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/products/${record.id}`)}
          >
            查看
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/publish/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个商品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <AppLayout showSidebar>
      <Card
        title="我的商品"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={status || undefined}
              onChange={(value) => {
                setStatus(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              <Option value="active">上架中</Option>
              <Option value="inactive">已下架</Option>
              <Option value="sold">已售出</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/publish')}
            >
              发布商品
            </Button>
          </Space>
        }
      >
        {products.length === 0 && !loading ? (
          <Empty
            description="暂无商品"
            style={{ margin: '40px 0' }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/publish')}
            >
              去发布商品
            </Button>
          </Empty>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
            
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }));
                }}
                showSizeChanger
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </>
        )}
      </Card>
    </AppLayout>
  );
};

export default MyProducts;
