package com.guizhou.platform.monitor.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.monitor.dto.request.SlaAgreementDTO;
import com.guizhou.platform.monitor.dto.response.SlaReportVO;
import com.guizhou.platform.monitor.entity.SlaAgreement;
import com.guizhou.platform.monitor.service.SlaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "SLA协议管理", description = "SLA协议配置、考核记录、达标率查询")
@RestController
@RequestMapping("/sla")
@RequiredArgsConstructor
public class SlaController {

    private final SlaService slaService;

    @Operation(summary = "创建SLA协议")
    @PostMapping("/agreement")
    public Result<SlaAgreement> createAgreement(@RequestBody SlaAgreementDTO dto) {
        return Result.success(slaService.createAgreement(dto));
    }

    @Operation(summary = "更新SLA协议")
    @PutMapping("/agreement/{agreementId}")
    public Result<SlaAgreement> updateAgreement(@PathVariable Long agreementId, @RequestBody SlaAgreementDTO dto) {
        return Result.success(slaService.updateAgreement(agreementId, dto));
    }

    @Operation(summary = "删除SLA协议")
    @DeleteMapping("/agreement/{agreementId}")
    public Result<Void> deleteAgreement(@PathVariable Long agreementId) {
        slaService.deleteAgreement(agreementId);
        return Result.success();
    }

    @Operation(summary = "分页查询SLA协议")
    @GetMapping("/agreements")
    public Result<IPage<SlaAgreement>> listAgreements(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(slaService.listAgreements(pageNum, pageSize));
    }

    @Operation(summary = "获取SLA协议详情")
    @GetMapping("/agreement/{agreementId}")
    public Result<SlaAgreement> getAgreement(@PathVariable Long agreementId) {
        return Result.success(slaService.getAgreement(agreementId));
    }

    @Operation(summary = "查询SLA考核记录")
    @GetMapping("/records")
    public Result<IPage<SlaReportVO>> getSlaRecords(
            @RequestParam(required = false) String serviceCode,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate checkMonth,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(slaService.getSlaRecords(serviceCode, checkMonth, pageNum, pageSize));
    }

    @Operation(summary = "手动触发SLA月度考核")
    @PostMapping("/check/monthly")
    public Result<Void> executeMonthlyCheck() {
        slaService.executeMonthlyCheck();
        return Result.success();
    }
}
