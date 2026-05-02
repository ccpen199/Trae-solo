package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.AlloRequisition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AlloRequisitionMapper extends BaseMapper<AlloRequisition> {

    @Select("SELECT * FROM allo_requisition WHERE req_no = #{reqNo}")
    AlloRequisition selectByReqNo(@Param("reqNo") String reqNo);

    @Select("SELECT * FROM allo_requisition WHERE req_org_id = #{reqOrgId} ORDER BY create_time DESC")
    List<AlloRequisition> selectByReqOrgId(@Param("reqOrgId") Long reqOrgId);

    @Select("SELECT * FROM allo_requisition WHERE status = #{status} ORDER BY create_time")
    List<AlloRequisition> selectByStatus(@Param("status") String status);

    @Select("SELECT * FROM allo_requisition WHERE req_org_id = #{orgId} OR from_org_id = #{orgId} ORDER BY create_time DESC")
    List<AlloRequisition> selectByOrgId(@Param("orgId") Long orgId);
}
