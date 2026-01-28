import React from 'react';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ShopOutlined } from "@ant-design/icons";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminRegistration = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api';

    const organizationTypes = [
        { label: 'Cooperative', value: 'cooperative' },
        { label: 'Private Farm', value: 'private_farm' },
    ];

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                organizationName: values.organizationName,
                organizationType: values.organizationType,
            });

            message.success('Registration successful! Please wait for admin approval to login.');
            form.resetFields();
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
            message.error(errorMsg);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* CONTENT CONTAINER */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
                <Card
                    style={{
                        width: '100%',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ marginBottom: '10px', color: '#333' }}>
                            Admin Registration
                        </h2>
                        <p style={{ color: '#666', marginBottom: '0' }}>
                            Create your admin account
                        </p>
                    </div>

                    <Form
                        form={form}
                        name="admin_registration"
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            label="Full Name"
                            name="fullName"
                            rules={[
                                { required: true, message: 'Please enter your full name' },
                                { min: 2, message: 'Name must be at least 2 characters' }
                            ]}
                        >
                            <Input
                                placeholder="Enter your full name"
                                prefix={<UserOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                placeholder="Enter your email"
                                prefix={<MailOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Organization Name"
                            name="organizationName"
                            rules={[
                                { required: true, message: 'Please enter organization name' },
                                { min: 2, message: 'Organization name must be at least 2 characters' }
                            ]}
                        >
                            <Input
                                placeholder="Enter your organization name"
                                prefix={<ShopOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Organization Type"
                            name="organizationType"
                            rules={[
                                { required: true, message: 'Please select organization type' }
                            ]}
                        >
                            <Select
                                placeholder="Select organization type"
                                options={organizationTypes}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please enter a password' },
                                { min: 8, message: 'Password must be at least 8 characters' }
                            ]}
                        >
                            <Input.Password
                                placeholder="Enter your password"
                                prefix={<LockOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            name="confirmPassword"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm your password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match'));
                                    }
                                })
                            ]}
                        >
                            <Input.Password
                                placeholder="Confirm your password"
                                prefix={<LockOutlined />}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: '20px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                style={{ fontWeight: 'bold' }}
                                loading={loading}
                            >
                                Register
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <p style={{ color: '#666', marginBottom: '0' }}>
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                style={{
                                    color: '#667eea',
                                    fontWeight: 'bold',
                                    textDecoration: 'none',
                                }}
                            >
                                Login
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminRegistration;
