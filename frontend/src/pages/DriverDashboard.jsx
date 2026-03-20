import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Table, Button, Space, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, InputNumber, Badge
} from 'antd';
import {
  LogoutOutlined, DashboardOutlined, UserOutlined, CarOutlined,
  CheckCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  EnvironmentOutlined, RocketOutlined, HistoryOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('trips');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!token || user.role !== 'DRIVER') {
      navigate('/login');
      return;
    }
    fetchTrips();
    const interval = setInterval(fetchTrips, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/driver/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTrips(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trips', error);
    }
  };

  const handlePickup = async (tripId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/driver/pickup`, { tripId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success('Milk Picked Up! Status updated to Enroute to District.');
        fetchTrips();
      }
    } catch (error) {
      message.error('Failed to update pickup status');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/driver/complete`, {
        tripId: selectedTrip.tripId,
        ...values
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success('Trip completed! Status updated to Reached District.');
        setIsCompleteModalVisible(false);
        form.resetFields();
        fetchTrips();
      }
    } catch (error) {
      message.error('Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const userProfileMenu = {
    items: [
      { key: 'profile', label: 'View Profile', icon: <UserOutlined />, onClick: () => setActiveTab('profile') },
      { type: 'divider' },
      { key: 'logout', label: 'Logout', danger: true, icon: <LogoutOutlined />, onClick: handleLogout },
    ]
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'trips':
        const activeTrips = trips.filter(t => t.tripStatus !== 'COMPLETED');
        const completedTrips = trips.filter(t => t.tripStatus === 'COMPLETED');

        return (
          <>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Transport Assignments</h1>
              <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Managing your logistics and delivery schedules.</p>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Active Trips" value={activeTrips.length} prefix={<RocketOutlined style={{ color: '#312e81' }} />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Completed" value={completedTrips.length} prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Total Milk" value={trips.reduce((acc, t) => acc + t.milkQuantity, 0)} suffix="L" />
                </Card>
              </Col>
            </Row>

            <Card
              title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Direct Assignments (Current)</span>}
              bordered={false}
              style={{ borderRadius: '16px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            >
              <Table
                columns={[
                  { title: 'TRIP ID', dataIndex: 'tripId', key: 'tripId' },
                  { title: 'VEHICLE', dataIndex: 'vehicleNumber', key: 'vehicleNumber' },
                  { title: 'QTY (L)', dataIndex: 'milkQuantity', key: 'milkQuantity', render: q => <b>{q} L</b> },
                  { title: 'FROM', dataIndex: 'source', key: 'source' },
                  { title: 'STATUS', dataIndex: 'tripStatus', key: 'tripStatus', render: s => (
                    <Tag color={s === 'IN_PROGRESS' ? 'processing' : 'warning'}>{s.replace(/_/g, ' ')}</Tag>
                  )},
                  {
                    title: 'ACTION',
                    key: 'action',
                    render: (_, record) => (
                      <Space>
                        {record.tripStatus === 'SCHEDULED' && (
                          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handlePickup(record.tripId)}>
                            Confirm Pickup
                          </Button>
                        )}
                        {record.tripStatus === 'IN_PROGRESS' && (
                          <Button type="primary" style={{ background: '#10b981', borderColor: '#10b981' }} icon={<EnvironmentOutlined />} onClick={() => { setSelectedTrip(record); setIsCompleteModalVisible(true); }}>
                            Mark reached District
                          </Button>
                        )}
                      </Space>
                    )
                  }
                ]}
                dataSource={activeTrips}
                rowKey="id"
                pagination={false}
              />
            </Card>

            <Card
              title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Trip History</span>}
              bordered={false}
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            >
              <Table
                columns={[
                  { title: 'TRIP ID', dataIndex: 'tripId', key: 'tripId' },
                  { title: 'DATE', dataIndex: 'tripDate', key: 'tripDate', render: d => dayjs(d).format('DD MMM YYYY') },
                  { title: 'DISTANCE', dataIndex: 'actualDistance', key: 'actualDistance', render: d => d ? `${d} km` : '-' },
                  { title: 'STATUS', dataIndex: 'tripStatus', key: 'tripStatus', render: () => <Tag color="green">COMPLETED</Tag> },
                ]}
                dataSource={completedTrips}
                rowKey="id"
              />
            </Card>
          </>
        );
      case 'profile':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#312e81', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px' }}>{user.fullName}</h1>
                <Tag color="blue">PROFESSIONAL LOGISTICS DRIVER</Tag>
              </div>
              <Divider />
              <Row gutter={24} style={{ padding: '0 24px 24px' }}>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Driver ID</div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{user.driverId || 'DR-8821'}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.email}</div>
                </Col>
              </Row>
            </Card>
          </div>
        );
      default:
        return <Empty />;
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#312e81', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          style={{ background: '#0f172a', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}
        >
          <div style={{ padding: '24px', color: '#fff', fontSize: '20px', fontWeight: 900 }}>
            {collapsed ? 'D' : 'Driver Portal'}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            style={{ background: 'transparent' }}
            items={[
              { key: 'trips', icon: <CarOutlined />, label: 'Lorry Trips' },
              { key: 'history', icon: <HistoryOutlined />, label: 'Trip History', disabled: true },
              { key: 'profile', icon: <UserOutlined />, label: 'My Account' },
            ]}
          />

          <div style={{ position: 'absolute', bottom: 32, left: 24 }}>
            <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#f87171', padding: 0 }}>Logout</Button>
          </div>
        </Sider>

        <Layout>
          <Header style={{ background: '#fff', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px', borderBottom: '1px solid #e2e8f0' }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            <Dropdown menu={userProfileMenu}>
              <Space style={{ cursor: 'pointer' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>DRIVER</div>
                </div>
                <Avatar icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </Header>

          <Content style={{ padding: '40px' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="Complete Trip Entry"
        open={isCompleteModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsCompleteModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleComplete}>
          <Form.Item name="actualDistance" label="Total Distance (km)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fuelConsumed" label="Fuel Consumed (Liters)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="temperature" label="Milk Temperature (°C)">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default DriverDashboard;
