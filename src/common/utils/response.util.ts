export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export class ResponseUtil {
  static success<T>(data: T, message = '操作成功'): ApiResponse<T> {
    return {
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static created<T>(data: T, message = '创建成功'): ApiResponse<T> {
    return {
      code: 201,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static error(code: number, message: string, data: unknown = null): ApiResponse<unknown> {
    return {
      code,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static badRequest(message = '请求参数错误', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(400, message, data);
  }

  static unauthorized(message = '未授权，请先登录', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(401, message, data);
  }

  static forbidden(message = '没有权限执行此操作', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(403, message, data);
  }

  static notFound(message = '资源不存在', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(404, message, data);
  }

  static tooManyRequests(message = '请求过于频繁，请稍后再试', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(429, message, data);
  }

  static internalError(message = '服务器内部错误', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(500, message, data);
  }

  static serviceUnavailable(message = '服务暂不可用', data: unknown = null): ApiResponse<unknown> {
    return ResponseUtil.error(503, message, data);
  }
}
