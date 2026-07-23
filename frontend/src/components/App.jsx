// frontend/src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Products from './components/Products';
import Customers from './components/Customers';
import Stock from './components/Stock';
import Reports from './components/Reports';
import Layout from './components/Layout';
import Warranty from './components/Warranty';


function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
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
        <Route path="/reports" element={
          user ? (
            <Layout user={user}>
              <Reports />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;

