package com.guizhou.platform.living.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("living_category")
public class LivingCategory extends BaseEntity {

    private String categoryCode;

    private String categoryName;

    private String categoryIcon;

    private Long parentId;

    private Integer sortNum;

    private String description;

    private Integer enabled;
}
