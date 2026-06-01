import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import MainLayout from "@/components/Layout/MainLayout"
import Dashboard from "@/pages/Dashboard"
import ShipOrder from "@/pages/ShipOrder"
import BatchImport from "@/pages/BatchImport"
import ScanOrder from "@/pages/ScanOrder"
import VoiceOrder from "@/pages/VoiceOrder"
import RoutingConfig from "@/pages/RoutingConfig"
import TrackList from "@/pages/TrackList"
import TrackDetail from "@/pages/TrackDetail"
import ExceptionCenter from "@/pages/ExceptionCenter"
import ExpressOrder from "@/pages/ExpressOrder"
import ProtocolConfig from "@/pages/ProtocolConfig"
import BulkOrder from "@/pages/BulkOrder"
import ProviderDirectory from "@/pages/ProviderDirectory"
import CostCalculator from "@/pages/CostCalculator"
import TwinNetwork from "@/pages/TwinNetwork"
import TwinVehicles from "@/pages/TwinVehicles"
import TwinWeather from "@/pages/TwinWeather"
import SecurityDesensitize from "@/pages/SecurityDesensitize"
import SecurityDecrypt from "@/pages/SecurityDecrypt"
import SecurityCompliance from "@/pages/SecurityCompliance"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ship" element={<ShipOrder />} />
          <Route path="ship/batch" element={<BatchImport />} />
          <Route path="ship/scan" element={<ScanOrder />} />
          <Route path="ship/voice" element={<VoiceOrder />} />
          <Route path="ship/routing" element={<RoutingConfig />} />
          <Route path="track" element={<TrackList />} />
          <Route path="track/:id" element={<TrackDetail />} />
          <Route path="track/exception" element={<ExceptionCenter />} />
          <Route path="express" element={<ExpressOrder />} />
          <Route path="express/protocol" element={<ProtocolConfig />} />
          <Route path="bulk" element={<BulkOrder />} />
          <Route path="bulk/providers" element={<ProviderDirectory />} />
          <Route path="bulk/calculator" element={<CostCalculator />} />
          <Route path="twin/network" element={<TwinNetwork />} />
          <Route path="twin/vehicles" element={<TwinVehicles />} />
          <Route path="twin/weather" element={<TwinWeather />} />
          <Route path="security" element={<SecurityDesensitize />} />
          <Route path="security/decrypt" element={<SecurityDecrypt />} />
          <Route path="security/compliance" element={<SecurityCompliance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}
