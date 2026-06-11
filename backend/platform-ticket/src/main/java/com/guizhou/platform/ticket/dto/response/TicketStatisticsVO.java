package com.guizhou.platform.ticket.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TicketStatisticsVO {

    private Long totalTickets;

    private Long pendingTickets;

    private Long processingTickets;

    private Long completedTickets;

    private Long closedTickets;

    private Long overdueTickets;

    private BigDecimal completionRate;

    private BigDecimal satisfactionRate;

    private BigDecimal avgProcessHours;

    private Long todayTickets;

    private Long weekTickets;

    private Long monthTickets;
}
