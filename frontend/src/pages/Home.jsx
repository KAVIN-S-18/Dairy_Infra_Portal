import React from 'react';
import { Button, Row, Col, Card, Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { LoginOutlined, UserAddOutlined, ShoppingOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const Home = () => {
    return (
        <div>
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
                <Row gutter={56} align="middle">
                    
                    {/* LEFT CONTENT */}
                    <Col xs={24} md={14}>
                        <div style={{ maxWidth: '600px' }}>
                            <Title
                                style={{
                                    color: 'white',
                                    fontSize: '48px',
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    marginBottom: '20px'
                                }}
                            >
                                Dairy Infrastructure
                                <br />
                                Management Portal
                            </Title>

                            <Paragraph
                                style={{
                                    color: 'rgba(255,255,255,0.95)',
                                    fontSize: '18px',
                                    lineHeight: 1.7,
                                    marginBottom: '16px'
                                }}
                            >
                                A centralized web platform to manage dairy infrastructure,
                                administrators, and operational users across cooperative
                                and private dairy sectors.
                            </Paragraph>

                            <Paragraph
                                style={{
                                    color: 'rgba(255,255,255,0.85)',
                                    fontSize: '16px',
                                    lineHeight: 1.6
                                }}
                            >
                                Enables secure role-based access, streamlined onboarding,
                                and efficient monitoring of dairy operations.
                            </Paragraph>
                        </div>
                    </Col>

                    {/* RIGHT ACTION PANEL */}
                    <Col xs={24} md={10}>
                        <Card
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                border: 'none'
                            }}
                        >
                            <Title level={4} style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
                                Get Started
                            </Title>
                            <Paragraph type="secondary" style={{ marginBottom: '24px', fontSize: '14px' }}>
                                Choose an option to continue
                            </Paragraph>

                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<LoginOutlined />}
                                    style={{
                                        height: '50px',
                                        fontWeight: 600,
                                        marginBottom: '12px',
                                        borderRadius: '6px',
                                        fontSize: '15px'
                                    }}
                                >
                                    Login
                                </Button>
                            </Link>

                            <Link to="/farmer-login" style={{ textDecoration: 'none' }}>
                                <Button
                                    size="large"
                                    block
                                    icon={<ShoppingOutlined />}
                                    style={{
                                        height: '50px',
                                        fontWeight: 600,
                                        marginBottom: '12px',
                                        borderRadius: '6px',
                                        fontSize: '15px'
                                    }}
                                >
                                    Farmer Login
                                </Button>
                            </Link>

                            <Divider style={{ margin: '16px 0' }} />

                            <Link to="/admin-registration" style={{ textDecoration: 'none' }}>
                                <Button
                                    size="large"
                                    block
                                    icon={<UserAddOutlined />}
                                    style={{
                                        height: '48px',
                                        marginBottom: '10px',
                                        borderRadius: '6px',
                                        fontWeight: 600
                                    }}
                                >
                                    Register Cooperative
                                </Button>
                            </Link>

                            <Link to="/admin-registration" style={{ textDecoration: 'none' }}>
                                <Button
                                    size="large"
                                    block
                                    icon={<UserAddOutlined />}
                                    style={{
                                        height: '48px',
                                        borderRadius: '6px',
                                        fontWeight: 600
                                    }}
                                >
                                    Register Private
                                </Button>
                            </Link>
                        </Card>
                    </Col>
                </Row>

                {/* FOOTER */}
                <div
                    style={{
                        marginTop: '60px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '13px',
                    }}
                >
                    © 2026 Dairy Infra Portal. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Home;
