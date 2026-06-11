package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ticket_process")
public class TicketProcess extends BaseEntity {

    private Long ticketId;

    private String ticketNo;

    private Integer processType;

    private String processContent;

    private Long operatorId;

    private String operatorName;

    private String operatorDept;

    private LocalDateTime processTime;

    private String attachment;

    private String remark;
}
