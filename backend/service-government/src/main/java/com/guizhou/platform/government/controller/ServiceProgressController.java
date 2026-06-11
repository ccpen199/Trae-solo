package com.guizhou.platform.government.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.government.dto.response.ApplyProgressVO;
import com.guizhou.platform.government.service.ServiceProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "办件进度查询", description = "政务服务办件进度追踪、进度通知")
@RestController
@RequestMapping("/api/progress")
public class ServiceProgressController {

    @Resource
    private ServiceProgressService serviceProgressService;

    @Operation(summary = "根据申办ID查询进度")
    @GetMapping("/apply/{applyId}")
    public Result<ApplyProgressVO> getProgressByApplyId(@PathVariable Long applyId) {
        return Result.success(serviceProgressService.getApplyProgress(applyId));
    }

    @Operation(summary = "根据申办编号查询进度")
    @GetMapping("/apply-no/{applyNo}")
    public Result<ApplyProgressVO> getProgressByApplyNo(@PathVariable String applyNo) {
        return Result.success(serviceProgressService.getApplyProgressByApplyNo(applyNo));
    }

    @Operation(summary = "查询我的办件进度")
    @GetMapping("/my")
    public Result<List<ApplyProgressVO>> getMyProgress(@RequestParam String applicantIdCard) {
        return Result.success(serviceProgressService.getMyProgress(applicantIdCard));
    }

    @Operation(summary = "手动发送进度通知")
    @PostMapping("/notify/{applyId}")
    public Result<Void> sendNotification(@PathVariable Long applyId) {
        serviceProgressService.sendProgressNotification(applyId);
        return Result.success();
    }
}
