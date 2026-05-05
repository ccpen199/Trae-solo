import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Books from './pages/Books';
import BookManagement from './pages/admin/BookManagement';
import ReaderManagement from './pages/admin/ReaderManagement';
import AdminManagement from './pages/admin/AdminManagement';
import BorrowManagement from './pages/admin/BorrowManagement';
import BorrowRecords from './pages/reader/BorrowRecords';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <Layout>
                <Navigate to="/books" replace />
              </Layout>
            }
          />

          <Route
            path="/books"
            element={
              <Layout>
                <Books />
              </Layout>
            }
          />

          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route
              path="/admin/books"
              element={
                <Layout>
                  <BookManagement />
                </Layout>
              }
            />
            <Route
              path="/admin/readers"
              element={
                <Layout>
                  <ReaderManagement />
                </Layout>
              }
            />
            <Route
              path="/admin/borrows"
              element={
                <Layout>
                  <BorrowManagement />
                </Layout>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <Layout>
                  <AdminManagement />
                </Layout>
              }
            />
          </Route>

          <Route element={<ProtectedRoute requiredRole="reader" />}>
            <Route
              path="/reader/records"
              element={
                <Layout>
                  <BorrowRecords />
                </Layout>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
