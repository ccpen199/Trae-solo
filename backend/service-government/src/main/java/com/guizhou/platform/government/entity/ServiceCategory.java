package com.guizhou.platform.government.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_category")
public class ServiceCategory extends BaseEntity {

    private String categoryCode;

    private String categoryName;

    private Long parentId;

    private Integer level;

    private String icon;

    private Integer sortNum;

    private Integer itemCount;

    private Integer isVisible;

    private String description;

    private String remark;
}
