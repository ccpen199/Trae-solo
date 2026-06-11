package com.guizhou.platform.ticket.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.guizhou.platform.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("ticket")
public class Ticket extends BaseEntity {

    private String ticketNo;

    private String title;

    private String content;

    private Integer category;

    private Integer priority;

    private Integer status;

    private Integer source;

    private String citizenName;

    private String citizenPhone;

    private String citizenIdCard;

    private String regionCode;

    private String regionName;

    private String address;

    private Long departmentId;

    private String departmentName;

    private Long handlerId;

    private String handlerName;

    private LocalDateTime assignTime;

    private LocalDateTime deadline;

    private LocalDateTime completeTime;

    private LocalDateTime closeTime;

    private Integer satisfaction;

    private String satisfactionContent;

    private String nlpCategory;

    private String nlpKeywords;

    private Double nlpConfidence;

    private Integer dispatchType;

    private String remark;
}
