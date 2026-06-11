package com.guizhou.platform.ticket.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.ticket.config.NlpConfig;
import com.guizhou.platform.ticket.dto.response.DispatchResultVO;
import com.guizhou.platform.ticket.entity.Department;
import com.guizhou.platform.ticket.entity.Ticket;
import com.guizhou.platform.ticket.entity.TicketCategory;
import com.guizhou.platform.ticket.entity.TicketDispatch;
import com.guizhou.platform.ticket.mapper.DepartmentMapper;
import com.guizhou.platform.ticket.mapper.TicketCategoryMapper;
import com.guizhou.platform.ticket.mapper.TicketDispatchMapper;
import com.guizhou.platform.ticket.mapper.TicketMapper;
import com.guizhou.platform.ticket.service.DispatchService;
import com.guizhou.platform.ticket.service.NlpService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DispatchServiceImpl implements DispatchService {

    @Resource
    private TicketMapper ticketMapper;

    @Resource
    private TicketDispatchMapper dispatchMapper;

    @Resource
    private DepartmentMapper departmentMapper;

    @Resource
    private TicketCategoryMapper categoryMapper;

    @Resource
    private NlpService nlpService;

    @Resource
    private NlpConfig nlpConfig;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DispatchResultVO autoDispatch(Long ticketId) {
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }
        if (!com.guizhou.platform.ticket.enums.TicketStatusEnum.PENDING.getCode().equals(ticket.getStatus())) {
            throw new BusinessException("工单状态不允许自动分拨");
        }

        DispatchResultVO result = new DispatchResultVO();
        result.setTicketId(ticketId);
        result.setTicketNo(ticket.getTicketNo());
        result.setNlpCategory(ticket.getNlpCategory());
        result.setNlpKeywords(ticket.getNlpKeywords());
        result.setNlpConfidence(ticket.getNlpConfidence());

        List<DispatchResultVO.DepartmentCandidate> candidates = calculateCandidates(ticket);
        result.setCandidates(candidates);

        if (!candidates.isEmpty()) {
            DispatchResultVO.DepartmentCandidate selected = candidates.get(0);
            result.setSelectedDepartment(selected);
            result.setDispatchType(0);
            result.setDispatchTypeDesc("自动分拨");
            result.setDispatchReason(selected.getMatchReason());

            ticket.setStatus(com.guizhou.platform.ticket.enums.TicketStatusEnum.ASSIGNED.getCode());
            ticket.setDepartmentId(selected.getDepartmentId());
            ticket.setDepartmentName(selected.getDepartmentName());
            ticket.setAssignTime(LocalDateTime.now());
            ticket.setDispatchType(0);
            ticketMapper.updateById(ticket);

            saveDispatchRecord(ticket, selected, 0, "自动分拨");
        } else {
            result.setDispatchType(2);
            result.setDispatchTypeDesc("需人工分拨");
            result.setDispatchReason("未找到匹配部门，需人工分拨");
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DispatchResultVO manualDispatch(Long ticketId, Long departmentId, String reason) {
        Ticket ticket = ticketMapper.selectById(ticketId);
        if (ticket == null) {
            throw new BusinessException("工单不存在");
        }

        Department dept = departmentMapper.selectById(departmentId);
        if (dept == null) {
            throw new BusinessException("部门不存在");
        }

        ticket.setStatus(com.guizhou.platform.ticket.enums.TicketStatusEnum.ASSIGNED.getCode());
        ticket.setDepartmentId(departmentId);
        ticket.setDepartmentName(dept.getDeptName());
        ticket.setAssignTime(LocalDateTime.now());
        ticket.setDispatchType(1);
        ticketMapper.updateById(ticket);

        DispatchResultVO.DepartmentCandidate candidate = new DispatchResultVO.DepartmentCandidate();
        candidate.setDepartmentId(departmentId);
        candidate.setDepartmentName(dept.getDeptName());
        candidate.setMatchScore(100.0);
        candidate.setMatchReason("人工分拨");

        DispatchResultVO result = new DispatchResultVO();
        result.setTicketId(ticketId);
        result.setTicketNo(ticket.getTicketNo());
        result.setSelectedDepartment(candidate);
        result.setDispatchType(1);
        result.setDispatchTypeDesc("人工分拨");
        result.setDispatchReason(reason);

        saveDispatchRecord(ticket, candidate, 1, reason);
        return result;
    }

    @Override
    public Double calculateMatchScore(String nlpCategory, String nlpKeywords, Long departmentId) {
        double historyScore = calculateHistoryScore(nlpCategory, departmentId);
        double ruleScore = calculateRuleScore(nlpCategory, nlpKeywords, departmentId);
        double nlpScore = calculateNlpScore(nlpKeywords, departmentId);

        return historyScore * 0.5 + ruleScore * 0.3 + nlpScore * 0.2;
    }

    private List<DispatchResultVO.DepartmentCandidate> calculateCandidates(Ticket ticket) {
        List<Department> departments = departmentMapper.listActive();
        List<DispatchResultVO.DepartmentCandidate> candidates = new ArrayList<>();

        for (Department dept : departments) {
            double score = calculateMatchScore(
                    ticket.getNlpCategory(),
                    ticket.getNlpKeywords(),
                    dept.getId()
            );

            if (score >= 20) {
                DispatchResultVO.DepartmentCandidate candidate = new DispatchResultVO.DepartmentCandidate();
                candidate.setDepartmentId(dept.getId());
                candidate.setDepartmentName(dept.getDeptName());
                candidate.setMatchScore(score);
                candidate.setHistoryScore(calculateHistoryScore(ticket.getNlpCategory(), dept.getId()));
                candidate.setRuleScore(calculateRuleScore(ticket.getNlpCategory(), ticket.getNlpKeywords(), dept.getId()));
                candidate.setNlpScore(calculateNlpScore(ticket.getNlpKeywords(), dept.getId()));
                candidate.setMatchReason(buildMatchReason(candidate));
                candidates.add(candidate);
            }
        }

        candidates.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        return candidates.stream().limit(3).collect(Collectors.toList());
    }

    private Double calculateHistoryScore(String nlpCategory, Long departmentId) {
        if (nlpCategory == null) {
            return 0.0;
        }
        List<Map<String, Object>> topDepts = dispatchMapper.findTopDepartmentsByCategory(nlpCategory, 5);
        for (Map<String, Object> map : topDepts) {
            Long deptId = (Long) map.get("to_department_id");
            if (departmentId.equals(deptId)) {
                Long cnt = (Long) map.get("cnt");
                return Math.min(cnt * 5.0, 50.0);
            }
        }
        return 0.0;
    }

    private Double calculateRuleScore(String nlpCategory, String nlpKeywords, Long departmentId) {
        Department dept = departmentMapper.selectById(departmentId);
        if (dept == null || dept.getCategoryKeywords() == null) {
            return 0.0;
        }

        double score = 0.0;
        String[] deptKeywords = dept.getCategoryKeywords().split(",");
        if (nlpCategory != null) {
            for (String kw : deptKeywords) {
                if (nlpCategory.contains(kw.trim())) {
                    score += 20.0;
                    break;
                }
            }
        }
        if (nlpKeywords != null) {
            String[] keywords = nlpKeywords.split(",");
            for (String keyword : keywords) {
                for (String deptKw : deptKeywords) {
                    if (keyword.trim().equals(deptKw.trim())) {
                        score += 10.0;
                    }
                }
            }
        }

        return Math.min(score, 40.0);
    }

    private Double calculateNlpScore(String nlpKeywords, Long departmentId) {
        Department dept = departmentMapper.selectById(departmentId);
        if (dept == null || dept.getResponsibility() == null || nlpKeywords == null) {
            return 0.0;
        }

        String[] keywords = nlpKeywords.split(",");
        int matchCount = 0;
        for (String keyword : keywords) {
            if (dept.getResponsibility().contains(keyword.trim())) {
                matchCount++;
            }
        }

        return Math.min(matchCount * 5.0, 30.0);
    }

    private String buildMatchReason(DispatchResultVO.DepartmentCandidate candidate) {
        StringBuilder reason = new StringBuilder();
        if (candidate.getHistoryScore() > 0) {
            reason.append("历史匹配(").append(String.format("%.1f", candidate.getHistoryScore())).append(");");
        }
        if (candidate.getRuleScore() > 0) {
            reason.append("规则匹配(").append(String.format("%.1f", candidate.getRuleScore())).append(");");
        }
        if (candidate.getNlpScore() > 0) {
            reason.append("NLP匹配(").append(String.format("%.1f", candidate.getNlpScore())).append(");");
        }
        return reason.length() > 0 ? reason.toString() : "综合评分";
    }

    private void saveDispatchRecord(Ticket ticket, DispatchResultVO.DepartmentCandidate candidate,
                                     Integer dispatchType, String reason) {
        TicketDispatch dispatch = new TicketDispatch();
        dispatch.setTicketId(ticket.getId());
        dispatch.setTicketNo(ticket.getTicketNo());
        dispatch.setToDepartmentId(candidate.getDepartmentId());
        dispatch.setToDepartmentName(candidate.getDepartmentName());
        dispatch.setDispatchType(dispatchType);
        dispatch.setDispatchReason(reason);
        dispatch.setMatchScore(candidate.getMatchScore());
        dispatch.setNlpCategory(ticket.getNlpCategory());
        dispatch.setNlpKeywords(ticket.getNlpKeywords());
        dispatch.setNlpConfidence(ticket.getNlpConfidence());
        dispatch.setDispatchStatus(1);
        dispatch.setDispatchTime(LocalDateTime.now());
        dispatchMapper.insert(dispatch);
    }
}
