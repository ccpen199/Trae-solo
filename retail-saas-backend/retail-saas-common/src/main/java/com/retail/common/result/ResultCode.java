package com.retail.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    
    ERROR(500, "系统异常"),
    
    BAD_REQUEST(400, "请求参数错误"),
    
    UNAUTHORIZED(401, "未授权，请登录"),
    
    FORBIDDEN(403, "无权限访问"),
    
    NOT_FOUND(404, "资源不存在"),
    
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),
    
    TOKEN_EXPIRED(4011, "Token已过期"),
    
    TOKEN_INVALID(4012, "Token无效"),
    
    USER_NOT_FOUND(4013, "用户不存在"),
    
    PASSWORD_ERROR(4014, "密码错误"),
    
    USER_DISABLED(4015, "用户已被禁用"),
    
    ORG_NOT_FOUND(4041, "组织不存在"),
    
    PRODUCT_NOT_FOUND(4042, "商品不存在"),
    
    STOCK_NOT_ENOUGH(4001, "库存不足"),
    
    PRICE_LOWER_THAN_COST(4002, "售价低于成本价"),
    
    PRICE_MARGIN_VIOLATION(4003, "价格违反毛利率规则"),
    
    ALLOCATION_NOT_FOUND(4043, "调拨单不存在"),
    
    ALLOCATION_STATUS_ERROR(4004, "调拨单状态不正确"),
    
    PROMOTION_NOT_FOUND(4044, "促销活动不存在"),
    
    PROMOTION_RULE_CONFLICT(4005, "促销规则冲突"),
    
    ORDER_NOT_FOUND(4045, "订单不存在"),
    
    ORDER_STATUS_ERROR(4006, "订单状态不正确"),
    
    SETTLEMENT_NOT_FOUND(4046, "结算单不存在"),
    
    SETTLEMENT_AMOUNT_ERROR(4007, "结算金额异常"),
    
    SYNC_CONFLICT(4008, "数据同步冲突"),
    
    SYNC_FAILED(5001, "数据同步失败"),
    
    DATABASE_ERROR(5002, "数据库操作异常"),
    
    CACHE_ERROR(5003, "缓存操作异常"),
    
    MESSAGE_QUEUE_ERROR(5004, "消息队列异常"),
    
    FILE_UPLOAD_ERROR(5005, "文件上传失败"),
    
    FILE_DOWNLOAD_ERROR(5006, "文件下载失败"),
    
    EXCEL_EXPORT_ERROR(5007, "Excel导出失败"),
    
    EXCEL_IMPORT_ERROR(5008, "Excel导入失败"),
    
    DUPLICATE_SUBMIT(4009, "请勿重复提交"),
    
    FREQUENT_OPERATION(4010, "操作过于频繁，请稍后再试");

    private final Integer code;

    private final String message;
}
