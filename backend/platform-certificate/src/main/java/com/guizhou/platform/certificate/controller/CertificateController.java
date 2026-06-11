package com.guizhou.platform.certificate.controller;

import com.guizhou.platform.certificate.dto.request.CertificateIssueDTO;
import com.guizhou.platform.certificate.dto.response.CertificateDetailVO;
import com.guizhou.platform.certificate.dto.response.CertificateListVO;
import com.guizhou.platform.certificate.service.CertificateService;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "电子证照管理", description = "证照签发、查询、注销、二维码生成等接口")
@RestController
@RequestMapping("/api/certificate")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @Operation(summary = "签发电子证照")
    @PostMapping("/issue")
    public Result<CertificateDetailVO> issueCertificate(@Valid @RequestBody CertificateIssueDTO dto) {
        CertificateDetailVO vo = certificateService.issueCertificate(dto);
        return Result.success(vo);
    }

    @Operation(summary = "获取证照详情")
    @GetMapping("/{id}")
    public Result<CertificateDetailVO> getCertificateDetail(
            @Parameter(description = "证照ID") @PathVariable Long id) {
        CertificateDetailVO vo = certificateService.getCertificateDetail(id);
        return Result.success(vo);
    }

    @Operation(summary = "获取证照列表")
    @GetMapping("/list")
    public Result<PageResult<CertificateListVO>> getCertificateList(
            @Parameter(description = "用户ID") @RequestParam(required = false) Long userId,
            @Parameter(description = "证照类型") @RequestParam(required = false) Integer certificateType,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @ModelAttribute PageQuery pageQuery) {
        PageResult<CertificateListVO> result = certificateService.getCertificateList(
                userId, certificateType, status, pageQuery);
        return Result.success(result);
    }

    @Operation(summary = "吊销证照")
    @PostMapping("/{id}/revoke")
    public Result<Void> revokeCertificate(
            @Parameter(description = "证照ID") @PathVariable Long id,
            @RequestBody Map<String, Object> params) {
        String reason = (String) params.get("reason");
        Long operatorId = params.get("operatorId") != null ? Long.valueOf(params.get("operatorId").toString()) : null;
        String operatorName = (String) params.get("operatorName");
        certificateService.revokeCertificate(id, reason, operatorId, operatorName);
        return Result.success();
    }

    @Operation(summary = "归档证照")
    @PostMapping("/{id}/archive")
    public Result<Void> archiveCertificate(
            @Parameter(description = "证照ID") @PathVariable Long id,
            @RequestBody Map<String, Object> params) {
        Long operatorId = params.get("operatorId") != null ? Long.valueOf(params.get("operatorId").toString()) : null;
        String operatorName = (String) params.get("operatorName");
        certificateService.archiveCertificate(id, operatorId, operatorName);
        return Result.success();
    }

    @Operation(summary = "生成证照二维码")
    @PostMapping("/{id}/qrcode")
    public Result<String> generateQrcode(
            @Parameter(description = "证照ID") @PathVariable Long id,
            @RequestBody Map<String, Object> params) {
        Long userId = params.get("userId") != null ? Long.valueOf(params.get("userId").toString()) : null;
        String qrcode = certificateService.generateQrcode(id, userId);
        return Result.success(qrcode);
    }

    @Operation(summary = "生成授权码")
    @PostMapping("/{id}/auth-code")
    public Result<String> generateAuthCode(
            @Parameter(description = "证照ID") @PathVariable Long id,
            @RequestBody Map<String, Object> params) {
        Long userId = params.get("userId") != null ? Long.valueOf(params.get("userId").toString()) : null;
        String authCode = certificateService.generateAuthCode(id, userId);
        return Result.success(authCode);
    }
}
