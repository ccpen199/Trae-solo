package com.guizhou.platform.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketProcessDTO {

    @NotNull(message = "工单ID不能为空")
    private Long ticketId;

    @NotNull(message = "处理类型不能为空")
    private Integer processType;

    @NotBlank(message = "处理内容不能为空")
    private String processContent;

    private String operatorName;

    private String operatorDept;

    private String attachment;
}
