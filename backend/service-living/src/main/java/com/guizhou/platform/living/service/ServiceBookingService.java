package com.guizhou.platform.living.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.living.dto.request.BookingCreateDTO;
import com.guizhou.platform.living.dto.response.BookingDetailVO;
import com.guizhou.platform.living.entity.ServiceBooking;

import java.util.List;

public interface ServiceBookingService extends IService<ServiceBooking> {

    String createBooking(BookingCreateDTO dto, Long userId);

    void assignStaff(Long bookingId, Long staffId, Long assignBy);

    void confirmService(Long bookingId);

    void startService(Long bookingId);

    void completeService(Long bookingId, java.math.BigDecimal actualPrice);

    void cancelBooking(Long bookingId, String reason);

    BookingDetailVO getBookingDetail(Long bookingId);

    List<BookingDetailVO> listBookingsByUser(Long userId);

    List<BookingDetailVO> listBookingsByProvider(Long providerId);
}
