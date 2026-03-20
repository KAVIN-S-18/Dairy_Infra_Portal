import React from 'react';
import { createBrowserRouter, RouterProvider, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppLayout from './components/AppLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import FarmerLogin from './pages/FarmerLogin';
import AdminRegistration from './pages/AdminRegistration';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DistrictManagerDashboard from './pages/DistrictManagerDashboard';
import TransportManagerDashboard from './pages/TransportManagerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import MPCSOfficerDashboard from './pages/MPCSOfficerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import FarmerDashboard from './pages/FarmerDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.id) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const GlobalErrorElement = () => <div style={{ padding: '50px', textAlign: 'center', background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
  <h1 style={{ fontSize: '3rem', margin: 0 }}>💿</h1>
  <h2 style={{ fontWeight: 800, color: '#111827' }}>Unexpected Application Error</h2>
  <p style={{ color: '#6b7280' }}>Our engineers have been notified. Please try refreshing the page.</p>
  <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#312e81', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Refresh Application</button>
</div>;

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <GlobalErrorElement />,
    element: <AppLayout><Home /></AppLayout>,
  },
  {
    path: '/login',
    errorElement: <GlobalErrorElement />,
    element: <AppLayout><Login /></AppLayout>,
  },
  {
    path: '/farmer-login',
    errorElement: <GlobalErrorElement />,
    element: <AppLayout><FarmerLogin /></AppLayout>,
  },
  {
    path: '/admin-registration',
    errorElement: <GlobalErrorElement />,
    element: <AppLayout><AdminRegistration /></AppLayout>,
  },
  {
    path: '/super-admin-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="SUPER_ADMIN"><SuperAdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/district-manager-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="DISTRICT_MANAGER"><DistrictManagerDashboard /></ProtectedRoute>,
  },
  {
    path: '/transport-manager-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="TRANSPORT_MANAGER"><TransportManagerDashboard /></ProtectedRoute>,
  },
  {
    path: '/driver-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="DRIVER"><DriverDashboard /></ProtectedRoute>,
  },
  {
    path: '/mpcs-officer-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="MPCS_OFFICER"><MPCSOfficerDashboard /></ProtectedRoute>,
  },
  {
    path: '/supervisor-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="SUPERVISOR"><SupervisorDashboard /></ProtectedRoute>,
  },
  {
    path: '/operator-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="OPERATOR"><OperatorDashboard /></ProtectedRoute>,
  },
  {
    path: '/farmer-dashboard',
    errorElement: <GlobalErrorElement />,
    element: <ProtectedRoute requiredRole="FARMER"><FarmerDashboard /></ProtectedRoute>,
  },
  {
    path: '*',
    errorElement: <GlobalErrorElement />,
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
