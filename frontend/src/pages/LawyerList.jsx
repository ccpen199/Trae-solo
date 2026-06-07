import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Input, Select, Typography, Tag, Space, Pagination, message } from 'antd';
import { Link } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';
import { lawyerAPI } from '../utils/api';

const { Title } = Typography;
const { Option } = Select;

function LawyerList() {
  const [lawyers, setLawyers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [practiceArea, setPracticeArea] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadLawyers();
  }, [page, practiceArea]);

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const res = await lawyerAPI.getLawyers({ page, limit: 9, practice_area: practiceArea });
      if (res.data.success) {
        setLawyers(res.data.lawyers);
        setTotal(res.data.total);
      }
    } catch (err) {
      message.error('加载律师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const practiceAreas = [
    '民商事诉讼', '刑事辩护', '知识产权', '公司法务',
    '劳动纠纷', '婚姻家庭', '房产纠纷', '合同纠纷'
  ];

  return (
    <div className="lawyer-list-page" style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>专业律师团队</Title>

        <Card style={{ marginBottom: 24 }}>
          <Space size="large" wrap>
            <Input
              placeholder="搜索律师姓名"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={loadLawyers}
            />
            <Select
              placeholder="选择执业领域"
              style={{ width: 200 }}
              allowClear
              value={practiceArea || undefined}
              onChange={(val) => { setPracticeArea(val); setPage(1); }}
            >
              {practiceAreas.map(area => (
                <Option key={area} value={area}>{area}</Option>
              ))}
            </Select>
            <Button type="primary" onClick={loadLawyers}>搜索</Button>
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          {lawyers.map((lawyer) => (
            <Col span={8} key={lawyer.id}>
              <Card hoverable className="lawyer-card" loading={loading}>
                <Card.Meta
                  avatar={<div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28 }}>{lawyer.name[0]}</div>}
                  title={<Link to={`/lawyers/${lawyer.id}`}>{lawyer.name}</Link>}
                  description={
                    <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                      <Tag color="blue">{lawyer.practice_area}</Tag>
                      <div>
                        <Tag>{lawyer.years_experience}年经验</Tag>
                        <Tag color="green">评分 {lawyer.rating}</Tag>
                        <Tag>{lawyer.consultation_count}次咨询</Tag>
                      </div>
                    </Space>
                  }
                />
                <p style={{ marginTop: 16, color: '#666' }}>{lawyer.bio?.substring(0, 80)}...</p>
                <Link to={`/lawyers/${lawyer.id}`}>
                  <Button type="primary" block style={{ marginTop: 16 }}>立即咨询</Button>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>

        {total > 0 && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={9}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        )}

        {lawyers.length === 0 && !loading && (
          <Card style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#999' }}>暂无律师数据</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default LawyerList;
