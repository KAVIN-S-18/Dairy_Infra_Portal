import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Card, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from 'axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const API_URL = 'http://localhost:5000/api';
    const roleOptions = [
        { label: 'Farmer', value: 'FARMER' },
        { label: 'Supervisor', value: 'SUPERVISOR' },
        { label: 'Operator', value: 'OPERATOR' },
        { label: 'MPCS Officer', value: 'MPCS_OFFICER' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const response = await axios.get(`${API_URL}/users/by-admin/${user.id}`, { headers });
            setUsers(response.data);
        } catch (error) {
            message.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        setEditingUser(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEditUser = (record) => {
        setEditingUser(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDeleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.delete(`${API_URL}/users/${userId}`, { headers });
            message.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            message.error('Failed to delete user');
            console.error(error);
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (editingUser) {
                // Update user
                await axios.put(`${API_URL}/users/${editingUser.id}`, values, { headers });
                message.success('User updated successfully');
            } else {
                // Create new user
                const data = {
                    ...values,
                    adminId: user.id,
                };
                await axios.post(`${API_URL}/users/create`, data, { headers });
                message.success('User created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchUsers();
        } catch (error) {
            message.error(editingUser ? 'Failed to update user' : 'Failed to create user');
            console.error(error);
        }
    };

    const columns = [
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
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span style={{ color: status === 'APPROVED' ? 'green' : 'orange' }}>
                    {status}
                </span>
            ),
        },
        {
            title: 'Created',
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
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete User"
                        description="Are you sure you want to delete this user?"
                        onConfirm={() => handleDeleteUser(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>👥 Manage Users</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddUser}
                >
                    Add User
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                />
                {users.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#666' }}>No users yet. Click "Add User" to create one.</p>
                    </div>
                )}
            </Card>

            {/* Add/Edit User Modal */}
            <Modal
                title={editingUser ? 'Edit User' : 'Add New User'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                    >
                        <Input placeholder="Enter full name" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please enter password' }]}
                        >
                            <Input.Password placeholder="Enter password" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="Role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                    >
                        <Select
                            placeholder="Select role"
                            options={roleOptions}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
