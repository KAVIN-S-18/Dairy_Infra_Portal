import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Input, Popconfirm, Select, DatePicker, Tabs, InputNumber, Steps
} from 'antd';
import {
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  ToolOutlined,
  TruckOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  MenuFoldOutlined,
  PlusOutlined,
  DeleteOutlined,
  MenuUnfoldOutlined,
  ExperimentOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const DistrictManagerDashboard = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);
  const [staffForm] = Form.useForm();
  const [staffType, setStaffType] = useState('supervisor');
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState(null);
  const [assignForm] = Form.useForm();
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [batchForm] = Form.useForm();
  const [districtBatches, setDistrictBatches] = useState([]);
  const [busySupervisors, setBusySupervisors] = useState({}); // { supervisorId: true }
  const [isNextStageModalVisible, setIsNextStageModalVisible] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [nextStageForm] = Form.useForm();
  const [machineData, setMachineData] = useState([]);
  const [machineSearch, setMachineSearch] = useState('');
  const [machineStatusFilter, setMachineStatusFilter] = useState('ALL');

  const defaultMachines = [
    { id: 'MCH-001', name: 'Industrial Chiller Unit A', type: 'CHILLING', status: 'IDLE', batch: null, progress: 0, image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400' },
    { id: 'MCH-002', name: 'Pasteurizer System B2', type: 'PASTEURIZATION', status: 'IDLE', batch: null, progress: 0, image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400' },
    { id: 'MCH-003', name: 'Homogenizer Master-4', type: 'HOMOGENIZATION', status: 'IDLE', batch: null, progress: 0, image: 'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?auto=format&fit=crop&q=80&w=400' },
    { id: 'MCH-004', name: 'Auto-Packer Unit 01', type: 'PACKING', status: 'IDLE', batch: null, progress: 0, image: 'https://images.unsplash.com/photo-1565463741600-9fed8e132717?auto=format&fit=crop&q=80&w=400' },
  ];

  // Staff Management State
  const [supervisors, setSupervisors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [mpcsOfficers, setMpcsOfficers] = useState([]);
  const [transportManagers, setTransportManagers] = useState([]);

  // Mock Live Tracking Operations state
  const [ongoingProcesses, setOngoingProcesses] = useState([
    { id: 1, role: 'OPERATOR', name: 'John Doe', task: 'Monitoring Chilling Unit A', status: 'ACTIVE', startTime: dayjs().subtract(2, 'hours').format('HH:mm') },
    { id: 2, role: 'SUPERVISOR', name: 'Jane Smith', task: 'Quality Audit - Batch 483', status: 'ACTIVE', startTime: dayjs().subtract(45, 'minutes').format('HH:mm') },
    { id: 3, role: 'TRANSPORT', name: 'Mike Johnson', task: 'Driving Route 4', status: 'IN_TRANSIT', startTime: dayjs().subtract(1, 'hours').format('HH:mm') },
  ]);

  // District Tank Array
  const [districtDispatches, setDistrictDispatches] = useState([]);
  const [chillerVolume, setChillerVolume] = useState(0);

  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'));
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const syncUser = () => {
      setUser(JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}'));
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  useEffect(() => {
    if (!token || user.role !== 'DISTRICT_MANAGER') {
      navigate('/login');
      return;
    }
    fetchStaff();
    fetchTransportManagers();

    const savedMachines = localStorage.getItem('districtMachines');
    if (savedMachines) {
      setMachineData(JSON.parse(savedMachines));
    } else {
      setMachineData(defaultMachines);
      localStorage.setItem('districtMachines', JSON.stringify(defaultMachines));
    }

    const savedDispatches = localStorage.getItem('mpcsDispatches');
    if (savedDispatches) {
      setDistrictDispatches(JSON.parse(savedDispatches));
    } else {
      setDistrictDispatches([
        { id: 'DSP-1001', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), quantity: 450, status: 'EN_ROUTE_TO_DISTRICT' },
      ]);
    }

    const savedChiller = localStorage.getItem('districtChillerVolume');
    if (savedChiller) {
      setChillerVolume(parseFloat(savedChiller));
    }

    const savedBatches = localStorage.getItem('districtBatches');
    if (savedBatches) {
      setDistrictBatches(JSON.parse(savedBatches));
    }

    const syncData = () => {
      const d = localStorage.getItem('mpcsDispatches');
      const b = localStorage.getItem('districtBatches');
      const v = localStorage.getItem('districtChillerVolume');
      const m = localStorage.getItem('districtMachines');
      if (d) setDistrictDispatches(JSON.parse(d));
      if (b) setDistrictBatches(JSON.parse(b));
      if (v) setChillerVolume(parseFloat(v));
      if (m) setMachineData(JSON.parse(m));
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    window.addEventListener('storage', syncData);
    return () => window.removeEventListener('storage', syncData);
  }, []);

  // Derivatively track busy supervisors from active tasks
  useEffect(() => {
    const busy = {};
    districtDispatches.forEach(d => {
      if (d.status === 'MOVING_TO_CHILLER' && d.assignedSupervisorId) {
        busy[d.assignedSupervisorId] = true;
      }
    });
    districtBatches.forEach(b => {
      if (b.status !== 'DELIVERED_TO_RETAIL' && b.supervisorId) {
        busy[b.supervisorId] = true;
      }
    });
    setBusySupervisors(busy);
  }, [districtDispatches, districtBatches]);

  // Auth guard — uses sessionStorage for per-tab isolation
  useEffect(() => {
    const currentToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
    if (!currentToken || currentUser.role !== 'DISTRICT_MANAGER') {
      navigate('/login');
    }
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/hierarchy/district-managers/${user.dmId}/staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSupervisors(response.data.supervisors || []);
      setOperators(response.data.operators || []);
      setMpcsOfficers(response.data.mpcsOfficers || []);
    } catch (error) {
      // Mock Data if API fails initially
    }
  };

  const fetchTransportManagers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/hierarchy/district-managers/${user.dmId}/transport-managers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransportManagers(response.data || []);
    } catch (error) { }
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

  const handleAddStaff = async (values) => {
    try {
      const endpoint = {
        supervisor: '/api/hierarchy/supervisors',
        operator: '/api/hierarchy/operators',
        'mpcs-officer': '/api/hierarchy/mpcs-officers',
        'transport-manager': '/api/hierarchy/transport-managers',
      }[staffType];

      await axios.post(
        `http://localhost:5000${endpoint}`,
        { dmId: user.dmId, ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success(`${staffType.toUpperCase()} created successfully`);
      staffForm.resetFields();
      setIsStaffModalVisible(false);
      fetchStaff();
      if (staffType === 'transport-manager') fetchTransportManagers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Simulating Staff Creation locally');
      // Fallback for visual demonstration
      setIsStaffModalVisible(false);
    }
  };



  // Automated Dispatch Assignment Logic
  useEffect(() => {
    const collSup = supervisors.find(s => s.specialization === 'COLLECTION');
    if (collSup && districtDispatches.length > 0) {
      const needsAssignment = districtDispatches.some(d => d.status === 'RECEIVED_AT_DISTRICT' && !d.assignedSupervisorId);
      if (needsAssignment) {
        const updated = districtDispatches.map(d => {
          if (d.status === 'RECEIVED_AT_DISTRICT' && !d.assignedSupervisorId) {
            return {
              ...d,
              status: 'MOVING_TO_CHILLER',
              assignedSupervisor: collSup.fullName,
              assignedSupervisorId: collSup.id
            };
          }
          return d;
        });
        setDistrictDispatches(updated);
        localStorage.setItem('mpcsDispatches', JSON.stringify(updated));
      }
    }
  }, [supervisors, districtDispatches]);

  const handleCreateBatch = (values) => {
    if (values.quantity > chillerVolume) {
      message.error('Insufficient milk in chilling plant!');
      return;
    }

    // Mapping of all pre-assigned supervisors
    const stageSupervisors = {
      CHILLING: supervisors.find(s => s.id === values.supChilling)?.fullName,
      PASTEURIZATION: supervisors.find(s => s.id === values.supPasteurize)?.fullName,
      HOMOGENIZATION: supervisors.find(s => s.id === values.supHomogenize)?.fullName,
      PACKAGING: supervisors.find(s => s.id === values.supPackaging)?.fullName,
      STORAGE: supervisors.find(s => s.id === values.supStorage)?.fullName,
      DELIVERY: supervisors.find(s => s.id === values.supDelivery)?.fullName,
    };

    const newBatch = {
      id: `BATCH-${Date.now().toString().slice(-4)}`,
      quantity: values.quantity,
      status: 'CHILLING',
      machineId: 'MCH-001',
      stageSupervisors,
      // Current active supervisor is the one for the CHILLING stage
      assignedSupervisor: stageSupervisors.CHILLING,
      assignedOperator: null,
      operatorId: null,
      stageProgress: 0,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    const updatedBatches = [newBatch, ...districtBatches];
    setDistrictBatches(updatedBatches);
    localStorage.setItem('districtBatches', JSON.stringify(updatedBatches));

    // Update first machine status
    const updatedMachines = machineData.map(m => m.id === 'MCH-001' ? { ...m, status: 'RUNNING', batch: newBatch.id, progress: 0 } : m);
    setMachineData(updatedMachines);
    localStorage.setItem('districtMachines', JSON.stringify(updatedMachines));

    // Deduct from chiller
    const newVol = chillerVolume - values.quantity;
    setChillerVolume(newVol);
    localStorage.setItem('districtChillerVolume', newVol.toString());

    message.success(`Production Batch ${newBatch.id} created with all supervisors pre-assigned!`);
    setIsBatchModalVisible(false);
    batchForm.resetFields();
  };

  const handleAssignBatchSupervisor = (values) => {
    const supervisor = supervisors.find(s => s.id === values.supervisorId);

    const updatedBatches = districtBatches.map(b => {
      if (b.id === selectedBatchId) {
        const sequence = [
          'CHILLING', 'CHILLING_DONE',
          'PASTEURIZATION', 'PASTEURIZATION_DONE',
          'HOMOGENIZATION', 'HOMOGENIZATION_DONE',
          'PACKAGING', 'PACKAGING_DONE',
          'STORAGE', 'STORAGE_DONE',
          'DELIVERY'
        ];
        const currentIndex = sequence.indexOf(b.status);
        const nextStatus = sequence[currentIndex + 1] || b.status;

        // Auto-assign the pre-defined supervisor for the next stage if it's an active stage
        const nextSupervisor = b.stageSupervisors[nextStatus] || b.assignedSupervisor;

        return {
          ...b,
          status: nextStatus,
          assignedSupervisor: nextSupervisor,
          assignedOperator: null
        };
      }
      return b;
    });

    setDistrictBatches(updatedBatches);
    localStorage.setItem('districtBatches', JSON.stringify(updatedBatches));
    message.success(`New supervisor assigned for next stage of ${selectedBatchId}`);
    setIsNextStageModalVisible(false);
    nextStageForm.resetFields();
  };

  const getReceptionStatusStep = (status) => {
    switch (status) {
      case 'RECEIVED_AT_DISTRICT': return 2;
      case 'MOVING_TO_CHILLER': return 3;
      case 'MILK_IN_CHILLING_PLANT': return 4;
      default: return 0;
    }
  };

  const getBatchStatusStep = (status) => {
    const sequence = [
      'CHILLING', 'CHILLING_DONE',
      'PASTEURIZATION', 'PASTEURIZATION_DONE',
      'HOMOGENIZATION', 'HOMOGENIZATION_DONE',
      'PACKAGING', 'PACKAGING_DONE',
      'STORAGE', 'STORAGE_DONE',
      'DELIVERY'
    ];
    const index = sequence.findIndex(s => s === status);
    if (index === -1) return 0;
    return Math.ceil(index / 2);
  };

  const renderReceptionPipeline = (record) => {
    const current = getReceptionStatusStep(record.status);
    return (
      <Card style={{ margin: '0 50px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}>
        <h4 style={{ fontWeight: 800, marginBottom: '20px' }}>Tracking Status: {record.id}</h4>
        <Steps
          size="small"
          current={current}
          items={[
            { title: 'Dispatched', description: 'From MPCS', subTitle: record.date },
            { title: 'Logistics', description: 'Automatic Arrival' },
            { title: 'At District', description: 'Factory Entry' },
            { title: 'To Chiller', description: record.assignedSupervisor || 'In Progress' },
            { title: 'Stored', description: 'Chiller Tank Unit' },
          ]}
        />
        <Divider />
        <div style={{ display: 'flex', gap: '40px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Assigned Supervisor</div>
            <div style={{ fontWeight: 600 }}>{record.assignedSupervisor || 'Awaiting Assignment'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Carrier Details</div>
            <div style={{ fontWeight: 600 }}>Logistics Unit G-1</div>
          </div>
        </div>
      </Card>
    );
  };

  const renderBatchPipeline = (record) => {
    const current = getBatchStatusStep(record.status);
    const stages = ['CHILLING', 'PASTEURIZATION', 'HOMOGENIZATION', 'PACKAGING', 'STORAGE', 'DELIVERY'];

    return (
      <Card style={{ margin: '0 50px', borderRadius: '12px', border: '1px solid #dcfce7', background: '#fff' }}>
        <h4 style={{ fontWeight: 800, marginBottom: '20px' }}>Batch Production Pipeline: {record.id}</h4>
        <Steps
          size="small"
          current={current}
          direction="horizontal"
          items={stages.map(s => ({
            title: s.charAt(0) + s.slice(1).toLowerCase(),
            description: record.stageSupervisors?.[s] || 'Pending Assignment'
          }))}
        />
        <Divider />
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Current Supervisor</div>
            <div style={{ fontWeight: 600, color: '#093a3e' }}>{record.assignedSupervisor || 'None'}</div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Active Operator</div>
            <div style={{ fontWeight: 600 }}>{record.assignedOperator || 'Supervisor Assigning...'}</div>
          </Col>
          <Col span={8}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Current Stage</div>
            <Tag color="cyan" style={{ fontWeight: 700 }}>{record.status.replace(/_/g, ' ')}</Tag>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>District Operations Overview</h1>
                <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Monitoring supply chain flows, chilling volumes, and staff health.</p>
              </div>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL STAFF UNDER DM" value={supervisors.length + operators.length + mpcsOfficers.length + transportManagers.length || 12} valueStyle={{ color: '#093A3E', fontWeight: 800 }} prefix={<TeamOutlined style={{ background: '#f0fdff', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="CHILLING TANK VOLUME" value={chillerVolume} precision={1} suffix="L" valueStyle={{ color: '#0369a1', fontWeight: 800 }} prefix={<ExperimentOutlined style={{ background: '#f0f9ff', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="ACTIVE PROCESSES" value={ongoingProcesses.length} valueStyle={{ color: '#ea580c', fontWeight: 800 }} prefix={<ThunderboltOutlined style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TRANSIT INBOUND" value={districtDispatches.filter(d => d.status === 'EN_ROUTE_TO_DISTRICT').length} valueStyle={{ color: '#059669', fontWeight: 800 }} prefix={<TruckOutlined style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={14}>
                <Card title={<span style={{ fontWeight: 700 }}>Inbound MPCS Volumes (Past 7 Days)</span>} bordered={false} style={{ borderRadius: '16px', minHeight: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Mon', volume: 4000 }, { name: 'Tue', volume: 3000 },
                      { name: 'Wed', volume: 2000 }, { name: 'Thu', volume: 2780 },
                      { name: 'Fri', volume: 1890 }, { name: 'Sat', volume: 2390 }, { name: 'Sun', volume: 3490 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="volume" fill="#0369a1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title={<span style={{ fontWeight: 700 }}>Staff Distribution Chart</span>} bordered={false} style={{ borderRadius: '16px', minHeight: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Operators', value: operators.length || 4 },
                          { name: 'Supervisors', value: supervisors.length || 2 },
                          { name: 'MPCS Officers', value: mpcsOfficers.length || 5 },
                          { name: 'Transport', value: transportManagers.length || 3 }
                        ]}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#0088fe" />
                        <Cell fill="#00c49f" />
                        <Cell fill="#ffbb28" />
                        <Cell fill="#ff8042" />
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </>
        );
      case 'operations':
        return (
          <Card
            title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Live Process & Fleet Monitoring</span>}
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Table
              columns={[
                { title: 'ROLE', key: 'role', dataIndex: 'role', render: t => <Tag color={t === 'OPERATOR' ? 'blue' : t === 'SUPERVISOR' ? 'volcano' : 'purple'}>{t}</Tag> },
                { title: 'STAFF NAME', dataIndex: 'name', key: 'name', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
                { title: 'CURRENT TASK', dataIndex: 'task', key: 'task' },
                { title: 'STARTED AT', dataIndex: 'startTime', key: 'startTime' },
                { title: 'STATUS', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'ACTIVE' ? 'success' : 'processing'}><CheckCircleOutlined /> {s}</Tag> }
              ]}
              dataSource={ongoingProcesses}
              pagination={false}
              rowKey="id"
            />
          </Card>
        );
      case 'chilling':
        return (
          <>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <Card
                bordered={false}
                style={{ borderRadius: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, #0369a1 0%, #082f49 100%)', color: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Milk Reception & Chilling Tanks</h2>
                    <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>Receive dispatched milk from MPCS units directly into the District Chilling infrastructure.</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Current Tank Volume</div>
                    <div style={{ fontSize: '36px', fontWeight: 800 }}>{chillerVolume.toFixed(1)} L</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>Main Silo: Operating optimally at 4°C</div>
                  </div>
                </div>
              </Card>

              <Card
                title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Inbound Dispatches from MPCS Branches</span>}
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
              >
                <Table
                  columns={[
                    { title: 'DISPATCH ID', dataIndex: 'id', key: 'id', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
                    { title: 'DATE', dataIndex: 'date', key: 'date' },
                    { title: 'INBOUND QTY', dataIndex: 'quantity', key: 'quantity', render: v => <span style={{ fontWeight: 700 }}>{v} L</span> },
                    {
                      title: 'STATUS', dataIndex: 'status', key: 'status', render: s => (
                        <Tag color={s === 'EN_ROUTE_TO_DISTRICT' ? 'warning' : s === 'MOVING_TO_CHILLER' ? 'processing' : 'success'}>
                          {s === 'MOVING_TO_CHILLER' ? 'MOVING TO CHILLER' : s === 'MILK_IN_CHILLING_PLANT' ? 'IN CHILLING PLANT' : s.replace(/_/g, ' ')}
                        </Tag>
                      )
                    },
                    {
                      title: 'PROCUREMENT STATUS',
                      key: 'actions',
                      render: (_, record) => {
                        if (record.status === 'MOVING_TO_CHILLER') return (
                          <Space>
                            <Tag color="blue" icon={<ThunderboltOutlined />}>Collection In Progress</Tag>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>by {record.assignedSupervisor}</span>
                          </Space>
                        );
                        if (record.status === 'MILK_IN_CHILLING_PLANT') return <Tag color="green"><CheckCircleOutlined /> Received & Stored</Tag>;
                        return <Tag color="orange">Awaiting Logistics</Tag>;
                      }
                    }
                  ]}
                  dataSource={districtDispatches}
                  pagination={false}
                  rowKey="id"
                  expandable={{
                    expandedRowRender: record => renderReceptionPipeline(record),
                    defaultExpandAllRows: false,
                  }}
                />
              </Card>

              <Divider style={{ margin: '40px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>Active Production Batches</h3>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBatchModalVisible(true)} style={{ background: '#1a5c38' }}>
                  Create New Batch
                </Button>
              </div>

              <Table
                columns={[
                  { title: 'BATCH ID', dataIndex: 'id', key: 'id' },
                  { title: 'QTY (L)', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'SUPERVISOR', dataIndex: 'assignedSupervisor', key: 'assignedSupervisor', render: s => s || <i style={{ color: '#94a3b8' }}>Unassigned</i> },
                  {
                    title: 'PROCESS', dataIndex: 'status', key: 'status', render: s => (
                      <Tag color={s.includes('_DONE') ? 'orange' : 'blue'}>
                        {s.replace(/_/g, ' ')}
                      </Tag>
                    )
                  },
                  {
                    title: 'ACTIONS', key: 'state', render: (_, record) => (
                      record.status.includes('_DONE') && record.status !== 'DELIVERED_TO_RETAIL_DONE' ? (
                        <Button size="small" type="primary" onClick={() => { setSelectedBatchId(record.id); setIsNextStageModalVisible(true); }}>
                          Assign Next Stage
                        </Button>
                      ) : record.status === 'DELIVERED_TO_RETAIL_DONE' ? <Tag color="green">FINISHED</Tag> : <Tag color="processing">ONGOING</Tag>
                    )
                  }
                ]}
                dataSource={districtBatches}
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: record => renderBatchPipeline(record),
                  defaultExpandAllRows: true,
                }}
              />
            </div>
          </>
        );
      case 'staff':
        return (
          <Card
            title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Member Management</span>}
            extra={<Button type="primary" icon={<PlusOutlined />} style={{ background: '#093A3E' }} onClick={() => setIsStaffModalVisible(true)}>Add Member</Button>}
            bordered={false}
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <Tabs>
              <Tabs.TabPane tab="Supervisors" key="supervisors">
                <Table
                  columns={[
                    { title: 'ID', dataIndex: 'supId' },
                    { title: 'Name', dataIndex: 'fullName' },
                    { title: 'Role', dataIndex: 'specialization', render: s => <Tag color={s === 'COLLECTION' ? 'purple' : 'blue'}>{s || 'PRODUCTION'}</Tag> },
                    { title: 'Status', dataIndex: 'status', render: () => <Tag color="success">ACTIVE</Tag> }
                  ]}
                  dataSource={supervisors}
                  rowKey="id"
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Operators" key="operators">
                <Table columns={[{ title: 'ID', dataIndex: 'opId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Email', dataIndex: 'email' }]} dataSource={operators} rowKey="id" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="MPCS Officers" key="mpcs">
                <Table columns={[{ title: 'ID', dataIndex: 'mpcsId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Email', dataIndex: 'email' }]} dataSource={mpcsOfficers} rowKey="id" />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Transport Fleet" key="transport">
                <Table columns={[{ title: 'TM ID', dataIndex: 'tmId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Phone', dataIndex: 'phoneNumber' }]} dataSource={transportManagers} rowKey="id" />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        );
      case 'machines':
        const filteredMachines = machineData.filter(m => {
          const matchSearch = m.name.toLowerCase().includes(machineSearch.toLowerCase()) || m.id.toLowerCase().includes(machineSearch.toLowerCase());
          const matchStatus = machineStatusFilter === 'ALL' || m.status === machineStatusFilter;
          return matchSearch && matchStatus;
        });

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>Infrastructure Monitoring</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Real-time health and throughput monitoring of factory floor units.</p>
              </div>
              <Space size="middle">
                <Input.Search
                  placeholder="Search by ID or Name"
                  style={{ width: 250 }}
                  onChange={e => setMachineSearch(e.target.value)}
                />
                <Select
                  defaultValue="ALL"
                  style={{ width: 160 }}
                  onChange={setMachineStatusFilter}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'RUNNING', label: 'Running Now' },
                    { value: 'IDLE', label: 'Standby / Idle' },
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
                    cover={<div style={{ height: '180px', overflow: 'hidden' }}><img alt={m.name} src={m.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                    bodyStyle={{ padding: '20px' }}
                    style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.id}</div>
                        <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{m.name}</h3>
                      </div>
                      <Tag color={m.status === 'RUNNING' ? 'success' : m.status === 'IDLE' ? 'warning' : 'error'} style={{ borderRadius: '4px', margin: 0 }}>
                        {m.status}
                      </Tag>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {m.status === 'RUNNING' ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Current Batch: <b>{m.batch}</b></span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#093a3e' }}>{m.progress}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#093a3e', width: `${m.progress}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '32px', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                        No active processing...
                      </div>
                    )}

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                      <Button size="small" type="link" style={{ padding: 0 }}>System Logs</Button>
                      <Button size="small" type="link" style={{ padding: 0 }}>History</Button>
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
            <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: '#093a3e', height: '120px', margin: '-24px -24px 0 -24px' }} />
              <div style={{ marginTop: '-60px', textAlign: 'center', position: 'relative' }}>
                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#e5e7eb' }} icon={<UserOutlined />} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px', marginBottom: '4px' }}>{user.fullName || 'District Manager'}</h1>
                <Tag color="geekblue">{user.dmId || 'DM-000'}</Tag>
              </div>
              <Divider />
              <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
                <Popconfirm
                  title="Reset Demo Environment?"
                  description="This will clear all dispatches, batches, and volumes. Continue?"
                  onConfirm={() => {
                    localStorage.removeItem('mpcsDispatches');
                    localStorage.removeItem('districtBatches');
                    localStorage.removeItem('mpcsDispatchedAmount');
                    localStorage.removeItem('districtChillerVolume');
                    message.success('Demo data reset! Refreshing...');
                    window.location.reload();
                  }}
                  okText="Yes, Reset"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>Reset Demo System Storage</Button>
                </Popconfirm>
              </div>
            </Card>
          </div>
        );
      default:
        return <Empty />;
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#093a3e', borderRadius: 8 } }}>
      <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          style={{ background: '#093a3e', boxShadow: '4px 0 24px rgba(0,0,0,0.15)', position: 'sticky', top: 0, height: '100vh', zIndex: 100 }}
        >
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!collapsed ? (
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>District Portal</div>
            ) : (
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900, textAlign: 'center', width: '100%' }}>D</div>
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
              { key: 'dashboard', icon: <DashboardOutlined />, label: 'Master Overview' },
              { key: 'chilling', icon: <ExperimentOutlined />, label: 'Factory Reception' },
              { key: 'operations', icon: <ToolOutlined />, label: 'Process Control' },
              { key: 'machines', icon: <SettingOutlined />, label: 'Machine Status' },
              { key: 'staff', icon: <TeamOutlined />, label: 'Member Management' },
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
              <div style={{ width: '4px', height: '20px', background: '#093a3e', borderRadius: '2px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>District Manager Headquarter</div>
            </div>

            <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
              <Space size={12} style={{ cursor: 'pointer' }}>
                {!collapsed && (
                  <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{user.fullName || 'Manager'}</div>
                    <div style={{ fontSize: '11px', color: '#093a3e', fontWeight: 600, textTransform: 'uppercase' }}>DISTRICT MANAGER</div>
                  </div>
                )}
                <Avatar size={44} style={{ backgroundColor: '#093a3e' }} icon={<UserOutlined />} />
              </Space>
            </Dropdown>
          </Header>

          <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {renderContent()}
          </Content>
        </Layout>

        {/* --- Unified Modal for Staff --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Add New Member Account</span>}
          open={isStaffModalVisible}
          onOk={() => staffForm.submit()}
          onCancel={() => setIsStaffModalVisible(false)}
          okText="Provision Auth"
          okButtonProps={{ style: { background: '#093a3e', borderColor: '#093a3e' } }}
        >
          <div style={{ marginBottom: '24px' }}>
            <Select
              value={staffType}
              onChange={setStaffType}
              style={{ width: '100%' }}
              options={[
                { value: 'supervisor', label: 'Factory Supervisor Role' },
                { value: 'operator', label: 'Plant Operator Role' },
                { value: 'mpcs-officer', label: 'MPCS Local Officer Role' },
                { value: 'transport-manager', label: 'Fleet / Transport Manager' },
              ]}
            />
          </div>
          <Form form={staffForm} onFinish={handleAddStaff} layout="vertical">
            <Form.Item name="fullName" label="Assigned Name" rules={[{ required: true }]}><Input /></Form.Item>
            {staffType === 'supervisor' && (
              <Form.Item name="specialization" label="Factory Specialization" rules={[{ required: true }]}>
                <Select>
                  <Option value="PRODUCTION">Batch Production Supervisor</Option>
                  <Option value="COLLECTION">Collection & Chiller Supervisor</Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item name="email" label="Provisioned Email" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="password" label="Temporary Access Key" rules={[{ required: true }]}><Input.Password /></Form.Item>
            {staffType === 'transport-manager' && (
              <>
                <Form.Item name="phoneNumber" label="Dispatch Contact"><Input /></Form.Item>
                <Form.Item name="licenseNumber" label="Gov License #"><Input /></Form.Item>
                <Form.Item name="licenseExpiry" label="Expiry Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
              </>
            )}
          </Form>
        </Modal>



        {/* --- Create Batch Modal --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Create New Production Batch</span>}
          open={isBatchModalVisible}
          onOk={() => batchForm.submit()}
          onCancel={() => setIsBatchModalVisible(false)}
          okText="Initialize Production"
          width={700}
          okButtonProps={{ style: { background: '#1a5c38', borderColor: '#1a5c38' } }}
        >
          <Form form={batchForm} onFinish={handleCreateBatch} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="quantity" label="Extract Quantity (L)" rules={[{ required: true }]}>
                  <InputNumber min={1} max={chillerVolume} style={{ width: '100%' }} placeholder="Milk to extract" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supChilling" label="1. Chilling Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="supPasteurize" label="2. Pasteurization Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supHomogenize" label="3. Homogenization Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="supPackaging" label="4. Packaging Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supStorage" label="5. Storage Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="supDelivery" label="6. Delivery Supervisor" rules={[{ required: true }]}>
                  <Select placeholder="Select supervisor">
                    {supervisors.filter(s => s.specialization === 'PRODUCTION').map(s => <Option key={s.id} value={s.id}>{s.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* --- Next Stage Assignment Modal --- */}
        <Modal
          title={<span style={{ fontWeight: 800 }}>Assign Next Process Supervisor</span>}
          open={isNextStageModalVisible}
          onOk={() => nextStageForm.submit()}
          onCancel={() => setIsNextStageModalVisible(false)}
          okText="Confirm & Handover"
          okButtonProps={{ style: { background: '#093a3e', borderColor: '#093a3e' } }}
        >
          <Form form={nextStageForm} onFinish={handleAssignBatchSupervisor} layout="vertical">
            <Form.Item name="supervisorId" label="Next Stage Supervisor" rules={[{ required: true }]}>
              <Select placeholder="Choose an available supervisor">
                {supervisors.filter(s => !busySupervisors[s.id]).map(s => (
                  <Option key={s.id} value={s.id}>{s.fullName} ({s.supId})</Option>
                ))}
              </Select>
            </Form.Item>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Handing over <b>{selectedBatchId}</b> to the selected supervisor for the next factory production phase.
            </p>
          </Form>
        </Modal>

      </Layout>
    </ConfigProvider>
  );
};

export default DistrictManagerDashboard;
