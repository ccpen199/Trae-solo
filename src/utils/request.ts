import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { message } from "antd";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
  traceId?: string;
}

interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean;
  showError?: boolean;
  unwrap?: boolean;
}

type LoadingKey = string | symbol;

const TOKEN_KEY = "app_token";

class RequestManager {
  private instance: AxiosInstance;
  private loadingCount = 0;
  private loadingMap = new Map<LoadingKey, number>();
  private defaultConfig: RequestConfig;

  constructor() {
    this.defaultConfig = {
      baseURL: "/api/v1",
      timeout: 30000,
      showLoading: false,
      showError: true,
      unwrap: true,
    };

    this.instance = axios.create(this.defaultConfig);

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) =>
        this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => this.handleResponse(response),
      (error) => this.handleError(error)
    );
  }

  private handleRequest(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    const reqConfig = config as InternalAxiosRequestConfig & RequestConfig;
    const token = this.getToken();

    const headers = config.headers || ({} as NonNullable<InternalAxiosRequestConfig["headers"]>);

    if (token) {
      headers.set?.("Authorization", `Bearer ${token}`) ||
        Object.assign(headers, { Authorization: `Bearer ${token}` });
    }

    const contentType = headers.get?.("Content-Type");
    if (!contentType) {
      headers.set?.("Content-Type", "application/json") ||
        Object.assign(headers, { "Content-Type": "application/json" });
    }

    config.headers = headers;

    if (reqConfig.showLoading) {
      this.showLoading(config);
    }

    return config;
  }

  private handleResponse(response: AxiosResponse) {
    const config = response.config as RequestConfig;

    if (config.showLoading) {
      this.hideLoading(response.config);
    }

    const res = response.data as ApiResponse;

    if (!this.isApiResponse(res)) {
      return config.unwrap ? response.data : response;
    }

    if (res.code === 0 || res.code === 200) {
      return config.unwrap ? res.data : res;
    }

    if (res.code === 401 || res.code === 403) {
      this.handleUnauthorized(res.message);
      return Promise.reject(res);
    }

    if (config.showError) {
      message.error(res.message || "请求失败");
    }

    return Promise.reject(res);
  }

  private handleError(error: unknown): Promise<never> {
    try {
      this.hideLoading();
    } catch {
      // ignore
    }

    const axiosError = error as {
      config?: RequestConfig;
      response?: AxiosResponse;
      message?: string;
      code?: string;
    };

    const showError = axiosError.config?.showError !== false;
    let errorMessage = "网络请求失败，请稍后重试";

    if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
      errorMessage = "请求超时，请检查网络连接";
    } else if (axiosError.code === "ERR_NETWORK") {
      errorMessage = "网络连接失败，请检查网络";
    } else if (axiosError.response) {
      const { status } = axiosError.response;

      switch (status) {
        case 400:
          errorMessage = "请求参数错误";
          break;
        case 401:
          errorMessage = "登录已过期，请重新登录";
          this.handleUnauthorized(errorMessage);
          break;
        case 403:
          errorMessage = "没有权限访问该资源";
          break;
        case 404:
          errorMessage = "请求的资源不存在";
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
          errorMessage = `服务器错误 (${status})，请稍后重试`;
          break;
        default:
          errorMessage = `请求失败 (${status})`;
      }

      const resData = axiosError.response.data as ApiResponse | undefined;
      if (resData?.message) {
        errorMessage = resData.message;
      }
    }

    if (showError) {
      message.error(errorMessage);
    }

    return Promise.reject({
      message: errorMessage,
      original: error,
    });
  }

  private isApiResponse(data: unknown): data is ApiResponse {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      "code" in d && typeof d.code === "number" && "message" in d && "data" in d
    );
  }

  private handleUnauthorized(msg: string): void {
    message.warning(msg || "登录已过期，请重新登录");
    this.clearAuth();
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirect=${redirect}`;
  }

  private showLoading(config: AxiosRequestConfig): void {
    const key = this.getLoadingKey(config);
    const count = this.loadingMap.get(key) || 0;
    this.loadingMap.set(key, count + 1);

    this.loadingCount++;

    if (typeof window !== "undefined" && !document.getElementById("global-request-loading")) {
      const el = document.createElement("div");
      el.id = "global-request-loading";
      el.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        z-index: 9999;
        background: linear-gradient(90deg, transparent, #FF6B1A, transparent);
        background-size: 200% 100%;
        animation: shimmer 1s linear infinite;
      `;
      document.body.appendChild(el);
    }
  }

  private hideLoading(config?: AxiosRequestConfig): void {
    if (config) {
      const key = this.getLoadingKey(config);
      const count = (this.loadingMap.get(key) || 0) - 1;
      if (count <= 0) {
        this.loadingMap.delete(key);
      } else {
        this.loadingMap.set(key, count);
      }
    }

    this.loadingCount = Math.max(0, this.loadingCount - 1);

    if (this.loadingCount === 0) {
      const el = document.getElementById("global-request-loading");
      if (el) {
        el.remove();
      }
    }
  }

  private getLoadingKey(config: AxiosRequestConfig): LoadingKey {
    return Symbol.for(`${config.method || "GET"}_${config.url || ""}`);
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearAuth(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("app_user");
    sessionStorage.clear();
  }

  async request<T = unknown>(config: RequestConfig): Promise<T> {
    return this.instance.request<T, T>(config);
  }

  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "GET", url });
  }

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "POST", url, data });
  }

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PUT", url, data });
  }

  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "PATCH", url, data });
  }

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: "DELETE", url });
  }

  upload<T = unknown>(url: string, file: File | FormData, config?: RequestConfig): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (!(file instanceof FormData)) {
      formData.append("file", file);
    }

    return this.request<T>({
      ...config,
      method: "POST",
      url,
      data: formData,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

const request = new RequestManager();

export default request;

export const {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  getToken,
  setToken,
  clearAuth,
} = request;
