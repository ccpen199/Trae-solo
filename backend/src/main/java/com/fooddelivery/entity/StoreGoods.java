package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("store_goods")
public class StoreGoods extends BaseEntity {

    private Long storeId;

    private Long merchantId;

    private Long categoryId;

    private String goodsName;

    private String goodsCode;

    private String goodsImage;

    private String description;

    private Integer sortOrder;

    private Integer status;

    private String extInfo;
}
