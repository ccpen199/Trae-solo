package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("prod_category")
public class ProdCategory extends BaseEntity {

    private Long parentId;

    private String categoryName;

    private String categoryCode;

    private Integer level;

    private String path;

    private String icon;

    private Integer sort;

    private Integer status;
}
