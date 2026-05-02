package com.fooddelivery.enums;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING_RECEIVE(10, "待接单", "订单已创建，等待商家接单"),
    WAITING_PAYMENT(15, "待付款", "用户已下单，等待付款确认"),
    RECEIVED(20, "已接单", "商家已接单，等待制作"),
    PREPARING(30, "制作中", "厨房正在制作"),
    PREPARED(40, "待取餐", "制作完成，等待骑手取餐"),
    TAKING(45, "取餐中", "骑手已到店，正在取餐"),
    DELIVERING(50, "配送中", "骑手正在配送"),
    COMPLETED(60, "已完成", "订单已完成"),
    CANCELLED(70, "已取消", "订单已取消"),
    REFUNDING(80, "退款中", "申请退款中"),
    REFUNDED(90, "已退款", "退款完成");

    private final int code;
    private final String name;
    private final String description;

    OrderStatus(int code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public static OrderStatus fromCode(int code) {
        for (OrderStatus status : values()) {
            if (status.getCode() == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("未知订单状态: " + code);
    }
    
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == REFUNDED;
    }
}
