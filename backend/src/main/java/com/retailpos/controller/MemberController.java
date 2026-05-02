package com.retailpos.controller;

import com.retailpos.dto.MemberDTO;
import com.retailpos.engine.MemberPointsEngine;
import com.retailpos.entity.Member;
import com.retailpos.entity.MemberCoupon;
import com.retailpos.entity.Transaction;
import com.retailpos.mapper.MemberMapper;
import com.retailpos.mapper.TransactionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberPointsEngine memberPointsEngine;
    private final MemberMapper memberMapper;
    private final TransactionMapper transactionMapper;

    @GetMapping("/identify")
    public Result<MemberDTO> identifyMember(@RequestParam String identifier) {
        MemberDTO result = memberPointsEngine.identifyMember(identifier);
        if (result.isFound()) {
            return Result.success(result);
        } else {
            return Result.fail(result.getMessage());
        }
    }

    @GetMapping("/{id}/points")
    public Result<Map<String, Object>> getPoints(@PathVariable Long id) {
        Member member = memberMapper.selectById(id);
        if (member == null) {
            return Result.fail("会员不存在");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("memberId", member.getId());
        data.put("pointsBalance", member.getPointsBalance());
        data.put("level", member.getLevel());

        return Result.success(data);
    }

    @GetMapping("/{id}/balance")
    public Result<Map<String, Object>> getBalance(@PathVariable Long id) {
        Member member = memberMapper.selectById(id);
        if (member == null) {
            return Result.fail("会员不存在");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("memberId", member.getId());
        data.put("storedBalance", member.getStoredBalance());

        return Result.success(data);
    }

    @GetMapping("/{id}/coupons")
    public Result<List<MemberCoupon>> getCoupons(@PathVariable Long id) {
        List<MemberCoupon> coupons = memberPointsEngine.getAvailableCoupons(id);
        return Result.success(coupons);
    }

    @GetMapping("/{id}/transactions")
    public Result<List<Transaction>> getTransactions(@PathVariable Long id) {
        List<Transaction> transactions = transactionMapper.selectList(
            new LambdaQueryWrapper<Transaction>()
                .eq(Transaction::getMemberId, id)
                .orderByDesc(Transaction::getTransactionTime)
                .last("LIMIT 50")
        );
        return Result.success(transactions);
    }

    @PostMapping("/points/redeem")
    public Result<Map<String, Object>> redeemPoints(@RequestBody Map<String, Object> params) {
        Long memberId = Long.valueOf(params.get("memberId").toString());
        Integer points = Integer.valueOf(params.get("points").toString());

        memberPointsEngine.deductPoints(memberId, points);

        Map<String, Object> result = new HashMap<>();
        result.put("redeemedPoints", points);
        result.put("discount", memberPointsEngine.calculatePointsDiscount(points));

        return Result.success(result);
    }
}
