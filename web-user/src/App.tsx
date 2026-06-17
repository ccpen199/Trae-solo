import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import DeviceList from "@/pages/DeviceList";
import DeviceDetail from "@/pages/DeviceDetail";
import Alerts from "@/pages/Alerts";
import Scenes from "@/pages/Scenes";
import Family from "@/pages/Family";
import Storage from "@/pages/Storage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DeviceList />} />
        <Route path="/device/:id" element={<DeviceDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/scenes" element={<Scenes />} />
        <Route path="/family" element={<Family />} />
        <Route path="/storage" element={<Storage />} />
      </Route>
    </Routes>
  );
}
