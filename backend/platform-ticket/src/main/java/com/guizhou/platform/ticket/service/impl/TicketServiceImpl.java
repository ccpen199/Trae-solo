package com.guizhou.platform.ticket.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.ticket.dto.request.TicketAssignDTO;
import com.guizhou.platform.ticket.dto.request.TicketCreateDTO;
import com.guizhou.platform.ticket.dto.request.TicketProcessDTO;
import com.guizhou.platform.ticket.dto.response.TicketDetailVO;
import com.guizhou.platform.ticket.entity.Department;
import com.guizhou.platform.ticket.entity.Ticket;
import com.guizhou.platform.ticket.entity.TicketProcess;
import com.guizhou.platform.ticket.enums.TicketStatusEnum;
import com.guizhou.platform.ticket.mapper.DepartmentMapper;
import com.guizhou.platform.ticket.mapper.TicketMapper;
import com.guizhou.platform.ticket.mapper.TicketProcessMapper;
import com.guizhou.platform.ticket.service.DispatchService;
import com.guizhou.platform.ticket.service.NlpService;
import com.guizhou.platform.ticket.service.TicketService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TicketServiceImpl extends ServiceImpl<TicketMapper, Ticket> implements TicketService {

    @Resource
    private NlpService nlpService;

    @Resource
    private DispatchService dispatchService;

    @Resource
    private TicketProcessMapper processMapper;

    @Resource
    private DepartmentMapper departmentMapper;

    @Resource
    private RocketMQTemplate rocketMQTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createTicket(TicketCreateDTO dto) {
        Ticket ticket = new Ticket();
        BeanUtils.copyProperties(dto, ticket);
        ticket.setTicketNo("TK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        ticket.setStatus(TicketStatusEnum.PENDING.getCode());

        if (dto.getPriority() == null) {
            ticket.setPriority(nlpService.analyzePriority(dto.getContent()));
        }
        if (dto.getCategory() == null) {
            String nlpCategory = nlpService.analyzeCategory(dto.getContent());
            ticket.setNlpCategory(nlpCategory);
            ticket.setCategory(mapCategory(nlpCategory));
        }

        if (nlpService.isAvailable()) {
            ticket.setNlpKeywords(String.join(",", nlpService.extractKeywords(dto.getContent())));
            ticket.setNlpConfidence(nlpService.analyzeConfidence(dto.getContent()));
        }

        ticket.setDeadline(calculateDeadline(ticket.getPriority()));
        this.save(ticket);

        try {
            rocketMQTemplate.convertAndSend("ticket-created", ticket.getTicketNo());
        } catch (Exception e) {
            log.warn("发送工单创建消息失败: {}", e.getMessage());
        }

        log.info("工单创建成功: {}", ticket.getTicketNo());
        return ticket.getTicketNo();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignTicket(TicketAssignDTO dto) {
        Ticket ticket = this.getById(dto.getTicketId());
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }
        if (!TicketStatusEnum.PENDING.getCode().equals(ticket.getStatus())) {
            throw new BusinessException("当前状态不允许分派");
        }

        Department dept = departmentMapper.selectById(dto.getDepartmentId());
        if (dept == null) {
            throw new BusinessException("部门不存在");
        }

        ticket.setStatus(TicketStatusEnum.ASSIGNED.getCode());
        ticket.setDepartmentId(dto.getDepartmentId());
        ticket.setDepartmentName(dept.getDeptName());
        ticket.setHandlerId(dto.getHandlerId());
        ticket.setHandlerName(dto.getHandlerName());
        ticket.setAssignTime(LocalDateTime.now());
        this.updateById(ticket);

        TicketProcess process = new TicketProcess();
        process.setTicketId(ticket.getId());
        process.setTicketNo(ticket.getTicketNo());
        process.setProcessType(1);
        process.setProcessContent("工单分派至: " + dept.getDeptName());
        process.setOperatorName(dto.getHandlerName());
        process.setOperatorDept(dept.getDeptName());
        process.setProcessTime(LocalDateTime.now());
        processMapper.insert(process);

        try {
            rocketMQTemplate.convertAndSend("ticket-assigned", ticket.getTicketNo());
        } catch (Exception e) {
            log.warn("发送工单分派消息失败: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processTicket(TicketProcessDTO dto) {
        Ticket ticket = this.getById(dto.getTicketId());
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }
        if (!TicketStatusEnum.ASSIGNED.getCode().equals(ticket.getStatus())
                && !TicketStatusEnum.PROCESSING.getCode().equals(ticket.getStatus())) {
            throw new BusinessException("当前状态不允许处理");
        }

        ticket.setStatus(TicketStatusEnum.PROCESSING.getCode());
        this.updateById(ticket);

        TicketProcess process = new TicketProcess();
        process.setTicketId(ticket.getId());
        process.setTicketNo(ticket.getTicketNo());
        process.setProcessType(dto.getProcessType());
        process.setProcessContent(dto.getProcessContent());
        process.setOperatorName(dto.getOperatorName());
        process.setOperatorDept(dto.getOperatorDept());
        process.setProcessTime(LocalDateTime.now());
        process.setAttachment(dto.getAttachment());
        processMapper.insert(process);

        if (dto.getProcessType() == 2) {
            ticket.setStatus(TicketStatusEnum.PENDING_CONFIRM.getCode());
            ticket.setCompleteTime(LocalDateTime.now());
            this.updateById(ticket);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void confirmTicket(Long ticketId, Integer satisfaction, String satisfactionContent) {
        Ticket ticket = this.getById(ticketId);
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }
        if (!TicketStatusEnum.PENDING_CONFIRM.getCode().equals(ticket.getStatus())) {
            throw new BusinessException("当前状态不允许确认");
        }

        ticket.setStatus(TicketStatusEnum.COMPLETED.getCode());
        ticket.setSatisfaction(satisfaction);
        ticket.setSatisfactionContent(satisfactionContent);
        this.updateById(ticket);

        TicketProcess process = new TicketProcess();
        process.setTicketId(ticket.getId());
        process.setTicketNo(ticket.getTicketNo());
        process.setProcessType(3);
        process.setProcessContent("市民确认完成，满意度: " + satisfaction + "星");
        process.setProcessTime(LocalDateTime.now());
        processMapper.insert(process);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeTicket(Long ticketId) {
        Ticket ticket = this.getById(ticketId);
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }

        ticket.setStatus(TicketStatusEnum.CLOSED.getCode());
        ticket.setCloseTime(LocalDateTime.now());
        this.updateById(ticket);

        TicketProcess process = new TicketProcess();
        process.setTicketId(ticket.getId());
        process.setTicketNo(ticket.getTicketNo());
        process.setProcessType(4);
        process.setProcessContent("工单关闭");
        process.setProcessTime(LocalDateTime.now());
        processMapper.insert(process);
    }

    @Override
    public TicketDetailVO getTicketDetail(Long ticketId) {
        Ticket ticket = this.getById(ticketId);
        if (ticket == null) {
            return null;
        }

        TicketDetailVO vo = new TicketDetailVO();
        BeanUtils.copyProperties(ticket, vo);

        if (ticket.getStatus() != null) {
            TicketStatusEnum statusEnum = TicketStatusEnum.getByCode(ticket.getStatus());
            if (statusEnum != null) {
                vo.setStatusDesc(statusEnum.getDesc());
            }
        }

        List<TicketProcess> processes = processMapper.listByTicketId(ticketId);
        if (processes != null) {
            vo.setProcessRecords(processes.stream().map(p -> {
                TicketDetailVO.ProcessRecord record = new TicketDetailVO.ProcessRecord();
                record.setProcessType(p.getProcessType());
                record.setProcessContent(p.getProcessContent());
                record.setOperatorName(p.getOperatorName());
                record.setOperatorDept(p.getOperatorDept());
                record.setProcessTime(p.getProcessTime());
                return record;
            }).collect(Collectors.toList()));
        } else {
            vo.setProcessRecords(Collections.emptyList());
        }

        return vo;
    }

    @Override
    public Page<TicketDetailVO> pageTickets(Integer pageNum, Integer pageSize, Integer status,
                                             Integer category, Integer priority, Integer source,
                                             String regionCode, String keyword) {
        LambdaQueryWrapper<Ticket> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Ticket::getStatus, status);
        }
        if (category != null) {
            wrapper.eq(Ticket::getCategory, category);
        }
        if (priority != null) {
            wrapper.eq(Ticket::getPriority, priority);
        }
        if (source != null) {
            wrapper.eq(Ticket::getSource, source);
        }
        if (regionCode != null) {
            wrapper.eq(Ticket::getRegionCode, regionCode);
        }
        if (keyword != null) {
            wrapper.and(w -> w.like(Ticket::getTitle, keyword).or().like(Ticket::getContent, keyword));
        }
        wrapper.orderByDesc(Ticket::getCreateTime);

        Page<Ticket> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        Page<TicketDetailVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        voPage.setRecords(page.getRecords().stream().map(ticket -> {
            TicketDetailVO vo = new TicketDetailVO();
            BeanUtils.copyProperties(ticket, vo);
            if (ticket.getStatus() != null) {
                TicketStatusEnum statusEnum = TicketStatusEnum.getByCode(ticket.getStatus());
                if (statusEnum != null) {
                    vo.setStatusDesc(statusEnum.getDesc());
                }
            }
            return vo;
        }).collect(Collectors.toList()));

        return voPage;
    }

    private Integer mapCategory(String nlpCategory) {
        if (nlpCategory == null) {
            return 0;
        }
        return switch (nlpCategory) {
            case "投诉" -> 1;
            case "建议" -> 2;
            case "求助" -> 3;
            case "举报" -> 4;
            default -> 0;
        };
    }

    private LocalDateTime calculateDeadline(Integer priority) {
        LocalDateTime now = LocalDateTime.now();
        if (priority == null) {
            return now.plusHours(72);
        }
        return switch (priority) {
            case 3 -> now.plusHours(4);
            case 2 -> now.plusHours(24);
            case 1 -> now.plusHours(48);
            default -> now.plusHours(72);
        };
    }
}
