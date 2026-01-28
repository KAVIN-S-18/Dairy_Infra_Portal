import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  message,
  Statistic,
  Row,
  Col,
  Tabs,
  Badge,
  Descriptions,
  Empty,
} from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  CarOutlined,
  MoneyCollectOutlined,
  StarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Content, Sider } = Layout;

const DriverDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dashboard State
  const [dashboardData, setDashboardData] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    averageRating: 5,
    totalMilkTransported: 0,
    totalDistance: 0,
  });

  // Trips State
  const [trips, setTrips] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'DRIVER') {
      navigate('/login');
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchTrips();
      await fetchDriverDetails();
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverDetails = async () => {
    try {
      // Fetch driver profile and vehicle assignment
      // This would typically come from a driver-specific API endpoint
      setDashboardData({
        totalTrips: trips.length,
        completedTrips: trips.filter(t => t.tripStatus === 'COMPLETED').length,
        totalEarnings: trips.reduce((sum, t) => sum + (t.driverPayment || 0), 0),
        averageRating: user.rating || 5,
        totalMilkTransported: trips.reduce((sum, t) => sum + (t.milkQuantity || 0), 0),
        totalDistance: trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      // In a real app, this would fetch trips assigned to this specific driver
      // For now, we'll fetch all trips and filter
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/transport-managers/${user.tmId}/trips`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Filter trips for this driver
      const driverTrips = response.data.filter(trip => trip.driverId === user.id);
      setTrips(driverTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const tripColumns = [
    { title: 'Trip ID', dataIndex: 'tripId', key: 'tripId' },
    { title: 'Vehicle', dataIndex: 'vehicleNumber', key: 'vehicleNumber' },
    { title: 'Source', dataIndex: 'source', key: 'source' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination' },
    { title: 'Milk (L)', dataIndex: 'milkQuantity', key: 'milkQuantity' },
    { title: 'Distance (km)', dataIndex: 'actualDistance', key: 'actualDistance' },
    { title: 'Earnings', dataIndex: 'driverPayment', key: 'driverPayment', render: (val) => `₹${val || 0}` },
    { title: 'Date', dataIndex: 'tripDate', key: 'tripDate', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { 
      title: 'Status', 
      dataIndex: 'tripStatus', 
      key: 'tripStatus',
      render: (status) => {
        const statusColors = {
          SCHEDULED: 'blue',
          IN_PROGRESS: 'orange',
          COMPLETED: 'green',
          CANCELLED: 'red',
          DELAYED: 'orange'
        };
        return <Badge status={status === 'COMPLETED' ? 'success' : 'processing'} text={status} />;
      }
    },
  ];

  // Charts Data
  const tripProgressData = trips.reduce((acc, trip) => {
    const date = dayjs(trip.tripDate).format('DD/MM');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.earnings += trip.driverPayment || 0;
      existing.trips += 1;
    } else {
      acc.push({ date, earnings: trip.driverPayment || 0, trips: 1 });
    }
    return acc;
  }, []).slice(-10);

  const monthlyData = [
    { month: 'Jan', earnings: 5000, trips: 12 },
    { month: 'Feb', earnings: 6500, trips: 15 },
    { month: 'Mar', earnings: 7200, trips: 18 },
    { month: 'Apr', earnings: 8000, trips: 20 },
    { month: 'May', earnings: 8500, trips: 22 },
  ];

  const tabItems = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> Dashboard</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Total Trips" 
                  value={dashboardData.totalTrips} 
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Completed" 
                  value={dashboardData.completedTrips} 
                  prefix={<CarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Total Earnings" 
                  value={dashboardData.totalEarnings} 
                  prefix="₹"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Rating" 
                  value={dashboardData.averageRating} 
                  suffix="/5"
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#ff7a45' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Milk Transported" 
                  value={dashboardData.totalMilkTransported.toFixed(0)} 
                  suffix="L"
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic 
                  title="Total Distance" 
                  value={dashboardData.totalDistance.toFixed(0)} 
                  suffix="km"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Earnings Trend (Last 10 Trips)" bordered={false}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tripProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="#faad14" name="Earnings" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Monthly Performance" bordered={false}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="earnings" fill="#faad14" name="Earnings (₹)" />
                    <Bar dataKey="trips" fill="#1890ff" name="Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'profile',
      label: <span><UserOutlined /> Profile</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Card title="Driver Profile" bordered={false}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Driver ID">{user.driverId}</Descriptions.Item>
              <Descriptions.Item label="Name">{user.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{user.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="License #">{user.drivingLicenseNumber}</Descriptions.Item>
              <Descriptions.Item label="License Expiry">{dayjs(user.licenseExpiry).format('DD/MM/YYYY')}</Descriptions.Item>
              <Descriptions.Item label="License Class">{user.licenseClass}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status={user.status === 'ACTIVE' ? 'success' : 'error'} text={user.status} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'trips',
      label: <span><FileTextOutlined /> My Trips</span>,
      children: (
        <div style={{ padding: '20px' }}>
          {trips.length === 0 ? (
            <Empty description="No trips assigned yet" />
          ) : (
            <Table 
              columns={tripColumns} 
              dataSource={trips} 
              rowKey="id" 
              loading={loading} 
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#ff7a45', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🚗 Driver Dashboard</h2>
        <Button type="text" style={{ color: 'white' }} icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ background: '#fff' }}>
          <div style={{ padding: '20px', fontSize: '14px' }}>
            <p><strong>Driver ID:</strong> {user.driverId}</p>
            <p><strong>Name:</strong> {user.fullName}</p>
            <p><strong>Status:</strong> {user.status}</p>
          </div>
        </Sider>
        <Layout>
          <Content style={{ margin: '24px' }}>
            <Card>
              <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
            </Card>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DriverDashboard;
