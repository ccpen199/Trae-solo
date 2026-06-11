package com.guizhou.platform.ticket.service;

import com.guizhou.platform.ticket.dto.response.HotspotVO;
import com.guizhou.platform.ticket.dto.response.TicketStatisticsVO;

import java.util.List;

public interface AnalysisService {

    TicketStatisticsVO getStatistics();

    List<HotspotVO> getCategoryHotspots(String startTime, String endTime);

    List<HotspotVO> getRegionHotspots(String startTime, String endTime);

    List<HotspotVO> getTimeTrend(String startTime, String endTime);

    List<HotspotVO> getDepartmentWorkload(String startTime, String endTime);
}
