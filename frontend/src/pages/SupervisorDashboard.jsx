import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Statistic,
  Row,
  Col,
  Drawer,
  InputNumber,
  DatePicker,
  Tabs,
  Tag,
} from 'antd';
import { LogoutOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content, Footer, Sider } = Layout;

const SupervisorDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [workAssignments, setWorkAssignments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAssignWorkModalVisible, setIsAssignWorkModalVisible] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [assignWorkForm] = Form.useForm();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchWorkAssignments();
    fetchProgressSummary();
  }, []);

  const fetchWorkAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/supervisor/work-assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkAssignments(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch work assignments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/supervisor/progress-summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch progress summary');
      console.error(error);
    }
  };

  const handleAssignWork = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/supervisor/work-assignments', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Work assigned successfully');
      assignWorkForm.resetFields();
      setIsAssignWorkModalVisible(false);
      setEditingWork(null);
      fetchWorkAssignments();
      fetchProgressSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error assigning work');
    }
  };

  const handleUpdateStatus = async (workId, status, stage) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/supervisor/work-assignments/${workId}`,
        { status, stage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Work status updated');
      fetchWorkAssignments();
      fetchProgressSummary();
    } catch (error) {
      message.error('Error updating work status');
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
      title: 'Milk Qty (L)',
      dataIndex: 'milkQuantity',
      key: 'milkQuantity',
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
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = { HIGH: 'red', MEDIUM: 'orange', LOW: 'green' };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setEditingWork(record);
            assignWorkForm.setFieldsValue(record);
            setIsAssignWorkModalVisible(true);
          }}
          icon={<EditOutlined />}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', padding: '16px', textAlign: 'center' }}>
          {collapsed ? 'SUP' : 'Supervisor'}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button type="primary" danger block onClick={handleLogout} icon={<LogoutOutlined />}>
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Supervisor Dashboard</h2>
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
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="Total Assignments"
                  value={summary.totalAssignments || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="Pending"
                  value={summary.pending || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="In Progress"
                  value={summary.inProgress || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="Completed"
                  value={summary.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="On Hold"
                  value={summary.onHold || 0}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="Total Milk (L)"
                  value={summary.totalMilkProcessed?.toFixed(2) || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="Work Assignments & Batches"
            style={{ marginTop: '24px' }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingWork(null);
                  assignWorkForm.resetFields();
                  setIsAssignWorkModalVisible(true);
                }}
              >
                Assign Work
              </Button>
            }
          >
            <Table
              columns={workColumns}
              dataSource={workAssignments}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dairy Infra Portal ©2024</Footer>
      </Layout>

      <Modal
        title={editingWork ? 'Edit Work Assignment' : 'Assign New Work'}
        visible={isAssignWorkModalVisible}
        onCancel={() => setIsAssignWorkModalVisible(false)}
        footer={null}
      >
        <Form form={assignWorkForm} onFinish={handleAssignWork} layout="vertical">
          <Form.Item name="operatorId" label="Operator ID" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="taskDescription" label="Task Description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="milkQuantity" label="Milk Quantity (L)">
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="stage" label="Stage" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="RECEPTION">Reception</Select.Option>
              <Select.Option value="FILTRATION">Filtration</Select.Option>
              <Select.Option value="COOLING">Cooling</Select.Option>
              <Select.Option value="PROCESSING">Processing</Select.Option>
              <Select.Option value="PACKAGING">Packaging</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="expectedEndTime" label="Expected End Time" rules={[{ required: true }]}>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="LOW">Low</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editingWork ? 'Update Assignment' : 'Assign Work'}
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default SupervisorDashboard;
