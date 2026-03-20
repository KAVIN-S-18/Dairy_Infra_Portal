import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Input, Popconfirm, Select, InputNumber, Drawer, DatePicker
} from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  ArrowRightOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  MinusCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Sider, Content } = Layout;
const { Search, TextArea } = Input;
const { Option } = Select;

const MPCSOfficerDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Modals & Drawers
  const [isAddFarmerModalVisible, setIsAddFarmerModalVisible] = useState(false);
  const [isLogMilkModalVisible, setIsLogMilkModalVisible] = useState(false);
  const [isInfraDrawerVisible, setIsInfraDrawerVisible] = useState(false);
  const [selectedFarmerForInfra, setSelectedFarmerForInfra] = useState(null);

  const [addFarmerForm] = Form.useForm();
  const [milkForm] = Form.useForm();
  const [infraForm] = Form.useForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [procurementSearch, setProcurementSearch] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState({ pricePerLiter: 0, totalPrice: 0 });
  const [selectedFarmerForMilk, setSelectedFarmerForMilk] = useState(null);

  // Data states
  const [farmers, setFarmers] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [summary, setSummary] = useState({ totalQuantity: 0, totalAmount: 0, totalTransactions: 0 });

  // Mock Dispatch State
  const [dispatches, setDispatches] = useState([]);  // kept for backward compatibility but not displayed
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'));
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';


  useEffect(() => {
    const currentToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    if (!currentToken || currentUser.role !== 'MPCS_OFFICER') {
      navigate('/login');
      return;
    }
    fetchFarmers();
    fetchProcurementSummary();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mpcs-officer/farmers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmers(response.data.data || []);
    } catch (error) {
      message.error('Error fetching farmers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProcurementSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mpcs-officer/milk-procurement/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data.data || { totalQuantity: 0, totalAmount: 0, totalTransactions: 0, procurements: [] });
      setProcurements(response.data.data?.procurements || []);
    } catch (error) {
      message.error('Error fetching milk procurements');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFarmer = async (values) => {
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      };
      await axios.post(`${API_URL}/mpcs-officer/farmers`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Farmer registered successfully');
      addFarmerForm.resetFields();
      setIsAddFarmerModalVisible(false);
      fetchFarmers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error registering farmer');
    }
  };

  const calculatePrice = (snf, fat, quantity, milkType = 'COW') => {
    // New formula with mapping for cow/buffalo difference
    const baseFactor = milkType === 'BUFFALO' ? 1.15 : 1.0;
    const fatPrice = (fat / 100) * 370;
    const snfPrice = (snf / 100) * 247;
    const pricePerLiter = (fatPrice + snfPrice) * baseFactor;
    const totalPrice = pricePerLiter * (quantity || 0);
    return { pricePerLiter: Math.max(pricePerLiter, 0), totalPrice: Math.max(totalPrice, 0) };
  };

  const handleMilkFormChange = () => {
    const snf = milkForm.getFieldValue('snf') || 0;
    const fat = milkForm.getFieldValue('fat') || 0;
    const quantity = milkForm.getFieldValue('quantityLiters') || 0;
    const prices = calculatePrice(snf, fat, quantity);
    setCalculatedPrice(prices);
  };

  const handleLogProcurement = async (values) => {
    try {
      const prices = calculatePrice(values.snf, values.fat, values.quantityLiters, values.milkType);

      const dbDate = values.procurementDate ? values.procurementDate.toDate() : dayjs().toDate();
      const hour = dbDate.getHours();

      if (values.session === 'Morning' && (hour < 6 || hour > 15)) {
        return message.error('Morning session logs are allowed between 06:00 and 15:59.');
      }
      if (values.session === 'Evening' && !((hour >= 16 && hour <= 23) || (hour >= 0 && hour <= 5))) {
        return message.error('Evening session logs are allowed between 16:00 and 05:59 next day.');
      }

      await axios.post(`${API_URL}/mpcs-officer/milk-procurement`, {
        farmerId: values.farmerId,
        quantityLiters: values.quantityLiters,
        milkType: values.milkType,
        session: values.session === 'Morning' ? 'MORNING' : 'EVENING',
        temperature: values.temperature,
        snf: values.snf,
        fat: values.fat,
        pricePerLiter: prices.pricePerLiter,
        totalAmount: prices.totalPrice,
        procurementDate: dbDate.toISOString(),
        notes: `[Session: ${values.session}] ${values.notes || ''}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Milk logged successfully');
      milkForm.resetFields();
      setCalculatedPrice({ pricePerLiter: 0, totalPrice: 0 });
      setIsLogMilkModalVisible(false);
      fetchProcurementSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error logging milk');
    }
  };

  const handleDispatch = async (record) => {
    try {
      await axios.post(`${API_URL}/mpcs-officer/milk-procurement/${record.id}/dispatch`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Procurement marked as dispatched');
      fetchProcurementSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error dispatching procurement');
    }
  };

  const handleDispatchByType = async (milkType) => {
    try {
      const pending = procurements.filter(p => p.milkType === milkType && (p.dispatchStatus === 'PENDING' || p.dispatchStatus === 'WAITING_FOR_VEHICLE' || !p.isDispatched));
      if (pending.length === 0) {
        return message.info(`No pending ${milkType.toLowerCase()} records to dispatch`);
      }
      
      await axios.post(`${API_URL}/mpcs-officer/milk-procurement/dispatch-bulk`, { milkType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success(`Successfully dispatched all pending ${milkType.toLowerCase()} records`);
      fetchProcurementSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error dispatching batch');
    }
  };

  const handleAutoDispatchAll = async () => {
    try {
      const pending = procurements.filter(p => !p.isDispatched);
      for (const p of pending) {
        const hour = dayjs(p.procurementDate).hour();
        const eligible = (p.session === 'MORNING' && hour >= 10) || (p.session === 'EVENING' && hour >= 20);
        if (eligible) {
          await axios.post(`${API_URL}/mpcs-officer/milk-procurement/${p.id}/dispatch`, null, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      message.success('Auto-dispatch completed');
      fetchProcurementSummary();
    } catch (error) {
      message.error('Auto-dispatch failed');
    }
  };

  const openInfraDrawer = (farmer) => {
    setSelectedFarmerForInfra(farmer);
    const existingCattle = farmer.cattleDetails?.list || [];
    const numberOfCattle = farmer.numberOfCattle || 0;
    const inferredList = existingCattle.length > 0 ? existingCattle : Array.from({ length: Math.max(numberOfCattle, 1) }, (_, index) => ({
      tagNumber: `TAG-${1000 + index}`,
      breed: 'Not specified',
      lastVaccination: dayjs().format('YYYY-MM-DD')
    }));
    
    // Parse land details whether it's string, missing, or JSON
    const landArea = farmer.landDetails?.area || '';
    const landLocation = farmer.landDetails?.location || '';
    const irrigationType = farmer.landDetails?.irrigationType || 'Rainfed';
    const landNotes = farmer.landDetails?.description || (typeof farmer.landDetails === 'string' ? farmer.landDetails : '');
    const cattleHealth = farmer.cattleDetails?.healthStatus || 'Good';

    infraForm.setFieldsValue({
      farmSize: farmer.farmSize,
      villageId: farmer.villageId,
      cattleList: inferredList,
      cattleHealth,
      landArea,
      landLocation,
      irrigationType,
      landDetails: landNotes,
      fullName: farmer.fullName,
      phoneNumber: farmer.phoneNumber
    });
    setIsInfraDrawerVisible(true);
  };

  const handleUpdateInfra = async (values) => {
    try {
      const payload = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        farmSize: values.farmSize,
        villageId: values.villageId,
        numberOfCattle: values.cattleList?.length || 0,
        cattleDetails: {
          totalCount: values.cattleList?.length || 0,
          list: values.cattleList || [],
          healthStatus: values.cattleHealth
        },
        landDetails: { 
          area: values.landArea,
          location: values.landLocation,
          irrigationType: values.irrigationType,
          description: values.landDetails 
        }
      };
      await axios.patch(`${API_URL}/mpcs-officer/farmers/${selectedFarmerForInfra.id}/details`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Farmer infrastructure details updated');
      setIsInfraDrawerVisible(false);
      fetchFarmers();
    } catch (error) {
      message.error('Failed to update details');
    }
  };

  const handleDispatchBatch = async () => {
    try {
      const pendingRecords = procurements.filter(p => p.dispatchStatus === 'PENDING' || p.dispatchStatus === 'WAITING_FOR_VEHICLE');
      if (pendingRecords.length === 0) {
        return message.warning('No pending milk records available for dispatch.');
      }

      let dispatchedCount = 0;
      let totalDispatchedVolume = 0;

      for (const record of pendingRecords) {
        await axios.post(`${API_URL}/mpcs-officer/milk-procurement/${record.id}/dispatch`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        dispatchedCount += 1;
        totalDispatchedVolume += record.quantityLiters;
      }

      message.success(`Dispatched ${dispatchedCount} record(s) totaling ${totalDispatchedVolume.toFixed(1)} L.`);
      await fetchProcurementSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error dispatching batch');
    }
  };

  const printTodayProcurementPDF = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayRecords = procurements.filter(p => dayjs(p.procurementDate).format('YYYY-MM-DD') === today);

    if (!todayRecords.length) {
      message.warning('No procurement records for today to print.');
      return;
    }

    const headerHtml = `
      <style>
        body { font-family: Arial, sans-serif; color: #163f5b; margin: 20px; }
        h1 { text-align: center; margin-bottom: 24px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f6f8; font-weight: 700; }
      </style>
    `;

    const rows = todayRecords.map((r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.farmerFarmerId || r.farmerId || '-'}</td>
        <td>${r.session || '-'}</td>
        <td>${r.milkType || '-'}</td>
        <td>${r.quantityLiters || 0}</td>
        <td>${dayjs(r.procurementDate).format('DD MMM YYYY HH:mm')}</td>
        <td>${r.dispatchStatus || (r.isDispatched ? 'DISPATCHED' : 'PENDING')}</td>
      </tr>
    `).join('');

    const html = `
      <html><head><title>Today's Procurement Report</title>${headerHtml}</head><body>
        <h1>Today's Procurement Report (${today})</h1>
        <table>
          <thead>
            <tr><th>#</th><th>Farmer ID</th><th>Session</th><th>Milk Type</th><th>Quantity (L)</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      message.error('Unable to open print window.');
      return;
    }

    newWindow.document.write(html);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userProfileMenu = {
    items: [
      { key: 'profile', label: 'View Profile', icon: <UserOutlined />, onClick: () => setActiveTab('profile') },
      { type: 'divider' },
      { key: 'logout', label: 'Logout', danger: true, icon: <LogoutOutlined />, onClick: handleLogout },
    ]
  };

  // Filtered
  const filteredFarmers = farmers.filter(f =>
    (f.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (f.farmerId?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>MPCS Daily Overview</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Monitoring farmer logs, procurement summary, and session health.</p>
              </div>
              <Button icon={<BarChartOutlined />} type="default" onClick={printTodayProcurementPDF}>Print Today's Procurement PDF</Button>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="plain" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="REGISTERED FARMERS" value={farmers.length} styles={{ content: { color: '#1a5c38', fontWeight: 800 } }} prefix={<TeamOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="plain" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="MILK PROCURED (L)" value={summary.totalQuantity?.toFixed(1) || 0} styles={{ content: { color: '#1a5c38', fontWeight: 800 } }} prefix={<ExperimentOutlined style={{ background: '#f0fdf4', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="plain" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL PAYOUT (₹)" value={summary.totalAmount?.toFixed(2) || 0} styles={{ content: { color: '#1a5c38', fontWeight: 800 } }} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="plain" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TRANSACTIONS" value={summary.totalTransactions || 0} styles={{ content: { color: '#1a5c38', fontWeight: 800 } }} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={14}>
                <Card variant="plain" title={<span style={{ fontWeight: 700 }}>Recent Procurements</span>} style={{ borderRadius: '16px', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Table
                    columns={[
                      { title: 'FARMER ID', dataIndex: 'farmerFarmerId', key: 'farmerFarmerId', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
                      { title: 'SESSION', key: 'session', render: (_, r) => <Tag color="purple">{r.session || 'MORNING'}</Tag> },
                      { title: 'QTY (L)', dataIndex: 'quantityLiters', key: 'quantityLiters' },
                      { title: 'TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color="blue">{t}</Tag> },
                      { title: 'DISPATCH', dataIndex: 'isDispatched', key: 'isDispatched', render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'DISPATCHED' : 'PENDING'}</Tag> },
                      { title: 'DATE', dataIndex: 'procurementDate', key: 'procurementDate', render: t => dayjs(t).format('DD-MM-YY HH:mm') }
                    ]}
                    dataSource={procurements.slice(0, 5)}
                    pagination={false}
                    rowKey="id"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card variant="plain" title={<span style={{ fontWeight: 700 }}>Milk Type Breakdown</span>} style={{ borderRadius: '16px', minHeight: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cow', value: summary.typeCounts?.COW || 0 },
                          { name: 'Buffalo', value: summary.typeCounts?.BUFFALO || 0 },
                        ]}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#1a5c38" />
                        <Cell fill="#4ade80" />
                        <Cell fill="#fbbf24" />
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
      case 'farmers':
        return (
          <Card
            title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Farmer Database & Infra</span>}
            extra={
              <Space>
                <Search placeholder="Search ID or Name" allowClear onSearch={v => setSearchQuery(v)} style={{ width: 220 }} />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddFarmerModalVisible(true)}>Register Farmer</Button>
              </Space>
            }
            variant="plain"
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table
              columns={[
                { title: 'FARMER ID', dataIndex: 'farmerId', key: 'farmerId', render: (text) => <span style={{ fontWeight: 600 }}>{text}</span> },
                { title: 'FULL NAME', dataIndex: 'fullName', key: 'fullName', render: (text) => <span style={{ fontWeight: 500, color: '#111827' }}>{text}</span> },
                { title: 'CONTACT', dataIndex: 'phoneNumber', key: 'phoneNumber' },
                {
                  title: 'CATTLE', key: 'cattle', render: (_, record) => {
                    const count = record.cattleDetails?.list?.length || record.numberOfCattle || 0;
                    return <Tag color="orange">{count} Head</Tag>;
                  }
                },
                { title: 'STATUS', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'ACTIVE' ? 'success' : 'default'}>{s}</Tag> },
                {
                  title: 'ACTIONS',
                  key: 'actions',
                  render: (_, record) => (
                    <Button type="link" onClick={() => openInfraDrawer(record)} icon={<ToolOutlined />} style={{ color: '#1a5c38' }}>Manage Infra</Button>
                  )
                }
              ]}
              dataSource={filteredFarmers}
              rowKey="id"
              loading={loading}
            />
          </Card>
        );
      case 'milk-procurement':
        return (
          <Card
            title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Daily Milk Procurement Log</span>}
            extra={<Space>
              <Search placeholder="Search farmer / type / session" allowClear onSearch={v => setProcurementSearch(v)} style={{ width: 240 }} />
              <Button type="primary" icon={<ExperimentOutlined />} onClick={() => setIsLogMilkModalVisible(true)}>Log New Milk Session</Button>
            </Space>}
            variant="plain"
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table
              columns={[
                { title: 'FARMER ID', dataIndex: 'farmerFarmerId', key: 'farmerFarmerId' },
                { title: 'SESSION', key: 'session', render: (_, r) => <Tag color="purple">{r.session || 'MORNING'}</Tag> },
                { title: 'TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color="cyan">{t}</Tag> },
                { title: 'NET QTY', dataIndex: 'quantityLiters', key: 'quantityLiters', render: v => <span style={{ fontWeight: 700 }}>{v} L</span> },
                { title: 'DISPATCH', dataIndex: 'isDispatched', key: 'isDispatched', render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'DISPATCHED' : 'PENDING'}</Tag> },
                { title: 'SNF / FAT', key: 'snffat', render: (_, r) => <span>{r.snf || '-'}% / {r.fat || '-'}%</span> },
                { title: 'PRICE/L', dataIndex: 'pricePerLiter', key: 'pricePerLiter', render: v => `₹${v.toFixed(2)}` },
                { title: 'TOTAL', dataIndex: 'totalAmount', key: 'totalAmount', render: v => <span style={{ color: '#1a5c38', fontWeight: 700 }}>₹{v.toFixed(2)}</span> },
                { title: 'LOG DATE', dataIndex: 'procurementDate', key: 'procurementDate', render: t => dayjs(t).format('MMM DD, YYYY HH:mm') },
                { title: 'DISPATCH STATUS', dataIndex: 'dispatchStatus', key: 'dispatchStatus', render: t => {
                  let color = 'orange';
                  if (t === 'WAITING_FOR_VEHICLE') color = 'gold';
                  if (t === 'EN_ROUTE_TO_DISTRICT') color = 'geekblue';
                  if (t === 'REACHED_DISTRICT') color = 'success';
                  return <Tag color={color}>{t?.replace(/_/g, ' ') || 'PENDING'}</Tag>;
                }}
              ]}
              dataSource={procurements.filter(p => {
                const q = procurementSearch.trim().toLowerCase();
                if (!q) return true;
                return (p.farmerFarmerId || '').toLowerCase().includes(q) ||
                  (p.milkType || '').toLowerCase().includes(q) ||
                  ((p.notes || '').toLowerCase().includes(q) ||
                  ((p.isDispatched ? 'dispatched' : 'pending').includes(q)));
              })}
              rowKey="id"
              loading={loading}
            />
          </Card>
        );
      case 'dispatch':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Card
              variant="plain"
              style={{ borderRadius: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, #1a5c38 0%, #0a2e1f 100%)', color: '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Dispatch Session Batch to District Factory</h2>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>Send currently accumulated milk from farmers directly to the District Manager facility.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Ready for Dispatch</div>
                  <div style={{ fontSize: '36px', fontWeight: 800 }}>{Math.max(0, (summary.totalQuantity || 0) - (summary.dispatchedQuantity || 0)).toFixed(1)} L</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>Total Daily Collected: {summary.totalQuantity?.toFixed(1) || 0} L</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Dispatched: {(summary.dispatchedQuantity || 0).toFixed(1)} L</div>
                </div>
              </div>

              <Divider style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <Button size="large" type="default" onClick={() => handleDispatchByType('COW')} style={{ borderRadius: '8px' }}>
                  Dispatch Cow Milk
                </Button>
                <Button size="large" type="default" onClick={() => handleDispatchByType('BUFFALO')} style={{ borderRadius: '8px' }}>
                  Dispatch Buffalo Milk
                </Button>
              </div>
            </Card>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>Active Procurement Dispatch Status</h3>
            <Table
              columns={[
                { title: 'FARMER ID', dataIndex: 'farmerFarmerId', key: 'farmerFarmerId' },
                { title: 'TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color={t === 'BUFFALO' ? 'blue' : 'green'}>{t}</Tag> },
                { title: 'SESSION', dataIndex: 'session', key: 'session', render: t => <Tag color="purple">{t}</Tag> },
                { title: 'QTY', dataIndex: 'quantityLiters', key: 'quantityLiters', render: v => <span>{v} L</span> },
                { title: 'PROCUREMENT DATE', dataIndex: 'procurementDate', key: 'procurementDate', render: d => dayjs(d).format('DD MMM YYYY HH:mm') },
                { title: 'TRIP ID', dataIndex: 'assignedTripId', key: 'assignedTripId', render: v => v ? <Tag color='geekblue'>{v}</Tag> : <span>-</span> },
                { title: 'DRIVER ID', dataIndex: 'assignedDriverId', key: 'assignedDriverId', render: v => v ? <Tag color='purple'>{v}</Tag> : <span>-</span> },
                { title: 'VEHICLE ID', dataIndex: 'assignedVehicleId', key: 'assignedVehicleId', render: v => v ? <Tag color='cyan'>{v}</Tag> : <span>-</span> },
                { title: 'LOGISTICS STATUS', dataIndex: 'dispatchStatus', key: 'dispatchStatus', render: t => {
                  let color = 'default';
                  if (t === 'PENDING') color = 'orange';
                  if (t === 'WAITING_FOR_VEHICLE') color = 'gold';
                  if (t === 'EN_ROUTE_TO_DISTRICT') color = 'geekblue';
                  if (t === 'REACHED_DISTRICT') color = 'success';
                  return <Tag color={color}>{t?.replace(/_/g, ' ') || 'PENDING'}</Tag>;
                }}
              ]}
              dataSource={procurements}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              loading={loading}
            />

          </div>
        );
      case 'profile':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card variant="plain" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#1a5c38', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center', position: 'relative' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px', marginBottom: '4px' }}>{user.fullName || 'MPCS Officer'}</h1>
                <Tag color="green">{user.mpcsId || 'MPCS-000'}</Tag>
              </div>
            </Card>
          </div>
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
          style={{ background: '#0a2e1f', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}
        >
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed ? (
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>MPCS Portal</div>
            ) : (
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', width: '100%' }}>M</div>
            )}
          </div>

          <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '18px' }} />
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => { setActiveTab(key); setSearchQuery(''); }}
            style={{ background: 'transparent', borderRight: 0 }}
            items={[
              { key: 'dashboard', icon: <DashboardOutlined />, label: 'Daily Overview' },
              { key: 'farmers', icon: <TeamOutlined />, label: 'Farmer & Infra' },
              { key: 'milk-procurement', icon: <ExperimentOutlined />, label: 'Log Milk Session' },
              { key: 'dispatch', icon: <CarOutlined />, label: 'Factory Dispatch' },
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
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Cooperative Society Management</div>
            </div>

            <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
              <Space size={12} style={{ cursor: 'pointer' }}>
                {!collapsed && (
                  <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{user.fullName}</div>
                    <div style={{ fontSize: '11px', color: '#1a5c38', fontWeight: 600, textTransform: 'uppercase' }}>MPCS OFFICER</div>
                  </div>
                )}
                <Avatar size={44} style={{ backgroundColor: '#1a5c38' }} icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </Header>

          <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {renderContent()}
          </Content>
        </Layout>

        {/* --- Modals for Adding Farmer --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Register New Farmer</span>}
          open={isAddFarmerModalVisible}
          onOk={() => addFarmerForm.submit()}
          onCancel={() => setIsAddFarmerModalVisible(false)}
          okText="Register"
          okButtonProps={{ style: { background: '#1a5c38', borderColor: '#1a5c38' } }}
        >
          <Form form={addFarmerForm} onFinish={handleAddFarmer} layout="vertical">
            <Row gutter={16}>
              <Col span={12}><Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="phoneNumber" label="Phone"><Input /></Form.Item></Col>
              <Col span={24}><Form.Item name="email" label="Email Address"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="dateOfBirth" label="Date of Birth"><DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" /></Form.Item></Col>
              <Col span={12}><Form.Item name="villageId" label="Village ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="farmSize" label="Farm Size (Acres)"><InputNumber step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="numberOfCattle" label="Cattle Count"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
          </Form>
        </Modal>

        {/* --- Modal for Logging Milk --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Log Milk Procurement Session</span>}
          open={isLogMilkModalVisible}
          onOk={() => milkForm.submit()}
          onCancel={() => { setIsLogMilkModalVisible(false); setCalculatedPrice({ pricePerLiter: 0, totalPrice: 0 }); milkForm.resetFields(); }}
          okText="Submit Log"
          okButtonProps={{ style: { background: '#1a5c38', borderColor: '#1a5c38' } }}
          width={600}
        >
          <Form form={milkForm} onFinish={handleLogProcurement} layout="vertical" onFieldsChange={handleMilkFormChange}>
            <Form.Item name="farmerId" label="Select Farmer" rules={[{ required: true }]}>
              <Select placeholder="Choose Farmer" showSearch optionFilterProp="children">
                {farmers.map(f => (
                  <Option key={f.id} value={f.id}>{f.farmerId} - {f.fullName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="session" label="Collection Session" rules={[{ required: true }]} initialValue="Morning">
                  <Select>
                    <Option value="Morning">Morning</Option>
                    <Option value="Evening">Evening</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}><Form.Item name="quantityLiters" label="Volume (L)" rules={[{ required: true }]}><InputNumber step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="temperature" label="Temp (°C)"><InputNumber step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="snf" label="SNF %" rules={[{ required: true }]}><InputNumber step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="fat" label="Fat %" rules={[{ required: true }]}><InputNumber step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}>
                <Form.Item name="procurementDate" label="Specific Log Date" rules={[{ required: true, message: 'Please select log date' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD MMM YYYY HH:mm" showTime defaultValue={dayjs()} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="milkType" label="Milk Type" rules={[{ required: true }]} initialValue="COW">
                  <Select>
                    <Option value="COW">Cow</Option>
                    <Option value="BUFFALO">Buffalo</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#166534', fontWeight: 600 }}>Calculated Rate:</span>
                <span style={{ fontWeight: 700 }}>₹{calculatedPrice.pricePerLiter.toFixed(2)} / L</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                <span style={{ color: '#166534', fontWeight: 800 }}>Total Payout:</span>
                <span style={{ color: '#1a5c38', fontWeight: 900 }}>₹{calculatedPrice.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Form.Item name="notes" label="Additional Notes" style={{ marginTop: '16px' }}>
              <TextArea rows={2} />
            </Form.Item>
          </Form>
        </Modal>

        {/* --- Drawer for Infra Update --- */}
        <Drawer
          title={<span style={{ fontWeight: 800 }}>Update Farmer Infrastructure</span>}
          size={450}
          onClose={() => setIsInfraDrawerVisible(false)}
          open={isInfraDrawerVisible}
          extra={<Space><Button onClick={() => setIsInfraDrawerVisible(false)}>Cancel</Button><Button type="primary" onClick={() => infraForm.submit()} style={{ background: '#1a5c38' }}>Save Changes</Button></Space>}
        >
          {selectedFarmerForInfra && (
            <Form form={infraForm} layout="vertical" onFinish={handleUpdateInfra}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Farmer ID</h4>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{selectedFarmerForInfra.farmerId}</div>
              </div>

              <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input />
              </Form.Item>

              <Divider dashed />
              <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Farm Core Metrics</h4>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="villageId" label="Village ID">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="farmSize" label="Farm Size (Acres)">
                    <InputNumber step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="landArea" label="Land Area">
                    <Input placeholder="e.g. 5.5 acres" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="landLocation" label="Location">
                    <Input placeholder="Village Zone" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="irrigationType" label="Irrigation">
                    <Select>
                      <Option value="Borewell">Borewell</Option>
                      <Option value="Canal">Canal</Option>
                      <Option value="Rainfed">Rainfed</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider dashed />
              <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Cattle Herd Tracking</h4>
              
              <Form.Item name="cattleHealth" label="Overall Health Status">
                <Input placeholder="Excellent, Good, Monitor" />
              </Form.Item>

              <Form.List name="cattleList">
                {(fields, { add, remove }) => (
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                        <Form.Item {...restField} name={[name, 'tagNumber']} rules={[{ required: true, message: 'Tag ID needed' }]}>
                          <Input placeholder="Tag ID" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'breed']}>
                          <Input placeholder="Breed" />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'lastVaccination']}>
                          <Input type="date" placeholder="Vaccine Date" />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ef4444' }} />
                      </Space>
                    ))}
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Distinct Cattle Head
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>

              <Divider dashed />

              <Form.Item name="landDetails" label="Advanced Facility Notes">
                <TextArea rows={3} placeholder="Describe milking equipment, sheds, etc." />
              </Form.Item>
            </Form>
          )}
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
};

export default MPCSOfficerDashboard;
