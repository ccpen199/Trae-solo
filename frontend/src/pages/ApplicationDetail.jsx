import { Card, Descriptions, Button, Space, Timeline, Tag, message, Divider, Table, Typography, Steps } from 'antd';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatusTag from '../components/StatusTag';
import { isEditable, isRejected, STEP_MAP, isApproving } from '../utils/status';
import dayjs from 'dayjs';

const { Title } = Typography;

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications/${id}`);
      setDetail(response.data);
    } catch (error) {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  if (loading || !detail) {
    return <div>加载中...</div>;
  }

  const getStepItems = () => {
    const steps = [
      { title: '提交申请', status: 'finish' },
      { title: '业务员审批', status: 'wait' },
      { title: '财务复核', status: 'wait' },
      { title: '完成', status: 'wait' },
    ];

    if (detail.status === 'approving' || detail.status === 'submitted') {
      steps[1].status = 'process';
    } else if (detail.status === 'reviewing') {
      steps[1].status = 'finish';
      steps[2].status = 'process';
    } else if (detail.status === 'approved' || detail.status === 'archived') {
      steps[1].status = 'finish';
      steps[2].status = 'finish';
      steps[3].status = 'finish';
    } else if (isRejected(detail.status)) {
      steps[1].status = 'error';
    }

    return steps;
  };

  const recordColumns = [
    {
      title: '审批人',
      dataIndex: 'approver_name',
      key: 'approver_name',
    },
    {
      title: '审批步骤',
      dataIndex: 'step',
      key: 'step',
      render: (step) => {
        const stepMap = {
          submit: '提交申请',
          approver: '业务员审批',
          finance: '财务复核',
        };
        return stepMap[step] || step;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={action === 'approve' ? 'success' : 'error'}>
          {action === 'approve' ? '通过' : '驳回'}
        </Tag>
      ),
    },
    {
      title: '审批意见',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment) => comment || '-',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>报销申请详情</Title>
          <Space>
            <Button onClick={() => navigate(-1)}>返回</Button>
            {isEditable(detail.status) && (
              <Button type="primary" onClick={() => navigate(`/application/edit/${detail.id}`)}>
                {isRejected(detail.status) ? '修改并重新提交' : '编辑'}
              </Button>
            )}
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="申请单号">{detail.application_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag status={detail.status} />
          </Descriptions.Item>
          <Descriptions.Item label="申请人">{detail.applicant_name}</Descriptions.Item>
          <Descriptions.Item label="所属部门">{detail.applicant_department}</Descriptions.Item>
          <Descriptions.Item label="所属项目">{detail.project_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="报销类型">{detail.expense_type_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="报销金额">
            <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
              ¥{detail.amount?.toFixed(2) || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="申请时间">
            {detail.created_at ? dayjs(detail.created_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审批人">{detail.approver_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="财务复核人">{detail.reviewer_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="内容描述" span={2}>{detail.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="抄送人" span={2}>
            {detail.cc_records?.length > 0 
              ? detail.cc_records.map(cc => cc.user_name).join(', ')
              : '无'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={5}>审批进度</Title>
        <Steps
          current={isRejected(detail.status) ? 1 : undefined}
          status={isRejected(detail.status) ? 'error' : undefined}
          items={getStepItems()}
          style={{ marginBottom: 24 }}
        />

        <Divider />

        <Title level={5}>审批记录</Title>
        {detail.approval_records?.length > 0 ? (
          <Table
            columns={recordColumns}
            dataSource={detail.approval_records}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <p style={{ color: '#999' }}>暂无审批记录</p>
        )}

        {detail.attachments?.length > 0 && (
          <>
            <Divider />
            <Title level={5}>附件</Title>
            <Table
              columns={[
                { title: '文件名', dataIndex: 'original_name', key: 'original_name' },
                { title: '类型', dataIndex: 'file_type', key: 'file_type' },
                { title: '大小', dataIndex: 'file_size', key: 'file_size' },
              ]}
              dataSource={detail.attachments}
              rowKey="id"
              pagination={false}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default ApplicationDetail;
