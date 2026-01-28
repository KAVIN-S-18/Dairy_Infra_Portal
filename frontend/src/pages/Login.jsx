import React from 'react';
import { Form, Input, Button, Card, Row, Col, message } from 'antd';
import { LoginOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api';

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: values.email,
                password: values.password,
            });

            const { token, user } = response.data;

            // Store token and user info
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            message.success('Login successful!');

            // Navigate based on user role
            switch (user.role) {
                case 'SUPER_ADMIN':
                    navigate('/super-admin-dashboard');
                    break;
                case 'ADMIN':
                    navigate('/admin-dashboard');
                    break;
                case 'DISTRICT_MANAGER':
                    navigate('/district-manager-dashboard');
                    break;
                case 'TRANSPORT_MANAGER':
                    navigate('/transport-manager-dashboard');
                    break;
                case 'DRIVER':
                    navigate('/driver-dashboard');
                    break;
                case 'MPCS_OFFICER':
                    navigate('/mpcs-officer-dashboard');
                    break;
                case 'SUPERVISOR':
                    navigate('/supervisor-dashboard');
                    break;
                case 'OPERATOR':
                    navigate('/operator-dashboard');
                    break;
                case 'FARMER':
                    navigate('/farmer-dashboard');
                    break;
                default:
                    navigate('/');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Login failed. Please try again.';
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
                    maxWidth: '1000px',
                    margin: '0 auto',
                }}
            >
                <Row gutter={32} align="middle">
                    
                    {/* LEFT SIDE – INFO / BRANDING */}
                    <Col xs={24} md={12}>
                        <h1 style={{ color: 'white', marginBottom: '16px' }}>
                            Dairy Infra Portal
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                            Secure login for administrators and users to manage
                            dairy infrastructure, operations, and records.
                        </p>
                    </Col>

                    {/* RIGHT SIDE – LOGIN CARD */}
                    <Col xs={24} md={12}>
                        <Card
                            style={{
                                width: '100%',
                                borderRadius: '8px',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <h2 style={{ marginBottom: '10px', color: '#333' }}>
                                    Welcome Back
                                </h2>
                                <p style={{ color: '#666', marginBottom: '0' }}>
                                    Sign in to your account
                                </p>
                            </div>

                            <Form
                                form={form}
                                name="login"
                                layout="vertical"
                                onFinish={onFinish}
                                requiredMark={false}
                            >
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
                                    label="Password"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Please enter your password' },
                                        { min: 6, message: 'Password must be at least 6 characters' }
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Enter your password"
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
                                        icon={<LoginOutlined />}
                                        style={{ fontWeight: 'bold' }}
                                        loading={loading}
                                    >
                                        Login
                                    </Button>
                                </Form.Item>
                            </Form>

                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <p style={{ color: '#666', marginBottom: '0' }}>
                                    Don't have an account?{' '}
                                    <Link
                                        to="/"
                                        style={{
                                            color: '#667eea',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Go Back
                                    </Link>
                                </p>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Login;
