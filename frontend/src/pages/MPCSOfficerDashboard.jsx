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
  Menu,
} from 'antd';
import { UserAddOutlined, LogoutOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content, Footer, Sider } = Layout;

const MPCSOfficerDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAddFarmerModalVisible, setIsAddFarmerModalVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [addFarmerForm] = Form.useForm();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchFarmers();
    fetchProcurementSummary();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/mpcs-officer/farmers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFarmers(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch farmers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmersForMilk = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mpcs-officer/farmers/list/ids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchProcurementSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mpcs-officer/milk-procurement/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data.data);
      setProcurements(response.data.data.procurements || []);
    } catch (error) {
      message.error('Failed to fetch procurement summary');
      console.error(error);
    }
  };

  const handleAddFarmer = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/mpcs-officer/farmers', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Farmer added successfully');
      addFarmerForm.resetFields();
      setIsAddFarmerModalVisible(false);
      fetchFarmers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error adding farmer');
    }
  };

  const handleLogProcurement = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/mpcs-officer/milk-procurement', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Milk procurement logged successfully');
      setActiveMenu('dashboard');
      fetchProcurementSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error logging procurement');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const farmerColumns = [
    {
      title: 'Farmer ID',
      dataIndex: 'farmerId',
      key: 'farmerId',
      width: 120,
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Farm Size (acres)',
      dataIndex: 'farmSize',
      key: 'farmSize',
    },
    {
      title: 'Cattle Count',
      dataIndex: 'numberOfCattle',
      key: 'numberOfCattle',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <span style={{ color: text === 'ACTIVE' ? 'green' : 'red' }}>{text}</span>,
    },
  ];

  const procurementColumns = [
    {
      title: 'Farmer ID',
      dataIndex: 'farmerFarmerId',
      key: 'farmerFarmerId',
    },
    {
      title: 'Quantity (L)',
      dataIndex: 'quantityLiters',
      key: 'quantityLiters',
    },
    {
      title: 'Quality',
      dataIndex: 'quality',
      key: 'quality',
    },
    {
      title: 'Temperature',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (text) => `${text}°C`,
    },
    {
      title: 'Price/L',
      dataIndex: 'pricePerLiter',
      key: 'pricePerLiter',
      render: (text) => `₹${text}`,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (text) => `₹${text}`,
    },
    {
      title: 'Date',
      dataIndex: 'procurementDate',
      key: 'procurementDate',
      render: (text) => dayjs(text).format('DD-MM-YYYY'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={250}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {collapsed ? 'MPCS' : 'MPCS Officer'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          selectedKeys={[activeMenu]}
          onClick={(e) => setActiveMenu(e.key)}
          style={{ marginTop: '16px' }}
          items={[
            {
              key: 'dashboard',
              label: 'Dashboard',
              icon: <EnvironmentOutlined />,
            },
            {
              key: 'farmers',
              label: 'Farmers',
              icon: <UserAddOutlined />,
              onClick: () => {
                setActiveMenu('farmers');
              }
            },
            {
              key: 'milk-procurement',
              label: 'Milk Procurement',
              icon: <PlusOutlined />,
              onClick: () => {
                setActiveMenu('milk-procurement');
              }
            },
          ]}
        />
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
          <Button type="primary" danger block onClick={handleLogout} icon={<LogoutOutlined />}>
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0 }}>MPCS Officer Portal</h2>
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px' }}
          >
            ☰
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', minHeight: 'calc(100vh - 100px)' }}>
          {activeMenu === 'dashboard' && <DashboardView summary={summary} farmers={farmers} procurements={procurements} loading={loading} />}
          {activeMenu === 'farmers' && <FarmersView farmers={farmers} loading={loading} onAddFarmer={() => setIsAddFarmerModalVisible(true)} fetchFarmers={fetchFarmers} />}
          {activeMenu === 'milk-procurement' && <MilkProcurementView token={token} onProcurementLogged={() => { setActiveMenu('dashboard'); fetchProcurementSummary(); }} />}
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dairy Infra Portal ©2024</Footer>
      </Layout>

      <Modal
        title="Add New Farmer"
        open={isAddFarmerModalVisible}
        onCancel={() => setIsAddFarmerModalVisible(false)}
        footer={null}
      >
        <Form form={addFarmerForm} onFinish={handleAddFarmer} layout="vertical">
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Phone Number">
            <Input />
          </Form.Item>
          <Form.Item name="villageId" label="Village ID">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="farmSize" label="Farm Size (acres)">
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="numberOfCattle" label="Number of Cattle">
            <InputNumber />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Farmer
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

// Dashboard View Component
const DashboardView = ({ summary, farmers, procurements, loading }) => (
  <>
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Farmers"
            value={farmers.length}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Milk Quantity (L)"
            value={summary.totalQuantity?.toFixed(2) || 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Amount"
            value={`₹${summary.totalAmount?.toFixed(2) || 0}`}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Transactions"
            value={summary.totalTransactions || 0}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
    </Row>

    <Card title="Recent Milk Procurement">
      <Table
        columns={[
          { title: 'Farmer ID', dataIndex: 'farmerFarmerId', key: 'farmerFarmerId' },
          { title: 'Quantity (L)', dataIndex: 'quantityLiters', key: 'quantityLiters' },
          { title: 'Quality', dataIndex: 'quality', key: 'quality' },
          { title: 'Price/L', dataIndex: 'pricePerLiter', key: 'pricePerLiter', render: (text) => `₹${text}` },
          { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', render: (text) => `₹${text}` },
          { title: 'Date', dataIndex: 'procurementDate', key: 'procurementDate', render: (text) => dayjs(text).format('DD-MM-YYYY') },
        ]}
        dataSource={procurements}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
    </Card>
  </>
);

// Farmers View Component
const FarmersView = ({ farmers, loading, onAddFarmer, fetchFarmers }) => (
  <Card
    title="Registered Farmers"
    extra={<Button type="primary" icon={<UserAddOutlined />} onClick={onAddFarmer}>Add Farmer</Button>}
  >
    <Table
      columns={[
        { title: 'Farmer ID', dataIndex: 'farmerId', key: 'farmerId', width: 120 },
        { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
        { title: 'Farm Size', dataIndex: 'farmSize', key: 'farmSize' },
        { title: 'Cattle', dataIndex: 'numberOfCattle', key: 'numberOfCattle' },
      ]}
      dataSource={farmers}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  </Card>
);

// Milk Procurement View Component
const MilkProcurementView = ({ token, onProcurementLogged }) => {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [form] = Form.useForm();
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Price calculation based on SNF and Fat
  const calculatePrice = (snf, fat, quantity) => {
    // Base price calculation
    const basePrice = 30; // Base price per liter
    const snfBonus = (snf - 8) * 2; // ₹2 per 1% SNF above 8%
    const fatBonus = (fat - 3.5) * 3; // ₹3 per 1% fat above 3.5%
    const pricePerLiter = basePrice + snfBonus + fatBonus;
    const totalPrice = pricePerLiter * (quantity || 0);
    return { pricePerLiter: Math.max(pricePerLiter, 0), totalPrice: Math.max(totalPrice, 0) };
  };

  useEffect(() => {
    fetchFarmersForMilk();
  }, []);

  const fetchFarmersForMilk = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/mpcs-officer/farmers/list/ids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFarmers(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch farmers');
      console.error(error);
    }
  };

  const handleFormChange = () => {
    const snf = form.getFieldValue('snf') || 0;
    const fat = form.getFieldValue('fat') || 0;
    const quantity = form.getFieldValue('quantityLiters') || 0;
    const prices = calculatePrice(snf, fat, quantity);
    setCalculatedPrice(prices);
  };

  const handleSubmit = async (values) => {
    try {
      const prices = calculatePrice(values.snf, values.fat, values.quantityLiters);
      await axios.post('http://localhost:5000/api/mpcs-officer/milk-procurement', {
        farmerId: selectedFarmer.id,
        quantityLiters: values.quantityLiters,
        quality: values.quality,
        temperature: values.temperature,
        snf: values.snf,
        fat: values.fat,
        pricePerLiter: prices.pricePerLiter,
        totalAmount: prices.totalPrice,
        notes: values.notes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Milk procurement logged successfully');
      form.resetFields();
      setSelectedFarmer(null);
      setCalculatedPrice(0);
      onProcurementLogged();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error logging procurement');
    }
  };

  if (!selectedFarmer) {
    return (
      <Row gutter={[16, 16]}>
        {farmers.map((farmer) => (
          <Col xs={24} sm={12} lg={8} key={farmer.id}>
            <Card
              hoverable
              onClick={() => setSelectedFarmer(farmer)}
              style={{ cursor: 'pointer' }}
            >
              <h3 style={{ margin: '0 0 8px 0' }}>{farmer.farmerId}</h3>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>{farmer.fullName}</p>
              <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>{farmer.email}</p>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Card
      title={`Add Milk Procurement - ${selectedFarmer.farmerId} (${selectedFarmer.fullName})`}
      extra={<Button onClick={() => setSelectedFarmer(null)}>← Back</Button>}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical" onFieldsChange={handleFormChange}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="quantityLiters" label="Quantity (Liters)" rules={[{ required: true }]}>
              <InputNumber step={0.1} placeholder="Enter quantity in liters" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="quality" label="Milk Type / Quality" rules={[{ required: true }]}>
              <Select placeholder="Select milk type">
                <Select.Option value="A">A - Premium</Select.Option>
                <Select.Option value="B">B - Standard</Select.Option>
                <Select.Option value="C">C - Basic</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="snf" label="SNF - Solids Not Fat (%)" rules={[{ required: true, message: 'SNF is required' }]}>
              <InputNumber step={0.1} min={0} max={12} placeholder="e.g., 8.5" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="fat" label="Fat Content (%)" rules={[{ required: true, message: 'Fat is required' }]}>
              <InputNumber step={0.1} min={0} max={8} placeholder="e.g., 4.0" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="temperature" label="Temperature (°C)">
              <InputNumber step={0.1} placeholder="Storage temperature" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Card style={{ backgroundColor: '#f0f5ff', border: '1px solid #b3d8ff' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                Price Per Liter
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                ₹{calculatedPrice.pricePerLiter?.toFixed(2) || '0.00'}
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                Total Amount
              </p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                ₹{calculatedPrice.totalPrice?.toFixed(2) || '0.00'}
              </p>
            </Card>
          </Col>
        </Row>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="Any additional notes..." />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large">
          Log Procurement
        </Button>
      </Form>

      <Card style={{ marginTop: '24px', backgroundColor: '#fafafa' }} title="Price Calculation Logic">
        <p style={{ margin: '8px 0', fontSize: '12px' }}>
          <strong>Base Price:</strong> ₹30 per liter
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px' }}>
          <strong>SNF Bonus:</strong> ₹2 per 1% above 8% SNF
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px' }}>
          <strong>Fat Bonus:</strong> ₹3 per 1% above 3.5% fat
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
          Final Price = Base Price + SNF Bonus + Fat Bonus
        </p>
      </Card>
    </Card>
  );
};

export default MPCSOfficerDashboard;
