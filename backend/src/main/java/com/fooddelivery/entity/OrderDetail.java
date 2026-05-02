package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("order_detail")
public class OrderDetail extends BaseEntity {

    private Long orderId;

    private String orderNo;

    private Long platformGoodsId;

    private String platformGoodsName;

    private String platformSpecName;

    private Long mappedGoodsId;

    private String mappedGoodsName;

    private String mappedSpecName;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal totalPrice;

    private String goodsRemark;

    private Integer goodsStatus;

    private String extInfo;
}
