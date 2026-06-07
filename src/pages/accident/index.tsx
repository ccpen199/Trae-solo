import { Routes, Route, Navigate } from 'react-router-dom'
import List from './List'
import Detail from './Detail'

export default function AccidentPage() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="list" element={<List />} />
      <Route path="detail/:id" element={<Detail />} />
      <Route path="*" element={<Navigate to="/accident/list" replace />} />
    </Routes>
  )
}
