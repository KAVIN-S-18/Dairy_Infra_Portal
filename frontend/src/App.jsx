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

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout><Home /></AppLayout>,
  },
  {
    path: '/login',
    element: <AppLayout><Login /></AppLayout>,
  },
  {
    path: '/farmer-login',
    element: <AppLayout><FarmerLogin /></AppLayout>,
  },
  {
    path: '/admin-registration',
    element: <AppLayout><AdminRegistration /></AppLayout>,
  },
  {
    path: '/super-admin-dashboard',
    element: <ProtectedRoute requiredRole="SUPER_ADMIN"><SuperAdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin-dashboard',
    element: <ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/district-manager-dashboard',
    element: <ProtectedRoute requiredRole="DISTRICT_MANAGER"><DistrictManagerDashboard /></ProtectedRoute>,
  },
  {
    path: '/transport-manager-dashboard',
    element: <ProtectedRoute requiredRole="TRANSPORT_MANAGER"><TransportManagerDashboard /></ProtectedRoute>,
  },
  {
    path: '/driver-dashboard',
    element: <ProtectedRoute requiredRole="DRIVER"><DriverDashboard /></ProtectedRoute>,
  },
  {
    path: '/mpcs-officer-dashboard',
    element: <ProtectedRoute requiredRole="MPCS_OFFICER"><MPCSOfficerDashboard /></ProtectedRoute>,
  },
  {
    path: '/supervisor-dashboard',
    element: <ProtectedRoute requiredRole="SUPERVISOR"><SupervisorDashboard /></ProtectedRoute>,
  },
  {
    path: '/operator-dashboard',
    element: <ProtectedRoute requiredRole="OPERATOR"><OperatorDashboard /></ProtectedRoute>,
  },
  {
    path: '/farmer-dashboard',
    element: <ProtectedRoute requiredRole="FARMER"><FarmerDashboard /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
