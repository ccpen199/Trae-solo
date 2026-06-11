package com.guizhou.platform.payment.controller;

import com.guizhou.platform.common.result.Result;
import com.guizhou.platform.payment.dto.request.QueryBillDTO;
import com.guizhou.platform.payment.dto.response.BillInfoVO;
import com.guizhou.platform.payment.entity.UserBindAccount;
import com.guizhou.platform.payment.enums.BillTypeEnum;
import com.guizhou.platform.payment.mapper.UserBindAccountMapper;
import com.guizhou.platform.payment.service.BillQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "账单查询", description = "水电气暖等公共事业账单查询")
@RestController
@RequestMapping("/api/bill")
public class BillQueryController {

    @Resource
    private BillQueryService billQueryService;

    @Resource
    private UserBindAccountMapper userBindAccountMapper;

    @Operation(summary = "查询账单列表")
    @PostMapping("/query")
    public Result<List<BillInfoVO>> queryBills(@Valid @RequestBody QueryBillDTO dto) {
        return Result.success(billQueryService.queryBills(dto));
    }

    @Operation(summary = "查询账单详情")
    @GetMapping("/{billNo}")
    public Result<BillInfoVO> queryBillDetail(@PathVariable String billNo) {
        return Result.success(billQueryService.queryBillDetail(billNo));
    }

    @Operation(summary = "查询用户绑定户号的账单")
    @GetMapping("/user/{userId}")
    public Result<List<BillInfoVO>> queryUserBills(@PathVariable Long userId,
                                                    @RequestParam(required = false) Integer billType) {
        if (billType != null) {
            return Result.success(billQueryService.queryUserBills(userId, billType));
        }
        List<UserBindAccount> accounts = userBindAccountMapper.listByUserId(userId);
        return Result.success(accounts.stream()
                .flatMap(a -> billQueryService.queryUserBills(userId, a.getBillType()).stream())
                .toList());
    }

    @Operation(summary = "获取支持的账单类型")
    @GetMapping("/types")
    public Result<BillTypeEnum[]> getBillTypes() {
        return Result.success(BillTypeEnum.values());
    }

    @Operation(summary = "绑定户号")
    @PostMapping("/bind")
    public Result<Void> bindAccount(@RequestBody UserBindAccount bindAccount) {
        UserBindAccount existing = userBindAccountMapper.getByUserAndAccount(
                bindAccount.getUserId(), bindAccount.getAccountNo(), bindAccount.getBillType());
        if (existing != null) {
            return Result.error("该户号已绑定");
        }
        BillTypeEnum billTypeEnum = BillTypeEnum.getByCode(bindAccount.getBillType());
        if (billTypeEnum != null) {
            bindAccount.setBillTypeName(billTypeEnum.getDesc());
        }
        userBindAccountMapper.insert(bindAccount);
        return Result.success();
    }

    @Operation(summary = "解绑户号")
    @DeleteMapping("/unbind/{id}")
    public Result<Void> unbindAccount(@PathVariable Long id) {
        userBindAccountMapper.deleteById(id);
        return Result.success();
    }

    @Operation(summary = "查询用户绑定的户号")
    @GetMapping("/bind/{userId}")
    public Result<List<UserBindAccount>> listBindAccounts(@PathVariable Long userId,
                                                          @RequestParam(required = false) Integer billType) {
        if (billType != null) {
            return Result.success(userBindAccountMapper.listByUserIdAndType(userId, billType));
        }
        return Result.success(userBindAccountMapper.listByUserId(userId));
    }
}
