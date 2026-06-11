package com.guizhou.platform.ticket.service;

public interface SatisfactionService {

    void submitSatisfaction(Long ticketId, Integer score, String content);

    Double getAverageSatisfaction();

    Double getSatisfactionByDepartment(Long departmentId);

    Double getSatisfactionByTimeRange(String startTime, String endTime);
}
