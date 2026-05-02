package com.fooddelivery.enums;

import lombok.Getter;

@Getter
public enum OrderEvent {
    PAYMENT_CONFIRMED("PAYMENT_CONFIRMED", "支付确认"),
    RECEIVE_ORDER("RECEIVE_ORDER", "接单"),
    START_PREPARE("START_PREPARE", "开始制作"),
    FINISH_PREPARE("FINISH_PREPARE", "制作完成"),
    RIDER_TAKE_ORDER("RIDER_TAKE_ORDER", "骑手取餐"),
    START_DELIVERY("START_DELIVERY", "开始配送"),
    COMPLETE_ORDER("COMPLETE_ORDER", "完成订单"),
    CANCEL_ORDER("CANCEL_ORDER", "取消订单"),
    APPLY_REFUND("APPLY_REFUND", "申请退款"),
    PROCESS_REFUND("PROCESS_REFUND", "处理退款"),
    REFUND_COMPLETE("REFUND_COMPLETE", "退款完成"),
    REJECT_REFUND("REJECT_REFUND", "拒绝退款");

    private final String code;
    private final String name;

    OrderEvent(String code, String name) {
        this.code = code;
        this.name = name;
    }
}
