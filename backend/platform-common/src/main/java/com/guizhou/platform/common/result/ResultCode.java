package com.guizhou.platform.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    ERROR(500, "系统错误"),

    PARAM_ERROR(400, "参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "方法不允许"),
    TOO_MANY_REQUESTS(429, "请求过于频繁"),

    AUTH_FAIL(1001, "认证失败"),
    TOKEN_EXPIRED(1002, "Token已过期"),
    TOKEN_INVALID(1003, "Token无效"),
    USER_NOT_EXIST(1004, "用户不存在"),
    USER_PASSWORD_ERROR(1005, "密码错误"),
    USER_DISABLED(1006, "用户已被禁用"),
    VERIFICATION_CODE_ERROR(1007, "验证码错误"),

    PERMISSION_DENIED(2001, "权限不足"),
    ROLE_NOT_EXIST(2002, "角色不存在"),

    DATA_NOT_EXIST(3001, "数据不存在"),
    DATA_ALREADY_EXIST(3002, "数据已存在"),
    DATA_VALIDATION_FAILED(3003, "数据校验失败"),

    SERVICE_UNAVAILABLE(4001, "服务不可用"),
    SERVICE_TIMEOUT(4002, "服务调用超时"),
    SERVICE_DEGRADE(4003, "服务已降级"),

    DATABASE_ERROR(5001, "数据库操作异常"),
    CACHE_ERROR(5002, "缓存操作异常"),
    MESSAGE_QUEUE_ERROR(5003, "消息队列异常"),

    FILE_UPLOAD_ERROR(6001, "文件上传失败"),
    FILE_DOWNLOAD_ERROR(6002, "文件下载失败"),
    FILE_NOT_FOUND(6003, "文件不存在"),
    FILE_SIZE_EXCEED(6004, "文件大小超出限制"),

    SUBSIDY_POLICY_NOT_EXIST(7001, "补贴政策不存在"),
    SUBSIDY_NOT_ELIGIBLE(7002, "不符合补贴条件"),
    SUBSIDY_ALREADY_ISSUED(7003, "补贴已发放"),
    SUBSIDY_VERIFY_FAILED(7004, "补贴核销失败"),

    CERTIFICATE_NOT_EXIST(8001, "电子证照不存在"),
    CERTIFICATE_EXPIRED(8002, "证照已过期"),
    CERTIFICATE_REVOKED(8003, "证照已吊销"),
    CERTIFICATE_VERIFY_FAILED(8004, "证照核验失败"),

    TICKET_NOT_EXIST(9001, "工单不存在"),
    TICKET_ASSIGN_FAILED(9002, "工单分派失败"),
    TICKET_PROCESS_TIMEOUT(9003, "工单处理超时");

    private final Integer code;
    private final String message;
}
