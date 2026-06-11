package com.guizhou.platform.living.enums;

import lombok.Getter;

@Getter
public enum BookingStatusEnum {

    PENDING_ASSIGN(0, "待派单"),
    ASSIGNED(1, "已派单"),
    SERVICE_CONFIRMING(2, "服务确认中"),
    IN_SERVICE(3, "服务中"),
    COMPLETED(4, "已完成"),
    CANCELLED(5, "已取消"),
    REFUNDED(6, "已退款"),
    DISPUTED(7, "争议中");

    private final Integer code;
    private final String desc;

    BookingStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static BookingStatusEnum getByCode(Integer code) {
        for (BookingStatusEnum e : values()) {
            if (e.getCode().equals(code)) {
                return e;
            }
        }
        return null;
    }
}
