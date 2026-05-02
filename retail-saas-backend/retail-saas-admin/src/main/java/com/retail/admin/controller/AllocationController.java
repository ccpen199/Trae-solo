package com.retail.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.retail.common.result.Result;
import com.retail.domain.entity.AlloRequisition;
import com.retail.mapper.AlloRequisitionMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.List;

@Api(tags = "调拨管理接口")
@RestController
@RequestMapping("/allocation")
public class AllocationController {

    @Resource
    private AlloRequisitionMapper alloRequisitionMapper;

    @ApiOperation("分页查询调拨申请")
    @GetMapping("/page")
    public Result<Page<AlloRequisition>> getRequisitionPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String reqNo,
            @RequestParam(required = false) Long reqOrgId,
            @RequestParam(required = false) String status) {
        Page<AlloRequisition> page = new Page<>(current, size);
        LambdaQueryWrapper<AlloRequisition> wrapper = new LambdaQueryWrapper<AlloRequisition>()
                .eq(AlloRequisition::getDeleted, 0)
                .like(StringUtils.hasText(reqNo), AlloRequisition::getReqNo, reqNo)
                .eq(reqOrgId != null, AlloRequisition::getReqOrgId, reqOrgId)
                .eq(StringUtils.hasText(status), AlloRequisition::getStatus, status)
                .orderByDesc(AlloRequisition::getCreateTime);
        Page<AlloRequisition> result = alloRequisitionMapper.selectPage(page, wrapper);
        return Result.success(result);
    }

    @ApiOperation("根据ID获取调拨申请")
    @GetMapping("/{id}")
    public Result<AlloRequisition> getRequisitionById(@PathVariable Long id) {
        AlloRequisition requisition = alloRequisitionMapper.selectById(id);
        return Result.success(requisition);
    }

    @ApiOperation("创建调拨申请")
    @PostMapping
    public Result<AlloRequisition> createRequisition(@RequestBody AlloRequisition requisition) {
        requisition.setReqNo(generateReqNo());
        requisition.setStatus("DRAFT");
        alloRequisitionMapper.insert(requisition);
        return Result.success(requisition);
    }

    @ApiOperation("提交调拨申请")
    @PostMapping("/submit/{id}")
    public Result<AlloRequisition> submitRequisition(@PathVariable Long id) {
        AlloRequisition requisition = alloRequisitionMapper.selectById(id);
        if (requisition == null) {
            return Result.error("调拨申请不存在");
        }
        if (!"DRAFT".equals(requisition.getStatus())) {
            return Result.error("只有草稿状态可以提交");
        }
        requisition.setStatus("PENDING");
        alloRequisitionMapper.updateById(requisition);
        return Result.success(requisition);
    }

    @ApiOperation("审核调拨申请")
    @PostMapping("/audit/{id}")
    public Result<AlloRequisition> auditRequisition(
            @PathVariable Long id,
            @RequestParam Boolean pass,
            @RequestParam(required = false) String comment) {
        AlloRequisition requisition = alloRequisitionMapper.selectById(id);
        if (requisition == null) {
            return Result.error("调拨申请不存在");
        }
        if (!"PENDING".equals(requisition.getStatus())) {
            return Result.error("只有待审核状态可以审核");
        }
        requisition.setStatus(pass ? "AUDIT_PASS" : "AUDIT_REJECT");
        requisition.setAuditComment(comment);
        requisition.setAuditTime(LocalDateTime.now());
        alloRequisitionMapper.updateById(requisition);
        return Result.success(requisition);
    }

    @ApiOperation("取消调拨申请")
    @PostMapping("/cancel/{id}")
    public Result<AlloRequisition> cancelRequisition(@PathVariable Long id) {
        AlloRequisition requisition = alloRequisitionMapper.selectById(id);
        if (requisition == null) {
            return Result.error("调拨申请不存在");
        }
        if (!"DRAFT".equals(requisition.getStatus()) && !"PENDING".equals(requisition.getStatus())) {
            return Result.error("当前状态不能取消");
        }
        requisition.setStatus("CANCELLED");
        alloRequisitionMapper.updateById(requisition);
        return Result.success(requisition);
    }

    @ApiOperation("查询某门店的调拨申请")
    @GetMapping("/org/{orgId}")
    public Result<List<AlloRequisition>> getRequisitionByOrgId(@PathVariable Long orgId) {
        List<AlloRequisition> list = alloRequisitionMapper.selectByOrgId(orgId);
        return Result.success(list);
    }

    private String generateReqNo() {
        return "ALLO" + System.currentTimeMillis();
    }
}
