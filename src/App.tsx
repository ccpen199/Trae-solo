import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import Login from "@/pages/Login"
import Layout from "@/components/Layout"
import StudentHome from "@/pages/student/StudentHome"
import Dispense from "@/pages/student/Dispense"
import Bills from "@/pages/student/Bills"
import Recharge from "@/pages/student/Recharge"
import DeviceList from "@/pages/operator/DeviceList"
import DeviceDetail from "@/pages/operator/DeviceDetail"
import AlertCenter from "@/pages/operator/AlertCenter"
import Firmware from "@/pages/operator/Firmware"
import Dashboard from "@/pages/investor/Dashboard"
import DeviceMap from "@/pages/investor/DeviceMap"
import DeviceAnalysis from "@/pages/investor/DeviceAnalysis"
import ROI from "@/pages/investor/ROI"
import type { UserRole } from "@/types"

const VALID_ROLES: UserRole[] = ["student", "operator", "investor"]

function getAuth(): { isLoggedIn: boolean; role: UserRole | null } {
  try {
    const token = localStorage.getItem("wateriot-token")
    const role = localStorage.getItem("wateriot-role") as UserRole | null
    if (token && role && VALID_ROLES.includes(role)) {
      return { isLoggedIn: true, role }
    }
  } catch (e) {
    // ignore
  }
  return { isLoggedIn: false, role: null }
}

function AuthGuard({ requiredRole }: { requiredRole: UserRole }) {
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const auth = getAuth()
    if (!auth.isLoggedIn || auth.role !== requiredRole) {
      try {
        navigate("/login", { replace: true })
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }, 100)
      return
    }
    setAuthorized(true)
  }, [navigate, requiredRole])

  if (!authorized) return null
  return <Layout />
}

function RedirectDefault() {
  const navigate = useNavigate()

  useEffect(() => {
    const auth = getAuth()
    const target = auth.isLoggedIn && auth.role ? `/${auth.role}` : "/login"
    try {
      navigate(target, { replace: true })
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      if (window.location.pathname !== target) {
        window.location.href = target
      }
    }, 100)
  }, [navigate])

  return null
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/student" element={<AuthGuard requiredRole="student" />}>
          <Route index element={<StudentHome />} />
          <Route path="dispense" element={<Dispense />} />
          <Route path="bills" element={<Bills />} />
          <Route path="bills/:id" element={<Bills />} />
          <Route path="recharge" element={<Recharge />} />
        </Route>

        <Route path="/operator" element={<AuthGuard requiredRole="operator" />}>
          <Route index element={<DeviceList />} />
          <Route path="device/:id" element={<DeviceDetail />} />
          <Route path="alerts" element={<AlertCenter />} />
          <Route path="firmware" element={<Firmware />} />
        </Route>

        <Route path="/investor" element={<AuthGuard requiredRole="investor" />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<DeviceMap />} />
          <Route path="device/:id" element={<DeviceAnalysis />} />
          <Route path="analysis" element={<DeviceAnalysis />} />
          <Route path="roi" element={<ROI />} />
        </Route>

        <Route path="*" element={<RedirectDefault />} />
      </Routes>
    </Router>
  )
}
