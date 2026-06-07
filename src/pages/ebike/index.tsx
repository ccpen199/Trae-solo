import { Routes, Route } from 'react-router-dom'
import List from './List'
import Register from './Register'
import Detail from './Detail'

export default function EbikeIndex() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="list" element={<List />} />
      <Route path="register" element={<Register />} />
      <Route path="detail/:id" element={<Detail />} />
    </Routes>
  )
}
