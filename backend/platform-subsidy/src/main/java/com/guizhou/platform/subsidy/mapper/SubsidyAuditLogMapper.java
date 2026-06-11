package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.SubsidyAuditLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SubsidyAuditLogMapper extends BaseMapper<SubsidyAuditLog> {

    @Select("SELECT * FROM subsidy_audit_log WHERE deleted = 0 AND business_type = #{businessType} AND business_id = #{businessId} ORDER BY create_time DESC")
    List<SubsidyAuditLog> findByBusiness(@Param("businessType") String businessType, @Param("businessId") Long businessId);

    @Select("SELECT * FROM subsidy_audit_log WHERE deleted = 0 AND operator_id = #{operatorId} ORDER BY create_time DESC LIMIT 100")
    List<SubsidyAuditLog> findByOperator(@Param("operatorId") Long operatorId);
}
