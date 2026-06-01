import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CasesList from './pages/CasesList';
import CaseDetail from './pages/CaseDetail';
import AlertsList from './pages/AlertsList';
import AlertDetail from './pages/AlertDetail';
import TasksList from './pages/TasksList';
import TaskDetail from './pages/TaskDetail';
import Statistics from './pages/Statistics';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<CasesList />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/alerts" element={<AlertsList />} />
        <Route path="/alerts/:id" element={<AlertDetail />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/statistics" element={<Statistics />} />
      </Routes>
    </Layout>
  );
}
