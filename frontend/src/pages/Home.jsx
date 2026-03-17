import React from 'react';
import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import bgImage from '../assets/home-bg.jpg';
import './portal.css';

const { Text } = Typography;

const Home = () => {
    return (
        <div className="dip-page">
            {/* ── Premium Gradient Background ── */}
            <div className="dip-bg-container">
                <div className="dip-bg-pattern" />
            </div>
            <div className="dip-overlay" />

            {/* ── Top Nav ── */}
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

            {/* ── Hero body ── */}
            <div
                className="dip-body"
                style={{ alignItems: 'flex-end', justifyContent: 'space-between', padding: '56px 60px 100px', flexWrap: 'wrap', gap: '48px' }}
            >
                {/* Left hero text */}
                <div style={{ maxWidth: '520px' }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.28)',
                        borderRadius: '4px',
                        padding: '4px 14px',
                        marginBottom: '20px',
                    }}>
                        <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
                            Management System
                        </Text>
                    </div>

                    <h1 style={{
                        color: '#ffffff',
                        fontSize: '58px',
                        fontWeight: 800,
                        lineHeight: 1.08,
                        margin: '0 0 20px 0',
                        letterSpacing: '-1.5px',
                        textShadow: '0 2px 28px rgba(0,0,0,0.35)',
                    }}>
                        Dairy Infra<br />Portal
                    </h1>

                    <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '16px', lineHeight: 1.75, margin: '0 0 36px 0' }}>
                        A centralized platform for managing dairy infrastructure, operations,
                        and stakeholders across cooperative and private dairy sectors with
                        secure, role-based access for every stakeholder.
                    </p>

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button style={{
                                height: '48px', padding: '0 32px',
                                background: '#1a5c38', color: 'white', border: 'none',
                                borderRadius: '6px', fontWeight: 700, fontSize: '13px',
                                letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 16px rgba(26,92,56,0.45)',
                            }}>STAFF LOGIN</button>
                        </Link>
                        <Link to="/farmer-login" style={{ textDecoration: 'none' }}>
                            <button style={{
                                height: '48px', padding: '0 32px',
                                background: 'transparent', color: 'white',
                                border: '1.5px solid rgba(255,255,255,0.55)',
                                borderRadius: '6px', fontWeight: 700, fontSize: '13px',
                                letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit',
                            }}>FARMER LOGIN</button>
                        </Link>
                    </div>
                </div>

                {/* Right stats card */}
                <div style={{
                    background: 'rgba(255,255,255,0.97)',
                    borderRadius: '14px',
                    minWidth: '260px',
                    width: '276px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}>
                    <div style={{ padding: '20px 28px 16px', background: '#1a5c38' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                            Platform Overview
                        </Text>
                        <Text style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Live operational metrics</Text>
                    </div>
                    <div style={{ padding: '6px 28px 20px' }}>
                        {[
                            { label: 'Active Users', value: '62+' },
                            { label: 'Registered Farmers', value: '24' },
                            { label: 'Districts Covered', value: '4' },
                            { label: 'MPCS Officers', value: '8' },
                        ].map((s, i) => (
                            <div key={s.label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '13px 0',
                                borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none',
                            }}>
                                <Text style={{ color: '#6b7280', fontSize: '13px' }}>{s.label}</Text>
                                <Text style={{ color: '#111827', fontSize: '24px', fontWeight: 800 }}>{s.value}</Text>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '0 28px 24px' }}>
                        <Link to="/admin-registration" style={{ textDecoration: 'none', display: 'block' }}>
                            <button style={{
                                width: '100%', height: '42px',
                                background: 'transparent', color: '#1a5c38',
                                border: '1.5px solid #1a5c38', borderRadius: '6px',
                                fontWeight: 700, fontSize: '12px', letterSpacing: '0.8px',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>REGISTER ORGANIZATION</button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="dip-page-footer">
                <span>© 2026 Dairy Infra Portal · All rights reserved</span>
                <span>Secure · Role-Based · Centralized</span>
            </div>
        </div>
    );
};

export default Home;
