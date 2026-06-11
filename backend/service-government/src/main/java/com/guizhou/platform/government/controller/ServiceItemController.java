package com.guizhou.platform.government.controller;

import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.government.dto.response.ServiceItemVO;
import com.guizhou.platform.government.service.ServiceItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "服务事项管理", description = "3000+政务服务事项目录管理、检索、发布")
@RestController
@RequestMapping("/api/service-item")
public class ServiceItemController {

    @Resource
    private ServiceItemService serviceItemService;

    @Operation(summary = "获取服务事项详情")
    @GetMapping("/{id}")
    public Result<ServiceItemVO> getItemDetail(@PathVariable Long id) {
        return Result.success(serviceItemService.getItemDetail(id));
    }

    @Operation(summary = "分页查询服务事项")
    @GetMapping("/page")
    public Result<PageResult<ServiceItemVO>> pageItems(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String itemName,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(required = false) Integer serviceStatus,
            @RequestParam(required = false) String departmentCode,
            @RequestParam(required = false) String keyword) {
        return Result.success(serviceItemService.pageItems(pageNum, pageSize, itemName,
                categoryCode, serviceStatus, departmentCode, keyword));
    }

    @Operation(summary = "搜索服务事项（ES）")
    @GetMapping("/search")
    public Result<List<ServiceItemVO>> searchItems(@RequestParam String keyword) {
        return Result.success(serviceItemService.searchItems(keyword));
    }

    @Operation(summary = "发布服务事项")
    @PostMapping("/{id}/publish")
    public Result<Void> publishItem(@PathVariable Long id) {
        serviceItemService.publishItem(id);
        return Result.success();
    }

    @Operation(summary = "暂停服务事项")
    @PostMapping("/{id}/suspend")
    public Result<Void> suspendItem(@PathVariable Long id) {
        serviceItemService.suspendItem(id);
        return Result.success();
    }

    @Operation(summary = "下架服务事项")
    @PostMapping("/{id}/deprecate")
    public Result<Void> deprecateItem(@PathVariable Long id) {
        serviceItemService.deprecateItem(id);
        return Result.success();
    }

    @Operation(summary = "同步事项至ES")
    @PostMapping("/{id}/sync-es")
    public Result<Void> syncToEs(@PathVariable Long id) {
        serviceItemService.syncToEs(id);
        return Result.success();
    }

    @Operation(summary = "批量同步事项至ES")
    @PostMapping("/batch-sync-es")
    public Result<Void> batchSyncToEs() {
        serviceItemService.batchSyncToEs();
        return Result.success();
    }
}
