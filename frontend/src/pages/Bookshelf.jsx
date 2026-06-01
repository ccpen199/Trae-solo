import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Space, message } from 'antd';
import { BookOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request.js';

function Bookshelf() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBookshelf();
  }, []);

  const fetchBookshelf = async () => {
    const res = await request.get('/reader/bookshelf');
    setBooks(res);
  };

  const handleRemove = async (novel_id) => {
    try {
      await request.post('/reader/bookshelf', { novel_id });
      message.success('已移除');
      fetchBookshelf();
    } catch (e) {
      message.error('操作失败');
    }
  };

  if (books.length === 0) {
    return (
      <div className="container">
        <Card>
          <Empty description="书架是空的，去发现精彩小说吧" />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/')}>去书城</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container">
      <Card title="我的书架">
        <List
          dataSource={books}
          renderItem={item => (
            <List.Item
              actions={[
                <Button type="link" icon={<ReadOutlined />} onClick={() => navigate(`/novel/${item.novel_id}`)}>继续阅读</Button>,
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleRemove(item.novel_id)}>移除</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<div className="novel-cover" style={{ width: 60, height: 80 }}><BookOutlined /></div>}
                title={<a onClick={() => navigate(`/novel/${item.novel_id}`)}>{item.title}</a>}
                description={
                  <Space>
                    <span>作者: {item.author_name}</span>
                    {item.last_chapter_title && <Tag>{item.last_chapter_title}</Tag>}
                    {item.last_read_time && <span style={{ color: '#999' }}>上次阅读: {item.last_read_time}</span>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default Bookshelf;
