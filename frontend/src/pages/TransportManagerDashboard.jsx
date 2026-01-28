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
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  Badge,
} from 'antd';
import {
  LogoutOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  DashboardOutlined,
  TeamOutlined,
  TruckOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Header, Content, Footer, Sider } = Layout;

const TransportManagerDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dashboard State
  const [dashboardData, setDashboardData] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    totalTrips: 0,
    totalMilkTransported: 0,
    completedTrips: 0,
    activeVehicles: 0,
  });

  // Drivers State
  const [drivers, setDrivers] = useState([]);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [driverForm] = Form.useForm();

  // Vehicles State
  const [vehicles, setVehicles] = useState([]);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [vehicleForm] = Form.useForm();

  // Trips State
  const [trips, setTrips] = useState([]);
  const [isTripModalVisible, setIsTripModalVisible] = useState(false);
  const [tripForm] = Form.useForm();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'TRANSPORT_MANAGER') {
      navigate('/login');
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await fetchStaff();
      await fetchVehicles();
      await fetchTrips();
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ============ DRIVERS ============
  const fetchStaff = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/transport-managers/${user.tmId}/drivers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDrivers(response.data);
      setDashboardData(prev => ({ ...prev, totalDrivers: response.data.length }));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleAddDriver = async (values) => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/hierarchy/drivers',
        {
          tmId: user.tmId,
          ...values,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Driver added successfully');
      driverForm.resetFields();
      setIsDriverModalVisible(false);
      fetchStaff();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to add driver');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/hierarchy/transport-staff/driver/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Driver deleted successfully');
      fetchStaff();
    } catch (error) {
      message.error('Failed to delete driver');
    }
  };

  const driverColumns = [
    { title: 'Driver ID', dataIndex: 'driverId', key: 'driverId' },
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'License #', dataIndex: 'drivingLicenseNumber', key: 'drivingLicenseNumber' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = { ACTIVE: 'green', INACTIVE: 'red', ON_LEAVE: 'orange', TERMINATED: 'red' };
        return <Badge status={status === 'ACTIVE' ? 'success' : 'error'} text={status} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm title="Delete driver?" onConfirm={() => handleDeleteDriver(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // ============ VEHICLES ============
  const fetchVehicles = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/transport-managers/${user.tmId}/vehicles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVehicles(response.data);
      setDashboardData(prev => ({ ...prev, totalVehicles: response.data.length, activeVehicles: response.data.filter(v => v.status === 'ACTIVE').length }));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleAddVehicle = async (values) => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/hierarchy/motor-vehicles',
        {
          tmId: user.tmId,
          ...values,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Vehicle added successfully');
      vehicleForm.resetFields();
      setIsVehicleModalVisible(false);
      fetchVehicles();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/hierarchy/transport-staff/vehicle/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      message.error('Failed to delete vehicle');
    }
  };

  const vehicleColumns = [
    { title: 'Vehicle ID', dataIndex: 'vehicleId', key: 'vehicleId' },
    { title: 'Reg. No', dataIndex: 'registrationNumber', key: 'registrationNumber' },
    { title: 'Type', dataIndex: 'vehicleType', key: 'vehicleType' },
    { title: 'Brand', dataIndex: 'manufactureBrand', key: 'manufactureBrand' },
    { title: 'Capacity (L)', dataIndex: 'capacity', key: 'capacity' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const colors = { ACTIVE: 'green', MAINTENANCE: 'orange', INACTIVE: 'red', DECOMMISSIONED: 'gray' };
        return <Badge status={status === 'ACTIVE' ? 'success' : 'error'} text={status} />;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm title="Delete vehicle?" onConfirm={() => handleDeleteVehicle(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // ============ TRIPS ============
  const fetchTrips = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/hierarchy/transport-managers/${user.tmId}/trips`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrips(response.data);
      const completedCount = response.data.filter(t => t.tripStatus === 'COMPLETED').length;
      const totalMilk = response.data.reduce((sum, t) => sum + (t.milkQuantity || 0), 0);
      setDashboardData(prev => ({ 
        ...prev, 
        totalTrips: response.data.length,
        completedTrips: completedCount,
        totalMilkTransported: totalMilk
      }));
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const handleAddTrip = async (values) => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/hierarchy/trips',
        {
          ...values,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Trip created successfully');
      tripForm.resetFields();
      setIsTripModalVisible(false);
      fetchTrips();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const tripColumns = [
    { title: 'Trip ID', dataIndex: 'tripId', key: 'tripId' },
    { title: 'Vehicle', dataIndex: 'vehicleNumber', key: 'vehicleNumber' },
    { title: 'Driver', dataIndex: 'driverName', key: 'driverName' },
    { title: 'Source', dataIndex: 'source', key: 'source' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination' },
    { title: 'Milk (L)', dataIndex: 'milkQuantity', key: 'milkQuantity' },
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

  // ============ CHARTS ============
  const tripTrendData = trips.reduce((acc, trip) => {
    const date = dayjs(trip.tripDate).format('DD/MM');
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.quantity += trip.milkQuantity;
      existing.trips += 1;
    } else {
      acc.push({ date, quantity: trip.milkQuantity, trips: 1 });
    }
    return acc;
  }, []).slice(-10);

  const statusDistribution = [
    { name: 'Completed', value: trips.filter(t => t.tripStatus === 'COMPLETED').length },
    { name: 'In Progress', value: trips.filter(t => t.tripStatus === 'IN_PROGRESS').length },
    { name: 'Scheduled', value: trips.filter(t => t.tripStatus === 'SCHEDULED').length },
    { name: 'Cancelled', value: trips.filter(t => t.tripStatus === 'CANCELLED').length },
  ];

  const COLORS = ['#52c41a', '#faad14', '#1890ff', '#ff4d4f'];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> Dashboard</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Total Drivers" value={dashboardData.totalDrivers} suffix="👥" />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Total Vehicles" value={dashboardData.totalVehicles} suffix="🚚" />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Active Vehicles" value={dashboardData.activeVehicles} suffix="✅" />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Total Trips" value={dashboardData.totalTrips} suffix="📍" />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Completed Trips" value={dashboardData.completedTrips} suffix="✔️" />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic title="Milk Transported" value={dashboardData.totalMilkTransported.toFixed(2)} suffix="L" />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Trip Trends (Last 10 Days)" bordered={false}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tripTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="Milk (L)" />
                    <Line type="monotone" dataKey="trips" stroke="#82ca9d" name="Trips" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Trip Status Distribution" bordered={false}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} label={{ position: 'insideBottomRight', offset: -5 }} outerRadius={80} fill="#8884d8" dataKey="value">
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'drivers',
      label: <span><TeamOutlined /> Driver Management</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsDriverModalVisible(true)} style={{ marginBottom: '20px' }}>
            Add Driver
          </Button>
          <Table columns={driverColumns} dataSource={drivers} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
    {
      key: 'vehicles',
      label: <span><TruckOutlined /> Vehicle Management</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsVehicleModalVisible(true)} style={{ marginBottom: '20px' }}>
            Add Vehicle
          </Button>
          <Table columns={vehicleColumns} dataSource={vehicles} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
    {
      key: 'trips',
      label: <span><FileTextOutlined /> Trip Tracking</span>,
      children: (
        <div style={{ padding: '20px' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsTripModalVisible(true)} style={{ marginBottom: '20px' }}>
            Create Trip
          </Button>
          <Table columns={tripColumns} dataSource={trips} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <h2 style={{ color: 'white', margin: 0 }}>🚚 Transport Manager Dashboard</h2>
        <Button type="text" style={{ color: 'white' }} icon={<LogoutOutlined />} onClick={handleLogout}>
          Logout
        </Button>
      </Header>
      <Layout>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ background: '#fff' }}>
          <div style={{ padding: '20px', fontSize: '14px' }}>
            <p><strong>TM ID:</strong> {user.tmId}</p>
            <p><strong>Name:</strong> {user.fullName}</p>
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

      {/* Driver Modal */}
      <Modal title="Add Driver" open={isDriverModalVisible} onCancel={() => setIsDriverModalVisible(false)} footer={null}>
        <Form form={driverForm} onFinish={handleAddDriver} layout="vertical">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone Number">
            <Input />
          </Form.Item>
          <Form.Item name="drivingLicenseNumber" label="Driving License #" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="licenseExpiry" label="License Expiry" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="licenseClass" label="License Class" rules={[{ required: true }]}>
            <Select options={[{ value: 'LMV', label: 'LMV' }, { value: 'HMV', label: 'HMV' }, { value: 'HPMV', label: 'HPMV' }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Add Driver
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Vehicle Modal */}
      <Modal title="Add Vehicle" open={isVehicleModalVisible} onCancel={() => setIsVehicleModalVisible(false)} footer={null}>
        <Form form={vehicleForm} onFinish={handleAddVehicle} layout="vertical">
          <Form.Item name="registrationNumber" label="Registration Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="chasisNumber" label="Chasis Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="engineNumber" label="Engine Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="vehicleType" label="Vehicle Type" rules={[{ required: true }]}>
            <Select options={[{ value: 'TRUCK', label: 'Truck' }, { value: 'TANKER', label: 'Tanker' }, { value: 'REFRIGERATED', label: 'Refrigerated' }]} />
          </Form.Item>
          <Form.Item name="manufactureBrand" label="Brand" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <InputNumber min={1990} max={new Date().getFullYear()} />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity (Liters)" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="registrationExpiry" label="Registration Expiry" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Add Vehicle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Trip Modal */}
      <Modal title="Create Trip" open={isTripModalVisible} onCancel={() => setIsTripModalVisible(false)} footer={null}>
        <Form form={tripForm} onFinish={handleAddTrip} layout="vertical">
          <Form.Item name="vehicleId" label="Select Vehicle" rules={[{ required: true }]}>
            <Select placeholder="Select vehicle" options={vehicles.map(v => ({ value: v.vehicleId, label: `${v.registrationNumber} (${v.capacity}L)` }))} />
          </Form.Item>
          <Form.Item name="driverId" label="Select Driver" rules={[{ required: true }]}>
            <Select placeholder="Select driver" options={drivers.map(d => ({ value: d.driverId, label: d.fullName }))} />
          </Form.Item>
          <Form.Item name="source" label="Source Location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="destination" label="Destination Location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tripDate" label="Trip Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="milkQuantity" label="Milk Quantity (Liters)" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="estimatedDistance" label="Estimated Distance (km)">
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Create Trip
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default TransportManagerDashboard;
