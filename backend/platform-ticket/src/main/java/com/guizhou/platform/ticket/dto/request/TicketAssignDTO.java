package com.guizhou.platform.ticket.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketAssignDTO {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    @NotNull(message = "部门ID不能为空")
    private Long departmentId;

    private String departmentName;

    private Long handlerId;

    private String handlerName;

    private String assignReason;
}
