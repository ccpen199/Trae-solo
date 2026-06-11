import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import Devices from "./pages/Devices";
import { Fitness } from "./pages/Fitness";
import { Sleep } from "./pages/Sleep";
import { Vitals } from "./pages/Vitals";
import { Alerts } from "./pages/Alerts";
import { Records } from "./pages/Records";
import { useWebSocket } from "./hooks/useWebSocket";
import { api } from "./utils/api";
import type {
  Device,
  VitalRecord,
  SleepRecord,
  ExerciseRecord,
  ExercisePlan,
  Alert,
  AlertRule,
  HealthArchive,
  HISDepartment,
  HISDoctor,
  HISAppointment,
  DataAuthorization,
  HealthScoreBreakdown,
} from "../shared/types";
import { useHealthStore } from "./store/useHealthStore";

function AppRoutes() {
  useWebSocket();
  const {
    setDevices,
    setCurrentVitals,
    setHealthScore,
    setHrvTrend,
    setStressTrend,
    setHeartRateTrend,
    setBloodOxygenTrend,
    setSleepRecords,
    setExerciseRecords,
    setExercisePlan,
    setAlerts,
    setActiveAlerts,
    setAlertRules,
    setArchives,
    setHisDepartments,
    setHisDoctors,
    setHisAppointments,
    setAuthorizations,
    setLoading,
    setError,
  } = useHealthStore();

  useEffect(() => {
    async function loadInitialData() {
      setLoading("initial", true);
      try {
        const [
          devices,
          realtime,
          healthScore,
          hrvData,
          stressData,
          hrData,
          spo2Data,
          sleepData,
          exerciseData,
          planData,
          alertsData,
          activeAlertsData,
          rulesData,
          archivesData,
          deptsData,
          doctorsData,
          appointmentsData,
          authsData,
        ] = await Promise.all([
          api.devices.list() as Promise<Device[]>,
          api.health.realtime() as Promise<VitalRecord>,
          api.health.healthScore() as Promise<HealthScoreBreakdown & { baselineHeartRate?: number }>,
          api.health.hrv("7d") as Promise<Array<{ timestamp: string; hrv: number; heartRate: number }>>,
          api.health.stress("7d") as Promise<Array<{ timestamp: string; stressIndex: number; heartRate: number }>>,
          api.health.heartRate("7d") as Promise<Array<{ timestamp: string; heartRate: number; restingHeartRate: number }>>,
          api.health.bloodOxygen("7d") as Promise<Array<{ timestamp: string; bloodOxygen: number }>>,
          api.health.sleep("30d") as Promise<SleepRecord[]>,
          api.health.exercise("30d") as Promise<ExerciseRecord[]>,
          api.health.currentPlan() as Promise<ExercisePlan>,
          api.alerts.list() as Promise<Alert[]>,
          api.alerts.active() as Promise<Alert[]>,
          api.alerts.rules() as Promise<AlertRule[]>,
          api.archives.list() as Promise<HealthArchive[]>,
          api.archives.hisDepartments() as Promise<HISDepartment[]>,
          api.archives.hisDoctors() as Promise<HISDoctor[]>,
          api.archives.hisAppointments() as Promise<HISAppointment[]>,
          api.archives.authorizations() as Promise<DataAuthorization[]>,
        ]);

        setDevices(devices);
        setCurrentVitals(realtime);
        setHealthScore(healthScore);
        setHrvTrend(hrvData);
        setStressTrend(stressData);
        setHeartRateTrend(hrData);
        setBloodOxygenTrend(spo2Data);
        setSleepRecords(sleepData);
        setExerciseRecords(exerciseData);
        setExercisePlan(planData);
        setAlerts(alertsData);
        setActiveAlerts(activeAlertsData);
        setAlertRules(rulesData);
        setArchives(archivesData);
        setHisDepartments(deptsData);
        setHisDoctors(doctorsData);
        setHisAppointments(appointmentsData);
        setAuthorizations(authsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : "加载数据失败");
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading("initial", false);
      }
    }

    loadInitialData();
  }, [
    setDevices,
    setCurrentVitals,
    setHealthScore,
    setHrvTrend,
    setStressTrend,
    setHeartRateTrend,
    setBloodOxygenTrend,
    setSleepRecords,
    setExerciseRecords,
    setExercisePlan,
    setAlerts,
    setActiveAlerts,
    setAlertRules,
    setArchives,
    setHisDepartments,
    setHisDoctors,
    setHisAppointments,
    setAuthorizations,
    setLoading,
    setError,
  ]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/sleep" element={<Sleep />} />
        <Route path="/vitals" element={<Vitals />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/records" element={<Records />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
