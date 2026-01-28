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
  Tabs,
  Drawer,
  InputNumber,
  Menu,
  DatePicker,
  Space,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  TeamOutlined,
  ToolOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Header, Content, Footer, Sider } = Layout;

const DistrictManagerDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dashboard State
  const [dashboardData, setDashboardData] = useState({
    totalSupervisors: 0,
    totalOperators: 0,
    totalMpcsOfficers: 0,
    totalTransportManagers: 0,
    totalFarmers: 0,
    totalMilkProcured: 0,
  });

  // Staff Management State
  const [supervisors, setSupervisors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [mpcsOfficers, setMpcsOfficers] = useState([]);
  const [transportManagers, setTransportManagers] = useState([]);
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);
  const [staffType, setStaffType] = useState('supervisor');
  const [staffForm] = Form.useForm();

  // Batch Management State
  const [batches, setBatches] = useState([]);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [batchForm] = Form.useForm();

  // Transport Tracking State
  const [transports, setTransports] = useState([]);
  const [isTransportModalVisible, setIsTransportModalVisible] = useState(false);
  const [transportForm] = Form.useForm();

  // Filters
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(30, 'days'), dayjs()],
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'DISTRICT_MANAGER') {
      navigate('/login');
    }
    fetchDashboardData();
    fetchStaff();
    fetchTransportManagers();
    fetchBatches();
    fetchTransports();
  }, []);

  // ============ DASHBOARD ============
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/district-managers/${user.dmId}/staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { supervisors = [], operators = [], mpcsOfficers = [] } = response.data;
      
      setDashboardData({
        totalSupervisors: supervisors.length,
        totalOperators: operators.length,
        totalMpcsOfficers: mpcsOfficers.length,
        totalTransportManagers: transportManagers.length,
        totalFarmers: mpcsOfficers.length * 3, // Placeholder
        totalMilkProcured: 0, // Calculate from procurement data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ STAFF MANAGEMENT ============
  const fetchStaff = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/district-managers/${user.dmId}/staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSupervisors(response.data.supervisors || []);
      setOperators(response.data.operators || []);
      setMpcsOfficers(response.data.mpcsOfficers || []);
    } catch (error) {
      message.error('Failed to fetch staff');
      console.error(error);
    }
  };

  const handleAddStaff = async (values) => {
    try {
      const endpoint = {
        supervisor: '/api/hierarchy/supervisors',
        operator: '/api/hierarchy/operators',
        'mpcs-officer': '/api/hierarchy/mpcs-officers',
      }[staffType];

      await axios.post(
        `http://localhost:5000${endpoint}`,
        { dmId: user.dmId, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success(`${staffType} created successfully`);
      staffForm.resetFields();
      setIsStaffModalVisible(false);
      fetchStaff();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error adding staff');
    }
  };

  const handleDeleteStaff = async (id, type) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/hierarchy/staff/${type}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Staff deleted successfully');
      fetchStaff();
    } catch (error) {
      message.error('Error deleting staff');
    }
  };

  // ============ TRANSPORT MANAGERS ============
  const fetchTransportManagers = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/district-managers/${user.dmId}/transport-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransportManagers(response.data || []);
    } catch (error) {
      console.error('Error fetching transport managers:', error);
    }
  };

  const handleAddTransportManager = async (values) => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/hierarchy/transport-managers',
        { dmId: user.dmId, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Transport Manager created successfully');
      staffForm.resetFields();
      setIsStaffModalVisible(false);
      fetchTransportManagers();
      fetchDashboardData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error adding Transport Manager');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransportManager = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/hierarchy/transport-staff/transport-manager/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Transport Manager deleted successfully');
      fetchTransportManagers();
      fetchDashboardData();
    } catch (error) {
      message.error('Error deleting Transport Manager');
    }
  };

  // ============ BATCH MANAGEMENT ============
  const fetchBatches = async () => {
    try {
      // Placeholder - will connect to actual batch API
      setBatches([
        { id: 1, batchId: 'B001', date: '2026-01-20', quantity: 500, status: 'completed' },
        { id: 2, batchId: 'B002', date: '2026-01-22', quantity: 750, status: 'in-progress' },
      ]);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleCreateBatch = async (values) => {
    try {
      // Add batch creation logic
      message.success('Batch created successfully');
      batchForm.resetFields();
      setIsBatchModalVisible(false);
      fetchBatches();
    } catch (error) {
      message.error('Error creating batch');
    }
  };

  // ============ TRANSPORT TRACKING ============
  const fetchTransports = async () => {
    try {
      // Placeholder - will connect to actual transport API
      setTransports([
        { id: 1, transportId: 'T001', location: 'Warehouse A', status: 'in-transit', date: '2026-01-22' },
        { id: 2, transportId: 'T002', location: 'Warehouse B', status: 'delivered', date: '2026-01-21' },
      ]);
    } catch (error) {
      console.error('Error fetching transports:', error);
    }
  };

  const handleCreateTransport = async (values) => {
    try {
      // Add transport creation logic
      message.success('Transport record created successfully');
      transportForm.resetFields();
      setIsTransportModalVisible(false);
      fetchTransports();
    } catch (error) {
      message.error('Error creating transport record');
    }
  };

  // ============ COLUMNS ============
  const supervisorColumns = [
    { title: 'ID', dataIndex: 'supId', key: 'supId' },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Popconfirm title="Delete?" onConfirm={() => handleDeleteStaff(record.id, 'supervisor')}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const operatorColumns = [
    { title: 'ID', dataIndex: 'opId', key: 'opId' },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Popconfirm title="Delete?" onConfirm={() => handleDeleteStaff(record.id, 'operator')}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const mpcsColumns = [
    { title: 'ID', dataIndex: 'mpcsId', key: 'mpcsId' },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Popconfirm title="Delete?" onConfirm={() => handleDeleteStaff(record.id, 'mpcs-officer')}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const batchColumns = [
    { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Quantity (L)', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (text) => <span style={{ textTransform: 'capitalize' }}>{text}</span> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  const transportColumns = [
    { title: 'Transport ID', dataIndex: 'transportId', key: 'transportId' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (text) => <span style={{ textTransform: 'capitalize' }}>{text}</span> },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
        </Space>
      ),
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ padding: '16px', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          DM Portal
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab]}
          onSelect={(e) => setActiveTab(e.key)}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'staff', icon: <TeamOutlined />, label: 'Staff Management' },
            { key: 'transport-managers', icon: <TruckOutlined />, label: 'Transport Managers' },
            { key: 'batches', icon: <ToolOutlined />, label: 'Batch Management' },
            { key: 'transport', icon: <TruckOutlined />, label: 'Transport Tracking' },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>District Manager Dashboard - {user.dmId}</h2>
          <Button onClick={handleLogout} icon={<LogoutOutlined />}>
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Dashboard Overview</h2>
              <Row gutter={16} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="Supervisors" value={dashboardData.totalSupervisors} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="Operators" value={dashboardData.totalOperators} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="MPCS Officers" value={dashboardData.totalMpcsOfficers} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="Total Farmers" value={dashboardData.totalFarmers} />
                  </Card>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Card title="Milk Procurement Trend" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={[
                        { date: 'Jan 10', quantity: 200 },
                        { date: 'Jan 15', quantity: 300 },
                        { date: 'Jan 20', quantity: 250 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="quantity" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Staff Distribution" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Supervisors', value: dashboardData.totalSupervisors },
                            { name: 'Operators', value: dashboardData.totalOperators },
                            { name: 'MPCS Officers', value: dashboardData.totalMpcsOfficers },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#0088fe" />
                          <Cell fill="#00c49f" />
                          <Cell fill="#ffbb28" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* STAFF MANAGEMENT TAB */}
          {activeTab === 'staff' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Space>
                  <Select
                    defaultValue="supervisor"
                    onChange={setStaffType}
                    style={{ width: 150 }}
                    options={[
                      { value: 'supervisor', label: 'Supervisor' },
                      { value: 'operator', label: 'Operator' },
                      { value: 'mpcs-officer', label: 'MPCS Officer' },
                    ]}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsStaffModalVisible(true)}>
                    Add Staff
                  </Button>
                </Space>
              </div>

              <Tabs>
                <Tabs.TabPane tab="Supervisors" key="supervisors">
                  <Table columns={supervisorColumns} dataSource={supervisors} rowKey="id" />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Operators" key="operators">
                  <Table columns={operatorColumns} dataSource={operators} rowKey="id" />
                </Tabs.TabPane>
                <Tabs.TabPane tab="MPCS Officers" key="mpcs">
                  <Table columns={mpcsColumns} dataSource={mpcsOfficers} rowKey="id" />
                </Tabs.TabPane>
              </Tabs>

              <Modal
                title={`Add ${staffType.charAt(0).toUpperCase() + staffType.slice(1)}`}
                open={isStaffModalVisible}
                onOk={() => staffForm.submit()}
                onCancel={() => setIsStaffModalVisible(false)}
              >
                <Form 
                  form={staffForm} 
                  onFinish={staffType === 'transport-manager' ? handleAddTransportManager : handleAddStaff} 
                  layout="vertical"
                >
                  <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                  {staffType === 'transport-manager' && (
                    <>
                      <Form.Item name="phoneNumber" label="Phone Number">
                        <Input />
                      </Form.Item>
                      <Form.Item name="licenseNumber" label="Transport License #">
                        <Input />
                      </Form.Item>
                      <Form.Item name="licenseExpiry" label="License Expiry" rules={[{ required: true }]}>
                        <DatePicker />
                      </Form.Item>
                    </>
                  )}
                </Form>
              </Modal>
            </div>
          )}

          {/* TRANSPORT MANAGERS TAB */}
          {activeTab === 'transport-managers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setStaffType('transport-manager');
                  setIsStaffModalVisible(true);
                }}>
                  Add Transport Manager
                </Button>
              </div>

              <Table
                columns={[
                  { title: 'TM ID', dataIndex: 'tmId', key: 'tmId' },
                  { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
                  { title: 'Email', dataIndex: 'email', key: 'email' },
                  { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
                  { title: 'License #', dataIndex: 'licenseNumber', key: 'licenseNumber' },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (
                      <Popconfirm title="Delete?" onConfirm={() => handleDeleteTransportManager(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ),
                  },
                ]}
                dataSource={transportManagers}
                rowKey="id"
                loading={loading}
              />
            </div>
          )}

          {/* BATCH MANAGEMENT TAB */}
          {activeTab === 'batches' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBatchModalVisible(true)}>
                  Create Batch
                </Button>
              </div>

              <Card title="Batch Management">
                <Table columns={batchColumns} dataSource={batches} rowKey="id" />
              </Card>

              <Modal
                title="Create New Batch"
                open={isBatchModalVisible}
                onOk={() => batchForm.submit()}
                onCancel={() => setIsBatchModalVisible(false)}
              >
                <Form form={batchForm} onFinish={handleCreateBatch} layout="vertical">
                  <Form.Item name="batchId" label="Batch ID" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="quantity" label="Quantity (Liters)" rules={[{ required: true }]}>
                    <InputNumber />
                  </Form.Item>
                  <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                    <DatePicker />
                  </Form.Item>
                </Form>
              </Modal>
            </div>
          )}

          {/* TRANSPORT TRACKING TAB */}
          {activeTab === 'transport' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsTransportModalVisible(true)}>
                  Add Transport Record
                </Button>
              </div>

              <Card title="Transport Tracking">
                <Table columns={transportColumns} dataSource={transports} rowKey="id" />
              </Card>

              <Modal
                title="Add Transport Record"
                open={isTransportModalVisible}
                onOk={() => transportForm.submit()}
                onCancel={() => setIsTransportModalVisible(false)}
              >
                <Form form={transportForm} onFinish={handleCreateTransport} layout="vertical">
                  <Form.Item name="transportId" label="Transport ID" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'in-transit', label: 'In Transit' },
                        { value: 'delivered', label: 'Delivered' },
                        { value: 'pending', label: 'Pending' },
                      ]}
                    />
                  </Form.Item>
                </Form>
              </Modal>
            </div>
          )}
        </Content>

        <Footer style={{ textAlign: 'center' }}>Dairy Infra Portal © 2026</Footer>
      </Layout>
    </Layout>
  );
};

export default DistrictManagerDashboard;
