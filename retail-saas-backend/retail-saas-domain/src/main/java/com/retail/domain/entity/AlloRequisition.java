package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("allo_requisition")
public class AlloRequisition extends BaseEntity {

    private String reqNo;

    private Long reqOrgId;

    private Long fromOrgId;

    private String status;

    private String reqReason;

    private String auditComment;

    private Long auditBy;

    private LocalDateTime auditTime;

    private LocalDateTime completeTime;
}
