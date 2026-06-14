const BASE_URL = "/api";

export interface ApiError extends Error {
  status: number;
  data?: unknown;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const headers = {
      ...defaultHeaders,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      let data: unknown = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(
          typeof data === "object" && data !== null && "error" in data
            ? (data as { error: string }).error
            : typeof data === "object" && data !== null && "message" in data
            ? (data as { message: string }).message
            : `HTTP ${response.status}: ${response.statusText}`
        ) as ApiError;
        error.status = response.status;
        error.data = data;
        throw error;
      }
      const dataObj = data as Record<string, unknown>;
      if (
        typeof data === "object" &&
        data !== null &&
        "success" in dataObj &&
        "data" in dataObj
      ) {
        const wrapped = dataObj as { success: boolean; data: unknown };
        if (wrapped.success) {
          return wrapped.data as T;
        }
        const error = new Error(
          typeof wrapped.data === "string"
            ? wrapped.data
            : "请求失败"
        ) as ApiError;
        error.status = response.status;
        error.data = wrapped.data;
        throw error;
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === "ApiError") {
        throw error;
      }
      const networkError = new Error(
        error instanceof Error ? error.message : "网络请求失败"
      ) as ApiError;
      networkError.status = 0;
      networkError.data = error;
      throw networkError;
    }
  }

  get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    let fullUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl = `${url}?${queryString}`;
      }
    }
    return this.request<T>(fullUrl, { method: "GET" });
  }

  post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }
}

export const client = new HttpClient(BASE_URL);
