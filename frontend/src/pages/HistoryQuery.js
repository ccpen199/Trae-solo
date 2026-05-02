import React, { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Row, Col, Button } from 'antd';
import axios from 'axios';

const { Option } = Select;
const { RangePicker } = DatePicker;

const HistoryQuery = () => {
  const [activeTab, setActiveTab] = useState('equipment');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    resourceType: 'equipment',
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      let url = `http://localhost:3001/api/log`;
      if (activeTab === 'equipment') {
        url = `http://localhost:3001/api/log/maintenance`;
      } else if (activeTab === 'maintenance') {
        url = `http://localhost:3001/api/log/maintenance`;
      } else if (activeTab === 'repair') {
        url = `http://localhost:3001/api/log/repair`;
      } else if (activeTab === 'sparePart') {
        url = `http://localhost:3001/api/log/sparePart`;
      }

      const response = await axios.get(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const getColumns = () => {
    switch (activeTab) {
      case 'equipment':
        return [
          {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
          },
          {
            title: '操作人',
            dataIndex: 'user',
            key: 'user',
            render: (user) => user?.name || '未知'
          },
          {
            title: '角色',
            dataIndex: 'user',
            key: 'role',
            render: (user) => {
              const roleMap = {
                admin: '设备管理员',
                technician: '维修工',
                user: '使用人',
                sparePartManager: '备件管理员'
              };
              return roleMap[user?.role] || '未知';
            }
          },
          {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (action) => {
              const actionMap = {
                create: '创建',
                update: '更新',
                delete: '删除',
                view: '查看'
              };
              return actionMap[action] || action;
            }
          },
          {
            title: '描述',
            dataIndex: 'description',
            key: 'description'
          },
          {
            title: 'IP地址',
            dataIndex: 'ip',
            key: 'ip'
          }
        ];
      case 'maintenance':
        return [
          {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
          },
          {
            title: '操作人',
            dataIndex: 'user',
            key: 'user',
            render: (user) => user?.name || '未知'
          },
          {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (action) => {
              const actionMap = {
                create: '创建',
                update: '更新',
                delete: '删除',
                view: '查看'
              };
              return actionMap[action] || action;
            }
          },
          {
            title: '描述',
            dataIndex: 'description',
            key: 'description'
          }
        ];
      case 'repair':
        return [
          {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
          },
          {
            title: '操作人',
            dataIndex: 'user',
            key: 'user',
            render: (user) => user?.name || '未知'
          },
          {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (action) => {
              const actionMap = {
                create: '创建',
                update: '更新',
                delete: '删除',
                view: '查看'
              };
              return actionMap[action] || action;
            }
          },
          {
            title: '描述',
            dataIndex: 'description',
            key: 'description'
          }
        ];
      case 'sparePart':
        return [
          {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
          },
          {
            title: '操作人',
            dataIndex: 'user',
            key: 'user',
            render: (user) => user?.name || '未知'
          },
          {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (action) => {
              const actionMap = {
                create: '创建',
                update: '更新',
                delete: '删除',
                view: '查看'
              };
              return actionMap[action] || action;
            }
          },
          {
            title: '描述',
            dataIndex: 'description',
            key: 'description'
          }
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      <h2>履历查询</h2>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Select
              value={activeTab}
              onChange={(value) => setActiveTab(value)}
              style={{ width: '100%' }}
            >
              <Option value="equipment">设备履历</Option>
              <Option value="maintenance">保养记录</Option>
              <Option value="repair">维修记录</Option>
              <Option value="sparePart">备件消耗</Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  setFilters({
                    ...filters,
                    startDate: dates[0]?.toISOString(),
                    endDate: dates[1]?.toISOString()
                  });
                } else {
                  setFilters({
                    ...filters,
                    startDate: null,
                    endDate: null
                  });
                }
              }}
            />
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={getColumns()}
        dataSource={logs}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default HistoryQuery;