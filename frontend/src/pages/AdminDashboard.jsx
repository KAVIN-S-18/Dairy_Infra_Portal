import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Input, Popconfirm, Select
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  ToolOutlined,
  CarOutlined,
  BarChartOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalDMs: 0,
    totalSupervisors: 0,
    totalMpcsOfficers: 0,
    totalFarmers: 0,
  });
  const [allUsers, setAllUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [machines, setMachines] = useState([]);
  const [transports, setTransports] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!token || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    fetchAllUsers();
    // Mock data for monitoring tabs
    setBatches([
      { id: 1, batchId: 'BATCH-A1-001', date: '2026-02-01', quantity: 1200, status: 'completed' },
      { id: 2, batchId: 'BATCH-A2-001', date: '2026-02-05', quantity: 900, status: 'in-progress' },
    ]);
    setMachines([
      { id: 1, machineId: 'M001', location: 'DM1 Facility', status: 'operational', lastChecked: '2026-02-10' },
      { id: 2, machineId: 'M002', location: 'DM2 Facility', status: 'maintenance', lastChecked: '2026-02-08' },
    ]);
    setTransports([
      { id: 1, vehicle: 'Truck A1', route: 'Farm→Coop', status: 'en route', eta: '2026-02-15 17:00' },
      { id: 2, vehicle: 'Truck A2', route: 'Coop→DM', status: 'delivered', eta: '2026-02-14 12:00' },
    ]);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/hierarchy/admins/${user.adminId}/district-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDashboardData({
        totalDMs: response.data.length,
        totalSupervisors: response.data.length * 2,
        totalMpcsOfficers: response.data.length * 2,
        totalFarmers: response.data.length * 2 * 3,
      });
    } catch (error) {
      message.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      // Fetching DMs as a start, in a real app this would be a unified 'organization users' endpoint
      const response = await axios.get(
        `${API_URL}/hierarchy/admins/${user.adminId}/district-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Map them with explicit Role for UI
      const formattedUsers = response.data.map(u => ({
        ...u,
        role: u.role || 'DISTRICT_MANAGER',
        key: u.id
      }));

      setAllUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values) => {
    try {
      // For now, only DMs can be added directly via this admin-level API
      // Extension to other roles would happen here
      await axios.post(
        `${API_URL}/hierarchy/district-managers`,
        { adminId: user.adminId, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('User established successfully');
      userForm.resetFields();
      setIsUserModalVisible(false);
      fetchAllUsers();
      fetchDashboardData();
    } catch (error) {
      message.error(error.response?.data?.error || 'Error creating user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userProfileMenu = {
    items: [
      { key: 'profile', label: 'View Profile', icon: <UserOutlined />, onClick: () => setActiveTab('profile') },
      { key: 'settings', label: 'Account Settings', icon: <SettingOutlined />, onClick: () => setActiveTab('settings') },
      { type: 'divider' },
      { key: 'logout', label: 'Logout', danger: true, icon: <LogoutOutlined />, onClick: handleLogout },
    ]
  };

  // Filtered data logic
  const filteredUsers = allUsers.filter(u => {
    const matchQuery = (u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.dmId?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const filteredBatches = batches.filter(b =>
    b.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMachines = machines.filter(m =>
    m.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransports = transports.filter(t =>
    t.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userColumns = [
    { title: 'USER ID', dataIndex: 'dmId', key: 'dmId', render: (text) => <span style={{ fontWeight: 600 }}>{text || 'ID-TBD'}</span> },
    { title: 'FULL NAME', dataIndex: 'fullName', key: 'fullName', render: (text) => <span style={{ fontWeight: 500, color: '#111827' }}>{text}</span> },
    { title: 'EMAIL', dataIndex: 'email', key: 'email' },
    {
      title: 'ROLE',
      dataIndex: 'role',
      key: 'role',
      render: (text) => <Tag color="blue">{text.replace('_', ' ')}</Tag>
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={text === 'ACTIVE' ? 'success' : 'error'} style={{ borderRadius: '4px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#1a5c38' }} />
          <Popconfirm title="Delete this user?" onConfirm={() => message.info('CRUD Logic triggered')}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Organization Health</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Monitoring infrastructure and staff performance for {user.organizationName}.</p>
              </div>
              <Button icon={<BarChartOutlined />} type="default">Generate Report</Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="DISTRICT MANAGERS" value={dashboardData.totalDMs} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix={<TeamOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="SUPERVISORS" value={dashboardData.totalSupervisors} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix={<SafetyCertificateOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="MPCS OFFICERS" value={dashboardData.totalMpcsOfficers} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix={<HomeOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL FARMERS" value={dashboardData.totalFarmers} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix={<UserOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title={<span style={{ fontWeight: 700 }}>Staff Distribution</span>} bordered={false} style={{ borderRadius: '16px', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={[
                      { name: 'DMs', count: dashboardData.totalDMs },
                      { name: 'Sups', count: dashboardData.totalSupervisors },
                      { name: 'MPCS', count: dashboardData.totalMpcsOfficers },
                      { name: 'Farmers', count: dashboardData.totalFarmers },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="count" fill="#1a5c38" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title={<span style={{ fontWeight: 700 }}>Infrastructure Status</span>} bordered={false} style={{ borderRadius: '16px', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Operational', value: 80 },
                          { name: 'Maintenance', value: 15 },
                          { name: 'Offline', value: 5 },
                        ]}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#1a5c38" />
                        <Cell fill="#eab308" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </>
        );
      case 'district-managers':
        return (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ fontWeight: 800, fontSize: '18px', whiteSpace: 'nowrap' }}>Comprehensive User Management</span>
              </div>
            }
            extra={
              <Space wrap>
                <Search
                  placeholder="Search users..."
                  allowClear
                  onSearch={value => setSearchQuery(value)}
                  style={{ width: 220 }}
                />
                <Select defaultValue="ALL" style={{ width: 120 }} onChange={value => setFilterStatus(value)}>
                  <Option value="ALL">All Status</Option>
                  <Option value="ACTIVE">Active</Option>
                  <Option value="INACTIVE">Inactive</Option>
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsUserModalVisible(true)}>Add New User</Button>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table columns={userColumns} dataSource={filteredUsers} rowKey="id" loading={loading} />
          </Card>
        );
      case 'batches':
        return (
          <Card
            title={<span style={{ fontWeight: 800 }}>Milk Batch Circulation</span>}
            extra={<Search placeholder="Filter batches..." allowClear onSearch={v => setSearchQuery(v)} style={{ width: 250 }} />}
            bordered={false}
            style={{ borderRadius: '16px' }}
          >
            <Table
              columns={[
                { title: 'BATCH ID', dataIndex: 'batchId', key: 'batchId', render: (t) => <Tag color="blue">{t}</Tag> },
                { title: 'COLLECTION DATE', dataIndex: 'date', key: 'date' },
                { title: 'NET QUANTITY (L)', dataIndex: 'quantity', key: 'quantity', render: (v) => <span style={{ fontWeight: 700 }}>{v} L</span> },
                { title: 'LOGISTICS STATUS', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'completed' ? 'success' : 'processing'}>{s.toUpperCase()}</Tag> },
              ]}
              dataSource={filteredBatches}
              rowKey="id"
            />
          </Card>
        );
      case 'machines':
        return (
          <Card
            title={<span style={{ fontWeight: 800 }}>Infrastructure Tracking</span>}
            extra={<Search placeholder="Search asset ID..." allowClear onSearch={v => setSearchQuery(v)} style={{ width: 250 }} />}
            bordered={false}
            style={{ borderRadius: '16px' }}
          >
            <Table
              columns={[
                { title: 'EQUIPMENT ID', dataIndex: 'machineId', key: 'machineId' },
                { title: 'ASSIGNED LOCATION', dataIndex: 'location', key: 'location' },
                { title: 'OPERATIONAL STATUS', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'operational' ? 'green' : 'warning'}>{s.toUpperCase()}</Tag> },
                { title: 'LAST HEALTH CHECK', dataIndex: 'lastChecked', key: 'lastChecked' },
              ]}
              dataSource={filteredMachines}
              rowKey="id"
            />
          </Card>
        );
      case 'transport':
        return (
          <Card
            title={<span style={{ fontWeight: 800 }}>Fleet & Transport Logistics</span>}
            extra={<Search placeholder="Search vehicle..." allowClear onSearch={v => setSearchQuery(v)} style={{ width: 250 }} />}
            bordered={false}
            style={{ borderRadius: '16px' }}
          >
            <Table
              columns={[
                { title: 'VEHICLE ID', dataIndex: 'vehicle', key: 'vehicle', render: (t) => <span style={{ fontWeight: 600 }}><CarOutlined /> {t}</span> },
                { title: 'ASSIGNED ROUTE', dataIndex: 'route', key: 'route' },
                { title: 'CURRENT STATUS', dataIndex: 'status', key: 'status', render: (s) => <Tag color="blue">{s.toUpperCase()}</Tag> },
                { title: 'ESTIMATED ARRIVAL', dataIndex: 'eta', key: 'eta' },
              ]}
              dataSource={filteredTransports}
              rowKey="id"
            />
          </Card>
        );
      case 'profile':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#1a5c38', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center', position: 'relative' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px', marginBottom: '4px' }}>{user.fullName || 'Admin User'}</h1>
                <Tag color="green">{user.organizationName || 'Cooperative Admin'}</Tag>
              </div>
              <Divider />
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>ADMIN ID</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{user.adminId}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>ACCESS EMAIL</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{user.email}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>ORGANIZATION TYPE</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{user.organizationType || 'COOPERATIVE'}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>SYSTEM ROLE</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a5c38' }}>ORGANIZATION_ADMIN</div>
                </Col>
              </Row>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <Card bordered={false} style={{ borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}><SettingOutlined /> Management Preferences</h2>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Alert Thresholds</h4>
                  <p style={{ color: '#6b7280', margin: 0 }}>Define minimum milk quality and quantity alert levels</p>
                </div>
                <Button type="default">Adjust</Button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Staff Access Control</h4>
                  <p style={{ color: '#6b7280', margin: 0 }}>Manage permissions for District Managers and Supervisors</p>
                </div>
                <Button type="default">Manage Roles</Button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Activity Logs</h4>
                  <p style={{ color: '#6b7280', margin: 0 }}>Review all system changes made by your management team</p>
                </div>
                <Button icon={<HistoryOutlined />}>View Audit Trail</Button>
              </div>
            </div>
          </Card>
        );
      default:
        return <Empty />;
    }
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1a5c38', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          style={{
            background: '#0a2e1f',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 100
          }}
        >
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed ? (
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Admin Portal
              </div>
            ) : (
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', width: '100%' }}>A</div>
            )}
          </div>

          <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: '18px' }}
            />
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => {
              setActiveTab(key);
              setSearchQuery(''); // Reset search on tab change
            }}
            style={{ background: 'transparent', borderRight: 0 }}
            items={[
              { key: 'dashboard', icon: <DashboardOutlined />, label: 'Organization Overview' },
              { key: 'district-managers', icon: <TeamOutlined />, label: 'User Management' },
              { key: 'batches', icon: <ToolOutlined />, label: 'Batch Logistics' },
              { key: 'machines', icon: <SettingOutlined />, label: 'Asset Management' },
              { key: 'transport', icon: <CarOutlined />, label: 'Fleet Monitoring' },
            ]}
          />

          <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                color: '#f87171',
                padding: 0,
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {!collapsed && <span>Logout Account</span>}
            </Button>
          </div>
        </Sider>

        <Layout>
          <Header style={{
            background: '#fff',
            padding: '0 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '72px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            position: 'sticky',
            top: 0,
            zIndex: 99
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1a5c38', borderRadius: '2px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{user.organizationName} Admin Panel</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
                <Space size={12} style={{ cursor: 'pointer' }}>
                  {!collapsed && (
                    <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{user.fullName}</div>
                      <div style={{ fontSize: '11px', color: '#1a5c38', fontWeight: 600, textTransform: 'uppercase' }}>{user.adminId}</div>
                    </div>
                  )}
                  <Avatar size={44} style={{ backgroundColor: '#1a5c38' }} icon={<UserOutlined />} />
                </Space>
              </Dropdown>
            </div>
          </Header>

          <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {renderContent()}
          </Content>
        </Layout>

        {/* MODALS */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Establish New User Resource</span>}
          open={isUserModalVisible}
          onOk={() => userForm.submit()}
          onCancel={() => setIsUserModalVisible(false)}
          okText="Create Resource"
          okButtonProps={{ style: { background: '#1a5c38', borderColor: '#1a5c38' } }}
        >
          <Form form={userForm} onFinish={handleAddUser} layout="vertical">
            <Form.Item name="fullName" label="Full Legal Name" rules={[{ required: true }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="email" label="Professional Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="john@organization.com" />
            </Form.Item>
            <Form.Item name="role" label="System Role" rules={[{ required: true }]} initialValue="DISTRICT_MANAGER">
              <Select>
                <Option value="DISTRICT_MANAGER">District Manager</Option>
                <Option value="SUPERVISOR">Supervisor</Option>
                <Option value="OPERATOR">Operator</Option>
                <Option value="MPCS_OFFICER">MPCS Officer</Option>
              </Select>
            </Form.Item>
            <Form.Item name="password" label="Portal Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password placeholder="Min 6 characters" />
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

// Internal icon fix
const HomeOutlined = () => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024" style={{ fontSize: '16px' }}>
    <path d="M946.5 505L534.6 93.4c-12.5-12.5-32.8-12.5-45.3 0L77.5 505c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l38.2-38.2V912c0 17.7 14.3 32 32 32h662c17.7 0 32-14.3 32-32V512.1l38.2 38.2c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3z" />
  </svg>
);

export default AdminDashboard;
