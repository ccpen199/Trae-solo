import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CourseList = lazy(() => import('./pages/CourseList'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const CoursePlay = lazy(() => import('./pages/CoursePlay'));
const Community = lazy(() => import('./pages/Community'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Assessments = lazy(() => import('./pages/Assessments'));
const AssessmentDetail = lazy(() => import('./pages/AssessmentDetail'));
const StudyCenter = lazy(() => import('./pages/StudyCenter'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/:id/play" element={<ProtectedRoute><CoursePlay /></ProtectedRoute>} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/posts/:id" element={<PostDetail />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />
            <Route path="/study-center" element={<ProtectedRoute><StudyCenter /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
