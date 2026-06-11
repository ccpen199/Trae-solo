package com.guizhou.platform.certificate.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.certificate.entity.Certificate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CertificateMapper extends BaseMapper<Certificate> {

    @Select("SELECT * FROM certificate WHERE expire_date BETWEEN #{startTime} AND #{endTime} AND status = 1 AND deleted = 0")
    List<Certificate> selectExpiringCertificates(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    @Select("SELECT * FROM certificate WHERE expire_date < #{now} AND status = 1 AND deleted = 0")
    List<Certificate> selectExpiredCertificates(@Param("now") LocalDateTime now);
}
