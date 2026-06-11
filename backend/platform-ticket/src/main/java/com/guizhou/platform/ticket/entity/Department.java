package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("department")
public class Department extends BaseEntity {

    private String deptCode;

    private String deptName;

    private String deptShortName;

    private Long parentId;

    private String parentCode;

    private Integer deptLevel;

    private String regionCode;

    private String regionName;

    private String responsibility;

    private String categoryKeywords;

    private Integer deptStatus;

    private Integer sortOrder;

    private String leaderName;

    private String leaderPhone;

    private String remark;
}
