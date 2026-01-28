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
  List,
  Space,
} from 'antd';
import { LogoutOutlined, PlusOutlined, EditOutlined, ToolOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content, Footer, Sider } = Layout;

const FarmerDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [milkLogs, setMilkLogs] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [isAddMilkModalVisible, setIsAddMilkModalVisible] = useState(false);
  const [isAddInfraModalVisible, setIsAddInfraModalVisible] = useState(false);
  const [isEditInfraModalVisible, setIsEditInfraModalVisible] = useState(false);
  const [isCattleModalVisible, setIsCattleModalVisible] = useState(false);
  const [isLandModalVisible, setIsLandModalVisible] = useState(false);
  const [selectedInfra, setSelectedInfra] = useState(null);
  const [milkForm] = Form.useForm();
  const [infraForm] = Form.useForm();
  const [cattleForm] = Form.useForm();
  const [landForm] = Form.useForm();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchFarmerProfile();
    fetchMilkLogs();
    fetchInfrastructure();
    fetchMilkSalesSummary();
  }, []);

  const fetchFarmerProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/farmer/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFarmerProfile(response.data.data);
    } catch (error) {
      message.error('Failed to fetch farmer profile');
      console.error(error);
    }
  };

  const fetchMilkLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/farmer/milk-sales', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMilkLogs(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch milk logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInfrastructure = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/farmer/infrastructure', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInfrastructure(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch infrastructure');
      console.error(error);
    }
  };

  const fetchMilkSalesSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/farmer/milk-sales/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch milk sales summary');
      console.error(error);
    }
  };

  const handleAddMilkLog = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/farmer/milk-logs', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Milk log added successfully');
      milkForm.resetFields();
      setIsAddMilkModalVisible(false);
      fetchMilkLogs();
      fetchMilkSalesSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error adding milk log');
    }
  };

  const handleAddInfrastructure = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/farmer/infrastructure', values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Infrastructure added successfully');
      infraForm.resetFields();
      setIsAddInfraModalVisible(false);
      fetchInfrastructure();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error adding infrastructure');
    }
  };

  const handleUpdateInfraMaintenance = async (values) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/farmer/infrastructure/${selectedInfra.id}`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Infrastructure maintenance updated');
      infraForm.resetFields();
      setIsEditInfraModalVisible(false);
      setSelectedInfra(null);
      fetchInfrastructure();
    } catch (error) {
      message.error('Error updating infrastructure');
    }
  };

  const handleUpdateCattleDetails = async (values) => {
    try {
      await axios.patch('http://localhost:5000/api/farmer/cattle-details', 
        { cattleDetails: values },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Cattle details updated successfully');
      cattleForm.resetFields();
      setIsCattleModalVisible(false);
      fetchFarmerProfile();
    } catch (error) {
      message.error('Error updating cattle details');
    }
  };

  const handleUpdateLandDetails = async (values) => {
    try {
      await axios.patch('http://localhost:5000/api/farmer/land-details', 
        { landDetails: values },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Land details updated successfully');
      landForm.resetFields();
      setIsLandModalVisible(false);
      fetchFarmerProfile();
    } catch (error) {
      message.error('Error updating land details');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const conditionColors = {
    GOOD: 'green',
    FAIR: 'orange',
    POOR: 'red',
  };

  const milkColumns = [
    {
      title: 'Date',
      dataIndex: 'logDate',
      key: 'logDate',
      render: (text) => dayjs(text).format('DD-MM-YYYY'),
    },
    {
      title: 'Produced (L)',
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
    },
    {
      title: 'Sold (L)',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
    },
    {
      title: 'Price/L (₹)',
      dataIndex: 'pricePerLiter',
      key: 'pricePerLiter',
    },
    {
      title: 'Total (₹)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (text) => `₹${text}`,
    },
  ];

  const infraColumns = [
    {
      title: 'Equipment',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
    },
    {
      title: 'Type',
      dataIndex: 'equipmentType',
      key: 'equipmentType',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition) => <Tag color={conditionColors[condition]}>{condition}</Tag>,
    },
    {
      title: 'Last Maintenance',
      dataIndex: 'lastMaintenanceDate',
      key: 'lastMaintenanceDate',
      render: (text) => dayjs(text).format('DD-MM-YYYY'),
    },
    {
      title: 'Next Maintenance',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      render: (text) => dayjs(text).format('DD-MM-YYYY'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<ToolOutlined />}
          onClick={() => {
            setSelectedInfra(record);
            infraForm.setFieldsValue(record);
            setIsEditInfraModalVisible(true);
          }}
        >
          Update
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', padding: '16px', textAlign: 'center' }}>
          {collapsed ? 'FRM' : 'Farmer'}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button type="primary" danger block onClick={handleLogout} icon={<LogoutOutlined />}>
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Farmer Dashboard</h2>
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
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Produced (L)"
                  value={summary.totalProduced?.toFixed(2) || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Sold (L)"
                  value={summary.totalSold?.toFixed(2) || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Earnings (₹)"
                  value={summary.totalEarnings?.toFixed(2) || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Avg Price/L (₹)"
                  value={summary.averagePrice?.toFixed(2) || 0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs
            defaultActiveKey="1"
            style={{ marginTop: '24px' }}
            items={[
              {
                key: '1',
                label: 'Milk Sales Log',
                children: (
                  <Card
                    title="Milk Production & Sales Record"
                    extra={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsAddMilkModalVisible(true)}
                      >
                        Add Milk Log
                      </Button>
                    }
                  >
                    <Table
                      columns={milkColumns}
                      dataSource={milkLogs}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                ),
              },
              {
                key: '2',
                label: 'Infrastructure',
                children: (
                  <Card
                    title="Dairy Infrastructure & Maintenance"
                    extra={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setSelectedInfra(null);
                          infraForm.resetFields();
                          setIsAddInfraModalVisible(true);
                        }}
                      >
                        Add Equipment
                      </Button>
                    }
                  >
                    <Table
                      columns={infraColumns}
                      dataSource={infrastructure}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                ),
              },
              {
                key: '3',
                label: 'Cattle Details',
                children: (
                  <Card
                    title="Cattle Information & Management"
                    extra={
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                          if (farmerProfile?.cattleDetails) {
                            cattleForm.setFieldsValue(farmerProfile.cattleDetails);
                          }
                          setIsCattleModalVisible(true);
                        }}
                      >
                        Update Cattle Details
                      </Button>
                    }
                  >
                    {farmerProfile?.cattleDetails ? (
                      <List
                        dataSource={Object.entries(farmerProfile.cattleDetails)}
                        renderItem={([key, value]) => (
                          <List.Item>
                            <List.Item.Meta
                              title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              description={typeof value === 'object' ? JSON.stringify(value) : value}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <p style={{ color: '#999' }}>No cattle details added yet</p>
                    )}
                  </Card>
                ),
              },
              {
                key: '4',
                label: 'Land Details',
                children: (
                  <Card
                    title="Land & Farm Information"
                    extra={
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                          if (farmerProfile?.landDetails) {
                            landForm.setFieldsValue(farmerProfile.landDetails);
                          }
                          setIsLandModalVisible(true);
                        }}
                      >
                        Update Land Details
                      </Button>
                    }
                  >
                    {farmerProfile?.landDetails ? (
                      <List
                        dataSource={Object.entries(farmerProfile.landDetails)}
                        renderItem={([key, value]) => (
                          <List.Item>
                            <List.Item.Meta
                              title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              description={typeof value === 'object' ? JSON.stringify(value) : value}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <p style={{ color: '#999' }}>No land details added yet</p>
                    )}
                  </Card>
                ),
              },
            ]}
          />
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dairy Infra Portal ©2024</Footer>
      </Layout>

      <Modal
        title="Add Milk Production Log"
        visible={isAddMilkModalVisible}
        onCancel={() => setIsAddMilkModalVisible(false)}
        footer={null}
      >
        <Form form={milkForm} onFinish={handleAddMilkLog} layout="vertical">
          <Form.Item name="logDate" label="Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="quantityProduced" label="Quantity Produced (L)" rules={[{ required: true }]}>
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="quantitySold" label="Quantity Sold (L)" rules={[{ required: true }]}>
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="pricePerLiter" label="Price Per Liter (₹)" rules={[{ required: true }]}>
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Log
          </Button>
        </Form>
      </Modal>

      <Modal
        title={selectedInfra ? 'Update Infrastructure Maintenance' : 'Add New Equipment'}
        visible={selectedInfra ? isEditInfraModalVisible : isAddInfraModalVisible}
        onCancel={() => {
          if (selectedInfra) {
            setIsEditInfraModalVisible(false);
            setSelectedInfra(null);
          } else {
            setIsAddInfraModalVisible(false);
          }
          infraForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={infraForm}
          onFinish={selectedInfra ? handleUpdateInfraMaintenance : handleAddInfrastructure}
          layout="vertical"
        >
          {!selectedInfra && (
            <>
              <Form.Item name="equipmentName" label="Equipment Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="equipmentType" label="Equipment Type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="COOLER">Cooler</Select.Option>
                  <Select.Option value="PUMP">Pump</Select.Option>
                  <Select.Option value="PIPE">Pipe</Select.Option>
                  <Select.Option value="CONTAINER">Container</Select.Option>
                  <Select.Option value="OTHER">Other</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="purchaseDate" label="Purchase Date">
                <DatePicker />
              </Form.Item>
            </>
          )}
          <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="GOOD">Good</Select.Option>
              <Select.Option value="FAIR">Fair</Select.Option>
              <Select.Option value="POOR">Poor</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="maintenanceNotes" label="Maintenance Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {selectedInfra ? 'Update' : 'Add Equipment'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Update Cattle Details"
        visible={isCattleModalVisible}
        onCancel={() => setIsCattleModalVisible(false)}
        footer={null}
      >
        <Form
          form={cattleForm}
          onFinish={handleUpdateCattleDetails}
          layout="vertical"
        >
          <Form.Item name="totalCount" label="Total Count" rules={[{ required: true }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="breed" label="Breed" rules={[{ required: true }]}>
            <Input placeholder="e.g., Holstein, Jersey, etc." />
          </Form.Item>
          <Form.Item name="healthStatus" label="Health Status">
            <Select>
              <Select.Option value="HEALTHY">Healthy</Select.Option>
              <Select.Option value="UNDER_TREATMENT">Under Treatment</Select.Option>
              <Select.Option value="NEED_CHECKUP">Need Checkup</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="lastVaccineDate" label="Last Vaccine Date">
            <DatePicker />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update Cattle Details
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Update Land Details"
        visible={isLandModalVisible}
        onCancel={() => setIsLandModalVisible(false)}
        footer={null}
      >
        <Form
          form={landForm}
          onFinish={handleUpdateLandDetails}
          layout="vertical"
        >
          <Form.Item name="totalArea" label="Total Area (acres)" rules={[{ required: true }]}>
            <InputNumber step={0.1} />
          </Form.Item>
          <Form.Item name="location" label="Location / Address">
            <Input placeholder="Village, District, State" />
          </Form.Item>
          <Form.Item name="irrigationType" label="Irrigation Type">
            <Select>
              <Select.Option value="RAINFALL">Rainfall</Select.Option>
              <Select.Option value="WELL">Well</Select.Option>
              <Select.Option value="CANAL">Canal</Select.Option>
              <Select.Option value="BOREWELL">Borewell</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="soilType" label="Soil Type">
            <Input placeholder="e.g., Loamy, Clay, Sandy" />
          </Form.Item>
          <Form.Item name="cropPattern" label="Crop Pattern">
            <Input.TextArea rows={2} placeholder="Current crops being grown" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update Land Details
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default FarmerDashboard;
