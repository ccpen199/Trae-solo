package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("daily_statistics")
public class DailyStatistics extends BaseEntity {

    private Long storeId;

    private Long merchantId;

    private LocalDate statisticsDate;

    private Integer platformType;

    private Integer orderCount;

    private Integer validOrderCount;

    private Integer cancelOrderCount;

    private Integer refundOrderCount;

    private BigDecimal totalAmount;

    private BigDecimal validAmount;

    private BigDecimal cancelAmount;

    private BigDecimal refundAmount;

    private Integer receiveCount;

    private Integer autoReceiveCount;

    private Integer manualReceiveCount;

    private Integer printCount;

    private BigDecimal avgDeliveryTime;

    private BigDecimal avgPrepareTime;

    private String extInfo;
}
