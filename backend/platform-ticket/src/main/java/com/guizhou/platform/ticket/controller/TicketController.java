package com.guizhou.platform.ticket.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.ticket.dto.request.TicketAssignDTO;
import com.guizhou.platform.ticket.dto.request.TicketCreateDTO;
import com.guizhou.platform.ticket.dto.request.TicketProcessDTO;
import com.guizhou.platform.ticket.dto.response.TicketDetailVO;
import com.guizhou.platform.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "工单管理", description = "工单受理、查询、跟踪、处理")
@RestController
@RequestMapping("/api/ticket")
public class TicketController {

    @Resource
    private TicketService ticketService;

    @Operation(summary = "创建工单")
    @PostMapping("/create")
    public Result<String> createTicket(@Valid @RequestBody TicketCreateDTO dto) {
        return Result.success(ticketService.createTicket(dto));
    }

    @Operation(summary = "分派工单")
    @PostMapping("/assign")
    public Result<Void> assignTicket(@Valid @RequestBody TicketAssignDTO dto) {
        ticketService.assignTicket(dto);
        return Result.success();
    }

    @Operation(summary = "处理工单")
    @PostMapping("/process")
    public Result<Void> processTicket(@Valid @RequestBody TicketProcessDTO dto) {
        ticketService.processTicket(dto);
        return Result.success();
    }

    @Operation(summary = "确认工单")
    @PostMapping("/{id}/confirm")
    public Result<Void> confirmTicket(@PathVariable Long id,
                                      @RequestParam Integer satisfaction,
                                      @RequestParam(required = false) String satisfactionContent) {
        ticketService.confirmTicket(id, satisfaction, satisfactionContent);
        return Result.success();
    }

    @Operation(summary = "关闭工单")
    @PostMapping("/{id}/close")
    public Result<Void> closeTicket(@PathVariable Long id) {
        ticketService.closeTicket(id);
        return Result.success();
    }

    @Operation(summary = "获取工单详情")
    @GetMapping("/{id}")
    public Result<TicketDetailVO> getTicketDetail(@PathVariable Long id) {
        return Result.success(ticketService.getTicketDetail(id));
    }

    @Operation(summary = "分页查询工单列表")
    @GetMapping("/page")
    public Result<Page<TicketDetailVO>> pageTickets(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer category,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) Integer source,
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String keyword) {
        return Result.success(ticketService.pageTickets(pageNum, pageSize, status, category, priority, source, regionCode, keyword));
    }
}
