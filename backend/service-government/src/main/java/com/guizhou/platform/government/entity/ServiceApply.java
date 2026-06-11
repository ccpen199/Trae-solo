package com.guizhou.platform.government.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("service_apply")
public class ServiceApply extends BaseEntity {

    private String applyNo;

    private Long itemId;

    private String itemCode;

    private String itemName;

    private Long categoryId;

    private String categoryCode;

    private String applicantType;

    private String applicantName;

    private String applicantIdCard;

    private String applicantPhone;

    private String applicantAddress;

    private String legalPersonName;

    private String unifiedSocialCode;

    private Integer applyStatus;

    private String applyReason;

    private LocalDateTime applyTime;

    private LocalDateTime acceptTime;

    private LocalDateTime completeTime;

    private String handlerName;

    private String handlerPhone;

    private String department;

    private String departmentCode;

    private String reviewOpinion;

    private String completeResult;

    private String resultDocumentNo;

    private String remark;
}
