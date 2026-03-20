import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Table, Button, Space, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Select, Badge, Input, InputNumber, Popconfirm
} from 'antd';
import {
  LogoutOutlined, DashboardOutlined, UserOutlined, TruckOutlined,
  CheckCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  TeamOutlined, CarOutlined, PlusOutlined, HistoryOutlined, DeleteOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const TransportManagerDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dispatch');
  const [loading, setLoading] = useState(false);
  
  const [pendingDispatches, setPendingDispatches] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  
  const [selectedProcurement, setSelectedProcurement] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [driverForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (!token || user.role !== 'TRANSPORT_MANAGER') {
      navigate('/login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [isDeliveryModalVisible, setIsDeliveryModalVisible] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const fetchData = async () => {
    try {
      const endpoints = [
        axios.get(`${API_URL}/tm/pending-dispatches`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/tm/pending-deliveries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/tm/resources`, { headers: { Authorization: `Bearer ${token}` } })
      ];

      const results = await Promise.allSettled(endpoints);

      if (results[0].status === 'fulfilled' && results[0].value.data.success) {
        setPendingDispatches(results[0].value.data.data);
      } else {
        console.error('Failed to fetch pending dispatches', results[0].reason);
      }
      
      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        setPendingDeliveries(results[1].value.data.data);
      } else {
        console.error('Failed to fetch pending deliveries', results[1].reason);
      }
      
      if (results[2].status === 'fulfilled' && results[2].value.data.success) {
        setDrivers(results[2].value.data.data.drivers || []);
        setVehicles(results[2].value.data.data.vehicles || []);
        console.log('TM Resources Fetched:', results[2].value.data.data);
      } else {
        console.error('Failed to fetch resources', results[2].reason);
      }
    } catch (error) {
      console.error('Failed to execute fetch sequence', error);
    }
  };

  const handleAssignTransport = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/tm/assign-transport`, {
        dispatchIds: selectedRowKeys.length > 0 ? selectedRowKeys : [selectedProcurement.id],
        ...values
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        message.success('Transport assigned successfully! Multiple batches linked to single trip.');
        setIsAssignModalVisible(false);
        setSelectedRowKeys([]);
        form.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign transport');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (values) => {
    try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/tm/assign-delivery`, {
            deliveryRequestId: selectedDelivery.id,
            ...values
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
            message.success('Delivery assigned successfully!');
            setIsDeliveryModalVisible(false);
            fetchData();
        }
    } catch (error) {
        message.error('Failed to assign delivery');
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const handleAddDriver = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/tm/drivers`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success('New driver account provisioned!');
        setIsDriverModalVisible(false);
        driverForm.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/tm/motor-vehicles`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success('Vehicle added to fleet!');
        setIsVehicleModalVisible(false);
        vehicleForm.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (type, id) => {
    try {
      const endpoint = type === 'driver' ? `/tm/drivers/${id}` : `/tm/motor-vehicles/${id}`;
      const response = await axios.delete(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        message.success(`${type} removed from records`);
        fetchData();
      }
    } catch (error) {
      message.error(`Failed to delete ${type}`);
    }
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
      case 'dispatch':
        return (
          <>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>Logistics Control</h1>
              <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Assigning drivers and vehicles for pending milk pickups.</p>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
              <Col span={6}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Unassigned Pickups" value={pendingDispatches.length} prefix={<TruckOutlined style={{ color: '#6366f1' }} />} />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Available Drivers" value={drivers.filter(d => d.status === 'ACTIVE').length} prefix={<TeamOutlined style={{ color: '#10b981' }} />} />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="Available lorries" value={vehicles.filter(v => v.status === 'ACTIVE').length} prefix={<CarOutlined style={{ color: '#f59e0b' }} />} />
                </Card>
              </Col>
            </Row>

            <Card
              title={<span style={{ fontWeight: 800, fontSize: '18px' }}>MPCS Bulk Session Requests</span>}
              bordered={false}
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
              extra={
                <Button 
                  type="primary" 
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => setIsAssignModalVisible(true)}
                  style={{ background: '#312e81' }}
                >
                  🚀 Assign {selectedRowKeys.length} Batches for Multi-Point Trip
                </Button>
              }
            >
              <Table
                rowSelection={rowSelection}
                columns={[
                  { title: 'MPCS CENTER', dataIndex: 'mpcsName', key: 'mpcsName', render: n => <b style={{ color: '#312e81' }}>{n}</b> },
                  { title: 'TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color={t === 'COW' ? 'blue' : 'orange'}>{t}</Tag> },
                  { title: 'SESSION', dataIndex: 'session', key: 'session', render: s => <Tag>{s}</Tag> },
                  { title: 'TOTAL QTY', dataIndex: 'totalQuantity', key: 'totalQuantity', render: q => <span style={{ fontWeight: 800 }}>{q} L</span> },
                  { title: 'STATUS', dataIndex: 'status', key: 'status', render: () => <Tag color="warning">WAITING PICKUP</Tag> },
                  {
                    title: 'ACTION',
                    key: 'action',
                    render: (_, record) => (
                      <Button type="link" onClick={() => { setSelectedProcurement(record); setIsAssignModalVisible(true); }}>
                        Quick Assign
                      </Button>
                    )
                  }
                ]}
                dataSource={pendingDispatches}
                rowKey="id"
              />
            </Card>

            <Divider style={{ margin: '40px 0' }} />

            <Card
              title={<span style={{ fontWeight: 800, fontSize: '18px', color: '#093a3e' }}>Retail Outlet Delivery Requests</span>}
              bordered={false}
              style={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            >
              <Table
                columns={[
                  { title: 'DEL ID', dataIndex: 'deliveryId', key: 'deliveryId', render: id => <b>{id}</b> },
                  { title: 'BATCH', dataIndex: 'batchId', key: 'batchId' },
                  { title: 'DESTINATION', dataIndex: 'destination', key: 'dest' },
                  { title: 'QUANTITY', dataIndex: 'quantity', key: 'qty', render: q => <span>{q} Units</span> },
                  { title: 'STATUS', dataIndex: 'status', key: 'status', render: () => <Tag color="processing">AWAITING LOGISTICS</Tag> },
                  {
                    title: 'ACTION',
                    key: 'action',
                    render: (_, record) => (
                      <Button type="primary" size="small" style={{ background: '#093a3e' }} onClick={() => { setSelectedDelivery(record); setIsDeliveryModalVisible(true); }}>
                        Assign Delivery
                      </Button>
                    )
                  }
                ]}
                dataSource={pendingDeliveries}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </>
        );
      case 'fleet':
        return (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Fleet Resource Management</h1>
                 <p style={{ color: '#64748b' }}>Manage your assigned drivers and motor vehicles.</p>
               </div>
               <Space>
                 <Button icon={<TeamOutlined />} onClick={() => setIsDriverModalVisible(true)}>Add Driver</Button>
                 <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsVehicleModalVisible(true)}>Provision Vehicle</Button>
               </Space>
            </div>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title="Driver Readiness" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <Table 
                    dataSource={drivers} 
                    columns={[
                      { title: 'ID', dataIndex: 'driverId', key: 'id' },
                      { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
                      { title: 'License', dataIndex: 'drivingLicenseNumber' },
                      { title: 'Status', dataIndex: 'status', render: s => <Badge status={s === 'ACTIVE' ? 'success' : 'error'} text={s} /> },
                      {
                        title: 'Actions',
                        key: 'action',
                        render: (_, record) => (
                           <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteResource('driver', record.id)} />
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Vehicle Maintenance" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <Table 
                    dataSource={vehicles} 
                    columns={[
                      { title: 'Plate No', dataIndex: 'registrationNumber', key: 'reg' },
                      { title: 'Type', dataIndex: 'vehicleType', render: t => <Tag color="blue">{t}</Tag> },
                      { title: 'Status', dataIndex: 'status', render: s => <Badge status={s === 'ACTIVE' ? 'success' : 'warning'} text={s} /> },
                      {
                        title: 'Actions',
                        key: 'action',
                        render: (_, record) => (
                           <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteResource('vehicle', record.id)} />
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        );
      case 'profile':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#1e293b', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px' }}>{user.fullName}</h1>
                <Tag color="cyan">CHIEF TRANSPORT MANAGER</Tag>
              </div>
              <Divider />
              <div style={{ padding: '0 24px 24px' }}>
                <p><b>Email:</b> {user.email}</p>
                <p><b>Role:</b> {user.role}</p>
              </div>
            </Card>
          </div>
        );
      default:
        return <Empty />;
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#312e81', borderRadius: 8 } }}>
      <>
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            style={{ background: '#0f172a', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}
          >
            <div style={{ padding: '24px', color: '#fff', fontSize: '20px', fontWeight: 900 }}>
              {collapsed ? 'T' : 'Transport Portal'}
            </div>

            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={({ key }) => setActiveTab(key)}
              style={{ background: 'transparent' }}
              items={[
                { key: 'dispatch', icon: <TruckOutlined />, label: 'Dispatch Control' },
                { key: 'fleet', icon: <CarOutlined />, label: 'Fleet & Staff' },
                { key: 'history', icon: <HistoryOutlined />, label: 'Logistics History', disabled: true },
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
                    <div style={{ fontSize: '11px', color: '#64748b' }}>MANAGER</div>
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
          title={<span style={{ fontWeight: 800 }}>Manual Transport Assignment</span>}
          open={isAssignModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsAssignModalVisible(false)}
          okText="Confirm Assignment"
        >
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>ASSIGNING FOR:</p>
            <p style={{ margin: 0, fontWeight: 700 }}>Procurement #{selectedProcurement?.id} - {selectedProcurement?.totalQuantity} Liters</p>
          </div>
          <Form form={form} layout="vertical" onFinish={handleAssignTransport}>
            <Form.Item name="driverId" label="Select Driver" rules={[{ required: true }]}>
              <Select placeholder="Choose an active driver">
                {drivers.map(d => (
                  <Option key={d.id} value={d.id} disabled={d.status !== 'ACTIVE'}>
                    {d.fullName} {d.status !== 'ACTIVE' ? '(Busy)' : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="vehicleId" label="Select Vehicle/Lorry" rules={[{ required: true }]}>
              <Select placeholder="Choose an active vehicle">
                {vehicles.map(v => (
                  <Option key={v.id} value={v.id} disabled={v.status !== 'ACTIVE'}>
                    {v.registrationNumber} ({v.capacity}L) {v.status !== 'ACTIVE' ? '(In Use/Maint.)' : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={<span style={{ fontWeight: 800 }}>Provision New Driver Account</span>}
          open={isDriverModalVisible}
          onOk={() => driverForm.submit()}
          onCancel={() => setIsDriverModalVisible(false)}
          okText="Create Account"
          confirmLoading={loading}
        >
          <Form form={driverForm} layout="vertical" onFinish={handleAddDriver}>
            <Form.Item name="fullName" label="Driver Full Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="Professional Email" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="password" label="Temporary Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
            <Form.Item name="phoneNumber" label="Phone Number"><Input /></Form.Item>
            <Form.Item name="drivingLicenseNumber" label="Driving License #" rules={[{ required: true }]}><Input /></Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="licenseExpiry" label="Expiry Date" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="licenseClass" label="License Class" initialValue="HMV"><Input /></Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        <Modal
          title={<span style={{ fontWeight: 800 }}>Provision New Vehicle Unit</span>}
          open={isVehicleModalVisible}
          onOk={() => vehicleForm.submit()}
          onCancel={() => setIsVehicleModalVisible(false)}
          okText="Add to Fleet"
          confirmLoading={loading}
        >
          <Form form={vehicleForm} layout="vertical" onFinish={handleAddVehicle}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="registrationNumber" label="Reg. Number" rules={[{ required: true }]}><Input placeholder="Plate #" /></Form.Item></Col>
              <Col span={12}>
                <Form.Item name="vehicleType" label="Type" rules={[{ required: true }]}>
                  <Select>
                    <Option value="TANKER">Tanker Truck</Option>
                    <Option value="REFRIGERATED">Refrigerated</Option>
                    <Option value="CLOSED">Closed Container</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="capacity" label="Capacity (L)" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="manufactureBrand" label="Brand" initialValue="TATA"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="chasisNumber" label="Chassis Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="engineNumber" label="Engine Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="registrationExpiry" label="Reg. Expiry" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item>
            <Form.Item name="year" label="Year" initialValue={2024}><Input /></Form.Item>
          </Form>
        </Modal>

        {/* --- Retail Delivery Assignment Modal (Added back if missing) --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Retail Delivery Assignment</span>}
          open={isDeliveryModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsDeliveryModalVisible(false)}
          okText="Assign Driver"
        >
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>DELIVERY FOR:</p>
            <p style={{ margin: 0, fontWeight: 700 }}>Request #{selectedDelivery?.deliveryId} - {selectedDelivery?.quantity} Units to {selectedDelivery?.destination}</p>
          </div>
          <Form form={form} layout="vertical" onFinish={handleAssignDelivery}>
            <Form.Item name="driverId" label="Select Driver" rules={[{ required: true }]}>
              <Select placeholder="Choose an active driver">
                {drivers.map(d => (
                  <Option key={d.id} value={d.id} disabled={d.status !== 'ACTIVE'}>
                    {d.fullName} {d.status !== 'ACTIVE' ? '(Busy)' : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </>
    </ConfigProvider>
  );
};

export default TransportManagerDashboard;
