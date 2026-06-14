import { useState, useEffect, useCallback } from "react";
import type { UserLocation } from "../../shared/types";

const QINGDAO_GOVERNMENT: UserLocation = {
  lat: 36.0671,
  lng: 120.3826,
  district: "市南区",
  address: "青岛市人民政府",
  accuracy: 0,
};

export interface UseLocationResult {
  location: UserLocation;
  loading: boolean;
  error: string | null;
  permission: PermissionState | "unsupported";
  refresh: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation>(QINGDAO_GOVERNMENT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState | "unsupported">(
    "prompt"
  );

  const isGeolocationSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const applyFallback = useCallback((reason: string) => {
    setLocation(QINGDAO_GOVERNMENT);
    setError(reason);
    setLoading(false);
  }, []);

  const fetchLocation = useCallback(() => {
    if (!isGeolocationSupported) {
      setPermission("unsupported");
      applyFallback("浏览器不支持定位功能");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          district: "",
          address: "",
          accuracy: position.coords.accuracy,
        };
        setLocation(userLocation);
        setLoading(false);
        setPermission("granted");
      },
      (err) => {
        let reason = "获取位置失败";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermission("denied");
            reason = "定位权限被拒绝，已使用默认位置";
            break;
          case err.POSITION_UNAVAILABLE:
            reason = "位置信息不可用，已使用默认位置";
            break;
          case err.TIMEOUT:
            reason = "获取位置超时，已使用默认位置";
            break;
        }
        applyFallback(reason);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [isGeolocationSupported, applyFallback]);

  useEffect(() => {
    if (!isGeolocationSupported) {
      setPermission("unsupported");
      return;
    }

    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          setPermission(status.state);
          status.onchange = () => {
            setPermission(status.state);
          };
        })
        .catch(() => {
          setPermission("prompt");
        });
    }

    fetchLocation();
  }, [isGeolocationSupported, fetchLocation]);

  return {
    location,
    loading,
    error,
    permission,
    refresh: fetchLocation,
  };
}
