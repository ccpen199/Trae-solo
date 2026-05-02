package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("prod_product")
public class ProdProduct extends BaseEntity {

    private String skuCode;

    private String skuName;

    private Long categoryId;

    private Long brandId;

    private String unit;

    private String spec;

    private String barcode;

    private BigDecimal costPrice;

    private Integer isManageStock;

    private Integer status;
}
