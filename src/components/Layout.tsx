import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function Layout() {
  return (
    <div className="min-h-screen bg-guardian-dark-900 flex">
      <Sidebar />
      <main className="flex-1 ml-[220px] transition-all duration-300">
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
