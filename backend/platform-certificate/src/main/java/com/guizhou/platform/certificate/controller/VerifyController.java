package com.guizhou.platform.certificate.controller;

import com.guizhou.platform.certificate.dto.request.CertificateVerifyDTO;
import com.guizhou.platform.certificate.dto.response.VerifyResultVO;
import com.guizhou.platform.certificate.service.VerifyService;
import com.guizhou.platform.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "第三方核验接口", description = "提供给第三方机构的证照核验接口")
@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerifyController {

    private final VerifyService verifyService;

    @Operation(summary = "核验电子证照")
    @PostMapping
    public Result<VerifyResultVO> verifyCertificate(@Valid @RequestBody CertificateVerifyDTO dto) {
        VerifyResultVO result = verifyService.verify(dto);
        return Result.success(result);
    }

    @Operation(summary = "二维码核验")
    @PostMapping("/qrcode")
    public Result<VerifyResultVO> verifyByQrcode(@RequestBody CertificateVerifyDTO dto) {
        dto.setVerifyType(1);
        VerifyResultVO result = verifyService.verify(dto);
        return Result.success(result);
    }

    @Operation(summary = "OCR核验")
    @PostMapping("/ocr")
    public Result<VerifyResultVO> verifyByOcr(@RequestBody CertificateVerifyDTO dto) {
        dto.setVerifyType(2);
        VerifyResultVO result = verifyService.verify(dto);
        return Result.success(result);
    }

    @Operation(summary = "授权码核验")
    @PostMapping("/auth-code")
    public Result<VerifyResultVO> verifyByAuthCode(@RequestBody CertificateVerifyDTO dto) {
        dto.setVerifyType(3);
        VerifyResultVO result = verifyService.verify(dto);
        return Result.success(result);
    }

    @Operation(summary = "人脸识别核验")
    @PostMapping("/face")
    public Result<VerifyResultVO> verifyByFace(@RequestBody CertificateVerifyDTO dto) {
        dto.setVerifyType(4);
        VerifyResultVO result = verifyService.verify(dto);
        return Result.success(result);
    }
}
