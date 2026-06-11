package com.guizhou.platform.ticket.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.ticket.dto.request.HotlineMessageDTO;
import com.guizhou.platform.ticket.entity.HotlineMessage;
import com.guizhou.platform.ticket.service.HotlineAdapterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "12345热线对接", description = "12345热线消息接收、同步、转工单")
@RestController
@RequestMapping("/api/hotline")
public class HotlineController {

    @Resource
    private HotlineAdapterService hotlineAdapterService;

    @Operation(summary = "接收热线消息")
    @PostMapping("/receive")
    public Result<String> receiveMessage(@Valid @RequestBody HotlineMessageDTO dto) {
        return Result.success(hotlineAdapterService.receiveHotlineMessage(dto));
    }

    @Operation(summary = "获取待处理热线消息")
    @GetMapping("/pending")
    public Result<List<HotlineMessage>> listPendingMessages() {
        return Result.success(hotlineAdapterService.listPendingMessages());
    }

    @Operation(summary = "手动同步热线消息")
    @PostMapping("/sync")
    public Result<Void> syncMessages() {
        hotlineAdapterService.syncHotlineMessages();
        return Result.success();
    }

    @Operation(summary = "热线消息转工单")
    @PostMapping("/{messageId}/create-ticket")
    public Result<String> createTicketFromHotline(@PathVariable Long messageId) {
        return Result.success(hotlineAdapterService.createTicketFromHotline(messageId));
    }
}
