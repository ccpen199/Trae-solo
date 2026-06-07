import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, message } from 'antd';
import { policyAPI } from '../../services/api';

function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await policyAPI.getDetail(id);
      setPolicy(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const res = await policyAPI.apply(id, {});
      message.success('申请提交成功');
      navigate(`/policy/applications`);
    } catch (err) {
      message.error(err.response?.data?.error || '申请失败');
    } finally {
      setLoading(false);
    }
  };

  if (!policy) return <div>加载中...</div>;

  return (
    <div>
      <Card
        title={policy.title}
        extra={
          <Button type="primary" onClick={handleApply} loading={loading}>
            立即申报
          </Button>
        }
      >
        <Descriptions column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="发布部门">{policy.department}</Descriptions.Item>
          <Descriptions.Item label="发布日期">{policy.publish_date}</Descriptions.Item>
          <Descriptions.Item label="有效期">
            {policy.valid_from} 至 {policy.valid_to}
          </Descriptions.Item>
          <Descriptions.Item label="资助方式">
            <Tag color="green">
              {policy.benefit_type === 'subsidy' ? '补贴' : 
               policy.benefit_type === 'tax_reduction' ? '税收减免' : '返还'}
            </Tag>
          </Descriptions.Item>
          {policy.benefit_amount && (
            <Descriptions.Item label="资助金额">
              <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>
                最高 {policy.benefit_amount.toLocaleString()} 元
              </span>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="浏览量">{policy.viewCount} 次</Descriptions.Item>
        </Descriptions>

        <Card type="inner" title="政策摘要" style={{ marginBottom: 16 }}>
          <p>{policy.summary}</p>
        </Card>

        <Card type="inner" title="政策内容">
          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
            {policy.content}
          </div>
        </Card>

        <Card type="inner" title="适用范围" style={{ marginTop: 16 }}>
          <Space direction="vertical">
            <div>
              <strong>适用行业：</strong>
              {policy.industry_tags?.split(',').map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <div>
              <strong>适用规模：</strong>
              {policy.scale_tags?.split(',').map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            <div>
              <strong>年纳税额要求：</strong>
              {policy.tax_min ? `${policy.tax_min.toLocaleString()} 元以上` : '无最低要求'}
              {policy.tax_max ? ` - ${policy.tax_max.toLocaleString()} 元以下` : ''}
            </div>
          </Space>
        </Card>
      </Card>
    </div>
  );
}

export default PolicyDetail;
