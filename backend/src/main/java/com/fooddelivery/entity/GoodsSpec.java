package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("goods_spec")
public class GoodsSpec extends BaseEntity {

    private Long goodsId;

    private Long storeId;

    private String specName;

    private String specCode;

    private BigDecimal price;

    private BigDecimal costPrice;

    private Integer stock;

    private Integer status;

    private String extInfo;
}
