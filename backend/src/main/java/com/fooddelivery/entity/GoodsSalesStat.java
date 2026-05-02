package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("goods_sales_stat")
public class GoodsSalesStat extends BaseEntity {

    private Long storeId;

    private Long merchantId;

    private Long goodsId;

    private String goodsName;

    private Long specId;

    private String specName;

    private Integer platformType;

    private LocalDate statisticsDate;

    private Integer salesQuantity;

    private BigDecimal salesAmount;

    private Integer refundQuantity;

    private BigDecimal refundAmount;

    private String extInfo;
}
