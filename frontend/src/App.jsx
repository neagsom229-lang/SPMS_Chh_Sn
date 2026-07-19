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

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter
     future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/" element={
          user ? (
            <Layout user={user}>
              <Dashboard user={user} />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/dashboard" element={
          user ? (
            <Layout user={user}>
              <Dashboard user={user} />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/orders" element={
          user ? (
            <Layout user={user}>
              <Orders />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/products" element={
          user ? (
            <Layout user={user}>
              <Products />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/customers" element={
          user ? (
            <Layout user={user}>
              <Customers />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/stock" element={
          user ? (
            <Layout user={user}>
              <Stock />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/suppliers" element={
          user ? (
            <Layout user={user}>
              <Suppliers />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/reports" element={
          user ? (
            <Layout user={user}>
              <Reports />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/users" element={
          user ? (
            <Layout user={user}>
              <Users />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/activity" element={
          user ? (
            <Layout user={user}>
              <ActivityLog />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/warranty" element={
          user ? (
            <Layout user={user}>
              <Warranty />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/analytics" element={
  user ? (
    <Layout user={user}>
      <Analytics />
    </Layout>
  ) : (
    <Navigate to="/login" />
  )
} />
<Route path="/payment/:orderId" element={
  user ? (
    <Layout user={user}>
      <Payment />
    </Layout>
  ) : (
    <Navigate to="/login" />
  )
} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;