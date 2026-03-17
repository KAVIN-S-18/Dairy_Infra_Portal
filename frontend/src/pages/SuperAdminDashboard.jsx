import React, { useState, useEffect } from 'react';
import {
    Layout, Table, Button, Space, Card, Statistic, Row, Col,
    Tag, message, Menu, Avatar, Dropdown, ConfigProvider, Empty, Divider
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LogoutOutlined,
    DashboardOutlined,
    TeamOutlined,
    UserOutlined,
    SettingOutlined,
    BankOutlined,
    BarChartOutlined,
    BellOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    InfoCircleOutlined,
    HistoryOutlined
} from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [approvedAdmins, setApprovedAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [pendingRes, approvedRes] = await Promise.all([
                axios.get(`${API_URL}/auth/pending-admins`, { headers }),
                axios.get(`${API_URL}/auth/approved-admins`, { headers }),
            ]);
            setPendingAdmins(pendingRes.data);
            setApprovedAdmins(approvedRes.data);
        } catch (error) {
            message.error('Failed to fetch data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (adminId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(`${API_URL}/auth/approve-admin/${adminId}`, {}, { headers });
            message.success('Admin approved successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to approve admin');
            console.error(error);
        }
    };

    const handleReject = async (adminId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.put(`${API_URL}/auth/reject-admin/${adminId}`, {}, { headers });
            message.success('Admin rejected successfully');
            fetchData();
        } catch (error) {
            message.error('Failed to reject admin');
            console.error(error);
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
            { key: 'settings', label: 'Account Settings', icon: <SettingOutlined />, onClick: () => setActiveTab('settings') },
            { type: 'divider' },
            { key: 'logout', label: 'Logout', danger: true, icon: <LogoutOutlined />, onClick: handleLogout },
        ]
    };

    const pendingColumns = [
        { title: 'FULL NAME', dataIndex: 'fullName', key: 'fullName', render: (text) => <span style={{ fontWeight: 600, color: '#111827' }}>{text}</span> },
        { title: 'EMAIL ADDRESS', dataIndex: 'email', key: 'email', render: (text) => <span style={{ color: '#4b5563' }}>{text}</span> },
        { title: 'ORGANIZATION', dataIndex: 'organizationName', key: 'organizationName', render: (text) => <span style={{ fontWeight: 500, color: '#1a5c38' }}>{text}</span> },
        {
            title: 'TYPE', dataIndex: 'organizationType', key: 'organizationType', render: (text) => (
                <Tag color={text === 'COOPERATIVE' ? 'green' : 'cyan'} style={{ borderRadius: '4px', padding: '0 12px', fontWeight: 600 }}>{text}</Tag>
            )
        },
        { title: 'DATE', dataIndex: 'createdAt', key: 'createdAt', render: (date) => <span style={{ color: '#6b7280' }}>{new Date(date).toLocaleDateString()}</span> },
        {
            title: 'ACTIONS', key: 'actions', fixed: 'right', width: 180, render: (_, record) => (
                <Space>
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record.id)} style={{ background: '#1a5c38', borderColor: '#1a5c38' }}>Approve</Button>
                    <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleReject(record.id)}>Reject</Button>
                </Space>
            )
        },
    ];

    const approvedColumns = [
        { title: 'FULL NAME', dataIndex: 'fullName', key: 'fullName', render: (text) => <span style={{ fontWeight: 600, color: '#111827' }}>{text}</span> },
        { title: 'EMAIL ADDRESS', dataIndex: 'email', key: 'email', render: (text) => <span style={{ color: '#4b5563' }}>{text}</span> },
        { title: 'ORGANIZATION', dataIndex: 'organizationName', key: 'organizationName', render: (text) => <span style={{ fontWeight: 500, color: '#1a5c38' }}>{text}</span> },
        {
            title: 'TYPE', dataIndex: 'organizationType', key: 'organizationType', render: (text) => (
                <Tag color={text === 'COOPERATIVE' ? 'green' : 'cyan'} style={{ borderRadius: '4px', padding: '0 12px', fontWeight: 600 }}>{text}</Tag>
            )
        },
        { title: 'STATUS', key: 'status', render: () => <Tag color="success">ACTIVE</Tag> },
        { title: 'APPROVED DATE', dataIndex: 'approvedAt', key: 'approvedAt', render: (date) => <span style={{ color: '#6b7280' }}>{date ? new Date(date).toLocaleDateString() : 'N/A'}</span> },
    ];

    const renderEmptyState = (title) => (
        <Card bordered={false} style={{ borderRadius: '16px', padding: '60px 0', textAlign: 'center' }}>
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                    <div style={{ color: '#6b7280' }}>
                        <h3 style={{ color: '#111827', margin: 0 }}>{title} Section Under Construction</h3>
                        <p>We are currently establishing the data pipelines for this module.</p>
                        <Button type="primary" onClick={() => setActiveTab('dashboard')} style={{ marginTop: '16px' }}>Back to Dashboard</Button>
                    </div>
                }
            />
        </Card>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>System Performance</h1>
                                <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '4px' }}>Real-time metrics and organization requests monitoring.</p>
                            </div>
                            <Button icon={<BarChartOutlined />} type="default" onClick={() => setActiveTab('reports')}>View All Reports</Button>
                        </div>

                        <Row gutter={[32, 32]} style={{ marginBottom: '48px' }}>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                                    <Statistic
                                        title={<span style={{ color: '#166534', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Pending Approvals</span>}
                                        value={pendingAdmins.length}
                                        valueStyle={{ color: '#15803d', fontWeight: 900, fontSize: '42px' }}
                                        prefix={<BellOutlined style={{ marginRight: '16px', fontSize: '24px', color: '#166534', background: '#dcfce7', padding: '12px', borderRadius: '12px' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                                    <Statistic
                                        title={<span style={{ color: '#075985', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Active Organizations</span>}
                                        value={approvedAdmins.length}
                                        valueStyle={{ color: '#0369a1', fontWeight: 900, fontSize: '42px' }}
                                        prefix={<BankOutlined style={{ marginRight: '16px', fontSize: '24px', color: '#075985', background: '#e0f2fe', padding: '12px', borderRadius: '12px' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                                    <Statistic
                                        title={<span style={{ color: '#9a3412', fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>System Status</span>}
                                        value={"Global"}
                                        valueStyle={{ color: '#c2410c', fontWeight: 900, fontSize: '42px' }}
                                        prefix={<CheckCircleOutlined style={{ marginRight: '16px', fontSize: '24px', color: '#9a3412', background: '#ffedd5', padding: '12px', borderRadius: '12px' }} />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card
                            title={<span style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Organization Registration Requests</span>}
                            extra={<Tag color="error" style={{ borderRadius: '6px' }}>{pendingAdmins.length} ACTION REQUIRED</Tag>}
                            bordered={false}
                            style={{ marginBottom: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                        >
                            <Table
                                columns={pendingColumns}
                                dataSource={pendingAdmins}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 8 }}
                                scroll={{ x: 1000 }}
                            />
                        </Card>

                        <Card
                            title={<span style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Approved Administrative Partners</span>}
                            bordered={false}
                            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                        >
                            <Table
                                columns={approvedColumns}
                                dataSource={approvedAdmins}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 8 }}
                                scroll={{ x: 1000 }}
                            />
                        </Card>
                    </>
                );
            case 'profile':
                return (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ background: '#1a5c38', height: '120px', margin: '-24px -24px 0 -24px' }} />
                            <div style={{ marginTop: '-60px', textAlign: 'center', position: 'relative' }}>
                                <Avatar size={120} style={{ border: '4px solid #fff', backgroundColor: '#0a2e1f' }} icon={<UserOutlined />} />
                                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginTop: '16px', marginBottom: '4px' }}>{user.fullName || 'Super Admin'}</h1>
                                <Tag color="green">MASTER ACCESS LEVEL</Tag>
                            </div>
                            <Divider />
                            <Row gutter={[24, 24]}>
                                <Col span={12}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{user.email || 'admin@dairyportal.com'}</div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Type</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>System Administrator</div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Login</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{new Date().toLocaleDateString()}</div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>System Role</div>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a5c38' }}>SUPER_ADMIN</div>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                );
            case 'settings':
                return (
                    <Card bordered={false} style={{ borderRadius: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}><SettingOutlined /> Account Settings</h2>
                        <Divider />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>System Notifications</h4>
                                    <p style={{ color: '#6b7280', margin: 0 }}>Receive email alerts for new organization registrations</p>
                                </div>
                                <Button type="primary">Configure</Button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Two-Factor Authentication</h4>
                                    <p style={{ color: '#6b7280', margin: 0 }}>Add an extra layer of security to your admin account</p>
                                </div>
                                <Button disabled>Enable</Button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>Login History</h4>
                                    <p style={{ color: '#6b7280', margin: 0 }}>View recent access activities to your account</p>
                                </div>
                                <Button icon={<HistoryOutlined />}>View logs</Button>
                            </div>
                        </div>
                    </Card>
                );
            case 'orgs':
                return (
                    <Card
                        title={<span style={{ fontWeight: 800, fontSize: '18px', color: '#111827' }}>Organizational Structure Management</span>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                    >
                        <Table
                            columns={approvedColumns}
                            dataSource={approvedAdmins}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 12 }}
                            scroll={{ x: 1000 }}
                        />
                    </Card>
                );
            default:
                return renderEmptyState(activeTab.toUpperCase());
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
                    style={{
                        background: '#0a2e1f',
                        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        zIndex: 100
                    }}
                >
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {!collapsed ? (
                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                Dairy Portal
                            </div>
                        ) : (
                            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800, textAlign: 'center', width: '100%' }}>D</div>
                        )}
                    </div>

                    <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: 'rgba(255,255,255,0.65)', fontSize: '18px' }}
                        />
                    </div>

                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[activeTab]}
                        onClick={({ key }) => setActiveTab(key)}
                        style={{ background: 'transparent', borderRight: 0 }}
                        items={[
                            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard Overview' },
                            { key: 'orgs', icon: <BankOutlined />, label: 'Organizations' },
                            { key: 'users', icon: <TeamOutlined />, label: 'User Management' },
                            { key: 'reports', icon: <BarChartOutlined />, label: 'System Analytics' },
                            { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
                        ]}
                    />

                    <div style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
                        <Button
                            type="link"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            style={{
                                color: '#f87171',
                                padding: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            {!collapsed && <span>Logout Account</span>}
                        </Button>
                    </div>
                </Sider>

                <Layout>
                    <Header style={{
                        background: '#fff',
                        padding: '0 40px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '72px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 99
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '4px', height: '20px', background: '#1a5c38', borderRadius: '2px' }} />
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Super Admin Control Panel</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <Dropdown menu={userProfileMenu} placement="bottomRight" arrow>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                                    <div style={{ textAlign: 'right', display: collapsed ? 'none' : 'block' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{user.fullName || 'Super Admin'}</div>
                                        <div style={{ fontSize: '11px', color: '#1a5c38', fontWeight: 600, textTransform: 'uppercase' }}>Master Access</div>
                                    </div>
                                    <Avatar size={44} style={{ backgroundColor: '#1a5c38', boxShadow: '0 4px 12px rgba(26,92,56,0.2)' }} icon={<UserOutlined />} />
                                </div>
                            </Dropdown>
                        </div>
                    </Header>

                    <Content style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default SuperAdminDashboard;
