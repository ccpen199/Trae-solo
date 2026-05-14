import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { AuthProvider } from './store/auth'
import { Layout, PrivateRoute, AdminRoute } from './components/Layout'
import { AppErrorBoundary } from './components/ErrorBoundary'

import { LoginPage, RegisterPage } from './pages/Auth'
import { HomePage, QuestionListPage, ArticleListPage } from './pages/Home'
import { AskQuestionPage, QuestionDetailPage, ArticleDetailPage } from './pages/Content'
import { UserProfilePage, MyProfilePage, NotificationsPage } from './pages/Profile'
import { AdminPage } from './pages/Admin'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#f5f6fa',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>加载失败</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          {error?.message || '页面出现了问题'}
        </p>
        <button
          onClick={resetErrorBoundary}
          style={{
            padding: '12px 32px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          点击重试
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route path="/" element={
                <Layout>
                  <HomePage />
                </Layout>
              } />
              
              <Route path="/questions" element={
                <Layout>
                  <QuestionListPage />
                </Layout>
              } />
              
              <Route path="/articles" element={
                <Layout>
                  <ArticleListPage />
                </Layout>
              } />
              
              <Route path="/question/new" element={
                <Layout>
                  <PrivateRoute>
                    <AskQuestionPage />
                  </PrivateRoute>
                </Layout>
              } />
              
              <Route path="/question/:id" element={
                <Layout>
                  <QuestionDetailPage />
                </Layout>
              } />
              
              <Route path="/article/:id" element={
                <Layout>
                  <ArticleDetailPage />
                </Layout>
              } />
              
              <Route path="/user/:id" element={
                <Layout>
                  <UserProfilePage />
                </Layout>
              } />
              
              <Route path="/profile" element={
                <Layout>
                  <PrivateRoute>
                    <MyProfilePage />
                  </PrivateRoute>
                </Layout>
              } />
              
              <Route path="/notifications" element={
                <Layout>
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                </Layout>
              } />
              
              <Route path="/admin" element={
                <Layout>
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                </Layout>
              } />
              
              <Route path="*" element={
                <Layout>
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>页面不存在</h2>
                    <p style={{ color: '#6b7280' }}>您访问的页面不存在或已被删除</p>
                  </div>
                </Layout>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AppErrorBoundary>
    </ErrorBoundary>
  )
}

export default App
