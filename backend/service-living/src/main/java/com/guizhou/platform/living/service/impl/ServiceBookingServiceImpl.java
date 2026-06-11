package com.guizhou.platform.living.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.living.dto.request.BookingCreateDTO;
import com.guizhou.platform.living.dto.response.BookingDetailVO;
import com.guizhou.platform.living.entity.ServiceBooking;
import com.guizhou.platform.living.entity.ServiceEvaluate;
import com.guizhou.platform.living.entity.ServiceProvider;
import com.guizhou.platform.living.entity.ServiceProviderStaff;
import com.guizhou.platform.living.enums.BookingStatusEnum;
import com.guizhou.platform.living.enums.LivingCategoryEnum;
import com.guizhou.platform.living.enums.ProviderStatusEnum;
import com.guizhou.platform.living.mapper.ServiceBookingMapper;
import com.guizhou.platform.living.mapper.ServiceEvaluateMapper;
import com.guizhou.platform.living.mapper.ServiceProviderMapper;
import com.guizhou.platform.living.mapper.ServiceProviderStaffMapper;
import com.guizhou.platform.living.service.ServiceBookingService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ServiceBookingServiceImpl extends ServiceImpl<ServiceBookingMapper, ServiceBooking> implements ServiceBookingService {

    @Resource
    private ServiceProviderMapper providerMapper;

    @Resource
    private ServiceProviderStaffMapper staffMapper;

    @Resource
    private ServiceEvaluateMapper evaluateMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createBooking(BookingCreateDTO dto, Long userId) {
        ServiceProvider provider = providerMapper.selectById(dto.getProviderId());
        if (provider == null) {
            throw new BusinessException("服务商不存在");
        }
        if (!ProviderStatusEnum.ACTIVE.getCode().equals(provider.getProviderStatus())) {
            throw new BusinessException("服务商未在营业中");
        }

        if (dto.getStaffId() != null) {
            ServiceProviderStaff staff = staffMapper.selectById(dto.getStaffId());
            if (staff == null || !staff.getProviderId().equals(dto.getProviderId())) {
                throw new BusinessException("服务人员不属于该服务商");
            }
        }

        LivingCategoryEnum categoryEnum = LivingCategoryEnum.getByCode(dto.getCategoryCode());
        if (categoryEnum == null) {
            throw new BusinessException("无效的服务分类编码");
        }

        ServiceBooking booking = new ServiceBooking();
        BeanUtils.copyProperties(dto, booking);
        booking.setBookingNo("BK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        booking.setUserId(userId);
        booking.setProviderName(provider.getProviderName());
        booking.setCategoryName(categoryEnum.getDesc());
        booking.setBookingStatus(BookingStatusEnum.PENDING_ASSIGN.getCode());
        booking.setActualPrice(BigDecimal.ZERO);
        this.save(booking);

        providerMapper.incrementOrderCount(provider.getId());

        return booking.getBookingNo();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignStaff(Long bookingId, Long staffId, Long assignBy) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (!BookingStatusEnum.PENDING_ASSIGN.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("当前状态不允许派单");
        }

        ServiceProviderStaff staff = staffMapper.selectById(staffId);
        if (staff == null || !staff.getProviderId().equals(booking.getProviderId())) {
            throw new BusinessException("服务人员不属于该服务商");
        }

        booking.setStaffId(staffId);
        booking.setStaffName(staff.getStaffName());
        booking.setAssignBy(assignBy);
        booking.setAssignTime(LocalDateTime.now());
        booking.setBookingStatus(BookingStatusEnum.ASSIGNED.getCode());
        this.updateById(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void confirmService(Long bookingId) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (!BookingStatusEnum.ASSIGNED.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("当前状态不允许确认");
        }

        booking.setConfirmTime(LocalDateTime.now());
        booking.setBookingStatus(BookingStatusEnum.SERVICE_CONFIRMING.getCode());
        this.updateById(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void startService(Long bookingId) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (!BookingStatusEnum.SERVICE_CONFIRMING.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("当前状态不允许开始服务");
        }

        booking.setStartTime(LocalDateTime.now());
        booking.setBookingStatus(BookingStatusEnum.IN_SERVICE.getCode());
        this.updateById(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeService(Long bookingId, BigDecimal actualPrice) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (!BookingStatusEnum.IN_SERVICE.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("当前状态不允许完成服务");
        }

        booking.setEndTime(LocalDateTime.now());
        booking.setActualPrice(actualPrice != null ? actualPrice : booking.getServicePrice());
        booking.setBookingStatus(BookingStatusEnum.COMPLETED.getCode());
        this.updateById(booking);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelBooking(Long bookingId, String reason) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            throw new BusinessException("预约订单不存在");
        }
        if (BookingStatusEnum.IN_SERVICE.getCode().equals(booking.getBookingStatus())
                || BookingStatusEnum.COMPLETED.getCode().equals(booking.getBookingStatus())) {
            throw new BusinessException("当前状态不允许取消");
        }

        booking.setBookingStatus(BookingStatusEnum.CANCELLED.getCode());
        booking.setCancelReason(reason);
        booking.setCancelTime(LocalDateTime.now());
        this.updateById(booking);
    }

    @Override
    public BookingDetailVO getBookingDetail(Long bookingId) {
        ServiceBooking booking = this.getById(bookingId);
        if (booking == null) {
            return null;
        }

        BookingDetailVO vo = new BookingDetailVO();
        BeanUtils.copyProperties(booking, vo);
        BookingStatusEnum statusEnum = BookingStatusEnum.getByCode(booking.getBookingStatus());
        if (statusEnum != null) {
            vo.setBookingStatusDesc(statusEnum.getDesc());
        }

        ServiceEvaluate evaluate = evaluateMapper.selectOne(
                new LambdaQueryWrapper<ServiceEvaluate>()
                        .eq(ServiceEvaluate::getBookingId, bookingId)
                        .last("LIMIT 1"));
        if (evaluate != null) {
            BookingDetailVO.EvaluateInfo evaluateInfo = new BookingDetailVO.EvaluateInfo();
            evaluateInfo.setScore(evaluate.getScore());
            evaluateInfo.setContent(evaluate.getContent());
            evaluateInfo.setImages(evaluate.getImages());
            evaluateInfo.setCreateTime(evaluate.getCreateTime());
            vo.setEvaluate(evaluateInfo);
        }

        return vo;
    }

    @Override
    public List<BookingDetailVO> listBookingsByUser(Long userId) {
        List<ServiceBooking> list = this.list(new LambdaQueryWrapper<ServiceBooking>()
                .eq(ServiceBooking::getUserId, userId)
                .orderByDesc(ServiceBooking::getCreateTime));
        return list.stream().map(booking -> {
            BookingDetailVO vo = new BookingDetailVO();
            BeanUtils.copyProperties(booking, vo);
            BookingStatusEnum statusEnum = BookingStatusEnum.getByCode(booking.getBookingStatus());
            if (statusEnum != null) {
                vo.setBookingStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<BookingDetailVO> listBookingsByProvider(Long providerId) {
        List<ServiceBooking> list = this.list(new LambdaQueryWrapper<ServiceBooking>()
                .eq(ServiceBooking::getProviderId, providerId)
                .orderByDesc(ServiceBooking::getCreateTime));
        return list.stream().map(booking -> {
            BookingDetailVO vo = new BookingDetailVO();
            BeanUtils.copyProperties(booking, vo);
            BookingStatusEnum statusEnum = BookingStatusEnum.getByCode(booking.getBookingStatus());
            if (statusEnum != null) {
                vo.setBookingStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).collect(Collectors.toList());
    }
}
