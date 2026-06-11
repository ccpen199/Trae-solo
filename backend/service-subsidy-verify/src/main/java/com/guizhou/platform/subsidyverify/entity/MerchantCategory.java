package com.guizhou.platform.subsidyverify.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("merchant_category")
public class MerchantCategory extends BaseEntity {

    private String categoryCode;

    private String categoryName;

    private String description;

    private String icon;

    private Integer sortOrder;

    private Integer enabled;
}
