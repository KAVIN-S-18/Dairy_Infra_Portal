import React from 'react';
import { Form, Input, Button, Card, Row, Col, message } from 'antd';
import { LoginOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const FarmerLogin = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();

    const API_URL = 'http://localhost:5000/api';

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/farmer-login`, {
                phoneNumber: values.phoneNumber,
                password: values.password,
            });

            const { token, user } = response.data;

            // Store token and user info
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            message.success('Login successful!');
            navigate('/farmer-dashboard');
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
                    maxWidth: '500px',
                    margin: '0 auto',
                }}
            >
                <Row gutter={32} justify="center">
                    <Col xs={24} sm={20} md={16}>
                        <Card
                            style={{
                                width: '100%',
                                borderRadius: '8px',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <h2 style={{ marginBottom: '10px', color: '#333' }}>
                                    Farmer Login
                                </h2>
                                <p style={{ color: '#666', marginBottom: '0' }}>
                                    Sign in to your farmer account
                                </p>
                            </div>

                            <Form
                                form={form}
                                name="farmer-login"
                                layout="vertical"
                                onFinish={onFinish}
                                requiredMark={false}
                            >
                                <Form.Item
                                    label="Phone Number"
                                    name="phoneNumber"
                                    rules={[
                                        { required: true, message: 'Please enter your phone number' },
                                        { len: 10, message: 'Phone number must be 10 digits' }
                                    ]}
                                >
                                    <Input
                                        placeholder="Enter your 10-digit phone number"
                                        prefix={<PhoneOutlined />}
                                        size="large"
                                        maxLength={10}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Password"
                                    name="password"
                                    rules={[
                                        { required: true, message: 'Please enter your password' },
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Enter your password (Date of birth DDMMYYYY)"
                                        prefix={<LockOutlined />}
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    style={{ 
                                        marginBottom: '20px',
                                        padding: '12px',
                                        backgroundColor: '#e6f7ff',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <p style={{ margin: 0, fontSize: '12px', color: '#0050b3' }}>
                                        Default password: Your date of birth in DDMMYYYY format
                                        <br />
                                        Example: 17021981 (17 Feb 1981)
                                    </p>
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
                                    <Link
                                        to="/"
                                        style={{
                                            color: '#667eea',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Back to Home
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

export default FarmerLogin;
