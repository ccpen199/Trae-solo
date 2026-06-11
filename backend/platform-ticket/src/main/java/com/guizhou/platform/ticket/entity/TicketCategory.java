package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ticket_category")
public class TicketCategory extends BaseEntity {

    private String categoryCode;

    private String categoryName;

    private Long parentId;

    private String parentCode;

    private Integer categoryLevel;

    private String keywords;

    private String description;

    private Long defaultDeptId;

    private String defaultDeptName;

    private Integer sortOrder;

    private Integer categoryStatus;

    private String remark;
}
