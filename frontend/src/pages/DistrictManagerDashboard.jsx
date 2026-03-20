import React, { useState, useEffect } from 'react';
import {
  Layout, Table, Button, Space, Card, Statistic, Row, Col,
  Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider, Modal, Form, Input, Popconfirm, Select, DatePicker, Tabs, InputNumber, Steps, Upload
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
  ExperimentOutlined,
  ShoppingOutlined,
  UploadOutlined,
  EditOutlined
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
  const [isEditMachineModalVisible, setIsEditMachineModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [editMachineForm] = Form.useForm();
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isNextStageModalVisible, setIsNextStageModalVisible] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [nextStageForm] = Form.useForm();
  const [machineData, setMachineData] = useState([]);
  const [machineSearch, setMachineSearch] = useState('');
  const [machineStatusFilter, setMachineStatusFilter] = useState('ALL');
  
  const [chillerTanks, setChillerTanks] = useState([]);
  const [isTankModalVisible, setIsTankModalVisible] = useState(false);
  const [tankForm] = Form.useForm();
  const [isMachineModalVisible, setIsMachineModalVisible] = useState(false);
  const [machineForm] = Form.useForm();

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
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

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

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!token || user.role !== 'DISTRICT_MANAGER') {
      navigate('/login');
      return;
    }
  }, [token, user, navigate]);

  const fetchDispatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/hierarchy/logistics-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDistrictDispatches(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dispatches', error);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchChillerTanks();
    fetchMachines();
    fetchDispatches();

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
      setTransportManagers(response.data.transportManagers || []);
      console.log('TMs fetched:', response.data.transportManagers);
      setDrivers(response.data.drivers || []);
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch staff', error);
      messageApi.error('Failed to fetch personnel data');
    }
  };

  const fetchChillerTanks = async () => {
    try {
      const response = await axios.get(`${API_URL}/hierarchy/chiller-tanks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
        if (response.data?.success) {
          setChillerTanks(response.data.data);
          const total = response.data.data.reduce((sum, t) => sum + (t.currentLevel || 0), 0);
          setChillerVolume(total);
        } else {
          setChillerTanks(Array.isArray(response.data) ? response.data : []);
          const total = (Array.isArray(response.data) ? response.data : []).reduce((sum, t) => sum + (t.currentLevel || 0), 0);
          setChillerVolume(total);
        }
    } catch (error) {
        console.error('Failed to fetch tanks', error);
    }
  };

  const handleAddTank = async (values) => {
    try {
        await axios.post(`${API_URL}/hierarchy/chiller-tanks`, values, {
            headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Chiller Tank added successfully');
        setIsTankModalVisible(false);
        tankForm.resetFields();
        fetchChillerTanks();
    } catch (error) {
        message.error('Failed to add tank');
    }
  };

  const handleDeleteTank = async (id) => {
    try {
        await axios.delete(`${API_URL}/hierarchy/chiller-tanks/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Tank decommissioned successfully');
        fetchChillerTanks();
    } catch (error) {
        message.error('Failed to delete tank');
    }
  };

  const handleRequestDelivery = async (batch) => {
    try {
        const response = await axios.post(`${API_URL}/hierarchy/delivery-requests`, {
            batchId: batch.id,
            quantity: batch.quantity || 1000,
            destination: 'MAIN_CITY_RETAIL'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
            message.success('Delivery request sent to Transport Manager');
            // Update local batches state
            const updated = districtBatches.map(b => b.id === batch.id ? { ...b, status: 'AWAITING_DELIVERY' } : b);
            setDistrictBatches(updated);
            localStorage.setItem('districtBatches', JSON.stringify(updated));
        }
    } catch (err) {
        message.error('Failed to initiate delivery');
    }
  };

  const handleAddMachine = async (values) => {
    try {
      const payload = { ...values, imageUrl: uploadedImageUrl || values.imageUrl };
      await axios.post(`${API_URL}/hierarchy/machines`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Machine added to factory floor');
      setIsMachineModalVisible(false);
      machineForm.resetFields();
      setUploadedImageUrl('');
      fetchMachines();
    } catch (error) {
      message.error('Failed to create machine');
    }
  };

  const handleUpdateMachine = async (values) => {
    try {
        const payload = { ...values, imageUrl: uploadedImageUrl || values.imageUrl };
        await axios.patch(`${API_URL}/hierarchy/machines/${selectedMachine.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Machine details updated');
        setIsEditMachineModalVisible(false);
        setUploadedImageUrl('');
        fetchMachines();
    } catch (error) {
        message.error('Failed to update machine');
    }
  };

  const handleEditMachine = (machine) => {
    setSelectedMachine(machine);
    editMachineForm.setFieldsValue({
        ...machine,
        lastMaintenanceDate: machine.lastMaintenanceDate ? dayjs(machine.lastMaintenanceDate) : null
    });
    setIsEditMachineModalVisible(true);
  };

  const handleToggleMaintenance = async (machine) => {
    try {
      const newStatus = machine.status === 'MAINTENANCE' ? 'IDLE' : 'MAINTENANCE';
      await axios.patch(`${API_URL}/hierarchy/machines/${machine.id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success(`Machine status updated to ${newStatus}`);
      fetchMachines();
    } catch (error) {
      message.error('Failed to update machine status');
    }
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post(`${API_URL}/hierarchy/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setUploadedImageUrl(response.data.url);
        onSuccess();
        message.success('Image uploaded successfully');
      }
    } catch (err) {
      onError(err);
      message.error('Upload failed');
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
      console.error('Failed to fetch machines', error);
    }
  };

  const handleDeleteMachine = async (id) => {
    try {
      await axios.delete(`${API_URL}/hierarchy/machines/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Machine decommissioned');
      fetchMachines();
    } catch (error) {
      messageApi.error('Failed to decommission machine');
    }
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
        driver: '/api/hierarchy/drivers'
      }[values.role];

      await axios.post(
        `http://localhost:5000${endpoint}`,
        { ...values, dmId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      messageApi.success(`${values.role} added successfully`);
      setIsStaffModalVisible(false);
      staffForm.resetFields();
      fetchStaff();
    } catch (error) {
      messageApi.error('Failed to add member');
    }
  };

  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [vehicleForm] = Form.useForm();
  
  const handleAddVehicle = async (values) => {
    try {
      await axios.post(`${API_URL}/hierarchy/motor-vehicles`, { ...values, dmId: user.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      messageApi.success('Vehicle added to fleet');
      setIsVehicleModalVisible(false);
      vehicleForm.resetFields();
      fetchStaff();
    } catch (error) {
      messageApi.error('Failed to add vehicle');
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

  const handleCreateBatch = async (values) => {
    const sourceTank = chillerTanks.find(t => t.id === values.sourceTankId);
    if (!sourceTank || sourceTank.currentLevel < values.quantity) {
      message.error(`Insufficient milk in ${sourceTank?.name || 'selected tank'}!`);
      return;
    }

    // Pre-calculated supervisors for the new sequence
    const stageSupervisors = {
      CLARIFICATION: supervisors.find(s => s.id === values.supClarify)?.fullName,
      PASTEURIZATION: supervisors.find(s => s.id === values.supPasteurize)?.fullName,
      HOMOGENIZATION: supervisors.find(s => s.id === values.supHomogenize)?.fullName,
      PACKING: supervisors.find(s => s.id === values.supPacking)?.fullName,
    };

    const newBatch = {
      id: `BATCH-${Date.now().toString().slice(-4)}`,
      quantity: values.quantity,
      milkType: sourceTank.milkType,
      sourceTankId: sourceTank.id,
      status: 'CLARIFICATION',
      stageSupervisors,
      assignedSupervisor: stageSupervisors.CLARIFICATION,
      assignedOperator: null,
      operatorId: null,
      stageProgress: 0,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm')
    };

    const updatedBatches = [newBatch, ...districtBatches];
    setDistrictBatches(updatedBatches);
    localStorage.setItem('districtBatches', JSON.stringify(updatedBatches));

    // Update first machine - find an available Clarifier
    const clarifier = machineData.find(m => m.type === 'CLARIFIER' && m.status === 'IDLE');
    if (clarifier) {
        setMachineData(machineData.map(m => m.id === clarifier.id ? { ...m, status: 'RUNNING', batch: newBatch.id, progress: 0 } : m));
    }

    // Deduct from the specific tank in DB
    try {
        await axios.patch(`${API_URL}/hierarchy/chiller-tanks/${sourceTank.id}`, {
            currentLevel: sourceTank.currentLevel - values.quantity
        }, { headers: { Authorization: `Bearer ${token}` }});
        fetchChillerTanks();
    } catch (e) {
        console.error('Failed to update tank level', e);
    }

    message.success(`Production Batch ${newBatch.id} initialized from ${sourceTank.name}`);
    setIsBatchModalVisible(false);
    batchForm.resetFields();
  };

  const handleAssignBatchSupervisor = (values) => {
    const supervisor = supervisors.find(s => s.id === values.supervisorId);

    const updatedBatches = districtBatches.map(b => {
      if (b.id === selectedBatchId) {
        const sequence = [
          'CLARIFICATION', 'CLARIFICATION_DONE',
          'PASTEURIZATION', 'PASTEURIZATION_DONE',
          'HOMOGENIZATION', 'HOMOGENIZATION_DONE',
          'PACKING', 'PACKING_DONE',
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
      'CLARIFICATION', 'CLARIFICATION_DONE',
      'PASTEURIZATION', 'PASTEURIZATION_DONE',
      'HOMOGENIZATION', 'HOMOGENIZATION_DONE',
      'PACKING', 'PACKING_DONE',
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
            { title: 'Dispatched', description: 'From MPCS', subTitle: record.dispatchDate ? dayjs(record.dispatchDate).format('HH:mm') : '' },
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
    const stages = ['CLARIFICATION', 'PASTEURIZATION', 'HOMOGENIZATION', 'PACKING', 'STORAGE', 'DELIVERY'];

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
                <Card variant="borderless" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL STAFF" value={supervisors.length + operators.length + mpcsOfficers.length + transportManagers.length || 12} styles={{ content: { color: '#093A3E', fontWeight: 800 } }} prefix={<TeamOutlined style={{ background: '#f0fdff', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="borderless" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="COW MILK STORAGE" value={chillerTanks.filter(t => t.milkType === 'COW').reduce((s, t) => s + t.currentLevel, 0)} precision={1} suffix="L" styles={{ content: { color: '#0369a1', fontWeight: 800 } }} prefix={<ExperimentOutlined style={{ background: '#f0f9ff', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="borderless" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="BUFFALO MILK STORAGE" value={chillerTanks.filter(t => t.milkType === 'BUFFALO').reduce((s, t) => s + t.currentLevel, 0)} precision={1} suffix="L" styles={{ content: { color: '#ea580c', fontWeight: 800 } }} prefix={<ThunderboltOutlined style={{ background: '#fff7ed', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card variant="borderless" className="dip-stat-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <Statistic title="TOTAL VOLUME" value={chillerVolume} styles={{ content: { color: '#059669', fontWeight: 800 } }} prefix={<TruckOutlined style={{ background: '#ecfdf5', padding: '8px', borderRadius: '8px', marginRight: '8px' }} />} />
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
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>Production Pipeline</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Real-time monitoring and stage management of all active production batches.</p>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBatchModalVisible(true)} style={{ background: '#1a5c38' }} size="large">
                Create New Production Batch
              </Button>
            </div>

            <Table
              columns={[
                { title: 'BATCH ID', dataIndex: 'id', key: 'id', render: t => <span style={{ fontWeight: 800, color: '#093a3e' }}>{t}</span> },
                { title: 'QTY (L)', dataIndex: 'quantity', key: 'quantity', render: q => <span style={{ fontWeight: 700 }}>{q} L</span> },
                { title: 'MILK TYPE', dataIndex: 'milkType', key: 'milkType', render: t => <Tag color={t === 'COW' ? 'blue' : 'orange'}>{t}</Tag> },
                { title: 'SUPERVISOR', dataIndex: 'assignedSupervisor', key: 'assignedSupervisor', render: s => s || <i style={{ color: '#94a3b8' }}>Unassigned</i> },
                {
                  title: 'PROCESS', dataIndex: 'status', key: 'status', render: s => (
                    <Tag color={s.includes('_DONE') ? 'orange' : 'blue'} style={{ fontWeight: 700 }}>
                      {s.replace(/_/g, ' ')}
                    </Tag>
                  )
                },
                {
                  title: 'ACTIONS', key: 'state', render: (_, record) => (
                    record.status === 'STORAGE_DONE' ? (
                        <Button size="small" type="primary" style={{ background: '#312e81' }} onClick={() => handleRequestDelivery(record)}>
                          🚀 Deliver to Shop
                        </Button>
                    ) : (record.status.includes('_DONE') && record.status !== 'DELIVERED_TO_RETAIL_DONE' ? (
                      <Button size="small" type="primary" onClick={() => { setSelectedBatchId(record.id); setIsNextStageModalVisible(true); }}>
                        Handover to Next Stage
                      </Button>
                    ) : record.status === 'DELIVERED_TO_RETAIL_DONE' ? <Tag color="green">FINISHED</Tag> : <Tag color="processing">ONGOING</Tag>)
                  )
                }
              ]}
              dataSource={districtBatches}
              rowKey="id"
              pagination={false}
              style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              expandable={{
                expandedRowRender: record => renderBatchPipeline(record),
                defaultExpandAllRows: true,
              }}
            />
          </div>
        );
      case 'chilling':
        return (
          <>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>Factory Chiller Silos</h3>
              </div>

              <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                {chillerTanks.filter(t => t.unitType === 'SILO').map(tank => (
                    <Col span={12} key={tank.id}>
                        <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 800 }}>{tank.name}</h4>
                                    <Tag color={tank.milkType === 'COW' ? 'blue' : 'orange'}>{tank.milkType} MILK</Tag>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0369a1' }}>{tank.currentLevel} / {tank.capacity} L</div>
                                    <Tag color="success">TEMP: {tank.temperature}°C</Tag>
                                </div>
                            </div>
                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: tank.milkType === 'COW' ? '#0369a1' : '#ea580c', width: `${(tank.currentLevel / tank.capacity) * 100}%`, transition: 'width 0.5s ease' }} />
                            </div>
                        </Card>
                    </Col>
                ))}
              </Row>

              <Card
                title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Logistics History & Arrival Log</span>}
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
              >
                <Table
                  columns={[
                    { title: 'DISPATCH ID', dataIndex: 'dispatchId', key: 'id', render: t => <span style={{ fontWeight: 600 }}>{t}</span> },
                    { title: 'DATE', dataIndex: 'dispatchDate', key: 'date', render: d => dayjs(d).format('YYYY-MM-DD') },
                    { title: 'INBOUND QTY', dataIndex: 'totalQuantity', key: 'quantity', render: v => <span style={{ fontWeight: 700 }}>{v} L</span> },
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
            </div>
          </>
        );
      case 'staff':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card
              title={<span style={{ fontWeight: 800, fontSize: '18px' }}>Personnel Management</span>}
              extra={<Button type="primary" icon={<PlusOutlined />} style={{ background: '#093A3E' }} onClick={() => setIsStaffModalVisible(true)}>Add New Personnel</Button>}
              variant="borderless"
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            >
              <Tabs defaultActiveKey="supervisors">
                <Tabs.TabPane tab="Factory Supervisors" key="supervisors">
                  <Table
                    columns={[
                      { title: 'ID', dataIndex: 'supId' },
                      { title: 'Name', dataIndex: 'fullName' },
                      { title: 'Specialization', dataIndex: 'specialization', render: s => <Tag color={s === 'COLLECTION' ? 'purple' : 'blue'}>{s || 'PRODUCTION'}</Tag> },
                      { title: 'Contact', dataIndex: 'email' },
                      { title: 'Status', dataIndex: 'status', render: s => <Tag color="success">{s || 'ACTIVE'}</Tag> }
                    ]}
                    dataSource={supervisors}
                    rowKey="id"
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Production Operators" key="operators">
                  <Table columns={[{ title: 'ID', dataIndex: 'opId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Email', dataIndex: 'email' }, { title: 'Phone', dataIndex: 'phoneNumber' }]} dataSource={operators} rowKey="id" />
                </Tabs.TabPane>
                <Tabs.TabPane tab="MPCS Officers" key="mpcs">
                  <Table columns={[{ title: 'ID', dataIndex: 'mpcsId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Email', dataIndex: 'email' }]} dataSource={mpcsOfficers} rowKey="id" />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Transport Managers" key="tm">
                  <Table columns={[{ title: 'ID', dataIndex: 'tmId' }, { title: 'Name', dataIndex: 'fullName' }, { title: 'Email', dataIndex: 'email' }]} dataSource={transportManagers} rowKey="id" />
                </Tabs.TabPane>
              </Tabs>
            </Card>
          </div>
        );
      case 'delivery_management':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 800, margin: 0 }}>Retail Distribution Control</h3>
            </div>
            <Card title="Batches Awaiting Retail Delivery" bordered={false} style={{ borderRadius: '16px' }}>
               <Table 
                 dataSource={districtBatches.filter(b => b.status === 'AWAITING_DELIVERY' || b.status === 'STORAGE_DONE')}
                 columns={[
                   { title: 'BATCH ID', dataIndex: 'id' },
                   { title: 'MILK TYPE', dataIndex: 'milkType' },
                   { title: 'QUANTITY', dataIndex: 'quantity', render: q => `${q} L` },
                   { title: 'STATUS', dataIndex: 'status', render: s => <Tag color="blue">{s.replace(/_/g, ' ')}</Tag> },
                   { title: 'ACTION', render: (_, record) => (
                      <Button type="primary" size="small" onClick={() => handleRequestDelivery(record)}>
                        Ready for Delivery
                      </Button>
                   )}
                 ]}
                 rowKey="id"
               />
            </Card>
          </div>
        );
      case 'machines':
        const filteredMachines = machineData.filter(m => {
          const matchSearch = (m.name || '').toLowerCase().includes(machineSearch.toLowerCase()) || (m.machineId || '').toLowerCase().includes(machineSearch.toLowerCase());
          const matchStatus = machineStatusFilter === 'ALL' || m.status === machineStatusFilter;
          return matchSearch && matchStatus;
        });

        const machineImages = {
            CLARIFIER: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400',
            PASTEURIZER: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=400',
            HOMOGENIZER: 'https://images.unsplash.com/photo-1590959651373-a3db0f38a961?auto=format&fit=crop&q=80&w=400',
            PACKER: 'https://images.unsplash.com/photo-1565463741600-9fed8e132717?auto=format&fit=crop&q=80&w=400'
        };

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>Factory Machine Status</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Real-time health and throughput monitoring of factory floor units.</p>
              </div>
              <Space size="middle">
                <Input.Search
                  placeholder="ID or Name"
                  style={{ width: 220 }}
                  onChange={e => setMachineSearch(e.target.value)}
                />
                <Select
                  defaultValue="ALL"
                  style={{ width: 140 }}
                  onChange={setMachineStatusFilter}
                  options={[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'RUNNING', label: 'Running' },
                    { value: 'IDLE', label: 'Idle' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                  ]}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsMachineModalVisible(true)}>Add Machine</Button>
              </Space>
            </div>

            <Row gutter={[24, 24]}>
              {filteredMachines.map(m => (
                <Col xs={24} md={12} xl={6} key={m.id}>
            <Card
              hoverable
              styles={{ body: { padding: '20px' } }}
              style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.machineId}</div>
                  <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{m.name}</h3>
                  <Tag color="cyan">{m.type}</Tag>
                </div>
                <Tag color={m.status === 'RUNNING' ? 'success' : m.status === 'IDLE' ? 'warning' : m.status === 'MAINTENANCE' ? 'error' : 'default'}>
                  {m.status}
                </Tag>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {m.status === 'RUNNING' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Current Batch: <b>{m.currentBatchId || 'Unknown'}</b></span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#093a3e' }}>{m.progress || 0}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#093a3e', width: `${m.progress || 0}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ) : (
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                  No active processing...
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Tag color="default">Cap: {m.capacity}L</Tag>
                  <Button 
                    size="small" 
                    type={m.status === 'MAINTENANCE' ? 'primary' : 'default'} 
                    danger={m.status !== 'MAINTENANCE'}
                    onClick={() => handleToggleMaintenance(m)}
                  >
                    {m.status === 'MAINTENANCE' ? 'Set Idle' : 'Maint.'}
                  </Button>
                </Space>
                <Popconfirm title="Decommission this machine?" onConfirm={() => handleDeleteMachine(m.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </div>
            </Card>
                </Col>
              ))}
              {filteredMachines.length === 0 && <Col span={24}><Empty description="No machines found on factory floor" /></Col>}
            </Row>
          </>
        );
      case 'infrastructure':
        const silos = chillerTanks.filter(t => t.unitType === 'SILO');
        const intermediate = chillerTanks.filter(t => t.unitType === 'INTERMEDIATE');
        const packets = chillerTanks.filter(t => t.unitType === 'PACKET_STORAGE');

        const renderTankGroup = (title, data, color) => (
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontWeight: 800, color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '4px', height: '18px', background: color, borderRadius: '2px' }} />
                    {title}
                </h3>
                <Row gutter={[24, 24]}>
                    {data.map(tank => (
                        <Col xs={24} md={12} xl={8} key={tank.id}>
                            <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                                <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{tank.tankId}</div>
                                        <h3 style={{ margin: '4px 0', fontWeight: 800 }}>{tank.name}</h3>
                                        <Tag color={tank.milkType === 'COW' ? 'blue' : tank.milkType === 'BUFFALO' ? 'orange' : 'green'}>{tank.milkType}</Tag>
                                    </div>
                                    <Popconfirm title="Decommission this tank?" onConfirm={() => handleDeleteTank(tank.id)}>
                                        <Button type="text" icon={<DeleteOutlined />} danger />
                                    </Popconfirm>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Current Level</div>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#093a3e' }}>{tank.currentLevel} <small style={{ fontSize: '14px', fontWeight: 400 }}>/ {tank.capacity} {tank.milkType === 'PACKETS' ? 'Units' : 'L'}</small></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Tag color="cyan">{tank.temperature || 4.0}°C</Tag>
                                    </div>
                                </div>

                                <div style={{ height: '10px', background: '#f8fafc', borderRadius: '5px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        background: color, 
                                        width: `${Math.min(100, (tank.currentLevel / tank.capacity) * 100)}%`, 
                                        transition: 'width 1s ease' 
                                    }} />
                                </div>
                                <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>Status: {tank.status}</div>
                            </Card>
                        </Col>
                    ))}
                    {data.length === 0 && <Col span={24}><Empty description={`No ${title.toLowerCase()} configured`} /></Col>}
                </Row>
            </div>
        );

        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>Storage Infrastructure</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>Real-time capacity management across the entire factory storage network.</p>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsTankModalVisible(true)} size="large">
                Provision New Storage Unit
              </Button>
            </div>

            {renderTankGroup('Main Chiller Silos (Raw Milk)', silos, '#0369a1')}
            {renderTankGroup('Intermediate Process Tanks', intermediate, '#059669')}
            {renderTankGroup('Finished Goods Warehouse', packets, '#6366f1')}
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
        {contextHolder}
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
              { key: 'operations', icon: <ThunderboltOutlined />, label: 'Production Pipeline' },
              { key: 'delivery_management', icon: <ShoppingOutlined />, label: 'Retail Delivery' },
              { key: 'machines', icon: <SettingOutlined />, label: 'Machine Status' },
              { key: 'infrastructure', icon: <ToolOutlined />, label: 'Storage & Silos' },
              { key: 'staff', icon: <TeamOutlined />, label: 'Staff & Personnel' },
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
                { value: 'driver', label: 'Vehicle Driver Role' }
              ]}
            />
          </div>
          <Form form={staffForm} onFinish={handleAddStaff} layout="vertical">
            <Form.Item name="role" hidden initialValue={staffType}><Input /></Form.Item>
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
            {staffType === 'operator' && (
              <Form.Item name="supervisorId" label="Assign To Supervisor" rules={[{ required: true }]}>
                <Select placeholder="Choose an immediate supervisor">
                  {supervisors.map(s => <Option key={s.id} value={s.id}>{s.fullName} ({s.specialization})</Option>)}
                </Select>
              </Form.Item>
            )}
            {staffType === 'driver' && (
              <>
                 <Form.Item name="tmId" label="Assign to Transport Manager" rules={[{ required: true }]}>
                   <Select placeholder="Choose transport manager">
                     {transportManagers.map(tm => <Option key={tm.id} value={tm.tmId}>{tm.fullName} ({tm.tmId})</Option>)}
                   </Select>
                 </Form.Item>
                 <Form.Item name="drivingLicenseNumber" label="Driving License Number" rules={[{ required: true }]}><Input /></Form.Item>
                 <Row gutter={16}>
                   <Col span={12}><Form.Item name="licenseExpiry" label="License Expiry" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                   <Col span={12}><Form.Item name="licenseClass" label="License Class" initialValue="HMV"><Input placeholder="e.g. HMV" /></Form.Item></Col>
                 </Row>
              </>
            )}
            {staffType === 'transport-manager' && (
              <>
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
              <Col span={24}>
                <Form.Item name="sourceTankId" label="Extract Milk From (Chiller Tank)" rules={[{ required: true }]}>
                  <Select placeholder="Select a chiller tank with sufficient milk">
                    {chillerTanks.map(t => (
                      <Option key={t.id} value={t.id} disabled={t.currentLevel <= 0}>
                        {t.name} ({t.milkType}) - Available: {t.currentLevel}L
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="quantity" label="Extract Quantity (L)" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="Milk to extract" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supClarify" label="1. Clarification Supervisor" rules={[{ required: true }]}>
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
              <Col span={24}>
                <Form.Item name="supPacking" label="4. Packing & Storage Supervisor" rules={[{ required: true }]}>
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


        <Modal
            title={<span style={{ fontWeight: 800 }}>Add New Factory Machine</span>}
            open={isMachineModalVisible}
            onOk={() => machineForm.submit()}
            onCancel={() => setIsMachineModalVisible(false)}
            okText="Add Machine"
        >
            <Form form={machineForm} layout="vertical" onFinish={handleAddMachine}>
                <Form.Item name="name" label="Machine Name" rules={[{ required: true }]}>
                    <Input placeholder="e.g., Clarifier Unit 1" />
                </Form.Item>
                <Form.Item name="type" label="Machine Type" rules={[{ required: true }]}>
                    <Select placeholder="Select type">
                        <Option value="CLARIFIER">🧹 Clarifier</Option>
                        <Option value="PASTEURIZER">🔥 Pasteurizer</Option>
                        <Option value="HOMOGENIZER">⚙️ Homogenizer</Option>
                        <Option value="PACKER">📦 Milk Packing Machine</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="capacity" label="Daily Capacity (Liters)" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 5000" />
                </Form.Item>
                <Form.Item name="machineId" label="Hardware Serial (Optional)">
                    <Input placeholder="e.g. SN-CLR-001" />
                </Form.Item>
            </Form>
        </Modal>

        {/* Edit Machine Modal */}
        <Modal
            title={<span style={{ fontWeight: 800 }}>Edit Factory Machine</span>}
            open={isEditMachineModalVisible}
            onOk={() => editMachineForm.submit()}
            onCancel={() => { setIsEditMachineModalVisible(false); setSelectedMachine(null); }}
            okText="Update Machine"
        >
            <Form form={editMachineForm} layout="vertical" onFinish={handleUpdateMachine}>
                <Form.Item name="name" label="Machine Name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="capacity" label="Daily Capacity (Liters)" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>

        <Modal
            title={<span style={{ fontWeight: 800 }}>Provision New Motor Vehicle</span>}
            open={isVehicleModalVisible}
            onOk={() => vehicleForm.submit()}
            onCancel={() => setIsVehicleModalVisible(false)}
            okText="Add to Fleet"
            width={600}
        >
          <Form form={vehicleForm} layout="vertical" onFinish={handleAddVehicle}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tmId" label="Assign to Transport Manager" rules={[{ required: true }]}>
                  <Select placeholder="Choose TM">
                    {transportManagers.map(tm => <Option key={tm.id} value={tm.tmId}>{tm.fullName}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="registrationNumber" label="Reg. Number (Plate)" rules={[{ required: true }]}><Input placeholder="TN-01-AB-1234" /></Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="vehicleType" label="Vehicle Category" rules={[{ required: true }]}>
                  <Select>
                    <Option value="TANKER">Tanker Truck</Option>
                    <Option value="REFRIGERATED">Refrigerated Truck</Option>
                    <Option value="CLOSED">Closed Container</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="capacity" label="Tanker Capacity (Liters)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="manufactureBrand" label="Brand" initialValue="TATA"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="year" label="Year" initialValue={2024}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item name="chasisNumber" label="Chassis Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="engineNumber" label="Engine Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="registrationExpiry" label="Reg. Expiry Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Form>
        </Modal>

        <Modal
            title={<span style={{ fontWeight: 800 }}>Provision New Storage Unit</span>}
            open={isTankModalVisible}
            onOk={() => tankForm.submit()}
            onCancel={() => setIsTankModalVisible(false)}
            okText="Provision Storage"
        >
            <Form form={tankForm} layout="vertical" onFinish={handleAddTank}>
            <Form.Item name="name" label="Storage Name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Raw Milk Silo 1 or Intermediate Tank A" />
            </Form.Item>
            <Form.Item name="unitType" label="Storage Function" rules={[{ required: true }]} defaultValue="SILO">
                <Select placeholder="Select function">
                    <Option value="SILO">Main Chiller Silo (Raw Milk)</Option>
                    <Option value="INTERMEDIATE">Intermediate Storage (Processed Milk)</Option>
                    <Option value="PACKET_STORAGE">Packet / Finished Goods Warehouse</Option>
                </Select>
            </Form.Item>
            <Form.Item name="milkType" label="Milk Category" rules={[{ required: true }]}>
                <Select placeholder="Select allowed category">
                <Option value="COW">Cow Milk</Option>
                <Option value="BUFFALO">Buffalo Milk</Option>
                <Option value="MIXED">Mixed / Bulk</Option>
                <Option value="PACKETS">Finished Packets</Option>
                </Select>
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                <Form.Item name="capacity" label="Total Capacity (Liters)" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} placeholder="5000" />
                </Form.Item>
                </Col>
                <Col span={12}>
                <Form.Item name="tankId" label="Storage ID (Optional)">
                    <Input placeholder="e.g. SILO-101" />
                </Form.Item>
                </Col>
            </Row>
            </Form>
        </Modal>

      </Layout>
    </ConfigProvider>
  );
};

export default DistrictManagerDashboard;
