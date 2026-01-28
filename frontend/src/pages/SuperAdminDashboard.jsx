import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Statistic, Row, Col, Modal, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [pendingAdmins, setPendingAdmins] = useState([]);
    const [approvedAdmins, setApprovedAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

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

    const pendingColumns = [
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
            title: 'Organization',
            dataIndex: 'organizationName',
            key: 'organizationName',
        },
        {
            title: 'Type',
            dataIndex: 'organizationType',
            key: 'organizationType',
            render: (text) => (
                <Tag color={text === 'COOPERATIVE' ? 'blue' : 'orange'}>{text}</Tag>
            ),
        },
        {
            title: 'Registered',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprove(record.id)}
                    >
                        Approve
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleReject(record.id)}
                    >
                        Reject
                    </Button>
                </Space>
            ),
        },
    ];

    const approvedColumns = [
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
            title: 'Organization',
            dataIndex: 'organizationName',
            key: 'organizationName',
        },
        {
            title: 'Type',
            dataIndex: 'organizationType',
            key: 'organizationType',
            render: (text) => (
                <Tag color={text === 'COOPERATIVE' ? 'blue' : 'orange'}>{text}</Tag>
            ),
        },
        {
            title: 'Approved Date',
            dataIndex: 'approvedAt',
            key: 'approvedAt',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
    ];

    return (
        <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>🔐 Super Admin Dashboard</h1>
                <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </div>

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: '30px' }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Pending Approvals"
                            value={pendingAdmins.length}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Approved Admins"
                            value={approvedAdmins.length}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Pending Admin Registrations */}
            <Card
                title="📋 Pending Admin Approvals"
                style={{ marginBottom: '30px' }}
                loading={loading}
            >
                <Table
                    columns={pendingColumns}
                    dataSource={pendingAdmins}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                />
                {pendingAdmins.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#666' }}>No pending approvals</p>
                    </div>
                )}
            </Card>

            {/* Approved Admins */}
            <Card
                title="✅ Approved Admins"
                loading={loading}
            >
                <Table
                    columns={approvedColumns}
                    dataSource={approvedAdmins}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                />
                {approvedAdmins.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#666' }}>No approved admins</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SuperAdminDashboard;
