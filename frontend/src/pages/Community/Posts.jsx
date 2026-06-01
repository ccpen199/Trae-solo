import React, { useState, useEffect } from 'react'
import { Card, List, Button, Tag, Input, Modal, Form, message, Spin, Avatar, Select, Empty } from 'antd'
import { LikeOutlined, MessageOutlined, UserOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons'
import { getPosts, createPost, likePost, commentPost } from '../../api/community'
import dayjs from 'dayjs'
import { useAuth } from '../../hooks/useAuth'

const { TextArea } = Input
const { Option } = Select

function Posts() {
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [commentModal, setCommentModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [form] = Form.useForm()
  const { user } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [categoryFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {}
      const result = await getPosts(params)
      setPosts(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取帖子列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await createPost(values)
      message.success('帖子发布成功')
      setCreateModal(false)
      form.resetFields()
      fetchPosts()
    } catch (error) {
      message.error('发布失败')
    }
  }

  const handleLike = async (postId) => {
    try {
      await likePost(postId)
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: (p.likes || 0) + 1, liked: true }
          : p
      ))
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || !selectedPost) return
    
    try {
      await commentPost(selectedPost.id, commentText)
      message.success('评论成功')
      setCommentText('')
      setCommentModal(false)
      fetchPosts()
    } catch (error) {
      message.error('评论失败')
    }
  }

  const showCommentModal = (post) => {
    setSelectedPost(post)
    setCommentModal(true)
  }

  const getCategoryColor = (category) => {
    const colors = {
      'help': 'red',
      'exchange': 'blue',
      'share': 'green',
      'activity': 'orange',
      'other': 'default'
    }
    return colors[category] || 'default'
  }

  const getCategoryText = (category) => {
    const texts = {
      'help': '求助',
      'exchange': '闲置交换',
      'share': '分享',
      'activity': '活动',
      'other': '其他'
    }
    return texts[category] || category
  }

  const mockPosts = [
    {
      id: 1,
      title: '求助！有没有人最近去菜鸟驿站？',
      content: '有没有邻居最近要去小区门口的菜鸟驿站？可以帮忙带一下我的快递吗？买的生鲜快到了，但是我要周末才回家，可微信发红包感谢！',
      author: '张三',
      avatar: null,
      category: 'help',
      likes: 12,
      comments: 5,
      liked: false,
      created_at: dayjs().subtract(2, 'hour').toISOString(),
      comment_list: [
        { id: 1, author: '李四', content: '我下班顺路，可以帮你带', created_at: dayjs().subtract(1, 'hour').toISOString() },
        { id: 2, author: '王五', content: '我也可以，看谁方便', created_at: dayjs().subtract(30, 'minute').toISOString() },
      ]
    },
    {
      id: 2,
      title: '闲置纸箱免费送，需要的自取',
      content: '家里最近快递比较多，攒了一堆纸箱，各种尺寸都有，有需要寄快递的邻居可以来我家免费拿。地点：3号楼2单元501，敲门就行。',
      author: '环保达人',
      avatar: null,
      category: 'exchange',
      likes: 28,
      comments: 15,
      liked: true,
      created_at: dayjs().subtract(1, 'day').toISOString(),
      comment_list: [
        { id: 1, author: '小明', content: '太感谢了！正好要寄东西', created_at: dayjs().subtract(20, 'hour').toISOString() },
      ]
    },
    {
      id: 3,
      title: '分享一个超好用的寄件优惠',
      content: '最近发现了一个寄件的优惠活动，新用户首单立减15元，老用户也有8折。分享给大家，省下来的钱买杯奶茶不香吗？活动链接：xxx.com',
      author: '省钱小能手',
      avatar: null,
      category: 'share',
      likes: 56,
      comments: 23,
      liked: false,
      created_at: dayjs().subtract(2, 'day').toISOString(),
      comment_list: [],
    },
    {
      id: 4,
      title: '本周末社区绿色回收活动',
      content: '各位邻居，本周六上午9点-12点，小区广场将举办绿色回收活动，家里的旧纸箱、废塑料都可以拿来换积分，积分可以兑换生活用品或者快递优惠券。欢迎大家积极参与！',
      author: '社区管理员',
      avatar: null,
      category: 'activity',
      likes: 89,
      comments: 34,
      liked: true,
      created_at: dayjs().subtract(3, 'day').toISOString(),
      comment_list: [
        { id: 1, author: '居民A', content: '太好了，正好有一堆纸箱', created_at: dayjs().subtract(2, 'day').toISOString() },
      ],
    },
  ]

  const displayPosts = posts.length > 0 ? posts : mockPosts

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>邻里互助</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          发布帖子
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type={categoryFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setCategoryFilter('all')}
          >
            全部
          </Button>
          <Button
            type={categoryFilter === 'help' ? 'primary' : 'default'}
            danger={categoryFilter === 'help'}
            onClick={() => setCategoryFilter('help')}
          >
            求助
          </Button>
          <Button
            type={categoryFilter === 'exchange' ? 'primary' : 'default'}
            onClick={() => setCategoryFilter('exchange')}
          >
            闲置交换
          </Button>
          <Button
            type={categoryFilter === 'share' ? 'primary' : 'default'}
            onClick={() => setCategoryFilter('share')}
          >
            分享
          </Button>
          <Button
            type={categoryFilter === 'activity' ? 'primary' : 'default'}
            onClick={() => setCategoryFilter('activity')}
          >
            活动
          </Button>
        </div>
      </Card>

      <Spin spinning={loading}>
        {displayPosts.length > 0 ? (
          <Card>
            {displayPosts.map((post) => (
              <div key={post.id} className="community-post">
                <div className="post-header">
                  <Avatar icon={<UserOutlined />} src={post.avatar} />
                  <div>
                    <span className="post-author">{post.author}</span>
                    <span className="post-time" style={{ marginLeft: 8 }}>
                      {dayjs(post.created_at).fromNow()}
                    </span>
                    <Tag color={getCategoryColor(post.category)} style={{ marginLeft: 8 }}>
                      {getCategoryText(post.category)}
                    </Tag>
                  </div>
                </div>
                <h4 style={{ marginBottom: 8, fontWeight: 500 }}>{post.title}</h4>
                <p style={{ color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                  {post.content}
                </p>
                <div style={{ display: 'flex', gap: 24 }}>
                  <Button
                    type="text"
                    icon={<LikeOutlined />}
                    onClick={() => handleLike(post.id)}
                    style={{ color: post.liked ? '#ff4d4f' : undefined, padding: 0 }}
                  >
                    {post.likes || 0}
                  </Button>
                  <Button
                    type="text"
                    icon={<MessageOutlined />}
                    onClick={() => showCommentModal(post)}
                    style={{ padding: 0 }}
                  >
                    {post.comments || 0}
                  </Button>
                </div>

                {post.comment_list && post.comment_list.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                    {post.comment_list.slice(0, 2).map((comment) => (
                      <div key={comment.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{comment.author}</span>
                            <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                              {dayjs(comment.created_at).fromNow()}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>{comment.content}</div>
                        </div>
                      </div>
                    ))}
                    {post.comment_list.length > 2 && (
                      <Button type="link" size="small" onClick={() => showCommentModal(post)}>
                        查看全部 {post.comment_list.length} 条评论
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>
        ) : (
          <Empty description="暂无帖子，快来发布第一条吧" />
        )}
      </Spin>

      <Modal
        title="发布帖子"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择帖子分类">
              <Option value="help">求助</Option>
              <Option value="exchange">闲置交换</Option>
              <Option value="share">分享</Option>
              <Option value="activity">活动</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入帖子标题" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={5} placeholder="请输入帖子内容" maxLength={500} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<SendOutlined />}>
              发布
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="帖子详情"
        open={commentModal}
        onCancel={() => setCommentModal(false)}
        footer={null}
        width={700}
      >
        {selectedPost && (
          <>
            <div className="post-header" style={{ marginBottom: 16 }}>
              <Avatar icon={<UserOutlined />} src={selectedPost.avatar} />
              <div>
                <span className="post-author">{selectedPost.author}</span>
                <span className="post-time" style={{ marginLeft: 8 }}>
                  {dayjs(selectedPost.created_at).format('YYYY-MM-DD HH:mm')}
                </span>
                <Tag color={getCategoryColor(selectedPost.category)} style={{ marginLeft: 8 }}>
                  {getCategoryText(selectedPost.category)}
                </Tag>
              </div>
            </div>
            <h3 style={{ marginBottom: 12 }}>{selectedPost.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 16 }}>{selectedPost.content}</p>
            
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, padding: '12px 0', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
              <span><LikeOutlined style={{ color: selectedPost.liked ? '#ff4d4f' : undefined, marginRight: 4 }} /> {selectedPost.likes || 0} 赞</span>
              <span><MessageOutlined style={{ marginRight: 4 }} /> {selectedPost.comments || 0} 评论</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12 }}>评论 ({selectedPost.comment_list?.length || 0})</h4>
              {selectedPost.comment_list && selectedPost.comment_list.length > 0 ? (
                selectedPost.comment_list.map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <Avatar icon={<UserOutlined />} src={comment.avatar} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{comment.author}</span>
                        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                          {dayjs(comment.created_at).fromNow()}
                        </span>
                      </div>
                      <div style={{ color: 'rgba(0,0,0,0.65)' }}>{comment.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="暂无评论，快来抢沙发吧" image={null} style={{ padding: '24px 0' }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
              />
              <Button type="primary" onClick={handleComment} style={{ height: 'auto' }}>
                发送
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default Posts
