import { Routes, Route, Navigate } from 'react-router-dom'
import List from './List'
import Report from './Report'
import Detail from './Detail'

export default function ViolationPage() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="list" element={<List />} />
      <Route path="report" element={<Report />} />
      <Route path="detail/:id" element={<Detail />} />
      <Route path="*" element={<Navigate to="/violation/list" replace />} />
    </Routes>
  )
}
