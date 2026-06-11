package com.guizhou.platform.ticket.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketDetailVO {

    private Long id;

    private String ticketNo;

    private String title;

    private String content;

    private Integer category;

    private String categoryDesc;

    private Integer priority;

    private String priorityDesc;

    private Integer status;

    private String statusDesc;

    private Integer source;

    private String sourceDesc;

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

    private String dispatchTypeDesc;

    private LocalDateTime createTime;

    private List<ProcessRecord> processRecords;

    @Data
    public static class ProcessRecord {

        private Integer processType;

        private String processContent;

        private String operatorName;

        private String operatorDept;

        private LocalDateTime processTime;
    }
}
