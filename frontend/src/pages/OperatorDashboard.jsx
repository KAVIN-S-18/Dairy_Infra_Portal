import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Statistic,
  Row,
  Col,
  Drawer,
  InputNumber,
  DatePicker,
  Tabs,
  Tag,
  List,
  Space,
} from 'antd';
import { LogoutOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content, Footer, Sider } = Layout;

const OperatorDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [todaysWork, setTodaysWork] = useState([]);
  const [allWork, setAllWork] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [logForm] = Form.useForm();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTodaysWork();
    fetchAllWork();
    fetchDailyLogs();
    fetchWorkSummary();
  }, []);

  const fetchTodaysWork = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/operator/todays-work', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodaysWork(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch today\'s work');
      console.error(error);
    }
  };

  const fetchAllWork = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/operator/assigned-work', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllWork(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch assigned work');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/operator/daily-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDailyLogs(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch daily logs');
      console.error(error);
    }
  };

  const fetchWorkSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/operator/work-summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch work summary');
      console.error(error);
    }
  };

  const handleLogWork = async (values) => {
    try {
      await axios.post(
        `http://localhost:5000/api/operator/work-assignments/${selectedWork.id}/completion`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Work logged successfully');
      logForm.resetFields();
      setIsLogModalVisible(false);
      setSelectedWork(null);
      fetchTodaysWork();
      fetchAllWork();
      fetchDailyLogs();
      fetchWorkSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error logging work');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      ON_HOLD: 'error',
    };
    return colors[status] || 'default';
  };

  const stageColors = {
    RECEPTION: 'blue',
    FILTRATION: 'cyan',
    COOLING: 'geekblue',
    PROCESSING: 'purple',
    PACKAGING: 'magenta',
    COMPLETED: 'green',
  };

  const workColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
    },
    {
      title: 'Task Description',
      dataIndex: 'taskDescription',
      key: 'taskDescription',
      ellipsis: true,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage) => <Tag color={stageColors[stage]}>{stage}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.status !== 'COMPLETED' && (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => {
              setSelectedWork(record);
              setIsLogModalVisible(true);
            }}
          >
            Log Completion
          </Button>
        )
      ),
    },
  ];

  const logColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (_, record) => {
        const work = allWork.find((w) => w.id === record.workAssignmentId);
        return work?.batchId || 'Unknown';
      },
    },
    {
      title: 'Output Qty (L)',
      dataIndex: 'outputQuantity',
      key: 'outputQuantity',
    },
    {
      title: 'Quality Notes',
      dataIndex: 'qualityNotes',
      key: 'qualityNotes',
      ellipsis: true,
    },
    {
      title: 'Time',
      dataIndex: 'logDate',
      key: 'logDate',
      render: (text) => dayjs(text).format('DD-MM-YYYY HH:mm'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', padding: '16px', textAlign: 'center' }}>
          {collapsed ? 'OPR' : 'Operator'}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button type="primary" danger block onClick={handleLogout} icon={<LogoutOutlined />}>
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Operator Dashboard</h2>
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px' }}
          >
            ☰
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Assigned"
                  value={summary.totalAssigned || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Completed"
                  value={summary.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="In Progress"
                  value={summary.inProgress || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Pending"
                  value={summary.pending || 0}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs
            defaultActiveKey="1"
            style={{ marginTop: '24px' }}
            items={[
              {
                key: '1',
                label: `Today's Work (${todaysWork.length})`,
                children: (
                  <Card title="Today's Work Assignment">
                    {todaysWork.length === 0 ? (
                      <p>No work assigned for today</p>
                    ) : (
                      <List
                        dataSource={todaysWork}
                        renderItem={(item) => (
                          <List.Item
                            extra={
                              item.status !== 'COMPLETED' && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => {
                                    setSelectedWork(item);
                                    setIsLogModalVisible(true);
                                  }}
                                >
                                  Log Completion
                                </Button>
                              )
                            }
                          >
                            <List.Item.Meta
                              title={`${item.batchId} - ${item.taskDescription}`}
                              description={
                                <Space>
                                  <span>Stage: <Tag color={stageColors[item.stage]}>{item.stage}</Tag></span>
                                  <span>Status: <Tag color={getStatusColor(item.status)}>{item.status}</Tag></span>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                ),
              },
              {
                key: '2',
                label: 'All Work',
                children: (
                  <Card title="All Assigned Work">
                    <Table
                      columns={workColumns}
                      dataSource={allWork}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                ),
              },
              {
                key: '3',
                label: `Daily Logs (${dailyLogs.length})`,
                children: (
                  <Card title="Work Completion Logs">
                    <Table
                      columns={logColumns}
                      dataSource={dailyLogs}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dairy Infra Portal ©2024</Footer>
      </Layout>

      <Modal
        title="Log Work Completion"
        visible={isLogModalVisible}
        onCancel={() => {
          setIsLogModalVisible(false);
          setSelectedWork(null);
          logForm.resetFields();
        }}
        footer={null}
      >
        {selectedWork && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>Batch ID:</strong> {selectedWork.batchId}</p>
            <p><strong>Task:</strong> {selectedWork.taskDescription}</p>
            <p><strong>Stage:</strong> <Tag color={stageColors[selectedWork.stage]}>{selectedWork.stage}</Tag></p>
          </div>
        )}
        <Form form={logForm} onFinish={handleLogWork} layout="vertical">
          <Form.Item name="outputQuantity" label="Output Quantity (L)" rules={[{ required: true }]}>
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="qualityNotes" label="Quality Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="issuesFaced" label="Issues Faced (if any)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block icon={<CheckOutlined />}>
            Log Completion
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default OperatorDashboard;
