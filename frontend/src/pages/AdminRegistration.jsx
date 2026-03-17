import React from 'react';
import { Form, Input, Button, Select, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/home-bg.jpg';
import './portal.css';

const { Text } = Typography;

const AdminRegistration = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();
    const API_URL = 'http://localhost:5000/api';

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                organizationName: values.organizationName,
                organizationType: values.organizationType,
            });
            message.success('Registration submitted. Awaiting Super Admin approval.');
            form.resetFields();
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            message.error(error.response?.data?.error || 'Registration failed. Please try again.');
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
                    <Link to="/farmer-login" className="dip-nav-link">Farmer Login</Link>
                    <Link to="/admin-registration" className="dip-nav-link active">Register</Link>
                </div>
            </nav>

            {/* ── Centered form card (wider for registration) ── */}
            <div className="dip-body" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
                <div className="dip-card wide">
                    <span className="dip-card-site">Dairy Infra Portal</span>
                    <h2 className="dip-card-title">Create Account</h2>
                    <p className="dip-card-sub">Register your dairy organization</p>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        className="dip-form"
                    >
                        <Form.Item
                            label="Full Name"
                            name="fullName"
                            rules={[
                                { required: true, message: 'Please enter your full name' },
                                { min: 2, message: 'Minimum 2 characters' },
                            ]}
                        >
                            <Input placeholder="Your full name" size="large" />
                        </Form.Item>

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
                            label="Organization Name"
                            name="organizationName"
                            rules={[
                                { required: true, message: 'Please enter your organization name' },
                                { min: 2, message: 'Minimum 2 characters' },
                            ]}
                        >
                            <Input placeholder="Your organization or farm name" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Organization Type"
                            name="organizationType"
                            rules={[{ required: true, message: 'Please select an organization type' }]}
                        >
                            <Select
                                placeholder="Select type"
                                size="large"
                                options={[
                                    { label: 'Cooperative', value: 'cooperative' },
                                    { label: 'Private Farm', value: 'private_farm' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: 'Please enter a password' },
                                { min: 8, message: 'Minimum 8 characters' },
                            ]}
                        >
                            <Input.Password placeholder="Minimum 8 characters" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Confirm Password"
                            name="confirmPassword"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm your password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject(new Error('Passwords do not match'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Re-enter your password" size="large" />
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
                                Submit Registration
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="dip-card-footer">
                        <p>Already registered? <Link to="/login">Sign In</Link></p>
                        <p><Link to="/" className="muted">← Back to Home</Link></p>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="dip-page-footer">
                <span>© 2026 Dairy Infra Portal · All rights reserved</span>
                <span>Pending Super Admin Approval</span>
            </div>
        </div>
    );
};

export default AdminRegistration;
