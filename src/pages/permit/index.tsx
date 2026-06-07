import { Routes, Route, Navigate } from 'react-router-dom'
import List from './List'
import Apply from './Apply'
import Detail from './Detail'

export default function PermitIndex() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="apply" element={<Apply />} />
      <Route path="detail/:id" element={<Detail />} />
      <Route path="*" element={<Navigate to="/permit" replace />} />
    </Routes>
  )
}
