package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.TicketDispatch;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface TicketDispatchMapper extends BaseMapper<TicketDispatch> {

    @Select("SELECT to_department_id, to_department_name, COUNT(*) as cnt " +
            "FROM ticket_dispatch WHERE deleted = 0 AND ticket_id = #{ticketId} " +
            "ORDER BY dispatch_time DESC")
    List<TicketDispatch> listByTicketId(@Param("ticketId") Long ticketId);

    @Select("SELECT to_department_id, COUNT(*) as cnt FROM ticket_dispatch " +
            "WHERE deleted = 0 AND nlp_category = #{category} " +
            "GROUP BY to_department_id ORDER BY cnt DESC LIMIT #{limit}")
    List<Map<String, Object>> findTopDepartmentsByCategory(@Param("category") String category, @Param("limit") Integer limit);
}
