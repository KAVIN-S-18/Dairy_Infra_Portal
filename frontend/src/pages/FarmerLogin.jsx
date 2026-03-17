import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/home-bg.jpg';
import './portal.css';

const { Text } = Typography;

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
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            message.success('Login successful!');
            navigate('/farmer-dashboard');
        } catch (error) {
            message.error(error.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dip-page">
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
                    <Link to="/login" className="dip-nav-link">Staff Login</Link>
                    <Link to="/farmer-login" className="dip-nav-link active">Farmer Login</Link>
                    <Link to="/admin-registration" className="dip-nav-link">Register</Link>
                </div>
            </nav>

            {/* ── Centered card ── */}
            <div className="dip-body">
                <div className="dip-card">
                    <span className="dip-card-site">Dairy Infra Portal</span>
                    <h2 className="dip-card-title">Farmer Sign In</h2>
                    <p className="dip-card-sub">Enter your phone number and date of birth</p>

                    {/* Login instructions notice */}
                    <div className="dip-notice">
                        <strong>Phone Number</strong> — your 10-digit registered mobile number<br />
                        <strong>Password</strong> — date of birth in <strong>DDMMYYYY</strong> format<br />
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>e.g., 17 February 1981 → 17021981</span>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        className="dip-form"
                    >
                        <Form.Item
                            label="Phone Number"
                            name="phoneNumber"
                            rules={[
                                { required: true, message: 'Please enter your phone number' },
                                { len: 10, message: 'Must be exactly 10 digits' },
                            ]}
                        >
                            <Input placeholder="10-digit mobile number" size="large" maxLength={10} />
                        </Form.Item>

                        <Form.Item
                            label="Password (Date of Birth)"
                            name="password"
                            rules={[{ required: true, message: 'Please enter your date of birth as password' }]}
                            extra={<span style={{ fontSize: '12px', color: '#9ca3af' }}>Format: DDMMYYYY &nbsp;·&nbsp; e.g., 17021981</span>}
                        >
                            <Input.Password placeholder="DDMMYYYY" size="large" />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
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
                        <p>Staff member? <Link to="/login">Staff Login →</Link></p>
                        <p><Link to="/" className="muted">← Back to Home</Link></p>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="dip-page-footer">
                <span>© 2026 Dairy Infra Portal · All rights reserved</span>
                <span>Secure · Farmer Access</span>
            </div>
        </div>
    );
};

export default FarmerLogin;
