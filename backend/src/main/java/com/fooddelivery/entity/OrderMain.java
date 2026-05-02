package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("order_main")
public class OrderMain extends BaseEntity {

    private String orderNo;

    private String platformOrderNo;

    private Long storeId;

    private Long merchantId;

    private Integer platformType;

    private String platformStoreId;

    private Integer orderStatus;

    private Integer receiveType;

    private Long receiveBy;

    private LocalDateTime receiveTime;

    private String customerName;

    private String customerPhone;

    private String deliveryAddress;

    private String longitude;

    private String latitude;

    private BigDecimal orderAmount;

    private BigDecimal goodsAmount;

    private BigDecimal deliveryFee;

    private BigDecimal packageFee;

    private BigDecimal discountAmount;

    private BigDecimal paidAmount;

    private String orderRemark;

    private Integer deliveryType;

    private Long riderId;

    private String riderName;

    private String riderPhone;

    private LocalDateTime prepareStartTime;

    private LocalDateTime prepareEndTime;

    private LocalDateTime riderTakeTime;

    private LocalDateTime deliveryStartTime;

    private LocalDateTime deliveryEndTime;

    private LocalDateTime completeTime;

    private Integer printed;

    private Integer printCount;

    private LocalDateTime lastPrintTime;

    private Integer hasAfterSale;

    private String extInfo;
}
