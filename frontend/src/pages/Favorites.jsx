import React, { useState, useEffect, useCallback } from 'react';
import { 
  Row, Col, Card, Button, Tag, Typography, Spin, Tabs, Checkbox, 
  Space, message, Modal, Input, Select, Popconfirm, Empty, Badge,
  Tooltip
} from 'antd';
import { 
  HeartOutlined, HeartFilled, DeleteOutlined, EditOutlined, 
  ShopOutlined, TeamOutlined, CheckOutlined, CloseOutlined,
  PlusOutlined, MinusCircleOutlined, TagOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { favoriteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [counts, setCounts] = useState({ total: 0, product: 0, company: 0 });
  const [tags, setTags] = useState([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editTagModal, setEditTagModal] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [removedIds, setRemovedIds] = useState(new Set());

  const { user, setShowLoginModal } = useAuth();
  const navigate = useNavigate();

  const loadFavorites = useCallback(async (type = 'all', tag = null) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await favoriteApi.getAll(type, tag);
      setFavorites(response.data.favorites);
      setCounts(response.data.counts);
    } catch (error) {
      if (error.response?.status !== 401) {
        message.error('Failed to load favorites');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTags = useCallback(async () => {
    if (!user) return;

    try {
      const response = await favoriteApi.getTags();
      setTags(response.data.tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      loadFavorites(activeTab, selectedTag);
      loadTags();
    }
  }, [user, activeTab, selectedTag, loadFavorites, loadTags, setShowLoginModal]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedTag(null);
    setSelectedIds([]);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setSelectedIds([]);
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(favorites.filter(f => !removedIds.has(f.id)).map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      message.warning('No items selected');
      return;
    }

    setDeleting(true);
    try {
      await favoriteApi.batchDelete(selectedIds);
      message.success(`Successfully removed ${selectedIds.length} items`);
      setRemovedIds(new Set([...removedIds, ...selectedIds]));
      setSelectedIds([]);
      setTimeout(() => {
        loadFavorites(activeTab, selectedTag);
        loadTags();
        setRemovedIds(new Set());
      }, 1500);
    } catch (error) {
      message.error('Failed to delete favorites');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    setDeleting(true);
    try {
      await favoriteApi.delete(id);
      message.success('Item removed from favorites');
      setRemovedIds(new Set([...removedIds, id]));
      setSelectedIds(selectedIds.filter(i => i !== id));
      setTimeout(() => {
        loadFavorites(activeTab, selectedTag);
        loadTags();
        setRemovedIds(new Set());
      }, 1500);
    } catch (error) {
      message.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditTags = (favorite) => {
    setEditingFavorite(favorite);
    setTagInput(favorite.tags?.join(', ') || '');
    setEditTagModal(true);
  };

  const handleSaveTags = async () => {
    if (!editingFavorite) return;

    const newTags = tagInput
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (newTags.length > 3) {
      message.error('Maximum 3 tags allowed');
      return;
    }

    try {
      await favoriteApi.updateTags(editingFavorite.id, newTags);
      message.success('Tags updated successfully');
      setEditTagModal(false);
      loadFavorites(activeTab, selectedTag);
      loadTags();
    } catch (error) {
      message.error('Failed to update tags');
    }
  };

  const filteredFavorites = selectedTag
    ? favorites.filter(f => f.tags?.includes(selectedTag))
    : favorites;

  const productFavorites = filteredFavorites.filter(f => f.object_type === 'product');
  const companyFavorites = filteredFavorites.filter(f => f.object_type === 'company');

  const displayFavorites = activeTab === 'all' 
    ? filteredFavorites 
    : activeTab === 'product' 
      ? productFavorites 
      : companyFavorites;

  const isAllSelected = displayFavorites.length > 0 && 
    displayFavorites.every(f => selectedIds.includes(f.id) || removedIds.has(f.id));

  const tagLimit = showAllTags ? undefined : 10;
  const displayedTags = tagLimit ? tags.slice(0, tagLimit) : tags;

  const renderProductCard = (favorite) => {
    const data = favorite.object_data || {};
    const isRemoved = removedIds.has(favorite.id);
    const isSelected = selectedIds.includes(favorite.id);

    return (
      <Card 
        key={favorite.id} 
        style={{ 
          marginBottom: 16,
          opacity: isRemoved ? 0.5 : 1,
          transition: 'opacity 0.3s'
        }}
        className={isSelected ? 'selected-card' : ''}
      >
        <Row gutter={16} align="middle">
          <Col xs={1} style={{ textAlign: 'center' }}>
            <Checkbox 
              checked={isSelected}
              onChange={(e) => toggleSelectItem(favorite.id, e.target.checked)}
              disabled={isRemoved}
            />
          </Col>

          <Col xs={5}>
            <img
              alt={data.title}
              src={data.image_url}
              style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
            />
          </Col>

          <Col xs={12}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {data.title || 'Product'}
              </Title>
              {isRemoved && (
                <Tag color="red" style={{ marginTop: 4 }}>
                  Removed
                </Tag>
              )}
            </div>
            
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                ${data.fob_price_min || '--'} - ${data.fob_price_max || '--'}
              </Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                / {data.moq_unit || 'unit'}
              </Text>
            </div>

            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                MOQ: {data.min_order_quantity || '--'} {data.moq_unit || 'units'}
              </Text>
            </div>

            <div style={{ marginTop: 8 }}>
              <Link to={`/products/${data.id || favorite.object_id}`}>
                {data.company_name || 'Supplier'}
              </Link>
              <Tag 
                color={data.online_status === 'online' ? 'green' : 'default'}
                style={{ marginLeft: 8 }}
              >
                {data.online_status === 'online' ? 'Contact Now' : 'Leave Message'}
              </Tag>
            </div>

            {favorite.tags && favorite.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {favorite.tags.map((tag, i) => (
                  <Tag 
                    key={i} 
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{data.country || 'N/A'}</Tag>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                Added: {new Date(favorite.created_at).toLocaleDateString()}
              </Text>
            </div>
          </Col>

          <Col xs={6} style={{ textAlign: 'right' }}>
            <Space direction="vertical" size="small">
              <Tooltip title="Edit Tags">
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => handleEditTags(favorite)}
                  disabled={isRemoved}
                >
                  Tags
                </Button>
              </Tooltip>
              
              <Popconfirm
                title="Remove from favorites?"
                description="This item will be removed from your favorites."
                onConfirm={() => handleDeleteItem(favorite.id)}
                okText="Remove"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  disabled={isRemoved || deleting}
                >
                  Remove
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderCompanyCard = (favorite) => {
    const data = favorite.object_data || {};
    const isRemoved = removedIds.has(favorite.id);
    const isSelected = selectedIds.includes(favorite.id);

    return (
      <Card 
        key={favorite.id} 
        style={{ 
          marginBottom: 16,
          opacity: isRemoved ? 0.5 : 1,
          transition: 'opacity 0.3s'
        }}
      >
        <Row gutter={16} align="middle">
          <Col xs={1} style={{ textAlign: 'center' }}>
            <Checkbox 
              checked={isSelected}
              onChange={(e) => toggleSelectItem(favorite.id, e.target.checked)}
              disabled={isRemoved}
            />
          </Col>

          <Col xs={3} style={{ textAlign: 'center' }}>
            <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </Col>

          <Col xs={14}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                <Link to={`/companies/${data.id || favorite.object_id}`}>
                  {data.name || 'Company'}
                </Link>
                <Tag 
                  color={data.online_status === 'online' ? 'green' : 'default'}
                  style={{ marginLeft: 8 }}
                >
                  {data.online_status === 'online' ? 'Online' : 'Offline'}
                </Tag>
                {isRemoved && (
                  <Tag color="red" style={{ marginLeft: 4 }}>
                    Removed
                  </Tag>
                )}
              </Title>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <Text strong>Products & Services:</Text>
              <br />
              <Text type="secondary">
                {data.product_service || 'N/A'}
              </Text>
            </div>

            <div style={{ marginTop: 8 }}>
              <Tag color="blue">{data.country || 'N/A'}</Tag>
              {data.business_type && (
                <Tag style={{ marginLeft: 4 }}>{data.business_type}</Tag>
              )}
            </div>

            {favorite.tags && favorite.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {favorite.tags.map((tag, i) => (
                  <Tag 
                    key={i} 
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Added: {new Date(favorite.created_at).toLocaleDateString()}
              </Text>
            </div>
          </Col>

          <Col xs={6} style={{ textAlign: 'right' }}>
            <Space direction="vertical" size="small">
              <Tooltip title="Edit Tags">
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => handleEditTags(favorite)}
                  disabled={isRemoved}
                >
                  Tags
                </Button>
              </Tooltip>
              
              <Popconfirm
                title="Remove from favorites?"
                description="This company will be removed from your favorites."
                onConfirm={() => handleDeleteItem(favorite.id)}
                okText="Remove"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  disabled={isRemoved || deleting}
                >
                  Remove
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All <Badge count={counts.total} style={{ marginLeft: 4 }} />
        </span>
      ),
    },
    {
      key: 'product',
      label: (
        <span>
          <ShopOutlined style={{ marginRight: 4 }} />
          Products <Badge count={counts.product} style={{ marginLeft: 4 }} />
        </span>
      ),
    },
    {
      key: 'company',
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 4 }} />
          Companies <Badge count={counts.company} style={{ marginLeft: 4 }} />
        </span>
      ),
    },
  ];

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Title level={3}>Please login to view your favorites</Title>
        <Button type="primary" size="large" onClick={() => setShowLoginModal(true)}>
          Login
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={24}>
        <Col xs={24} lg={18}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={2}>
                <HeartFilled style={{ color: '#ff4d4f', marginRight: 8 }} />
                My Favorites
              </Title>
            </Col>
            <Col>
              {displayFavorites.length > 0 && (
                <Space>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < displayFavorites.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  >
                    Select All
                  </Checkbox>
                  <Popconfirm
                    title={`Remove ${selectedIds.length} selected items?`}
                    description="These items will be removed from your favorites."
                    onConfirm={handleDeleteSelected}
                    okText="Remove All"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, disabled: selectedIds.length === 0 }}
                  >
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      disabled={selectedIds.length === 0 || deleting}
                    >
                      Delete Selected ({selectedIds.length})
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </Col>
          </Row>

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            style={{ marginBottom: 16 }}
          />

          {selectedTag && (
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue" closable onClose={() => setSelectedTag(null)}>
                Filter: {selectedTag}
              </Tag>
            </div>
          )}

          {displayFavorites.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No favorites yet.
                  <Link to="/products" style={{ marginLeft: 8 }}>Browse products</Link>
                </span>
              }
            />
          ) : (
            displayFavorites.map(favorite => (
              favorite.object_type === 'product'
                ? renderProductCard(favorite)
                : renderCompanyCard(favorite)
            ))
          )}
        </Col>

        <Col xs={24} lg={6}>
          <Card 
            title={
              <span>
                <TagOutlined style={{ marginRight: 4 }} />
                Tags
              </span>
            }
            style={{ position: 'sticky', top: 80 }}
          >
            {tags.length === 0 ? (
              <Empty 
                description="No tags yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '20px 0' }}
              />
            ) : (
              <>
                <div style={{ flexWrap: 'wrap', display: 'flex', gap: 8 }}>
                  <Tag 
                    color={selectedTag === null ? 'blue' : 'default'}
                    style={{ cursor: 'pointer', fontSize: 13 }}
                    onClick={() => handleTagClick(null)}
                  >
                    All
                  </Tag>
                  {displayedTags.map((tagItem, i) => (
                    <Tag 
                      key={i}
                      color={selectedTag === tagItem.tag ? 'blue' : 'default'}
                      style={{ cursor: 'pointer', fontSize: 13 }}
                      onClick={() => handleTagClick(tagItem.tag)}
                    >
                      {tagItem.tag} ({tagItem.count})
                    </Tag>
                  ))}
                </div>
                {tags.length > 10 && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Button type="link" onClick={() => setShowAllTags(!showAllTags)}>
                      {showAllTags ? 'Show Top 10 Tags' : `Show All Tags (${tags.length})`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Edit Tags"
        open={editTagModal}
        onOk={handleSaveTags}
        onCancel={() => setEditTagModal(false)}
        okText="Save"
      >
        {editingFavorite && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>
                {editingFavorite.object_data?.title || editingFavorite.object_data?.name || 'Item'}
              </Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Tags (up to 3, separate with comma)
              </Text>
              <Input
                placeholder="e.g., electronics, cheap, sample"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              {tagInput.split(/[,，]/).filter(t => t.trim()).length > 3 && (
                <Text type="danger" style={{ fontSize: 12 }}>
                  Maximum 3 tags allowed
                </Text>
              )}
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tip: You can use commas (,) to separate multiple tags.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .selected-card {
          border-color: #1890ff !important;
          background: #f0f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default Favorites;
