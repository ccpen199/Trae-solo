from typing import Any, Optional
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None


def success_response(data: Any = None, message: str = "操作成功") -> ApiResponse:
    return ApiResponse(success=True, data=data, message=message)


def error_response(message: str = "操作失败", data: Any = None) -> ApiResponse:
    return ApiResponse(success=False, data=data, message=message)
