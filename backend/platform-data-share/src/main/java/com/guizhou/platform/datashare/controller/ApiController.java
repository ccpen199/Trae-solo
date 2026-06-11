package com.guizhou.platform.datashare.controller;

import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.datashare.dto.ApiQueryDTO;
import com.guizhou.platform.datashare.dto.ApiRegisterDTO;
import com.guizhou.platform.datashare.dto.DataRouteDTO;
import com.guizhou.platform.datashare.entity.ApiInfo;
import com.guizhou.platform.datashare.entity.DataDesensitizeRule;
import com.guizhou.platform.datashare.service.ApiService;
import com.guizhou.platform.datashare.service.DataDesensitizeService;
import com.guizhou.platform.datashare.service.RouteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "API管理", description = "API全生命周期管理接口")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    private final ApiService apiService;
    private final RouteService routeService;
    private final DataDesensitizeService desensitizeService;

    @Operation(summary = "注册API")
    @PostMapping("/register")
    public Result<Long> registerApi(@Valid @RequestBody ApiRegisterDTO dto) {
        return Result.success(apiService.registerApi(dto));
    }

    @Operation(summary = "更新API")
    @PutMapping("/update")
    public Result<Void> updateApi(@Valid @RequestBody ApiRegisterDTO dto) {
        apiService.updateApi(dto);
        return Result.success();
    }

    @Operation(summary = "发布API")
    @PostMapping("/publish/{id}")
    public Result<Void> publishApi(@Parameter(description = "API ID") @PathVariable Long id) {
        apiService.publishApi(id);
        return Result.success();
    }

    @Operation(summary = "下线API")
    @PostMapping("/offline/{id}")
    public Result<Void> offlineApi(@Parameter(description = "API ID") @PathVariable Long id) {
        apiService.offlineApi(id);
        return Result.success();
    }

    @Operation(summary = "删除API")
    @DeleteMapping("/{id}")
    public Result<Void> deleteApi(@Parameter(description = "API ID") @PathVariable Long id) {
        apiService.deleteApi(id);
        return Result.success();
    }

    @Operation(summary = "获取API详情")
    @GetMapping("/{id}")
    public Result<ApiInfo> getApiById(@Parameter(description = "API ID") @PathVariable Long id) {
        return Result.success(apiService.getApiById(id));
    }

    @Operation(summary = "根据编码获取API")
    @GetMapping("/code/{apiCode}/{version}")
    public Result<ApiInfo> getApiByCode(
            @Parameter(description = "API编码") @PathVariable String apiCode,
            @Parameter(description = "API版本") @PathVariable String version) {
        return Result.success(apiService.getApiByCode(apiCode, version));
    }

    @Operation(summary = "分页查询API列表")
    @PostMapping("/query")
    public Result<PageResult<ApiInfo>> queryApiList(@RequestBody ApiQueryDTO dto) {
        return Result.success(apiService.queryApiList(dto));
    }

    @Operation(summary = "数据路由调用")
    @PostMapping("/route")
    public Result<Object> route(@RequestBody DataRouteDTO dto) {
        return Result.success(routeService.route(dto));
    }

    @Operation(summary = "测试数据脱敏")
    @PostMapping("/desensitize/test")
    public Result<String> testDesensitize(@RequestBody String value) {
        return Result.success(desensitizeService.autoDetectAndDesensitize(value));
    }

    @Operation(summary = "保存脱敏规则")
    @PostMapping("/desensitize/rule")
    public Result<Void> saveDesensitizeRule(@RequestBody DataDesensitizeRule rule) {
        desensitizeService.saveRule(rule);
        return Result.success();
    }

    @Operation(summary = "删除脱敏规则")
    @DeleteMapping("/desensitize/rule/{id}")
    public Result<Void> deleteDesensitizeRule(@PathVariable Long id) {
        desensitizeService.deleteRule(id);
        return Result.success();
    }

    @Operation(summary = "获取API脱敏规则")
    @GetMapping("/desensitize/rules/{apiId}")
    public Result<List<DataDesensitizeRule>> getDesensitizeRules(@PathVariable Long apiId) {
        return Result.success(desensitizeService.getRulesByApiId(apiId));
    }

    @Operation(summary = "获取全局脱敏规则")
    @GetMapping("/desensitize/rules/global")
    public Result<List<DataDesensitizeRule>> getGlobalDesensitizeRules() {
        return Result.success(desensitizeService.getGlobalRules());
    }
}
