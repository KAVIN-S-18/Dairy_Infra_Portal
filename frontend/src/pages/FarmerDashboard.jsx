import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Input, Select
} from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  HistoryOutlined,
  ToolOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [milkLogs, setMilkLogs] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);
  const [summary, setSummary] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!token || user.role !== 'FARMER') {
      navigate('/farmer-login');
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, milkRes, infraRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/farmer/profile`, { headers }),
        axios.get(`${API_URL}/farmer/milk-sales`, { headers }),
        axios.get(`${API_URL}/farmer/infrastructure`, { headers }),
        axios.get(`${API_URL}/farmer/milk-sales/summary`, { headers })
      ]);

      setFarmerProfile(profileRes.data.data);
      setMilkLogs(milkRes.data.data || []);
      setInfrastructure(infraRes.data.data || []);
      setSummary(summaryRes.data.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Session expired or error fetching data. Please login again.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/farmer-login');
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
  const filteredMilkLogs = milkLogs.filter(log =>
    dayjs(log.logDate).format('DD-MM-YYYY').includes(searchQuery) ||
    log.quantityProduced?.toString().includes(searchQuery) ||
    log.totalAmount?.toString().includes(searchQuery)
  );

  const filteredInfra = infrastructure.filter(item =>
    item.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.equipmentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const milkColumns = [
    {
      title: 'DATE',
      dataIndex: 'logDate',
      key: 'logDate',
      render: (text) => <span style={{ fontWeight: 600 }}>{dayjs(text).format('DD MMM YYYY')}</span>
    },
    {
      title: 'SESSION',
      key: 'session',
      render: (_, r) => {
        const sessionName = (r.remarks?.match(/\[Session: (.*?)\]/) || [])[1] || 'MORNING';
        return <Tag color="purple">{sessionName.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'PRODUCED (L)',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      render: (val) => <Tag color="blue">{val} L</Tag>
    },
    {
      title: 'SNF / FAT',
      key: 'snffat',
      render: (_, r) => <span>{(r.snf !== null && r.snf !== undefined) ? r.snf : '-'}% / {(r.fat !== null && r.fat !== undefined) ? r.fat : '-'}%</span>
    },
    {
      title: 'PRICE/L (₹)',
      dataIndex: 'pricePerLiter',
      key: 'pricePerLiter',
      render: (val) => <span>₹{val?.toFixed(2)}</span>
    },
    {
      title: 'EARNINGS (₹)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => <span style={{ fontWeight: 700, color: '#1a5c38' }}>₹{val?.toFixed(2)}</span>
    }
  ];

  const infraColumns = [
    {
      title: 'EQUIPMENT',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'TYPE',
      dataIndex: 'equipmentType',
      key: 'equipmentType',
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: 'CONDITION',
      dataIndex: 'condition',
      key: 'condition',
      render: (text) => (
        <Tag color={text === 'GOOD' ? 'success' : text === 'FAIR' ? 'warning' : 'error'}>
          {text}
        </Tag>
      )
    },
    {
      title: 'NEXT MAINTENANCE',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      render: (text) => dayjs(text).format('DD MMM YYYY')
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Dairy Performance</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Detailed analytics for your farm resource: {farmerProfile?.farmerId}</p>
              </div>
              <Button icon={<BarChartOutlined />} type="default">Export Statement</Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL PRODUCTION" value={summary.totalProduced || 0} precision={1} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} suffix="L" />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL EARNINGS" value={summary.totalEarnings || 0} precision={2} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix="₹" />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="AVG PRICE/L" value={summary.averagePrice || 0} precision={2} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} prefix="₹" />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="CATTLE COUNT" value={farmerProfile?.cattleDetails?.totalCount || 0} valueStyle={{ color: '#1a5c38', fontWeight: 800 }} suffix="Heads" />
                </Card>
              </Col>
            </Row>

            <Card title={<span style={{ fontWeight: 700 }}>Yield Trends</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={milkLogs.slice(-7).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="logDate" tickFormatter={(t) => dayjs(t).format('DD MMM')} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip />
                  <Line type="monotone" dataKey="quantityProduced" stroke="#1a5c38" strokeWidth={3} dot={{ r: 6, fill: '#1a5c38' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        );
      case 'logs':
        return (
          <Card
            title={<span style={{ fontWeight: 700 }}>Milk Procurement History</span>}
            extra={<Search placeholder="Filter by date or amount..." allowClear onSearch={v => setSearchQuery(v)} style={{ width: 300 }} />}
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table columns={milkColumns} dataSource={filteredMilkLogs} rowKey="id" loading={loading} />
          </Card>
        );
      case 'infra':
        return (
          <Card
            title={<span style={{ fontWeight: 700 }}>Dairy Infrastructure Details</span>}
            extra={<Search placeholder="Filter equipment..." allowClear onSearch={v => setSearchQuery(v)} style={{ width: 300 }} />}
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table columns={infraColumns} dataSource={filteredInfra} rowKey="id" loading={loading} />
          </Card>
        );
      case 'profile':
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<span style={{ fontWeight: 700 }}><SafetyCertificateOutlined /> Cattle Management</span>} bordered={false} style={{ borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Total Cattle Registered:</span>
                    <span style={{ fontWeight: 600, color: '#1a5c38' }}>{farmerProfile?.cattleDetails?.totalCount || 0}</span>
                  </div>

                  {Array.isArray(farmerProfile?.cattleDetails?.list) && farmerProfile.cattleDetails.list.length > 0 ? (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}>Individual Tag Records:</p>
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {farmerProfile.cattleDetails.list.map((c, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600 }}>{c.tagNumber}</span> — {c.breed || 'Unknown Breed'}
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Last Vaccinated: {c.lastVaccination ? dayjs(c.lastVaccination).format('DD MMM YYYY') : 'Not Recorded'}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: '#6b7280' }}>Records:</span>
                      <Tag color="warning">No specific tags tracked</Tag>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<span style={{ fontWeight: 700 }}><EnvironmentOutlined /> Farm Land Profile</span>} bordered={false} style={{ borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Total Area:</span>
                    <span style={{ fontWeight: 600 }}>{farmerProfile?.landDetails?.totalArea || 0} Acres</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Irrigation:</span>
                    <span style={{ fontWeight: 600 }}>{farmerProfile?.landDetails?.irrigationType || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <span style={{ color: '#6b7280' }}>Soil Type:</span>
                    <span style={{ fontWeight: 600 }}>{farmerProfile?.landDetails?.soilType || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Location:</span>
                    <span style={{ fontWeight: 600 }}>{farmerProfile?.landDetails?.location || 'Registered Colony'}</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        );
      default:
        return <Empty description="Section under development" />;
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1a5c38', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Sider trigger={null} collapsible collapsed={collapsed} width={260}
          style={{ background: '#0a2e1f', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}>
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed ? (
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Farmer Portal
              </div>
            ) : (
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', width: '100%' }}>F</div>
            )}
          </div>

          <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#fff', fontSize: '18px', background: 'rgba(255,255,255,0.08)' }}
            />
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => {
              if (key === 'logout') handleLogout();
              else setActiveTab(key);
            }}
            style={{ background: 'transparent', borderRight: 0 }}
            items={[
              { key: 'overview', icon: <DashboardOutlined />, label: 'Farm Overview' },
              { key: 'logs', icon: <HistoryOutlined />, label: 'Milk Records' },
              { key: 'infra', icon: <ToolOutlined />, label: 'Infrastructure' },
              { key: 'profile', icon: <UserOutlined />, label: 'My Managed Profile' },
            ]}
          />

          <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
            <Button
              type="link"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: '#f87171', padding: 0, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </Sider>

        <Layout>
          <Header style={{ background: '#fff', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 99 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '4px', height: '20px', background: '#1a5c38', borderRadius: '2px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Dairy Infrastructure Management</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
                <Space size={12} style={{ cursor: 'pointer' }}>
                  <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{farmerProfile?.fullName || 'Farmer'}</div>
                    <div style={{ fontSize: '11px', color: '#1a5c38', fontWeight: 600, textTransform: 'uppercase' }}>{user.farmerId || 'Resource'}</div>
                  </div>
                  <Avatar size={44} style={{ backgroundColor: '#1a5c38' }} icon={<UserOutlined />} />
                </Space>
              </Dropdown>
            </div>
          </Header>

          <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default FarmerDashboard;
