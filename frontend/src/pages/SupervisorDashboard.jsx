import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Select, DatePicker, Tabs, Input
} from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);

  // Tasks from backend + LocalStorage fallback
  const [myTasks, setMyTasks] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [collectionTasks, setCollectionTasks] = useState([]);
  const [operators, setOperators] = useState([]);
  const [machineSearch, setMachineSearch] = useState('');
  const [machineStatusFilter, setMachineStatusFilter] = useState('ALL');
  const [isAssignOpModalVisible, setIsAssignOpModalVisible] = useState(false);
  const [selectedTaskForOp, setSelectedTaskForOp] = useState(null);
  const [assignOpForm] = Form.useForm();
  
  const [chillerTanks, setChillerTanks] = useState([]);
  const [isMoveToChillerModalVisible, setIsMoveToChillerModalVisible] = useState(false);
  const [selectedDispatchForChiller, setSelectedDispatchForChiller] = useState(null);
  const [moveForm] = Form.useForm();

  const [machineData, setMachineData] = useState([]);

  // Use sessionStorage for per-tab identity (so multiple tabs stay independent)
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'));
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const currentToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    if (!currentToken || currentUser.role !== 'SUPERVISOR') {
      navigate('/login');
      return;
    }
    loadData();
    // Poll for localStorage dispatch changes (from MPCS officer dispatching)
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCollectionTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/supervisor/collection-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setCollectionTasks(response.data.data);
        setMyTasks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load collection tasks', error);
    }
  };

  const fetchChillerTanks = async () => {
    try {
      const response = await axios.get(`${API_URL}/supervisor/chiller-tanks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success) {
        setChillerTanks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load chiller tanks', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API_URL}/hierarchy/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.success) {
        setMachineData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load machines', error);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await axios.get(`${API_URL}/supervisor/operators`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.success) {
        setOperators(response.data.data.map(o => ({ ...o, status: 'AVAILABLE' })));
      }
    } catch (e) {
      console.error('Failed to load real operators');
    }
  };

  const loadData = async () => {
    const freshUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    if (freshUser.specialization === 'COLLECTION') {
      await fetchCollectionTasks();
      await fetchChillerTanks();
      await fetchMachines();
      await fetchOperators();
    } else if (freshUser.specialization === 'PRODUCTION') {
      await fetchOperators();
      await fetchMachines();
      // fetchWorkAssignments already exists but we'll call it here
      const savedBatches = localStorage.getItem('districtBatches');
      if (savedBatches) {
          const allB = JSON.parse(savedBatches);
          // Filter batches where this supervisor is assigned correctly
          setMyBatches(allB.filter(b => b.assignedSupervisor === freshUser.fullName));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleReceiveMilk = async (procurementId) => {
    try {
      await axios.patch(`${API_URL}/supervisor/collection-tasks/${procurementId}/collect`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(`Milk Intake Recorded Successfully!`);
      await fetchCollectionTasks();
      loadData();
    } catch (error) {
      message.error('Failed to record milk intake');
    }
  };

  const handleMoveToChiller = async (record) => {
    setSelectedDispatchForChiller(record);
    setIsMoveToChillerModalVisible(true);
    // Auto-select tank by milk type
    const suggestedTank = chillerTanks.find(t => t.milkType === record.milkType);
    if (suggestedTank) {
        moveForm.setFieldsValue({ chillerTankId: suggestedTank.id });
    }
  };

  const handleConfirmMoveToChiller = async (values) => {
    try {
      await axios.patch(`${API_URL}/supervisor/collection-tasks/${selectedDispatchForChiller.id}/complete`, {
          chillerTankId: values.chillerTankId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(`Milk moved to selected Chiller Tank successfully!`);
      setIsMoveToChillerModalVisible(false);
      await fetchCollectionTasks();
      await fetchChillerTanks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to move to chiller');
    }
  };

  const handleCompleteBatchStep = (batchId) => {
    const sequence = [
      'CLARIFICATION', 'CLARIFICATION_DONE',
      'PASTEURIZATION', 'PASTEURIZATION_DONE',
      'HOMOGENIZATION', 'HOMOGENIZATION_DONE',
      'PACKING', 'PACKING_DONE',
      'DELIVERY'
    ];

    const savedBatches = JSON.parse(localStorage.getItem('districtBatches') || '[]');
    const updated = savedBatches.map(b => {
      if (b.id === batchId) {
        const currentIndex = sequence.indexOf(b.status);
        const nextStatus = sequence[currentIndex + 1] || b.status;

        return {
          ...b,
          status: nextStatus,
          assignedSupervisor: null,
          supervisorId: null,
          assignedOperator: null
        };
      }
      return b;
    });
    localStorage.setItem('districtBatches', JSON.stringify(updated));
    message.success(`Stage marked as completed! Pipeline updated.`);
    loadData();
  };

  const handleAssignOperator = (values) => {
    const op = operators.find(o => o.id === values.operatorId);

    // Update local batches or tasks
    const savedBatches = JSON.parse(localStorage.getItem('districtBatches') || '[]');
    const updatedB = savedBatches.map(b => {
      if (b.id === selectedTaskForOp) {
        return { ...b, assignedOperator: op.fullName, operatorStatus: 'WORKING' };
      }
      return b;
    });
    localStorage.setItem('districtBatches', JSON.stringify(updatedB));

    message.success(`Operator ${op.fullName} assigned to task.`);
    setIsAssignOpModalVisible(false);
    loadData();
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
      case 'tasks':
        return (
          <>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>
                {user.specialization === 'COLLECTION' ? 'Milk Reception Control' : 'Factory Floor Assignments'}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>
                {user.specialization === 'COLLECTION' ? 'Recording intake and moving milk to chiller storage.' : 'Managing factory processes and production batches.'}
              </p>
            </div>

            {user.specialization === 'COLLECTION' && (
              <Card
                title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Milk In-take Tasks (Waiting for Reception)</span>}
                variant="borderless"
                style={{ borderRadius: '16px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
              >
                <Table
                  columns={[
                    { title: 'BATCH ID', dataIndex: 'dispatchId', key: 'dispatchId', render: id => <span style={{ fontSize: '12px' }}>{id}</span> },
                    { title: 'MPCS CENTER', dataIndex: 'mpcsName', key: 'mpcsName', render: n => <b style={{ color: '#312e81' }}>{n}</b> },
                    { title: 'MILK TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color={t === 'COW' ? 'blue' : 'gold'}>{t}</Tag> },
                    { title: 'QTY (L)', dataIndex: 'totalQuantity', key: 'totalQuantity', render: q => <span style={{ fontWeight: 700 }}>{q} L</span> },
                    {
                      title: 'LOGISTICS STATUS', dataIndex: 'status', key: 'status', render: s => (
                        <Tag color={s === 'MOVED_TO_CHILLER' ? 'success' : s === 'REACHED_DISTRICT' ? 'warning' : 'processing'}>
                          {s ? s.replace(/_/g, ' ') : 'UNKNOWN'}
                        </Tag>
                      )
                    },
                    {
                      title: 'OPERATIONAL STEP',
                      key: 'action',
                      render: (_, record) => {
                        if (record.status === 'REACHED_DISTRICT') {
                          return (
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleReceiveMilk(record.id)}>
                              Mark Received at District
                            </Button>
                          );
                        }
                        if (record.status === 'RECEIVED_BY_DISTRICT') {
                          return (
                            <Button type="primary" size="small" style={{ background: '#10b981', borderColor: '#10b981' }} icon={<ThunderboltOutlined />} onClick={() => handleMoveToChiller(record)}>
                              Move to Chiller Tank
                            </Button>
                          );
                        }
                        if (record.status === 'MOVED_TO_CHILLER') {
                          return <Tag color="green">In Chiller Storage</Tag>;
                        }

                        return <Tag color="default">In Transit to District</Tag>;
                      }
                    }
                  ]}
                  dataSource={collectionTasks}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )}

            {user.specialization === 'PRODUCTION' && (
              <Card
                title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Active Production Batches</span>}
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
              >
                <Table
                  columns={[
                    { title: 'BATCH ID', dataIndex: 'id', key: 'id' },
                    { title: 'PROCESS', dataIndex: 'status', key: 'status', render: s => <Tag color="blue">{s.replace(/_/g, ' ')}</Tag> },
                    { title: 'STARTED AT', dataIndex: 'createdAt', key: 'createdAt' },
                    { title: 'OPERATOR', dataIndex: 'assignedOperator', key: 'assignedOperator', render: op => op ? <Tag color="orange">{op}</Tag> : <Tag>Unassigned</Tag> },
                    {
                      title: 'ACTIONS',
                      key: 'action',
                      render: (_, record) => (
                        <Space>
                          {!record.assignedOperator && (
                            <Button size="small" onClick={() => { setSelectedTaskForOp(record.id); setIsAssignOpModalVisible(true); }}>
                              Assign Operator
                            </Button>
                          )}
                          {record.status !== 'DELIVERED_TO_RETAIL_DONE' && (
                            <Button type="primary" ghost size="small" icon={<ThunderboltOutlined />} onClick={() => handleCompleteBatchStep(record.id)} disabled={!record.assignedOperator}>
                              Review & Complete
                            </Button>
                          )}
                        </Space>
                      )
                    }
                  ]}
                  dataSource={myBatches}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            )}
          </>
        );
      case 'operators':
        return (
          <Card
            title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Floor Staff (Operators)</span>}
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table
              columns={[
                { title: 'STAFF ID', dataIndex: 'id', key: 'id' },
                { title: 'NAME', dataIndex: 'fullName', key: 'fullName', render: n => <span style={{ fontWeight: 600 }}>{n}</span> },
                { title: 'STATUS', dataIndex: 'status', key: 'status', render: s => <Tag color="success">{s}</Tag> },
                { title: 'ASSIGNMENT', key: 'work', render: () => <span>Awaiting Task...</span> }
              ]}
              dataSource={operators}
              rowKey="id"
            />
          </Card>
        );
      case 'machines':
        const machineImages = {
            CLARIFIER: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
            PASTEURIZER: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400',
            HOMOGENIZER: 'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?auto=format&fit=crop&q=80&w=400',
            PACKER: 'https://images.unsplash.com/photo-1565463741600-9fed8e132717?auto=format&fit=crop&q=80&w=400'
        };

        const filteredMachines = machineData.filter(m => {
          const matchSearch = (m.name || '').toLowerCase().includes(machineSearch.toLowerCase()) || (m.machineId || '').toLowerCase().includes(machineSearch.toLowerCase());
          const matchStatus = machineStatusFilter === 'ALL' || m.status === machineStatusFilter;
          return matchSearch && matchStatus;
        });

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>Plant Floor Units</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Technical status and real-time processing metrics of plant machinery.</p>
              </div>
              <Space size="middle">
                <Input.Search
                  placeholder="ID or Name"
                  style={{ width: 220 }}
                  onChange={e => setMachineSearch(e.target.value)}
                />
                <Select
                  defaultValue="ALL"
                  style={{ width: 150 }}
                  onChange={setMachineStatusFilter}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'RUNNING', label: 'Running' },
                    { value: 'IDLE', label: 'Idle' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                  ]}
                />
              </Space>
            </div>

            <Row gutter={[24, 24]}>
              {filteredMachines.map(m => (
                <Col xs={24} md={12} xl={6} key={m.id}>
                  <Card
                    hoverable
                    cover={<div style={{ height: '180px', overflow: 'hidden' }}><img alt={m.name} src={m.imageUrl || machineImages[m.type]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                    styles={{ body: { padding: '20px' } }}
                    variant="borderless"
                    style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.machineId}</div>
                        <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 700, color: '#111827' }}>{m.name}</h3>
                        <Tag color="blue">{m.type}</Tag>
                      </div>
                      <Tag color={m.status === 'RUNNING' ? 'success' : m.status === 'IDLE' ? 'warning' : m.status === 'MAINTENANCE' ? 'error' : 'default'} style={{ borderRadius: '4px', margin: 0 }}>
                        {m.status}
                      </Tag>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {m.status === 'RUNNING' ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Processing: <b>{m.currentBatchId || 'Unknown'}</b></span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#312e81' }}>{m.progress || 0}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#312e81', width: `${m.progress}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '32px', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                        Unit is currently {m.status.toLowerCase()}...
                      </div>
                    )}

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                      <Button size="small" type="primary" ghost style={{ borderRadius: '4px' }}>Diagnosis</Button>
                      <Button size="small" type="link">Tech Sheet</Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        );
      case 'profile':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card variant="borderless" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#1e1b4b', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px' }}>{user.fullName || 'Supervisor'}</h1>
                <Tag color={user.specialization === 'COLLECTION' ? 'purple' : 'indigo'}>
                  {user.specialization === 'COLLECTION' ? 'COLLECTION & CHILLER' : 'FACTORY PRODUCTION'} SUPERVISOR
                </Tag>
              </div>
              <Divider />
              <Row gutter={24} style={{ padding: '0 24px 24px' }}>
                <Col span={12}>
                  <div style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Employee ID</div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{user.supId || 'SUP-001'}</div>
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
          style={{ background: '#1e1b4b', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}
        >
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed ? (
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>Supervisor Portal</div>
            ) : (
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', width: '100%' }}>S</div>
            )}
          </div>

          <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '18px' }} />
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            style={{ background: 'transparent', borderRight: 0 }}
            items={[
              { key: 'tasks', icon: <ToolOutlined />, label: user.specialization === 'COLLECTION' ? 'Milk In-take Control' : 'Factory Floor Tasks' },
              { key: 'machines', icon: <SettingOutlined />, label: user.specialization === 'COLLECTION' ? 'Chiller Status' : 'Machine Status' },
              { key: 'operators', icon: <TeamOutlined />, label: 'Manage Operators' },
              { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
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
              <div style={{ width: '4px', height: '20px', background: '#312e81', borderRadius: '2px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Supervisor Operations Control</div>
            </div>

            <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
              <Space size={12} style={{ cursor: 'pointer' }}>
                {!collapsed && (
                  <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{user.fullName || 'Supervisor'}</div>
                    <div style={{ fontSize: '11px', color: '#312e81', fontWeight: 600, textTransform: 'uppercase' }}>
                      {user.specialization === 'COLLECTION' ? 'COLLECTION' : 'PLANT'} SUPERVISOR
                    </div>
                  </div>
                )}
                <Avatar size={44} style={{ backgroundColor: '#312e81' }} icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </Header>

          <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>

      <Modal
        title={<span style={{ fontWeight: 800 }}>Assign Field Operator</span>}
        open={isAssignOpModalVisible}
        onOk={() => assignOpForm.submit()}
        onCancel={() => setIsAssignOpModalVisible(false)}
        okText="Start Assignment"
      >
        <Form form={assignOpForm} onFinish={handleAssignOperator} layout="vertical">
          <Form.Item name="operatorId" label="Choose Operator" rules={[{ required: true }]}>
            <Select placeholder="Select an operator">
              {operators.map(o => (
                <Option key={o.id} value={o.id}>{o.fullName} ({o.id})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ fontWeight: 800 }}>Transfer Milk to Chiller Tank</span>}
        open={isMoveToChillerModalVisible}
        onOk={() => moveForm.submit()}
        onCancel={() => setIsMoveToChillerModalVisible(false)}
        okText="Transfer Now"
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#0369a1' }}>BATCH TO STORE:</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{selectedDispatchForChiller?.totalQuantity} Liters of {selectedDispatchForChiller?.milkType} MILK</p>
        </div>
        <Form form={moveForm} onFinish={handleConfirmMoveToChiller} layout="vertical">
          <Form.Item name="chillerTankId" label="Choose Chiller Tank" rules={[{ required: true }]}>
            <Select placeholder="Select storage tank">
              {chillerTanks && chillerTanks.filter(t => t.milkType === selectedDispatchForChiller?.milkType).map(t => (
                <Option key={t.id} value={t.id}>
                    {t.name} - Current: {t.currentLevel}/{t.capacity}L
                </Option>
              ))}
              {chillerTanks && !chillerTanks.some(t => t.milkType === selectedDispatchForChiller?.milkType) && (
                <Option disabled value="none">No {selectedDispatchForChiller?.milkType} Tanks Available</Option>
              )}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default SupervisorDashboard;

