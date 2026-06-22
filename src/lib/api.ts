import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { useUserStore } from "@/store/user";

const api: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      "data" in body &&
      body.success === true
    ) {
      return { ...response, data: body.data };
    }
    if (body && typeof body === "object" && "success" in body && body.success === false) {
      return Promise.reject({
        response: {
          data: body,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: response.config,
        },
        message: body.error || "请求失败",
        isAxiosError: false,
        toJSON: () => ({}),
        name: "BusinessError",
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const store = useUserStore.getState();
      if (store.token) {
        store.logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    if (
      error.response?.data &&
      typeof error.response.data === "object" &&
      "error" in error.response.data
    ) {
      error.message = error.response.data.error || error.message;
    }
    return Promise.reject(error);
  }
);

export default api;
