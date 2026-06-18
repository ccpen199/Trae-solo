import { NavBar, Card, Avatar, Space, Button, Input, TextArea } from 'antd-mobile'
import { LikeOutline, MessageOutline, SendOutline } from 'antd-mobile-icons'
import { useState } from 'react'
import './index.css'

function Community() {
  const [comment, setComment] = useState('')

  const posts = [
    {
      id: 1,
      author: '特斯拉车主小王',
      avatar: '特',
      time: '2小时前',
      content: '今天发现了一个超棒的充电站，电价便宜还免停车费，位置在朝阳公园附近，推荐给大家！',
      likes: 42,
      comments: 15,
      images: []
    },
    {
      id: 2,
      author: '比亚迪老司机',
      avatar: '比',
      time: '5小时前',
      content: '分享一下我的V2G使用心得，设置峰谷套利模式，一个月能省不少电费。有问题的朋友可以留言交流～',
      likes: 128,
      comments: 36,
      images: []
    },
    {
      id: 3,
      author: '蔚来未来',
      avatar: '蔚',
      time: '昨天',
      content: '周末开电车去了趟天津，来回300多公里，中途充了一次电，体验还不错。大家有什么长途充电的技巧吗？',
      likes: 256,
      comments: 58,
      images: []
    }
  ]

  return (
    <div className="community-page">
      <NavBar>车友社区</NavBar>

      <div className="post-input-card">
        <div className="post-input-header">
          <span>分享你的充电故事</span>
        </div>
        <TextArea
          placeholder="说点什么吧..."
          value={comment}
          onChange={setComment}
          rows={3}
        />
        <div className="post-actions">
          <Button size="mini" color="default">图片</Button>
          <Button size="mini" color="primary">
            <SendOutline /> 发布
          </Button>
        </div>
      </div>

      <Space direction="vertical" block className="posts-list">
        {posts.map((post) => (
          <Card key={post.id} className="post-card">
            <div className="post-header">
              <Avatar className="post-avatar">{post.avatar}</Avatar>
              <div className="post-author-info">
                <span className="post-author">{post.author}</span>
                <span className="post-time">{post.time}</span>
              </div>
            </div>
            <div className="post-content">{post.content}</div>
            <div className="post-footer">
              <div className="post-action">
                <LikeOutline />
                <span>{post.likes}</span>
              </div>
              <div className="post-action">
                <MessageOutline />
                <span>{post.comments}</span>
              </div>
            </div>
          </Card>
        ))}
      </Space>

      <div className="load-more">
        <Button block color="default" size="small">加载更多</Button>
      </div>
    </div>
  )
}

export default Community
