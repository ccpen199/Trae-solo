package com.guizhou.platform.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HotlineMessageDTO {

    @NotBlank(message = "消息ID不能为空")
    private String messageId;

    private String callId;

    @NotBlank(message = "来电号码不能为空")
    private String callerNumber;

    private String calleeNumber;

    private LocalDateTime callTime;

    private Integer callDuration;

    private String callerName;

    private String callerIdCard;

    @NotBlank(message = "通话内容不能为空")
    private String callContent;

    private Integer messageType;

    private String regionCode;

    private String regionName;
}
