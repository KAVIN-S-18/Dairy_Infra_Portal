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
  Popconfirm,
  Menu,
  Space,
} from 'antd';
import {
  LogoutOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DashboardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Sider, Content, Footer } = Layout;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // State
  const [dashboardData, setDashboardData] = useState({
    totalDMs: 0,
    totalSupervisors: 0,
    totalMpcsOfficers: 0,
    totalFarmers: 0,
  });

  const [districtManagers, setDistrictManagers] = useState([]);
  const [isDMModalVisible, setIsDMModalVisible] = useState(false);
  const [dmForm] = Form.useForm();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'ADMIN') {
      navigate('/login');
    }
    fetchDashboardData();
    fetchDistrictManagers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/admins/${user.adminId}/district-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDashboardData({
        totalDMs: response.data.length,
        totalSupervisors: response.data.length * 2,
        totalMpcsOfficers: response.data.length * 2,
        totalFarmers: response.data.length * 2 * 3,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistrictManagers = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/admins/${user.adminId}/district-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDistrictManagers(response.data);
    } catch (error) {
      message.error('Failed to fetch district managers');
      console.error(error);
    }
  };

  const handleAddDM = async (values) => {
    try {
      await axios.post(
        'http://localhost:5000/api/hierarchy/district-managers',
        { adminId: user.adminId, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('District Manager created successfully');
      dmForm.resetFields();
      setIsDMModalVisible(false);
      fetchDistrictManagers();
      fetchDashboardData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error creating District Manager');
    }
  };

  const dmColumns = [
    { title: 'DM ID', dataIndex: 'dmId', key: 'dmId', width: 120 },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (text) => <span style={{ textTransform: 'capitalize', color: text === 'ACTIVE' ? '#52c41a' : '#f5222d' }}>{text}</span> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Popconfirm title="Delete?" onConfirm={() => message.success('Deleted')}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
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
          {collapsed ? 'Admin' : 'Admin Portal'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab]}
          onSelect={(e) => setActiveTab(e.key)}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'district-managers', icon: <TeamOutlined />, label: 'District Managers' },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard - {user.adminId}</h2>
          <Button onClick={handleLogout} icon={<LogoutOutlined />} danger>
            Logout
          </Button>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ marginBottom: '24px' }}>Dashboard Overview</h2>
              <Row gutter={16} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="District Managers" value={dashboardData.totalDMs} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic title="Supervisors" value={dashboardData.totalSupervisors} />
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
                  <Card title="Organizational Structure" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={[
                        { name: 'DMs', count: dashboardData.totalDMs },
                        { name: 'Supervisors', count: dashboardData.totalSupervisors },
                        { name: 'MPCS Officers', count: dashboardData.totalMpcsOfficers },
                        { name: 'Farmers', count: dashboardData.totalFarmers },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Staff Distribution" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'District Managers', value: dashboardData.totalDMs || 1 },
                            { name: 'Supervisors', value: dashboardData.totalSupervisors || 1 },
                            { name: 'MPCS Officers', value: dashboardData.totalMpcsOfficers || 1 },
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

          {activeTab === 'district-managers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsDMModalVisible(true)}>
                  Add District Manager
                </Button>
              </div>

              <Card title={`District Managers (${districtManagers.length})`}>
                <Table columns={dmColumns} dataSource={districtManagers} rowKey="id" />
              </Card>

              <Modal
                title="Add District Manager"
                open={isDMModalVisible}
                onOk={() => dmForm.submit()}
                onCancel={() => setIsDMModalVisible(false)}
              >
                <Form form={dmForm} onFinish={handleAddDM} layout="vertical">
                  <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                    <Input.Password />
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

export default AdminDashboard;
