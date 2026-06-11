package com.guizhou.platform.living.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.living.entity.ServiceBooking;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

@Mapper
public interface ServiceBookingMapper extends BaseMapper<ServiceBooking> {

    @Select("SELECT COUNT(*) FROM service_booking WHERE deleted = 0 AND provider_id = #{providerId} AND booking_status = #{status}")
    Long countByProviderAndStatus(@Param("providerId") Long providerId, @Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM service_booking WHERE deleted = 0 AND user_id = #{userId} AND booking_status = #{status}")
    Long countByUserAndStatus(@Param("userId") Long userId, @Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM service_booking WHERE deleted = 0 AND staff_id = #{staffId} AND booking_status IN (1,2,3)")
    Long countActiveByStaff(@Param("staffId") Long staffId);

    @Update("UPDATE service_booking SET booking_status = #{status} WHERE id = #{id} AND deleted = 0")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM service_booking WHERE deleted = 0 AND create_time >= #{startTime}")
    Long countByCreateTime(@Param("startTime") LocalDateTime startTime);
}
