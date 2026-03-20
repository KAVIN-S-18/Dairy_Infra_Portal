import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/home-bg.jpg';
import './portal.css';

const { Text } = Typography;

const Login = () => {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
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
            // Write to sessionStorage for per-tab isolation (allows different users in different tabs)
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            // Also write to localStorage as fallback for components that still read from it
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            messageApi.success('Login successful!');
            switch (user.role) {
                case 'SUPER_ADMIN': navigate('/super-admin-dashboard'); break;
                case 'ADMIN': navigate('/admin-dashboard'); break;
                case 'DISTRICT_MANAGER': navigate('/district-manager-dashboard'); break;
                case 'TRANSPORT_MANAGER': navigate('/transport-manager-dashboard'); break;
                case 'DRIVER': navigate('/driver-dashboard'); break;
                case 'MPCS_OFFICER': navigate('/mpcs-officer-dashboard'); break;
                case 'SUPERVISOR': navigate('/supervisor-dashboard'); break;
                case 'OPERATOR': navigate('/operator-dashboard'); break;
                case 'FARMER': navigate('/farmer-dashboard'); break;
                default: navigate('/');
            }
        } catch (error) {
            messageApi.error(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dip-page">
            {contextHolder}
            {/* ── Premium Gradient Background ── */}
            <div className="dip-bg-container">
                <div className="dip-bg-pattern" />
            </div>
            <div className="dip-overlay" />

            {/* ── Top Nav (same as Home) ── */}
            <nav className="dip-nav">
                <Link to="/" className="dip-nav-brand">
                    <span className="dip-nav-brand-name">Dairy Infra Portal</span>
                    <span className="dip-nav-brand-sub">Infrastructure Management System</span>
                </Link>
                <div className="dip-nav-links">
                    <Link to="/login" className="dip-nav-link active">Staff Login</Link>
                    <Link to="/farmer-login" className="dip-nav-link">Farmer Login</Link>
                    <Link to="/admin-registration" className="dip-nav-link">Register</Link>
                </div>
            </nav>

            {/* ── Centered card ── */}
            <div className="dip-body">
                <div className="dip-card">
                    <span className="dip-card-site">Dairy Infra Portal</span>
                    <h2 className="dip-card-title">Welcome Back</h2>
                    <p className="dip-card-sub">Sign in to your staff account</p>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        className="dip-form"
                    >
                        <Form.Item
                            label="Email Address"
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Enter a valid email address' },
                            ]}
                        >
                            <Input placeholder="you@example.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                        >
                            <Input.Password placeholder="Enter your password" size="large" />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                className="dip-btn"
                                style={{
                                    height: '48px',
                                    borderRadius: '8px',
                                    background: '#1a5c38',
                                    borderColor: '#1a5c38',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    letterSpacing: '0.6px',
                                    marginTop: '8px',
                                }}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="dip-card-footer">
                        <p>Are you a farmer? <Link to="/farmer-login">Farmer Login →</Link></p>
                        <p>New organization? <Link to="/admin-registration">Register here</Link></p>
                        <p><Link to="/" className="muted">← Back to Home</Link></p>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="dip-page-footer">
                <span>© 2026 Dairy Infra Portal · All rights reserved</span>
                <span>Secure · Role-Based Access</span>
            </div>
        </div>
    );
};

export default Login;
