package com.guizhou.platform.monitor.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.monitor.dto.request.AlertRuleDTO;
import com.guizhou.platform.monitor.dto.response.AlertVO;
import com.guizhou.platform.monitor.entity.AlertRule;
import com.guizhou.platform.monitor.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "告警管理", description = "告警规则配置、告警记录查询、告警处理")
@RestController
@RequestMapping("/alert")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @Operation(summary = "创建告警规则")
    @PostMapping("/rule")
    public Result<AlertRule> createRule(@RequestBody AlertRuleDTO dto) {
        return Result.success(alertService.createRule(dto));
    }

    @Operation(summary = "更新告警规则")
    @PutMapping("/rule/{ruleId}")
    public Result<AlertRule> updateRule(@PathVariable Long ruleId, @RequestBody AlertRuleDTO dto) {
        return Result.success(alertService.updateRule(ruleId, dto));
    }

    @Operation(summary = "删除告警规则")
    @DeleteMapping("/rule/{ruleId}")
    public Result<Void> deleteRule(@PathVariable Long ruleId) {
        alertService.deleteRule(ruleId);
        return Result.success();
    }

    @Operation(summary = "分页查询告警规则")
    @GetMapping("/rules")
    public Result<IPage<AlertRule>> listRules(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(alertService.listRules(pageNum, pageSize));
    }

    @Operation(summary = "分页查询告警记录")
    @GetMapping("/records")
    public Result<IPage<AlertVO>> listAlerts(
            @RequestParam(required = false) String alertStatus,
            @RequestParam(required = false) String alertLevel,
            @RequestParam(required = false) String serviceCode,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(alertService.listAlerts(alertStatus, alertLevel, serviceCode, pageNum, pageSize));
    }

    @Operation(summary = "处理告警")
    @PutMapping("/record/{alertId}/resolve")
    public Result<AlertVO> resolveAlert(
            @PathVariable Long alertId,
            @RequestParam String handlerId,
            @RequestParam String handlerName,
            @RequestParam String handleOpinion) {
        return Result.success(convertToVO(alertService.resolveAlert(alertId, handlerId, handlerName, handleOpinion)));
    }

    private AlertVO convertToVO(com.guizhou.platform.monitor.entity.AlertRecord record) {
        AlertVO vo = new AlertVO();
        vo.setId(record.getId());
        vo.setAlertNo(record.getAlertNo());
        vo.setRuleCode(record.getRuleCode());
        vo.setRuleName(record.getRuleName());
        vo.setServiceCode(record.getServiceCode());
        vo.setServiceName(record.getServiceName());
        vo.setAlertLevel(record.getAlertLevel());
        vo.setAlertType(record.getAlertType());
        vo.setMetricName(record.getMetricName());
        vo.setCurrentValue(record.getCurrentValue());
        vo.setThresholdValue(record.getThresholdValue());
        vo.setAlertMessage(record.getAlertMessage());
        vo.setAlertTime(record.getAlertTime());
        vo.setAlertStatus(record.getAlertStatus());
        vo.setHandlerName(record.getHandlerName());
        vo.setHandleTime(record.getHandleTime());
        return vo;
    }
}
