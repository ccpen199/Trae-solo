package com.guizhou.platform.subsidy.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidy.entity.FundFlow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface FundFlowMapper extends BaseMapper<FundFlow> {

    @Select("SELECT * FROM fund_flow WHERE deleted = 0 AND trace_id = #{traceId} ORDER BY trace_depth, create_time")
    List<FundFlow> findByTraceId(@Param("traceId") String traceId);

    @Select("SELECT * FROM fund_flow WHERE deleted = 0 AND grant_id = #{grantId} ORDER BY create_time")
    List<FundFlow> findByGrantId(@Param("grantId") Long grantId);

    @Select("SELECT * FROM fund_flow WHERE deleted = 0 AND parent_flow_no = #{parentFlowNo} ORDER BY create_time")
    List<FundFlow> findByParentFlowNo(@Param("parentFlowNo") String parentFlowNo);

    @Select("SELECT * FROM fund_flow WHERE deleted = 0 AND on_chain = 0 ORDER BY create_time LIMIT #{limit}")
    List<FundFlow> findPendingOnChain(@Param("limit") Integer limit);

    @Select("SELECT COUNT(*) FROM fund_flow WHERE deleted = 0 AND to_account = #{account} AND flow_type = 3 AND create_time >= #{startTime}")
    Long countGrantsToAccount(@Param("account") String account, @Param("startTime") java.time.LocalDateTime startTime);
}
