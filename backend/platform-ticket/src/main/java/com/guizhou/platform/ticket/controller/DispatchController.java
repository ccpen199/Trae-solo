package com.guizhou.platform.ticket.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.ticket.dto.response.DispatchResultVO;
import com.guizhou.platform.ticket.service.DispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

@Tag(name = "智能分拨", description = "工单智能分拨引擎，基于NLP+规则+历史数据推荐处理部门")
@RestController
@RequestMapping("/api/dispatch")
public class DispatchController {

    @Resource
    private DispatchService dispatchService;

    @Operation(summary = "自动分拨工单")
    @PostMapping("/auto/{ticketId}")
    public Result<DispatchResultVO> autoDispatch(@PathVariable Long ticketId) {
        return Result.success(dispatchService.autoDispatch(ticketId));
    }

    @Operation(summary = "人工分拨工单")
    @PostMapping("/manual/{ticketId}")
    public Result<DispatchResultVO> manualDispatch(@PathVariable Long ticketId,
                                                    @RequestParam Long departmentId,
                                                    @RequestParam String reason) {
        return Result.success(dispatchService.manualDispatch(ticketId, departmentId, reason));
    }

    @Operation(summary = "计算部门匹配分数")
    @GetMapping("/score")
    public Result<Double> calculateMatchScore(@RequestParam String nlpCategory,
                                               @RequestParam String nlpKeywords,
                                               @RequestParam Long departmentId) {
        return Result.success(dispatchService.calculateMatchScore(nlpCategory, nlpKeywords, departmentId));
    }
}
