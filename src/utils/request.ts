import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types";

const request: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res.code !== 0 && res.code !== 200) {
      if (res.code === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const message = error.response?.data?.message || error.message || "网络错误";
    return Promise.reject(new Error(message));
  }
);

export function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get<unknown, AxiosResponse<ApiResponse<T>>>(url, config).then((res) => res.data.data);
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.post<unknown, AxiosResponse<ApiResponse<T>>>(url, data, config).then((res) => res.data.data);
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.put<unknown, AxiosResponse<ApiResponse<T>>>(url, data, config).then((res) => res.data.data);
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete<unknown, AxiosResponse<ApiResponse<T>>>(url, config).then((res) => res.data.data);
}

export default request;
