package com.guizhou.platform.subsidy.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidy.dto.request.RiskRuleDTO;
import com.guizhou.platform.subsidy.dto.response.RiskWarningVO;
import com.guizhou.platform.subsidy.entity.RiskRule;
import com.guizhou.platform.subsidy.entity.RiskWarning;
import com.guizhou.platform.subsidy.enums.RiskLevelEnum;
import com.guizhou.platform.subsidy.service.RiskEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "风险预警", description = "风控规则管理、风险预警处理、风险扫描")
@RestController
@RequestMapping("/api/risk")
public class RiskController {

    @Resource
    private RiskEngineService riskEngineService;

    @Operation(summary = "创建风控规则")
    @PostMapping("/rule")
    public Result<Long> createRiskRule(@Valid @RequestBody RiskRuleDTO dto) {
        return Result.success(riskEngineService.createRiskRule(dto));
    }

    @Operation(summary = "启用风控规则")
    @PostMapping("/rule/{id}/enable")
    public Result<Void> enableRiskRule(@PathVariable Long id) {
        riskEngineService.enableRiskRule(id);
        return Result.success();
    }

    @Operation(summary = "禁用风控规则")
    @PostMapping("/rule/{id}/disable")
    public Result<Void> disableRiskRule(@PathVariable Long id) {
        riskEngineService.disableRiskRule(id);
        return Result.success();
    }

    @Operation(summary = "获取所有启用的风控规则")
    @GetMapping("/rule/enabled")
    public Result<List<RiskRule>> getEnabledRules() {
        return Result.success(riskEngineService.getEnabledRules());
    }

    @Operation(summary = "分页查询风控规则")
    @GetMapping("/rule/page")
    public Result<PageResult<RiskRule>> pageRules(PageQuery pageQuery,
                                                  @RequestParam(required = false) String ruleType,
                                                  @RequestParam(required = false) Integer riskLevel,
                                                  @RequestParam(required = false) Boolean enabled) {
        LambdaQueryWrapper<RiskRule> wrapper = new LambdaQueryWrapper<>();
        if (ruleType != null) {
            wrapper.eq(RiskRule::getRuleType, ruleType);
        }
        if (riskLevel != null) {
            wrapper.eq(RiskRule::getRiskLevel, riskLevel);
        }
        if (enabled != null) {
            wrapper.eq(RiskRule::getEnabled, enabled);
        }
        wrapper.orderByDesc(RiskRule::getPriority, RiskRule::getCreateTime);

        Page<RiskRule> page = riskEngineService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        return Result.success(PageResult.of(page.getTotal(), page.getRecords()));
    }

    @Operation(summary = "手动触发风险扫描")
    @PostMapping("/scan")
    public Result<Void> scanRisk() {
        riskEngineService.scanRisk();
        return Result.success();
    }

    @Operation(summary = "处理风险预警")
    @PostMapping("/warning/{id}/process")
    public Result<Void> processRiskWarning(@PathVariable Long id,
                                           @RequestParam String handlerId,
                                           @RequestParam String handlerName,
                                           @RequestParam String opinion,
                                           @RequestParam String result) {
        riskEngineService.processRiskWarning(id, handlerId, handlerName, opinion, result);
        return Result.success();
    }

    @Operation(summary = "获取风险预警详情")
    @GetMapping("/warning/{id}")
    public Result<RiskWarningVO> getWarningDetail(@PathVariable Long id) {
        RiskWarning warning = riskEngineService.getOne(new LambdaQueryWrapper<RiskWarning>()
                .eq(RiskWarning::getId, id));
        if (warning == null) {
            return Result.success(null);
        }
        RiskWarningVO vo = new RiskWarningVO();
        BeanUtils.copyProperties(warning, vo);
        RiskLevelEnum level = RiskLevelEnum.getByCode(warning.getRiskLevel());
        if (level != null) {
            vo.setRiskLevelDesc(level.getDesc());
            vo.setRiskLevelColor(level.getColor());
        }
        vo.setWarningStatusDesc(warning.getWarningStatus() == 0 ? "待处理" : "已处理");
        return Result.success(vo);
    }

    @Operation(summary = "分页查询风险预警")
    @GetMapping("/warning/page")
    public Result<PageResult<RiskWarningVO>> pageWarnings(PageQuery pageQuery,
                                                          @RequestParam(required = false) Integer riskLevel,
                                                          @RequestParam(required = false) Integer warningStatus,
                                                          @RequestParam(required = false) String beneficiaryName,
                                                          @RequestParam(required = false) String riskType) {
        LambdaQueryWrapper<RiskWarning> wrapper = new LambdaQueryWrapper<>();
        if (riskLevel != null) {
            wrapper.eq(RiskWarning::getRiskLevel, riskLevel);
        }
        if (warningStatus != null) {
            wrapper.eq(RiskWarning::getWarningStatus, warningStatus);
        }
        if (beneficiaryName != null) {
            wrapper.like(RiskWarning::getBeneficiaryName, beneficiaryName);
        }
        if (riskType != null) {
            wrapper.like(RiskWarning::getRiskType, riskType);
        }
        wrapper.orderByDesc(RiskWarning::getRiskLevel, RiskWarning::getCreateTime);

        Page<RiskWarning> page = riskEngineService.page(
                new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize()), wrapper);

        List<RiskWarningVO> voList = page.getRecords().stream().map(warning -> {
            RiskWarningVO vo = new RiskWarningVO();
            BeanUtils.copyProperties(warning, vo);
            RiskLevelEnum level = RiskLevelEnum.getByCode(warning.getRiskLevel());
            if (level != null) {
                vo.setRiskLevelDesc(level.getDesc());
                vo.setRiskLevelColor(level.getColor());
            }
            vo.setWarningStatusDesc(warning.getWarningStatus() == 0 ? "待处理" : "已处理");
            return vo;
        }).toList();

        return Result.success(PageResult.of(page.getTotal(), voList));
    }

    @Operation(summary = "获取高风险待处理预警")
    @GetMapping("/warning/high-risk")
    public Result<List<RiskWarningVO>> getHighRiskPending() {
        return null;
    }
}
