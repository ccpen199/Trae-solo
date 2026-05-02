package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("goods_mapping")
public class GoodsMapping extends BaseEntity {

    private Long storeId;

    private Long merchantId;

    private Integer platformType;

    private String platformStoreId;

    private Long platformGoodsId;

    private String platformGoodsName;

    private Long platformSpecId;

    private String platformSpecName;

    private Long mappedGoodsId;

    private String mappedGoodsName;

    private Long mappedSpecId;

    private String mappedSpecName;

    private Integer matchType;

    private String matchRule;

    private Integer mappingStatus;

    private String mappingReason;

    private String extInfo;
}
