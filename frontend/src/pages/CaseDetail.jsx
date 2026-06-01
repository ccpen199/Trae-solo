import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tabs,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Typography,
  Descriptions,
  Tag,
  Row,
  Col,
  Popconfirm,
  Collapse,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderOutlined,
  ExportOutlined,
  RollbackOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { caseAPI, evidenceAPI, groupAPI, exportAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const CaseDetail = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [withdrawId, setWithdrawId] = useState(null);
  const [batchUploadModal, setBatchUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [evidenceForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const { canEdit } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [caseRes, evidenceRes, groupsRes] = await Promise.all([
        caseAPI.getById(caseId),
        evidenceAPI.getByCase(caseId),
        groupAPI.getByCase(caseId),
      ]);
      setCaseData(caseRes.data.case);
      setEvidence(evidenceRes.data.evidence);
      setGroups(groupsRes.data.groups);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [caseId]);

  const handleCreateEvidence = () => {
    setEditingEvidence(null);
    evidenceForm.resetFields();
    setEvidenceModal(true);
  };

  const handleEditEvidence = (record) => {
    setEditingEvidence(record);
    evidenceForm.setFieldsValue(record);
    setEvidenceModal(true);
  };

  const handleSubmitEvidence = async () => {
    try {
      const values = await evidenceForm.validateFields();
      const formData = new FormData();
      
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          if (key === 'file' && values[key]?.file) {
            formData.append('file', values[key].file.originFileObj);
          } else {
            formData.append(key, values[key]);
          }
        }
      });
      formData.append('case_id', caseId);

      if (editingEvidence) {
        await evidenceAPI.update(editingEvidence.id, values);
        message.success('更新成功');
      } else {
        await evidenceAPI.create(formData);
        message.success('创建成功');
      }
      setEvidenceModal(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleBatchUpload = async () => {
    if (fileList.length === 0) {
      message.error('请选择文件');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('case_id', caseId);
      fileList.forEach((file) => {
        formData.append('files', file.originFileObj);
      });

      await evidenceAPI.batchUpload(formData);
      message.success('批量上传成功');
      setBatchUploadModal(false);
      setFileList([]);
      loadData();
    } catch (error) {
      message.error('批量上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      const values = await withdrawForm.validateFields();
      await evidenceAPI.withdraw(withdrawId, values.reason);
      message.success('撤回成功');
      setWithdrawModal(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('撤回失败');
    }
  };

  const handleReorder = async (id, direction) => {
    const index = evidence.findIndex((e) => e.id === id);
    if (index === -1) return;

    const newEvidence = [...evidence];
    if (direction === 'up' && index > 0) {
      [newEvidence[index], newEvidence[index - 1]] = [newEvidence[index - 1], newEvidence[index]];
    } else if (direction === 'down' && index < evidence.length - 1) {
      [newEvidence[index], newEvidence[index + 1]] = [newEvidence[index + 1], newEvidence[index]];
    }

    const orders = newEvidence.map((e, i) => ({ id: e.id, sort_order: i + 1 }));
    try {
      await evidenceAPI.reorder(caseId, orders);
      loadData();
      message.success('排序更新成功');
    } catch (error) {
      message.error('排序更新失败');
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    setGroupModal(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    groupForm.setFieldsValue(group);
    setGroupModal(true);
  };

  const handleDeleteGroup = async (id) => {
    try {
      await groupAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      if (editingGroup) {
        await groupAPI.update(editingGroup.id, values);
        message.success('更新成功');
      } else {
        await groupAPI.create({ ...values, case_id: caseId });
        message.success('创建成功');
      }
      setGroupModal(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportAPI.exportCase(caseId, { export_type: 'excel' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${caseData?.case_number || '证据目录'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const evidenceColumns = [
    {
      title: '排序',
      key: 'sort',
      width: 80,
      render: (_, record, index) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleReorder(record.id, 'up')}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === evidence.length - 1}
            onClick={() => handleReorder(record.id, 'down')}
          />
        </Space>
      ),
    },
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '证据编号',
      dataIndex: 'evidence_number',
      key: 'evidence_number',
      width: 120,
    },
    {
      title: '证据名称',
      dataIndex: 'evidence_name',
      key: 'evidence_name',
    },
    {
      title: '证据类型',
      dataIndex: 'evidence_type',
      key: 'evidence_type',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '证明目的',
      dataIndex: 'proof_purpose',
      key: 'proof_purpose',
      ellipsis: true,
    },
    {
      title: '保密级别',
      dataIndex: 'confidentiality_level',
      key: 'confidentiality_level',
      width: 100,
      render: (level) => {
        const colors = { normal: 'default', secret: 'orange', top_secret: 'red' };
        const labels = { normal: '普通', secret: '秘密', top_secret: '绝密' };
        return <Tag color={colors[level]}>{labels[level] || level}</Tag>;
      },
    },
    {
      title: '原件状态',
      dataIndex: 'original_status',
      key: 'original_status',
      width: 100,
      render: (status) => {
        const colors = { original: 'green', copy: 'blue', electronic: 'purple' };
        const labels = { original: '原件', copy: '复印件', electronic: '电子件' };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: '附件',
      key: 'file',
      width: 80,
      render: (_, record) =>
        record.file_name && (
          <a href={evidenceAPI.download(record.file_path)} target="_blank" rel="noopener noreferrer">
            <DownloadOutlined />
          </a>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {canEdit() && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditEvidence(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确认撤回"
                description="撤回后证据将不再显示在目录中"
                onConfirm={() => {
                  setWithdrawId(record.id);
                  setWithdrawModal(true);
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<RollbackOutlined />}>
                  撤回
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (!caseData) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>
          {caseData.case_number} - {caseData.case_name}
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="案件类型">{caseData.case_type}</Descriptions.Item>
          <Descriptions.Item label="法院">{caseData.court}</Descriptions.Item>
          <Descriptions.Item label="原告">{caseData.plaintiff}</Descriptions.Item>
          <Descriptions.Item label="被告">{caseData.defendant}</Descriptions.Item>
          <Descriptions.Item label="立案日期">{caseData.filing_date}</Descriptions.Item>
          <Descriptions.Item label="开庭日期">{caseData.hearing_date}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs defaultActiveKey="evidence">
        <TabPane tab="证据目录" key="evidence">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {canEdit() && (
                  <>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateEvidence}>
                      添加证据
                    </Button>
                    <Button icon={<UploadOutlined />} onClick={() => setBatchUploadModal(true)}>
                      批量上传
                    </Button>
                  </>
                )}
              </Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出目录
              </Button>
            </div>

            <Collapse defaultActiveKey={groups.map((g) => g.id)}>
              {groups.map((group) => (
                <Panel
                  key={group.id}
                  header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>
                        <FolderOutlined style={{ marginRight: 8 }} />
                        {group.group_name}
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {evidence.filter((e) => e.group_id === group.id).length} 项
                        </Tag>
                      </span>
                      {canEdit() && (
                        <Space>
                          <Button type="link" size="small" onClick={() => handleEditGroup(group)}>
                            编辑
                          </Button>
                          <Popconfirm
                            title="确认删除"
                            onConfirm={() => handleDeleteGroup(group.id)}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button type="link" size="small" danger>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      )}
                    </div>
                  }
                >
                  <Table
                    columns={evidenceColumns}
                    dataSource={evidence.filter((e) => e.group_id === group.id)}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Panel>
              ))}
            </Collapse>

            <Divider />

            <div style={{ marginTop: 16 }}>
              <Title level={5}>未分组证据</Title>
              <Table
                columns={evidenceColumns}
                dataSource={evidence.filter((e) => !e.group_id)}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {canEdit() && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleCreateGroup} block>
                  添加分组
                </Button>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab="导出记录" key="exports">
          <Card>导出记录功能开发中...</Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingEvidence ? '编辑证据' : '添加证据'}
        open={evidenceModal}
        onOk={handleSubmitEvidence}
        onCancel={() => setEvidenceModal(false)}
        width={700}
      >
        <Form form={evidenceForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="evidence_number" label="证据编号" rules={[{ required: true }]}>
                <Input placeholder="请输入证据编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="group_id" label="所属分组">
                <Select placeholder="请选择分组">
                  {groups.map((g) => (
                    <Select.Option key={g.id} value={g.id}>
                      {g.group_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="evidence_name" label="证据名称" rules={[{ required: true }]}>
            <Input placeholder="请输入证据名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="evidence_type" label="证据类型">
                <Select placeholder="请选择证据类型">
                  <Select.Option value="document">书证</Select.Option>
                  <Select.Option value="physical">物证</Select.Option>
                  <Select.Option value="audio">视听资料</Select.Option>
                  <Select.Option value="witness">证人证言</Select.Option>
                  <Select.Option value="expert">鉴定意见</Select.Option>
                  <Select.Option value="electronic">电子数据</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="证据来源">
                <Input placeholder="请输入证据来源" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="obtain_date" label="取得日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="confidentiality_level" label="保密级别">
                <Select placeholder="请选择保密级别" defaultValue="normal">
                  <Select.Option value="normal">普通</Select.Option>
                  <Select.Option value="secret">秘密</Select.Option>
                  <Select.Option value="top_secret">绝密</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="original_status" label="原件状态">
                <Select placeholder="请选择原件状态" defaultValue="original">
                  <Select.Option value="original">原件</Select.Option>
                  <Select.Option value="copy">复印件</Select.Option>
                  <Select.Option value="electronic">电子件</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="proof_purpose" label="证明目的">
            <TextArea rows={3} placeholder="请输入证明目的" />
          </Form.Item>
          <Form.Item name="dispute_focus" label="争议焦点">
            <TextArea rows={2} placeholder="请输入争议焦点" />
          </Form.Item>
          {!editingEvidence && (
            <Form.Item name="file" label="上传文件" valuePropName="file">
              <Upload beforeUpload={() => false} maxCount={1}>
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={editingGroup ? '编辑分组' : '添加分组'}
        open={groupModal}
        onOk={handleSubmitGroup}
        onCancel={() => setGroupModal(false)}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item name="group_name" label="分组名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分组名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入分组描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量上传证据" open={batchUploadModal} onOk={handleBatchUpload} onCancel={() => { setBatchUploadModal(false); setFileList([]); }} confirmLoading={uploading}>
        <Upload
          fileList={fileList}
          beforeUpload={() => false}
          multiple
          onChange={({ fileList }) => setFileList(fileList)}
        >
          <Button icon={<UploadOutlined />}>选择文件</Button>
        </Upload>
        <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
          支持多文件上传，系统会自动以文件名作为证据名称
        </p>
      </Modal>

      <Modal title="撤回证据" open={withdrawModal} onOk={handleWithdraw} onCancel={() => setWithdrawModal(false)}>
        <Form form={withdrawForm} layout="vertical">
          <Form.Item name="reason" label="撤回原因" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请输入撤回原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseDetail;
