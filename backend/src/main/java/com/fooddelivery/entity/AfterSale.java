package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("after_sale")
public class AfterSale extends BaseEntity {

    private String afterSaleNo;

    private Long orderId;

    private String orderNo;

    private String platformAfterSaleNo;

    private Long storeId;

    private Long merchantId;

    private Integer platformType;

    private Integer afterSaleType;

    private Integer afterSaleStatus;

    private BigDecimal applyAmount;

    private BigDecimal approvedAmount;

    private String applyReason;

    private String applyEvidence;

    private Long applyUserId;

    private LocalDateTime applyTime;

    private Long processUserId;

    private String processResult;

    private String processRemark;

    private LocalDateTime processTime;

    private String platformResponse;

    private String extInfo;
}
