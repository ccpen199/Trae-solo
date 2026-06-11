package com.guizhou.platform.subsidyverify.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.subsidyverify.dto.request.VerifyRequestDTO;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.service.VerifyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "补贴核销", description = "扫码核销、手动核销、核销撤销")
@RestController
@RequestMapping("/api/verify")
public class VerifyController {

    @Resource
    private VerifyService verifyService;

    @Operation(summary = "扫码核销")
    @PostMapping("/scan")
    public Result<VerifyResultVO> scanVerify(@Valid @RequestBody VerifyRequestDTO dto) {
        return Result.success(verifyService.scanVerify(dto));
    }

    @Operation(summary = "手动核销")
    @PostMapping("/manual")
    public Result<VerifyResultVO> manualVerify(@Valid @RequestBody VerifyRequestDTO dto) {
        return Result.success(verifyService.manualVerify(dto));
    }

    @Operation(summary = "获取核销详情")
    @GetMapping("/{id}")
    public Result<VerifyResultVO> getDetail(@PathVariable Long id) {
        return Result.success(verifyService.getVerifyDetail(id));
    }

    @Operation(summary = "查询受益人核销记录")
    @GetMapping("/beneficiary/{beneficiaryId}")
    public Result<List<VerifyResultVO>> listByBeneficiary(@PathVariable Long beneficiaryId) {
        return Result.success(verifyService.listByBeneficiary(beneficiaryId));
    }

    @Operation(summary = "查询商户核销记录")
    @GetMapping("/merchant/{merchantId}")
    public Result<List<VerifyResultVO>> listByMerchant(@PathVariable Long merchantId) {
        return Result.success(verifyService.listByMerchant(merchantId));
    }

    @Operation(summary = "撤销核销")
    @PostMapping("/{id}/cancel")
    public Result<Void> cancelVerify(@PathVariable Long id, @RequestParam String reason) {
        verifyService.cancelVerify(id, reason);
        return Result.success();
    }
}
