import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Products from './components/Products';
import Customers from './components/Customers';
import Stock from './components/Stock';
import Suppliers from './components/Suppliers';
import Reports from './components/Reports';
import Users from './components/Users';
import ActivityLog from './components/ActivityLog';
import Warranty from './components/Warranty';
import Layout from './components/Layout';
import Analytics from './components/Analytics';
import Payment from './components/Payment';
import { ThemeProvider } from './context/ThemeContext';
import Profile from './components/Profile';

function App() {
  const [user, setUser] = useState(null);

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login setUser={setUser} />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* ✅ FIXED: Order detail routes */}
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/orders/:id/process"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Stock />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Suppliers />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <ActivityLog />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/warranty"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Warranty />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/payment/:orderId"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Payment />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={
  user ? (
    <Layout user={user}>
      <Profile user={user} />
    </Layout>
  ) : (
    <Navigate to="/login" />
  )
} />

          
          {/* Catch all - redirect to dashboard if logged in, else login */}
          <Route
            path="*"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;