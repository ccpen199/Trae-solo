package com.fooddelivery.enums;

import lombok.Getter;

@Getter
public enum AuditSource {
    MERCHANT_PORTAL("MERCHANT_PORTAL", "商家后台", "商家通过PC端操作"),
    CLERK_APP("CLERK_APP", "店员APP", "店员通过移动端操作"),
    RIDER_APP("RIDER_APP", "骑手APP", "骑手通过移动端操作"),
    PLATFORM_CALLBACK("PLATFORM_CALLBACK", "平台回调", "来自外卖平台的回调"),
    SYSTEM_AUTO("SYSTEM_AUTO", "系统自动", "系统自动处理"),
    ADMIN_OPERATION("ADMIN_OPERATION", "管理员操作", "系统管理员操作"),
    TIMER_JOB("TIMER_JOB", "定时任务", "定时任务触发");

    private final String code;
    private final String name;
    private final String description;

    AuditSource(String code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }
}
