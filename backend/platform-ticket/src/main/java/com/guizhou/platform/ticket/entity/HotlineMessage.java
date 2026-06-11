package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hotline_message")
public class HotlineMessage extends BaseEntity {

    private String messageId;

    private String callId;

    private String callerNumber;

    private String calleeNumber;

    private LocalDateTime callTime;

    private Integer callDuration;

    private String callerName;

    private String callerIdCard;

    private String callContent;

    private Integer messageType;

    private Integer processStatus;

    private Long ticketId;

    private String ticketNo;

    private String regionCode;

    private String regionName;

    private String remark;
}
