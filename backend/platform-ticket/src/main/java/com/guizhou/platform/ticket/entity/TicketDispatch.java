package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ticket_dispatch")
public class TicketDispatch extends BaseEntity {

    private Long ticketId;

    private String ticketNo;

    private Long fromDepartmentId;

    private String fromDepartmentName;

    private Long toDepartmentId;

    private String toDepartmentName;

    private Long toHandlerId;

    private String toHandlerName;

    private Integer dispatchType;

    private String dispatchReason;

    private Double matchScore;

    private String nlpCategory;

    private String nlpKeywords;

    private Double nlpConfidence;

    private Integer dispatchStatus;

    private LocalDateTime dispatchTime;

    private LocalDateTime acceptTime;

    private String rejectReason;
}
