import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tree, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tabs, Tag, Row, Col, Alert } from 'antd';
import { PlusOutlined, UserSwitchOutlined, ApartmentOutlined, SafetyOutlined } from '@ant-design/icons';
import { enterpriseAPI } from '../../services/api';

const { TabPane } = Tabs;

function EnterpriseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enterprise, setEnterprise] = useState(null);
  const [orgTree, setOrgTree] = useState([]);
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('org');
  const [form] = Form.useForm();
  const [bindForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [entRes, orgRes] = await Promise.all([
        enterpriseAPI.getDetail(id),
        enterpriseAPI.getOrgTree(id)
      ]);
      setEnterprise(entRes.data);
      setOrgTree(orgRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrg = async (values) => {
    try {
      await enterpriseAPI.addOrg(id, {
        ...values,
        parentId: selectedNode?.id || 0
      });
      message.success('添加成功');
      setOrgModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error('添加失败');
    }
  };

  const handleDeleteOrg = async (nodeId) => {
    try {
      await enterpriseAPI.deleteOrg(id, nodeId);
      message.success('删除成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleBind = async (values) => {
    try {
      const res = await enterpriseAPI.bind(id, values);
      message.success(res.data.message);
      setBindModalVisible(false);
      bindForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || '绑定失败');
    }
  };

  const renderTreeNodes = (data) =>
    data.map(item => ({
      title: (
        <span>
          {item.type === 'headquarters' && <ApartmentOutlined style={{ marginRight: 4 }} />}
          {item.type === 'department' && <SafetyOutlined style={{ marginRight: 4 }} />}
          {item.name}
          <span style={{ marginLeft: 8 }}>
            <Button size="small" onClick={(e) => { e.stopPropagation(); setSelectedNode(item); setOrgModalVisible(true); }}>
              <PlusOutlined />
            </Button>
            <Popconfirm
              title="确定删除该部门？"
              onConfirm={() => handleDeleteOrg(item.id)}
            >
              <Button size="small" danger onClick={(e) => e.stopPropagation()}>删除</Button>
            </Popconfirm>
          </span>
        </span>
      ),
      key: item.id,
      children: item.children?.length > 0 ? renderTreeNodes(item.children) : null
    }));

  if (!enterprise) return <div>加载中...</div>;

  return (
    <div>
      <Card 
        title={enterprise.name} 
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Tag color="blue">{enterprise.industry}</Tag>
            <Tag color="green">{enterprise.scale}</Tag>
          </Space>
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="统一社会信用代码">{enterprise.unified_credit_code}</Descriptions.Item>
          <Descriptions.Item label="法定代表人">{enterprise.legal_person}</Descriptions.Item>
          <Descriptions.Item label="注册地址">{enterprise.address}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{enterprise.contact_phone}</Descriptions.Item>
          <Descriptions.Item label="年纳税额">{enterprise.tax_amount?.toLocaleString()} 元</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="组织架构管理" key="org">
            <div style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <p style={{ margin: 0, color: '#666' }}>
                    支持多级部门架构管理，可添加总部、部门、小组等层级
                  </p>
                </Col>
                <Col>
                  <Button type="primary" onClick={() => { setSelectedNode(null); setOrgModalVisible(true); }}>
                    <PlusOutlined /> 添加一级部门
                  </Button>
                </Col>
              </Row>
            </div>
            
            <div className="org-tree-container">
              {orgTree.length > 0 ? (
                <Tree
                  showLine
                  defaultExpandAll
                  treeData={renderTreeNodes(orgTree)}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <ApartmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <p>暂无组织架构数据</p>
                  <p style={{ fontSize: 12 }}>点击上方按钮添加第一个部门</p>
                </div>
              )}
            </div>
          </TabPane>

          <TabPane tab="法人身份绑定" key="binding">
            <Card size="small" type="inner" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col>
                  <UserSwitchOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                </Col>
                <Col flex={1}>
                  <h4 style={{ margin: 0 }}>法人身份认证</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                    完成法人身份绑定后，可享受政策申报快速通道、优先审核等服务
                  </p>
                </Col>
                <Col>
                  <Button type="primary" onClick={() => setBindModalVisible(true)}>
                    法人身份绑定
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="绑定说明">
              <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
                <li>请输入法定代表人的真实姓名和身份证号码</li>
                <li>系统将与企业工商登记信息进行比对核验</li>
                <li>信息核验通过后即可完成法人身份绑定</li>
                <li>绑定后可作为企业管理员进行政策申报等操作</li>
                <li>如有疑问，请拨打服务热线：12345</li>
              </ol>
            </Card>
          </TabPane>

          <TabPane tab="企业资质" key="qualification">
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <p>企业资质管理功能开发中...</p>
            </div>
          </TabPane>

          <TabPane tab="操作日志" key="logs">
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <p>操作日志功能开发中...</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="添加部门"
        open={orgModalVisible}
        onCancel={() => setOrgModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrg}>
          {selectedNode && (
            <Alert type="info" message={`将在「${selectedNode.name}」下添加子部门`} style={{ marginBottom: 16 }} />
          )}
          <Form.Item name="name" label="部门名称" rules={[{ required: true }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="type" label="部门类型" initialValue="department">
            <Select>
              <Select.Option value="headquarters">总部</Select.Option>
              <Select.Option value="department">部门</Select.Option>
              <Select.Option value="team">小组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="manager" label="负责人">
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>添加</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="法人身份绑定"
        open={bindModalVisible}
        onCancel={() => setBindModalVisible(false)}
        footer={null}
        width={450}
      >
        <Form form={bindForm} layout="vertical" onFinish={handleBind}>
          <Form.Item name="name" label="法定代表人姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入法定代表人真实姓名" />
          </Form.Item>
          <Form.Item name="idCard" label="法定代表人身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入18位身份证号码" maxLength={18} />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="系统将验证您输入的信息与企业工商登记信息是否一致"
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              验证并绑定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default EnterpriseDetail;
