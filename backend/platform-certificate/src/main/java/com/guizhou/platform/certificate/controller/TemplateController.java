package com.guizhou.platform.certificate.controller;

import com.guizhou.platform.certificate.dto.request.TemplateCreateDTO;
import com.guizhou.platform.certificate.entity.CertificateTemplate;
import com.guizhou.platform.certificate.service.TemplateService;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "证照模板管理", description = "证照模板的增删改查接口")
@RestController
@RequestMapping("/api/template")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @Operation(summary = "创建证照模板")
    @PostMapping
    public Result<CertificateTemplate> createTemplate(@Valid @RequestBody TemplateCreateDTO dto) {
        CertificateTemplate template = templateService.createTemplate(dto);
        return Result.success(template);
    }

    @Operation(summary = "获取模板详情")
    @GetMapping("/{id}")
    public Result<CertificateTemplate> getTemplate(
            @Parameter(description = "模板ID") @PathVariable Long id) {
        CertificateTemplate template = templateService.getTemplate(id);
        return Result.success(template);
    }

    @Operation(summary = "根据编码获取模板")
    @GetMapping("/code/{templateCode}")
    public Result<CertificateTemplate> getTemplateByCode(
            @Parameter(description = "模板编码") @PathVariable String templateCode) {
        CertificateTemplate template = templateService.getTemplateByCode(templateCode);
        return Result.success(template);
    }

    @Operation(summary = "获取模板列表")
    @GetMapping("/list")
    public Result<PageResult<CertificateTemplate>> getTemplateList(
            @Parameter(description = "证照类型") @RequestParam(required = false) Integer certificateType,
            @Parameter(description = "状态") @RequestParam(required = false) Integer status,
            @ModelAttribute PageQuery pageQuery) {
        PageResult<CertificateTemplate> result = templateService.getTemplateList(
                certificateType, status, pageQuery);
        return Result.success(result);
    }

    @Operation(summary = "更新模板")
    @PutMapping("/{id}")
    public Result<CertificateTemplate> updateTemplate(
            @Parameter(description = "模板ID") @PathVariable Long id,
            @Valid @RequestBody TemplateCreateDTO dto) {
        CertificateTemplate template = templateService.updateTemplate(id, dto);
        return Result.success(template);
    }

    @Operation(summary = "删除模板")
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(
            @Parameter(description = "模板ID") @PathVariable Long id) {
        templateService.deleteTemplate(id);
        return Result.success();
    }

    @Operation(summary = "启用模板")
    @PostMapping("/{id}/enable")
    public Result<Void> enableTemplate(
            @Parameter(description = "模板ID") @PathVariable Long id) {
        templateService.enableTemplate(id);
        return Result.success();
    }

    @Operation(summary = "禁用模板")
    @PostMapping("/{id}/disable")
    public Result<Void> disableTemplate(
            @Parameter(description = "模板ID") @PathVariable Long id) {
        templateService.disableTemplate(id);
        return Result.success();
    }
}
