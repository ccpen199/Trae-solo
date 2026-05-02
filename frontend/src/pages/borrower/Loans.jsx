import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, Spin, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/api.js';
import { getStatusInfo, formatCurrency, formatDateTime } from '../../utils/status.js';

function BorrowerLoans() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getApplications();
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error('Fetch applications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'application_no',
      key: 'application_no',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/borrower/application/${record.id}`)}>
          {text}
        </Button>
      )
    },
    {
      title: '贷款金额',
      dataIndex: 'loan_amount',
      key: 'loan_amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: '贷款期限',
      dataIndex: 'loan_term',
      key: 'loan_term',
      render: (val) => `${val}个月`
    },
    {
      title: '贷款用途',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (val) => val || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDateTime(text)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/borrower/application/${record.id}`)}>
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">我的贷款</div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="加载中..." />
          </div>
        ) : applications.length > 0 ? (
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        ) : (
          <Empty description="暂无贷款记录" />
        )}
      </Card>
    </div>
  );
}

export default BorrowerLoans;
