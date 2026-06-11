package com.guizhou.platform.ticket.service.impl;

import com.guizhou.platform.ticket.dto.response.HotspotVO;
import com.guizhou.platform.ticket.dto.response.TicketStatisticsVO;
import com.guizhou.platform.ticket.enums.TicketStatusEnum;
import com.guizhou.platform.ticket.mapper.TicketMapper;
import com.guizhou.platform.ticket.service.AnalysisService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AnalysisServiceImpl implements AnalysisService {

    @Resource
    private TicketMapper ticketMapper;

    @Override
    public TicketStatisticsVO getStatistics() {
        TicketStatisticsVO vo = new TicketStatisticsVO();

        vo.setTotalTickets(ticketMapper.selectCount(null));
        vo.setPendingTickets(ticketMapper.countByStatus(TicketStatusEnum.PENDING.getCode()));
        vo.setProcessingTickets(
                ticketMapper.countByStatus(TicketStatusEnum.ASSIGNED.getCode())
                + ticketMapper.countByStatus(TicketStatusEnum.PROCESSING.getCode())
        );
        vo.setCompletedTickets(ticketMapper.countByStatus(TicketStatusEnum.COMPLETED.getCode()));
        vo.setClosedTickets(ticketMapper.countByStatus(TicketStatusEnum.CLOSED.getCode()));
        vo.setOverdueTickets(ticketMapper.countOverdue(TicketStatusEnum.PROCESSING.getCode()));

        if (vo.getTotalTickets() > 0) {
            BigDecimal rate = new BigDecimal(vo.getCompletedTickets() + vo.getClosedTickets())
                    .divide(new BigDecimal(vo.getTotalTickets()), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100));
            vo.setCompletionRate(rate);
        } else {
            vo.setCompletionRate(BigDecimal.ZERO);
        }

        Long completed = ticketMapper.countCompleted();
        Long satisfied = ticketMapper.countSatisfied();
        if (completed != null && completed > 0 && satisfied != null) {
            vo.setSatisfactionRate(new BigDecimal(satisfied)
                    .divide(new BigDecimal(completed), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100)));
        } else {
            vo.setSatisfactionRate(BigDecimal.ZERO);
        }

        Double avgHours = ticketMapper.avgProcessHours(LocalDateTime.now().minusMonths(1));
        vo.setAvgProcessHours(avgHours != null ? BigDecimal.valueOf(avgHours) : BigDecimal.ZERO);

        LocalDateTime now = LocalDateTime.now();
        vo.setTodayTickets(ticketMapper.countByCreateTime(now.toLocalDate().atStartOfDay()));
        vo.setWeekTickets(ticketMapper.countByCreateTime(now.minusWeeks(1)));
        vo.setMonthTickets(ticketMapper.countByCreateTime(now.minusMonths(1)));

        return vo;
    }

    @Override
    public List<HotspotVO> getCategoryHotspots(String startTime, String endTime) {
        LocalDateTime start = LocalDateTime.parse(startTime);
        List<Map<String, Object>> categoryData = ticketMapper.countByCategory(start);

        List<HotspotVO> result = new ArrayList<>();
        Long total = ticketMapper.countByCreateTime(start);

        for (Map<String, Object> data : categoryData) {
            HotspotVO vo = new HotspotVO();
            Object category = data.get("category");
            vo.setName(category != null ? String.valueOf(category) : "未知");
            vo.setType("category");
            vo.setCount(((Number) data.get("cnt")).longValue());
            if (total != null && total > 0) {
                vo.setPercentage(vo.getCount() * 100.0 / total);
            }
            result.add(vo);
        }

        return result;
    }

    @Override
    public List<HotspotVO> getRegionHotspots(String startTime, String endTime) {
        LocalDateTime start = LocalDateTime.parse(startTime);
        List<Map<String, Object>> regionData = ticketMapper.countByRegion(start);

        List<HotspotVO> result = new ArrayList<>();
        Long total = ticketMapper.countByCreateTime(start);

        for (Map<String, Object> data : regionData) {
            HotspotVO vo = new HotspotVO();
            vo.setName(data.get("region_name") != null ? String.valueOf(data.get("region_name")) : "未知");
            vo.setType("region");
            vo.setRegionCode(data.get("region_code") != null ? String.valueOf(data.get("region_code")) : null);
            vo.setRegionName(vo.getName());
            vo.setCount(((Number) data.get("cnt")).longValue());
            if (total != null && total > 0) {
                vo.setPercentage(vo.getCount() * 100.0 / total);
            }
            result.add(vo);
        }

        return result;
    }

    @Override
    public List<HotspotVO> getTimeTrend(String startTime, String endTime) {
        LocalDateTime start = LocalDateTime.parse(startTime);
        List<Map<String, Object>> dateData = ticketMapper.countByDate(start);

        List<HotspotVO> result = new ArrayList<>();
        for (Map<String, Object> data : dateData) {
            HotspotVO vo = new HotspotVO();
            vo.setName(data.get("date") != null ? String.valueOf(data.get("date")) : "未知");
            vo.setType("time");
            vo.setCount(((Number) data.get("cnt")).longValue());
            vo.setTrend("daily");
            result.add(vo);
        }

        return result;
    }

    @Override
    public List<HotspotVO> getDepartmentWorkload(String startTime, String endTime) {
        log.info("查询部门工作量统计: startTime={}, endTime={}", startTime, endTime);
        return List.of();
    }
}
