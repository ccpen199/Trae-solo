package com.guizhou.platform.ticket.service.impl;

import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.ticket.entity.Ticket;
import com.guizhou.platform.ticket.enums.TicketStatusEnum;
import com.guizhou.platform.ticket.mapper.TicketMapper;
import com.guizhou.platform.ticket.service.SatisfactionService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class SatisfactionServiceImpl implements SatisfactionService {

    @Resource
    private TicketMapper ticketMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitSatisfaction(Long ticketId, Integer score, String content) {
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }
        if (!TicketStatusEnum.COMPLETED.getCode().equals(ticket.getStatus())) {
            throw new BusinessException("工单未完成，无法评价");
        }

        ticket.setSatisfaction(score);
        ticket.setSatisfactionContent(content);
        ticketMapper.updateById(ticket);
    }

    @Override
    public Double getAverageSatisfaction() {
        Long satisfied = ticketMapper.countSatisfied();
        Long completed = ticketMapper.countCompleted();
        if (completed == null || completed == 0) {
            return 0.0;
        }
        return (satisfied != null ? satisfied : 0) * 100.0 / completed;
    }

    @Override
    public Double getSatisfactionByDepartment(Long departmentId) {
        Long completed = ticketMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Ticket>()
                .eq(Ticket::getDepartmentId, departmentId)
                .eq(Ticket::getStatus, TicketStatusEnum.COMPLETED.getCode())
                .isNotNull(Ticket::getSatisfaction));

        Long satisfied = ticketMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Ticket>()
                .eq(Ticket::getDepartmentId, departmentId)
                .eq(Ticket::getStatus, TicketStatusEnum.COMPLETED.getCode())
                .ge(Ticket::getSatisfaction, 4));

        if (completed == null || completed == 0) {
            return 0.0;
        }
        return satisfied * 100.0 / completed;
    }

    @Override
    public Double getSatisfactionByTimeRange(String startTime, String endTime) {
        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        Long completed = ticketMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Ticket>()
                .eq(Ticket::getStatus, TicketStatusEnum.COMPLETED.getCode())
                .ge(Ticket::getCompleteTime, start)
                .le(Ticket::getCompleteTime, end)
                .isNotNull(Ticket::getSatisfaction));

        Long satisfied = ticketMapper.selectCount(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Ticket>()
                .eq(Ticket::getStatus, TicketStatusEnum.COMPLETED.getCode())
                .ge(Ticket::getCompleteTime, start)
                .le(Ticket::getCompleteTime, end)
                .ge(Ticket::getSatisfaction, 4));

        if (completed == null || completed == 0) {
            return 0.0;
        }
        return satisfied * 100.0 / completed;
    }
}
