package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("order_status_log")
public class OrderStatusLog extends BaseEntity {

    private Long orderId;

    private String orderNo;

    private Integer fromStatus;

    private Integer toStatus;

    private String eventCode;

    private String eventName;

    private String sourceType;

    private String sourceName;

    private Long operatorId;

    private String operatorName;

    private String operatorRole;

    private String reason;

    private String extInfo;
}
