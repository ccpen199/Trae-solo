import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Row, Col, Tag, Button, Pagination, Empty, message, Statistic, Space, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, ThunderboltOutlined, EnvironmentOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { serviceAPI } from '../../services/api';

function ServiceList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadData();
  }, [page, keyword, category]);

  const loadCategories = async () => {
    try {
      const res = await serviceAPI.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getList({
        page,
        pageSize: 12,
        keyword,
        category
      });
      setList(res.data.list);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      '企业登记': 'blue',
      '税务服务': 'green',
      '社会保障': 'orange',
      '住房公积金': 'purple',
      '不动产登记': 'cyan',
      '印章管理': 'geekblue'
    };
    return colors[cat] || 'default';
  };

  return (
    <div>
      <Card title="服务事项大厅" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input.Search
            placeholder="搜索服务名称或编码"
            style={{ width: 300 }}
            onSearch={setKeyword}
            enterButton
          />
          <Select
            placeholder="服务分类"
            style={{ width: 150 }}
            allowClear
            value={category}
            onChange={setCategory}
          >
            {categories.map(c => (
              <Select.Option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </Select.Option>
            ))}
          </Select>
        </div>

        {list.length > 0 ? (
          <Row gutter={[16, 16]}>
            {list.map(item => (
              <Col span={8} key={item.id}>
                <Card 
                  className="policy-card"
                  hoverable
                  size="small"
                  onClick={() => navigate(`/services/${item.item_code}`)}
                  extra={
                    <Space>
                      <Tag color={getCategoryColor(item.category)}>{item.category}</Tag>
                      {item.status === 'active' && <Tag color="green" icon={<CheckCircleOutlined />}>通办</Tag>}
                      {item.status === 'pilot' && <Tag color="blue" icon={<ThunderboltOutlined />}>试点</Tag>}
                    </Space>
                  }
                >
                  <Card.Meta
                    title={
                      <span>
                        <Tag color="blue">{item.item_code}</Tag>
                        {item.name}
                      </span>
                    }
                    description={
                      <div>
                        <p style={{ marginBottom: 4, color: '#666' }}>{item.department}</p>
                        <p style={{ marginBottom: 4, color: '#999', fontSize: 12 }}>
                          <ClockCircleOutlined /> 办理时长：{item.handling_time}
                        </p>
                        <p style={{ marginBottom: 8, color: '#999', fontSize: 12 }}>
                          <FileTextOutlined /> 所需材料：{item.required_materials}份
                        </p>
                        <Row gutter={8}>
                          <Col span={12}>
                            <Button type="primary" size="small" block onClick={(e) => { e.stopPropagation(); navigate(`/services/${item.item_code}`); }}>
                              查看详情
                            </Button>
                          </Col>
                          <Col span={12}>
                            <Button size="small" block onClick={(e) => { e.stopPropagation(); navigate(`/reservation?service=${item.id}`); }}>
                              预约办理
                            </Button>
                          </Col>
                        </Row>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无匹配的服务事项" />
        )}

        {total > 0 && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Pagination
              total={total}
              current={page}
              pageSize={12}
              onChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default ServiceList;
