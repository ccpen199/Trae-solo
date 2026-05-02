package com.retailpos.engine;

import com.retailpos.dto.MemberDTO;
import com.retailpos.entity.Coupon;
import com.retailpos.entity.Member;
import com.retailpos.entity.MemberCoupon;
import com.retailpos.entity.MemberPrice;
import com.retailpos.mapper.CouponMapper;
import com.retailpos.mapper.MemberCouponMapper;
import com.retailpos.mapper.MemberMapper;
import com.retailpos.mapper.MemberPriceMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class MemberPointsEngine {

    @Autowired
    private MemberMapper memberMapper;
    @Autowired
    private MemberPriceMapper memberPriceMapper;
    @Autowired
    private MemberCouponMapper memberCouponMapper;
    @Autowired
    private CouponMapper couponMapper;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String MEMBER_CACHE_PREFIX = "member:";
    private static final int POINTS_PER_YUAN = 10;
    private static final BigDecimal POINTS_TO_MONEY_RATE = new BigDecimal("0.01");

    public MemberDTO identifyMember(String identifier) {
        MemberDTO result = new MemberDTO();

        Member member = memberMapper.selectOne(
            new LambdaQueryWrapper<Member>()
                .eq(Member::getPhone, identifier)
                .or()
                .eq(Member::getMemberCode, identifier)
                .eq(Member::getStatus, "ACTIVE")
        );

        if (member == null) {
            result.setFound(false);
            result.setMessage("会员未找到");
            return result;
        }

        result.setFound(true);
        result.setId(member.getId());
        result.setMemberCode(member.getMemberCode());
        result.setPhone(member.getPhone());
        result.setName(member.getName());
        result.setLevel(member.getLevel());
        result.setPointsBalance(member.getPointsBalance());
        result.setStoredBalance(member.getStoredBalance());
        result.setMessage("会员识别成功");

        log.info("会员识别成功: memberId={}, name={}", member.getId(), member.getName());
        return result;
    }

    public int calculateEarnedPoints(BigDecimal amount) {
        return amount.multiply(new BigDecimal(POINTS_PER_YUAN)).intValue();
    }

    @Transactional
    public void addPoints(Long memberId, int points) {
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new RuntimeException("会员不存在");
        }

        member.setPointsBalance(member.getPointsBalance() + points);
        memberMapper.updateById(member);

        String cacheKey = MEMBER_CACHE_PREFIX + memberId;
        if (redisTemplate != null) {
            redisTemplate.delete(cacheKey);
        }

        log.info("会员积分增加: memberId={}, addPoints={}, totalPoints={}",
                memberId, points, member.getPointsBalance());
    }

    @Transactional
    public void deductPoints(Long memberId, int points) {
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new RuntimeException("会员不存在");
        }

        if (member.getPointsBalance() < points) {
            throw new RuntimeException("积分不足");
        }

        member.setPointsBalance(member.getPointsBalance() - points);
        memberMapper.updateById(member);

        String cacheKey = MEMBER_CACHE_PREFIX + memberId;
        if (redisTemplate != null) {
            redisTemplate.delete(cacheKey);
        }

        log.info("会员积分扣减: memberId={}, deductPoints={}, remainingPoints={}",
                memberId, points, member.getPointsBalance());
    }

    public BigDecimal calculatePointsDiscount(int points) {
        return new BigDecimal(points).multiply(POINTS_TO_MONEY_RATE);
    }

    @Transactional
    public void useStoredBalance(Long memberId, BigDecimal amount) {
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new RuntimeException("会员不存在");
        }

        if (member.getStoredBalance().compareTo(amount) < 0) {
            throw new RuntimeException("储值余额不足");
        }

        member.setStoredBalance(member.getStoredBalance().subtract(amount));
        memberMapper.updateById(member);

        log.info("储值扣减: memberId={}, amount={}, remainingBalance={}",
                memberId, amount, member.getStoredBalance());
    }

    @Transactional
    public void addStoredBalance(Long memberId, BigDecimal amount) {
        Member member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new RuntimeException("会员不存在");
        }

        member.setStoredBalance(member.getStoredBalance().add(amount));
        memberMapper.updateById(member);

        log.info("储值充值: memberId={}, amount={}, newBalance={}",
                memberId, amount, member.getStoredBalance());
    }

    public List<MemberCoupon> getAvailableCoupons(Long memberId) {
        return memberCouponMapper.selectList(
            new LambdaQueryWrapper<MemberCoupon>()
                .eq(MemberCoupon::getMemberId, memberId)
                .eq(MemberCoupon::getStatus, "UNUSED")
        );
    }

    @Transactional
    public void useCoupon(Long memberId, Long couponId, Long transactionId) {
        MemberCoupon memberCoupon = memberCouponMapper.selectOne(
            new LambdaQueryWrapper<MemberCoupon>()
                .eq(MemberCoupon::getMemberId, memberId)
                .eq(MemberCoupon::getCouponId, couponId)
                .eq(MemberCoupon::getStatus, "UNUSED")
        );

        if (memberCoupon == null) {
            throw new RuntimeException("优惠券不存在或已使用");
        }

        memberCoupon.setStatus("USED");
        memberCoupon.setUsedAt(LocalDateTime.now());
        memberCoupon.setUsedTransactionId(transactionId);
        memberCouponMapper.updateById(memberCoupon);

        Coupon coupon = couponMapper.selectById(couponId);
        if (coupon != null) {
            coupon.setRemainQuantity(coupon.getRemainQuantity() - 1);
            couponMapper.updateById(coupon);
        }

        log.info("优惠券使用: memberId={}, couponId={}, transactionId={}",
                memberId, couponId, transactionId);
    }

    @Transactional
    public void issueCouponToMember(Long memberId, Long couponId) {
        MemberCoupon memberCoupon = new MemberCoupon();
        memberCoupon.setMemberId(memberId);
        memberCoupon.setCouponId(couponId);
        memberCoupon.setStatus("UNUSED");
        memberCoupon.setObtainedAt(LocalDateTime.now());
        memberCouponMapper.insert(memberCoupon);

        log.info("发放优惠券: memberId={}, couponId={}", memberId, couponId);
    }

    public BigDecimal getMemberPrice(Long productId, String memberLevel) {
        MemberPrice memberPrice = memberPriceMapper.selectOne(
            new LambdaQueryWrapper<MemberPrice>()
                .eq(MemberPrice::getProductId, productId)
                .eq(MemberPrice::getMemberLevel, memberLevel)
        );

        return memberPrice != null ? memberPrice.getMemberPrice() : null;
    }
}
