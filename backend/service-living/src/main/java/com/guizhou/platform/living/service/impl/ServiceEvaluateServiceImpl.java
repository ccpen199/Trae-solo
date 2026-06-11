package com.guizhou.platform.living.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.living.dto.request.EvaluateCreateDTO;
import com.guizhou.platform.living.dto.response.EvaluateVO;
import com.guizhou.platform.living.entity.ServiceBooking;
import com.guizhou.platform.living.entity.ServiceEvaluate;
import com.guizhou.platform.living.entity.ServiceProvider;
import com.guizhou.platform.living.entity.ServiceProviderStaff;
import com.guizhou.platform.living.enums.BookingStatusEnum;
import com.guizhou.platform.living.mapper.ServiceBookingMapper;
import com.guizhou.platform.living.mapper.ServiceEvaluateMapper;
import com.guizhou.platform.living.mapper.ServiceProviderMapper;
import com.guizhou.platform.living.mapper.ServiceProviderStaffMapper;
import com.guizhou.platform.living.service.ServiceEvaluateService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ServiceEvaluateServiceImpl extends ServiceImpl<ServiceEvaluateMapper, ServiceEvaluate> implements ServiceEvaluateService {

    @Resource
    private ServiceBookingMapper bookingMapper;

    @Resource
    private ServiceProviderMapper providerMapper;

    @Resource
    private ServiceProviderStaffMapper staffMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long submitEvaluate(EvaluateCreateDTO dto, Long userId) {
        ServiceBooking booking = bookingMapper.selectById(dto.getBookingId());
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (!BookingStatusEnum.COMPLETED.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("订单未完成，无法评价");
        }

        long exists = this.count(new LambdaQueryWrapper<ServiceEvaluate>()
                .eq(ServiceEvaluate::getBookingId, dto.getBookingId())
                .eq(ServiceEvaluate::getUserId, userId));
        if (exists > 0) {
            throw new BusinessException("已评价过该订单");
        }

        ServiceEvaluate evaluate = new ServiceEvaluate();
        BeanUtils.copyProperties(dto, evaluate);
        evaluate.setBookingNo(booking.getBookingNo());
        evaluate.setProviderId(booking.getProviderId());
        evaluate.setStaffId(booking.getStaffId());
        evaluate.setStaffName(booking.getStaffName());
        evaluate.setUserId(userId);
        evaluate.setUserName(booking.getUserName());
        if (evaluate.getAnonymous() == null) {
            evaluate.setAnonymous(false);
        }
        this.save(evaluate);

        updateProviderScore(booking.getProviderId());

        if (booking.getStaffId() != null) {
            updateStaffScore(booking.getStaffId());
        }

        return evaluate.getId();
    }

    @Override
    public EvaluateVO getEvaluateDetail(Long evaluateId) {
        ServiceEvaluate evaluate = this.getById(evaluateId);
        if (evaluate == null) {
            return null;
        }
        EvaluateVO vo = new EvaluateVO();
        BeanUtils.copyProperties(evaluate, vo);
        if (Boolean.TRUE.equals(evaluate.getAnonymous())) {
            vo.setUserName("***");
        }
        return vo;
    }

    @Override
    public List<EvaluateVO> listEvaluatesByProvider(Long providerId) {
        List<ServiceEvaluate> list = this.list(new LambdaQueryWrapper<ServiceEvaluate>()
                .eq(ServiceEvaluate::getProviderId, providerId)
                .orderByDesc(ServiceEvaluate::getCreateTime));
        return list.stream().map(evaluate -> {
            EvaluateVO vo = new EvaluateVO();
            BeanUtils.copyProperties(evaluate, vo);
            if (Boolean.TRUE.equals(evaluate.getAnonymous())) {
                vo.setUserName("***");
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<EvaluateVO> listEvaluatesByStaff(Long staffId) {
        List<ServiceEvaluate> list = this.list(new LambdaQueryWrapper<ServiceEvaluate>()
                .eq(ServiceEvaluate::getStaffId, staffId)
                .orderByDesc(ServiceEvaluate::getCreateTime));
        return list.stream().map(evaluate -> {
            EvaluateVO vo = new EvaluateVO();
            BeanUtils.copyProperties(evaluate, vo);
            if (Boolean.TRUE.equals(evaluate.getAnonymous())) {
                vo.setUserName("***");
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<EvaluateVO> listEvaluatesByBooking(Long bookingId) {
        List<ServiceEvaluate> list = this.list(new LambdaQueryWrapper<ServiceEvaluate>()
                .eq(ServiceEvaluate::getBookingId, bookingId)
                .orderByDesc(ServiceEvaluate::getCreateTime));
        return list.stream().map(evaluate -> {
            EvaluateVO vo = new EvaluateVO();
            BeanUtils.copyProperties(evaluate, vo);
            if (Boolean.TRUE.equals(evaluate.getAnonymous())) {
                vo.setUserName("***");
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void replyEvaluate(Long evaluateId, String replyContent, Long replyBy) {
        ServiceEvaluate evaluate = this.getById(evaluateId);
        if (evaluate == null) {
            throw new BusinessException("评价不存在");
        }
        if (evaluate.getReplyContent() != null) {
            throw new BusinessException("已回复过该评价");
        }
        evaluate.setReplyContent(replyContent);
        evaluate.setReplyBy(replyBy);
        evaluate.setReplyTime(LocalDateTime.now());
        this.updateById(evaluate);
    }

    private void updateProviderScore(Long providerId) {
        BigDecimal avgScore = getBaseMapper().avgScoreByProvider(providerId);
        Long totalEvaluates = getBaseMapper().countByProvider(providerId);
        if (avgScore == null) {
            avgScore = BigDecimal.ZERO;
        }
        providerMapper.updateScore(providerId, avgScore.setScale(1, RoundingMode.HALF_UP), totalEvaluates.intValue());
    }

    private void updateStaffScore(Long staffId) {
        BigDecimal avgScore = getBaseMapper().avgScoreByStaff(staffId);
        if (avgScore == null) {
            avgScore = BigDecimal.ZERO;
        }
        staffMapper.updateScoreAndIncrementOrders(staffId, avgScore.setScale(1, RoundingMode.HALF_UP));
    }
}
