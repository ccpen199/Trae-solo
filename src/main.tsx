import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import Toast from "@/components/Toast";
import { useAppStore } from "@/store/useAppStore";
import "./index.css";

function RootApp() {
  const { setOnline } = useAppStore();

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [setOnline]);

  return (
    <>
      <App />
      <Toast />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <RootApp />
    </Router>
  </StrictMode>
);
